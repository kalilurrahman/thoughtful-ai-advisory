/**
 * In-memory persistence for agent records — the browser replacement for aegis_agent/store.py
 * (one JSON file per record). Records are stored as JSON text, so every get/list returns a
 * fresh copy exactly like re-reading a file, and the whole store can be snapshotted to
 * localStorage (see persistence.ts). Single tenant, single browser: synthetic demo data only.
 */
import type { AuditRecord } from "../audit";
import type { AgentRuntime } from "./runtime";

export const COLLECTIONS = {
  systems: "sys",
  assessments: "asm",
  approvals: "apr",
  tasks: "tsk",
  evidence: "evd",
  sessions: "ses",
  reports: "rpt",
  policies: "pol",
  exports: "exp",
  outbox: "out",
  exceptions: "exc",
} as const;
export type CollectionName = keyof typeof COLLECTIONS;

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

export function validId(id: string | null | undefined): boolean {
  return Boolean(id) && ID_RE.test(id ?? "");
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json | undefined };
type Loose = Record<string, unknown>;

export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface SystemRecord extends BaseRecord {
  name: string;
  status: string;
  profile: Loose;
  owner: string | null;
  risk_tier: string | null;
  risk_tier_status: string;
  created_by: string;
  assessment_ids: string[];
  controls: string[];
  inferred_risk_tier?: string;
  tier_history?: Array<{ tier: unknown; approval_id: string; approved_by: string; at: string }>;
}

export interface ResponseRecord {
  answer: string;
  evidence_refs: string[];
  notes: string;
  answered_by: string;
  answered_at: string;
}

export interface AssessmentRecord extends BaseRecord {
  system_id: string | null;
  status: string;
  template: { id: string; version: string };
  profile: Loose;
  profile_provenance: Record<string, string>;
  risk: Loose & { tier: string };
  modules: Array<{ id: string; name: string; description: string; reasons: string[] }>;
  questions: string[];
  responses: Record<string, ResponseRecord>;
  created_by: string;
  trace_ids: string[];
}

export interface ApprovalRecord extends BaseRecord {
  approval_id: string;
  type: string;
  action_type: string;
  action_label: string;
  status: string;
  resource: string | null;
  payload: Loose;
  payload_hash: string;
  reason: string;
  controls: string[];
  requested_by: string;
  requested_by_name: string;
  requested_role: string;
  required_approver_roles: string[];
  separation_of_duties: string;
  trace_id: string;
  session_id: string | null;
  executed: boolean;
  resolved_by?: string;
  resolved_by_name?: string;
  resolved_role?: string;
  resolved_at?: string;
  note?: string;
  execution_result?: Loose;
  executed_at?: string;
}

export interface EvidenceRecord extends BaseRecord {
  ref: string;
  assessment_id: string;
  question_id: string;
  submitted_by: string;
  reviewed_by: string | null;
  review_status: string;
  label: string;
  reviewer_id?: string;
  reviewed_at?: string;
  review_note?: string;
}

export interface TranscriptEntry {
  role: "user" | "agent";
  text: string;
  ts: string;
  trace_id: string;
  intent?: string;
}

export interface PendingConfirmation {
  kind: "remediation_tasks";
  assessment_id: string;
  gap_ids: string[] | null;
  severities: string[] | null;
}

export interface SessionRecord extends BaseRecord {
  user_id: string;
  state: string;
  profile: Loose;
  provenance: Record<string, string>;
  transcript: TranscriptEntry[];
  asked_field?: string;
  assessment_id?: string;
  system_id?: string;
  current_q?: string;
  risk?: Loose & { tier: string };
  pending_confirmation?: PendingConfirmation;
  preview?: boolean;
  skipped?: string[];
  policy_id?: string;
  last_report_id?: string;
}

export interface TaskRecord extends BaseRecord {
  gap_id: string;
  title: string;
  controls: string[];
  owner_role: string;
  due_date: string;
  severity: string;
  assessment_id: string;
  status: string;
  created_by: string;
  confirmed_by: string;
  source: string;
}

export interface PolicyRecord extends BaseRecord {
  status: string;
  environment: string;
  mode: string;
  assessment_id: string | null;
  policy: Loose | null;
  created_by: string;
  citations: string[];
  approved_by?: string;
  approval_id?: string;
}

export interface ReportArtifacts {
  md: string;
  csv: string;
  json: string;
  pdf_title: string;
}

export interface ReportRecord extends BaseRecord {
  assessment_id: string;
  status: string;
  paths: Record<string, string | null>;
  errors: Record<string, string>;
  created_by: string;
  synthetic: boolean;
  /** Browser addition: the generated files (no file system); PDF is rendered on download. */
  artifacts?: ReportArtifacts;
}

