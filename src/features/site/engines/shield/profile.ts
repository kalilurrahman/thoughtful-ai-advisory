/**
 * Normalization of Runtime Shield Advisor input profiles — port of
 * platform/app/runtime-shield/veritrail_shield/profile.py.
 *
 * Accepts the profile (see `PROFILE_FIELDS`) with tolerant aliases. Every value that
 * comes from the user is tracked as User-asserted; every value VERITRAIL fills in is
 * tracked as Inferred (with the assumption stated) so outputs can be labelled.
 */
import { OPERATIONS, PII_ENTITY_SET } from "./constants";
import {
  cpSlice,
  escapeRe,
  getKey,
  hasKey,
  isPlainObject,
  pyIsEmptyLike,
  pyStr,
  pyStrip,
  pyTruthy,
  type JsonObject,
} from "./py";
import { validateParameterSpecs } from "./schema";

export const PROFILE_FIELDS: Record<string, string> = {
  app_name: "Application or agent name",
  purpose: "Intended purpose and context of use",
  users: "User groups / business functions served",
  model: "Model (name/version)",
  vendor: "Model vendor or hosting provider",
  tools:
    "Tools, APIs, plugins and databases, each with operation type " +
    "(read|write|delete|external_send|payment|export)",
  data_categories: "Data categories processed",
  data_sensitivity:
    "Highest data sensitivity (public|internal|confidential|personal|special_category)",
  autonomy: "Autonomy (none|suggests|acts_with_approval|acts_autonomously)",
  human_approval_model:
    "Human-approval model (none|per_action|high_impact_only|threshold|batch_review or description)",
  environment: "Deployment environment (dev|test|staging|production)",
  risk_tier: "Assigned risk tier (Minimal|Limited|High-risk|Prohibited-review)",
  affected_parties: "Who is affected (internal|customers|public|vulnerable)",
  regulatory_obligations: "Regulatory obligations (e.g. GDPR, EU AI Act, HIPAA, PCI DSS, SOX)",
  customer_obligations:
    "Customer/contractual obligations (e.g. zero data retention, residency, SLAs)",
  existing_controls:
    "Existing security controls (e.g. SSO, DLP, SIEM, secrets manager, red-team testing)",
};

export const AUTONOMY_LEVELS = [
  "none",
  "suggests",
  "acts_with_approval",
  "acts_autonomously",
] as const;
export const SENSITIVITY_LEVELS = [
  "public",
  "internal",
  "confidential",
  "personal",
  "special_category",
] as const;
export const AFFECTED_LEVELS = ["internal", "customers", "public", "vulnerable"] as const;
export const APPROVAL_MODELS = [
  "none",
  "per_action",
  "high_impact_only",
  "threshold",
  "batch_review",
] as const;

const OP_KEYWORDS: Array<[string, string[]]> = [
  [
    "payment",
    [
      "pay",
      "payment",
      "refund",
      "transfer",
      "payout",
      "disburse",
      "wire",
      "charge",
      "remit",
      "reimburse",
      "settle",
    ],
  ],
  ["delete", ["delete", "remove", "purge", "drop", "erase", "destroy", "terminate", "revoke"]],
  ["export", ["export", "download", "bulk", "extract", "dump"]],
  [
    "external_send",
    [
      "send",
      "email",
      "sms",
      "notify",
      "publish",
      "message",
      "slack",
      "webhook",
      "reply",
      "post",
      "forward",
    ],
  ],
  [
    "write",
    [
      "create",
      "update",
      "write",
      "edit",
      "modify",
      "set",
      "insert",
      "upsert",
      "assign",
      "close",
      "merge",
      "deploy",
      "commit",
      "push",
      "apply",
      "schedule",
      "draft",
      "book",
      "restart",
      "scale",
    ],
  ],
  [
    "read",
    [
      "get",
      "read",
      "search",
      "lookup",
      "list",
      "fetch",
      "query",
      "retrieve",
      "view",
      "find",
      "status",
      "check",
      "summari",
      "classify",
    ],
  ],
];

const OP_ALIASES: Record<string, string> = {
  read: "read",
  read_only: "read",
  readonly: "read",
  query: "read",
  write: "write",
  update: "write",
  create: "write",
  delete: "delete",
  remove: "delete",
  external_send: "external_send",
  send: "external_send",
  external: "external_send",
  email: "external_send",
  payment: "payment",
  pay: "payment",
  refund: "payment",
  transfer: "payment",
  export: "export",
  download: "export",
};

