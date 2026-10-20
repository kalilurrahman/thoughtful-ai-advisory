import { createContext, type Dispatch } from "react";
import type { Action, GovernanceState } from "./store";

// Keep context identity separate from the refreshable provider and hooks.
export const GovernanceContext = createContext<{
  state: GovernanceState;
  dispatch: Dispatch<Action>;
  userId: string | null;
  workspaceId: string | null;
  workspaceName: string;
  setWorkspace: (id: string | null, name: string) => void;
} | null>(null);