import { createContext, type Dispatch } from "react";
import type { Action, GovernanceState } from "./store";
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
} | null>(null);