const SPECIAL = [
  "health",
  "medical",
  "clinical",
  "patient",
  "diagnos",
  "biometric",
  "genetic",
  "religio",
  "ethnic",
  "racial",
  "sexual",
  "trade union",
  "political",
  "criminal",
  "phi",
  "special category",
  "special_category",
];
const PERSONAL = [
  "personal",
  "pii",
  "customer",
  "contact",
  "employee",
  "hr",
  "payment card",
  "card",
  "bank account",
  "account number",
  "financial account",
  "address",
  "identity",
  "id number",
  "ssn",
  "passport",
  "date of birth",
  "email",
  "phone",
  "payroll",
  "salary",
  "credit",
];
const CONFIDENTIAL = [
  "confidential",
  "source code",
  "secret",
  "credential",
  "contract",
  "financial report",
  "ledger",
  "invoice",
  "trade secret",
  "pricing",
  "m&a",
  "legal",
  "infrastructure",
  "config",
];
const INTERNAL = [
  "internal",
  "policy",
  "knowledge base",
  "wiki",
  "documentation",
  "procedure",
  "ticket",
];

const CONTROL_KEYWORDS: Array<[string, string[]]> = [
  ["sso", ["sso", "single sign", "idp", "okta", "entra", "azure ad", "saml", "oidc"]],
  ["mfa", ["mfa", "multi-factor", "2fa"]],
  ["dlp", ["dlp", "data loss"]],
  ["siem", ["siem", "splunk", "sentinel", "security monitoring", "soc"]],
  ["secrets_manager", ["secrets manager", "vault", "key vault", "kms", "secret manager"]],
  ["api_gateway", ["api gateway", "gateway", "waf", "proxy"]],
  ["rbac", ["rbac", "role-based", "role based", "abac"]],
  ["encryption", ["encryption", "tls", "encrypted"]],
  ["red_team", ["red team", "red-team", "pen test", "pentest", "penetration", "adversarial test"]],
  ["logging", ["logging", "audit log", "log retention"]],
  ["incident_response", ["incident response", "ir plan", "runbook", "on-call", "oncall"]],
  [
    "vendor_terms",
    [
      "zero data retention",
      "zero retention",
      "dpa",
      "data processing agreement",
      "baa",
      "no training",
      "enterprise agreement",
    ],
  ],
  ["kill_switch", ["kill switch", "feature flag", "circuit breaker"]],
];

export function slug(text: string | null | undefined, maxLen = 60): string {
  const s = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (s || "app").slice(0, maxLen).replace(/^-+|-+$/g, "") || "app";
}

function asList(v: unknown): unknown[] {
  if (v === null || v === undefined || v === "") return [];
  if (Array.isArray(v)) return v.filter((x) => !(x === null || x === undefined || x === ""));
  if (typeof v === "string") {
    return v
      .split(/[;,\n]/)
      .map((p) => pyStrip(p))
      .filter(Boolean);
  }
  return [v];
}

function tokens(text: unknown): string[] {
  const t = pyStr(text ?? "").replace(/([a-z])([A-Z])/g, "$1 $2");
  return t
    .toLowerCase()
    .split(/[^a-z0-9&]+/)
    .filter(Boolean);
}

function kwMatch(token: string, kw: string): boolean {
  return token === kw || (kw.length >= 4 && token.startsWith(kw));
}

/** Infer a tool's operation type from its name (verb-first), then its description. */
export function inferOperation(name: string, description = ""): string | null {
  for (const source of [name, description]) {
    for (const tok of tokens(source)) {
      for (const [op, kws] of OP_KEYWORDS) {
        if (kws.some((k) => kwMatch(tok, k))) return op;
      }
    }
  }
  return null;
}

function hasPhrase(text: string, phrases: string[]): boolean {
  for (const ph of phrases) {
    const re =
      ph.length <= 3 ? new RegExp(`\\b${escapeRe(ph)}\\b`) : new RegExp(`\\b${escapeRe(ph)}`);
    if (re.test(text)) return true;
  }
  return false;
}

