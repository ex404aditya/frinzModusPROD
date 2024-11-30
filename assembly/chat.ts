import { auth, http, postgresql } from "@hypermode/modus-sdk-as";
import { JSON } from "json-as";
import { Content } from "@hypermode/modus-sdk-as/assembly/http";
import { Thread, Message, ClerkClaims } from "./models";
import { bytesToUUID } from "./utils";
import {
  OpenAIChatInput,
  OpenAIMessage,
  OpenAIResponse,
  TitleResponse,
} from "./models";
import { extractYouTubeAudio, convertAudioToText } from "./youtube-utils";
import { generateResourceRecommendations } from "./resource-generator";

// Database name
const dbName = "db";

// Utility function to execute a query and return the rows
const executeQuery = (query: string, params: postgresql.Params) => {
  const response = postgresql.query(dbName, query, params);
  return response.rows;
};

// Function to get the current authenticated user's ID
export function getCurrentUserId(): string {
  const claims = auth.getJWTClaims<ClerkClaims>();
  if (!claims || !claims.sub) {
    throw new Error("User not authenticated");
  }
  return claims.sub;
}

// Function to process YouTube link and extract text
export function processYouTubeLink(youtubeUrl: string): string {
  const transcriptionResult = extractYouTubeAudio(youtubeUrl); // Assuming this returns an object
  return convertAudioToText(transcriptionResult); // Ensure this returns a string
}

// Function to create a new thread with YouTube content
export function createThreadFromYouTubeLink(youtubeUrl: string): Thread {
  const userId = getCurrentUserId();
  const extractedText = processYouTubeLink(youtubeUrl);

  // Generate title using OpenAI API
  const titlePrompt = `Based on this extracted content, generate a short, concise title (max 5 words): "${extractedText.substring(0, 200)}"`;

  const request = new http.Request(
    "https://api.openai.com/v1/chat/completions",
  );
  request.headers.append("Content-Type", "application/json");

  const body = new OpenAIChatInput();
  body.messages = [
    { role: "system", content: titlePrompt },
    { role: "user", content: extractedText },
  ];

  const options = new http.RequestOptions();
  options.method = "POST";
  options.body = Content.from(JSON.stringify(body));

  const response = http.fetch(request, options);
  if (response.status !== 200) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`,
    );
  }

  const responseJson = JSON.parse<OpenAIResponse>(response.text());
  const title = JSON.parse<TitleResponse>(
    responseJson.choices[0].message.content,
  ).title;

  // Create thread in the database
  const now = Date.now();
  const threadQuery = `
    INSERT INTO threads (title, clerk_user_id, created_at, last_message_at, initial_content)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const threadParams = new postgresql.Params();
  threadParams.push(title);
  threadParams.push(userId);
  threadParams.push(now);
  threadParams.push(now);

  const threadRows = executeQuery(threadQuery, threadParams); // Now threadRows will be of type Thread[]
  const thread = threadRows[0]; // Access the first row and assert it as type `Thread`
  thread.id = bytesToUUID(thread.id);

  console.log(`Thread created: ${thread.id}`);

  return thread;
}

