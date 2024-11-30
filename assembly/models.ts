import { JSON } from "json-as";
import { postgresql } from "@hypermode/modus-sdk-as";

export type UUID = string;


@json
export class ExampleClaims {
  public sub!: string;
  public exp!: i64;
  public iat!: i64;
}


@json
export class User {
  public id!: string;
  public email!: string;
  public firstname!: string;
  public lastname!: string;
  public created_at!: i64;
  public clerkid!: string;
  public image!: string;
}


@json
export class Workspace {
  public id!: UUID;
  public name!: string;
  public user_id!: UUID;
  public created_at!: i64;
}


@json
export class WorkspaceMember {
  public id!: UUID;
  public workspace_id!: UUID;
  public user_id!: UUID;
  public role!: string;
  public created_at!: i64;
}


@json
export class Note {
  public id!: UUID;
  public title!: string;
  public content!: string;
  public workspace_id!: UUID;
  public user_id!: UUID;
  public created_at!: i64;
}


@json
export class Thread {
  public id!: UUID;
  public title!: string;
  public clerk_user_id!: string;
  public created_at!: i64;
  public last_message_at!: i64;
  public initial_content!: string; // New field for YouTube or initial context
}


@json
export class Message {
  public id!: UUID;
  public thread_id!: UUID;
  public role!: string; // "user" or "assistant"
  public content!: string;
  public created_at!: i64;
  public sources!: string[]; // URLs or resource references
}


@json
export class YouTubeContent {
  public id!: UUID;
  public thread_id!: UUID;
  public youtube_url!: string;
  public audio_file_path!: string;
  public transcription!: string;
  public language!: string;
  public transcription_confidence!: f64;
  public created_at!: i64;
}

// OpenAI-related models for chat completions
@json
export class OpenAIMessage {
  public role!: string;
  public content!: string;
}


@json
export class OpenAIChatInput {
  public model!: string;
  public messages!: OpenAIMessage[];
  public max_tokens?: i32;
  public temperature?: f64;
}


@json
export class OpenAIResponse {
  public choices!: {
    message: {
      content: string;
    };
  }[];
}

@json
export class TitleResponse {
  public title!: string;
}

// Model for storing resource recommendations
@json
export class ResourceRecommendation {
  public id!: UUID;
  public thread_id!: UUID;
  public query!: string;
  public title!: string;
  public url!: string;
  public description!: string;
  public relevance_score!: f64;
  public created_at!: i64;
}

// Clerk Claims model for authentication
@json
export class ClerkClaims {
  public sub!: string;
  public exp!: i64;
  public iat!: i64;
}