export interface ExportRecord extends BaseRecord {
  assessment_id: string;
  approval_id: string;
  path: string;
  exported_by: string;
  /** Browser addition: the evidence pack itself. */
  pack?: Loose;
}

export interface OutboxRecord extends BaseRecord {
  approval_id: string;
  to: unknown;
  subject: unknown;
  body_ref: unknown;
  status: string;
  note: string;
}

export interface ExceptionRecord extends BaseRecord {
  approval_id: string;
  resource: string | null;
  control_ids: unknown;
  justification: string;
  approved_by: string;
  expires_on: string;
}

export interface CollectionTypes {
  systems: SystemRecord;
  assessments: AssessmentRecord;
  approvals: ApprovalRecord;
  tasks: TaskRecord;
  evidence: EvidenceRecord;
  sessions: SessionRecord;
  reports: ReportRecord;
  policies: PolicyRecord;
  exports: ExportRecord;
  outbox: OutboxRecord;
  exceptions: ExceptionRecord;
}

/** A record before `put` assigns id / created_at / updated_at. */
export type NewRecord<T extends BaseRecord> = Omit<T, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export interface StoreSnapshot {
  version: 1;
  collections: Partial<Record<CollectionName, Loose[]>>;
  audit: AuditRecord[];
  runtime_logs: Loose[];
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export class Store {
  /** Virtual root used in report/export paths (there is no file system in the browser). */
  readonly root: string;
  /** Runtime guardrail decision records (search_runtime_logs); empty unless seeded. */
  runtimeLogs: Loose[] = [];
  private readonly data = new Map<CollectionName, Map<string, string>>();

  constructor(
    readonly runtime: AgentRuntime,
    root = "browser-storage",
  ) {
    this.root = root;
    for (const c of Object.keys(COLLECTIONS) as CollectionName[]) this.data.set(c, new Map());
  }

  private coll(c: CollectionName): Map<string, string> {
    const m = this.data.get(c);
    if (!m) throw new Error(`Unknown collection: ${String(c)}`);
    return m;
  }

  newId(c: CollectionName): string {
    return this.runtime.newId(COLLECTIONS[c]);
  }

  /** Insert or replace; assigns id/created_at/updated_at on the passed object (like store.put). */
  put<C extends CollectionName>(c: C, record: NewRecord<CollectionTypes[C]>): CollectionTypes[C] {
    const r = record as Loose;
    if (!("id" in r) || r["id"] === undefined) r["id"] = this.newId(c);
    if (r["created_at"] === undefined) r["created_at"] = this.runtime.utcnow();
    r["updated_at"] = this.runtime.utcnow();
    const id = String(r["id"]);
    if (!validId(id)) throw new Error(`Invalid record id: ${JSON.stringify(id)}`);
    this.coll(c).set(id, JSON.stringify(r));
    return record as CollectionTypes[C];
  }

  get<C extends CollectionName>(c: C, id: string | null | undefined): CollectionTypes[C] | null {
    if (!validId(id)) return null;
    const raw = this.coll(c).get(id ?? "");
    return raw === undefined ? null : (JSON.parse(raw) as CollectionTypes[C]);
  }

  /** All records, ordered by created_at then id (sorted file names, then a stable sort). */
  list<C extends CollectionName>(c: C): Array<CollectionTypes[C]> {
    const out = [...this.coll(c).values()].map((raw) => JSON.parse(raw) as CollectionTypes[C]);
    return out.sort((a, b) => cmp(a.created_at ?? "", b.created_at ?? "") || cmp(a.id, b.id));
  }

  count(c: CollectionName): number {
    return this.coll(c).size;
  }

  update<C extends CollectionName>(
    c: C,
    id: string,
    changes: Partial<CollectionTypes[C]>,
  ): CollectionTypes[C] {
    const rec = this.get(c, id);
    if (!rec) throw new Error(`${c}/${id} not found`);
    Object.assign(rec, changes);
    return this.put(c, rec as NewRecord<CollectionTypes[C]>);
  }

  snapshot(audit: AuditRecord[]): StoreSnapshot {
    const collections: StoreSnapshot["collections"] = {};
    for (const [c, m] of this.data) collections[c] = [...m.values()].map((v) => JSON.parse(v) as Loose);
    return { version: 1, collections, audit, runtime_logs: this.runtimeLogs };
  }

  load(snap: StoreSnapshot): void {
    for (const [c, m] of this.data) {
      m.clear();
      for (const rec of snap.collections[c] ?? []) {
        const id = String(rec["id"] ?? "");
        if (validId(id)) m.set(id, JSON.stringify(rec));
      }
    }
    this.runtimeLogs = Array.isArray(snap.runtime_logs) ? snap.runtime_logs : [];
  }
}

export type { Json };
