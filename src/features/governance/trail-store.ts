import { useSyncExternalStore } from "react";
import type { StatusTone } from "@/components/assurance";

// The evidence trail (docs/design/assurance/README.md §3.5): every assessment change, inventory
// disposition and sign-off appends an entry. The entries live in this module (newest first) so
// every screen shares one list. For a saved workspace the governance provider attaches a sink
// (trail.functions.ts, table workspace_trail from migration 0015): new entries are appended
// server-side as well and the list is hydrated from the database when the workspace loads. For
// the demo workspace, an unsaved one, or while the table is not yet available, the trail stays
// in this tab only and the screens label it a preview. The trail is never part of a workspace
// snapshot.

export interface TrailEntry {
  id: string;
  title: string;
  who: string;
  ref?: string | undefined;
  at: string;
  outcome: StatusTone;
}

export type TrailMode = "preview" | "saved";

/** Where entries go beyond this tab: the server functions, bound to one workspace. */
export interface TrailSink {
  workspaceId: string;
  append(entries: TrailEntry[]): Promise<TrailEntry[] | null>;
  load(): Promise<TrailEntry[] | null>;
}

const LIMIT = 200;
let entries: TrailEntry[] = [];
let mode: TrailMode = "preview";
let sink: TrailSink | null = null;
const listeners = new Set<() => void>();
let seq = 0;

function emit(): void {
  for (const l of listeners) l();
}

function setEntries(next: TrailEntry[]): void {
  entries = next.slice(0, LIMIT);
  emit();
}

function setMode(next: TrailMode): void {
  if (mode === next) return;
  mode = next;
  emit();
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
  setEntries([full, ...entries]);
  const target = sink;
  if (target)
    void target
      .append([full])
      .then((stored) => {
        // Swap the local id for the stored one, unless the workspace changed meanwhile.
        if (!stored?.[0] || sink !== target) return;
        const saved = stored[0];
        setEntries(entries.map((e) => (e.id === full.id ? { ...saved } : e)));
        setMode("saved");
      })
      .catch(() => {
        /* the entry stays in this tab as a preview */
      });
  return full;
}

export function getTrail(): TrailEntry[] {
  return entries;
}

export function getTrailMode(): TrailMode {
  return mode;
}

/** Forget the trail and detach the sink (tests, and when the viewer's identity changes). */
export function clearTrail(): void {
  sink = null;
  mode = "preview";
  entries = [];
  emit();
}

/**
 * Bind the trail to a saved workspace: hydrate from the sink and append there from now on.
 * A null sink returns to the tab-only preview. Returns once hydration settles.
 */
export async function attachTrailSink(next: TrailSink | null): Promise<void> {
  sink = next;
  if (!next) {
    setMode("preview");
    return;
  }
  setMode("preview");
  try {
    const loaded = await next.load();
    if (sink !== next) return;
    if (loaded) {
      setEntries(loaded);
      setMode("saved");
    }
  } catch {
    /* the table is not available: keep the preview */
  }
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

/** Whether entries are being kept in the workspace ("saved") or only in this tab ("preview"). */
export function useTrailMode(): TrailMode {
  return useSyncExternalStore(subscribe, getTrailMode, () => "preview");
}

/** The actor named in trail entries: the signed-in user, or the demo reviewer. */
export function trailActor(userId: string | null | undefined): string {
  return userId ? "Signed-in member" : "Demo reviewer";
}
