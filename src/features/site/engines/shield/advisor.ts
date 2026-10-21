/**
 * AEGIS Runtime Shield Advisor — port of
 * platform/app/runtime-shield/aegis_shield/advisor.py.
 *
 * `advise(profile)` turns a description of an LLM application or agent into practical
 * runtime guardrails and a draft, versioned policy. Governance properties:
 * - advisor outputs are labelled Inferred; facts supplied by the user are User-asserted;
 *   nothing is labelled Verified (no named human has reviewed evidence here);
 * - every recommendation cites AEGIS control IDs from the control library;
 * - the generated policy is always `draft` in `observe` mode with no approvals —
 *   the advisor never activates a policy; activation requires recorded human approval.
 */
import {
  EVIDENCE_STATUS_DEFINITIONS,
  NO_SOURCE_MESSAGE,
  STANDARD_DISCLAIMER,
  controlCitation,
  getControl,
} from "../../content";
import { generatePolicy, toJson, toYaml, type Policy } from "./generator";
import {
  PROFILE_FIELDS,
  normalizeProfile,
  slug,
  type Assumption,
  type NormalizedProfile,
  type NormalizedTool,
} from "./profile";
import {
  deepClone,
  fmtThousands,
  hasKey,
  isPlainObject,
  pyFloatStr,
  pyNumStr,
  pyRound,
  type JsonObject,
  type JsonValue,
} from "./py";
import { lintPolicy, validatePolicy } from "./schema";

export const PRINCIPLE = "AI proposes. AEGIS evaluates. Approved actions execute.";
export const ADVISOR_VERSION = "1.0.0";
export const LEVELS = ["Low", "Medium", "High", "Critical"] as const;
export type Level = (typeof LEVELS)[number];

const INFERRED = "Inferred";
const ASSERTED = "User-asserted";
const MISSING = "Missing evidence";
const CRITICAL = "Critical gap";

const OP_WEIGHT: Record<string, number> = {
  read: 1,
  write: 2,
  export: 3,
  external_send: 3,
  delete: 4,
  payment: 4,
};
const EGRESS_OPS = new Set(["external_send", "export"]);
const IRREVERSIBLE_OPS = new Set(["delete", "payment"]);
const MUTATING_OPS = new Set(["write", "delete", "payment", "external_send", "export"]);
const SENS_SCORE: Record<string, number> = {
  public: 1,
  internal: 1,
  confidential: 2,
  personal: 3,
  special_category: 4,
};
const AFFECTED_SCORE: Record<string, number> = {
  internal: 1,
  customers: 2,
  public: 3,
  vulnerable: 4,
};
const AUTONOMY_SCORE: Record<string, number> = {
  none: 1,
  suggests: 1,
  acts_with_approval: 2,
  acts_autonomously: 3,
};

const DEFAULT_APPROVER: Record<string, string> = {
  payment: "Finance Approver",
  delete: "AI System Owner",
  external_send: "Business Owner",
  export: "Data Owner",
  write: "Business Owner",
  read: "AI System Owner",
};
const OP_CITATIONS: Record<string, string[]> = {
  read: ["IS-11", "EI-07"],
  write: ["IS-11", "IS-12", "EI-07"],
  delete: ["IS-11", "IS-13", "IS-15", "EI-07"],
  payment: ["IS-11", "IS-13", "IS-16", "EI-07"],
  external_send: ["IS-11", "IS-13", "IS-04", "EI-07"],
  export: ["IS-11", "IS-13", "IS-04", "IS-03", "EI-07"],
  unknown: ["IS-11", "EI-07"],
};

const LIMIT_PRESETS: Record<Level, Record<string, number>> = {
  Low: {
    requests_per_minute: 120,
    tool_calls_per_session: 50,
    tokens_per_day: 2_000_000,
    cost_per_month_usd: 2_000,
  },
  Medium: {
    requests_per_minute: 60,
    tool_calls_per_session: 30,
    tokens_per_day: 1_000_000,
    cost_per_month_usd: 3_000,
  },
  High: {
    requests_per_minute: 30,
    tool_calls_per_session: 20,
    tokens_per_day: 500_000,
    cost_per_month_usd: 3_000,
  },
  Critical: {
    requests_per_minute: 15,
    tool_calls_per_session: 10,
    tokens_per_day: 250_000,
    cost_per_month_usd: 2_000,
  },
};
const RETENTION_DAYS: Record<Level, number> = { Low: 180, Medium: 365, High: 730, Critical: 730 };
const TIME_TO_DISABLE: Record<Level, number> = { Low: 60, Medium: 15, High: 5, Critical: 5 };
const OBSERVE_SAMPLE: Record<Level, number> = {
  Low: 500,
  Medium: 1_000,
  High: 5_000,
  Critical: 10_000,
};
const FP_THRESHOLD: Record<Level, number> = { Low: 5, Medium: 5, High: 3, Critical: 2 };

function level(score: number): Level {
  return LEVELS[Math.max(1, Math.min(4, score)) - 1] as Level;
}

const levelIdx = (l: string) => (LEVELS as readonly string[]).indexOf(l);
const intersects = (a: Set<string>, b: Set<string>) => [...a].some((x) => b.has(x));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskDimension {
  level: Level;
  score: number;
  factors: string[];
  rationale: string;
  operations?: string[];
}

export interface RiskProfileOut {
  autonomy: RiskDimension;
  blast_radius: RiskDimension;
  data_exposure: RiskDimension;
  tool_risk: RiskDimension;
  overall: { rating: Level; composite_score: number; rationale: string; floors_applied: string[] };
  overall_rating: Level;
  user_asserted_risk_tier: string | null;
  inferred_risk_tier: string;
  tier_mismatch: boolean;
  requires_human_confirmation: true;
  evidence_status: string;
  citations: string[];
}

export interface ApprovalCondition {
  param: string;
  op: string;
  value: number;
  reason: string;
}

export interface ToolEntry {
  tool: string;
  description: string | null;
  operation: string;
  operation_evidence: string;
  decision: "allowed" | "conditional" | "approval" | "denied";
  engine_action: "ALLOW" | "REQUIRE_HUMAN_APPROVAL" | "DENY";
  reasons: string[];
  conditions: string[];
  scopes: string[];
  parameters: Record<string, JsonObject>;
  strict_parameters: boolean;
  require_approval_if: ApprovalCondition[];
  approval_roles: string[];
  max_calls_per_session: number | null;
  allow_pii_entities: string[];
  citations: string[];
  evidence_status: string;
}

export interface DataHandling {
  data_sensitivity: string;
  data_categories: string[];
  redaction_entities: string[];
  redaction_surfaces: string[];
  exemptions: Array<{ tool: string; entities: string[]; reason: string }>;
  prompt_logging: string;
  response_logging: string;
  evidence_retention_days: number;
  rules: Array<{ id: string; rule: string; applies_to: string[]; citations: string[] }>;
  detector_limitations: string;
  citations: string[];
  evidence_status: string;
}

export interface ApprovalRule {
  id: string;
  trigger: string;
  approver_roles: string[];
  binding: string;
  separation_of_duties: string;
  on_timeout: string;
  citations: string[];
}

export interface LimitsOut {
  requests_per_minute: number;
  tool_calls_per_session: number;
  tokens_per_day: number;
  cost_per_month_usd: number;
  action_on_breach: string;
  alert_at_percent: number;
  source: string;
  rationale: string;
  citations: string[];
  evidence_status: string;
}

export interface MissingInput {
  field: string;
  label: string;
  status: string;
  impact: string;
}

export interface ClarifyingQuestion {
  question: string;
  field: string;
  citations: string[];
}