export function inferSensitivity(categories: string[]): string | null {
  const text = categories.map((c) => c.toLowerCase().replaceAll("_", " ")).join(" ");
  if (!text) return null;
  if (hasPhrase(text, SPECIAL)) return "special_category";
  if (hasPhrase(text, PERSONAL)) return "personal";
  if (hasPhrase(text, CONFIDENTIAL)) return "confidential";
  if (hasPhrase(text, INTERNAL)) return "internal";
  if (text.includes("public")) return "public";
  return "internal";
}

/** Map free-text existing controls to canonical keys -> original text. */
export function recognizeControls(existing: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of existing) {
    const t = item.toLowerCase();
    for (const [key, kws] of CONTROL_KEYWORDS) {
      if (!hasKey(out, key) && hasPhrase(t, kws)) out[key] = item;
    }
  }
  return out;
}

function normEnum(
  value: unknown,
  allowed: readonly string[],
  aliases?: Record<string, string>,
): string | null {
  if (typeof value !== "string" || !pyStrip(value)) return null;
  const v = pyStrip(value).toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  if (aliases && hasKey(aliases, v)) return aliases[v] ?? null;
  return allowed.includes(v) ? v : null;
}

const AUTONOMY_ALIASES: Record<string, string> = {
  suggest: "suggests",
  advisory: "suggests",
  assistive: "suggests",
  copilot: "suggests",
  human_in_the_loop: "acts_with_approval",
  with_approval: "acts_with_approval",
  supervised: "acts_with_approval",
  autonomous: "acts_autonomously",
  fully_autonomous: "acts_autonomously",
  full: "acts_autonomously",
  no: "none",
  manual: "none",
};
const ENV_ALIASES: Record<string, string> = {
  prod: "production",
  live: "production",
  development: "dev",
  stage: "staging",
  uat: "staging",
  qa: "test",
  pilot: "staging",
};
const TIER_MAP: Record<string, string> = {
  minimal: "Minimal",
  limited: "Limited",
  high_risk: "High-risk",
  prohibited: "Prohibited-review",
  // legacy aliases
  low: "Minimal",
  medium: "Limited",
  high: "High-risk",
  prohibited_review: "Prohibited-review",
  critical: "High-risk",
};

const MAX_TEXT = 500;
const MAX_ITEMS = 100;

/** Accept strings and numbers (not booleans) as text; anything else is treated as not provided. */
function scalar(v: unknown, maxLen = MAX_TEXT): string | null {
  if (typeof v === "boolean" || v === null || v === undefined) return null;
  let s: string;
  if (typeof v === "number") s = pyStr(v);
  else if (typeof v === "string") s = v;
  else return null;
  s = pyStrip(s);
  return s ? cpSlice(s, maxLen) : null;
}

function strList(v: unknown): string[] {
  const out: string[] = [];
  for (const x of asList(v).slice(0, MAX_ITEMS)) {
    const sx = scalar(x);
    if (sx) out.push(sx);
  }
  return out;
}

function posNumber(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v) || v <= 0) return null;
  return v;
}

export interface Assumption {
  field: string;
  assumed: string;
  why: string;
}

export interface NormalizedTool {
  name: string;
  description?: string;
  operation: string;
  operation_source: "User-asserted" | "Inferred" | "Missing evidence";
  max_amount?: number;
  auto_approve_below?: number;
  max_calls_per_session?: number;
  allowed_domains: string[];
  scopes: string[];
  approval_roles: string[];
  currencies: string[];
  allow_pii_entities: string[];
  data_sensitivity?: string;
  recipient_param?: string;
  recipient_binding: boolean;
  requires_approval: boolean;
  parameters?: Record<string, JsonObject>;
}

export interface NormalizedProfile {
  app_name: string;
  agent_name: string;
  purpose: string | null;
  users: string[];
  business_functions: string[];
  model: string | null;
  vendor: string | null;
  tools: NormalizedTool[];
  data_categories: string[];
  data_sensitivity: string;
  autonomy: string;
  human_approval_model: string;
  human_approval_description: string | null;
  environment: string;
  risk_tier: string | null;
  affected_parties: string;
  regulatory_obligations: string[];
  customer_obligations: string[];
  existing_controls: string[];
  recognized_controls: Record<string, string>;
  tenant: string;
  owner: string;
  limits: Record<string, number>;
  allowed_roles: string[];
  approver_roles: string[];
  allowed_link_domains: string[];
  synthetic: boolean;
  _asserted: Record<string, string | string[]>;
  _assumptions: Assumption[];
  _missing: string[];
}

