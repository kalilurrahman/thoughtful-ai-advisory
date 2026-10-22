/**
 * AEGIS Agent tools (14) with declared permission levels, RBAC and audit logging
 * (aegis_agent/tools.py).
 *
 * Every tool runs through `invoke(ctx, name, args)`, which
 *   1. checks the caller's role against the tool's permission level and minimum role (least privilege),
 *   2. runs the tool,
 *   3. appends an audit record (`agent.tool.<name>`, trace ID, redacted inputs, outcome).
 *
 * Permission levels: read < compute < create_draft < write_confirm < approval_required.
 *   * create_draft tools only create records in `draft` / `in_progress` status;
 *   * write_confirm tools need `confirmed === true` (explicit user confirmation) or return a preview;
 *   * approval_required tools create a pending approval and execute only with an approved,
 *     single-use approval resolved by a different user with an approver role.
 */
import { NO_SOURCE_MESSAGE, controlCitation, getControl } from "@/features/site/content";
import { getIndex, parseFrameworkRefs, controlsForFrameworkRef, searchKnowledge } from "@/features/site/engines/ask-aegis/knowledge";
import {
  ANSWER_IDS,
  applicableGuardrails,
  applicableQuestions,
  moduleById,
  selectModules,
  templateMeta,
  type Profile,
} from "@/features/site/engines/ask-aegis/question-bank";
import { redact } from "@/features/site/engines/ask-aegis/safety";
import { calculateRiskTier as riskEngine, type RiskTierResult } from "@/features/site/engines/risk-tier";
import { advise, type AdviseResult } from "@/features/site/engines/shield";
import * as approvalsSvc from "./approvals";
import type { AgentAuditLog } from "./audit-log";
import {
  APPROVAL_REQUIRED,
  COMPUTE,
  CREATE_DRAFT,
  READ,
  ROLE_PERMISSIONS,
  ROLE_RANK,
  SENSITIVE_ACTIONS,
  WRITE_CONFIRM,
  userDisplay,
  type User,
} from "./config";
import * as gapsMod from "./gaps";
import { pyDumps } from "./py";
import { buildReportData, exportReport, REPORT_FORMATS, type AuditTraceRow } from "./reporting";
import type {
  AssessmentRecord,
  EvidenceRecord,
  NewRecord,
  PolicyRecord,
  Store,
  SystemRecord,
} from "./store";

export class ToolPermissionError extends Error {
  override name = "ToolPermissionError";
}
export class ToolInputError extends Error {
  override name = "ToolInputError";
}

export interface ToolCall {
  tool: string;
  permission: string;
  trace_id: string;
  outcome: string;
}

export interface ToolContext {
  store: Store;
  audit: AgentAuditLog;
  user: User;
  traceId: string;
  sessionId: string | null;
  calls: ToolCall[];
}

type Loose = Record<string, unknown>;

// --------------------------------------------------------------------------- helpers
/** Recursively redact strings (PII masking) and truncate long values for audit records. */
export function redactObj(obj: unknown, maxLen = 500): unknown {
  if (typeof obj === "string") {
    const t = redact(obj).text;
    return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
  }
  if (Array.isArray(obj)) return obj.slice(0, 50).map((v) => redactObj(v, maxLen));
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Loose)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, redactObj(v, maxLen)]),
    );
  }
  return obj;
}

function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new ToolInputError(msg);
}

function pyRepr(s: string): string {
  return s.includes("'") && !s.includes('"') ? `"${s}"` : `'${s.replaceAll("'", "\\'")}'`;
}

function getAssessment(ctx: ToolContext, assessmentId: string | null | undefined): AssessmentRecord {
  const a = ctx.store.get("assessments", assessmentId || "");
  need(a, `Assessment ${assessmentId === null || assessmentId === undefined ? "None" : pyRepr(assessmentId)} not found.`);
  return a;
}

export function evidenceLookup(ctx: ToolContext): (ref: string) => EvidenceRecord | null {
  return (ref) => {
    for (const e of ctx.store.list("evidence")) {
      if ((e.ref ?? "").toUpperCase() === String(ref).toUpperCase() || e.id === ref) return e;
    }
    return null;
  };
}