export interface EvidenceItem {
  item: string;
  status: string;
  source: string;
  citations: string[];
}

export interface Advice {
  advisor_version: string;
  principle: string;
  app: JsonObject;
  assumptions: Assumption[];
  risk_profile: RiskProfileOut;
  tool_matrix: ToolEntry[];
  data_handling: DataHandling;
  approval_rules: ApprovalRule[];
  policy_approver_roles: string[];
  limits: LimitsOut;
  monitoring: JsonObject;
  incident_response: IncidentResponse;
  rollout: Rollout;
  missing_inputs: MissingInput[];
  clarifying_questions: ClarifyingQuestion[];
  evidence: {
    legend: Record<string, string>;
    items: EvidenceItem[];
    counts: Record<string, number>;
    verified_note: string;
  };
  evidence_status: string;
  requires_human_approval: true;
  disclaimer: string;
  obligations_note?: { text: string; items: string[]; status: string; citations: string[] };
  _normalized?: NormalizedProfile;
}

export interface IncidentResponse {
  kill_switch: {
    scopes: string[];
    authorized_roles: string[];
    target_time_to_disable_minutes: number;
    procedure: string[];
    precedence: string;
    drill: string;
    citations: string[];
  };
  rollback: { strategy: string; steps: string[]; citations: string[] };
  playbooks: Array<{ id: string; trigger: string; actions: string[]; citations: string[] }>;
  escalation: { queue: string; contact_role: string; citations: string[] };
  evidence_to_capture: string[];
  citations: string[];
  evidence_status: string;
}

export interface RolloutStage {
  stage: number;
  mode: string;
  purpose: string;
  entry_criteria: string[];
  exit_criteria: string[];
  citations: string[];
}

export interface Rollout {
  recommended_start_mode: string;
  current_stage: number;
  promotion_rule: string;
  stages: RolloutStage[];
  citations: string[];
  evidence_status: string;
}

export interface CitationDetail {
  id: string | null;
  title?: string;
  citation: string;
  mappings?: JsonValue;
}

export interface AdviseResult extends Omit<Advice, "_normalized"> {
  policy: Policy;
  policy_yaml: string;
  policy_json: string;
  policy_validation: { valid: boolean; errors: string[]; warnings: string[] };
  activation: string;
  summary: string;
  citations: string[];
  citation_details: CitationDetail[];
}

// ---------------------------------------------------------------------------
// Risk profile
// ---------------------------------------------------------------------------

/**
 * Python picks `max(ops, key=OP_WEIGHT)` over a set, so ties (delete/payment,
 * export/external_send) depend on hash order. We resolve ties deterministically by
 * taking the alphabetically first operation with the highest weight.
 */
function highestOp(ops: Set<string>): string {
  return [...ops]
    .sort()
    .reduce((best, o) => ((OP_WEIGHT[o] ?? 0) > (OP_WEIGHT[best] ?? 0) ? o : best));
}

function riskProfile(n: NormalizedProfile): RiskProfileOut {
  const ops = new Set(n.tools.filter((t) => t.operation !== "unknown").map((t) => t.operation));
  const unknown = n.tools.filter((t) => t.operation === "unknown").map((t) => t.name);
  const autonomous = n.autonomy === "acts_autonomously";
  const noApproval = n.human_approval_model === "none" || n.human_approval_model === "unknown";

  // Autonomy
  let a = AUTONOMY_SCORE[n.autonomy] ?? 3;
  const aFactors = [`autonomy '${n.autonomy}'`];
  if (autonomous && intersects(ops, new Set([...IRREVERSIBLE_OPS, "external_send"]))) {
    a += 1;
    aFactors.push("acts autonomously with irreversible or external actions available");
  }
  const autonomy: RiskDimension = {
    level: level(a),
    score: Math.min(a, 4),
    factors: aFactors,
    rationale: aFactors.join("; "),
  };

  // Tool risk
  let t = ops.size ? Math.max(...[...ops].map((o) => OP_WEIGHT[o] ?? 1)) : 1;
  const tFactors = [ops.size ? `highest-impact operation: ${highestOp(ops)}` : "no tools declared"];
  if (n.tools.filter((x) => MUTATING_OPS.has(x.operation)).length >= 4 && t < 4) {
    t += 1;
    tFactors.push("four or more state-changing tools");
  }
  if (unknown.length) {
    tFactors.push(
      `${unknown.length} tool(s) with unknown operation type (denied by default until classified)`,
    );
  }
  const toolRisk: RiskDimension = {
    level: level(t),
    score: Math.min(t, 4),
    factors: tFactors,
    operations: [...ops].sort(),
    rationale: tFactors.join("; "),
  };

  // Data exposure
  let d = SENS_SCORE[n.data_sensitivity] ?? 3;
  const dFactors = [`highest data sensitivity '${n.data_sensitivity}'`];
  if (intersects(ops, EGRESS_OPS) && d >= 2 && autonomous) {
    d += 1;
    dFactors.push("autonomous egress paths (external send / export) for sensitive data");
  }
  if (n.vendor && d >= 3) {
    dFactors.push(
      `prompts containing sensitive data may reach an external model vendor (${n.vendor})`,
    );
  }
  const dataExposure: RiskDimension = {
    level: level(d),
    score: Math.min(d, 4),
    factors: dFactors,
    rationale: dFactors.join("; "),
  };

  // Blast radius
  let b = AFFECTED_SCORE[n.affected_parties] ?? 2;
  const bFactors = [`affected parties: ${n.affected_parties}`];
  if (n.environment === "production" && intersects(ops, MUTATING_OPS)) {
    b += 1;
    bFactors.push("state-changing tools in production");
  }
  if (intersects(ops, IRREVERSIBLE_OPS) && (autonomous || noApproval)) {
    b += 1;
    bFactors.push("irreversible actions without a confirmed human-approval path");
  }
  const blast: RiskDimension = {
    level: level(b),
    score: Math.min(b, 4),
    factors: bFactors,
    rationale: bFactors.join("; "),
  };

  const scores = [autonomy.score, toolRisk.score, dataExposure.score, blast.score];
  const maxScore = Math.max(...scores);
  const composite = pyRound(0.7 * (scores.reduce((x, y) => x + y, 0) / 4) + 0.3 * maxScore, 2);
  let rating: Level =
    composite < 1.75 ? "Low" : composite < 2.5 ? "Medium" : composite < 3.5 ? "High" : "Critical";
  const floors: Array<[Level, string]> = [];
  if (maxScore === 4) floors.push(["High", "at least one dimension is Critical"]);
  if (n.risk_tier === "High") floors.push(["High", "user-asserted risk tier is High"]);
  if (n.risk_tier === "Prohibited-review") {
    floors.push([
      "Critical",
      "user-asserted tier is Prohibited-review: legal/ethics review required before any deployment",
    ]);
  }
  if (autonomous && intersects(ops, IRREVERSIBLE_OPS)) {
    floors.push(["High", "autonomous agent with irreversible actions"]);
  }
  if (n.data_sensitivity === "special_category") {
    floors.push(["Medium", "special-category data"]);
    if (intersects(ops, EGRESS_OPS))
      floors.push(["High", "special-category data with egress tools"]);
  }
  for (const [lvl] of floors) {
    if (levelIdx(lvl) > levelIdx(rating)) rating = lvl;
  }
  let inferredTier: string = rating === "Critical" ? "High" : rating;
  if (n.risk_tier === "Prohibited-review") inferredTier = "Prohibited-review";
  const assertedTier = n.risk_tier;
  const tierOrder = ["Low", "Medium", "High", "Prohibited-review"];
  const mismatch =
    !!assertedTier && tierOrder.indexOf(inferredTier) > tierOrder.indexOf(assertedTier);

  let rationale =
    `Overall runtime risk ${rating} (composite ${pyFloatStr(composite)} on a 1–4 scale; 70% mean, 30% maximum of ` +
    `autonomy ${autonomy.level}, tool risk ${toolRisk.level}, data exposure ${dataExposure.level}, ` +
    `blast radius ${blast.level}).`;
  const applied = floors.map(([lvl, why]) => `${why} (minimum ${lvl})`);
  if (applied.length) rationale += " Floor rules triggered: " + applied.join("; ") + ".";
  if (mismatch) {
    rationale +=
      ` The user-asserted tier (${assertedTier}) is lower than the inferred tier (${inferredTier}); ` +
      "a risk-tier change requires human approval and is not made by AEGIS.";
  }
  return {
    autonomy,
    blast_radius: blast,
    data_exposure: dataExposure,
    tool_risk: toolRisk,
    overall: { rating, composite_score: composite, rationale, floors_applied: applied },
    overall_rating: rating,
    user_asserted_risk_tier: assertedTier,
    inferred_risk_tier: inferredTier,
    tier_mismatch: mismatch,
    requires_human_confirmation: true,
    evidence_status: INFERRED,
    citations: ["EI-02", "IS-01", "IS-11"],
  };
}

