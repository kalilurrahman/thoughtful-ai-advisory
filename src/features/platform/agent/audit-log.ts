/**
 * The agent's hash-chained audit log: the shared browser AuditLog (byte-identical to
 * veritrail_common/audit.py) with IDs and timestamps taken from the agent runtime, so a
 * deterministic run produces the same chain as the Python reference.
 */
import { AuditLog, recordHash, type AuditRecord } from "../audit";
import type { AgentRuntime } from "./runtime";

export interface AppendOptions {
  traceId?: string | null | undefined;
  resource?: string | null | undefined;
  outcome?: string;
}

export class AgentAuditLog extends AuditLog {
  constructor(
    private readonly runtime: AgentRuntime,
    records: AuditRecord[] = [],
  ) {
    super(records);
  }

  override append(
    action: string,
    actor: string,
    details: Record<string, unknown> = {},
    opts: AppendOptions & { ts?: string } = {},
  ): AuditRecord {
    // Field order mirrors the Python dict literal: id, ts, trace_id (new_id calls in that order).
    const id = this.runtime.newId("aud");
    const ts = opts.ts ?? this.runtime.auditTs();
    const traceId = opts.traceId || this.runtime.newId("trc");
    const body: Omit<AuditRecord, "hash"> = {
      id,
      ts,
      trace_id: traceId,
      actor,
      action,
      resource: opts.resource ?? null,
      outcome: opts.outcome ?? "success",
      details: JSON.parse(JSON.stringify(details ?? {})) as Record<string, unknown>,
      prev_hash: this.lastHash,
    };
    const rec: AuditRecord = { ...body, hash: recordHash(body) };
    this.records.push(rec);
    return rec;
  }

  /** Remove every record (demo reset only — a real log is append-only). */
  clear(): void {
    this.records.length = 0;
  }
}