// Function to get a reply from LLM
export function getReply(threadId: string, userMessage: string): Message {
  const now = Date.now();
  const userMessageQuery = `
    INSERT INTO messages (thread_id, role, content, created_at)
    VALUES ($1, $2, $3, $4)
  `;
  const userMessageParams = new postgresql.Params();
  userMessageParams.push(threadId);
  userMessageParams.push("user");
  userMessageParams.push(userMessage);
  userMessageParams.push(now);
  postgresql.query<Message>(dbName, userMessageQuery, userMessageParams);

  // Get thread history and initial content for context
  const thread = getThreadById(threadId); // Thread type is inferred here
  const messages = getThreadMessages(threadId);

  // Prepare OpenAI request
  const request = new http.Request(
    "https://api.openai.com/v1/chat/completions",
  );
  request.headers.append("Content-Type", "application/json");

  const body = new OpenAIChatInput();
  body.messages = [
    {
      role: "system",
      content: `Context: ${thread.initial_content || ""}. Provide helpful and contextual responses.`,
    },
    ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: "user", content: userMessage },
  ];

  const options = new http.RequestOptions();
  options.method = "POST";
  options.body = Content.from(JSON.stringify(body));

  const response = http.fetch(request, options);
  if (response.status !== 200) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`,
    );
  }

  const responseJson = JSON.parse<OpenAIResponse>(response.text());
  const content = responseJson.choices[0].message.content;

  // Check if user wants resources
  const sources =
    userMessage.toLowerCase().includes("source") ||
    userMessage.toLowerCase().includes("resources")
      ? generateResourceRecommendations(userMessage)
      : [];

  // Save bot reply with sources
  const botMessageQuery = `
    INSERT INTO messages (thread_id, role, content, created_at, sources)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const botMessageParams = new postgresql.Params();
  botMessageParams.push(threadId);
  botMessageParams.push("assistant");
  botMessageParams.push(content);
  botMessageParams.push(now);
  botMessageParams.push(sources);

  const botMessageResponse = postgresql.query<Message>(
    dbName,
    botMessageQuery,
    botMessageParams,
  );
  const botMessage = botMessageResponse.rows[0];
  botMessage.id = bytesToUUID(botMessage.id);
  botMessage.thread_id = bytesToUUID(botMessage.thread_id);

  // Update thread's last_message_at
  const updateThreadQuery = `UPDATE threads SET last_message_at = $1 WHERE id = $2`;
  const updateThreadParams = new postgresql.Params();
  updateThreadParams.push(now);
  updateThreadParams.push(threadId);
  executeQuery(updateThreadQuery, updateThreadParams);

  return botMessage;
}

// Function to get all threads for the current user
export function getAllThreads(): Thread[] {
  const userId = getCurrentUserId();

  const query = `
    SELECT * FROM threads 
    WHERE clerk_user_id = $1 
    ORDER BY last_message_at DESC
  `;

  const params = new postgresql.Params();
  params.push(userId);

  const response = postgresql.query<Thread>(dbName, query, params);
  const threads: Thread[] = [];
  for (let i = 0; i < response.rows.length; i++) {
    const thread = response.rows[i];
    thread.id = bytesToUUID(thread.id);
    threads.push(thread);
  }
  return threads;
}

// Function to get a specific thread by ID
export function getThreadById(threadId: string): Thread {
  const userId = getCurrentUserId();

  const query = `
    SELECT * FROM threads 
    WHERE id = $1 AND clerk_user_id = $2
  `;

  const params = new postgresql.Params();
  params.push(threadId);
  params.push(userId);

  const response = postgresql.query<Thread>(dbName, query, params);
  if (response.rows.length === 0) {
    throw new Error("Thread not found or access denied");
  }
  const thread = response.rows[0]; // Explicitly casting the result to `Thread`
  thread.id = bytesToUUID(thread.id);
  return thread;
}
// Function to delete a thread
export function deleteThread(threadId: string): void {
  const userId = getCurrentUserId();

  // First verify ownership
  getThreadById(threadId);

  // Delete messages first (due to foreign key constraint)
  const deleteMessagesQuery = `
      DELETE FROM messages WHERE thread_id = $1
    `;

  const messageParams = new postgresql.Params();
  messageParams.push(threadId);
  postgresql.query<Message>(dbName, deleteMessagesQuery, messageParams);

  // Then delete thread
  const deleteThreadQuery = `
      DELETE FROM threads WHERE id = $1 AND clerk_user_id = $2
    `;

  const threadParams = new postgresql.Params();
  threadParams.push(threadId);
  threadParams.push(userId);
  postgresql.query<Thread>(dbName, deleteThreadQuery, threadParams);
}

// Function to get messages for a thread
export function getThreadMessages(threadId: string): Message[] {
  // Verify thread ownership
  getThreadById(threadId);

  const query = `
      SELECT * FROM messages 
      WHERE thread_id = $1 
      ORDER BY created_at ASC
    `;

  const params = new postgresql.Params();
  params.push(threadId);

  const response = postgresql.query<Message>(dbName, query, params);
  const messages: Message[] = [];
  for (let i = 0; i < response.rows.length; i++) {
    const msg = response.rows[i];
    msg.id = bytesToUUID(msg.id);
    msg.thread_id = bytesToUUID(msg.thread_id);
    messages.push(msg);
  }
  return messages;
}
