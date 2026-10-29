import type { GovernanceState } from "./store";
import { canEdit, type MemberRole } from "./team-model";

// Autosave rules for saved team workspaces. Saves go through save_workspace_checked
// (migration 0013), so a save from a stale revision is refused as a conflict instead of
// overwriting a teammate's newer work.

export const AUTOSAVE_DELAY_MS = 2500;

export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

/** What a save would write; the open question index (qi) is navigation, not content. */
export function snapshotKey(state: GovernanceState, name: string): string {
  return JSON.stringify({ name, state: { ...state, qi: 0 } });
}

export function shouldAutosave(input: {
  userId: string | null;
  workspaceId: string | null;
  role: MemberRole | null;
  status: SaveStatus;
  dirty: boolean;
}): boolean {
  return (
    input.dirty &&
    input.userId !== null &&
    input.workspaceId !== null &&
    canEdit(input.role) &&
    input.status !== "saving" &&
    input.status !== "conflict"
  );
}

export function saveStatusText(status: SaveStatus, dirty: boolean): string {
  switch (status) {
    case "saving":
      return "Saving…";
    case "conflict":
      return "Someone else saved this workspace. Restore it to get their changes; your unsaved edits stay on screen until you do.";
    case "error":
      return "Could not save. Your work is still on this screen; it will retry when you make another change.";
    case "saved":
      return dirty ? "Unsaved changes" : "All changes saved.";
    default:
      return dirty ? "Unsaved changes" : "";
  }
}
