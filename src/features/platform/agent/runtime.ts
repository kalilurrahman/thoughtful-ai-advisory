/**
 * Clock and ID source for the browser AEGIS Agent.
 *
 * The Python agent reads the wall clock (aegis_agent.store.utcnow, AuditLog timestamps,
 * date.today()) and random IDs (aegis_common.ids.new_id). In the browser the same calls go
 * through an `AgentRuntime`, so a run can be made fully deterministic (pilot dress rehearsal,
 * parity tests) by fixing the clock and numbering IDs per prefix.
 */
import { newId as randomId } from "../audit";

export interface AgentRuntime {
  /** New record / trace ID: `<prefix>_<suffix>` (lowercase alphanumeric suffix). */
  newId(prefix: string): string;
  /** store.utcnow(): ISO-8601 UTC timestamp to the second, e.g. 2026-10-21T09:00:00+00:00. */
  utcnow(): string;
  /** AuditLog timestamp: datetime.now(timezone.utc).isoformat(). */
  auditTs(): string;
  /** date.today() as YYYY-MM-DD. */
  today(): string;
}

function pyIso(d: Date, withFraction: boolean): string {
  const iso = d.toISOString(); // 2026-10-21T09:00:00.123Z
  if (!withFraction) return `${iso.slice(0, 19)}+00:00`;
  const ms = iso.slice(20, 23);
  return ms === "000" ? `${iso.slice(0, 19)}+00:00` : `${iso.slice(0, 19)}.${ms}000+00:00`;
}

/** Wall clock and random IDs (the interactive console). */
export function systemRuntime(): AgentRuntime {
  return {
    newId: (prefix) => randomId(prefix),
    utcnow: () => pyIso(new Date(), false),
    auditTs: () => pyIso(new Date(), true),
    today: () => new Date().toISOString().slice(0, 10),
  };
}

export interface DeterministicOptions {
  /** Fixed UTC instant, default 2026-10-21T09:00:00Z. */
  at?: string;
  /** Optional lowercase alphanumeric tag placed before the counter (e.g. a seed). */
  tag?: string;
}

/**
 * Fixed clock and per-prefix sequential IDs (`sys_000001`, `trc_000042`, ...). The Python
 * parity exporter patches aegis_common.ids.new_id and the clocks the same way, so runs
 * driven by identical inputs produce identical IDs, timestamps, messages and audit hashes.
 */
export function deterministicRuntime(opts: DeterministicOptions = {}): AgentRuntime & {
  counters: Record<string, number>;
} {
  const at = new Date(opts.at ?? "2026-10-21T09:00:00Z");
  const tag = (opts.tag ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const counters: Record<string, number> = {};
  return {
    counters,
    newId(prefix) {
      const n = (counters[prefix] ?? 0) + 1;
      counters[prefix] = n;
      return `${prefix}_${tag}${String(n).padStart(6, "0")}`;
    },
    utcnow: () => pyIso(at, false),
    auditTs: () => pyIso(at, true),
    today: () => at.toISOString().slice(0, 10),
  };
}

/** YYYY-MM-DD plus a number of days (date + timedelta(days=n)). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
