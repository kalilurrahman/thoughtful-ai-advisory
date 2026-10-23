/**
 * Browser persistence for the VERITRAIL Agent console: the whole store and audit chain are kept in
 * this browser's localStorage under `veritrail.platform.agent.v1`. Call only from effects and event
 * handlers (never during render/SSR); every access is guarded because storage may be blocked,
 * full or unavailable (private windows, previews).
 */
import type { AuditRecord } from "../audit";
import type { VeritrailAgent } from "./orchestrator";
import type { StoreSnapshot } from "./store";

export const STORAGE_KEY = "veritrail.platform.agent.v1";

export interface PersistedState {
  snapshot: StoreSnapshot;
  /** UI conveniences restored with the data. */
  ui?: { sessionId?: string; role?: string; name?: string; userId?: string };
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadPersisted(): PersistedState | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed?.snapshot || parsed.snapshot.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Returns false when nothing could be written (storage blocked or full). */
export function savePersisted(agent: VeritrailAgent, ui?: PersistedState["ui"]): boolean {
  try {
    const s = storage();
    if (!s) return false;
    const state: PersistedState = { snapshot: agent.store.snapshot([...agent.audit.records]) };
    if (ui) state.ui = ui;
    s.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearPersisted(): void {
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

/** Load a snapshot into an agent (records and audit chain). */
export function restoreInto(agent: VeritrailAgent, snap: StoreSnapshot): void {
  agent.store.load(snap);
  agent.audit.clear();
  for (const r of (snap.audit ?? []) as AuditRecord[]) agent.audit.records.push(r);
}