// ---------------------------------------------------------------------------
// Tool permission matrix
// ---------------------------------------------------------------------------

function approvers(n: NormalizedProfile, tool: NormalizedTool, op: string): string[] {
  const roles = tool.approval_roles.length ? [...tool.approval_roles] : [...n.approver_roles];
  return roles.length ? roles : [DEFAULT_APPROVER[op] ?? "AI System Owner"];
}

function toolEntry(n: NormalizedProfile, tool: NormalizedTool, rating: Level): ToolEntry {
  const op = tool.operation;
  const name = tool.name;
  const noApprovalPath = n.human_approval_model === "none" || n.human_approval_model === "unknown";
  const autonomous = n.autonomy === "acts_autonomously";
  const high = rating === "High" || rating === "Critical";
  const sens = tool.data_sensitivity || n.data_sensitivity;
  const reasons: string[] = [];
  const conditions: string[] = [];
  const params: Record<string, JsonObject> = deepClone(tool.parameters ?? {});
  const declaredParams = Object.keys(params).length > 0;
  let approvalIf: ApprovalCondition[] = [];
  let maxCalls: number | null = tool.max_calls_per_session ?? null;
  const allowPii = [...tool.allow_pii_entities];
  let decision: ToolEntry["decision"];

  if (op === "unknown") {
    decision = "denied";
    reasons.push(
      "operation type unknown — default-deny until the tool is classified in the agent/tool registry",
    );
  } else if (op === "read") {
    if (sens === "personal" || sens === "special_category" || sens === "confidential") {
      decision = "conditional";
      reasons.push(`read access to ${sens} data: restrict to tenant- and record-scoped queries`);
      conditions.push(
        "read-only credential scoped to the requesting user's tenant",
        "PII in results is redacted before reaching the model unless needed for the task",
      );
    } else {
      decision = "allowed";
      reasons.push("read-only access to low-sensitivity data");
    }
  } else if (op === "write") {
    if (high && autonomous) {
      decision = "approval";
      reasons.push("state-changing action by an autonomous agent in a high-risk context");
    } else if (high && !declaredParams) {
      decision = "approval";
      reasons.push(
        "state-changing action in a high-risk context with no declared parameters to validate",
      );
    } else {
      decision = "conditional";
      reasons.push(
        "state-changing action: allowed only within validated parameters and scoped credentials",
      );
      conditions.push(
        "scoped write credential (no admin scopes)",
        "parameter validation enforced",
        "per-session call cap",
      );
    }
    maxCalls = maxCalls || 20;
  } else if (op === "delete") {
    maxCalls = maxCalls || 3;
    if (noApprovalPath) {
      decision = "denied";
      reasons.push("irreversible deletion with no confirmed human-approval path");
    } else {
      decision = "approval";
      reasons.push("irreversible deletion requires designated human approval of the exact action");
    }
  } else if (op === "payment") {
    maxCalls = maxCalls || 5;
    const maxAmount = tool.max_amount;
    const autoBelow = tool.auto_approve_below;
    if (!hasKey(params, "amount")) {
      params["amount"] = {
        type: "number",
        min: 0,
        required: true,
        description: "Transaction amount (proposed constraint — confirm parameter name)",
      };
    }
    const amount = params["amount"] as JsonObject;
    if (maxAmount !== undefined && (amount["type"] === "number" || amount["type"] === "integer")) {
      amount["max"] = maxAmount;
    }
    if (tool.currencies.length && !hasKey(params, "currency")) {
      params["currency"] = { type: "string", enum: [...tool.currencies], required: true };
    }
    if (noApprovalPath) {
      decision = "denied";
      reasons.push("payments with no confirmed human-approval path");
    } else if (autoBelow !== undefined && rating !== "Critical" && !autonomous) {
      decision = "conditional";
      approvalIf.push({
        param: "amount",
        op: "gt",
        value: autoBelow,
        reason: `amount above auto-approval threshold ${pyNumStr(autoBelow)}`,
      });
      reasons.push(
        `payments up to ${pyNumStr(autoBelow)} within validated limits; above that, human approval`,
      );
      conditions.push(
        maxAmount !== undefined
          ? `hard maximum ${pyNumStr(maxAmount)}`
          : "set a hard maximum amount (missing input)",
      );
    } else {
      decision = "approval";
      reasons.push("payments are high-impact and irreversible: every call requires human approval");
    }
  } else if (op === "external_send") {
    maxCalls = maxCalls || 10;
    if (!allowPii.includes("email")) allowPii.push("email");
    const bound = tool.allowed_domains.length > 0 || tool.recipient_binding;
    if (tool.allowed_domains.length) {
      const rp = tool.recipient_param ?? "to";
      if (!hasKey(params, rp)) params[rp] = { type: "string", required: true };
      const spec = params[rp] as JsonObject;
      if (spec["type"] === "string" || spec["type"] === "array") {
        spec["domain_allow_list"] = [...tool.allowed_domains];
      }
    }
    if (noApprovalPath && high) {
      decision = "denied";
      reasons.push("external communication in a high-risk context with no confirmed approval path");
    } else if (bound && rating !== "Critical") {
      decision = "conditional";
      reasons.push("external send restricted to bound recipients / allow-listed domains");
      conditions.push(
        "recipient bound to the active case or allow-listed domain",
        "outbound content scanned for PII and injection artefacts",
      );
    } else {
      decision = "approval";
      reasons.push("external communication leaves the organization: human approval before sending");
    }
  } else if (op === "export") {
    maxCalls = maxCalls || 2;
    if (sens === "special_category" && noApprovalPath) {
      decision = "denied";
      reasons.push("bulk export of special-category data with no approval path");
    } else {
      decision = "approval";
      reasons.push("bulk data export requires designated human approval and row limits");
      if (!hasKey(params, "max_rows")) {
        params["max_rows"] = {
          type: "integer",
          min: 1,
          max: 1000,
          description: "Proposed row cap — confirm parameter name",
        };
      }
    }
  } else {
    decision = "denied";
    reasons.push("unsupported operation");
  }

  if (tool.requires_approval && (decision === "allowed" || decision === "conditional")) {
    decision = "approval";
    approvalIf = [];
    reasons.push("user-specified: every call requires human approval");
  }

  const engineAction = (
    {
      allowed: "ALLOW",
      conditional: "ALLOW",
      approval: "REQUIRE_HUMAN_APPROVAL",
      denied: "DENY",
    } as const
  )[decision];
  const scopes = tool.scopes.length
    ? [...tool.scopes]
    : [`${slug(name, 40)}:${op === "read" ? "read" : op}`];
  const citations = [...(OP_CITATIONS[op] ?? ["IS-11"])];
  return {
    tool: name,
    description: tool.description ?? null,
    operation: op,
    operation_evidence: tool.operation_source,
    decision,
    engine_action: engineAction,
    reasons,
    conditions,
    scopes,
    parameters: params,
    strict_parameters: declaredParams,
    require_approval_if: approvalIf,
    approval_roles:
      (decision === "approval" || decision === "conditional") &&
      (decision === "approval" || approvalIf.length > 0)
        ? approvers(n, tool, op)
        : [],
    max_calls_per_session: maxCalls,
    allow_pii_entities: decision !== "denied" ? allowPii : [],
    citations,
    evidence_status: INFERRED,
  };
}

