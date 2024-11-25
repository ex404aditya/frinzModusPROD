import { postgresql } from "@hypermode/modus-sdk-as";
import { Workspace, Note, UUID } from "./models";
import { getCurrentUser } from "./user";
import { convertToUUID } from "./utils";

export function getWorkspaces(): Array<Workspace> {
  const user = getCurrentUser();
  
  const query = "SELECT * FROM workspaces WHERE user_id = $1";
  const params = new postgresql.Params();
  params.push(user.id);

  const response = postgresql.query<Workspace>("frinzdb", query, params);
  const workspaces = new Array<Workspace>(response.rows.length);
  for (let i = 0; i < response.rows.length; i++) {
    const workspace = response.rows[i];
    workspace.id = convertToUUID(workspace.id);
    workspace.user_id = convertToUUID(workspace.user_id);
    workspaces[i] = workspace;
  }
  return workspaces;
}

export function createWorkspace(name: string): Workspace {
  const user = getCurrentUser();
  
  const query = `
    INSERT INTO workspaces (name, user_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  
  const params = new postgresql.Params();
  params.push(name);
  params.push(user.id);

  const response = postgresql.query<Workspace>("frinzdb", query, params);
  const workspace = response.rows[0];
  workspace.id = convertToUUID(workspace.id);
  workspace.user_id = convertToUUID(workspace.user_id);
  return workspace;
}

export function getWorkspaceNotes(workspaceId: UUID): Array<Note> {
  const user = getCurrentUser();
  
  const query = `
    SELECT * FROM notes 
    WHERE workspace_id = $1 AND user_id = $2
    ORDER BY created_at DESC
  `;
  
  const params = new postgresql.Params();
  params.push(workspaceId);
  params.push(user.id);

  const response = postgresql.query<Note>("frinzdb", query, params);
  const notes = new Array<Note>(response.rows.length);
  for (let i = 0; i < response.rows.length; i++) {
    const note = response.rows[i];
    note.id = convertToUUID(note.id);
    note.workspace_id = convertToUUID(note.workspace_id);
    note.user_id = convertToUUID(note.user_id);
    notes[i] = note;
  }
  return notes;
}

export function createNote(workspaceId: UUID, title: string = "Untitled Note"): Note {
  const user = getCurrentUser();
  
  // Check if user has access to workspace
  const workspaceQuery = `
    SELECT * FROM workspaces 
    WHERE id = $1 AND user_id = $2
  `;
  const workspaceParams = new postgresql.Params();
  workspaceParams.push(workspaceId);
  workspaceParams.push(user.id);
  
  const workspaceResponse = postgresql.query<Workspace>("frinzdb", workspaceQuery, workspaceParams);
  if (workspaceResponse.rows.length === 0) {
    throw new Error("Workspace not found or access denied");
  }

  const query = `
    INSERT INTO notes (title, workspace_id, user_id)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  const params = new postgresql.Params();
  params.push(title);
  params.push(workspaceId);
  params.push(user.id);

  const response = postgresql.query<Note>("frinzdb", query, params);
  const note = response.rows[0];
  note.id = convertToUUID(note.id);
  note.workspace_id = convertToUUID(note.workspace_id);
  note.user_id = convertToUUID(note.user_id);
  return note;
}

export function updateNote(noteId: UUID, title: string, content: string): Note {
  const user = getCurrentUser();

  // Check if note belongs to user
  const existingNoteQuery = `
    SELECT * FROM notes
    WHERE id = $1 AND user_id = $2
  `;
  const existingNoteParams = new postgresql.Params();
  existingNoteParams.push(noteId);
  existingNoteParams.push(user.id);

  const existingNoteResponse = postgresql.query<Note>("frinzdb", existingNoteQuery, existingNoteParams);
  if (existingNoteResponse.rows.length === 0) {
    throw new Error("Note not found or access denied");
  }

  const query = `
    UPDATE notes 
    SET title = $1, content = $2
    WHERE id = $3 AND user_id = $4
    RETURNING *
  `;
  
  const params = new postgresql.Params();
  params.push(title);
  params.push(content);
  params.push(noteId);
  params.push(user.id);

  const response = postgresql.query<Note>("frinzdb", query, params);
  if (response.rows.length === 0) {
    throw new Error("Failed to update note");
  }
  
  const note = response.rows[0];
  note.id = convertToUUID(note.id);
  note.workspace_id = convertToUUID(note.workspace_id);
  note.user_id = convertToUUID(note.user_id);
  return note;
}

export function deleteNote(noteId: UUID): void {
  const user = getCurrentUser();

  // Check if note belongs to user
  const existingNoteQuery = `
    SELECT * FROM notes
    WHERE id = $1 AND user_id = $2
  `;
  const existingNoteParams = new postgresql.Params();
  existingNoteParams.push(noteId);
  existingNoteParams.push(user.id);

  const existingNoteResponse = postgresql.query<Note>("frinzdb", existingNoteQuery, existingNoteParams);
  if (existingNoteResponse.rows.length === 0) {
    throw new Error("Note not found or access denied");
  }

  const query = `
    DELETE FROM notes
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;
  
  const params = new postgresql.Params();
  params.push(noteId);
  params.push(user.id);

  const response = postgresql.query<Note>("frinzdb", query, params);
  if (response.rows.length === 0) {
    throw new Error("Failed to delete note");
  }
}

export function getNote(noteId: UUID): Note {
  const user = getCurrentUser();

  const query = `
    SELECT * FROM notes
    WHERE id = $1 AND user_id = $2
  `;
  
  const params = new postgresql.Params();
  params.push(noteId);
  params.push(user.id);

  const response = postgresql.query<Note>("frinzdb", query, params);
  if (response.rows.length === 0) {
    throw new Error("Note not found");
  }

  const note = response.rows[0];
  note.id = convertToUUID(note.id);
  note.workspace_id = convertToUUID(note.workspace_id);
  note.user_id = convertToUUID(note.user_id);
  return note;
}

export function verifyWorkspaceAccess(workspaceId: UUID): Workspace {
  const user = getCurrentUser();

  const query = `
    SELECT w.*, u.clerkid
    FROM workspaces w
    JOIN users u ON w.user_id = u.id 
    WHERE w.id = $1
  `;

  const params = new postgresql.Params();
  params.push(workspaceId);

  const response = postgresql.query<Workspace>("frinzdb", query, params);

  if (response.rows.length === 0) {
    throw new Error("Workspace not found");
  }

  const workspace = response.rows[0];
  workspace.id = convertToUUID(workspace.id);
  workspace.user_id = convertToUUID(workspace.user_id);
  
  // Check if the current user is the workspace owner
  if (workspace.user_id !== user.id) {
    throw new Error("Access denied");
  }

  return workspace;
}
