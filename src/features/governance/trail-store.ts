import { useSyncExternalStore } from "react";
import type { StatusTone } from "@/components/assurance";

// The evidence trail (docs/design/assurance/README.md §3.5): every assessment change, inventory
// disposition and sign-off appends an entry. Until an append-only table exists in the database
// (README §5) the trail lives in this tab's memory only and the screens label it a preview; it is
// never written to a workspace snapshot, so saved workspaces are unchanged.

export interface TrailEntry {
  id: string;
  title: string;
  who: string;
  ref?: string | undefined;
  at: string;
  outcome: StatusTone;
}

const LIMIT = 200;
let entries: TrailEntry[] = [];
const listeners = new Set<() => void>();
let seq = 0;

function emit(): void {
  for (const l of listeners) l();
}

/** Append an entry (newest first); the title says what happened, ref what it refers to. */
export function recordTrail(entry: Omit<TrailEntry, "id" | "at"> & { at?: string }): TrailEntry {
  const full: TrailEntry = {
    id: `trail-${++seq}`,
    at: entry.at ?? new Date().toISOString(),
    title: entry.title,
    who: entry.who,
    ref: entry.ref,
    outcome: entry.outcome,
  };
  entries = [full, ...entries].slice(0, LIMIT);
  emit();
  return full;
}

export function getTrail(): TrailEntry[] {
  return entries;
}

/** Forget the preview trail (tests, and when the viewer's identity changes). */
export function clearTrail(): void {
  entries = [];
  emit();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const EMPTY: TrailEntry[] = [];

/** The trail, newest first; empty on the server. */
export function useTrail(): TrailEntry[] {
  return useSyncExternalStore(subscribe, getTrail, () => EMPTY);
}

/** The actor named in trail entries: the signed-in user, or the demo reviewer. */
export function trailActor(userId: string | null | undefined): string {
  return userId ? "Signed-in member" : "Demo reviewer";
}