// ---------------------------------------------------------------------------
// Remaining sections
// ---------------------------------------------------------------------------

function dataHandling(n: NormalizedProfile, rating: Level, matrix: ToolEntry[]): DataHandling {
  const sens = n.data_sensitivity;
  const entities = [
    "email",
    "phone",
    "payment_card",
    "iban",
    "us_ssn",
    "uk_nino",
    "india_pan",
    "india_aadhaar",
    "ip_address",
    "api_key",
  ];
  const logLevel = sens === "special_category" ? "metadata" : "redacted";
  const exemptions = matrix
    .filter((m) => m.allow_pii_entities.length)
    .map((m) => ({
      tool: m.tool,
      entities: m.allow_pii_entities,
      reason: "needed to perform the action; still masked in logs",
    }));
  const rules: DataHandling["rules"] = [
    {
      id: "dh.redact_before_llm",
      rule:
        "Redact sensitive entities from prompts and retrieved context before " +
        `any call to the external model${n.vendor ? ` (${n.vendor})` : ""}.`,
      applies_to: ["prompt", "tool_output"],
      citations: ["IS-04"],
    },
    {
      id: "dh.response_leakage",
      rule:
        "Scan model responses for sensitive entities before display or onward " +
        "transmission; redact matches.",
      applies_to: ["response"],
      citations: ["IS-04", "IS-14"],
    },
    {
      id: "dh.tool_params",
      rule:
        "Scan tool parameters for sensitive entities; only per-tool exemptions " +
        "listed below may pass unmasked to the tool.",
      applies_to: ["tool_params"],
      citations: ["IS-04", "IS-11"],
    },
    {
      id: "dh.indirect_injection",
      rule:
        "Treat tool outputs and retrieved documents as untrusted: scan for " +
        "prompt-injection signals before they enter the model context.",
      applies_to: ["tool_output"],
      citations: ["IS-12", "IS-14"],
    },
    {
      id: "dh.logging",
      rule:
        `Log prompts and responses at '${logLevel}' level only; raw content is never ` +
        "written to the decision log, which is hash-chained and tamper-evident.",
      applies_to: ["logs"],
      citations: ["SE-08", "IS-04"],
    },
    {
      id: "dh.retention",
      rule:
        `Retain decision logs and approval records for ${RETENTION_DAYS[rating]} ` +
        "days (proposed default — confirm against the obligations register).",
      applies_to: ["logs"],
      citations: ["SE-02", "AO-07"],
    },
  ];
  if (sens === "personal" || sens === "special_category") {
    rules.push({
      id: "dh.minimisation",
      rule:
        "Send only the fields required for the task to the model; " +
        "document lawful basis, retention and cross-border transfer in the privacy assessment.",
      applies_to: ["prompt", "tool_output"],
      citations: ["IS-03"],
    });
  }
  if (n.vendor) {
    rules.push({
      id: "dh.vendor_terms",
      rule:
        `Confirm ${n.vendor} contract terms on data use, retention, ` +
        "training opt-out and incident notice before production traffic.",
      applies_to: ["vendor"],
      citations: ["GL-11", "AO-09"],
    });
  }
  if (matrix.some((m) => EGRESS_OPS.has(m.operation) && m.decision !== "denied")) {
    rules.push({
      id: "dh.egress",
      rule:
        "Outbound sends and exports carry only data required by the bound " +
        "case; bulk egress requires approval and row caps.",
      applies_to: ["tool_params"],
      citations: ["IS-04", "IS-13"],
    });
  }
  return {
    data_sensitivity: sens,
    data_categories: n.data_categories,
    redaction_entities: entities,
    redaction_surfaces: ["prompt", "response", "tool_params", "tool_output"],
    exemptions,
    prompt_logging: logLevel,
    response_logging: logLevel,
    evidence_retention_days: RETENTION_DAYS[rating],
    rules,
    detector_limitations:
      "Built-in detectors are deterministic heuristics for structured identifiers (e-mail, card, IBAN, " +
      "national IDs, phone, IP, API keys). They do not detect names, postal addresses, free-text health " +
      "details or paraphrased/non-English injections; layer a dedicated DLP/PII service and a trained " +
      "injection classifier for production.",
    citations: ["IS-03", "IS-04", "SE-08", "SE-02"],
    evidence_status: INFERRED,
  };
}

function approvalRules(matrix: ToolEntry[], policyApprovers: string[]): ApprovalRule[] {
  const rules: ApprovalRule[] = [];
  for (const m of matrix) {
    if (m.decision === "approval") {
      rules.push({
        id: `approval.${slug(m.tool, 50)}`,
        trigger: `Every call to '${m.tool}' (${m.operation})`,
        approver_roles: m.approval_roles,
        binding:
          "Approval binds to the exact tool, parameters, requester and session; single use; expires if unused",
        separation_of_duties: "Requester cannot approve their own action",
        on_timeout: "DENY (no auto-approval)",
        citations: ["IS-13", "IS-09"],
      });
    } else if (m.require_approval_if.length) {
      for (const c of m.require_approval_if) {
        rules.push({
          id: `approval.${slug(m.tool, 40)}.${c.param}_${c.op}`,
          trigger: `'${m.tool}' when ${c.param} ${c.op} ${pyNumStr(c.value)}`,
          approver_roles: m.approval_roles,
          binding:
            "Approval binds to the exact tool, parameters, requester and session; single use",
          separation_of_duties: "Requester cannot approve their own action",
          on_timeout: "DENY (no auto-approval)",
          citations: ["IS-13"],
        });
      }
    }
  }
  rules.push(
    {
      id: "approval.policy_change",
      trigger:
        "Any change to the production runtime policy, including promotion " +
        "between rollout modes",
      approver_roles: policyApprovers,
      binding:
        "Approval recorded on the specific policy version (draft → in_review → approved → active)",
      separation_of_duties: "Policy author cannot approve the same version",
      on_timeout: "Change not applied",
      citations: ["GL-04", "IS-12"],
    },
    {
      id: "approval.risk_tier_change",
      trigger: "Changing the system's risk tier",
      approver_roles: ["AI Governance Lead"],
      binding: "Recorded in the AI inventory",
      separation_of_duties: "Not the system owner alone",
      on_timeout: "Tier unchanged",
      citations: ["EI-02", "GL-03"],
    },
    {
      id: "approval.exception",
      trigger: "Any exception to this policy (e.g. temporarily allowing a denied tool)",
      approver_roles: ["AI Governance Lead", "Security Lead"],
      binding: "Exception has an accountable approver, expiry and compensating controls",
      separation_of_duties: "Requester cannot approve",
      on_timeout: "Exception not granted",
      citations: ["GL-10"],
    },
    {
      id: "approval.kill_switch_release",
      trigger: "Releasing an engaged kill switch or leaving contain mode",
      approver_roles: ["Security Operations Lead", "AI System Owner"],
      binding: "Root cause recorded; release logged in the decision log",
      separation_of_duties: "Two-person rule recommended",
      on_timeout: "Remain contained",
      citations: ["IS-15", "SE-04"],
    },
    {
      id: "approval.sensitive_export",
      trigger: "Exporting decision logs or evidence containing sensitive data",
      approver_roles: ["Data Owner"],
      binding: "Export request and recipient recorded",
      separation_of_duties: "Requester cannot approve",
      on_timeout: "Export not performed",
      citations: ["SE-02", "IS-04"],
    },
  );
  return rules;
}