// --------------------------------------------------------------------------- results
export interface KnowledgeToolHit {
  id: string;
  kind: string;
  title: string;
  score: number;
  coverage: number;
  matched: string[];
  control_ids: string[];
  question_ids: string[];
  source: Loose;
  summary: string;
  text: string;
}
export interface KnowledgeToolResult {
  query: string;
  confidence: number;
  band: string;
  results: KnowledgeToolHit[];
  framework_matches: Array<{ framework: string; reference: string; controls: string[] }>;
  indexed_documents: number;
  no_source_message: string | null;
}
export type RiskToolResult = RiskTierResult & { engine: string };
export interface SelectedModuleFull {
  id: string;
  name: string;
  description: string;
  reasons: string[];
}
export interface RecommendedControlOut {
  id: string;
  title: string;
  priority: string;
  owner_role: string | null;
  mappings: Loose;
  related_questions: string[];
  [key: string]: unknown;
}
export interface RemediationPreview {
  gap_id: string;
  title: string;
  controls: string[];
  owner_role: string;
  due_date: string;
  severity: string;
}
export interface DraftPolicyResult {
  status: "draft" | "unavailable";
  policy_id?: string;
  mode?: string;
  environment?: string;
  validation_errors?: string[];
  guardrails: Array<{ id: string; title: string; controls: string[] }>;
  advice?: AdviseResult;
  message: string;
}
export interface ApprovalToolResult {
  status: "pending";
  approval_id: string;
  type: string;
  resource: string | null;
  controls: string[];
  deduplicated: boolean;
  message: string;
}

// --------------------------------------------------------------------------- 1 search_aegis_knowledge
function searchAegisKnowledge(
  _ctx: ToolContext,
  a: { query: string; k?: number; kinds?: string[] | null },
): KnowledgeToolResult {
  need(typeof a.query === "string" && a.query.trim() !== "", "query is required");
  const idx = getIndex();
  const res = searchKnowledge(a.query, a.k ?? 5, a.kinds && a.kinds.length ? a.kinds : undefined);
  const refs = parseFrameworkRefs(a.query);
  return {
    query: a.query,
    confidence: res.confidence,
    band: res.band,
    results: res.results.map((r) => {
      const src: Loose = { type: r.doc.kind, id: r.doc.id, title: r.doc.title, path: r.doc.source };
      if (r.doc.section) src["section"] = r.doc.section;
      if (r.doc.policy_id) {
        src["policy_id"] = r.doc.policy_id;
        src["policy_version"] = r.doc.policy_version;
      }
      return {
        id: r.doc.id,
        kind: r.doc.kind,
        title: r.doc.title,
        score: r.score,
        coverage: r.coverage,
        matched: r.matched,
        control_ids: r.doc.control_ids,
        question_ids: r.doc.question_ids,
        source: src,
        summary: r.doc.summary,
        text: r.doc.text,
      };
    }),
    framework_matches: refs.map(([fw, ref]) => ({
      framework: fw,
      reference: ref,
      controls: controlsForFrameworkRef(fw, ref).map((c) => c.id),
    })),
    indexed_documents: idx.docs.length,
    no_source_message: res.results.length ? null : NO_SOURCE_MESSAGE,
  };
}

// --------------------------------------------------------------------------- 2 search_ai_inventory
const INVENTORY_KEYS = [
  "id",
  "name",
  "status",
  "risk_tier",
  "risk_tier_status",
  "owner",
  "created_by",
  "created_at",
  "assessment_ids",
] as const;

function searchAiInventory(
  ctx: ToolContext,
  a: { query?: string; filters?: Loose | null; limit?: number },
): { count: number; systems: Loose[] } {
  const q = (a.query || "").toLowerCase().trim();
  const out: Loose[] = [];
  for (const s of ctx.store.list("systems")) {
    const prof = (s.profile ?? {}) as Loose;
    const hay = [s.name, prof["purpose"], s.risk_tier, s.owner, s.status]
      .map((v) => (v === null || v === undefined ? "None" : String(v)))
      .join(" ")
      .toLowerCase();
    if (q && !q.split(/\s+/).every((tok) => hay.includes(tok))) continue;
    if (
      a.filters &&
      Object.entries(a.filters).some(
        ([k, v]) => String((s as Loose)[k] || prof[k]) !== String(v),
      )
    )
      continue;
    out.push(Object.fromEntries(INVENTORY_KEYS.map((k) => [k, (s as Loose)[k] ?? null])));
  }
  const limit = a.limit ?? 50;
  return { count: out.slice(0, limit).length, systems: out.slice(0, limit) };
}

// --------------------------------------------------------------------------- 3 create_ai_system_record
function createAiSystemRecord(
  ctx: ToolContext,
  a: { profile: Loose; owner?: string | null },
): { status: "draft"; system: SystemRecord; message: string } {
  need(a.profile && typeof a.profile === "object" && a.profile["name"], "profile.name is required");
  const rec = ctx.store.put("systems", {
    name: String(a.profile["name"]).slice(0, 120),
    status: "draft",
    profile: a.profile,
    owner: a.owner ?? null,
    risk_tier: null,
    risk_tier_status: "Not confirmed",
    created_by: ctx.user.id,
    assessment_ids: [],
    controls: ["EI-01", "EI-03", "EI-12"],
  });
  return {
    status: "draft",
    system: rec,
    message: `Draft AI system record ${rec.id} created (EI-01, EI-12). Draft records are not authoritative until reviewed.`,
  };
}

