/**
 * Ask AEGIS — browser port of the deterministic AEGIS Agent (platform/app/agent/aegis_agent/
 * orchestrator.py) for the public website demo, which runs as the least-privilege `viewer` role.
 *
 * Intent routing → retrieval → templated, cited composition. No LLM, no network, no storage:
 * nothing can be created, approved, exported or sent; sensitive actions return the same
 * refusal / approval-required messages the agent gives a viewer.
 */
import {
  NO_SOURCE_MESSAGE,
  STANDARD_DISCLAIMER,
  controlCitation,
  controlLibrary,
  controls,
  getControl,
  maturityTemplate,
  pillars,
  type AegisControl,
  type EvidenceStatus,
  type FrameworkKey,
} from "../../content";
import {
  AnswerBuilder,
  CTA_ASSESSMENT,
  CTA_BASELINE,
  type AnswerSource,
  type Claim,
  type Cta,
  type RequiredApproval,
} from "./compose";
import {
  CONTROL_ID_RE,
  FRAMEWORK_LABELS,
  MATURITY_QID_RE,
  UC_QID_RE,
  controlsForFramework,
  controlsForFrameworkRef,
  detectFrameworks,
  docSource,
  getIndex,
  inGovernanceScope,
  industryPacks,
  maturityQuestions,
  parseFrameworkRefs,
  policyPacks,
  searchKnowledge,
  tokenize,
  type SearchHit,
} from "./knowledge";
import {
  ANNEX_III_LIKE,
  allQuestions,
  applicableQuestions,
  calculateRiskTier,
  extractProfile,
  getQuestion,
  intakeField,
  intakeFields,
  parseFieldAssignments,
  parseFieldValue,
  pyValue,
  recommendControls,
  selectModules,
  type Profile,
  type RiskResult,
  type UseCaseQuestion,
} from "./question-bank";
import {
  asksComplianceDetermination,
  asksLegalClassification,
  detectApprovalBypass,
  detectInjection,
  findProhibitedClaims,
  redact,
} from "./safety";

/** The public website demo identity, as in aegis_api/server.py. */
const ROLE = "viewer";
const VERSION = controlLibrary.version;
const REG_NOTE =
  "Regulatory applicability timelines must be verified against the current Official Journal text and any " +
  "amendments; AEGIS has not verified post-2025 changes.";
const NO_RECORD_BASIS = "no assessment response or reviewed evidence on record in this session";
const MISSING: EvidenceStatus = "Missing evidence";
const INFERRED: EvidenceStatus = "Inferred";
const USER_ASSERTED: EvidenceStatus = "User-asserted";

// --------------------------------------------------------------------------- session & response
export type AskState = "idle" | "intake" | "tier_review" | "questions" | "preview_complete";

/** Conversation state kept by the caller between turns (the browser equivalent of a session). */
export interface AskSession {
  state: AskState;
  profile: Profile;
  provenance: Record<string, EvidenceStatus>;
  asked_field?: string;
  risk?: RiskResult;
  preview?: boolean;
}

export function createAskSession(): AskSession {
  return { state: "idle", profile: {}, provenance: {} };
}

const GUIDED_STATES: ReadonlySet<AskState> = new Set(["intake", "tier_review", "questions"]);

export type PublicSource =
  Exclude<AnswerSource, { key: string }> | Omit<Extract<AnswerSource, { key: string }>, "key">;

/** Response shaped like the /api/agent/message payload that ask-aegis.js renders. */
export interface AskAegisResponse {
  intent: string;
  state: AskState;
  /** Direct answer (first paragraph). */
  answer: string;
  /** Full Markdown answer (same subset tools-common.js renderMarkdown supports). */
  message: string;
  /** AEGIS control IDs cited (sorted). */
  citations: string[];
  claims: Claim[];
  sources: PublicSource[];
  missing_evidence: string[];
  next_actions: string[];
  required_approvals: RequiredApproval[];
  /** Always empty: a viewer cannot raise approval requests. */
  pending_approvals: never[];
  cta: Cta | null;
  clarifying_question: string | null;
  confidence: number | null;
  confidence_band: string | null;
  /** Evidence status of the first claim, when the answer carries claims. */
  evidence_status?: EvidenceStatus;
  /** True when the request was declined (injection, out of scope, determination, action). */
  refused: boolean;
  disclaimer: string;
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

function toResponse(r: AnswerBuilder, state: AskState): AskAegisResponse {
  r.autoCite();
  const message = r.render();
  const out: AskAegisResponse = {
    intent: r.intent,
    state,
    answer: r.answer,
    message,
    citations: [...new Set(r.controlIds())].sort(),
    claims: r.claims,
    sources: r.sources.map((s) => {
      if ("key" in s) {
        const { key: _key, ...rest } = s;
        return rest;
      }
      return s;
    }),
    missing_evidence: r.missingEvidence,
    next_actions: r.nextActions,
    required_approvals: r.requiredApprovals,
    pending_approvals: [],
    cta: r.cta,
    clarifying_question: r.clarifyingQuestion,
    confidence: r.confidence,
    confidence_band: r.confidenceBand,
    refused: REFUSAL_INTENTS.has(r.intent),
    disclaimer: STANDARD_DISCLAIMER,
  };
  const first = r.claims[0];
  if (first) out.evidence_status = first.evidence_status;
  return out;
}

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
const HELP_RE = rx(
  String.raw`^\s*(hi|hello|hey|help|what can you do|who are you|menu|start|\?)\W*\s*$`,
);
const QUESTION_RE = rx(
  String.raw`^\s*(how|what|why|when|which|who|where|should|is|are|does|do|did)\b`,
);
const LIBRARY_RE = rx(
  String.raw`\bhow many (aegis )?controls\b|\b(list|show|what are)\b.{0,15}\b(all\s+)?(the\s+)?(aegis\s+)?(controls|pillars)\b|` +
    String.raw`\b(aegis\s+)?(control\s+library|pillars)\b.{0,20}\b(overview|structure)?\s*\??$`,
);
const PACKS_RE = rx(
  String.raw`\b(which|what|list|show)\b.{0,25}\b(policy|industry|runtime)\s+packs\b|\b(policy|industry|runtime)\s+packs?\b.{0,20}\b(exist|available|are there|do you have)\b`,
);
const MATURITY_RE = rx(
  String.raw`\b(rate|score|assess|measure|benchmark|check|what is|what's|evaluate)\b.{0,25}\b(our|my|the organi[sz]ation'?s?)\b.{0,25}\bmaturity\b|` +
    String.raw`\bhow mature\b|\bmaturity (self[- ])?assessment\b|\bmaturity levels?\b`,
);
const USECASE_CONTROLS_RE = rx(
  String.raw`\b(what|which)\b.{0,30}\b(aegis\s+)?(controls?|guardrails?|safeguards?|governance\s+controls?)\b.{0,50}` +
    String.raw`\b(apply|applies|need|needed|required|require|should|recommend\w*|for)\b.{0,80}` +
    String.raw`\b(agents?|assistants?|chatbots?|copilots?|bots?|models?|systems?|tools?|use[- ]?cases?|apps?|applications?)\b|` +
    String.raw`\b(recommend|suggest|list)\b.{0,20}\b(controls?|guardrails?)\b.{0,20}\bfor\s+(an?|our|the|my)\b`,
);
const CANCEL_RE = rx(String.raw`^\s*(cancel|stop|quit|exit|abort|restart|reset)\b`);
const AFFIRM_RE = rx(
  String.raw`^\s*(y|yes|confirm|confirmed|go ahead|proceed|ok|okay|do it|continue|start|begin|sure)\b`,
);
const FRAMEWORK_INTENT_RE = rx(
  String.raw`\b(map|maps|mapped|mapping|mappings|crosswalk|correspond|align|alignment|relate)\b|` +
    String.raw`\bwhich (aegis )?controls?\b.{0,40}\b(eu ai act|iso|nist|article|art\.|annex|govern|measure|manage|clause)\b`,
);

const SENSITIVE_ACTIONS: Record<string, string> = {
  change_risk_tier: "Change an AI system's risk tier",
  confirm_risk_tier: "Confirm an inferred risk tier for an AI system",
  approve_exception: "Approve a governance exception / risk acceptance",
  activate_runtime_policy: "Activate or change a production runtime policy",
  export_sensitive_evidence: "Export a sensitive evidence pack",
  send_external_communication: "Send an external communication",
};
const SENSITIVE_ACTION_CONTROLS: Record<string, string[]> = {
  change_risk_tier: ["EI-02", "GL-03"],
  confirm_risk_tier: ["EI-02", "GL-03"],
  approve_exception: ["GL-10"],
  activate_runtime_policy: ["IS-12", "GL-04"],
  export_sensitive_evidence: ["SE-02", "SE-05"],
  send_external_communication: ["AO-06", "SE-11"],
};
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
  [
    "export_sensitive_evidence",
    rx(String.raw`\b(export|download|send|share|extract)\b.{0,40}\bevidence\b`),
  ],
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

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function control(cid: string): AegisControl {
  const c = getControl(cid);
  if (!c) throw new Error(`Unknown AEGIS control ID: ${cid}`);
  return c;
}

/** Thrown for actions the viewer role may not perform (tools.check_permission). */
class PermissionDenied extends Error {}
/** Thrown for tool input errors (tools._require). */
class InputError extends Error {}

function deny(tool: string, permission: string | null, minRole = "assessor"): never {
  throw new PermissionDenied(
    permission
      ? `role '${ROLE}' may not use ${permission} tools`
      : `${tool} requires role '${minRole}' or higher (you are '${ROLE}')`,
  );
}

// --------------------------------------------------------------------------- the agent
class AskAegisAgent {
  constructor(private readonly session: AskSession) {}

