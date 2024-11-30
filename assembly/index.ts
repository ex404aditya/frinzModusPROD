import { auth } from "@hypermode/modus-sdk-as";
// import { getCurrentUser } from "./user";
import {
  getWorkspaces,
  getWorkspaceNotes,
  createWorkspace,
  createNote,
  updateNote,
  deleteNote,
  getNote,
  verifyWorkspaceAccess,
} from "./workspace";
import { Workspace } from "./models";

// export function sayHello(name: string): string {
//   const user = getCurrentUser();
//   return `Hello ${user.id} ${user.clerkid} ${user.firstname} ${user.lastname}!`;
// }

export {
  getWorkspaces,
  getWorkspaceNotes,
  createWorkspace,
  createNote,
  updateNote,
  deleteNote,
  getNote,
  verifyWorkspaceAccess,
};
