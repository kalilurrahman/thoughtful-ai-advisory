import { PHASES } from "@/data/governance";
import type { RoadmapItem } from "./store";

// Remediation roadmap items added or edited by hand (src/features/governance/screens-operations.tsx).
// Items from assessment gaps and gate blockers are added by the store; these rules keep hand-made
// items in the same shape, so saved workspaces stay valid (workspace.functions.ts `roadmap`).

export const ROADMAP_EFFORTS = ["Low", "Medium", "High"] as const;
export const UNASSIGNED = "Unassigned";
export const MANUAL_TAG = "Added by hand";

export interface RoadmapDraft {
  title: string;
  owner: string;
  effort: string;
  phase: number;
}

export type RoadmapFields = Pick<RoadmapItem, "title" | "owner" | "effort" | "phase">;

/** Checked fields for a new or edited item, or the reason they are refused. */
export function validateRoadmapDraft(
  draft: RoadmapDraft,
): { fields: RoadmapFields; error?: undefined } | { fields?: undefined; error: string } {
  const title = draft.title.trim();
  if (!title) return { error: "Describe the remediation action." };
  if (title.length > 200) return { error: "Keep the action to 200 characters or fewer." };
  const owner = draft.owner.trim() || UNASSIGNED;
  if (owner.length > 120) return { error: "Keep the owner to 120 characters or fewer." };
  if (!(ROADMAP_EFFORTS as readonly string[]).includes(draft.effort))
    return { error: "Choose Low, Medium or High effort." };
  if (!Number.isInteger(draft.phase) || draft.phase < 0 || draft.phase >= PHASES.length)
    return { error: "Choose a roadmap phase." };
  return { fields: { title, owner, effort: draft.effort, phase: draft.phase } };
}

/** A new hand-made item; the key never collides with seeded ("0.1") or gap ("gap-…") keys. */
export function newRoadmapItem(fields: RoadmapFields, id: string): RoadmapItem {
  return { ...fields, key: `item-${id}`, tag: MANUAL_TAG, done: false };
}

export function draftFrom(item: RoadmapItem): RoadmapDraft {
  return { title: item.title, owner: item.owner, effort: item.effort, phase: item.phase };
}