  handle(rawMessage: string): AskAegisResponse {
    const message = (rawMessage || "").slice(0, 4000);
    let r: AnswerBuilder;
    try {
      r = this.route(message);
    } catch (err) {
      if (err instanceof PermissionDenied) r = this.denied(err.message);
      else if (err instanceof InputError) {
        r = new AnswerBuilder("input_error");
        r.answer = `I couldn't complete that: ${err.message}`;
        r.clarifyingQuestion = "Could you provide the missing or corrected detail?";
      } else throw err;
    }
    // Defence in depth: a deterministic answer must never carry a prohibited claim.
    const out = toResponse(r, this.session.state);
    if (findProhibitedClaims(out.message).length) {
      const safe = new AnswerBuilder("safety_fallback");
      safe.answer =
        "I can't provide that statement. AEGIS reports governance readiness and evidence status; it " +
        "does not determine or certify compliance.";
      return toResponse(safe, this.session.state);
    }
    return out;
  }

  // ================================================================ routing
  private route(text: string): AnswerBuilder {
    const s = this.session;
    const t = text.trim();
    if (!t) return this.help();
    const inj = detectInjection(t);
    if (inj.length === 1 && inj[0] === "compliance_claim_coercion") {
      // A request to *state* compliance without override/jailbreak markers: readiness framing + refusal.
      const r = this.complianceReadiness(t);
      r.answer +=
        " AEGIS never states that an organization is compliant, certified or regulator-approved; it " +
        "reports readiness indicators and evidence status only.";
      return r;
    }
    if (inj.length) return this.injection(t, inj);

    if (CANCEL_RE.test(t) && GUIDED_STATES.has(s.state)) {
      this.reset();
      const r = new AnswerBuilder("assessment_cancelled");
      r.answer =
        "Guided assessment closed. Saved responses remain on the draft assessment record. " +
        'Say "assess a use case" to start again.';
      return r;
    }

    if (detectApprovalBypass(t)) return this.approvalBypass(t);
    const sens = SENSITIVE_PATTERNS.find(([, re]) => re.test(t))?.[0];
    if (sens && !QUESTION_RE.test(t)) return this.sensitiveAction(sens);

    if (s.state === "intake") {
      const r = this.intakeTurn(t);
      if (r) return r;
    }

    const hasControlId = CONTROL_ID_RE.test(t);
    if (asksLegalClassification(t)) return this.withReprompt(this.legalClassification());
    if (asksComplianceDetermination(t)) return this.withReprompt(this.complianceReadiness(t));
    if (LIBRARY_RE.test(t)) return this.withReprompt(this.libraryOverview());
    if (PACKS_RE.test(t)) return this.withReprompt(this.packsOverview(t));
    if (MATURITY_RE.test(t)) return this.withReprompt(this.maturityOverview());
    if (START_RE.test(t) && !GUIDED_STATES.has(s.state) && !/\?\s*$/.test(t))
      return this.startGuided(t);
    if (REPORT_RE.test(t) && !QUESTION_RE.test(t)) return this.report(t);
    if (TASK_RE.test(t) && !QUESTION_RE.test(t)) return this.tasks(t);
    if (POLICY_RE.test(t) && !/\?\s*$/.test(t) && !QUESTION_RE.test(t)) return this.draftPolicy();
    if (LOGS_RE.test(t)) deny("search_runtime_logs", null);
    if (APPROVALS_RE.test(t)) return this.approvalsStatus();
    if (
      (GAP_RE.test(t) && /\basm_\w+/.test(t)) ||
      /\b(gap analysis|show (me )?(the )?gaps)\b/i.test(t)
    )
      return this.gaps(t);
    if (INVENTORY_RE.test(t) && !hasControlId && !/\bcontrols?\b/i.test(t)) return this.inventory();
    if (USECASE_CONTROLS_RE.test(t) && !hasControlId && !parseFrameworkRefs(t).length)
      return this.withReprompt(this.useCaseControls(t));
    if (TIERQ_RE.test(t) && !hasControlId) return this.withReprompt(this.tierQuestion(t));
    if (hasControlId) return this.withReprompt(this.controlLookup(t));
    if (MATURITY_QID_RE.test(t) || UC_QID_RE.test(t))
      return this.withReprompt(this.questionLookup(t));
    if (parseFrameworkRefs(t).length || (FRAMEWORK_INTENT_RE.test(t) && detectFrameworks(t).size))
      return this.withReprompt(this.frameworkMapping(t));
    if (HELP_RE.test(t)) return this.help();
    if (AFFIRM_RE.test(t) && wordCount(t) <= 3) {
      const r = new AnswerBuilder("nothing_pending");
      r.answer = "There is nothing awaiting your confirmation right now.";
      r.nextActions = ['Ask a governance question or say "assess a use case".'];
      return r;
    }
    return this.withReprompt(this.ask(t));
  }