// --------------------------------------------------------------------------- 6 calculate_risk_tier
function calculateRiskTier(_ctx: ToolContext, a: { profile: Loose }): RiskToolResult {
  need(a.profile && typeof a.profile === "object", "profile must be an object");
  const res = riskEngine(a.profile);
  return { ...res, engine: "aegis_assessment.risk_tier", evidence_status: "Inferred", requires_human_confirmation: true };
}

export function selectModulesFull(profile: Loose, tier: string | null, required: string[] = []): SelectedModuleFull[] {
  return selectModules(profile as Profile, tier, required).map((m) => ({
    id: m.id,
    name: m.name,
    description: moduleById(m.id)?.description ?? "",
    reasons: m.reasons,
  }));
}

// --------------------------------------------------------------------------- 4 start_assessment
function startAssessment(
  ctx: ToolContext,
  a: { system_id?: string | null; profile?: Loose | null; profile_provenance?: Record<string, string> | null },
) {
  const system = a.system_id ? ctx.store.get("systems", a.system_id) : null;
  need(system !== null || (a.profile && Object.keys(a.profile).length), "system_id or profile is required");
  const prof: Loose = { ...((a.profile && Object.keys(a.profile).length ? a.profile : system?.profile) ?? {}) };
  const risk = calculateRiskTier(ctx, { profile: prof });
  const mods = selectModulesFull(prof, risk.tier, risk.required_modules);
  const qs = applicableQuestions(prof as Profile, risk.tier, risk.required_modules);
  const rec = ctx.store.put("assessments", {
    system_id: system ? system.id : null,
    status: "in_progress",
    template: { id: templateMeta.id, version: templateMeta.version },
    profile: prof,
    profile_provenance: a.profile_provenance ?? {},
    risk: risk as unknown as AssessmentRecord["risk"],
    modules: mods,
    questions: qs.map((q) => q.id),
    responses: {},
    created_by: ctx.user.id,
    trace_ids: [ctx.traceId],
  });
  if (system) {
    (system.assessment_ids ??= []).push(rec.id);
    if (!system.risk_tier) system.inferred_risk_tier = risk.tier;
    ctx.store.put("systems", system);
  }
  return {
    status: "in_progress" as const,
    assessment_id: rec.id,
    risk,
    modules: mods,
    question_count: qs.length,
    first_question: qs[0] ?? null,
  };
}

