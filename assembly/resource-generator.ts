// import { http } from "@hypermode/modus-sdk-as";
// import { JSON } from "json-as";
// import { OpenAIChatInput, OpenAIMessage, OpenAIResponse } from "./models";

// // Define a structure for resource
// export interface ResourceItem {
//   title: string;
//   url: string;
//   description: string;
//   relevanceScore: f64;
// }

// export interface ResourceSearchParams {
//   query: string;
//   type?: string[]; // e.g., ["book", "article", "video", "course"]
//   difficulty?: string; // "beginner", "intermediate", "advanced"
// }

// export function searchResources(
//   searchParams: ResourceSearchParams,
// ): ResourceItem[] {
//   // Prepare OpenAI request to generate resources
//   const request = new http.Request(
//     "https://api.openai.com/v1/chat/completions",
//   );
//   request.headers.append("Content-Type", "application/json");

//   const body = new OpenAIChatInput();

//   // System prompt to guide resource generation
//   const systemMsg = new OpenAIMessage();
//   systemMsg.role = "system";
//   systemMsg.content = `You are an expert resource curator. Generate a list of high-quality, relevant resources based on the user's query.

// Guidelines:
// - Provide a diverse set of resources (mix of types)
// - Include academic, professional, and learning resources
// - Prioritize recent, authoritative sources
// - Format response as strict JSON:
// {
//   "resources": [
//     {
//       "title": "Resource Title",
//       "url": "full URL",
//       "description": "Brief description explaining relevance",
//       "relevanceScore": 0-100 (float)
//     }
//   ]
// }

// Constraints:
// - Generate 5-7 resources
// - Relevance score based on:
//   1. Direct match to query
//   2. Quality of content
//   3. Recency
//   4. Credibility of source`;

//   // User message with search parameters
//   const userMsg = new OpenAIMessage();
//   userMsg.role = "user";
//   userMsg.content = JSON.stringify({
//     query: searchParams.query,
//     type: searchParams.type || [],
//     difficulty: searchParams.difficulty || "all",
//   });

//   body.messages = [systemMsg, userMsg];
//   body.max_tokens = 1000;
//   body.temperature = 0.7;

//   const options = new http.RequestOptions();
//   options.method = "POST";

//   // Create body as Content object
//   options.body = http.Body.from(JSON.stringify(body)); // Create Content from string

//   const response = http.fetch(request, options);

//   if (response.status !== 200) {
//     throw new Error(
//       `OpenAI API error: ${response.status.toString()} ${response.statusText}`,
//     );
//   }

//   // Parse the response
//   const responseJson = JSON.parse<OpenAIResponse>(response.text());
//   const resourceResponse = JSON.parse<{ resources: ResourceItem[] }>(
//     responseJson.choices[0].message.content,
//   );

//   // Sort resources by relevance score
//   const sortedResources = resourceResponse.resources.sort(
//     (a, b) => b.relevanceScore - a.relevanceScore,
//   );

//   return sortedResources;
// }

// // Helper function to generate resources with more specific context
// export function generateResourceRecommendations(query: string): string[] {
//   const searchParams: ResourceSearchParams = {
//     query: query,
//     type: ["book", "article", "course", "video"],
//     difficulty: "intermediate",
//   };

//   const resources = searchResources(searchParams);

//   // Convert resources to URL list
//   return resources.map<string>((resource) => resource.url);
// }