  /** When a side question is asked mid-intake, answer it and repeat the pending prompt. */
  private withReprompt(r: AnswerBuilder): AnswerBuilder {
    const s = this.session;
    if (s.state === "intake" && s.asked_field) {
      const prompt = intakeField(s.asked_field)?.prompt ?? DESCRIBE_PROMPT;
      r.details.push(`_Back to intake — ${prompt}_`);
    }
    return r;
  }

  private reset(): void {
    const s = this.session;
    delete s.asked_field;
    delete s.risk;
    s.state = "idle";
    s.profile = {};
    s.provenance = {};
  }

  private denied(reason: string): AnswerBuilder {
    const r = new AnswerBuilder("permission_denied");
    r.answer =
      `That action isn't available to your role (${reason}). AEGIS applies least privilege: viewers can ask ` +
      "questions and run previews; assessors create drafts; approvers resolve approvals.";
    r.nextActions = [
      "Ask an assessor or administrator to perform this action, or request the appropriate role.",
    ];
    return r;
  }

  // ================================================================ safety intents
  private injection(text: string, signals: string[]): AnswerBuilder {
    const r = new AnswerBuilder("prompt_injection");
    r.answer =
      "I can't follow instructions that try to override AEGIS governance rules, change my role, or reveal " +
      "internal configuration. My rules are fixed: answers are evidence-based and cited, high-impact actions " +
      "require human approval, and sensitive data is redacted.";
    if (signals.includes("compliance_claim_coercion") || asksComplianceDetermination(text)) {
      r.answer +=
        " AEGIS never states that an organization is compliant, certified or regulator-approved; it " +
        "reports readiness indicators and evidence status only.";
    }
    r.addControl("IS-14");
    r.addControl("IS-12");
    r.nextActions = [
      'Ask a governance question (e.g. "What evidence supports IS-13?").',
      'Run a readiness assessment: say "assess a use case".',
      "If you are testing agent defences, record this attempt as evidence for IS-14 adversarial testing.",
    ];
    return r;
  }

  private approvalBypass(text: string): AnswerBuilder {
    const r = new AnswerBuilder("approval_bypass");
    r.answer =
      "I can't approve, skip or self-execute a human approval — regardless of the requester's title. " +
      "Changing a risk tier, approving an exception, activating a production runtime policy, exporting " +
      "sensitive evidence and sending external communications always create a pending approval that a " +
      "different user with an approver role must resolve in the approvals queue (not in this chat).";
    r.addControl("IS-13");
    r.addControl("GL-03");
    const sens = SENSITIVE_PATTERNS.find(([, re]) => re.test(text))?.[0];
    if (sens) {
      const sub = this.sensitiveAction(sens);
      r.details.push(sub.answer, ...sub.details);
      r.requiredApprovals.push(...sub.requiredApprovals);
      for (const cid of sub.controlIds()) r.addControl(cid);
    }
    r.nextActions = [
      // The Python agent points to its admin CLI here; the website has no Python runtime.
      "A named approver with the approver role must approve or reject the pending item in the AEGIS approvals workflow; it cannot be bypassed from this chat.",
    ];
    return r;
  }

  private sensitiveAction(action: string): AnswerBuilder {
    const r = new AnswerBuilder("approval_required");
    const label = SENSITIVE_ACTIONS[action] ?? action;
    for (const cid of SENSITIVE_ACTION_CONTROLS[action] ?? []) r.addControl(cid);
    r.requiredApprovals.push({
      action,
      why: `${label} requires human approval and never self-executes.`,
    });
    // The public demo runs as a viewer, which cannot raise approval requests (create_draft).
    r.answer =
      `"${label}" requires human approval and your role (${ROLE}) cannot raise approval requests. ` +
      "Nothing has been changed.";
    r.nextActions = [
      "Ask an assessor to raise the approval request, or sign in with an assessor role.",
    ];
    return r;
  }

  private complianceReadiness(text: string): AnswerBuilder {
    const r = new AnswerBuilder("compliance_readiness");
    r.disclaimer = true;
    const fws = [...detectFrameworks(text)].sort();
    const names: Record<FrameworkKey, string> = {
      eu_ai_act: "the EU AI Act",
      iso_42001: "ISO/IEC 42001",
      nist_ai_rmf: "the NIST AI RMF",
    };
    const fwTxt = fws.length
      ? fws.map((f) => names[f]).join(" or ")
      : "any AI regulation or standard";
    if (/\b(apply|applies|applicable|in scope)\b/i.test(text)) {
      r.answer =
        `AEGIS cannot determine whether ${fws.length ? fwTxt : "a law or standard"} legally applies to your ` +
        "organization — applicability depends on your role (e.g. provider or deployer), your systems and " +
        "jurisdictions, and needs qualified legal review. AEGIS helps you prepare: record obligations by " +
        "system in an obligations register (AO-07), classify systems by risk (EI-02) and assess readiness " +
        "against the mapped controls.";
    } else {
      r.answer =
        `AEGIS cannot determine, certify or guarantee whether your organization or system is compliant with ${fwTxt}. ` +
        "That is a legal determination (and, for ISO/IEC 42001 certification, a decision for an accredited " +
        "certification body). What AEGIS can do is assess readiness: which controls mapped to the framework " +
        "are in place, what evidence exists, and what gaps remain.";
    }
    if (fws.includes("iso_42001")) {
      r.answer +=
        " AEGIS does not issue certificates; it can prepare an audit-ready evidence pack (SE-05) for your certification body.";
    }
    if (fws.includes("eu_ai_act")) r.answer += " " + REG_NOTE;
    const pool: AegisControl[] = [];
    for (const f of fws.length
      ? fws
      : (["eu_ai_act", "iso_42001", "nist_ai_rmf"] as FrameworkKey[])) {
      pool.push(...controlsForFramework(f));
    }
    const seen = new Set<string>();
    const sel: AegisControl[] = [];
    for (const c of [...pool].sort(
      (a, b) =>
        PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
        cmpStr(a.id, b.id),
    )) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        sel.push(c);
      }
    }
    const rows: string[] = [];
    for (const c of sel.slice(0, 6)) {
      const keys = (fws.length ? fws : Object.keys(c.mappings ?? {})) as FrameworkKey[];
      const refs = keys
        .filter((k) => (c.mappings?.[k] ?? []).length)
        .map((k) => `${k}: ${(c.mappings?.[k] ?? []).map(String).join(", ")}`)
        .join("; ");
      rows.push(`- ${c.id} ${c.title} — ${refs}`);
      r.addControl(c.id);
      r.claim(`${c.id} ${c.title}: organizational evidence status (${NO_RECORD_BASIS})`, MISSING, [
        c.id,
      ]);
      r.missingEvidence.push(`${c.id}: ${c.evidence?.[0] ?? ""}`);
    }
    r.details.push(
      "**Readiness indicators to evidence first (priority controls with indicative mappings):**\n" +
        rows.join("\n"),
    );
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