// --------------------------------------------------------------------------- 5 submit_assessment_response
function submitAssessmentResponse(
  ctx: ToolContext,
  a: {
    assessment_id: string;
    question_id: string;
    answer: string;
    evidence_refs?: string[] | null;
    notes?: string;
  },
) {
  const asm = getAssessment(ctx, a.assessment_id);
  need(["in_progress", "completed"].includes(asm.status), "Assessment is not open for responses.");
  const qid = (a.question_id || "").toUpperCase();
  need(asm.questions.includes(qid), `${a.question_id} is not an applicable question for this assessment.`);
  need(
    (ANSWER_IDS as readonly string[]).includes(a.answer),
    `answer must be one of [${ANSWER_IDS.map((x) => `'${x}'`).join(", ")}]`,
  );
  const refs = (a.evidence_refs ?? []).map((r) => String(r).slice(0, 80)).slice(0, 10);
  const look = evidenceLookup(ctx);
  for (const r of refs) {
    need(/^[A-Za-z0-9._:/#-]{2,80}$/.test(r), `Invalid evidence reference ${pyRepr(r)}`);
    if (!look(r)) {
      ctx.store.put("evidence", {
        ref: r,
        assessment_id: a.assessment_id,
        question_id: qid,
        submitted_by: ctx.user.id,
        reviewed_by: null,
        review_status: "pending",
        label: "User-asserted (pending review)",
      });
    }
  }
  asm.responses[qid] = {
    answer: a.answer,
    evidence_refs: refs,
    notes: redact(a.notes || "").text.slice(0, 1000),
    answered_by: ctx.user.id,
    answered_at: ctx.store.runtime.utcnow(),
  };
  asm.trace_ids ??= [];
  if (!asm.trace_ids.includes(ctx.traceId)) asm.trace_ids.push(ctx.traceId);
  const remaining = asm.questions.filter((q) => !(q in asm.responses));
  if (!remaining.length) asm.status = "completed";
  ctx.store.put("assessments", asm);
  return {
    status: "recorded" as const,
    question_id: qid,
    answer: a.answer,
    evidence_refs: refs,
    evidence_status: "User-asserted",
    remaining: remaining.length,
    assessment_status: asm.status,
  };
}

// --------------------------------------------------------------------------- 7 identify_gaps
function identifyGaps(ctx: ToolContext, a: { assessment_id: string; as_of?: string | null }): gapsMod.GapResult {
  const asm = getAssessment(ctx, a.assessment_id);
  return gapsMod.identifyGaps(asm, evidenceLookup(ctx), a.as_of || ctx.store.runtime.today());
}

// --------------------------------------------------------------------------- 8 recommend_controls
const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

function recommendControls(
  ctx: ToolContext,
  a: { assessment_id?: string | null; profile?: Loose | null; limit?: number },
): { basis: string; assessment_id?: string; tier?: string; controls: RecommendedControlOut[] } {
  const limit = a.limit ?? 10;
  if (a.assessment_id) {
    need(
      (ROLE_RANK[ctx.user.role] ?? -1) >= (ROLE_RANK["viewer"] ?? 1),
      "Assessment data requires an authenticated role.",
    );
    const g = identifyGaps(ctx, { assessment_id: a.assessment_id });
    const recs = gapsMod.recommendControlsFromGaps(g.gaps, limit);
    return {
      basis: "gap analysis",
      assessment_id: a.assessment_id,
      controls: recs as unknown as RecommendedControlOut[],
    };
  }
  need(a.profile && typeof a.profile === "object", "assessment_id or profile is required");
  const risk = calculateRiskTier(ctx, { profile: a.profile });
  const qs = applicableQuestions(a.profile as Profile, risk.tier, risk.required_modules);
  const seen = new Set<string>();
  const recs: RecommendedControlOut[] = [];
  for (const q of qs) {
    for (const cid of q.controls) {
      if (seen.has(cid)) continue;
      seen.add(cid);
      const c = getControl(cid);
      if (!c) continue;
      recs.push({
        id: cid,
        title: c.title,
        priority: c.priority,
        owner_role: c.owner_role,
        mappings: (c.mappings ?? {}) as Loose,
        related_questions: [q.id],
      });
    }
  }
  recs.sort(
    (x, y) =>
      PRIORITY_ORDER.indexOf(x.priority) - PRIORITY_ORDER.indexOf(y.priority) ||
      (x.id < y.id ? -1 : x.id > y.id ? 1 : 0),
  );
  return {
    basis: "profile and preliminary risk tier (Inferred)",
    tier: risk.tier,
    controls: recs.slice(0, limit),
  };
}

// --------------------------------------------------------------------------- 9 create_remediation_task
function createRemediationTask(
  ctx: ToolContext,
  a: {
    assessment_id: string;
    gap_ids?: string[] | null;
    severities?: string[] | null;
    confirmed?: unknown;
  },
):
  | { status: "confirmation_required"; preview: RemediationPreview[]; message: string }
  | { status: "created"; task_ids: string[]; count: number } {
  const g = identifyGaps(ctx, { assessment_id: a.assessment_id });
  const selected = g.gaps.filter(
    (x) =>
      (!a.gap_ids || !a.gap_ids.length || a.gap_ids.includes(x.gap_id)) &&
      (!a.severities || !a.severities.length || a.severities.includes(x.severity)),
  );
  need(selected.length, "No matching gaps to create tasks for.");
  const preview: RemediationPreview[] = selected.map((x) => ({
    gap_id: x.gap_id,
    title: x.recommended_action,
    controls: x.controls,
    owner_role: x.owner_role,
    due_date: x.due_date,
    severity: x.severity,
  }));
  if (a.confirmed !== true) {
    return {
      status: "confirmation_required",
      preview,
      message: `Confirm to create ${preview.length} remediation task(s). Nothing has been created yet.`,
    };
  }
  const created: string[] = [];
  for (const p of preview) {
    const t = ctx.store.put("tasks", {
      ...p,
      assessment_id: a.assessment_id,
      status: "open",
      created_by: ctx.user.id,
      confirmed_by: ctx.user.id,
      source: "AEGIS Agent gap analysis",
    });
    created.push(t.id);
  }
  return { status: "created", task_ids: created, count: created.length };
}

// --------------------------------------------------------------------------- 10 generate_report
function generateReport(
  ctx: ToolContext,
  a: {
    assessment_id: string;
    formats?: string[] | null;
    out_dir?: string | null;
    synthetic?: boolean;
    as_of?: string | null;
    basename?: string | null;
  },
) {
  const asm = getAssessment(ctx, a.assessment_id);
  const system = asm.system_id ? ctx.store.get("systems", asm.system_id) : null;
  const g = identifyGaps(ctx, { assessment_id: a.assessment_id, as_of: a.as_of ?? null });
  // Python compares against {assessment_id, system_id}, which contains None when there is no system.
  const resources = new Set<string | null>([a.assessment_id, asm.system_id ?? null]);
  const apprs = ctx.store
    .list("approvals")
    .filter(
      (x) =>
        resources.has(x.resource ?? null) ||
        (x.payload ?? {})["assessment_id"] === a.assessment_id,
    );
  const traceIds = new Set(asm.trace_ids ?? []);
  const trace: AuditTraceRow[] = ctx.audit.records
    .filter((r) => traceIds.has(r.trace_id) || resources.has(r.resource ?? null))
    .map((r) => ({
      id: r.id,
      ts: r.ts,
      trace_id: r.trace_id,
      action: r.action,
      actor: r.actor,
      outcome: r.outcome,
    }));
  const rid = ctx.store.newId("reports");
  let advice: AdviseResult | null = null;
  try {
    advice = advise(shieldProfile(asm.profile ?? {}, asm.risk?.tier ?? null), {
      today: ctx.store.runtime.today(),
    });
  } catch {
    advice = null;
  }
  const data = buildReportData({
    system: system ?? {},
    assessment: asm,
    gapResult: g,
    approvals: apprs,
    auditTrace: trace,
    preparedBy: `${userDisplay(ctx.user)} via AEGIS Agent`,
    generatedAt: ctx.store.runtime.utcnow(),
    synthetic: a.synthetic ?? false,
    reportId: rid,
    shieldAdvice: advice,
  });
  const fmts = a.formats && a.formats.length ? a.formats : [...REPORT_FORMATS];
  need(
    fmts.every((f) => (REPORT_FORMATS as readonly string[]).includes(f)),
    "formats must be md/pdf/csv/json",
  );
  const target = a.out_dir || `${ctx.store.root}/reports_out/${rid}`;
  const res = exportReport(data, target, fmts, a.basename ?? null);
  ctx.store.put("reports", {
    id: rid,
    assessment_id: a.assessment_id,
    status: "draft",
    paths: res.paths,
    errors: res.errors,
    created_by: ctx.user.id,
    synthetic: a.synthetic ?? false,
    artifacts: { md: res.markdown, csv: res.csv, json: res.json, pdf_title: res.pdfTitle },
  });
  return {
    status: "draft" as const,
    report_id: rid,
    paths: res.paths,
    errors: res.errors,
    summary: g.summary,
    markdown: res.markdown,
  };
}

// --------------------------------------------------------------------------- 11 search_runtime_logs
function searchRuntimeLogs(
  ctx: ToolContext,
  a: { query?: string; system_id?: string | null; decision?: string | null; limit?: number },
) {
  const q = (a.query || "").toLowerCase().split(/\s+/).filter(Boolean);
  let hits: unknown[] = [];
  for (const rec of ctx.store.runtimeLogs) {
    const blob = pyDumps(rec).toLowerCase();
    if (q.length && !q.every((t) => blob.includes(t))) continue;
    if (a.system_id && !blob.includes(a.system_id)) continue;
    const dec = String(rec["decision"] ?? rec["outcome"] ?? "").toLowerCase();
    if (a.decision && dec !== a.decision.toLowerCase()) continue;
    hits.push(redactObj(rec, 300));
  }
  hits = hits.slice(-(a.limit ?? 50));
  return {
    count: hits.length,
    records: hits,
    sources: ctx.store.runtimeLogs.length ? [`${ctx.store.root}/runtime_logs/decisions.jsonl`] : [],
    note: hits.length ? null : "No runtime log records matched (or no runtime logs are configured).",
  };
}

// --------------------------------------------------------------------------- 12 draft_runtime_policy
/** Agent intake tool keyword -> Shield tool name + operation. */
const TOOL_HINTS: Record<string, [string, string]> = {
  crm: ["crm.lookup_customer", "read"],
  knowledge_base: ["kb.search", "read"],
  database: ["db.query", "read"],
  web_search: ["web.search", "read"],
  ticketing: ["ticket.update", "write"],
  calendar: ["calendar.schedule", "write"],
  email: ["email.send_reply", "external_send"],
  messaging: ["message.send", "external_send"],
  payments: ["payments.refund", "payment"],
  code_repository: ["repo.push_commit", "write"],
  hr_system: ["ats.read_candidates", "read"],
  file_storage: ["files.read", "read"],
  code_execution: ["code.execute", "write"],
};
const ENV_MAP: Record<string, string> = {
  idea: "dev",
  development: "dev",
  pilot: "staging",
  production: "production",
};

/** Translate an agent intake profile into the AEGIS Shield advisor profile. */
export function shieldProfile(profile: Loose, tier: string | null = null): Loose {
  const p = profile ?? {};
  const tools = ((p["tools"] as unknown[] | undefined) ?? []).map((t) => {
    const hint = TOOL_HINTS[String(t)];
    return hint ? { name: hint[0], description: `${String(t)} (${hint[1]})` } : { name: String(t) };
  });
  const out: Loose = {
    app_name: p["name"],
    purpose: p["purpose"],
    tools,
    data_sensitivity: p["data_sensitivity"],
    autonomy: p["autonomy"],
    affected_parties: p["affected_parties"],
    risk_tier: tier,
  };
  const env = p["environment"];
  if (typeof env === "string" && env in ENV_MAP) out["environment"] = ENV_MAP[env];
  if (p["vendor_model"]) out["vendor"] = "Third-party model provider (to be confirmed)";
  if (p["autonomy"] === "acts_with_approval") out["human_approval_model"] = "high_impact_only";
  return Object.fromEntries(
    Object.entries(out).filter(
      ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && !v.length),
    ),
  );
}

function draftRuntimePolicy(
  ctx: ToolContext,
  a: { assessment_id?: string | null; profile?: Loose | null },
): DraftPolicyResult {
  let prof: Loose = { ...(a.profile ?? {}) };
  let tier: string | null = null;
  if (a.assessment_id) {
    const asm = getAssessment(ctx, a.assessment_id);
    prof = { ...(asm.profile ?? {}) };
    tier = asm.risk?.tier ?? null;
  }
  need(Object.keys(prof).length, "assessment_id or profile is required");
  const fallback = applicableGuardrails(prof as Profile).map((g) => ({
    id: g.id,
    title: g.title,
    controls: g.controls,
  }));
  let advice: AdviseResult;
  try {
    advice = advise(shieldProfile(prof, tier), { today: ctx.store.runtime.today() });
  } catch (exc) {
    return {
      status: "unavailable",
      guardrails: fallback,
      message: `AEGIS Shield advisor failed (${exc instanceof Error ? exc.name : "Error"}); no policy drafted.`,
    };
  }
  const policy = (advice.policy ?? null) as unknown as Loose | null;
  const rec = ctx.store.put("policies", {
    status: "draft",
    environment: "non-production",
    mode: "monitor",
    assessment_id: a.assessment_id ?? null,
    policy,
    created_by: ctx.user.id,
    citations: advice.citations ?? [],
  } satisfies NewRecord<PolicyRecord>);
  const errors = [...(advice.policy_validation?.errors ?? [])];
  if (!policy) errors.push("advisor returned no policy");
  return {
    status: "draft",
    policy_id: rec.id,
    mode: "monitor",
    environment: "non-production",
    validation_errors: errors,
    guardrails: fallback,
    advice,
    message:
      "Draft runtime policy created by AEGIS Shield (status: draft, observe/monitor mode, not active). " +
      "Activating it in production requires human approval.",
  };
}

// --------------------------------------------------------------------------- 13 request_human_approval
function requestHumanApproval(
  ctx: ToolContext,
  a: { action: string; resource_id?: string | null; payload?: Loose | null; reason?: string },
): ApprovalToolResult {
  need(
    a.action in SENSITIVE_ACTIONS,
    `action must be one of [${Object.keys(SENSITIVE_ACTIONS)
      .sort()
      .map((x) => `'${x}'`)
      .join(", ")}]`,
  );
  const rec = approvalsSvc.createApproval(
    ctx.store,
    ctx.audit,
    ctx.user,
    a.action,
    a.resource_id ?? null,
    a.payload ?? null,
    redact(a.reason || "").text,
    { traceId: ctx.traceId, sessionId: ctx.sessionId },
  );
  return {
    status: "pending",
    approval_id: rec.approval_id,
    type: a.action,
    resource: a.resource_id ?? null,
    controls: rec.controls,
    deduplicated: rec.deduplicated ?? false,
    message:
      `Pending approval ${rec.approval_id} created for: ${SENSITIVE_ACTIONS[a.action] ?? a.action}. It will not take ` +
      "effect unless a different user with an approver role approves it.",
  };
}

// --------------------------------------------------------------------------- 14 export_evidence_pack
function exportEvidencePack(
  ctx: ToolContext,
  a: { assessment_id: string; approval_id?: string | null; out_dir?: string | null },
):
  | { status: "pending_approval"; approval_id: string; message: string; controls: string[] }
  | { status: "exported"; path: string; evidence_items: number; export_id: string } {
  const asm = getAssessment(ctx, a.assessment_id);
  if (!a.approval_id) {
    const res = requestHumanApproval(ctx, {
      action: "export_sensitive_evidence",
      resource_id: a.assessment_id,
      payload: { assessment_id: a.assessment_id },
      reason: "Export evidence pack for assessment " + a.assessment_id,
    });
    return {
      status: "pending_approval",
      approval_id: res.approval_id,
      message: res.message,
      controls: res.controls,
    };
  }
  let appr;
  try {
    appr = approvalsSvc.consumeApproval(
      ctx.store,
      a.approval_id,
      "export_sensitive_evidence",
      a.assessment_id,
      ctx.user,
    );
  } catch (exc) {
    if (exc instanceof approvalsSvc.ApprovalError) throw new ToolPermissionError(exc.message);
    throw exc;
  }
  const g = identifyGaps(ctx, { assessment_id: a.assessment_id });
  const ev = ctx.store.list("evidence").filter((e) => e.assessment_id === a.assessment_id);
  const pack = {
    assessment_id: a.assessment_id,
    system_id: asm.system_id ?? null,
    approval_id: a.approval_id,
    approved_by: appr.resolved_by ?? null,
    exported_by: ctx.user.id,
    exported_at: ctx.store.runtime.utcnow(),
    evidence: ev,
    findings: g.findings,
    risk: asm.risk ?? null,
    disclaimer:
      "Evidence pack for audit preparation. It does not constitute a certification or legal opinion.",
  };
  const target = a.out_dir || `${ctx.store.root}/exports_out/${a.approval_id}`;
  const path = `${target}/evidence_pack_${a.assessment_id}.json`;
  const rec = ctx.store.put("exports", {
    assessment_id: a.assessment_id,
    approval_id: a.approval_id,
    path,
    exported_by: ctx.user.id,
    pack: pack as unknown as Loose,
  });
  return { status: "exported", path, evidence_items: ev.length, export_id: rec.id };
}

// --------------------------------------------------------------------------- registry
export interface ToolSignatures {
  search_aegis_knowledge: [Parameters<typeof searchAegisKnowledge>[1], KnowledgeToolResult];
  search_ai_inventory: [Parameters<typeof searchAiInventory>[1], ReturnType<typeof searchAiInventory>];
  create_ai_system_record: [
    Parameters<typeof createAiSystemRecord>[1],
    ReturnType<typeof createAiSystemRecord>,
  ];
  start_assessment: [Parameters<typeof startAssessment>[1], ReturnType<typeof startAssessment>];
  submit_assessment_response: [
    Parameters<typeof submitAssessmentResponse>[1],
    ReturnType<typeof submitAssessmentResponse>,
  ];
  calculate_risk_tier: [Parameters<typeof calculateRiskTier>[1], RiskToolResult];
  identify_gaps: [Parameters<typeof identifyGaps>[1], gapsMod.GapResult];
  recommend_controls: [Parameters<typeof recommendControls>[1], ReturnType<typeof recommendControls>];
  create_remediation_task: [
    Parameters<typeof createRemediationTask>[1],
    ReturnType<typeof createRemediationTask>,
  ];
  generate_report: [Parameters<typeof generateReport>[1], ReturnType<typeof generateReport>];
  search_runtime_logs: [Parameters<typeof searchRuntimeLogs>[1], ReturnType<typeof searchRuntimeLogs>];
  draft_runtime_policy: [Parameters<typeof draftRuntimePolicy>[1], DraftPolicyResult];
  request_human_approval: [Parameters<typeof requestHumanApproval>[1], ApprovalToolResult];
  export_evidence_pack: [
    Parameters<typeof exportEvidencePack>[1],
    ReturnType<typeof exportEvidencePack>,
  ];
}
export type ToolName = keyof ToolSignatures;

export interface ToolSpec {
  name: ToolName;
  permission: string;
  requiresApproval: boolean;
  description: string;
  minRole: string;
  fn: (ctx: ToolContext, args: never) => unknown;
}

function spec<N extends ToolName>(
  name: N,
  permission: string,
  requiresApproval: boolean,
  fn: (ctx: ToolContext, args: ToolSignatures[N][0]) => ToolSignatures[N][1],
  description: string,
  minRole = "viewer",
): ToolSpec {
  return { name, permission, requiresApproval, fn: fn as ToolSpec["fn"], description, minRole };
}

export const TOOL_REGISTRY: Record<ToolName, ToolSpec> = Object.fromEntries(
  [
    spec("search_aegis_knowledge", READ, false, searchAegisKnowledge,
      "BM25 retrieval over controls, assessment templates, policy/industry packs and compliance mapping docs.", "anonymous"),
    spec("search_ai_inventory", READ, false, searchAiInventory, "Search AI system records.", "viewer"),
    spec("create_ai_system_record", CREATE_DRAFT, false, createAiSystemRecord,
      "Create a draft AI system record.", "assessor"),
    spec("start_assessment", CREATE_DRAFT, false, startAssessment,
      "Start a use-case assessment (risk tier + applicable modules).", "assessor"),
    spec("submit_assessment_response", CREATE_DRAFT, false, submitAssessmentResponse,
      "Record an answer and evidence references (User-asserted).", "assessor"),
    spec("calculate_risk_tier", COMPUTE, false, calculateRiskTier,
      "Preliminary, explainable risk tier (Inferred; requires human confirmation).", "anonymous"),
    spec("identify_gaps", COMPUTE, false, identifyGaps,
      "Classify findings by evidence status and severity; owners and due dates.", "viewer"),
    spec("recommend_controls", COMPUTE, false, recommendControls,
      "Recommend AEGIS controls from gaps or from a profile.", "anonymous"),
    spec("create_remediation_task", WRITE_CONFIRM, false, createRemediationTask,
      "Create remediation tasks (requires explicit user confirmation).", "assessor"),
    spec("generate_report", CREATE_DRAFT, false, generateReport,
      "Generate a draft readiness report (Markdown, PDF, CSV gap register, JSON).", "assessor"),
    spec("search_runtime_logs", READ, false, searchRuntimeLogs,
      "Search runtime guardrail decision logs (redacted).", "assessor"),
    spec("draft_runtime_policy", CREATE_DRAFT, false, draftRuntimePolicy,
      "Draft a runtime guardrail policy (draft, observe mode, not active) via AEGIS Shield.", "assessor"),
    spec("request_human_approval", CREATE_DRAFT, false, requestHumanApproval,
      "Create a pending approval for a sensitive action (never self-executes).", "assessor"),
    spec("export_evidence_pack", APPROVAL_REQUIRED, true, exportEvidencePack,
      "Export an evidence pack — only with an approved, single-use approval.", "assessor"),
  ].map((s) => [s.name, s]),
) as Record<ToolName, ToolSpec>;

export function checkPermission(user: User, s: ToolSpec): string | null {
  if (!(ROLE_PERMISSIONS[user.role]?.has(s.permission) ?? false)) {
    return `role '${user.role}' may not use ${s.permission} tools`;
  }
  if ((ROLE_RANK[user.role] ?? -1) < (ROLE_RANK[s.minRole] ?? 0)) {
    return `${s.name} requires role '${s.minRole}' or higher (you are '${user.role}')`;
  }
  return null;
}

const SUMMARY_KEYS = [
  "status",
  "assessment_id",
  "approval_id",
  "report_id",
  "policy_id",
  "task_ids",
  "count",
  "band",
  "tier",
];

/** Run a tool with RBAC and audit logging. */
export function invoke<N extends ToolName>(
  ctx: ToolContext,
  name: N,
  args: ToolSignatures[N][0],
): ToolSignatures[N][1] {
  const s = TOOL_REGISTRY[name] as ToolSpec | undefined;
  if (!s) throw new ToolInputError(`Unknown tool ${String(name)}`);
  const kwargs = args as unknown as Loose;
  const safeInputs = redactObj(kwargs);
  const denied = checkPermission(ctx.user, s);
  const call = { tool: s.name, permission: s.permission, trace_id: ctx.traceId };
  if (denied) {
    ctx.audit.append(
      `agent.tool.${s.name}`,
      ctx.user.id,
      { inputs: safeInputs, permission: s.permission, role: ctx.user.role, reason: denied },
      { traceId: ctx.traceId, outcome: "denied" },
    );
    ctx.calls.push({ ...call, outcome: "denied" });
    throw new ToolPermissionError(denied);
  }
  let result: unknown;
  try {
    result = s.fn(ctx, args as never);
  } catch (exc) {
    const known =
      exc instanceof ToolInputError ||
      exc instanceof ToolPermissionError ||
      exc instanceof approvalsSvc.ApprovalError;
    const outcome = !known ? "error" : exc instanceof ToolInputError ? "rejected" : "denied";
    const msg = exc instanceof Error ? exc.message : String(exc);
    ctx.audit.append(
      `agent.tool.${s.name}`,
      ctx.user.id,
      {
        inputs: safeInputs,
        permission: s.permission,
        error: known ? msg.slice(0, 300) : `${exc instanceof Error ? exc.name : "Error"}: ${msg.slice(0, 200)}`,
      },
      { traceId: ctx.traceId, outcome },
    );
    ctx.calls.push({ ...call, outcome });
    throw exc;
  }
  const res = (result && typeof result === "object" ? result : {}) as Loose;
  const summary = Object.fromEntries(SUMMARY_KEYS.filter((k) => k in res).map((k) => [k, res[k]]));
  ctx.audit.append(
    `agent.tool.${s.name}`,
    ctx.user.id,
    { inputs: safeInputs, permission: s.permission, result: redactObj(summary) },
    {
      traceId: ctx.traceId,
      resource: (res["assessment_id"] as string | undefined) || (kwargs["assessment_id"] as string | undefined) || null,
    },
  );
  ctx.calls.push({ ...call, outcome: "success" });
  return result as ToolSignatures[N][1];
}

export function knownControl(cid: string): boolean {
  return getControl(cid) !== undefined;
}

export { controlCitation };