function limitsSection(n: NormalizedProfile, rating: Level): LimitsOut {
  const preset: Record<string, number> = { ...LIMIT_PRESETS[rating] };
  const overrides: Record<string, number> = {};
  for (const [k, v] of Object.entries(n.limits)) {
    if (hasKey(preset, k) && v > 0) overrides[k] = v;
  }
  Object.assign(preset, overrides);
  const overrideKeys = Object.keys(overrides).sort();
  return {
    requests_per_minute: preset["requests_per_minute"] ?? 0,
    tool_calls_per_session: preset["tool_calls_per_session"] ?? 0,
    tokens_per_day: preset["tokens_per_day"] ?? 0,
    cost_per_month_usd: preset["cost_per_month_usd"] ?? 0,
    action_on_breach: "RATE_LIMIT",
    alert_at_percent: 80,
    source: overrideKeys.length
      ? "User-asserted overrides: " + overrideKeys.join(", ")
      : `AEGIS starting points for a ${rating} runtime-risk profile`,
    rationale:
      "Contain runaway loops, abuse and denial-of-wallet. Calibrate from observe-mode telemetry before " +
      "enforcement; limits are per tenant+agent (rate also per identity).",
    citations: ["IS-16"],
    evidence_status: overrideKeys.length ? ASSERTED : INFERRED,
  };
}

function monitoring(n: NormalizedProfile, rating: Level): JsonObject {
  const fp = FP_THRESHOLD[rating];
  const cadence: Record<string, JsonObject> = {
    Low: {
      decision_log_review: "monthly sample review",
      policy_review: "quarterly",
      kill_switch_drill: "semi-annually",
      adversarial_retest: "after material change and annually",
    },
    Medium: {
      decision_log_review: "bi-weekly sample review",
      policy_review: "quarterly",
      kill_switch_drill: "quarterly",
      adversarial_retest: "after material change and semi-annually",
    },
    High: {
      decision_log_review: "weekly review of DENY/ESCALATE/approval decisions",
      policy_review: "monthly",
      kill_switch_drill: "quarterly",
      adversarial_retest: "after every material change and quarterly",
    },
  };
  const cad = cadence[rating === "High" || rating === "Critical" ? "High" : rating] as JsonObject;
  return {
    metrics: [
      {
        metric: "decision_distribution",
        description:
          "Count of ALLOW/DENY/REDACT/TRANSFORM/REQUIRE_HUMAN_APPROVAL/" +
          "ESCALATE/RATE_LIMIT per policy version and mode (effective and would-be)",
        citations: ["IS-12", "SE-03"],
      },
      {
        metric: "would_be_block_rate",
        description:
          "Share of requests whose would-be decision blocks while in " +
          "observe/warn/protect — the main promotion signal",
        citations: ["IS-12"],
      },
      {
        metric: "false_positive_rate",
        description: `Reviewer-sampled false positives among blocks (target < ${fp}%)`,
        citations: ["GL-08"],
      },
      {
        metric: "redaction_events_by_entity",
        description: "Redactions per entity type and surface",
        citations: ["IS-04"],
      },
      {
        metric: "injection_jailbreak_detections",
        description:
          "Detections by surface (prompt, tool output) " +
          "and signal type, including obfuscation flags",
        citations: ["IS-14"],
      },
      {
        metric: "default_deny_hits",
        description: "Calls to undeclared tools (registry drift or misuse)",
        citations: ["IS-11", "EI-07"],
      },
      {
        metric: "approval_queue",
        description: "Pending approvals, approval latency, rejection rate, expiries",
        citations: ["IS-13"],
      },
      {
        metric: "limit_utilisation",
        description: "Rate, tool-call, token and cost utilisation vs limits; breaches",
        citations: ["IS-16"],
      },
      {
        metric: "kill_switch_time_to_disable",
        description:
          "Measured in drills and incidents (target ≤ " + `${TIME_TO_DISABLE[rating]} minutes)`,
        citations: ["IS-15"],
      },
      {
        metric: "audit_chain_integrity",
        description: "Result of scheduled AuditLog.verify() runs",
        citations: ["SE-08"],
      },
    ],
    alerts: [
      {
        alert: "injection_spike",
        condition: "prompt-injection detections > 3x trailing baseline for an " + "agent/tenant",
        severity: "High",
        route: "Security Operations",
        citations: ["IS-14", "SE-04"],
      },
      {
        alert: "pii_in_response",
        condition: "any REDACT on the response surface for special-category or " + "payment data",
        severity:
          n.data_sensitivity === "personal" || n.data_sensitivity === "special_category"
            ? "High"
            : "Medium",
        route: "Privacy / Data Protection",
        citations: ["IS-04", "SE-04"],
      },
      {
        alert: "default_deny_surge",
        condition: "> 10 undeclared-tool calls per hour",
        severity: "Medium",
        route: "Platform Engineering",
        citations: ["IS-11"],
      },
      {
        alert: "approval_backlog",
        condition: "pending approvals older than the approval timeout",
        severity: "Medium",
        route: "Business Owner",
        citations: ["IS-13"],
      },
      {
        alert: "budget_threshold",
        condition: "token or cost utilisation ≥ 80% of limit",
        severity: "Low",
        route: "FinOps / Platform",
        citations: ["IS-16"],
      },
      {
        alert: "audit_chain_broken",
        condition: "AuditLog.verify() fails",
        severity: "Critical",
        route: "Security Operations",
        citations: ["SE-08", "SE-04"],
      },
      {
        alert: "kill_switch_engaged",
        condition: "any kill-switch engagement or contain mode",
        severity: "High",
        route: "Incident commander",
        citations: ["IS-15", "SE-04"],
      },
    ],
    review_cadence: cad,
    dashboards: [
      "Runtime decisions by policy version and mode",
      "Approvals queue",
      "Limits and spend",
      "Detections and redactions",
    ],
    citations: ["GL-08", "SE-03", "SE-08", "SE-12"],
    evidence_status: INFERRED,
  };
}