  private legalClassification(): AnswerBuilder {
    const r = new AnswerBuilder("legal_classification");
    r.disclaimer = true;
    r.answer =
      "AEGIS does not make legal classifications under the EU AI Act (for example whether a system is " +
      '"high-risk" under Art. 6 and Annex III, or a prohibited practice under Art. 5). That determination ' +
      "needs qualified legal review. AEGIS supports it with an indicative screen: the risk-tier rules flag use " +
      "cases in Annex III-like areas, material or automated decisions, special-category data and autonomous " +
      "agents for legal classification review, and record the outcome in the obligations register.";
    const areas = [...new Set(Object.values(ANNEX_III_LIKE))].sort();
    r.details.push("Areas the AEGIS screen flags for legal review: " + areas.join("; ") + ".");
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

  // ================================================================ overviews
  private libraryOverview(): AnswerBuilder {
    const r = new AnswerBuilder("library_overview");
    const crit = controls.filter((c) => c.priority === "critical").length;
    r.answer =
      `The AEGIS Control Library v${VERSION} has ${controls.length} controls across ${pillars.length} pillars ` +
      `(${crit} critical-priority). Each control has an objective, expected evidence, an owner role and indicative ` +
      "NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings.";
    r.details.push(
      pillars
        .map(
          (p) =>
            `- **${p.id} — ${p.name}** (${controls.filter((c) => c.pillar === p.id).length} controls): ${p.summary}`,
        )
        .join("\n"),
    );
    r.addDoc({
      id: "controls.yaml",
      path: "content/controls/controls.yaml",
      section: `Control Library v${VERSION}`,
      title: "AEGIS Control Library",
    });
    r.nextActions = ['Ask about any control by ID (e.g. "What does IS-13 require?").'];
    return r;
  }

  private packsOverview(text: string): AnswerBuilder {
    const r = new AnswerBuilder("packs_overview");
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
        const status = meta["status"] ? String(meta["status"]) : "";
        lines.push(`- ${name} — ${pid} v${ver}` + (status ? ` (${status})` : ""));
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

  private maturityOverview(): AnswerBuilder {
    const t = maturityTemplate ?? {};
    const meta = (t.template ?? {}) as { id: string; name: string; version: string };
    const levels = (t.scoring?.levels ?? []) as Array<{ name: string; min: number; max: number }>;
    const r = new AnswerBuilder("maturity");
    r.answer =
      `AEGIS measures governance maturity with the ${meta.name} (v${meta.version}): ` +
      `${maturityQuestions.length} questions across ${(t.domains ?? []).length} weighted domains, scored 1–5 and rolled up to ` +
      "0–100. Results are User-asserted readiness indicators, not a compliance determination. I can't rate your " +
      "maturity from a chat message — take the self-assessment for an indicative baseline.";
    r.details.push(
      "Maturity levels: " + levels.map((lv) => `${lv.name} (${lv.min}–${lv.max})`).join("; ") + ".",
    );
    r.addDoc({
      id: meta.id,
      path: "content/assessment_templates/maturity_self_assessment.yaml",
      section: `${meta.id} v${meta.version}`,
      title: meta.name,
    });
    r.nextActions = [
      "Take the self-assessment, then validate it with evidence in a Governance Baseline.",
    ];
    r.cta = CTA_ASSESSMENT;
    return r;
  }

  private help(): AnswerBuilder {
    const r = new AnswerBuilder("help");
    r.answer =
      "I'm the AEGIS governance copilot. I can:\n" +
      '- answer AI governance, control and framework-mapping questions with citations (e.g. "What does IS-11 require?", ' +
      '"Which controls map to EU AI Act Art. 14?");\n' +
      '- run a guided use-case assessment ("assess a use case") with risk tiering, gap analysis and a report;\n' +
      "- draft runtime guardrail policies and raise approval requests for sensitive actions.\n" +
      "I report readiness and evidence status — I never determine or certify compliance.";
    r.nextActions = ["Ask a governance question", 'Say "assess a use case"'];
    r.cta = CTA_ASSESSMENT;
    return r;
  }

  private outOfScope(): AnswerBuilder {
    const r = new AnswerBuilder("out_of_scope");
    r.answer =
      "That's outside what AEGIS covers — I answer AI governance, risk, control and evidence questions. " +
      NO_SOURCE_MESSAGE;
    r.nextActions = [
      "Ask about AI policies, controls, risk tiers, framework mappings or evidence.",
      'Say "assess a use case" to start a guided assessment.',
    ];
    return r;
  }

  // ================================================================ actions a viewer cannot take
  private resolveAssessment(text: string): string | null {
    return /\basm_[a-z0-9]+\b/.exec(text)?.[0] ?? null;
  }

  private gaps(text: string): AnswerBuilder {
    const aid = this.resolveAssessment(text);
    if (!aid) {
      const r = new AnswerBuilder("clarify");
      r.answer = "There is no assessment in this session to analyse.";
      r.clarifyingQuestion =
        'Which assessment (asm_…) should I analyse, or shall we start one? Say "assess a use case".';
      return r;
    }
    // identify_gaps is open to viewers, but the browser demo holds no assessment records.
    throw new InputError(`Assessment '${aid}' not found.`);
  }

  private report(text: string): AnswerBuilder {
    if (!this.resolveAssessment(text)) {
      const r = new AnswerBuilder("clarify");
      r.answer = "There is no assessment in this session to report on.";
      r.clarifyingQuestion =
        "Which assessment (asm_…) should the report cover, or shall we start one?";
      return r;
    }
    deny("generate_report", "create_draft");
  }

  private tasks(text: string): AnswerBuilder {
    if (!this.resolveAssessment(text)) {
      const r = new AnswerBuilder("clarify");
      r.answer =
        "There is no assessment in this session, so there are no gaps to create tasks for.";
      r.clarifyingQuestion = "Which assessment (asm_…) should I use?";
      return r;
    }
    deny("create_remediation_task", "write_confirm");
  }

  private draftPolicy(): AnswerBuilder {
    if (!Object.keys(this.session.profile).length) {
      const r = new AnswerBuilder("clarify");
      r.answer = "I need a use-case profile to draft a runtime policy.";
      r.clarifyingQuestion = 'Shall we run a guided assessment first? Say "assess a use case".';
      return r;
    }
    deny("draft_runtime_policy", "create_draft");
  }

  private approvalsStatus(): AnswerBuilder {
    const r = new AnswerBuilder("approvals_status");
    r.answer = "There are no approvals visible to you.";
    r.addControl("IS-13");
    return r;
  }

  private inventory(): AnswerBuilder {
    const r = new AnswerBuilder("inventory");
    r.answer =
      "No AI system records exist in the AEGIS inventory yet. Guided assessments create draft records (EI-01).";
    r.addControl("EI-01");
    return r;
  }

  // ================================================================ "what controls apply to <use case>"
  private useCaseControls(text: string): AnswerBuilder {
    const r = new AnswerBuilder("use_case_controls");
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
    const recs = recommendControls(prof, 64);
    const tier = recs.tier;
    const riskMods = calculateRiskTier(prof).required_modules;
    const mods = new Set(selectModules(prof, tier, riskMods).map((m) => m.id));
    const qs = applicableQuestions(prof, tier, riskMods);
    const triggered = new Set(
      [...mods].filter((m) => !["core", "security", "monitoring_assurance"].includes(m)),
    );
    const res = searchKnowledge(text, 10);
    const qTerms = new Set(tokenize(text, true));

    const hits = new Map<string, number>();
    for (const x of res.results)
      for (const cid of x.doc.control_ids) hits.set(cid, (hits.get(cid) ?? 0) + 1);
    const scores = new Map<string, number>();
    for (const c of recs.controls) {
      const fromTriggered = qs.some((q) => q.controls.includes(c.id) && triggered.has(q.module));
      scores.set(
        c.id,
        (PRIORITY_PTS[c.priority] ?? 0) +
          (fromTriggered ? 2 : 0) +
          1.5 * Math.min(3, hits.get(c.id) ?? 0),
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
      const overlap = [...toks].filter((t) => qTerms.has(t)).length;
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
    // Foundation first: the system must be registered with an accountable owner.
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
      const line = {
        question: q,
        controls: q.controls.filter((c) => c === cid || score(c) >= 5).slice(0, 3),
      };
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

    const items: string[] = [];
    lines.forEach((ln, idx) => {
      const i = idx + 1;
      const q = ln.question;
      const ids = ln.controls.join(", ");
      items.push(`${i}. ${q.remediation} (${ids})`);
      r.claim(
        `Item ${i} (${ids}): organizational evidence status (${NO_RECORD_BASIS})`,
        MISSING,
        ln.controls,
      );
      r.addQuestion(q.id);
      for (const cid of ln.controls) r.addControl(cid);
      r.missingEvidence.push(`${ids}: ${q.evidence_expected.slice(0, 2).join("; ")}`);
    });
    const facts = Object.entries(prof)
      .filter(([k]) => k !== "name")
      .map(
        ([k, v]) =>
          `${k} = ${Array.isArray(v) ? v.join(", ") : String(v).toLowerCase()} (${prov[k] ?? USER_ASSERTED})`,
      )
      .join("; ");
    r.answer =
      "Recommended baseline controls for this use case, in priority order:\n" + items.join("\n");
    r.details.push(
      `**Based on what you described:** ${facts}. ` +
        (tier
          ? `Preliminary tier indication: ${tier} (Inferred from partial intake; requires human confirmation). `
          : "") +
        (mods.size ? "Modules considered: " + [...mods].sort().join(", ") + "." : ""),
    );
    // supporting sources: relevant policy / industry packs (cited by id+version, never pasted)
    const packs = res.results
      .filter(
        (x) =>
          ["policy_pack", "policy_pack_rule", "industry_pack"].includes(x.doc.kind) &&
          x.coverage >= 0.5,
      )
      .sort(
        (a, b) =>
          (a.doc.kind.startsWith("policy") ? 0 : 1) - (b.doc.kind.startsWith("policy") ? 0 : 1),
      );
    for (const x of packs.slice(0, 2)) {
      const { type: _type, section: _section, ...src } = docSource(x.doc);
      r.addDoc(src);
    }
    const p0 = packs[0]?.doc;
    if (p0) {
      const label = p0.policy_id
        ? `policy pack ${p0.policy_id} v${p0.policy_version ?? "None"}`
        : p0.title || p0.source;
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
    if (!lines.length) r.answer = NO_SOURCE_MESSAGE;
    return r;
  }

  private tierQuestion(text: string): AnswerBuilder {
    const r = new AnswerBuilder("risk_tier");
    const s = this.session;
    if (s.risk) {
      const name = s.profile["name"];
      r.answer =
        `The preliminary risk tier for ${name !== undefined ? pyValue(name) : "this use case"} is **${s.risk.tier}** ` +
        `(score ${s.risk.score}). It is Inferred from intake answers and requires human confirmation.`;
      r.claim(`Preliminary tier ${s.risk.tier}`, INFERRED, s.risk.citation_ids);
      for (const cid of s.risk.citation_ids) r.addControl(cid);
      return r;
    }
    const prof = extractProfile(text);
    const key = [
      "purpose",
      "decision_impact",
      "affected_parties",
      "data_sensitivity",
      "autonomy",
      "domain_category",
    ];
    const have = key.filter((k) => k in prof);
    if (have.length >= 5) {
      const risk = calculateRiskTier(prof);
      r.answer =
        `From your description, the preliminary tier is **${risk.tier}** (score ${risk.score}). This is ` +
        "Inferred from keywords and must be confirmed by a human.";
      r.claim(`Preliminary tier ${risk.tier}`, INFERRED, risk.citation_ids);
      for (const cid of risk.citation_ids) r.addControl(cid);
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

  // ================================================================ lookups
  private controlLookup(text: string): AnswerBuilder {
    const r = new AnswerBuilder("control_lookup");
    const ids: string[] = [];
    for (const m of text.matchAll(/\b(AO|EI|GL|IS|SE)-(\d{2})\b/gi)) {
      const cid = `${(m[1] ?? "").toUpperCase()}-${m[2] ?? ""}`;
      if (!ids.includes(cid)) ids.push(cid);
    }
    const valid = ids.filter((c) => getControl(c)).slice(0, 4);
    const invalid = ids.filter((c) => !getControl(c));
    const parts = invalid.map(
      (cid) =>
        `${cid} is not an AEGIS control ID in Control Library v${VERSION}; I won't describe a control that doesn't exist.`,
    );
    const fwLabels: Array<[FrameworkKey, string]> = [
      ["nist_ai_rmf", "NIST AI RMF"],
      ["iso_42001", "ISO/IEC 42001"],
      ["eu_ai_act", "EU AI Act"],
    ];
    for (const cid of valid) {
      const c = control(cid);
      r.addControl(cid);
      const maps = fwLabels
        .map(
          ([k, lbl]) => `${lbl}: ${(c.mappings?.[k] ?? []).map(String).join(", ") || "no mapping"}`,
        )
        .join("; ");
      let part =
        `**${controlCitation(cid)}** — ${c.objective} Priority: ${c.priority}; applies to: ${c.applies_to}; ` +
        `owner: ${c.owner_role}. Expected evidence: ${(c.evidence ?? []).join("; ")}. ` +
        `Indicative framework mappings: ${maps}.`;
      const qs = questionsCiting(cid);
      for (const q of qs.slice(0, 4)) r.addQuestion(q);
      if (qs.length) part += ` Assessed by: ${qs.slice(0, 6).join(", ")}.`;
      parts.push(part);
      r.claim(`${cid} implementation in your organization (${NO_RECORD_BASIS})`, MISSING, [cid]);
      r.missingEvidence.push(`${cid}: ${(c.evidence ?? []).join("; ")}`);
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

  private questionLookup(text: string): AnswerBuilder {
    const r = new AnswerBuilder("question_lookup");
    const ids = [
      ...[...text.matchAll(new RegExp(MATURITY_QID_RE.source, "gi"))].map((m) =>
        m[0].toUpperCase(),
      ),
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
      } else {
        parts.push(`${qid} is not a question in the AEGIS assessment templates.`);
      }
    }
    if (!r.questionIds().length) {
      parts.push(NO_SOURCE_MESSAGE);
      r.intent = "question_not_found";
    }
    r.answer = parts[0] ?? NO_SOURCE_MESSAGE;
    r.details = parts.slice(1);
    return r;
  }

  private frameworkMapping(text: string): AnswerBuilder {
    const r = new AnswerBuilder("framework_mapping");
    r.disclaimer = true;
    const refs = parseFrameworkRefs(text);
    const parts: string[] = [];
    const allIds: string[] = [];
    if (refs.length) {
      for (const [fw, ref] of refs.slice(0, 5)) {
        const cs = controlsForFrameworkRef(fw, ref);
        if (cs.length) {
          parts.push(
            `Per AEGIS Control Library v${VERSION}, these controls carry an indicative mapping to ` +
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
            `No AEGIS control in Control Library v${VERSION} maps to ${FRAMEWORK_LABELS[fw]} ${ref}. ${NO_SOURCE_MESSAGE}`,
          );
        }
      }
    } else {
      for (const fw of [...detectFrameworks(text)].sort()) {
        const cs = controlsForFramework(fw);
        const crit = cs.filter((c) => c.priority === "critical");
        parts.push(
          `${cs.length} of ${controls.length} AEGIS controls carry indicative ${FRAMEWORK_LABELS[fw]} mappings. ` +
            "Critical-priority ones: " +
            crit
              .map((c) => `${c.id} (${(c.mappings?.[fw] ?? []).map(String).join(", ")})`)
              .join("; ") +
            ".",
        );
        for (const c of crit) {
          r.addControl(c.id);
          if (!allIds.includes(c.id)) allIds.push(c.id);
        }
      }
    }
    // supplemental context from the compliance mapping document
    const res = searchKnowledge(text, 3, ["compliance_mapping"]);
    const top = res.results[0];
    if (top && res.band !== "low") r.addDoc(docSource(top.doc));
    for (const cid of allIds.slice(0, 6)) {
      r.claim(`${cid}: organizational evidence status (${NO_RECORD_BASIS})`, MISSING, [cid]);
    }
    r.answer = parts[0] ?? NO_SOURCE_MESSAGE;
    r.details.push(...parts.slice(1));
    const eu = refs.some(([fw]) => fw === "eu_ai_act") || detectFrameworks(text).has("eu_ai_act");
    r.details.push(
      "Mappings are indicative AEGIS interpretations for readiness work, not official crosswalks or a " +
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

  // ================================================================ Ask AEGIS (retrieval answer)
  private ask(input: string): AnswerBuilder {
    // Retrieval never sees raw sensitive values: redact, then drop the redaction markers.
    const red = redact(input);
    let text = red.text.replace(/\[REDACTED:[a-z_]+\]/g, " ").trim() || input;
    if (red.findings.length) {
      // focus on the actual question rather than the sentence that carried personal data
      const qs = text.split(/(?<=[.!?])\s+|\s[-–—]\s/).filter((seg) => seg.trim().endsWith("?"));
      if (qs.length) text = qs.join(" ");
    }
    let inScope = inGovernanceScope(text);
    if (!inScope) {
      // Vocabulary miss: still in scope if governed content matches strongly.
      const probe = getIndex().search(text, 1)[0];
      if (probe && probe.coverage >= 0.67 && probe.score >= 8 && new Set(tokenize(text)).size >= 2)
        inScope = true;
    }
    const words: string[] = text.toLowerCase().match(/[a-z']+/g) ?? [];
    if (!inScope) {
      const pronouns = ["it", "this", "that", "these", "those", "they", "we", "our", "us"];
      if (words.length <= 8 && words.some((w) => pronouns.includes(w))) {
        const r = new AnswerBuilder("clarify");
        r.answer =
          "I want to make sure I answer the right question, but I don't have enough context.";
        r.clarifyingQuestion =
          `What does "${words.includes("it") ? "it" : "this"}" refer to — which AI system, ` +
          "policy, control or framework are you asking about?";
        return r;
      }
      return this.outOfScope();
    }
    const generic = new Set([
      "control",
      "apply",
      "applie",
      "policy",
      "polic",
      "requirement",
      "need",
      "rule",
      "guardrail",
      "relevant",
    ]);
    const refs = ["it", "this", "that", "these", "those", "they", "them"];
    if (
      words.length <= 7 &&
      words.some((w) => refs.includes(w)) &&
      !tokenize(text).some((t) => !generic.has(t))
    ) {
      const r = new AnswerBuilder("clarify");
      r.answer =
        "I want to make sure I answer the right question, but I don't know what it refers to.";
      r.clarifyingQuestion =
        "Which AI system, use case, control or framework do you mean? For a use case, describe " +
        "what it does, its data and tools, and whether it can take actions.";
      return r;
    }
    let res = searchKnowledge(text, 6);
    if (detectFrameworks(text).size) {
      // Framework-level questions are best answered by the compliance mapping / framework documents.
      const docRes = searchKnowledge(text, 4, [
        "compliance_mapping",
        "content_doc",
        "industry_pack",
        "industry_pack_section",
      ]);
      if (docRes.results.length && docRes.band !== "low") {
        res = {
          ...docRes,
          results: [
            ...docRes.results,
            ...res.results.filter((x) => x.doc.kind === "control").slice(0, 2),
          ],
        };
      }
    }
    const r = new AnswerBuilder("ask");
    r.confidence = res.confidence;
    r.confidenceBand = res.band;
    const contentTerms = new Set(tokenize(text));
    if (res.band === "low") {
      if (contentTerms.size <= 2 || !res.results.length) {
        r.intent = "clarify";
        const opts = res.results.slice(0, 3).map((x) => x.doc.title);
        r.answer = "I want to make sure I answer the right question.";
        r.clarifyingQuestion =
          "Could you be more specific — for example, which AI system, control or framework you mean" +
          (opts.length ? `? Closest matches: ${opts.join("; ")}.` : "?");
        if (!res.results.length) r.answer += " " + NO_SOURCE_MESSAGE;
        return r;
      }
      r.intent = "no_source";
      r.answer =
        NO_SOURCE_MESSAGE +
        " I couldn't find AEGIS content that answers this with enough confidence, so I won't guess.";
      r.clarifyingQuestion =
        "Could you rephrase with the control, framework or governance activity you're asking about?";
      return r;
    }
    const topScore = res.results[0]?.score ?? 0;
    const keep = res.results.filter((x) => x.score >= 0.45 * topScore).slice(0, 4);
    const qTerms = new Set(tokenize(text, true));
    const lines = keep.map((x) => summarizeResult(x, qTerms, r));
    r.answer = lines[0] ?? NO_SOURCE_MESSAGE;
    if (lines.length > 1)
      r.details.push(
        "**Related:**\n" +
          lines
            .slice(1)
            .map((ln) => `- ${ln}`)
            .join("\n"),
      );
    const ctrlIds: string[] = [];
    for (const x of keep)
      for (const cid of x.doc.control_ids) if (!ctrlIds.includes(cid)) ctrlIds.push(cid);
    const cited = ctrlIds.slice(0, 6);
    for (const cid of cited) {
      const c = getControl(cid);
      if (!c) continue;
      r.addControl(cid);
      r.claim(`${cid} ${c.title} — organizational evidence status (${NO_RECORD_BASIS})`, MISSING, [
        cid,
      ]);
      r.missingEvidence.push(`${cid}: ${(c.evidence ?? []).slice(0, 2).join("; ")}`);
    }
    r.nextActions = [
      'Run a guided use-case assessment to record your implementation status (say "assess a use case").',
    ];
    const c0 = cited[0];
    if (c0) {
      r.nextActions.unshift(
        `Assign an owner for ${c0} (${control(c0).owner_role}) and collect the listed evidence.`,
      );
    }
    r.cta = CTA_BASELINE;
    return r;
  }

  // ================================================================ guided assessment (viewer preview)
  private startGuided(text: string): AnswerBuilder {
    const s = this.session;
    const r = new AnswerBuilder("assessment_intake");
    this.reset();
    s.state = "intake";
    const colon = text.indexOf(":");
    const head = colon >= 0 ? text.slice(0, colon) : text;
    let desc = colon >= 0 && head.length <= 80 ? text.slice(colon + 1).trim() : text.trim();
    if (colon < 0 && wordCount(desc) <= 8 && START_RE.test(desc)) desc = ""; // just a command
    const prof = wordCount(desc) >= 4 ? extractProfile(desc) : {};
    s.profile = prof;
    s.provenance = Object.fromEntries(Object.keys(prof).map((k) => [k, INFERRED]));
    s.preview = true; // a viewer may preview intake, risk tier and recommended controls only
    const intro =
      "Let's assess this AI use case. I'll gather intake facts, calculate a preliminary risk tier, select the " +
      "applicable question modules and then produce a gap register and report." +
      " Your role allows a preview (intake, risk tier and recommended controls); recording answers and " +
      "generating reports require an assessor role.";
    const hasProfile = Object.keys(prof).length > 0;
    if (hasProfile) {
      r.answer =
        intro +
        ' From your description I inferred the fields below (Inferred — correct any with "field: value").';
      r.details.push(this.profileTable());
    } else {
      r.answer = intro;
    }
    r.addControl("EI-12");
    r.addControl("GL-01");
    if (!hasProfile) {
      s.asked_field = "description";
      r.clarifyingQuestion = DESCRIBE_PROMPT;
      return r;
    }
    return this.advanceIntake(r);
  }

  private requiredMissing(): string[] {
    const p = this.session.profile;
    return intakeFields
      .filter((f) => f.required && (p[f.id] === undefined || p[f.id] === ""))
      .map((f) => f.id);
  }

  private advanceIntake(r: AnswerBuilder): AnswerBuilder {
    const missing = this.requiredMissing();
    const fid = missing[0];
    if (fid === undefined) return this.showTier(r);
    const f = intakeField(fid);
    this.session.asked_field = fid;
    const opts = f?.options?.length ? ` Options: ${f.options.map(String).join(", ")}.` : "";
    r.clarifyingQuestion = `${f?.prompt ?? fid}${opts}`;
    const req = intakeFields.filter((x) => x.required).length;
    r.details.push(
      `**Intake (${req - missing.length}/${req} required fields known)** — ${f?.prompt ?? fid}${opts}`,
    );
    return r;
  }

  private profileTable(): string {
    const s = this.session;
    const cell = (v: string) => v.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
    const rows = Object.entries(s.profile).map(
      ([k, v]) => `| ${k} | ${cell(pyValue(v))} | ${s.provenance[k] ?? USER_ASSERTED} |`,
    );
    return "| Field | Value | Evidence status |\n|---|---|---|\n" + rows.join("\n");
  }

  private intakeTurn(text: string): AnswerBuilder | null {
    const s = this.session;
    const r = new AnswerBuilder("assessment_intake");
    const updated: string[] = [];
    const asked = s.asked_field;
    if (asked === "description") {
      const cand = extractProfile(text);
      for (const [k, v] of Object.entries(cand)) {
        s.profile[k] = v;
        s.provenance[k] = INFERRED;
        updated.push(k);
      }
      if (updated.length) {
        r.answer =
          'Thanks. I inferred the fields below (Inferred — correct any with "field: value").';
        r.details.push(this.profileTable());
        delete s.asked_field;
        return this.advanceIntake(r);
      }
      if (text.trim().endsWith("?")) return null;
      r.answer = "I couldn't extract any intake details from that.";
      r.clarifyingQuestion =
        "Please describe what the system does, who it affects, the data it uses and whether it takes actions.";
      return r;
    }
    for (const [k, v] of Object.entries(parseFieldAssignments(text))) {
      s.profile[k] = v;
      s.provenance[k] = USER_ASSERTED;
      updated.push(k);
    }
    if (asked && !updated.includes(asked)) {
      const v = parseFieldValue(asked, text);
      if (v !== null) {
        s.profile[asked] = v;
        s.provenance[asked] = USER_ASSERTED;
        updated.push(asked);
      }
    }
    if (!updated.length) {
      if (text.trim().endsWith("?")) return null; // side question: answer it, then re-prompt
      const f = asked ? intakeField(asked) : undefined;
      r.intent = "clarify";
      r.answer = "I couldn't match that to the intake question.";
      if (f) {
        const opts = f.options?.length
          ? ` Please choose one of: ${f.options.map(String).join(", ")}.`
          : "";
        r.clarifyingQuestion = `${f.prompt}${opts}`;
      }
      return r;
    }
    r.answer =
      "Recorded: " + updated.map((k) => `${k} = ${pyValue(s.profile[k])}`).join(", ") + ".";
    delete s.asked_field;
    return this.advanceIntake(r);
  }

  private showTier(r: AnswerBuilder): AnswerBuilder {
    const s = this.session;
    const risk = calculateRiskTier(s.profile);
    s.risk = risk;
    s.state = "tier_review";
    const mods = selectModules(s.profile, risk.tier, risk.required_modules);
    const qs = applicableQuestions(s.profile, risk.tier, risk.required_modules);
    r.intent = "risk_tier";
    r.details.push(
      `**Preliminary risk tier: ${risk.tier}** (score ${risk.score}; Inferred — requires human confirmation). ` +
        risk.rationale,
    );
    if (risk.triggers.length)
      r.details.push("Triggers:\n" + risk.triggers.map((t) => `- ${t}`).join("\n"));
    r.details.push(
      "Applicable modules: " +
        mods.map((m) => `${m.name} (${m.reasons[0] ?? ""})`).join("; ") +
        `. ${qs.length} questions in total.`,
    );
    r.claim(`Preliminary risk tier ${risk.tier}`, INFERRED, risk.citation_ids);
    for (const cid of risk.citation_ids) r.addControl(cid);
    // Viewer preview: recommended controls, then stop (recording answers needs an assessor).
    const recs = recommendControls(s.profile, 8);
    r.details.push(
      "Recommended controls for this profile:\n" +
        recs.controls
          .map((c) => `- ${c.id} ${c.title} (${c.priority}; owner: ${c.owner_role})`)
          .join("\n"),
    );
    for (const c of recs.controls) r.addControl(c.id);
    s.state = "preview_complete";
    r.nextActions = [
      "Ask an assessor to run the full assessment to record answers, produce the gap register and export a report.",
      "Book a Governance Baseline to assess this and other priority systems with evidence.",
    ];
    r.cta = CTA_BASELINE;
    return r;
  }
}

const DESCRIBE_PROMPT =
  "Describe the use case in a few sentences: what it does, who uses it and is affected, what " +
  "data and tools it uses, whether it can take actions, and which model/vendor it relies on.";

function questionsCiting(cid: string): string[] {
  return [
    ...maturityQuestions.filter((q) => (q.controls ?? []).includes(cid)).map((q) => q.id),
    ...allQuestions()
      .filter((q) => q.controls.includes(cid))
      .map((q) => q.id),
  ];
}

function summarizeResult(x: SearchHit, qTerms: Set<string>, r: AnswerBuilder): string {
  const d = x.doc;
  const kind = d.kind;
  if (kind === "control") {
    const c = control(d.id);
    r.addControl(c.id);
    return (
      `${c.id} ${c.title} (${c.priority} priority, owner: ${c.owner_role}): ${c.objective} ` +
      `Typical evidence: ${(c.evidence ?? []).slice(0, 3).join("; ")}.`
    );
  }
  if (kind === "use_case_question" || kind === "maturity_question") {
    const q = getQuestion(d.id);
    r.addQuestion(d.id);
    if (q) {
      return `Assessed by ${q.id}: "${q.text}" (${q.controls.join(", ")}). Recommended action: ${q.remediation}`;
    }
    return `Assessed by maturity question ${d.id} (${d.control_ids.join(", ")}): ${d.text.slice(d.id.length + 1).slice(0, 300)}`;
  }
  const src = docSource(d);
  if (kind === "critical_flag") {
    r.addDoc(src);
    return `Critical flag ${d.title} (${d.control_ids.join(", ")}).`;
  }
  // documents / policy packs: curated summary if available, else best matching sentences
  r.addDoc(src);
  const policyLabel = src.policy_id
    ? `Policy ${src.policy_id} v${src.policy_version || "?"}`
    : null;
  if (d.summary) return `Per ${policyLabel ?? src.path}, ${d.summary}`;
  if (
    kind.endsWith("_section") ||
    kind.endsWith("_rule") ||
    kind === "policy_pack" ||
    kind === "industry_pack"
  ) {
    // structured pack content is cited, never pasted as flattened YAML
    const sec = src.section ?? "";
    return (
      `See ${policyLabel ?? src.path}` +
      (sec ? ` § ${sec.replaceAll("_", " ")}` : "") +
      ` (${src.path}).`
    );
  }
  const sents = d.text.split(/(?<=[.!?])\s+|\n+/);
  const scored = sents
    .map((s, i) => ({ s, i, n: new Set(tokenize(s)) }))
    .filter(({ s }) => wordCount(s) >= 4)
    .map(({ s, i, n }) => ({ s, i, overlap: [...n].filter((t) => qTerms.has(t)).length }))
    .sort((a, b) => b.overlap - a.overlap || a.i - b.i);
  const best = scored
    .slice(0, 2)
    .sort((a, b) => a.i - b.i)
    .map(({ s }) => s.replaceAll("**", "").replace(/^[ \-*#|>]+|[ \-*#|>]+$/g, ""))
    .join(" ")
    .slice(0, 500);
  const label = policyLabel ?? `${src.path}` + (src.section ? ` § ${src.section}` : "");
  return `Per ${label}: ${best}`;
}

/**
 * Answer one Ask AEGIS message as the public `viewer` demo identity.
 *
 * Pass the same `session` object on every turn to keep guided-intake state; it is mutated in place.
 * Pure and deterministic otherwise: no network, no storage, no LLM.
 */
export function answerQuestion(
  message: string,
  session: AskSession = createAskSession(),
): AskAegisResponse {
  return new AskAegisAgent(session).handle(message);
}
