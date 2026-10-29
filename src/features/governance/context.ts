import { createContext, type Dispatch } from "react";
import type { Action, GovernanceState, LoadedWorkspace } from "./store";
import type { SaveStatus } from "./autosave-model";
import type { MemberRole } from "./team-model";

// Keep context identity separate from the refreshable provider and hooks.
export const GovernanceContext = createContext<{
  state: GovernanceState;
  dispatch: Dispatch<Action>;
  userId: string | null;
  workspaceId: string | null;
  workspaceName: string;
  /** The signed-in user's role in the loaded workspace; null for the demo or a new workspace. */
  workspaceRole?: MemberRole | null;
  setWorkspace: (id: string | null, name: string, role?: MemberRole | null) => void;
  /** Saving state of a saved private workspace (autosave and Save share it). */
  saveStatus?: SaveStatus;
  /** True when the screen has edits the database does not have yet. */
  dirty?: boolean;
  saveNow?: () => Promise<boolean>;
  /** Show a workspace loaded from the database and make it the autosave baseline. */
  adoptWorkspace?: (w: LoadedWorkspace) => void;
} | null>(null);