function incidentResponse(rating: Level): IncidentResponse {
  const ttd = TIME_TO_DISABLE[rating];
  return {
    kill_switch: {
      scopes: ["agent", "tool", "model", "tenant"],
      authorized_roles: ["Security Operations Lead", "AI System Owner", "SRE On-call"],
      target_time_to_disable_minutes: ttd,
      procedure: [
        "Engage the narrowest effective scope first (tool → agent → tenant → model); escalate scope if impact continues",
        "For a full stop, deploy an approved policy version in 'contain' mode or set kill_switch.engaged",
        "Confirm in the decision log that in-scope requests now return DENY with matched rule 'kill_switch'",
        "Notify the incident commander and business owner; open an incident record",
      ],
      precedence:
        "Kill switch overrides every other rule and every rollout mode, including observe",
      drill: `Test time-to-disable in drills; record the measured time (target ≤ ${ttd} minutes)`,
      citations: ["IS-15"],
    },
    rollback: {
      strategy:
        "revert_to_previous once a previous approved version exists; until then 'disable' (contain)",
      steps: [
        "Identify the last known-good policy version from change_history",
        "Re-activate it through the approval workflow (expedited emergency approval is still recorded)",
        "Verify decisions against a replay of the incident traffic in observe mode",
      ],
      citations: ["IS-15", "GL-04"],
    },
    playbooks: [
      {
        id: "ir.prompt_injection",
        trigger: "Injection detected in a prompt or tool output that reached a tool call",
        actions: [
          "Kill-switch the affected tool",
          "Preserve decision-log records by trace ID",
          "Identify the injected source (document, e-mail, web page) and quarantine it",
          "Re-run adversarial tests before release",
        ],
        citations: ["IS-14", "IS-15", "SE-04"],
      },
      {
        id: "ir.data_leakage",
        trigger: "Sensitive data observed in a response, outbound message or log",
        actions: [
          "Contain the agent or tenant",
          "Assess scope from redacted logs and finding counts",
          "Engage Privacy/Legal for notification assessment",
          "Add detector or policy fix; re-test",
        ],
        citations: ["IS-04", "SE-04"],
      },
      {
        id: "ir.tool_misuse",
        trigger:
          "Unauthorized or anomalous tool call (default-deny spike, scope violation, " +
          "parameter violations)",
        actions: [
          "Kill-switch the tool",
          "Revoke and rotate the agent's credentials",
          "Review the tool permission matrix and registry",
        ],
        citations: ["IS-11", "EI-07", "IS-15"],
      },
      {
        id: "ir.runaway_cost",
        trigger: "Rate/budget limit breaches or loop behaviour",
        actions: [
          "Confirm RATE_LIMIT decisions are effective",
          "Contain the session/agent",
          "Fix the loop; recalibrate limits through a new policy version",
        ],
        citations: ["IS-16"],
      },
      {
        id: "ir.vendor_incident",
        trigger: "Model vendor outage, unannounced model change or vendor security incident",
        actions: [
          "Kill-switch the model scope or fail over to an approved alternative",
          "Re-validate behaviour before re-enabling",
          "Record vendor notice under contract terms",
        ],
        citations: ["IS-15", "GL-11", "SE-04"],
      },
    ],
    escalation: {
      queue: "ai-security-review",
      contact_role: "Security Operations Lead",
      citations: ["AO-06", "SE-04"],
    },
    evidence_to_capture: [
      "Decision-log records (trace IDs) and AuditLog.verify() result",
      "Kill-switch engagement record with measured time-to-disable",
      "Policy versions involved and the approval records",
      "Corrective actions",
    ],
    citations: ["IS-15", "SE-04", "AO-06"],
    evidence_status: INFERRED,
  };
}

function rollout(rating: Level): Rollout {
  const sample = OBSERVE_SAMPLE[rating];
  const fp = FP_THRESHOLD[rating];
  const ttd = TIME_TO_DISABLE[rating];
  const stages: RolloutStage[] = [
    {
      stage: 1,
      mode: "observe",
      purpose:
        "Evaluate every request and log the would-be decision; nothing is blocked or modified.",
      entry_criteria: [
        "Policy reviewed; deployment of observe mode approved by the AI System Owner",
        "Decision log writing to the hash-chained audit log",
        "Shadow mode evaluating as 'enforce'",
      ],
      exit_criteria: [
        `At least ${fmtThousands(sample)} representative requests evaluated`,
        "Would-be decision distribution reviewed by the system owner and security",
        `Sampled would-be blocks reviewed; false-positive rate < ${fp}%`,
        "Every legitimate tool seen in traffic has an explicit rule (no legitimate default-deny hits)",
        "Limits calibrated from observed peaks",
      ],
      citations: ["IS-12", "GL-07"],
    },
    {
      stage: 2,
      mode: "warn",
      purpose:
        "Still allow, but surface warnings to the application/operators when the would-be decision is not ALLOW.",
      entry_criteria: ["Observe exit criteria met", "New policy version approved for warn mode"],
      exit_criteria: [
        "Warnings triaged by application owners; no unresolved false-positive patterns",
        "Human-approval workflow tested end-to-end (request → approve/reject → single-use execution)",
        "Alert routing confirmed with on-call teams",
      ],
      citations: ["IS-12", "IS-13"],
    },
    {
      stage: 3,
      mode: "protect",
      purpose:
        "Apply REDACT and TRANSFORM to payloads; blocking decisions are still logged but not enforced.",
      entry_criteria: ["Warn exit criteria met", "New policy version approved for protect mode"],
      exit_criteria: [
        "No raw sensitive data in sampled logs, prompts to the vendor, or responses",
        "Task quality impact of redaction reviewed and accepted by the business owner",
        "Adversarial (prompt-injection / leakage) test results reviewed",
      ],
      citations: ["IS-04", "IS-14"],
    },
    {
      stage: 4,
      mode: "enforce",
      purpose:
        "Full decisions: DENY, REQUIRE_HUMAN_APPROVAL, ESCALATE and RATE_LIMIT block execution.",
      entry_criteria: [
        "Protect exit criteria met",
        "Kill-switch drill passed (contain test below)",
        "New policy version approved for enforce mode by all required approver roles",
      ],
      exit_criteria: [
        "Steady state: false-positive rate and approval latency within agreed targets",
        "Monitoring alerts and review cadence operating",
        "Periodic policy review scheduled",
      ],
      citations: ["IS-12", "IS-13", "IS-16"],
    },
    {
      stage: 5,
      mode: "contain",
      purpose:
        "Incident state, not a promotion target: kill switch active for the whole policy scope; " +
        "every in-scope request is denied. Rehearse it before enforcement and use it during incidents.",
      entry_criteria: [
        "Drill: scheduled test window approved",
        "Incident: authorized role engages the kill switch",
      ],
      exit_criteria: [
        `Drill: measured time-to-disable ≤ ${ttd} minutes and full DENY confirmed in the decision log`,
        "Incident: root cause identified, fix approved as a new policy version, release approved " +
          "by the kill-switch release approvers",
      ],
      citations: ["IS-15", "SE-04"],
    },
  ];
  return {
    recommended_start_mode: "observe",
    current_stage: 1,
    promotion_rule:
      "Each promotion is a new policy version that goes draft → in_review → approved → active with " +
      "recorded human approval. AEGIS never promotes or activates a policy on its own.",
    stages,
    citations: ["IS-12", "GL-04", "GL-07", "IS-15"],
    evidence_status: INFERRED,
  };
}