function cleanTool(raw: unknown, assumptions: Assumption[]): NormalizedTool | null {
  let t: unknown = raw;
  if (typeof t === "string") {
    const stripped = pyStrip(t);
    const idx = stripped.lastIndexOf(":");
    const name = idx >= 0 ? stripped.slice(0, idx) : "";
    const opPart = idx >= 0 ? stripped.slice(idx + 1) : stripped;
    const opKey = pyStrip(opPart).toLowerCase();
    // "crm_lookup:read" (website form format)
    t =
      name && hasKey(OP_ALIASES, opKey)
        ? { name: pyStrip(name), operation: opKey }
        : { name: stripped };
  }
  if (!isPlainObject(t)) return null;
  const name = scalar(getKey(t, "name"), 200);
  if (!name) return null;
  const desc = scalar(getKey(t, "description"));
  let rawOpValue: unknown = getKey(t, "operation");
  if (!pyTruthy(rawOpValue)) rawOpValue = getKey(t, "operation_type");
  if (!pyTruthy(rawOpValue)) rawOpValue = getKey(t, "type");
  const rawOp = scalar(rawOpValue, 50);
  let op: string | null =
    rawOp && hasKey(OP_ALIASES, rawOp.toLowerCase())
      ? (OP_ALIASES[rawOp.toLowerCase()] ?? null)
      : null;
  let opSource: NormalizedTool["operation_source"];
  if (op !== null && (OPERATIONS as readonly string[]).includes(op)) {
    opSource = "User-asserted";
  } else {
    op = inferOperation(name, desc ?? "");
    opSource = op ? "Inferred" : "Missing evidence";
    if (rawOp) {
      assumptions.push({
        field: `tools[${name}].operation`,
        assumed: op ?? "unknown",
        why: `operation '${rawOp}' not recognized`,
      });
    }
  }
  const out: NormalizedTool = {
    name,
    ...(desc ? { description: desc } : {}),
    operation: op ?? "unknown",
    operation_source: opSource,
    allowed_domains: [],
    scopes: [],
    approval_roles: [],
    currencies: [],
    allow_pii_entities: [],
    recipient_binding: false,
    requires_approval: false,
  };
  for (const key of ["max_amount", "auto_approve_below"] as const) {
    if (hasKey(t, key)) {
      const num = posNumber(t[key]);
      if (num === null) {
        assumptions.push({
          field: `tools[${name}].${key}`,
          assumed: "not set",
          why: `${key} must be a positive number; value ignored`,
        });
      } else {
        out[key] = num;
      }
    }
  }
  if (hasKey(t, "max_calls_per_session")) {
    const n = t["max_calls_per_session"];
    if (typeof n === "number" && Number.isInteger(n) && n > 0) out.max_calls_per_session = n;
  }
  out.allowed_domains = strList(getKey(t, "allowed_domains"));
  out.scopes = strList(getKey(t, "scopes"));
  out.approval_roles = strList(getKey(t, "approval_roles"));
  out.currencies = strList(getKey(t, "currencies"));
  out.allow_pii_entities = strList(getKey(t, "allow_pii_entities")).filter((e) =>
    PII_ENTITY_SET.has(e),
  );
  const sens = normEnum(getKey(t, "data_sensitivity"), SENSITIVITY_LEVELS);
  if (sens) out.data_sensitivity = sens;
  const rp = scalar(getKey(t, "recipient_param"), 64);
  if (rp && /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(rp)) out.recipient_param = rp;
  out.recipient_binding = getKey(t, "recipient_binding") === true;
  out.requires_approval = getKey(t, "requires_approval") === true;
  const params = getKey(t, "parameters");
  if (!pyIsEmptyLike(params, { list: true, dict: true })) {
    const errs = validateParameterSpecs(params);
    if (errs.length) {
      assumptions.push({
        field: `tools[${name}].parameters`,
        assumed: "not declared",
        why: "declared parameters were invalid and were ignored: " + errs.slice(0, 3).join("; "),
      });
    } else {
      out.parameters = params as Record<string, JsonObject>;
    }
  }
  // Keep the Python key order (description before operation; optional fields in place).
  return reorderTool(out);
}

