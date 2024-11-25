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