const QUESTION_BANK: Record<string, [string, string[]]> = {
  app_name: [
    "What is the application or agent called, and who is its accountable owner?",
    ["EI-03", "EI-07"],
  ],
  purpose: [
    "What is the intended purpose and context of use, and what is explicitly out of scope?",
    ["EI-04"],
  ],
  users: [
    "Which user groups and business functions use or are affected by it?",
    ["EI-04", "IS-08"],
  ],
  model: [
    "Which model and version will run in production, and how are model changes controlled?",
    ["EI-05", "GL-04"],
  ],
  vendor: [
    "Which vendor or platform hosts the model, and under which contract terms (data use, retention, training)?",
    ["GL-11", "AO-09"],
  ],
  tools: [
    "List every tool/API/plugin/database the agent can call, with its operation type " +
      "(read, write, delete, external_send, payment, export) and parameters.",
    ["EI-07", "IS-11"],
  ],
  data_categories: [
    "Which data categories are processed (e.g. customer contact data, payment data, health data)?",
    ["IS-03", "EI-06"],
  ],
  data_sensitivity: [
    "What is the highest sensitivity of data the system can access?",
    ["IS-03", "IS-04"],
  ],
  autonomy: [
    "Does the agent only suggest, act with approval, or act autonomously?",
    ["IS-09", "IS-13"],
  ],
  human_approval_model: [
    "Who approves high-impact actions today, through which workflow, and within what time?",
    ["IS-13", "IS-09"],
  ],
  environment: ["Which environment is this for (dev, staging, production)?", ["GL-07"]],
  risk_tier: ["Has the system been assigned a risk tier in the AI inventory?", ["EI-02"]],
  affected_parties: [
    "Are customers, the public or vulnerable groups affected by outputs or actions?",
    ["EI-02", "IS-09"],
  ],
  regulatory_obligations: [
    "Which regulatory obligations apply (e.g. GDPR, EU AI Act, sector rules)?",
    ["AO-07"],
  ],
  customer_obligations: [
    "Which customer or contractual commitments apply (data residency, retention, notice)?",
    ["AO-07"],
  ],
  existing_controls: [
    "Which security controls already exist (SSO, DLP, SIEM, secrets manager, red-team testing)?",
    ["IS-12", "SE-08"],
  ],
};

function missingAndQuestions(
  n: NormalizedProfile,
  matrix: ToolEntry[],
): [MissingInput[], ClarifyingQuestion[]] {
  const missing: MissingInput[] = [];
  const questions: ClarifyingQuestion[] = [];
  for (const f of n._missing) {
    const [q, cits] = QUESTION_BANK[f] as [string, string[]];
    missing.push({
      field: f,
      label: PROFILE_FIELDS[f] ?? f,
      status: MISSING,
      impact:
        n._assumptions.find((a) => a.field === f)?.why ??
        "Recommendations use conservative defaults until provided.",
    });
    questions.push({ question: q, field: f, citations: cits });
  }
  for (const m of matrix) {
    if (m.operation === "unknown") {
      questions.push({
        question:
          `What operation does tool '${m.tool}' perform (read, write, delete, ` +
          "external_send, payment, export)? It is denied until classified.",
        field: `tools.${m.tool}`,
        citations: ["EI-07", "IS-11"],
      });
    } else if (m.operation_evidence === INFERRED) {
      questions.push({
        question:
          `Confirm the operation type for '${m.tool}' (AEGIS inferred ` +
          `'${m.operation}' from its name).`,
        field: `tools.${m.tool}`,
        citations: ["EI-07"],
      });
    }
    if (m.decision !== "denied" && !m.strict_parameters && m.operation !== "read") {
      questions.push({
        question:
          `Declare the parameters of '${m.tool}' (types, max values, allowed ` +
          "domains/patterns) so undeclared arguments can be rejected.",
        field: `tools.${m.tool}.parameters`,
        citations: ["IS-11", "IS-12"],
      });
    }
    const amount = m.parameters["amount"];
    if (m.operation === "payment" && !(amount && hasKey(amount, "max"))) {
      questions.push({
        question: `What is the hard maximum amount per call for '${m.tool}'?`,
        field: `tools.${m.tool}.max_amount`,
        citations: ["IS-13", "IS-16"],
      });
    }
  }
  if (n.human_approval_model === "described") {
    questions.push({
      question:
        "Map the described approval process to named approver roles and thresholds: " +
        `"${n.human_approval_description ?? ""}"`,
      field: "human_approval_model",
      citations: ["IS-13"],
    });
  }
  return [missing, questions];
}

const CONTROL_EVIDENCE_CITATIONS: Record<string, string[]> = {
  red_team: ["IS-14"],
  siem: ["SE-08", "GL-08"],
  logging: ["SE-08"],
  dlp: ["IS-04"],
  kill_switch: ["IS-15"],
  vendor_terms: ["GL-11"],
  incident_response: ["SE-04"],
};

function evidence(
  n: NormalizedProfile,
  risk: RiskProfileOut,
  matrix: ToolEntry[],
): Advice["evidence"] {
  const items: EvidenceItem[] = [];
  const a = n._asserted;
  const labels: Array<[string, string]> = [
    ["app_name", "Application name"],
    ["purpose", "Intended purpose"],
    ["model", "Model"],
    ["vendor", "Vendor"],
    ["autonomy", "Autonomy level"],
    ["human_approval_model", "Human-approval model"],
    ["environment", "Environment"],
    ["risk_tier", "Risk tier"],
    ["data_sensitivity", "Data sensitivity"],
    ["affected_parties", "Affected parties"],
  ];
  for (const [k, lab] of labels) {
    if (hasKey(a, k)) {
      const v = a[k];
      items.push({
        item: `${lab}: ${Array.isArray(v) ? `[${v.map((x) => `'${x}'`).join(", ")}]` : String(v)}`,
        status: ASSERTED,
        source: "profile",
        citations: k === "risk_tier" ? ["EI-02"] : ["EI-04"],
      });
    }
  }
  for (const t of n.tools) {
    items.push({
      item: `Tool '${t.name}' performs '${t.operation}'`,
      status: t.operation_source !== "Missing evidence" ? t.operation_source : MISSING,
      source: t.operation_source === ASSERTED ? "profile" : "AEGIS inference",
      citations: ["EI-07"],
    });
  }
  const rc = n.recognized_controls;
  for (const [key, text] of Object.entries(rc)) {
    items.push({
      item: `Existing control: ${text}`,
      status: ASSERTED,
      source: "profile",
      citations: CONTROL_EVIDENCE_CITATIONS[key] ?? ["IS-11"],
    });
  }
  for (const f of n._missing) {
    items.push({
      item: `Not provided: ${PROFILE_FIELDS[f] ?? f}`,
      status: MISSING,
      source: "profile",
      citations: (QUESTION_BANK[f] as [string, string[]])[1],
    });
  }
  // Evidence that only a human review can make Verified.
  if (!hasKey(rc, "red_team")) {
    items.push({
      item: "Prompt-injection / data-leakage test results",
      status: MISSING,
      source: "not provided",
      citations: ["IS-14"],
    });
  } else {
    items.push({
      item: "Prompt-injection / data-leakage test results (claimed, not yet reviewed)",
      status: ASSERTED,
      source: "profile",
      citations: ["IS-14"],
    });
  }
  items.push({
    item: "Kill-switch test record with measured time-to-disable",
    status: MISSING,
    source: "not provided",
    citations: ["IS-15"],
  });
  items.push({
    item: "Approval records with approver identity for high-impact actions",
    status: MISSING,
    source: "not provided",
    citations: ["IS-13"],
  });
  // Critical gaps
  const ops = new Set(matrix.map((m) => m.operation));
  const autonomous = n.autonomy === "acts_autonomously";
  const noApproval = n.human_approval_model === "none" || n.human_approval_model === "unknown";
  if (autonomous && intersects(ops, IRREVERSIBLE_OPS) && noApproval) {
    items.push({
      item:
        "Autonomous agent can reach irreversible actions (payment/delete) with no confirmed human " +
        "approval path — those tools are denied in the draft policy until an approval workflow exists",
      status: CRITICAL,
      source: "AEGIS inference",
      citations: ["IS-13", "IS-09"],
    });
  }
  if (
    n.data_sensitivity === "special_category" &&
    n.vendor &&
    !hasKey(rc, "vendor_terms") &&
    !hasKey(rc, "dlp")
  ) {
    items.push({
      item:
        `Special-category data may be sent to an external model vendor (${n.vendor}) with no ` +
        "asserted contract terms or DLP — runtime redaction is heuristic and not sufficient alone",
      status: CRITICAL,
      source: "AEGIS inference",
      citations: ["IS-03", "IS-04", "GL-11"],
    });
  }
  if (n.risk_tier === "Prohibited-review") {
    items.push({
      item: "System is flagged for prohibited-use review; do not deploy pending legal/ethics review",
      status: CRITICAL,
      source: "profile",
      citations: ["AO-10", "EI-02"],
    });
  }
  if (risk.tier_mismatch) {
    items.push({
      item:
        `Asserted risk tier ${risk.user_asserted_risk_tier ?? "None"} is lower than inferred ` +
        `${risk.inferred_risk_tier}`,
      status: INFERRED,
      source: "AEGIS inference",
      citations: ["EI-02"],
    });
  }
  items.push({
    item: "Risk profile, tool matrix, limits, monitoring, rollout plan and draft policy",
    status: INFERRED,
    source: "AEGIS Runtime Shield Advisor",
    citations: ["IS-12"],
  });
  const counts: Record<string, number> = {};
  for (const it of items) counts[it.status] = (counts[it.status] ?? 0) + 1;
  return {
    legend: { ...EVIDENCE_STATUS_DEFINITIONS },
    items,
    counts,
    verified_note:
      "Nothing in this output is labelled Verified: no evidence has been reviewed by a named human reviewer.",
  };
}