const TOOL_KEY_ORDER = [
  "name",
  "description",
  "operation",
  "operation_source",
  "max_amount",
  "auto_approve_below",
  "max_calls_per_session",
  "allowed_domains",
  "scopes",
  "approval_roles",
  "currencies",
  "allow_pii_entities",
  "data_sensitivity",
  "recipient_param",
  "recipient_binding",
  "requires_approval",
  "parameters",
];

function reorderTool(t: NormalizedTool): NormalizedTool {
  const src = t as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of TOOL_KEY_ORDER) if (hasKey(src, k)) out[k] = src[k];
  return out as unknown as NormalizedTool;
}

/**
 * Return a normalized profile with `_asserted` (user-provided keys), `_assumptions` and `_missing`.
 * Input is untrusted: values of an unexpected type are treated as not provided, text is
 * length-capped and lists are size-capped.
 */
export function normalizeProfile(profile: unknown): NormalizedProfile {
  const p: Record<string, unknown> = isPlainObject(profile) ? { ...profile } : {};
  const asserted: Record<string, string | string[]> = {};
  const assumptions: Assumption[] = [];
  const missing: string[] = [];

  const takeText = (key: string, ...aliases: string[]): string | null => {
    for (const k of [key, ...aliases]) {
      const v = scalar(getKey(p, k));
      if (v) {
        asserted[key] = v;
        return v;
      }
    }
    return null;
  };
  const takeList = (key: string, ...aliases: string[]): string[] => {
    for (const k of [key, ...aliases]) {
      const v = strList(getKey(p, k));
      if (v.length) {
        asserted[key] = v;
        return v;
      }
    }
    return [];
  };

  let appName = takeText("app_name", "name", "application", "agent_name");
  appName = appName ? cpSlice(appName, 150) : null;
  const purpose = takeText("purpose", "description", "intended_purpose");
  const users = takeList("users", "user_groups");
  const businessFunctions = takeList("business_functions", "business_function");
  const model = takeText("model");
  const vendor = takeText("vendor", "model_vendor", "provider");
  const dataCategories = takeList("data_categories", "data");
  const regulatory = takeList("regulatory_obligations", "regulations");
  const customerObl = takeList("customer_obligations", "contractual_obligations");
  const existing = takeList("existing_controls", "existing_security_controls", "security_controls");

  const rawAutonomy = takeText("autonomy");
  let autonomy = normEnum(rawAutonomy, AUTONOMY_LEVELS, AUTONOMY_ALIASES);
  if (autonomy === null) {
    autonomy = "acts_autonomously";
    assumptions.push({
      field: "autonomy",
      assumed: autonomy,
      why:
        "autonomy not provided or not recognized; assuming the most permissive level " +
        "until confirmed (conservative)",
    });
  }

  const rawSens = takeText("data_sensitivity", "sensitivity");
  let sensitivity = normEnum(rawSens, SENSITIVITY_LEVELS, {
    special: "special_category",
    pii: "personal",
    sensitive: "personal",
    restricted: "confidential",
  });
  const inferredSens = inferSensitivity(dataCategories);
  const sensIdx = (s: string) => (SENSITIVITY_LEVELS as readonly string[]).indexOf(s);
  if (sensitivity === null) {
    sensitivity = inferredSens || "personal";
    assumptions.push({
      field: "data_sensitivity",
      assumed: sensitivity,
      why: inferredSens
        ? "inferred from data categories"
        : "no data categories provided; assuming personal data until confirmed",
    });
  } else if (inferredSens && sensIdx(inferredSens) > sensIdx(sensitivity)) {
    assumptions.push({
      field: "data_sensitivity",
      assumed: inferredSens,
      why:
        `stated sensitivity '${sensitivity}' is lower than the data categories suggest; ` +
        "using the higher level pending confirmation",
    });
    sensitivity = inferredSens;
  }

  const rawEnv = takeText("environment");
  let environment = normEnum(rawEnv, ["dev", "test", "staging", "production"], ENV_ALIASES);
  if (environment === null) {
    environment = "production";
    assumptions.push({
      field: "environment",
      assumed: "production",
      why:
        "environment not provided or not recognized; production controls proposed " +
        "(conservative)",
    });
  }

  const rawTier = takeText("risk_tier");
  let riskTier: string | null = null;
  if (rawTier) {
    const k = rawTier.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
    riskTier = hasKey(TIER_MAP, k) ? (TIER_MAP[k] ?? null) : null;
  }
  if (rawTier && riskTier === null) {
    delete asserted["risk_tier"];
    assumptions.push({
      field: "risk_tier",
      assumed: "not assigned",
      why: `risk tier '${rawTier}' not recognized (Minimal|Limited|High-risk|Prohibited-review)`,
    });
  }

  const rawAff = takeText("affected_parties");
  let affected = normEnum(rawAff, AFFECTED_LEVELS, {
    employees: "internal",
    staff: "internal",
    customer: "customers",
    clients: "customers",
    patients: "vulnerable",
    children: "vulnerable",
    consumers: "customers",
  });
  if (affected === null) {
    const text = [...users, ...businessFunctions].map((u) => u.toLowerCase()).join(" ");
    const any = (ks: string[]) => ks.some((k) => text.includes(k));
    if (any(["patient", "child", "minor", "vulnerable"])) affected = "vulnerable";
    else if (any(["customer", "client", "consumer", "member", "policyholder"]))
      affected = "customers";
    else if (any(["public", "citizen", "anyone"])) affected = "public";
    else if (text) affected = "internal";
    else affected = "customers";
    assumptions.push({
      field: "affected_parties",
      assumed: affected,
      why: text
        ? "inferred from users/business functions"
        : "not provided; assuming customers are affected",
    });
  }

  const rawAppr = takeText("human_approval_model", "approval_model", "human_approval");
  let approvalModel: string | null = normEnum(rawAppr, APPROVAL_MODELS, {
    "per-action": "per_action",
    always: "per_action",
    high_impact: "high_impact_only",
    no: "none",
    thresholds: "threshold",
  });
  let approvalDescription: string | null = null;
  if (rawAppr && approvalModel === null) {
    approvalModel = "described";
    approvalDescription = rawAppr;
  }
  if (!rawAppr) approvalModel = "unknown";

  const tools: NormalizedTool[] = [];
  let rawTools: unknown = undefined;
  for (const k of ["tools", "apis", "integrations"]) {
    const v = getKey(p, k);
    if (!pyIsEmptyLike(v, { list: true, dict: true })) {
      rawTools = v;
      break;
    }
  }
  const seen = new Set<string>();
  for (const t of asList(rawTools).slice(0, MAX_ITEMS)) {
    const ct = cleanTool(t, assumptions);
    if (ct && !seen.has(ct.name)) {
      seen.add(ct.name);
      tools.push(ct);
    }
  }
  if (tools.length) asserted["tools"] = tools.map((t) => t.name);

  for (const k of Object.keys(PROFILE_FIELDS)) {
    if (!hasKey(asserted, k)) missing.push(k);
  }

  const limits: Record<string, number> = {};
  const rawLimits = getKey(p, "limits");
  if (isPlainObject(rawLimits)) {
    for (const [k, v] of Object.entries(rawLimits)) {
      const num = posNumber(v);
      if (num !== null) limits[k] = k !== "cost_per_month_usd" ? Math.trunc(num) : num;
    }
  }

  const agentName = slug(scalar(getKey(p, "agent_name")) || appName || "unnamed-agent");
  return {
    app_name: appName || "Unnamed AI application",
    agent_name: agentName,
    purpose,
    users,
    business_functions: businessFunctions,
    model,
    vendor,
    tools,
    data_categories: dataCategories,
    data_sensitivity: sensitivity,
    autonomy,
    human_approval_model: approvalModel ?? "unknown",
    human_approval_description: approvalDescription,
    environment,
    risk_tier: riskTier,
    affected_parties: affected,
    regulatory_obligations: regulatory,
    customer_obligations: customerObl,
    existing_controls: existing,
    recognized_controls: recognizeControls(existing),
    tenant: scalar(getKey(p, "tenant"), 100) || "*",
    owner: scalar(getKey(p, "owner"), 200) || "AI System Owner",
    limits,
    allowed_roles: strList(getKey(p, "allowed_roles")),
    approver_roles: strList(getKey(p, "approver_roles")),
    allowed_link_domains: strList(getKey(p, "allowed_link_domains")),
    synthetic: getKey(p, "synthetic") === true,
    _asserted: asserted,
    _assumptions: assumptions,
    _missing: missing,
  };
}
