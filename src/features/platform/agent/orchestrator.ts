/**
 * VERITRAIL Agent orchestrator for every role — browser port of veritrail_agent/orchestrator.py.
 *
 *   const agent = new VeritrailAgent();
 *   agent.handle("Which controls map to EU AI Act Art. 14?", "s1", { id: "u1", role: "assessor", name: "Asha Rao" });
 *
 * Intent routing → least-privilege tools (tools.ts) → templated, cited composition. Deterministic:
 * no LLM, no network. Viewer behaviour matches the public Ask VERITRAIL engine
 * (src/features/site/engines/ask-veritrail); assessors run guided assessments, drafts and approval
 * requests; approvers/admins resolve approvals outside the chat (resolveApproval).
 */
import {
  EVIDENCE_STATUS_DEFINITIONS,
  NO_SOURCE_MESSAGE,
  STANDARD_DISCLAIMER,
  controlCitation,
  controlLibrary,
  controls as allControls,
  getControl,
  maturityTemplate,
  pillars,
  type VeritrailControl,
  type EvidenceStatus,
  type FrameworkKey,
} from "@/features/site/content";
import {
  AnswerBuilder,
  type AnswerSource,
  type Claim,
  type Cta,
  type PendingApproval,
  type RequiredApproval,
} from "@/features/site/engines/ask-veritrail/compose";
import {
  CONTROL_ID_RE,
  FRAMEWORK_LABELS,
  MATURITY_QID_RE,
  UC_QID_RE,
  controlsForFramework,
  controlsForFrameworkRef,
  detectFrameworks,
  getIndex,
  inGovernanceScope,
  industryPacks,
  maturityQuestions,
  parseFrameworkRefs,
  policyPacks,
  realControlIds,
  tokenize,
} from "@/features/site/engines/ask-veritrail/knowledge";
import {
  ANNEX_III_LIKE,
  allQuestions,
  answerOptions,
  applicableQuestions,
  extractProfile,
  getQuestion,
  intakeField,
  intakeFields,
  parseAnswer,
  parseEvidenceRefs,
  parseFieldAssignments,
  parseFieldValue,
  pyValue,
  type Profile,
  type ProfileValue,
  type UseCaseQuestion,
} from "@/features/site/engines/ask-veritrail/question-bank";
import {
  asksComplianceDetermination,
  asksLegalClassification,
  detectApprovalBypass,
  detectInjection,
  findProhibitedClaims,
  redact,
} from "@/features/site/engines/ask-veritrail/safety";
import type { AuditRecord } from "../audit";
import * as approvalsSvc from "./approvals";
import { AgentAuditLog } from "./audit-log";
import {
  CREATE_DRAFT,
  CTA_ASSESSMENT,
  CTA_BASELINE,
  CTA_SHIELD,
  EVIDENCE_REVIEWER_ROLES,
  ROLE_PERMISSIONS,
  SENSITIVE_ACTION_CONTROLS,
  SENSITIVE_ACTIONS,
  coerceUser,
  type User,
  type UserInput,
} from "./config";
import { NOT_APPLICABLE, polish, type LlmMeta } from "./llm";
import { cmpStr, pySlice, pyStr } from "./py";
import { systemRuntime, type AgentRuntime } from "./runtime";
import { Store, validId, type ApprovalRecord, type EvidenceRecord, type SessionRecord } from "./store";
import {
  ToolInputError,
  ToolPermissionError,
  invoke,
  selectModulesFull,
  type KnowledgeToolHit,
  type KnowledgeToolResult,
  type ToolCall,
  type ToolContext,
  type ToolName,
  type ToolSignatures,
} from "./tools";

type Loose = Record<string, unknown>;

const GUIDED_STATES = new Set(["intake", "tier_review", "questions"]);
const VERSION = controlLibrary.version;
const REG_NOTE =
  "Regulatory applicability timelines must be verified against the current Official Journal text and any " +
  "amendments; VERITRAIL has not verified post-2025 changes.";
const NO_RECORD = "no assessment response or reviewed evidence on record in this session";
const MISSING: EvidenceStatus = "Missing evidence";
const INFERRED: EvidenceStatus = "Inferred";
const USER_ASSERTED: EvidenceStatus = "User-asserted";
const DESCRIBE_PROMPT =
  "Describe the use case in a few sentences: what it does, who uses it and is affected, what " +
  "data and tools it uses, whether it can take actions, and which model/vendor it relies on.";
/** The Python agent points to its admin CLI here; in the browser approvals are resolved in the console. */
const BYPASS_NEXT_ACTION =
  "A named approver with the approver role must approve or reject the pending item in the VERITRAIL approvals workflow; it cannot be bypassed from this chat.";

// --------------------------------------------------------------------------- intent patterns
const rx = (p: string) => new RegExp(p, "i");
const START_RE = rx(
  String.raw`\b(assess|assessment|evaluate|review|triage|onboard|register)\b.{0,40}?\b(use[- ]?case|ai system|system|agent|model|chatbot|copilot|application|app|tool)\b|` +
    String.raw`\b(start|begin|new|run)\b.{0,20}\b(assessment|intake|use[- ]?case)\b|^\s*(assess|start assessment)\b|` +
    String.raw`\bwe (want|plan|are planning|would like) to (deploy|launch|build|use)\b`,
);
const GAP_RE = rx(String.raw`\b(gap analysis|gaps?|gap register|what are we missing|findings)\b`);
const REPORT_RE = rx(
  String.raw`\b(generate|create|produce|export|download|build|give me)\b.{0,30}\b(report|pdf|csv|json|deliverable)\b|^\s*report\s*$`,
);
const TASK_RE = rx(
  String.raw`\b(create|open|raise|log|add)\b.{0,30}\b(remediation\s+)?(tasks?|tickets?|actions?)\b`,
);
const POLICY_RE = rx(
  String.raw`\b(draft|generate|create|write|propose|suggest)\b.{0,40}\b(runtime\s+|guardrail\s+|shield\s+)?(policy|policies|guardrails?)\b`,
);
const LOGS_RE = rx(
  String.raw`\b(runtime|guardrail|shield|policy)\s+(logs?|decisions?|events?|blocks?)\b|\bblocked\s+(requests?|prompts?)\b`,
);
const INVENTORY_RE = rx(
  String.raw`\b(list|show|search|find|display)\b.{0,25}\b(ai\s+)?(systems|inventory|records|use cases)\b|` +
    String.raw`\b(which|what|how many)\s+(ai\s+)?(systems|use cases)\s+(do we have|are (registered|in the inventory|on record))`,
);
const APPROVALS_RE = rx(
  String.raw`\b(pending|open|my|list|show|status of)\b.{0,20}\bapprovals?\b|\bapr_[a-z0-9]+\b.*\bstatus\b`,
);
const TIERQ_RE = rx(
  String.raw`\b(what|which)\b.{0,20}\b(risk\s+)?tier\b|\b(is|are)\s+(our|my|this|the)\b.{0,40}\b(high[- ]risk|low[- ]risk|risky)\b|\bhow risky\b`,
);
const HELP_RE = rx(String.raw`^\s*(hi|hello|hey|help|what can you do|who are you|menu|start|\?)\W*\s*$`);
const QUESTION_RE = rx(String.raw`^\s*(how|what|why|when|which|who|where|should|is|are|does|do|did)\b`);
const LIBRARY_RE = rx(
  String.raw`\bhow many (veritrail )?controls\b|\b(list|show|what are)\b.{0,15}\b(all\s+)?(the\s+)?(veritrail\s+)?(controls|pillars)\b|` +
    String.raw`\b(veritrail\s+)?(control\s+library|pillars)\b.{0,20}\b(overview|structure)?\s*\??$`,
);
const PACKS_RE = rx(
  String.raw`\b(which|what|list|show)\b.{0,25}\b(policy|industry|runtime)\s+packs\b|\b(policy|industry|runtime)\s+packs?\b.{0,20}\b(exist|available|are there|do you have)\b`,
);
const MATURITY_RE = rx(
  String.raw`\b(rate|score|assess|measure|benchmark|check|what is|what's|evaluate)\b.{0,25}\b(our|my|the organi[sz]ation'?s?)\b.{0,25}\bmaturity\b|` +
    String.raw`\bhow mature\b|\bmaturity (self[- ])?assessment\b|\bmaturity levels?\b`,
);
const USECASE_CONTROLS_RE = rx(
  String.raw`\b(what|which)\b.{0,30}\b(veritrail\s+)?(controls?|guardrails?|safeguards?|governance\s+controls?)\b.{0,50}` +
    String.raw`\b(apply|applies|need|needed|required|require|should|recommend\w*|for)\b.{0,80}` +
    String.raw`\b(agents?|assistants?|chatbots?|copilots?|bots?|models?|systems?|tools?|use[- ]?cases?|apps?|applications?)\b|` +
    String.raw`\b(recommend|suggest|list)\b.{0,20}\b(controls?|guardrails?)\b.{0,20}\bfor\s+(an?|our|the|my)\b`,
);
const CANCEL_RE = rx(String.raw`^\s*(cancel|stop|quit|exit|abort|restart|reset)\b`);
const AFFIRM_RE = rx(
  String.raw`^\s*(y|yes|confirm|confirmed|go ahead|proceed|ok|okay|do it|continue|start|begin|sure)\b`,
);
const NEGATE_RE = rx(String.raw`^\s*(n|no|cancel|don't|do not|stop|abort)\b`);
const SKIP_RE = rx(String.raw`^\s*(skip|pass|next)\s*$`);
const REMAINING_RE = rx(
  String.raw`\b(all\s+)?remaining\b.{0,15}?[:=]?\s*(implemented|partial|not[ _]implemented|unknown|not[ _]applicable)\b`,
);
const BULK_RE = /(UC-[A-Z]{2,4}-Q\d{1,2})\s*[:=]\s*([^\n;]+)/gi;
const FRAMEWORK_INTENT_RE = rx(
  String.raw`\b(map|maps|mapped|mapping|mappings|crosswalk|correspond|align|alignment|relate)\b|` +
    String.raw`\bwhich (veritrail )?controls?\b.{0,40}\b(eu ai act|iso|nist|article|art\.|annex|govern|measure|manage|clause)\b`,
);

const SENSITIVE_PATTERNS: Array<[string, RegExp]> = [
  [
    "change_risk_tier",
    rx(
      String.raw`\b(change|lower|reduce|raise|increase|downgrade|upgrade|set|reclassify|move|update|override|drop)\b.{0,40}\b(risk[- ])?tier\b|` +
        String.raw`\b(classify|mark|treat|record|re-?classify|label)\b.{0,30}\bas\s+(low|medium|minimal)[- ]risk\b`,
    ),
  ],
  ["confirm_risk_tier", rx(String.raw`\bconfirm\b.{0,20}\b(risk[- ])?tier\b`)],
  [
    "approve_exception",
    rx(
      String.raw`\b(approve|grant|accept|sign off|waive|record)\b.{0,40}\b(exception|waiver|risk acceptance|deviation)\b|\baccept the risk\b`,
    ),
  ],
  [
    "activate_runtime_policy",
    rx(
      String.raw`\b(activate|enable|deploy|push|turn on|switch on|enforce|promote|apply|roll out)\b.{0,50}\b(policy|policies|guardrails?)\b.{0,40}\b(production|prod|live|enforce|enforcement)\b|` +
        String.raw`\b(switch|move|set)\b.{0,40}\b(enforce|enforcement)\s+mode\b|\bto production\b.{0,30}\bpolicy\b`,
    ),
  ],
  ["export_sensitive_evidence", rx(String.raw`\b(export|download|send|share|extract)\b.{0,40}\bevidence\b`)],
  [
    "send_external_communication",
    rx(
      String.raw`\b(send|email|e-mail|forward|submit|share|publish|post)\s+(the\s+|this\s+|our\s+|my\s+|a\s+|that\s+)?(readiness\s+|final\s+|draft\s+)?` +
        String.raw`(report|results|assessment|findings|summary|letter|notice|message|notification|email|update|it|this|that|gap register|statement)\b` +
        String.raw`.{0,40}\b(to|with)\s+(the\s+|our\s+|a\s+|all\s+)?(regulators?|customers?|auditors?|supervisory\s+authorit(y|ies)|authorit(y|ies)|external\s+\w+|clients?|press|board|partners?|vendors?)\b|` +
        String.raw`\bnotify\s+(the\s+|our\s+|all\s+)?(regulators?|customers?|authorit(y|ies)|supervisory|clients?|data subjects)\b|` +
        String.raw`\b(send|e-?mail|forward)\b.{0,40}\bto\s+\S+@\S+`,
    ),
  ],
];