function collectCitations(obj: unknown, acc: Set<string>): void {
  if (Array.isArray(obj)) {
    for (const v of obj) collectCitations(v, acc);
  } else if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      if (k === "citations" && Array.isArray(v)) {
        for (const x of v) if (typeof x === "string") acc.add(x);
      } else {
        collectCitations(v, acc);
      }
    }
  }
}

export function policyApproverRoles(rating: string): string[] {
  if (rating === "Low") return ["AI System Owner"];
  if (rating === "Medium") return ["AI System Owner", "Security Lead"];
  return ["AI System Owner", "Security Lead", "Risk & Compliance Lead"];
}

/** Produce the advisory sections without the policy (used by `generatePolicy`). */
export function analyze(profile: unknown): Advice {
  const n = normalizeProfile(profile);
  const risk = riskProfile(n);
  const rating = risk.overall.rating;
  const matrix = n.tools.map((t) => toolEntry(n, t, rating));
  const approverRoles = policyApproverRoles(rating);
  const [missing, questions] = missingAndQuestions(n, matrix);
  const advice: Advice = {
    advisor_version: ADVISOR_VERSION,
    principle: PRINCIPLE,
    app: {
      app_name: n.app_name,
      agent_name: n.agent_name,
      purpose: n.purpose,
      users: n.users,
      business_functions: n.business_functions,
      model: n.model,
      vendor: n.vendor,
      environment: n.environment,
      autonomy: n.autonomy,
      human_approval_model: n.human_approval_model,
      data_sensitivity: n.data_sensitivity,
      affected_parties: n.affected_parties,
      regulatory_obligations: n.regulatory_obligations,
      customer_obligations: n.customer_obligations,
      existing_controls: n.existing_controls,
      synthetic: n.synthetic,
    },
    assumptions: n._assumptions,
    risk_profile: risk,
    tool_matrix: matrix,
    data_handling: dataHandling(n, rating, matrix),
    approval_rules: approvalRules(matrix, approverRoles),
    policy_approver_roles: approverRoles,
    limits: limitsSection(n, rating),
    monitoring: monitoring(n, rating),
    incident_response: incidentResponse(rating),
    rollout: rollout(rating),
    missing_inputs: missing,
    clarifying_questions: questions,
    evidence: evidence(n, risk, matrix),
    evidence_status: INFERRED,
    requires_human_approval: true,
    disclaimer: STANDARD_DISCLAIMER,
    _normalized: n,
  };
  if (n.regulatory_obligations.length || n.customer_obligations.length) {
    advice.obligations_note = {
      text:
        "Listed obligations are User-asserted and should be recorded in the obligations register; AEGIS " +
        "maps runtime controls to them indicatively and does not determine legal applicability.",
      items: [...n.regulatory_obligations, ...n.customer_obligations],
      status: ASSERTED,
      citations: ["AO-07"],
    };
  }
  return advice;
}

function summary(advice: Omit<AdviseResult, "summary" | "citations" | "citation_details">): string {
  const r = advice.risk_profile;
  const m = advice.tool_matrix;
  const count = (k: string) => m.filter((x) => x.decision === k).length;
  const crit = advice.evidence.counts[CRITICAL] ?? 0;
  let s =
    `${String(advice.app["app_name"])}: overall runtime risk ${r.overall.rating} (Inferred). ` +
    `Tool matrix: ${count("allowed")} allowed, ${count("conditional")} conditional, ${count("approval")} ` +
    `approval-gated, ${count("denied")} denied (default-deny for anything undeclared). ` +
    `A draft policy (${advice.policy.policy_id} v${advice.policy.version}) starts in observe mode and ` +
    "requires recorded human approval before any promotion.";
  if (crit) s += ` ${crit} critical gap(s) need attention before production use.`;
  if (advice.missing_inputs.length) {
    s += ` ${advice.missing_inputs.length} input(s) missing; conservative defaults were used.`;
  }
  return s;
}

const PREFIX_ORDER = ["AO", "EI", "GL", "IS", "SE"];

export interface AdviseOptions {
  /** ISO date (YYYY-MM-DD) recorded in the policy change history; defaults to today (UTC). */
  today?: string;
}

/** Runtime Shield Advisor entry point. Output mirrors the `/api/shield/advise` response. */
export function advise(profile: unknown, options: AdviseOptions = {}): AdviseResult {
  const input = profile ?? {};
  const advice = analyze(input);
  const policy = generatePolicy(input, advice, options.today);
  const { _normalized: _drop, ...rest } = advice;
  const errors = validatePolicy(policy);
  const partial = {
    ...rest,
    policy,
    policy_yaml: toYaml(policy),
    policy_json: toJson(policy),
    policy_validation: { valid: errors.length === 0, errors, warnings: lintPolicy(policy) },
    activation:
      "Not activated. The policy is a draft in observe mode; activation requires review and " +
      `recorded approval by: ${policy.approval.required_approver_roles.join(", ")}.`,
  };
  const withSummary = { ...partial, summary: summary(partial) };

  const cits = new Set<string>();
  const { policy: _policy, ...noPolicy } = withSummary;
  collectCitations(noPolicy, cits);
  for (const c of policy.citations) cits.add(c);
  const unknown = [...cits].filter((c) => getControl(c) === undefined).sort();
  if (unknown.length) {
    // developer error: never emit invented control IDs
    throw new Error(`advisor produced unknown control IDs: ${unknown.join(", ")}`);
  }
  const ordered = [...cits].sort((x, y) => {
    const d = PREFIX_ORDER.indexOf(x.slice(0, 2)) - PREFIX_ORDER.indexOf(y.slice(0, 2));
    return d || (x < y ? -1 : x > y ? 1 : 0);
  });
  const details: CitationDetail[] = ordered.map((c) => {
    const ctl = getControl(c);
    return {
      id: c,
      title: ctl?.title ?? c,
      citation: controlCitation(c),
      mappings: (ctl?.mappings ?? {}) as JsonValue,
    };
  });
  return {
    ...withSummary,
    citations: ordered,
    citation_details: details.length ? details : [{ id: null, citation: NO_SOURCE_MESSAGE }],
  };
}