const PRIORITY_ORDER = ["critical", "high", "medium", "low"];
const PRIORITY_PTS: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
const THEME: Record<string, number> = { EI: 0, IS: 1, SE: 2, GL: 3, AO: 4 };
const STATUS_RANK = ["Critical gap", "Missing evidence", "Inferred", "User-asserted", "Verified"];

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function control(cid: string): VeritrailControl {
  const c = getControl(cid);
  if (!c) throw new Error(`Unknown VERITRAIL control ID: ${cid}`);
  return c;
}

/** Python f-string formatting of a value (lists as repr, booleans as True/False). */
function pyFormat(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => (typeof x === "string" ? `'${x}'` : pyFormat(x))).join(", ")}]`;
  return pyStr(v);
}

function tierFromText(text: string): string | null {
  const m = /\b(prohibited(?:[- ]review)?|high[- ]risk|high-risk|limited|minimal)\b/i.exec(text || "");
  if (!m?.[1]) return null;
  const t = m[1].toLowerCase();
  if (t.startsWith("prohibited")) return "Prohibited";
  if (t === "high-risk" || t === "high risk") return "High-risk";
  if (t === "limited") return "Limited";
  if (t === "minimal") return "Minimal";
  return null;
}

// --------------------------------------------------------------------------- response
class AgentAnswer extends AnswerBuilder {
  data: Loose = {};
  llm: LlmMeta = { ...NOT_APPLICABLE };
  polishable = false;
}

export type ResponseSource =
  | Exclude<AnswerSource, { key: string }>
  | Omit<Extract<AnswerSource, { key: string }>, "key">;

/** The agent's turn result (veritrail_agent Response.to_dict plus `refused` / `evidence_status`). */
export interface AgentResponse {
  session_id: string;
  trace_id: string;
  intent: string;
  state: string;
  answer: string;
  message: string;
  markdown: string;
  claims: Claim[];
  sources: ResponseSource[];
  citations: string[];
  missing_evidence: string[];
  next_actions: string[];
  required_approvals: RequiredApproval[];
  pending_approvals: Array<{
    approval_id: string | null;
    type: string | null;
    status: string | null;
    resource: string | null;
    message: string | null;
  }>;
  cta: Cta | null;
  clarifying_question: string | null;
  confidence: number | null;
  confidence_band: string | null;
  tool_calls: ToolCall[];
  llm: LlmMeta;
  data: Loose;
  disclaimer: string;
  evidence_status_definitions: Record<string, string>;
  /** Browser additions for the UI. */
  refused: boolean;
  evidence_status?: EvidenceStatus;
}

const REFUSAL_INTENTS = new Set([
  "prompt_injection",
  "approval_bypass",
  "approval_required",
  "permission_denied",
  "out_of_scope",
  "compliance_readiness",
  "legal_classification",
  "safety_fallback",
]);

function toResponse(
  r: AgentAnswer,
  sessionId: string,
  traceId: string,
  state: string,
  calls: ToolCall[],
): AgentResponse {
  r.autoCite();
  const md = r.render();
  const out: AgentResponse = {
    session_id: sessionId,
    trace_id: traceId,
    intent: r.intent,
    state,
    answer: r.answer,
    message: md,
    markdown: md,
    claims: r.claims,
    sources: r.sources.map((s) => {
      if ("key" in s) {
        const { key: _key, ...rest } = s;
        return rest;
      }
      return s;
    }),
    citations: [...new Set(r.controlIds())].sort(),
    missing_evidence: r.missingEvidence,
    next_actions: r.nextActions,
    required_approvals: r.requiredApprovals,
    pending_approvals: r.pendingApprovals.map((a) => ({
      approval_id: a.approval_id ?? null,
      type: a.type ?? null,
      status: a.status ?? null,
      resource: a.resource ?? null,
      message: a.message ?? null,
    })),
    cta: r.cta,
    clarifying_question: r.clarifyingQuestion,
    confidence: r.confidence,
    confidence_band: r.confidenceBand,
    tool_calls: [...calls],
    llm: r.llm,
    data: r.data,
    disclaimer: STANDARD_DISCLAIMER,
    evidence_status_definitions: { ...EVIDENCE_STATUS_DEFINITIONS },
    refused: REFUSAL_INTENTS.has(r.intent),
  };
  const first = r.claims[0];
  if (first) out.evidence_status = first.evidence_status;
  return out;
}

class SessionMismatch extends Error {}

/** Evidence-review refusals (Python raises PermissionError / KeyError). */
export class ReviewError extends Error {
  override name = "PermissionError";
}

export interface AgentOptions {
  runtime?: AgentRuntime;
  /** Virtual storage root used in report/export paths. */
  root?: string;
  audit?: AuditRecord[];
}

// --------------------------------------------------------------------------- the agent
export class VeritrailAgent {
  readonly runtime: AgentRuntime;
  readonly store: Store;
  readonly audit: AgentAuditLog;

  constructor(opts: AgentOptions = {}) {
    this.runtime = opts.runtime ?? systemRuntime();
    this.store = new Store(this.runtime, opts.root);
    this.audit = new AgentAuditLog(this.runtime, opts.audit ?? []);
  }

  // ================================================================ public API
  handle(rawMessage: string, sessionId: string | null = null, userInput: UserInput = null): AgentResponse {
    const user = coerceUser(userInput);
    const traceId = this.runtime.newId("trc");
    const message = (rawMessage || "").slice(0, 4000);
    let session: SessionRecord;
    try {
      session = this.loadSession(sessionId, user);
    } catch (err) {
      if (!(err instanceof SessionMismatch)) throw err;
      this.audit.append(
        "agent.security.session_mismatch",
        user.id,
        { session_id: sessionId },
        { traceId, outcome: "denied" },
      );
      session = this.newSession(user); // fresh session; the other user's state is never exposed
    }
    const ctx: ToolContext = {
      store: this.store,
      audit: this.audit,
      user,
      traceId,
      sessionId: session.id,
      calls: [],
    };
    let resp: AgentAnswer;
    try {
      resp = this.route(message, session, ctx);
    } catch (err) {
      if (err instanceof ToolPermissionError) resp = this.denied(err.message);
      else if (err instanceof ToolInputError) {
        resp = new AgentAnswer("input_error");
        resp.answer = `I couldn't complete that: ${err.message}`;
        resp.clarifyingQuestion = "Could you provide the missing or corrected detail?";
      } else throw err;
    }
    this.maybePolish(resp);
    let out = toResponse(resp, session.id, traceId, session.state, ctx.calls);
    // Defence in depth: a deterministic answer must never carry a prohibited claim.
    if (findProhibitedClaims(out.message).length) {
      const safe = new AgentAnswer("safety_fallback");
      safe.answer =
        "I can't provide that statement. VERITRAIL reports governance readiness and evidence status; it " +
        "does not determine or certify compliance.";
      out = toResponse(safe, session.id, traceId, session.state, ctx.calls);
    }
    const redMsg = redact(message).text;
    session.transcript ??= [];
    session.transcript.push({ role: "user", text: redMsg, ts: this.runtime.utcnow(), trace_id: traceId });
    session.transcript.push({
      role: "agent",
      intent: out.intent,
      text: pySlice(redact(out.message).text, 6000),
      ts: this.runtime.utcnow(),
      trace_id: traceId,
    });
    session.transcript = session.transcript.slice(-200);
    this.store.put("sessions", session);
    this.audit.append(
      "agent.turn",
      user.id,
      {
        session_id: session.id,
        role: user.role,
        message: pySlice(redMsg, 500),
        intent: out.intent,
        state: out.state,
        tools: ctx.calls.map((c) => c.tool),
        approvals: out.pending_approvals.map((a) => a.approval_id),
        citations: out.citations,
        llm_used: out.llm.used,
      },
      { traceId, resource: session.assessment_id ?? null },
    );
    return out;
  }

  /** Programmatic tool access (UI) with the same RBAC and audit logging as agent turns. */
  callTool<N extends ToolName>(
    name: N,
    userInput: UserInput,
    args: ToolSignatures[N][0],
    sessionId: string | null = null,
  ): ToolSignatures[N][1] {
    const ctx: ToolContext = {
      store: this.store,
      audit: this.audit,
      user: coerceUser(userInput),
      traceId: this.runtime.newId("trc"),
      sessionId,
      calls: [],
    };
    return invoke(ctx, name, args);
  }

  /** Resolve a pending approval. Called by the approver UI — never by the agent itself. */
  resolveApproval(
    approvalId: string,
    decision: "approve" | "reject" | string,
    approver: UserInput,
    note = "",
  ): ApprovalRecord {
    return approvalsSvc.resolveApproval(
      this.store,
      this.audit,
      approvalId,
      decision,
      coerceUser(approver),
      note,
    );
  }

  listApprovals(status: string | null = null): ApprovalRecord[] {
    return this.store.list("approvals").filter((a) => !status || a.status === status);
  }

  /** Mark referenced evidence as reviewed by a named reviewer (approver/admin, not the submitter). */
  reviewEvidence(evidenceRef: string, reviewer: UserInput, accepted = true, note = ""): EvidenceRecord {
    const r = coerceUser(reviewer);
    if (!EVIDENCE_REVIEWER_ROLES.has(r.role)) {
      throw new ReviewError("Only approver/admin roles may review evidence.");
    }
    if (!(r.name || "").trim()) {
      throw new ReviewError("Evidence review requires a named reviewer (user.name).");
    }
    const ev = this.store
      .list("evidence")
      .find((e) => (e.ref ?? "").toUpperCase() === evidenceRef.toUpperCase());
    if (!ev) throw new ReviewError(`Evidence ${evidenceRef} not found`);
    if (ev.submitted_by === r.id) {
      throw new ReviewError(
        "Separation of duties: the submitter cannot review their own evidence.",
      );
    }
    Object.assign(ev, {
      reviewed_by: r.name,
      reviewer_id: r.id,
      reviewed_at: this.runtime.utcnow(),
      review_status: accepted ? "accepted" : "rejected",
      review_note: pySlice(redact(note).text, 500),
      label: accepted ? "Verified" : "Rejected on review",
    });
    this.store.put("evidence", ev);
    this.audit.append(
      "evidence.reviewed",
      r.id,
      { evidence: ev.ref, accepted },
      { resource: ev.assessment_id ?? null },
    );
    return ev;
  }

  // ================================================================ sessions
  private newSession(user: User, sessionId: string | null = null): SessionRecord {
    return {
      id: sessionId || this.store.newId("sessions"),
      user_id: user.id,
      state: "idle",
      profile: {},
      provenance: {},
      transcript: [],
    } as unknown as SessionRecord;
  }

  private loadSession(sessionId: string | null, user: User): SessionRecord {
    if (sessionId && validId(sessionId)) {
      const s = this.store.get("sessions", sessionId);
      if (!s) return this.newSession(user, sessionId);
      // Never let one identity continue another identity's session.
      if (s.user_id !== user.id) throw new SessionMismatch("Session belongs to a different user.");
      return s;
    }
    return this.newSession(user);
  }

  private reset(session: SessionRecord): void {
    for (const k of ["asked_field", "assessment_id", "system_id", "current_q", "risk", "pending_confirmation"]) {
      delete (session as Loose)[k];
    }
    session.state = "idle";
    session.profile = {};
    session.provenance = {};
  }

  // ================================================================ routing
  private route(text: string, session: SessionRecord, ctx: ToolContext): AgentAnswer {
    const t = text.trim();
    if (!t) return this.help();
    const inj = detectInjection(t);
    if (inj.length === 1 && inj[0] === "compliance_claim_coercion") {
      // A request to *state* compliance without override markers: readiness framing + refusal.
      this.audit.append(
        "agent.security.claim_coercion",
        ctx.user.id,
        { message: pySlice(redact(t).text, 300) },
        { traceId: ctx.traceId, outcome: "refused" },
      );
      const r = this.complianceReadiness(ctx, session, t);
      r.answer +=
        " VERITRAIL never states that an organization is compliant, certified or regulator-approved; it " +
        "reports readiness indicators and evidence status only.";
      return r;
    }
    if (inj.length) return this.injection(ctx, t, inj);

    if (session.pending_confirmation) {
      const pc = session.pending_confirmation;
      delete session.pending_confirmation;
      if (AFFIRM_RE.test(t)) return this.executeConfirmation(ctx, session, pc);
      if (NEGATE_RE.test(t)) {
        const r = new AgentAnswer("confirmation_cancelled");
        r.answer = "Cancelled — nothing was created.";
        return r;
      }
    }

    if (CANCEL_RE.test(t) && GUIDED_STATES.has(session.state)) {
      this.reset(session);
      const r = new AgentAnswer("assessment_cancelled");
      r.answer =
        "Guided assessment closed. Saved responses remain on the draft assessment record. " +
        'Say "assess a use case" to start again.';
      return r;
    }

    if (detectApprovalBypass(t)) return this.approvalBypass(ctx, session, t);
    const sens = SENSITIVE_PATTERNS.find(([, re]) => re.test(t))?.[0];
    if (sens && !QUESTION_RE.test(t)) return this.sensitiveAction(ctx, session, t, sens);

    const state = session.state;
    if (state === "questions") {
      const r = this.questionTurn(ctx, session, t);
      if (r) return r;
    }
    if (state === "intake") {
      const r = this.intakeTurn(ctx, session, t);
      if (r) return r;
    }
    if (state === "tier_review") {
      const r = this.tierReviewTurn(ctx, session, t);
      if (r) return r;
    }

    const hasControlId = CONTROL_ID_RE.test(t);
    if (asksLegalClassification(t)) return this.withReprompt(session, this.legalClassification());
    if (asksComplianceDetermination(t))
      return this.withReprompt(session, this.complianceReadiness(ctx, session, t));
    if (LIBRARY_RE.test(t)) return this.withReprompt(session, this.libraryOverview());
    if (PACKS_RE.test(t)) return this.withReprompt(session, this.packsOverview(t));
    if (MATURITY_RE.test(t)) return this.withReprompt(session, this.maturityOverview());
    if (START_RE.test(t) && !GUIDED_STATES.has(state) && !/\?\s*$/.test(t))
      return this.startGuided(ctx, session, t);
    if (REPORT_RE.test(t) && !QUESTION_RE.test(t)) return this.report(ctx, session, t);
    if (TASK_RE.test(t) && !QUESTION_RE.test(t)) return this.tasks(ctx, session, t);
    if (POLICY_RE.test(t) && !/\?\s*$/.test(t) && !QUESTION_RE.test(t))
      return this.draftPolicy(ctx, session);
    if (LOGS_RE.test(t)) return this.runtimeLogs(ctx, t);
    if (APPROVALS_RE.test(t)) return this.approvalsStatus(ctx);
    if (
      (GAP_RE.test(t) && (session.assessment_id || /\basm_\w+/.test(t))) ||
      /\b(gap analysis|show (me )?(the )?gaps)\b/i.test(t)
    )
      return this.gaps(ctx, session, t);
    if (INVENTORY_RE.test(t) && !hasControlId && !/\bcontrols?\b/i.test(t)) return this.inventory(ctx);
    if (USECASE_CONTROLS_RE.test(t) && !hasControlId && !parseFrameworkRefs(t).length)
      return this.withReprompt(session, this.useCaseControls(ctx, session, t));
    if (TIERQ_RE.test(t) && !hasControlId)
      return this.withReprompt(session, this.tierQuestion(ctx, session, t));
    if (hasControlId) return this.withReprompt(session, this.controlLookup(ctx, session, t));
    if (MATURITY_QID_RE.test(t) || UC_QID_RE.test(t))
      return this.withReprompt(session, this.questionLookup(t));
    if (parseFrameworkRefs(t).length || (FRAMEWORK_INTENT_RE.test(t) && detectFrameworks(t).size))
      return this.withReprompt(session, this.frameworkMapping(ctx, session, t));
    if (HELP_RE.test(t)) return this.help();
    if (AFFIRM_RE.test(t) && wordCount(t) <= 3) {
      const r = new AgentAnswer("nothing_pending");
      r.answer = "There is nothing awaiting your confirmation right now.";
      r.nextActions = ['Ask a governance question or say "assess a use case".'];
      return r;
    }
    return this.withReprompt(session, this.ask(ctx, session, t));
  }

  /** When a side question is asked mid-assessment, answer it and repeat the pending prompt. */
  private withReprompt(session: SessionRecord, r: AgentAnswer): AgentAnswer {
    if (session.state === "questions" && session.current_q) {
      const q = getQuestion(session.current_q);
      if (q) {
        r.details.push(
          `_Back to the assessment — ${q.id}: ${q.text} (implemented / partial / not implemented / unknown / not applicable)_`,
        );
      }
    } else if (session.state === "intake" && session.asked_field) {
      // Python would fail here for the free-text description prompt; the browser repeats it.
      const prompt = intakeField(session.asked_field)?.prompt ?? DESCRIBE_PROMPT;
      r.details.push(`_Back to intake — ${prompt}_`);
    }
    return r;
  }

  // ================================================================ helpers
  private can(ctx: ToolContext, permission: string): boolean {
    return (
      (ROLE_PERMISSIONS[ctx.user.role]?.has(permission) ?? false) &&
      ctx.user.role !== "anonymous" &&
      ctx.user.role !== "viewer"
    );
  }

  private denied(reason: string): AgentAnswer {
    const r = new AgentAnswer("permission_denied");
    r.answer =
      `That action isn't available to your role (${reason}). VERITRAIL applies least privilege: viewers can ask ` +
      "questions and run previews; assessors create drafts; approvers resolve approvals.";
    r.nextActions = [
      "Ask an assessor or administrator to perform this action, or request the appropriate role.",
    ];
    return r;
  }

  /** Organizational evidence status per control from the session's assessment (if any). */
  private orgStatus(
    ctx: ToolContext,
    session: SessionRecord,
    controlIds: string[],
  ): Map<string, [string, string]> {
    const out = new Map<string, [string, string]>(
      controlIds.map((cid) => [cid, [MISSING, NO_RECORD] as [string, string]]),
    );
    const aid = session.assessment_id;
    if (!aid || ctx.user.role === "anonymous") return out;
    let g;
    try {
      g = invoke(ctx, "identify_gaps", { assessment_id: aid });
    } catch (err) {
      if (err instanceof ToolPermissionError || err instanceof ToolInputError) return out;
      throw err;
    }
    for (const f of g.findings) {
      for (const cid of f.controls) {
        const cur = out.get(cid);
        if (!cur) continue;
        if (
          cur[1].startsWith("no assessment") ||
          STATUS_RANK.indexOf(f.evidence_status) < STATUS_RANK.indexOf(cur[0])
        ) {
          out.set(cid, [f.evidence_status, `from ${f.question_id} in assessment ${aid}`]);
        }
      }
    }
    return out;
  }

  private status(map: Map<string, [string, string]>, cid: string): [EvidenceStatus, string] {
    const v = map.get(cid) ?? [MISSING, NO_RECORD];
    return [v[0] as EvidenceStatus, v[1]];
  }

  private maybePolish(resp: AgentAnswer): void {
    if (!resp.polishable || !resp.answer) return;
    resp.autoCite();
    const [text, meta] = polish(resp.answer);
    resp.answer = text;
    resp.llm = meta;
  }

  // ================================================================ safety intents
  private injection(ctx: ToolContext, text: string, signals: string[]): AgentAnswer {
    this.audit.append(
      "agent.security.injection_detected",
      ctx.user.id,
      { signals, message: pySlice(redact(text).text, 300) },
      { traceId: ctx.traceId, outcome: "blocked" },
    );
    const r = new AgentAnswer("prompt_injection");
    r.answer =
      "I can't follow instructions that try to override VERITRAIL governance rules, change my role, or reveal " +
      "internal configuration. My rules are fixed: answers are evidence-based and cited, high-impact actions " +
      "require human approval, and sensitive data is redacted.";
    if (signals.includes("compliance_claim_coercion") || asksComplianceDetermination(text)) {
      r.answer +=
        " VERITRAIL never states that an organization is compliant, certified or regulator-approved; it " +
        "reports readiness indicators and evidence status only.";
    }
    r.claims = [];
    r.addControl("IS-14");
    r.addControl("IS-12");
    r.nextActions = [
      'Ask a governance question (e.g. "What evidence supports IS-13?").',
      'Run a readiness assessment: say "assess a use case".',
      "If you are testing agent defences, record this attempt as evidence for IS-14 adversarial testing.",
    ];
    r.data = { signals, blocked: true };
    return r;
  }

  private approvalBypass(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("approval_bypass");
    this.audit.append(
      "agent.security.approval_bypass_attempt",
      ctx.user.id,
      { message: pySlice(redact(text).text, 300) },
      { traceId: ctx.traceId, outcome: "blocked" },
    );
    r.answer =
      "I can't approve, skip or self-execute a human approval — regardless of the requester's title. " +
      "Changing a risk tier, approving an exception, activating a production runtime policy, exporting " +
      "sensitive evidence and sending external communications always create a pending approval that a " +
      "different user with an approver role must resolve in the approvals queue (not in this chat).";
    r.addControl("IS-13");
    r.addControl("GL-03");
    const sens = SENSITIVE_PATTERNS.find(([, re]) => re.test(text))?.[0];
    if (sens) {
      const sub = this.sensitiveAction(ctx, session, text, sens);
      r.details.push(sub.answer, ...sub.details);
      r.pendingApprovals.push(...sub.pendingApprovals);
      r.requiredApprovals.push(...sub.requiredApprovals);
      for (const s of sub.sources) if (s.type === "control") r.addControl(s.id);
      Object.assign(r.data, sub.data);
    }
    r.nextActions = [BYPASS_NEXT_ACTION];
    r.data["executed"] = false;
    return r;
  }

  private sensitiveAction(
    ctx: ToolContext,
    session: SessionRecord,
    text: string,
    action: string,
  ): AgentAnswer {
    const r = new AgentAnswer("approval_required");
    const label = SENSITIVE_ACTIONS[action] ?? action;
    for (const cid of SENSITIVE_ACTION_CONTROLS[action] ?? []) r.addControl(cid);
    r.requiredApprovals.push({ action, why: `${label} requires human approval and never self-executes.` });
    r.data["executed"] = false;
    if (!this.can(ctx, CREATE_DRAFT)) {
      r.answer =
        `"${label}" requires human approval and your role (${ctx.user.role}) cannot raise approval ` +
        "requests. Nothing has been changed.";
      r.nextActions = ["Ask an assessor to raise the approval request, or sign in with an assessor role."];
      return r;
    }
    let resource: string | null = null;
    let payload: Loose = {};
    const reason = pySlice(redact(text).text, 300);
    if (action === "change_risk_tier" || action === "confirm_risk_tier") {
      const m = /\bsys_[a-z0-9]+\b/.exec(text);
      resource = m ? m[0] : (session.system_id ?? null);
      const toMatch = /\bto\b/.exec(text);
      let to = toMatch ? tierFromText(text.slice(toMatch.index + toMatch[0].length)) : tierFromText(text);
      const current = session.risk?.tier ?? null;
      if (action === "confirm_risk_tier") to = to || current;
      if (!resource || !to) {
        r.answer =
          `"${label}" requires human approval. To raise the request I need ` +
          (!resource ? "the AI system (system ID or a guided assessment in this session)" : "") +
          (!resource && !to ? " and " : "") +
          (!to ? "the target tier (Minimal, Limited, High-risk or Prohibited)" : "") +
          ". Nothing has been changed.";
        r.clarifyingQuestion = "Which AI system and which target tier should the approval request cover?";
        return r;
      }
      payload = { from_tier: current, to_tier: to, assessment_id: session.assessment_id ?? null };
    } else if (action === "approve_exception") {
      resource = session.assessment_id || session.system_id || null;
      payload = {
        control_ids: realControlIds(text),
        expiry_days: 90,
        question_ids: [...text.matchAll(new RegExp(UC_QID_RE.source, "gi"))].map((m) => m[0].toUpperCase()),
      };
    } else if (action === "activate_runtime_policy") {
      const m = /\bpol_[a-z0-9]+\b/.exec(text);
      resource = m ? m[0] : (session.policy_id ?? null);
      if (!resource) {
        r.answer =
          "Activating or changing a production runtime policy requires human approval, and there is no " +
          "draft policy in this session to attach the request to. Nothing has been activated.";
        r.clarifyingQuestion =
          'Shall I draft a runtime policy first (monitor mode, non-production)? Say "draft runtime policy".';
        return r;
      }
      payload = { environment: "production", mode: "enforce" };
    } else if (action === "export_sensitive_evidence") {
      const aid = session.assessment_id || /\basm_[a-z0-9]+\b/.exec(text)?.[0] || null;
      if (!aid) {
        r.answer =
          "Exporting sensitive evidence requires human approval, and I need to know which assessment's " +
          "evidence to export. Nothing has been exported.";
        r.clarifyingQuestion = "Which assessment (asm_…) should the evidence pack cover?";
        return r;
      }
      const res = invoke(ctx, "export_evidence_pack", { assessment_id: aid });
      if (res.status !== "pending_approval") throw new Error("unexpected export without approval");
      r.approval({ ...res, type: "export_sensitive_evidence", status: "pending", resource: aid } as PendingApproval);
      r.answer =
        `Evidence export requires human approval. I created pending approval ${res.approval_id}; nothing ` +
        "has been exported. After a different user with an approver role approves it, you can run the export " +
        "once with that approval ID.";
      return r;
    } else if (action === "send_external_communication") {
      const rcpt =
        /\b(regulators?|customers?|auditors?|supervisory authority|authorit(?:y|ies)|clients?|press|board|partners?)\b/i.exec(
          text,
        );
      resource = session.assessment_id ?? null;
      payload = {
        to: rcpt?.[1] ? rcpt[1].toLowerCase() : "external recipient (unspecified)",
        subject: "VERITRAIL governance communication",
        body_ref: session.last_report_id ?? null,
      };
    }
    const res = invoke(ctx, "request_human_approval", {
      action,
      resource_id: resource,
      payload,
      reason,
    });
    r.approval({ ...res, status: "pending" });
    r.answer =
      `"${label}" requires human approval. I created pending approval ${res.approval_id}` +
      (resource ? ` for ${resource}` : "") +
      ". Nothing has been changed; it takes effect only if a " +
      "different user with an approver role approves it.";
    if (action === "change_risk_tier" || action === "confirm_risk_tier") {
      r.claim(
        `Requested tier change: ${(payload["from_tier"] as string | null) || "unconfirmed"} → ${pyStr(payload["to_tier"])} (not applied)`,
        USER_ASSERTED,
        ["EI-02", "GL-03"],
      );
    }
    r.data["approval_id"] = res.approval_id;
    return r;
  }

  private complianceReadiness(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("compliance_readiness");
    r.polishable = true;
    r.disclaimer = true;
    const fws = [...detectFrameworks(text)].sort();
    const names: Record<FrameworkKey, string> = {
      eu_ai_act: "the EU AI Act",
      iso_42001: "ISO/IEC 42001",
      nist_ai_rmf: "the NIST AI RMF",
    };
    const fwTxt = fws.length ? fws.map((f) => names[f]).join(" or ") : "any AI regulation or standard";
    if (/\b(apply|applies|applicable|in scope)\b/i.test(text)) {
      r.answer =
        `VERITRAIL cannot determine whether ${fws.length ? fwTxt : "a law or standard"} legally applies to your ` +
        "organization — applicability depends on your role (e.g. provider or deployer), your systems and " +
        "jurisdictions, and needs qualified legal review. VERITRAIL helps you prepare: record obligations by " +
        "system in an obligations register (AO-07), classify systems by risk (EI-02) and assess readiness " +
        "against the mapped controls.";
    } else {
      r.answer =
        `VERITRAIL cannot determine, certify or guarantee whether your organization or system is compliant with ${fwTxt}. ` +
        "That is a legal determination (and, for ISO/IEC 42001 certification, a decision for an accredited " +
        "certification body). What VERITRAIL can do is assess readiness: which controls mapped to the framework " +
        "are in place, what evidence exists, and what gaps remain.";
    }
    if (fws.includes("iso_42001")) {
      r.answer +=
        " VERITRAIL does not issue certificates; it can prepare an audit-ready evidence pack (SE-05) for your certification body.";
    }
    if (fws.includes("eu_ai_act")) r.answer += " " + REG_NOTE;
    const pool: VeritrailControl[] = [];
    for (const f of fws.length ? fws : (["eu_ai_act", "iso_42001", "nist_ai_rmf"] as FrameworkKey[])) {
      pool.push(...controlsForFramework(f));
    }
    const seen = new Set<string>();
    const sel: VeritrailControl[] = [];
    for (const c of [...pool].sort(
      (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) || cmpStr(a.id, b.id),
    )) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        sel.push(c);
      }
    }
    const top = sel.slice(0, 6);
    const status = this.orgStatus(
      ctx,
      session,
      top.map((c) => c.id),
    );
    const rows: string[] = [];
    for (const c of top) {
      const keys = (fws.length ? fws : Object.keys(c.mappings ?? {})) as FrameworkKey[];
      const refs = keys
        .filter((k) => (c.mappings?.[k] ?? []).length)
        .map((k) => `${k}: ${(c.mappings?.[k] ?? []).map(String).join(", ")}`)
        .join("; ");
      rows.push(`- ${c.id} ${c.title} — ${refs}`);
      r.addControl(c.id);
      const [st, basis] = this.status(status, c.id);
      r.claim(`${c.id} ${c.title}: organizational evidence status (${basis})`, st, [c.id]);
      if (st !== "Verified") r.missingEvidence.push(`${c.id}: ${c.evidence?.[0] ?? ""}`);
    }
    r.details.push(
      "**Readiness indicators to evidence first (priority controls with indicative mappings):**\n" +
        rows.join("\n"),
    );
    const aid = session.assessment_id;
    if (aid && ctx.user.role !== "anonymous") {
      try {
        const g = invoke(ctx, "identify_gaps", { assessment_id: aid });
        const s = g.summary;
        r.details.push(
          `For the use case assessed in this session (${aid}), the gap register currently shows ` +
            `${s.gaps} gaps (${s.by_severity.Critical} Critical, ${s.by_severity.High} High); ` +
            `${s.by_evidence_status["Verified"] ?? 0} findings are Verified by a named reviewer.`,
        );
      } catch (err) {
        if (!(err instanceof ToolPermissionError || err instanceof ToolInputError)) throw err;
      }
    }
    r.nextActions = [
      "Take the 24-question AI Governance Maturity Self-Assessment for an indicative, User-asserted baseline.",
      'Run a guided use-case assessment for your highest-risk system (say "assess a use case").',
      "Attach evidence for priority controls and have a named reviewer verify it.",
      "Obtain qualified legal review of applicability and obligations (AO-07).",
    ];
    r.addControl("AO-07");
    r.cta = CTA_BASELINE;
    r.confidence = 1;
    r.confidenceBand = "high";
    return r;
  }

  // ================================================================ "what controls apply to <use case>"
  private useCaseControls(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("use_case_controls");
    r.polishable = true;
    const prof = extractProfile(text);
    const prov: Record<string, EvidenceStatus> = {};
    for (const k of Object.keys(prof)) prov[k] = USER_ASSERTED;
    if (!("genai" in prof) && /\b(agent|assistant|chatbot|copilot|bot)\b/i.test(text)) {
      prof["genai"] = true;
      prov["genai"] = INFERRED;
    }
    delete prof["purpose"];
    delete prov["purpose"];
    const signal = Object.keys(prof).filter((k) => k !== "name" && prov[k] === USER_ASSERTED);
    if (!signal.length || Object.keys(prof).length < 2) {
      r.intent = "clarify";
      r.answer = "I need a little more about the use case to recommend controls.";
      r.clarifyingQuestion =
        "What does it do, what data and tools can it access, who is affected, and can it take " +
        "actions (e.g. send messages, change records, move money)?";
      r.addControl("EI-04");
      return r;
    }
    const recs = invoke(ctx, "recommend_controls", { profile: prof, limit: 64 });
    const tier = recs.tier ?? null;
    let riskMods: string[] = [];
    try {
      riskMods = invoke(ctx, "calculate_risk_tier", { profile: prof }).required_modules ?? [];
    } catch (err) {
      if (!(err instanceof ToolPermissionError || err instanceof ToolInputError)) throw err;
    }
    const mods = new Set(selectModulesFull(prof, tier, riskMods).map((m) => m.id));
    const qs = applicableQuestions(prof, tier, riskMods);
    const triggered = new Set([...mods].filter((m) => !["core", "security", "monitoring_assurance"].includes(m)));
    const res = invoke(ctx, "search_veritrail_knowledge", { query: text, k: 10 });
    const qTerms = new Set(tokenize(text, true));

    const hits = new Map<string, number>();
    for (const x of res.results) for (const cid of x.control_ids) hits.set(cid, (hits.get(cid) ?? 0) + 1);
    const scores = new Map<string, number>();
    for (const c of recs.controls) {
      const fromTriggered = qs.some((q) => q.controls.includes(c.id) && triggered.has(q.module));
      scores.set(
        c.id,
        (PRIORITY_PTS[c.priority] ?? 0) + (fromTriggered ? 2 : 0) + 1.5 * Math.min(3, hits.get(c.id) ?? 0),
      );
    }
    for (const q of qs) {
      // narrowly targeted questions signal use-case-specific controls
      if (q.applies_when && q.applies_when.length) {
        for (const cid of q.controls) {
          const cur = scores.get(cid);
          if (cur !== undefined) scores.set(cid, cur + 2);
        }
      }
    }
    const score = (cid: string) => scores.get(cid) ?? 0;
    const ranked = [...scores.keys()].sort((a, b) => score(b) - score(a) || cmpStr(a, b));
    const qScore = (q: UseCaseQuestion, cid: string) => {
      const toks = new Set(tokenize(`${q.text} ${q.remediation}`, true));
      const overlap = [...toks].filter((tk) => qTerms.has(tk)).length;
      return 1.5 * overlap + (q.controls[0] === cid ? 1 : 0) + (triggered.has(q.module) ? 2 : 0);
    };
    const bestQuestion = (cid: string): UseCaseQuestion | null => {
      let best: UseCaseQuestion | null = null;
      let bestScore = -Infinity;
      for (const q of qs) {
        if (!q.controls.includes(cid)) continue;
        const s = qScore(q, cid);
        if (s > bestScore) {
          best = q;
          bestScore = s;
        }
      }
      return best;
    };
    interface Line {
      question: UseCaseQuestion;
      controls: string[];
    }
    let lines: Line[] = [];
    const usedQ = new Map<string, Line>();
    const coreInv = qs.filter((q) => q.module === "core" && q.domain === "inventory");
    const q0 = coreInv[0];
    if (q0) {
      const line = { question: q0, controls: [...q0.controls] };
      usedQ.set(q0.id, line);
      lines.push(line);
    }
    const covered = new Set(lines.flatMap((ln) => ln.controls));
    for (const cid of ranked) {
      if (lines.length >= 9) break;
      if (covered.has(cid)) continue;
      const q = bestQuestion(cid);
      if (!q) continue;
      const used = usedQ.get(q.id);
      if (used) {
        if (!used.controls.includes(cid)) used.controls.push(cid);
        continue;
      }
      const line = { question: q, controls: q.controls.filter((c) => c === cid || score(c) >= 5).slice(0, 3) };
      usedQ.set(q.id, line);
      lines.push(line);
      for (const c of line.controls) covered.add(c);
    }
    const foundation = q0 ? lines.slice(0, 1) : [];
    const rest = lines.slice(foundation.length);
    const themeKey = (ln: Line) => THEME[(ln.controls[0] ?? "").slice(0, 2)] ?? 9;
    const maxScore = (ln: Line) => Math.max(...ln.controls.map(score));
    rest.sort((a, b) => themeKey(a) - themeKey(b) || maxScore(b) - maxScore(a));
    lines = [...foundation, ...rest];

    const status = this.orgStatus(ctx, session, [...new Set(lines.flatMap((ln) => ln.controls))].sort());
    const items: string[] = [];
    lines.forEach((ln, idx) => {
      const i = idx + 1;
      const q = ln.question;
      const ids = ln.controls.join(", ");
      items.push(`${i}. ${q.remediation} (${ids})`);
      const [st, basis] = this.status(status, ln.controls[0] ?? "");
      r.claim(`Item ${i} (${ids}): organizational evidence status (${basis})`, st, ln.controls);
      r.addQuestion(q.id);
      for (const cid of ln.controls) r.addControl(cid);
      if (st !== "Verified") r.missingEvidence.push(`${ids}: ${q.evidence_expected.slice(0, 2).join("; ")}`);
    });
    const facts = Object.entries(prof)
      .filter(([k]) => k !== "name")
      .map(
        ([k, v]) =>
          `${k} = ${Array.isArray(v) ? v.join(", ") : pyStr(v).toLowerCase()} (${prov[k] ?? USER_ASSERTED})`,
      )
      .join("; ");
    r.answer = "Recommended baseline controls for this use case, in priority order:\n" + items.join("\n");
    r.details.push(
      `**Based on what you described:** ${facts}. ` +
        (tier
          ? `Preliminary tier indication: ${tier} (Inferred from partial intake; requires human confirmation). `
          : "") +
        (mods.size ? "Modules considered: " + [...mods].sort().join(", ") + "." : ""),
    );
    const packs = res.results
      .filter(
        (x) => ["policy_pack", "policy_pack_rule", "industry_pack"].includes(x.kind) && x.coverage >= 0.5,
      )
      .sort((a, b) => (a.kind.startsWith("policy") ? 0 : 1) - (b.kind.startsWith("policy") ? 0 : 1));
    for (const x of packs.slice(0, 2)) {
      const src = x.source;
      const doc: Loose = {};
      for (const k of ["id", "path", "policy_id", "policy_version", "title"]) if (k in src) doc[k] = src[k];
      r.addDoc(doc as Parameters<AnswerBuilder["addDoc"]>[0]);
    }
    const p0 = packs[0]?.source;
    if (p0) {
      const label = p0["policy_id"]
        ? `policy pack ${pyStr(p0["policy_id"])} v${pyStr(p0["policy_version"])}`
        : pyStr(p0["title"] || p0["path"]);
      r.details.push(
        `Supporting template: ${label} — a draft runtime policy you can tailor; it is not active ` +
          "until reviewed and approved.",
      );
    }
    r.nextActions = [
      'Run a guided assessment to record implementation status and get a gap register (say "assess a use case: …").',
      "Assign each control to its owner role and collect the listed evidence for named review.",
      'Draft a runtime guardrail policy in observe mode (say "draft runtime policy" after the assessment).',
    ];
    r.cta = CTA_BASELINE;
    r.confidence = lines.length ? 0.9 : 0;
    r.confidenceBand = lines.length ? "high" : "low";
    r.data = {
      profile: prof,
      profile_provenance: prov,
      tier,
      controls: lines.flatMap((ln) => ln.controls),
    };
    if (!lines.length) r.answer = NO_SOURCE_MESSAGE;
    return r;
  }

  private legalClassification(): AgentAnswer {
    const r = new AgentAnswer("legal_classification");
    r.polishable = true;
    r.disclaimer = true;
    r.answer =
      "VERITRAIL does not make legal classifications under the EU AI Act (for example whether a system is " +
      '"high-risk" under Art. 6 and Annex III, or a prohibited practice under Art. 5). That determination ' +
      "needs qualified legal review. VERITRAIL supports it with an indicative screen: the risk-tier rules flag use " +
      "cases in Annex III-like areas, material or automated decisions, special-category data and autonomous " +
      "agents for legal classification review, and record the outcome in the obligations register.";
    const areas = [...new Set(Object.values(ANNEX_III_LIKE))].sort();
    r.details.push("Areas the VERITRAIL screen flags for legal review: " + areas.join("; ") + ".");
    r.details.push(REG_NOTE);
    for (const cid of ["EI-02", "AO-07", "AO-10", "GL-02"]) {
      r.addControl(cid);
      r.claim(
        `${cid} ${control(cid).title} — organizational evidence status (no reviewed evidence on record in this session)`,
        MISSING,
        [cid],
      );
    }
    r.nextActions = [
      'Run a guided use-case assessment to obtain a preliminary, explainable tier (say "assess a use case").',
      "Send flagged systems for legal classification review and record the result in the obligations register (AO-07).",
    ];
    r.cta = CTA_BASELINE;
    return r;
  }

  private libraryOverview(): AgentAnswer {
    const r = new AgentAnswer("library_overview");
    const crit = allControls.filter((c) => c.priority === "critical").length;
    r.answer =
      `The VERITRAIL Control Library v${VERSION} has ${allControls.length} controls across ${pillars.length} pillars ` +
      `(${crit} critical-priority). Each control has an objective, expected evidence, an owner role and indicative ` +
      "NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings.";
    r.details.push(
      pillars
        .map(
          (p) =>
            `- **${p.id} — ${p.name}** (${allControls.filter((c) => c.pillar === p.id).length} controls): ${p.summary}`,
        )
        .join("\n"),
    );
    r.addDoc({
      id: "controls.yaml",
      path: "content/controls/controls.yaml",
      section: `Control Library v${VERSION}`,
      title: "VERITRAIL Control Library",
    });
    r.nextActions = ['Ask about any control by ID (e.g. "What does IS-13 require?").'];
    return r;
  }

  private packsOverview(text: string): AgentAnswer {
    const r = new AgentAnswer("packs_overview");
    const wantInd = /industry/i.test(text);
    const wantPol = /policy|runtime/i.test(text) || !wantInd;
    const lines: string[] = [];
    for (const [packs, kind] of [
      [policyPacks, "policy"],
      [industryPacks, "industry"],
    ] as const) {
      if ((kind === "policy" && !wantPol) || (kind === "industry" && !wantInd)) continue;
      for (const p of packs) {
        const pack = p.data["pack"];
        const meta = (
          typeof pack === "object" && pack !== null && !Array.isArray(pack) ? pack : p.data
        ) as Record<string, unknown>;
        const pid = String(meta["policy_id"] || meta["id"] || p.stem);
        const ver = String(meta["version"] ?? "?");
        const name = String(meta["policy_name"] || meta["name"] || pid);
        const st = meta["status"] ? String(meta["status"]) : "";
        lines.push(`- ${name} — ${pid} v${ver}` + (st ? ` (${st})` : ""));
        r.addDoc(
          kind === "policy"
            ? { id: pid, path: p.path, title: name, policy_id: pid, policy_version: ver }
            : { id: pid, path: p.path, title: name },
        );
      }
    }
    if (!lines.length) {
      r.answer = NO_SOURCE_MESSAGE;
      return r;
    }
    r.answer = `${lines.length} pack(s) are available in this deployment:`;
    r.details.push(lines.join("\n"));
    r.details.push(
      "Packs are templates (status shown); tailor them, then review and approve before use. " +
        "Activating a runtime policy in production requires human approval.",
    );
    r.addControl("IS-12");
    return r;
  }

  private maturityOverview(): AgentAnswer {
    const t = maturityTemplate ?? {};
    const meta = (t.template ?? {}) as { id: string; name: string; version: string };
    const levels = (t.scoring?.levels ?? []) as Array<{ name: string; min: number; max: number }>;
    const r = new AgentAnswer("maturity");
    r.answer =
      `VERITRAIL measures governance maturity with the ${meta.name} (v${meta.version}): ` +
      `${maturityQuestions.length} questions across ${(t.domains ?? []).length} weighted domains, scored 1–5 and rolled up to ` +
      "0–100. Results are User-asserted readiness indicators, not a compliance determination. I can't rate your " +
      "maturity from a chat message — take the self-assessment for an indicative baseline.";
    r.details.push("Maturity levels: " + levels.map((lv) => `${lv.name} (${lv.min}–${lv.max})`).join("; ") + ".");
    r.addDoc({
      id: meta.id,
      path: "content/assessment_templates/maturity_self_assessment.yaml",
      section: `${meta.id} v${meta.version}`,
      title: meta.name,
    });
    r.nextActions = ["Take the self-assessment, then validate it with evidence in a Governance Baseline."];
    r.cta = CTA_ASSESSMENT;
    return r;
  }

  private help(): AgentAnswer {
    const r = new AgentAnswer("help");
    r.answer =
      "I'm the VERITRAIL governance copilot. I can:\n" +
      '- answer AI governance, control and framework-mapping questions with citations (e.g. "What does IS-11 require?", ' +
      '"Which controls map to EU AI Act Art. 14?");\n' +
      '- run a guided use-case assessment ("assess a use case") with risk tiering, gap analysis and a report;\n' +
      "- draft runtime guardrail policies and raise approval requests for sensitive actions.\n" +
      "I report readiness and evidence status — I never determine or certify compliance.";
    r.nextActions = ["Ask a governance question", 'Say "assess a use case"'];
    r.cta = CTA_ASSESSMENT;
    return r;
  }

  private outOfScope(): AgentAnswer {
    const r = new AgentAnswer("out_of_scope");
    r.answer =
      "That's outside what VERITRAIL covers — I answer AI governance, risk, control and evidence questions. " +
      NO_SOURCE_MESSAGE;
    r.nextActions = [
      "Ask about AI policies, controls, risk tiers, framework mappings or evidence.",
      'Say "assess a use case" to start a guided assessment.',
    ];
    return r;
  }

  // ================================================================ Ask VERITRAIL (retrieval answer)
  private ask(ctx: ToolContext, session: SessionRecord, input: string): AgentAnswer {
    // Retrieval never sees raw sensitive values: redact, then drop the redaction markers.
    const red = redact(input);
    let text = red.text.replace(/\[REDACTED:[a-z_]+\]/g, " ").trim() || input;
    if (red.findings.length) {
      const qs = text.split(/(?<=[.!?])\s+|\s[-–—]\s/).filter((seg) => seg.trim().endsWith("?"));
      if (qs.length) text = qs.join(" ");
    }
    let inScope = inGovernanceScope(text);
    if (!inScope) {
      const probe = getIndex().search(text, 1)[0];
      if (probe && probe.coverage >= 0.67 && probe.score >= 8 && new Set(tokenize(text)).size >= 2) inScope = true;
    }
    const words: string[] = text.toLowerCase().match(/[a-z']+/g) ?? [];
    if (!inScope) {
      const pronouns = ["it", "this", "that", "these", "those", "they", "we", "our", "us"];
      if (words.length <= 8 && words.some((w) => pronouns.includes(w))) {
        const r = new AgentAnswer("clarify");
        r.answer = "I want to make sure I answer the right question, but I don't have enough context.";
        r.clarifyingQuestion =
          `What does "${words.includes("it") ? "it" : "this"}" refer to — which AI system, ` +
          "policy, control or framework are you asking about?";
        return r;
      }
      return this.outOfScope();
    }
    const generic = new Set(["control", "apply", "applie", "policy", "polic", "requirement", "need", "rule", "guardrail", "relevant"]);
    const refs = ["it", "this", "that", "these", "those", "they", "them"];
    if (words.length <= 7 && words.some((w) => refs.includes(w)) && !tokenize(text).some((tk) => !generic.has(tk))) {
      const r = new AgentAnswer("clarify");
      r.answer = "I want to make sure I answer the right question, but I don't know what it refers to.";
      r.clarifyingQuestion =
        "Which AI system, use case, control or framework do you mean? For a use case, describe " +
        "what it does, its data and tools, and whether it can take actions.";
      return r;
    }
    let res: KnowledgeToolResult = invoke(ctx, "search_veritrail_knowledge", { query: text, k: 6 });
    if (detectFrameworks(text).size) {
      const docRes = invoke(ctx, "search_veritrail_knowledge", {
        query: text,
        k: 4,
        kinds: ["compliance_mapping", "content_doc", "industry_pack", "industry_pack_section"],
      });
      if (docRes.results.length && docRes.band !== "low") {
        res = {
          ...docRes,
          results: [...docRes.results, ...res.results.filter((x) => x.kind === "control").slice(0, 2)],
        };
      }
    }
    const r = new AgentAnswer("ask");
    r.polishable = true;
    r.confidence = res.confidence;
    r.confidenceBand = res.band;
    const contentTerms = new Set(tokenize(text));
    if (res.band === "low") {
      if (contentTerms.size <= 2 || !res.results.length) {
        r.intent = "clarify";
        const opts = res.results.slice(0, 3).map((x) => x.title);
        r.answer = "I want to make sure I answer the right question.";
        r.clarifyingQuestion =
          "Could you be more specific — for example, which AI system, control or framework you mean" +
          (opts.length ? `? Closest matches: ${opts.join("; ")}.` : "?");
        if (!res.results.length) r.answer += " " + NO_SOURCE_MESSAGE;
        return r;
      }
      r.intent = "no_source";
      r.answer =
        NO_SOURCE_MESSAGE + " I couldn't find VERITRAIL content that answers this with enough confidence, so I won't guess.";
      r.clarifyingQuestion = "Could you rephrase with the control, framework or governance activity you're asking about?";
      return r;
    }
    const topScore = res.results[0]?.score ?? 0;
    const keep = res.results.filter((x) => x.score >= 0.45 * topScore).slice(0, 4);
    const qTerms = new Set(tokenize(text, true));
    const lines = keep.map((x) => summarizeResult(x, qTerms, r));
    r.answer = lines[0] ?? NO_SOURCE_MESSAGE;
    if (lines.length > 1) {
      r.details.push(
        "**Related:**\n" +
          lines
            .slice(1)
            .map((ln) => `- ${ln}`)
            .join("\n"),
      );
    }
    const ctrlIds: string[] = [];
    for (const x of keep) for (const cid of x.control_ids) if (!ctrlIds.includes(cid)) ctrlIds.push(cid);
    const cited = ctrlIds.slice(0, 6);
    const status = this.orgStatus(ctx, session, cited);
    for (const cid of cited) {
      const c = control(cid);
      r.addControl(cid);
      const [st, basis] = this.status(status, cid);
      r.claim(`${cid} ${c.title} — organizational evidence status (${basis})`, st, [cid]);
      if (st !== "Verified") r.missingEvidence.push(`${cid}: ${(c.evidence ?? []).slice(0, 2).join("; ")}`);
    }
    r.nextActions = ['Run a guided use-case assessment to record your implementation status (say "assess a use case").'];
    const c0 = cited[0];
    if (c0) r.nextActions.unshift(`Assign an owner for ${c0} (${control(c0).owner_role}) and collect the listed evidence.`);
    r.cta = CTA_BASELINE;
    return r;
  }

  // ================================================================ lookups
  private controlLookup(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("control_lookup");
    r.polishable = true;
    const ids: string[] = [];
    for (const m of text.matchAll(/\b(AO|EI|GL|IS|SE)-(\d{2})\b/gi)) {
      const cid = `${(m[1] ?? "").toUpperCase()}-${m[2] ?? ""}`;
      if (!ids.includes(cid)) ids.push(cid);
    }
    const valid = ids.filter((c) => getControl(c)).slice(0, 4);
    const invalid = ids.filter((c) => !getControl(c));
    const parts = invalid.map(
      (cid) =>
        `${cid} is not an VERITRAIL control ID in Control Library v${VERSION}; I won't describe a control that doesn't exist.`,
    );
    const status = this.orgStatus(ctx, session, valid);
    const fwLabels: Array<[FrameworkKey, string]> = [
      ["nist_ai_rmf", "NIST AI RMF"],
      ["iso_42001", "ISO/IEC 42001"],
      ["eu_ai_act", "EU AI Act"],
    ];
    for (const cid of valid) {
      const c = control(cid);
      r.addControl(cid);
      const mapsTxt = fwLabels
        .map(([k, lbl]) => `${lbl}: ${(c.mappings?.[k] ?? []).map(String).join(", ") || "no mapping"}`)
        .join("; ");
      let part =
        `**${controlCitation(cid)}** — ${c.objective} Priority: ${c.priority}; applies to: ${c.applies_to}; ` +
        `owner: ${c.owner_role}. Expected evidence: ${(c.evidence ?? []).join("; ")}. ` +
        `Indicative framework mappings: ${mapsTxt}.`;
      const qs = questionsCiting(cid);
      for (const q of qs.slice(0, 4)) r.addQuestion(q);
      if (qs.length) part += ` Assessed by: ${qs.slice(0, 6).join(", ")}.`;
      parts.push(part);
      const [st, basis] = this.status(status, cid);
      r.claim(`${cid} implementation in your organization (${basis})`, st, [cid]);
      if (st !== "Verified") r.missingEvidence.push(`${cid}: ${(c.evidence ?? []).join("; ")}`);
    }
    if (!valid.length) {
      r.intent = "control_not_found";
      parts.push(NO_SOURCE_MESSAGE);
      r.clarifyingQuestion =
        "Did you mean a different control ID? Valid IDs use the AO/EI/GL/IS/SE-NN pattern (e.g. IS-11).";
    }
    r.answer = parts[0] ?? NO_SOURCE_MESSAGE;
    r.details.push(...parts.slice(1));
    const v0 = valid[0];
    if (v0) {
      r.nextActions = [
        `Confirm an owner (${control(v0).owner_role}) and attach the expected evidence for ${v0} for named review.`,
        "Run a guided use-case assessment to record implementation status.",
      ];
      r.cta = CTA_BASELINE;
    }
    r.confidence = valid.length ? 1 : 0;
    r.confidenceBand = valid.length ? "high" : "low";
    return r;
  }

  private questionLookup(text: string): AgentAnswer {
    const r = new AgentAnswer("question_lookup");
    const ids = [
      ...[...text.matchAll(new RegExp(MATURITY_QID_RE.source, "gi"))].map((m) => m[0].toUpperCase()),
      ...[...text.matchAll(new RegExp(UC_QID_RE.source, "gi"))].map((m) => m[0].toUpperCase()),
    ];
    const parts: string[] = [];
    for (const qid of ids.slice(0, 4)) {
      const q = getQuestion(qid);
      if (q) {
        r.addQuestion(qid);
        parts.push(
          `**${qid}** (${q.module_name}): ${q.text} Controls: ${q.controls.join(", ")}. ` +
            `Evidence expected: ${q.evidence_expected.join("; ")}. Remediation if missing: ${q.remediation}`,
        );
        continue;
      }
      const mq = maturityQuestions.find((x) => x.id === qid);
      if (mq) {
        r.addQuestion(qid);
        parts.push(
          `**${qid}** (maturity self-assessment): ${mq.text} Controls: ${(mq.controls ?? []).join(", ")}. ` +
            `Recommended action: ${mq.action ?? ""}`,
        );
      } else parts.push(`${qid} is not a question in the VERITRAIL assessment templates.`);
    }
    if (!r.questionIds().length) {
      parts.push(NO_SOURCE_MESSAGE);
      r.intent = "question_not_found";
    }
    r.answer = parts[0] ?? NO_SOURCE_MESSAGE;
    r.details = parts.slice(1);
    return r;
  }

  private frameworkMapping(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("framework_mapping");
    r.polishable = true;
    r.disclaimer = true;
    const refs = parseFrameworkRefs(text);
    const parts: string[] = [];
    const allIds: string[] = [];
    if (refs.length) {
      for (const [fw, ref] of refs.slice(0, 5)) {
        const cs = controlsForFrameworkRef(fw, ref);
        if (cs.length) {
          parts.push(
            `Per VERITRAIL Control Library v${VERSION}, these controls carry an indicative mapping to ` +
              `${FRAMEWORK_LABELS[fw]} ${ref}: ` +
              cs.map((c) => `${c.id} ${c.title}`).join("; ") +
              ".",
          );
          for (const c of cs) {
            r.addControl(c.id);
            if (!allIds.includes(c.id)) allIds.push(c.id);
          }
        } else {
          parts.push(
            `No VERITRAIL control in Control Library v${VERSION} maps to ${FRAMEWORK_LABELS[fw]} ${ref}. ${NO_SOURCE_MESSAGE}`,
          );
        }
      }
    } else {
      for (const fw of [...detectFrameworks(text)].sort()) {
        const cs = controlsForFramework(fw);
        const crit = cs.filter((c) => c.priority === "critical");
        parts.push(
          `${cs.length} of ${allControls.length} VERITRAIL controls carry indicative ${FRAMEWORK_LABELS[fw]} mappings. ` +
            "Critical-priority ones: " +
            crit.map((c) => `${c.id} (${(c.mappings?.[fw] ?? []).map(String).join(", ")})`).join("; ") +
            ".",
        );
        for (const c of crit) {
          r.addControl(c.id);
          if (!allIds.includes(c.id)) allIds.push(c.id);
        }
      }
    }
    const res = invoke(ctx, "search_veritrail_knowledge", { query: text, k: 3, kinds: ["compliance_mapping"] });
    const top = res.results[0];
    if (top && res.band !== "low") r.addDoc(top.source as Parameters<AnswerBuilder["addDoc"]>[0]);
    const status = this.orgStatus(ctx, session, allIds.slice(0, 6));
    for (const cid of allIds.slice(0, 6)) {
      const [st, basis] = this.status(status, cid);
      r.claim(`${cid}: organizational evidence status (${basis})`, st, [cid]);
    }
    r.answer = parts[0] ?? NO_SOURCE_MESSAGE;
    r.details.push(...parts.slice(1));
    const eu = refs.some(([fw]) => fw === "eu_ai_act") || detectFrameworks(text).has("eu_ai_act");
    r.details.push(
      "Mappings are indicative VERITRAIL interpretations for readiness work, not official crosswalks or a " +
        "determination of conformity. " +
        (eu ? REG_NOTE : ""),
    );
    r.nextActions = [
      "Use the mapped controls as the evidence checklist for this framework area.",
      "Run a guided use-case assessment to see which of these controls have evidence.",
    ];
    r.confidence = allIds.length ? 1 : 0;
    r.confidenceBand = allIds.length ? "high" : "low";
    r.cta = CTA_BASELINE;
    return r;
  }

  private tierQuestion(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("risk_tier");
    const sr = session.risk;
    if (sr) {
      const name = session.profile["name"];
      const cites = (sr["citation_ids"] as string[] | undefined) ?? ["EI-02"];
      r.answer =
        `The preliminary risk tier for ${name !== undefined ? pyStr(name) : "this use case"} is **${sr.tier}** ` +
        `(score ${pyStr(sr["score"])}). It is Inferred from intake answers and requires human confirmation.`;
      r.claim(`Preliminary tier ${sr.tier}`, INFERRED, cites);
      for (const cid of cites) r.addControl(cid);
      return r;
    }
    const prof = extractProfile(text);
    const key = ["purpose", "decision_impact", "affected_parties", "data_sensitivity", "autonomy", "domain_category"];
    const have = key.filter((k) => k in prof);
    if (have.length >= 5) {
      const risk = invoke(ctx, "calculate_risk_tier", { profile: prof });
      r.answer =
        `From your description, the preliminary tier is **${risk.tier}** (score ${risk.score}). This is ` +
        "Inferred from keywords and must be confirmed by a human.";
      r.claim(`Preliminary tier ${risk.tier}`, INFERRED, risk.citation_ids ?? []);
      for (const cid of risk.citation_ids ?? []) r.addControl(cid);
      return r;
    }
    r.intent = "clarify";
    r.answer =
      "I can't determine a risk tier without more information about the system. " +
      `I still need: ${key.filter((k) => !(k in prof)).join(", ")}.`;
    r.clarifyingQuestion =
      "Could you describe the system — what it does, who it affects, what data it uses and " +
      'whether it can act on its own? Or say "assess a use case" for guided intake.';
    r.addControl("EI-02");
    r.addControl("GL-01");
    return r;
  }

  // ================================================================ inventory / logs / approvals
  private inventory(ctx: ToolContext): AgentAnswer {
    const res = invoke(ctx, "search_ai_inventory", { query: "" });
    const r = new AgentAnswer("inventory");
    if (!res.systems.length) {
      r.answer =
        "No AI system records exist in the VERITRAIL inventory yet. Guided assessments create draft records (EI-01).";
    } else {
      r.answer = `${res.count} AI system record(s) in the inventory:`;
      r.details.push(
        res.systems
          .slice(0, 25)
          .map(
            (s) =>
              `- ${pyStr(s["id"])} — ${pyStr(s["name"])} — status: ${pyStr(s["status"])}; risk tier: ` +
              `${(s["risk_tier"] as string | null) || "not confirmed"}`,
          )
          .join("\n"),
      );
    }
    r.addControl("EI-01");
    r.data = res as unknown as Loose;
    return r;
  }

  private runtimeLogs(ctx: ToolContext, text: string): AgentAnswer {
    const q = text
      .replace(/\b(show|search|find|list|runtime|logs?|guardrail|shield|me|the|for|recent)\b/gi, " ")
      .trim();
    const res = invoke(ctx, "search_runtime_logs", { query: q.length > 2 ? q : "" });
    const r = new AgentAnswer("runtime_logs");
    r.answer = res.count ? `${res.count} runtime log record(s) matched (values redacted).` : (res.note ?? "");
    r.data = res as unknown as Loose;
    r.addControl("SE-08");
    r.addControl("IS-12");
    return r;
  }

  private approvalsStatus(ctx: ToolContext): AgentAnswer {
    const r = new AgentAnswer("approvals_status");
    if (ctx.user.role === "anonymous") return this.denied("approvals are not visible to anonymous users");
    const items = this.store
      .list("approvals")
      .filter((a) => a.requested_by === ctx.user.id || ctx.user.role === "approver" || ctx.user.role === "admin");
    this.audit.append("agent.read.approvals", ctx.user.id, { count: items.length }, { traceId: ctx.traceId });
    if (!items.length) r.answer = "There are no approvals visible to you.";
    else {
      r.answer = `${items.length} approval(s):`;
      r.details.push(
        items
          .slice(-25)
          .map((a) => `- ${a.approval_id} — ${a.type} — ${a.status} — requested by ${a.requested_by}`)
          .join("\n"),
      );
    }
    r.addControl("IS-13");
    return r;
  }

  // ================================================================ guided assessment
  private requiredMissing(profile: Loose): string[] {
    return intakeFields
      .filter((f) => f.required && (profile[f.id] === undefined || profile[f.id] === null || profile[f.id] === ""))
      .map((f) => f.id);
  }

  private askField(session: SessionRecord, r: AgentAnswer): void {
    const missing = this.requiredMissing(session.profile);
    const fid = missing[0] ?? "";
    const f = intakeField(fid);
    session.asked_field = fid;
    const opts = f?.options?.length ? ` Options: ${f.options.map(String).join(", ")}.` : "";
    r.clarifyingQuestion = `${f?.prompt ?? fid}${opts}`;
    const req = intakeFields.filter((x) => x.required).length;
    r.details.push(`**Intake (${req - missing.length}/${req} required fields known)** — ${f?.prompt ?? fid}${opts}`);
  }

  private profileTable(session: SessionRecord): string {
    const rows = Object.entries(session.profile).map(
      ([k, v]) => `| ${k} | ${pyValue(v as ProfileValue)} | ${session.provenance[k] ?? "User-asserted"} |`,
    );
    return "| Field | Value | Evidence status |\n|---|---|---|\n" + rows.join("\n");
  }

  private startGuided(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const r = new AgentAnswer("assessment_intake");
    this.reset(session);
    session.state = "intake";
    const colon = text.indexOf(":");
    const head = colon >= 0 ? text.slice(0, colon) : text;
    let desc = colon >= 0 && head.length <= 80 ? text.slice(colon + 1).trim() : text.trim();
    if (colon < 0 && wordCount(desc) <= 8 && START_RE.test(desc)) desc = ""; // just a command
    const prof = wordCount(desc) >= 4 ? extractProfile(desc) : {};
    session.profile = prof;
    session.provenance = Object.fromEntries(Object.keys(prof).map((k) => [k, INFERRED]));
    if (!this.can(ctx, CREATE_DRAFT)) session.preview = true;
    let intro =
      "Let's assess this AI use case. I'll gather intake facts, calculate a preliminary risk tier, select the " +
      "applicable question modules and then produce a gap register and report.";
    if (session.preview) {
      intro +=
        " Your role allows a preview (intake, risk tier and recommended controls); recording answers and " +
        "generating reports require an assessor role.";
    }
    const hasProfile = Object.keys(prof).length > 0;
    if (hasProfile) {
      r.answer = intro + ' From your description I inferred the fields below (Inferred — correct any with "field: value").';
      r.details.push(this.profileTable(session));
    } else r.answer = intro;
    r.addControl("EI-12");
    r.addControl("GL-01");
    if (!hasProfile) {
      session.asked_field = "description";
      r.clarifyingQuestion = DESCRIBE_PROMPT;
      return r;
    }
    return this.advanceIntake(ctx, session, r);
  }

  private advanceIntake(ctx: ToolContext, session: SessionRecord, r: AgentAnswer): AgentAnswer {
    if (this.requiredMissing(session.profile).length) {
      this.askField(session, r);
      return r;
    }
    return this.showTier(ctx, session, r);
  }

  private intakeTurn(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer | null {
    const r = new AgentAnswer("assessment_intake");
    const prof = session.profile;
    const prov = session.provenance;
    const updated: string[] = [];
    const asked = session.asked_field;
    if (asked === "description") {
      for (const [k, v] of Object.entries(extractProfile(text))) {
        prof[k] = v;
        prov[k] = INFERRED;
        updated.push(k);
      }
      if (updated.length) {
        r.answer = 'Thanks. I inferred the fields below (Inferred — correct any with "field: value").';
        r.details.push(this.profileTable(session));
        delete session.asked_field;
        return this.advanceIntake(ctx, session, r);
      }
      if (text.trim().endsWith("?")) return null;
      r.answer = "I couldn't extract any intake details from that.";
      r.clarifyingQuestion =
        "Please describe what the system does, who it affects, the data it uses and whether it takes actions.";
      return r;
    }
    for (const [k, v] of Object.entries(parseFieldAssignments(text))) {
      prof[k] = v;
      prov[k] = USER_ASSERTED;
      updated.push(k);
    }
    if (asked && !updated.includes(asked)) {
      const v = parseFieldValue(asked, text);
      if (v !== null) {
        prof[asked] = v;
        prov[asked] = USER_ASSERTED;
        updated.push(asked);
      }
    }
    if (!updated.length) {
      if (text.trim().endsWith("?")) return null; // side question: answer it, then re-prompt
      const f = asked ? intakeField(asked) : undefined;
      r.intent = "clarify";
      r.answer = "I couldn't match that to the intake question.";
      if (f && asked) {
        session.asked_field = asked;
        const opts = f.options?.length ? ` Please choose one of: ${f.options.map(String).join(", ")}.` : "";
        r.clarifyingQuestion = `${f.prompt}${opts}`;
      }
      return r;
    }
    r.answer = "Recorded: " + updated.map((k) => `${k} = ${pyValue(prof[k] as ProfileValue)}`).join(", ") + ".";
    delete session.asked_field;
    return this.advanceIntake(ctx, session, r);
  }

  private showTier(ctx: ToolContext, session: SessionRecord, r: AgentAnswer): AgentAnswer {
    const risk = invoke(ctx, "calculate_risk_tier", { profile: session.profile });
    session.risk = risk as unknown as NonNullable<SessionRecord["risk"]>;
    session.state = "tier_review";
    const mods = selectModulesFull(session.profile, risk.tier, risk.required_modules);
    const qs = applicableQuestions(session.profile as Profile, risk.tier, risk.required_modules);
    r.intent = "risk_tier";
    r.details.push(
      `**Preliminary risk tier: ${risk.tier}** (score ${risk.score}; Inferred — requires human confirmation). ` +
        (risk.rationale ?? ""),
    );
    if (risk.triggers.length) r.details.push("Triggers:\n" + risk.triggers.map((t) => `- ${t}`).join("\n"));
    r.details.push(
      "Applicable modules: " +
        mods.map((m) => `${m.name} (${m.reasons[0] ?? ""})`).join("; ") +
        `. ${qs.length} questions in total.`,
    );
    r.claim(`Preliminary risk tier ${risk.tier}`, INFERRED, risk.citation_ids ?? ["EI-02"]);
    for (const cid of risk.citation_ids ?? []) r.addControl(cid);
    if (session.preview) {
      const recs = invoke(ctx, "recommend_controls", { profile: session.profile, limit: 8 });
      r.details.push(
        "Recommended controls for this profile:\n" +
          recs.controls.map((c) => `- ${c.id} ${c.title} (${c.priority}; owner: ${pyStr(c.owner_role)})`).join("\n"),
      );
      for (const c of recs.controls) r.addControl(c.id);
      session.state = "preview_complete";
      r.nextActions = [
        "Ask an assessor to run the full assessment to record answers, produce the gap register and export a report.",
        "Book a Governance Baseline to assess this and other priority systems with evidence.",
      ];
      r.cta = CTA_BASELINE;
      return r;
    }
    r.clarifyingQuestion =
      `Reply "continue" to create a draft AI system record and start the ${qs.length} questions, or correct ` +
      'any field first (e.g. "autonomy: suggests").';
    return r;
  }

  private tierReviewTurn(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer | null {
    const r = new AgentAnswer("assessment_intake");
    let changes: Loose = parseFieldAssignments(text);
    if (!Object.keys(changes).length) {
      // a bare option value that belongs to exactly one select field
      const norm = text.trim().toLowerCase().replace(/[\s-]+/g, "_");
      const owners = intakeFields
        .filter((f) => f.type === "select" && (f.options ?? []).map((o) => String(o).toLowerCase()).includes(norm))
        .map((f) => f.id);
      const only = owners[0];
      if (owners.length === 1 && only) changes = { [only]: parseFieldValue(only, norm) };
    }
    if (Object.keys(changes).length) {
      for (const [k, v] of Object.entries(changes)) {
        session.profile[k] = v;
        session.provenance[k] = USER_ASSERTED;
      }
      r.answer =
        "Updated: " +
        Object.entries(changes)
          .map(([k, v]) => `${k} = ${pyFormat(v)}`)
          .join(", ") +
        ". Recalculating.";
      return this.showTier(ctx, session, r);
    }
    if (!AFFIRM_RE.test(text)) return null;
    // User confirmed the intake facts: inferred values become user-asserted.
    session.provenance = Object.fromEntries(Object.keys(session.profile).map((k) => [k, USER_ASSERTED]));
    const sysrec = invoke(ctx, "create_ai_system_record", { profile: session.profile }).system;
    const st = invoke(ctx, "start_assessment", {
      system_id: sysrec.id,
      profile: session.profile,
      profile_provenance: session.provenance,
    });
    session.system_id = sysrec.id;
    session.assessment_id = st.assessment_id;
    session.state = "questions";
    session.risk = st.risk as unknown as NonNullable<SessionRecord["risk"]>;
    const appr = invoke(ctx, "request_human_approval", {
      action: "confirm_risk_tier",
      resource_id: sysrec.id,
      payload: { tier: st.risk.tier, to_tier: st.risk.tier, assessment_id: st.assessment_id },
      reason: `Confirm preliminary tier ${st.risk.tier} for ${sysrec.name}`,
    });
    r.approval({ ...appr, status: "pending" });
    r.intent = "assessment_started";
    r.answer =
      `Draft AI system record ${sysrec.id} and assessment ${st.assessment_id} created. The preliminary ` +
      `tier (${st.risk.tier}) needs human confirmation — I raised pending approval ${appr.approval_id} ` +
      `for the ${st.risk.approval_authority || "approver"}.`;
    r.addControl("EI-01");
    r.addControl("EI-02");
    return this.askNextQuestion(ctx, session, r);
  }

  private askNextQuestion(ctx: ToolContext, session: SessionRecord, r: AgentAnswer): AgentAnswer {
    const a = this.store.get("assessments", session.assessment_id ?? "");
    if (!a) throw new ToolInputError(`Assessment '${session.assessment_id ?? ""}' not found.`);
    const skipped = session.skipped ?? [];
    const remaining = a.questions.filter((q) => !(q in a.responses) && !skipped.includes(q));
    const qid = remaining[0];
    if (!qid) return this.finishAssessment(ctx, session, r);
    const q = getQuestion(qid);
    if (!q) throw new Error(`Unknown question ${qid}`);
    session.current_q = qid;
    const n = a.questions.indexOf(qid) + 1;
    r.addQuestion(qid);
    for (const cid of q.controls) r.addControl(cid);
    r.details.push(
      `**Question ${n} of ${a.questions.length} — ${q.module_name} (${qid})**\n${q.text}\n` +
        `Controls: ${q.controls.join(", ")} · Evidence expected: ${q.evidence_expected.join("; ")}`,
    );
    r.clarifyingQuestion =
      "Answer implemented / partial / not implemented / unknown / not applicable, optionally with " +
      'evidence references (e.g. "implemented, evidence EV-104"). Say "skip" to leave it unanswered.';
    return r;
  }

  private questionTurn(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer | null {
    const r = new AgentAnswer("assessment_question");
    const aid = session.assessment_id ?? "";
    const qid = session.current_q;
    const recorded: string[] = [];
    const m = REMAINING_RE.exec(text);
    if (m) {
      const ans = parseAnswer(m[2] ?? "");
      const a = this.store.get("assessments", aid);
      for (const q of (a?.questions ?? []).filter((x) => !(x in (a?.responses ?? {})))) {
        invoke(ctx, "submit_assessment_response", { assessment_id: aid, question_id: q, answer: ans ?? "" });
        recorded.push(q);
      }
      r.answer = `Recorded "${pyStr(ans)}" for ${recorded.length} remaining question(s) (User-asserted).`;
      return this.askNextQuestion(ctx, session, r);
    }
    const bulk = [...text.matchAll(BULK_RE)];
    if (bulk.length) {
      for (const b of bulk) {
        const q = b[1] ?? "";
        const rest = b[2] ?? "";
        const ans = parseAnswer(rest);
        if (ans) {
          invoke(ctx, "submit_assessment_response", {
            assessment_id: aid,
            question_id: q.toUpperCase(),
            answer: ans,
            evidence_refs: parseEvidenceRefs(rest),
          });
          recorded.push(q.toUpperCase());
        }
      }
      if (recorded.length) {
        r.answer = `Recorded ${recorded.length} answer(s): ${recorded.join(", ")} (User-asserted).`;
        return this.askNextQuestion(ctx, session, r);
      }
    }
    if (SKIP_RE.test(text) && qid) {
      (session.skipped ??= []).push(qid);
      r.answer = `Skipped ${qid} — it will appear as an Inferred gap until answered.`;
      return this.askNextQuestion(ctx, session, r);
    }
    const firstClause = text.split(/[,;.—–]|\s-\s/)[0] ?? "";
    const ans = parseAnswer(firstClause) || (wordCount(text) <= 12 ? parseAnswer(text) : null);
    if (ans && qid) {
      const refs = parseEvidenceRefs(text);
      const notes = text.length > firstClause.length + 2 ? text : "";
      invoke(ctx, "submit_assessment_response", {
        assessment_id: aid,
        question_id: qid,
        answer: ans,
        evidence_refs: refs,
        notes,
      });
      r.answer =
        `Recorded ${qid}: ${answerOptions()[ans]?.label ?? ans}` +
        (refs.length ? ` with evidence ${refs.join(", ")} (pending named review)` : "") +
        " — User-asserted.";
      for (const ref of refs) r.addEvidence(ref, "User-asserted, pending review");
      return this.askNextQuestion(ctx, session, r);
    }
    return null; // not an answer: let the router treat it as a side question
  }

  private finishAssessment(ctx: ToolContext, session: SessionRecord, r: AgentAnswer): AgentAnswer {
    const aid = session.assessment_id ?? "";
    const g = invoke(ctx, "identify_gaps", { assessment_id: aid });
    const recs = invoke(ctx, "recommend_controls", { assessment_id: aid, limit: 5 });
    session.state = "complete";
    delete session.current_q;
    const s = g.summary;
    r.intent = "assessment_complete";
    r.details.push(
      `**Assessment complete.** ${s.answered} of ${s.questions} questions answered; ${s.gaps} gaps: ` +
        Object.entries(s.by_severity)
          .map(([k, n]) => `${n} ${k}`)
          .join(", ") +
        ".",
    );
    const top = g.gaps.slice(0, 6);
    if (top.length) {
      r.details.push(
        "Top gaps:\n" +
          top
            .map(
              (x) =>
                `- ${x.gap_id} [${x.severity} · ${x.evidence_status}] ${x.question_id}: ${x.recommended_action} ` +
                `(${x.controls.join(", ")}; owner: ${x.owner_role}; due ${x.due_date})`,
            )
            .join("\n"),
      );
    }
    for (const x of top) {
      r.claim(`${x.gap_id} ${x.question_id} (${x.controls.join(", ")})`, x.evidence_status as EvidenceStatus, x.controls);
      r.addQuestion(x.question_id);
      r.missingEvidence.push(`${x.question_id}: ${x.evidence_expected.slice(0, 2).join("; ")}`);
    }
    for (const c of recs.controls) r.addControl(c.id);
    r.nextActions = [
      'Say "generate report" for the Markdown/PDF/CSV/JSON readiness report.',
      'Say "create remediation tasks for critical gaps" (you\'ll be asked to confirm).',
      'Say "draft runtime policy" for guardrail recommendations (monitor mode).',
      "Attach evidence and ask an approver to review it so findings can become Verified.",
    ];
    r.data = { summary: s, assessment_id: aid };
    return r;
  }

  // ================================================================ post-assessment intents
  private resolveAssessment(session: SessionRecord, text: string): string | null {
    return /\basm_[a-z0-9]+\b/.exec(text)?.[0] ?? session.assessment_id ?? null;
  }

  private gaps(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const aid = this.resolveAssessment(session, text);
    const r = new AgentAnswer("gap_analysis");
    if (!aid) {
      r.intent = "clarify";
      r.answer = "There is no assessment in this session to analyse.";
      r.clarifyingQuestion = 'Which assessment (asm_…) should I analyse, or shall we start one? Say "assess a use case".';
      return r;
    }
    const g = invoke(ctx, "identify_gaps", { assessment_id: aid });
    const s = g.summary;
    r.answer =
      `Gap analysis for ${aid} (tier ${g.tier}): ${s.gaps} gaps — ` +
      Object.entries(s.by_severity)
        .map(([k, n]) => `${n} ${k}`)
        .join(", ") +
      ".";
    r.details.push(
      "| Gap | Severity | Evidence status | Question | Controls | Owner | Due |\n|---|---|---|---|---|---|---|\n" +
        g.gaps
          .slice(0, 20)
          .map(
            (x) =>
              `| ${x.gap_id} | ${x.severity} | ${x.evidence_status} | ${x.question_id} | ${x.controls.join(", ")} | ${x.owner_role} | ${x.due_date} |`,
          )
          .join("\n"),
    );
    for (const x of g.gaps.slice(0, 20)) {
      r.claim(`${x.gap_id} ${x.question_id}`, x.evidence_status as EvidenceStatus, x.controls);
      r.addQuestion(x.question_id);
    }
    r.data = { summary: s };
    return r;
  }

  private report(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const aid = this.resolveAssessment(session, text);
    const r = new AgentAnswer("report");
    if (!aid) {
      r.intent = "clarify";
      r.answer = "There is no assessment in this session to report on.";
      r.clarifyingQuestion = "Which assessment (asm_…) should the report cover, or shall we start one?";
      return r;
    }
    const res = invoke(ctx, "generate_report", { assessment_id: aid });
    session.last_report_id = res.report_id;
    r.answer =
      `Draft report ${res.report_id} generated for ${aid} (${res.summary.gaps} gaps). Exports: ` +
      Object.entries(res.paths)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.toUpperCase()}: ${pyStr(v)}`)
        .join(", ") +
      ".";
    if (Object.keys(res.errors).length) r.details.push("Export issues: " + Object.values(res.errors).join("; "));
    r.details.push("The report states readiness and evidence status only; sharing it externally requires human approval.");
    r.data = { report_id: res.report_id, paths: res.paths };
    r.addControl("SE-05");
    return r;
  }

  private tasks(ctx: ToolContext, session: SessionRecord, text: string): AgentAnswer {
    const aid = this.resolveAssessment(session, text);
    const r = new AgentAnswer("remediation_tasks");
    if (!aid) {
      r.intent = "clarify";
      r.answer = "There is no assessment in this session, so there are no gaps to create tasks for.";
      r.clarifyingQuestion = "Which assessment (asm_…) should I use?";
      return r;
    }
    const sevList = ["Critical", "High", "Medium", "Low"].filter((s) => new RegExp(`\\b${s}\\b`, "i").test(text));
    const sev = sevList.length ? sevList : null;
    const gapList = text.toUpperCase().match(/\bGAP-\d{3}\b/g);
    const gapIds = gapList && gapList.length ? [...gapList] : null;
    let res;
    try {
      res = invoke(ctx, "create_remediation_task", {
        assessment_id: aid,
        gap_ids: gapIds,
        severities: sev,
        confirmed: false,
      });
    } catch (err) {
      if (!(err instanceof ToolInputError)) throw err;
      const g = invoke(ctx, "identify_gaps", { assessment_id: aid });
      r.answer =
        "No gaps match that request, so no tasks were proposed. Current gaps by severity: " +
        Object.entries(g.summary.by_severity)
          .map(([k, n]) => `${n} ${k}`)
          .join(", ") +
        ".";
      r.clarifyingQuestion = "Which severity or gap IDs (e.g. GAP-003) should the tasks cover?";
      return r;
    }
    if (res.status !== "confirmation_required") throw new Error("unexpected task creation without confirmation");
    session.pending_confirmation = { kind: "remediation_tasks", assessment_id: aid, gap_ids: gapIds, severities: sev };
    r.answer = `I'm ready to create ${res.preview.length} remediation task(s). Nothing has been created yet.`;
    r.details.push(
      res.preview
        .map(
          (p) =>
            `- ${p.gap_id} [${p.severity}] ${p.title} — ${p.controls.join(", ")}; owner: ` +
            `${p.owner_role}; due ${p.due_date}`,
        )
        .join("\n"),
    );
    r.clarifyingQuestion = 'Reply "confirm" to create these tasks, or "cancel".';
    r.data = { status: "confirmation_required", preview: res.preview };
    return r;
  }

  private executeConfirmation(
    ctx: ToolContext,
    _session: SessionRecord,
    pc: NonNullable<SessionRecord["pending_confirmation"]>,
  ): AgentAnswer {
    const r = new AgentAnswer("remediation_tasks");
    if (pc.kind === "remediation_tasks") {
      const res = invoke(ctx, "create_remediation_task", {
        assessment_id: pc.assessment_id,
        gap_ids: pc.gap_ids ?? null,
        severities: pc.severities ?? null,
        confirmed: true,
      });
      if (res.status === "created") {
        r.answer = `Created ${res.count} remediation task(s): ${res.task_ids.join(", ")} (status: open).`;
      }
      r.data = res as unknown as Loose;
      r.addControl("SE-06");
    }
    return r;
  }

  private draftPolicy(ctx: ToolContext, session: SessionRecord): AgentAnswer {
    const r = new AgentAnswer("runtime_policy");
    const aid = session.assessment_id;
    let res;
    if (aid) res = invoke(ctx, "draft_runtime_policy", { assessment_id: aid });
    else if (Object.keys(session.profile ?? {}).length) {
      res = invoke(ctx, "draft_runtime_policy", { profile: session.profile });
    } else {
      r.intent = "clarify";
      r.answer = "I need a use-case profile to draft a runtime policy.";
      r.clarifyingQuestion = 'Shall we run a guided assessment first? Say "assess a use case".';
      return r;
    }
    if (res.policy_id) session.policy_id = res.policy_id;
    r.answer = res.message;
    r.details.push(
      "Recommended guardrails:\n" + res.guardrails.map((g) => `- ${g.id}: ${g.title} (${g.controls.join(", ")})`).join("\n"),
    );
    if (res.validation_errors?.length) {
      r.details.push("Policy validation notes: " + res.validation_errors.slice(0, 5).map(String).join("; "));
    }
    r.requiredApprovals.push({
      action: "activate_runtime_policy",
      why: "Activating or changing a production runtime policy requires human approval.",
    });
    r.cta = CTA_SHIELD;
    r.data = {
      status: res.status,
      policy_id: res.policy_id ?? null,
      mode: res.mode ?? null,
      environment: res.environment ?? null,
    };
    return r;
  }
}

function questionsCiting(cid: string): string[] {
  return [
    ...maturityQuestions.filter((q) => (q.controls ?? []).includes(cid)).map((q) => q.id),
    ...allQuestions()
      .filter((q) => q.controls.includes(cid))
      .map((q) => q.id),
  ];
}

function summarizeResult(x: KnowledgeToolHit, qTerms: Set<string>, r: AgentAnswer): string {
  const kind = x.kind;
  if (kind === "control") {
    const c = control(x.id);
    r.addControl(c.id);
    return (
      `${c.id} ${c.title} (${c.priority} priority, owner: ${c.owner_role}): ${c.objective} ` +
      `Typical evidence: ${(c.evidence ?? []).slice(0, 3).join("; ")}.`
    );
  }
  if (kind === "use_case_question" || kind === "maturity_question") {
    const q = getQuestion(x.id);
    r.addQuestion(x.id);
    if (q) return `Assessed by ${q.id}: "${q.text}" (${q.controls.join(", ")}). Recommended action: ${q.remediation}`;
    return `Assessed by maturity question ${x.id} (${x.control_ids.join(", ")}): ${x.text.slice(x.id.length + 1).slice(0, 300)}`;
  }
  const src = x.source as { path?: string; section?: string; policy_id?: string; policy_version?: string | null };
  const addSrc = () => r.addDoc(x.source as Parameters<AnswerBuilder["addDoc"]>[0]);
  if (kind === "critical_flag") {
    addSrc();
    return `Critical flag ${x.title} (${x.control_ids.join(", ")}).`;
  }
  addSrc();
  const policyLabel = src.policy_id ? `Policy ${src.policy_id} v${src.policy_version || "?"}` : null;
  if (x.summary) return `Per ${policyLabel ?? pyStr(src.path)}, ${x.summary}`;
  if (kind.endsWith("_section") || kind.endsWith("_rule") || kind === "policy_pack" || kind === "industry_pack") {
    const sec = src.section ?? "";
    return `See ${policyLabel ?? pyStr(src.path)}` + (sec ? ` § ${sec.replaceAll("_", " ")}` : "") + ` (${pyStr(src.path)}).`;
  }
  const sents = x.text.split(/(?<=[.!?])\s+|\n+/);
  const scored = sents
    .map((s, i) => ({ s, i, n: new Set(tokenize(s)) }))
    .filter(({ s }) => wordCount(s) >= 4)
    .map(({ s, i, n }) => ({ s, i, overlap: [...n].filter((tk) => qTerms.has(tk)).length }))
    .sort((a, b) => b.overlap - a.overlap || a.i - b.i);
  const best = scored
    .slice(0, 2)
    .sort((a, b) => a.i - b.i)
    .map(({ s }) => s.replaceAll("**", "").replace(/^[ \-*#|>]+|[ \-*#|>]+$/g, ""))
    .join(" ")
    .slice(0, 500);
  const label = policyLabel ?? `${pyStr(src.path)}` + (src.section ? ` § ${src.section}` : "");
  return `Per ${label}: ${best}`;
}

export type { EvidenceRecord, ApprovalRecord };
