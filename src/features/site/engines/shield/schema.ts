/**
 * AEGIS runtime policy-as-code schema and validator — port of
 * platform/app/policy-engine/aegis_policy/schema.py.
 *
 * `validatePolicy` returns human-readable error strings (empty == valid);
 * `lintPolicy` returns non-blocking governance warnings; `validateParameterSpecs`
 * validates a tool's declared `parameters` mapping on its own.
 */
import { controls } from "../../content";
import {
  CHANGE_TYPES,
  CONDITION_OPS,
  CONTENT_SURFACES,
  DEFAULT_TOOL_ACTIONS,
  ENVIRONMENTS,
  HIGH_IMPACT_OPERATIONS,
  IRREVERSIBLE_OPERATIONS,
  KILL_SWITCH_SCOPES,
  LOGGING_LEVELS,
  OPERATIONS,
  PARAM_TYPES,
  PII_ENTITIES,
  PII_ENTITY_SET,
  RISK_TIERS,
  ROLLOUT_MODES,
  SCHEMA_VERSION,
  STATUSES,
  TOOL_RULE_ACTIONS,
  TRANSFORM_TYPES,
} from "./constants";
import { cpLen, isPlainObject, pyRepr, pyReMatch, pyTypeName } from "./py";

export const SEMVER_PATTERN =
  "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)" +
  "(?:-((?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*))*))?" +
  "(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$";
export const POLICY_ID_RE = "^[a-z0-9][a-z0-9._-]{2,79}$";
export const RULE_ID_RE = "^[a-z0-9][a-z0-9._:-]{1,99}$";
export const CONTROL_ID_RE = "^(AO|EI|GL|IS|SE)-\\d{2}$";
export const DATE_RE = "^\\d{4}-\\d{2}-\\d{2}([T ][0-9:.+\\-Z]+)?$";

export interface Spec {
  type?: "string" | "integer" | "number" | "boolean" | "array" | "object" | "any";
  nullable?: boolean;
  enum?: readonly unknown[];
  pattern?: string;
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  items?: Spec;
  min_items?: number;
  unique?: boolean;
  fields?: Record<string, Spec>;
  required?: readonly string[];
  additional?: boolean;
  values?: Spec;
  description?: string;
}

const str = (kw: Spec = {}): Spec => ({ type: "string", ...kw });
const int = (kw: Spec = {}): Spec => ({ type: "integer", ...kw });
const bool = (kw: Spec = {}): Spec => ({ type: "boolean", ...kw });
const list = (items: Spec, kw: Spec = {}): Spec => ({ type: "array", items, ...kw });
const obj = (
  fields: Record<string, Spec>,
  required: readonly string[] = [],
  additional = false,
  kw: Spec = {},
): Spec => ({ type: "object", fields, required: [...required], additional, ...kw });

const CITATIONS: Spec = list(str({ pattern: CONTROL_ID_RE }), {
  unique: true,
  description: "AEGIS control IDs from content/controls/controls.yaml",
});

export const PARAM_SPEC: Spec = obj(
  {
    type: str({ enum: [...PARAM_TYPES] }),
    required: bool(),
    description: str(),
    min: { type: "number" },
    max: { type: "number" },
    min_length: int({ min: 0 }),
    max_length: int({ min: 0 }),
    max_items: int({ min: 0 }),
    regex: str({ min_length: 1, max_length: 500 }),
    enum: list({ type: "any" }, { min_items: 1 }),
    domain_allow_list: list(str({ min_length: 1 }), { min_items: 1 }),
  },
  ["type"],
  false,
  { description: "Parameter validation rule" },
);

const CONDITION_SPEC: Spec = obj(
  {
    param: str({ min_length: 1 }),
    op: str({ enum: [...CONDITION_OPS] }),
    value: { type: "any" },
    reason: str(),
  },
  ["param", "op", "value"],
);

const TOOL_RULE_SPEC: Spec = obj(
  {
    id: str({ pattern: RULE_ID_RE }),
    tool: str({ min_length: 1, max_length: 200 }),
    operation: str({ enum: [...OPERATIONS] }),
    action: str({ enum: [...TOOL_RULE_ACTIONS] }),
    description: str(),
    scopes: list(str({ min_length: 1 }), { unique: true }),
    allowed_roles: list(str({ min_length: 1 }), { unique: true }),
    parameters: { type: "object", fields: {}, required: [], additional: true, values: PARAM_SPEC },
    additional_parameters: bool(),
    require_approval_if: list(CONDITION_SPEC),
    approval_roles: list(str({ min_length: 1 }), { unique: true }),
    max_calls_per_session: int({ min: 1 }),
    allow_pii_entities: list(str({ min_length: 1 }), { unique: true }),
    citations: CITATIONS,
  },
  ["id", "tool", "operation", "action"],
);

const DETECTOR_SPEC: Spec = obj(
  {
    enabled: bool(),
    apply_to: list(str({ enum: [...CONTENT_SURFACES] }), { unique: true }),
    action: str({ enum: ["DENY", "ESCALATE", "REQUIRE_HUMAN_APPROVAL"] }),
    decode_obfuscation: bool(),
  },
  ["enabled", "action"],
);

const TRANSFORM_SPEC: Spec = obj(
  {
    id: str({ pattern: RULE_ID_RE }),
    type: str({ enum: [...TRANSFORM_TYPES] }),
    apply_to: list(str({ enum: ["response"] }), { unique: true }),
    text: str({ min_length: 1, max_length: 1000 }),
    domain_allow_list: list(str({ min_length: 1 })),
    max_chars: int({ min: 1 }),
  },
  ["id", "type"],
);

const PERSON_APPROVAL_SPEC: Spec = obj(
  {
    name: str({ min_length: 1 }),
    role: str({ min_length: 1 }),
    approved_at: str({ pattern: DATE_RE }),
    note: str(),
  },
  ["name", "role", "approved_at"],
);

export const POLICY_SCHEMA: Spec = obj(
  {
    schema_version: str({ enum: [SCHEMA_VERSION] }),
    policy_id: str({ pattern: POLICY_ID_RE }),
    policy_name: str({ min_length: 3, max_length: 200 }),
    description: str(),
    version: str({ pattern: SEMVER_PATTERN }),
    status: str({ enum: [...STATUSES] }),
    owner: str({ min_length: 1 }),
    applies_to: obj(
      {
        agent_name: list(str({ min_length: 1 }), { min_items: 1 }),
        environment: list(str({ enum: [...ENVIRONMENTS, "*"] }), { min_items: 1 }),
        risk_tier: list(str({ enum: [...RISK_TIERS, "*"] }), { min_items: 1 }),
        tenant: list(str({ min_length: 1 }), { min_items: 1 }),
        model: list(str({ min_length: 1 }), { min_items: 1 }),
      },
      ["agent_name", "environment"],
    ),
    rollout: obj(
      {
        mode: str({ enum: [...ROLLOUT_MODES] }),
        exit_criteria: list(str({ min_length: 1 })),
        notes: str(),
      },
      ["mode"],
    ),
    identity: obj(
      {
        required: bool(),
        required_claims: list(str({ min_length: 1 }), { unique: true }),
        allowed_roles: list(str({ min_length: 1 }), { unique: true }),
        allowed_issuers: list(str({ min_length: 1 }), { unique: true }),
        tenant_binding: bool(),
      },
      ["required", "required_claims"],
    ),
    tools: obj(
      {
        default_action: str({ enum: [...DEFAULT_TOOL_ACTIONS] }),
        deny_list: list(str({ min_length: 1 }), { unique: true }),
        rules: list(TOOL_RULE_SPEC),
      },
      ["default_action", "rules"],
    ),
    content: obj(
      {
        max_input_chars: int({ min: 1 }),
        pii_redaction: obj(
          {
            enabled: bool(),
            entities: list(str({ min_length: 1 }), { unique: true }),
            apply_to: list(str({ enum: [...CONTENT_SURFACES] }), { unique: true }),
            action: str({ enum: ["REDACT", "DENY", "ESCALATE"] }),
          },
          ["enabled", "entities", "action"],
        ),
        prompt_injection: DETECTOR_SPEC,
        jailbreak: DETECTOR_SPEC,
        transforms: list(TRANSFORM_SPEC),
      },
      ["max_input_chars", "pii_redaction", "prompt_injection", "jailbreak"],
    ),
    limits: obj(
      {
        requests_per_minute: int({ min: 1 }),
        tool_calls_per_session: int({ min: 1 }),
        tokens_per_day: int({ min: 1 }),
        cost_per_month_usd: { type: "number", min: 0 },
        action_on_breach: str({ enum: ["RATE_LIMIT", "ESCALATE"] }),
        alert_at_percent: int({ min: 1, max: 100 }),
      },
      ["requests_per_minute", "tool_calls_per_session", "tokens_per_day", "cost_per_month_usd"],
    ),
    logging: obj(
      {
        immutable_audit: bool(),
        prompt_logging: str({ enum: [...LOGGING_LEVELS] }),
        response_logging: str({ enum: [...LOGGING_LEVELS] }),
        tool_param_logging: str({ enum: [...LOGGING_LEVELS] }),
        sink: str(),
      },
      ["immutable_audit", "prompt_logging", "response_logging"],
    ),
    kill_switch: obj(
      {
        enabled: bool(),
        engaged: bool(),
        scopes: list(str({ enum: [...KILL_SWITCH_SCOPES] }), { min_items: 1, unique: true }),
        engaged_targets: list(
          obj(
            {
              scope: str({ enum: [...KILL_SWITCH_SCOPES] }),
              target: str({ min_length: 1 }),
              reason: str(),
              engaged_by: str(),
              engaged_at: str({ pattern: DATE_RE }),
            },
            ["scope", "target"],
          ),
        ),
        authorized_roles: list(str({ min_length: 1 }), { min_items: 1, unique: true }),
        target_time_to_disable_minutes: int({ min: 1 }),
      },
      ["enabled", "scopes", "authorized_roles"],
    ),
    rollback: obj(
      {
        previous_version: str({ pattern: SEMVER_PATTERN, nullable: true }),
        strategy: str({ enum: ["revert_to_previous", "contain", "disable"] }),
        triggers: list(str({ min_length: 1 })),
      },
      ["previous_version", "strategy"],
    ),
    shadow_mode: obj(
      {
        enabled: bool(),
        evaluate_as: str({ enum: [...ROLLOUT_MODES] }),
      },
      ["enabled"],
    ),
    evidence_retention_days: int({ min: 1, max: 3650 }),
    approval: obj(
      {
        required_approver_roles: list(str({ min_length: 1 }), { min_items: 1, unique: true }),
        min_approvers: int({ min: 1 }),
        separation_of_duties: bool(),
        approved_by: list(PERSON_APPROVAL_SPEC),
        approved_at: str({ pattern: DATE_RE, nullable: true }),
      },
      ["required_approver_roles", "min_approvers", "approved_by", "approved_at"],
    ),
    change_history: list(
      obj(
        {
          version: str({ pattern: SEMVER_PATTERN }),
          date: str({ pattern: DATE_RE }),
          author: str({ min_length: 1 }),
          change_type: str({ enum: [...CHANGE_TYPES] }),
          summary: str({ min_length: 1 }),
        },
        ["version", "date", "author", "change_type", "summary"],
      ),
      { min_items: 1 },
    ),
    escalation: obj({ queue: str(), contact_role: str() }, [], true),
    citations: { ...CITATIONS, min_items: 1 },
    metadata: { type: "object", fields: {}, required: [], additional: true },
  },
  [
    "schema_version",
    "policy_id",
    "policy_name",
    "version",
    "status",
    "owner",
    "applies_to",
    "rollout",
    "identity",
    "tools",
    "content",
    "limits",
    "logging",
    "kill_switch",
    "rollback",
    "shadow_mode",
    "evidence_retention_days",
    "approval",
    "change_history",
    "citations",
  ],
);

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

function typeOk(value: unknown, typ: string): boolean {
  switch (typ) {
    case "any":
      return true;
    case "integer":
      return typeof value === "number" && Number.isInteger(value);
    case "number":
      return typeof value === "number";
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return isPlainObject(value);
    default:
      return false;
  }
}

function check(value: unknown, spec: Spec, path: string, errors: string[]): void {
  if (value === null || value === undefined) {
    if (!spec.nullable) errors.push(`${path}: must not be null`);
    return;
  }
  const typ = spec.type ?? "any";
  if (!typeOk(value, typ)) {
    errors.push(`${path}: expected ${typ}, got ${pyTypeName(value)}`);
    return;
  }
  if (spec.enum && typ !== "array" && !spec.enum.includes(value)) {
    errors.push(`${path}: ${pyRepr(value)} not one of ${pyRepr(spec.enum)}`);
  }
  if (typ === "string" && typeof value === "string") {
    if (spec.pattern !== undefined && !pyReMatch(spec.pattern, value)) {
      errors.push(`${path}: ${pyRepr(value)} does not match required format`);
    }
    if (spec.min_length !== undefined && cpLen(value) < spec.min_length) {
      errors.push(`${path}: shorter than ${spec.min_length} characters`);
    }
    if (spec.max_length !== undefined && cpLen(value) > spec.max_length) {
      errors.push(`${path}: longer than ${spec.max_length} characters`);
    }
  } else if ((typ === "integer" || typ === "number") && typeof value === "number") {
    if (spec.min !== undefined && value < spec.min) errors.push(`${path}: must be >= ${spec.min}`);
    if (spec.max !== undefined && value > spec.max) errors.push(`${path}: must be <= ${spec.max}`);
  } else if (typ === "array" && Array.isArray(value)) {
    if (spec.min_items !== undefined && value.length < spec.min_items) {
      errors.push(`${path}: must contain at least ${spec.min_items} item(s)`);
    }
    if (spec.unique) {
      const seen = new Set<string>();
      for (const v of value) {
        const key = pyRepr(v);
        if (seen.has(key)) errors.push(`${path}: duplicate item ${key}`);
        seen.add(key);
      }
    }
    if (spec.items) {
      value.forEach((item, i) => check(item, spec.items as Spec, `${path}[${i}]`, errors));
    }
  } else if (typ === "object" && isPlainObject(value)) {
    const fields = spec.fields ?? {};
    for (const req of spec.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, req)) {
        errors.push(
          path ? `${path}.${req}: required field missing` : `${req}: required field missing`,
        );
      }
    }
    for (const [k, v] of Object.entries(value)) {
      const sub = path ? `${path}.${k}` : k;
      const fieldSpec = Object.prototype.hasOwnProperty.call(fields, k) ? fields[k] : undefined;
      if (fieldSpec) check(v, fieldSpec, sub, errors);
      else if (spec.values) check(v, spec.values, sub, errors);
      else if (!spec.additional) errors.push(`${sub}: unknown field`);
    }
  }
}

// ---------------------------------------------------------------------------
// Semantic validation
// ---------------------------------------------------------------------------

type SemverKey = [number, number, number, number, Array<[number, number | string]>];

export function parseSemver(version: string): [number, number, number, Array<number | string>] {
  const m = new RegExp(SEMVER_PATTERN.replace(/\$$/, "(?=\\n?$)")).exec(version || "");
  if (!m) throw new Error(`not a semantic version: ${pyRepr(version)}`);
  const pre = (m[4] ?? "")
    .split(".")
    .filter(Boolean)
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p));
  return [Number(m[1]), Number(m[2]), Number(m[3]), pre];
}

export function semverKey(version: string): SemverKey {
  const [ma, mi, pa, pre] = parseSemver(version);
  const preKey = pre.map((p): [number, number | string] =>
    typeof p === "number" ? [0, p] : [1, p],
  );
  return [ma, mi, pa, pre.length ? 0 : 1, preKey];
}

function cmp(a: unknown, b: unknown): number {
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = cmp(a[i], b[i]);
      if (c) return c;
    }
    return a.length - b.length;
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

const KNOWN_CONTROLS: ReadonlySet<string> = new Set(controls.map((c) => c.id));

/** Translate the most common Python-only regex syntax to JavaScript before compiling. */
function compilePyRegex(src: string): void {
  new RegExp(src.replace(/\(\?P</g, "(?<").replace(/\(\?P=(\w+)\)/g, "\\k<$1>"));
}

function paramSemantic(params: Record<string, unknown>, prefix: string, errors: string[]): void {
  for (const [pname, ps] of Object.entries(params)) {
    if (!isPlainObject(ps)) continue;
    const pp = `${prefix}.${pname}`;
    const regex = ps["regex"];
    if (typeof regex === "string") {
      try {
        compilePyRegex(regex);
      } catch (exc) {
        errors.push(`${pp}.regex: invalid regular expression (${(exc as Error).message})`);
      }
    }
    const min = ps["min"];
    const max = ps["max"];
    if (typeof min === "number" && typeof max === "number" && min > max) {
      errors.push(`${pp}: min greater than max`);
    }
    const ptype = ps["type"];
    if (
      (ptype === "integer" || ptype === "number" || ptype === "boolean") &&
      ["regex", "max_length", "domain_allow_list"].some((k) => k in ps)
    ) {
      errors.push(`${pp}: string constraints used on a ${ptype} parameter`);
    }
    if ((ptype === "string" || ptype === "boolean") && ["min", "max"].some((k) => k in ps)) {
      errors.push(`${pp}: numeric bounds used on a ${ptype} parameter`);
    }
  }
}

/** Validate a tool's `parameters` mapping on its own (used for advisor input). */
export function validateParameterSpecs(params: unknown): string[] {
  if (!isPlainObject(params)) return ["parameters: expected a mapping"];
  const errors: string[] = [];
  for (const [name, spec] of Object.entries(params)) {
    check(spec, PARAM_SPEC, `parameters.${name}`, errors);
  }
  if (!errors.length) paramSemantic(params, "parameters", errors);
  return errors;
}

const asObj = (v: unknown): Record<string, unknown> => (isPlainObject(v) ? v : {});
const truthy = (v: unknown): boolean =>
  !(v === null || v === undefined || v === false || v === 0 || v === "") &&
  !(Array.isArray(v) && v.length === 0) &&
  !(isPlainObject(v) && Object.keys(v).length === 0);

function semantic(policy: Record<string, unknown>, errors: string[]): void {
  const checkCitations = (cits: unknown, path: string) => {
    if (!Array.isArray(cits)) return;
    for (const c of cits) {
      if (typeof c === "string" && !KNOWN_CONTROLS.has(c)) {
        errors.push(`${path}: unknown AEGIS control ID ${pyRepr(c)}`);
      }
    }
  };
  checkCitations(policy["citations"], "citations");

  // Versions
  const version = policy["version"];
  const rollback = asObj(policy["rollback"]);
  const prev = rollback["previous_version"];
  if (typeof version === "string" && typeof prev === "string") {
    try {
      if (cmp(semverKey(prev), semverKey(version)) >= 0) {
        errors.push("rollback.previous_version: must be lower than version");
      }
    } catch {
      /* invalid semver already reported structurally */
    }
  }
  if (rollback["strategy"] === "revert_to_previous" && (prev === null || prev === undefined)) {
    errors.push("rollback.strategy: revert_to_previous requires rollback.previous_version");
  }
  const history = policy["change_history"];
  if (Array.isArray(history) && typeof version === "string") {
    if (!history.some((h) => isPlainObject(h) && h["version"] === version)) {
      errors.push("change_history: must contain an entry for the current version");
    }
  }

  // Tools
  const tools = asObj(policy["tools"]);
  const rules = Array.isArray(tools["rules"]) ? (tools["rules"] as unknown[]) : [];
  const denyList = new Set<unknown>(Array.isArray(tools["deny_list"]) ? tools["deny_list"] : []);
  const seenIds = new Set<unknown>();
  const seenTools = new Set<unknown>();
  rules.forEach((r, i) => {
    if (!isPlainObject(r)) return;
    const p = `tools.rules[${i}]`;
    const rid = r["id"];
    const tool = r["tool"];
    if (seenIds.has(rid)) errors.push(`${p}.id: duplicate rule id ${pyRepr(rid)}`);
    seenIds.add(rid);
    if (seenTools.has(tool)) errors.push(`${p}.tool: duplicate rule for tool ${pyRepr(tool)}`);
    seenTools.add(tool);
    if (denyList.has(tool) && r["action"] !== "DENY") {
      errors.push(
        `${p}: tool ${pyRepr(tool)} is on tools.deny_list but rule action is ${String(r["action"] ?? "None")}`,
      );
    }
    checkCitations(r["citations"], `${p}.citations`);
    const params = asObj(r["parameters"]);
    paramSemantic(params, `${p}.parameters`, errors);
    const conds = Array.isArray(r["require_approval_if"])
      ? (r["require_approval_if"] as unknown[])
      : [];
    conds.forEach((c, j) => {
      if (
        isPlainObject(c) &&
        !(
          typeof c["param"] === "string" && Object.prototype.hasOwnProperty.call(params, c["param"])
        )
      ) {
        errors.push(
          `${p}.require_approval_if[${j}].param: ${pyRepr(c["param"])} is not a declared parameter`,
        );
      }
      if (
        isPlainObject(c) &&
        (c["op"] === "in" || c["op"] === "not_in") &&
        !Array.isArray(c["value"])
      ) {
        errors.push(
          `${p}.require_approval_if[${j}].value: must be a list for op ${String(c["op"])}`,
        );
      }
    });
    const needsApprover = r["action"] === "REQUIRE_HUMAN_APPROVAL" || conds.length > 0;
    if (needsApprover && !truthy(r["approval_roles"])) {
      errors.push(`${p}.approval_roles: required when the rule can require human approval`);
    }
    if (
      typeof r["operation"] === "string" &&
      IRREVERSIBLE_OPERATIONS.has(r["operation"]) &&
      r["action"] === "ALLOW" &&
      !conds.length
    ) {
      errors.push(
        `${p}: ${r["operation"]} operations must not be unconditionally ALLOWed ` +
          "(use REQUIRE_HUMAN_APPROVAL or require_approval_if) — IS-13",
      );
    }
    const allowPii = r["allow_pii_entities"];
    for (const ent of Array.isArray(allowPii) ? allowPii : []) {
      if (!(typeof ent === "string" && PII_ENTITY_SET.has(ent))) {
        errors.push(`${p}.allow_pii_entities: unknown entity ${pyRepr(ent)}`);
      }
    }
  });

  // Content
  const content = asObj(policy["content"]);
  const pii = asObj(content["pii_redaction"]);
  const entities = pii["entities"];
  for (const ent of Array.isArray(entities) ? entities : []) {
    if (typeof ent === "string" && !PII_ENTITY_SET.has(ent)) {
      errors.push(
        `content.pii_redaction.entities: unknown entity ${pyRepr(ent)} (known: ${pyRepr([...PII_ENTITIES].sort())})`,
      );
    }
  }
  if (truthy(pii["enabled"]) && !truthy(entities)) {
    errors.push("content.pii_redaction.entities: must list at least one entity when enabled");
  }
  const seenT = new Set<unknown>();
  const transforms = content["transforms"];
  (Array.isArray(transforms) ? transforms : []).forEach((t, i) => {
    if (!isPlainObject(t)) return;
    if (seenT.has(t["id"])) errors.push(`content.transforms[${i}].id: duplicate transform id`);
    seenT.add(t["id"]);
    if (t["type"] === "append_disclosure" && !truthy(t["text"])) {
      errors.push(`content.transforms[${i}].text: required for append_disclosure`);
    }
    if (t["type"] === "strip_unapproved_urls" && !truthy(t["domain_allow_list"])) {
      errors.push(`content.transforms[${i}].domain_allow_list: required for strip_unapproved_urls`);
    }
    if (t["type"] === "truncate" && !truthy(t["max_chars"])) {
      errors.push(`content.transforms[${i}].max_chars: required for truncate`);
    }
  });

  // Kill switch / rollout
  const ks = asObj(policy["kill_switch"]);
  const rollout = asObj(policy["rollout"]);
  if (rollout["mode"] === "contain" && !truthy(ks["enabled"])) {
    errors.push("rollout.mode: contain requires kill_switch.enabled = true");
  }
  const ksScopes = new Set<unknown>(Array.isArray(ks["scopes"]) ? ks["scopes"] : []);
  const engaged = ks["engaged_targets"];
  (Array.isArray(engaged) ? engaged : []).forEach((t, i) => {
    if (isPlainObject(t) && !ksScopes.has(t["scope"])) {
      errors.push(
        `kill_switch.engaged_targets[${i}].scope: ${pyRepr(t["scope"])} not in kill_switch.scopes`,
      );
    }
  });

  // Approval / status
  const status = policy["status"];
  const appr = asObj(policy["approval"]);
  const approvedBy = Array.isArray(appr["approved_by"]) ? (appr["approved_by"] as unknown[]) : [];
  if (status === "draft" && approvedBy.length) {
    errors.push(
      "approval.approved_by: a draft policy must not carry approvals (approvals bind to a reviewed version)",
    );
  }
  if (status === "approved" || status === "active") {
    if (!approvedBy.length) {
      errors.push(`approval.approved_by: status ${status} requires recorded human approval`);
    }
    if (!truthy(appr["approved_at"])) {
      errors.push(`approval.approved_at: status ${status} requires an approval timestamp`);
    }
    const roles = new Set(approvedBy.filter(isPlainObject).map((a) => a["role"]));
    const required = Array.isArray(appr["required_approver_roles"])
      ? (appr["required_approver_roles"] as unknown[])
      : [];
    const missing = required.filter((r) => !roles.has(r));
    if (missing.length) {
      errors.push(`approval: missing approval from required role(s) ${pyRepr(missing)}`);
    }
    const names = new Set(approvedBy.filter(isPlainObject).map((a) => a["name"]));
    const minApprovers = appr["min_approvers"];
    if (
      typeof minApprovers === "number" &&
      Number.isInteger(minApprovers) &&
      names.size < minApprovers
    ) {
      errors.push(
        `approval: ${names.size} distinct approver(s) recorded, min_approvers is ${minApprovers}`,
      );
    }
    if (truthy(appr["separation_of_duties"]) && Array.isArray(history)) {
      const authors = new Set(
        history
          .filter(
            (h): h is Record<string, unknown> =>
              isPlainObject(h) &&
              h["version"] === version &&
              ["created", "modified", "rollback"].includes(String(h["change_type"])),
          )
          .map((h) => h["author"]),
      );
      const clash = [...names].filter((n) => authors.has(n));
      if (clash.length) {
        errors.push(
          `approval: separation of duties violated — ${pyRepr(clash.map(String).sort())} authored and approved this version`,
        );
      }
    }
  }
  const envsRaw = asObj(policy["applies_to"])["environment"];
  const envs = Array.isArray(envsRaw) ? envsRaw : [];
  const logging = asObj(policy["logging"]);
  if (
    status === "active" &&
    (envs.includes("production") || envs.includes("*")) &&
    logging["immutable_audit"] !== true
  ) {
    errors.push("logging.immutable_audit: must be true for an active production policy (SE-08)");
  }
}

/** Validate a policy document. Returns a list of errors (empty == valid). */
export function validatePolicy(policy: unknown): string[] {
  if (!isPlainObject(policy)) {
    return [`policy: expected a mapping/object, got ${pyTypeName(policy)}`];
  }
  const errors: string[] = [];
  check(policy, POLICY_SCHEMA, "", errors);
  try {
    semantic(policy, errors);
  } catch (exc) {
    errors.push(`semantic validation aborted: ${(exc as Error).name}: ${(exc as Error).message}`);
  }
  return errors;
}

export function isValidPolicy(policy: unknown): boolean {
  return validatePolicy(policy).length === 0;
}

/** Non-blocking governance warnings for reviewers. */
export function lintPolicy(policy: unknown): string[] {
  if (validatePolicy(policy).length || !isPlainObject(policy)) {
    return ["policy is invalid; fix validation errors first"];
  }
  const warnings: string[] = [];
  const tools = asObj(policy["tools"]);
  for (const r of (tools["rules"] as Array<Record<string, unknown>>) ?? []) {
    const id = String(r["id"]);
    const op = String(r["operation"]);
    if (
      HIGH_IMPACT_OPERATIONS.has(op) &&
      r["action"] === "ALLOW" &&
      !truthy(r["require_approval_if"])
    ) {
      warnings.push(
        `rule ${id}: high-impact '${op}' allowed without approval conditions — ` +
          "confirm parameter constraints are sufficient (IS-13)",
      );
    }
    if (op !== "read" && !truthy(r["parameters"])) {
      warnings.push(`rule ${id}: no parameter validation declared for a ${op} tool (IS-11)`);
    }
    if (truthy(r["additional_parameters"])) {
      warnings.push(`rule ${id}: undeclared parameters are accepted`);
    }
  }
  const content = asObj(policy["content"]);
  if (!truthy(asObj(content["prompt_injection"])["enabled"])) {
    warnings.push("prompt-injection detection disabled (IS-12, IS-14)");
  }
  if (!truthy(asObj(content["pii_redaction"])["enabled"]))
    warnings.push("PII redaction disabled (IS-04)");
  if (!truthy(asObj(policy["identity"])["required"])) {
    warnings.push("identity not required: requests can be anonymous");
  }
  if (!truthy(asObj(policy["kill_switch"])["enabled"]))
    warnings.push("kill switch disabled (IS-15)");
  if (!truthy(asObj(policy["logging"])["immutable_audit"])) {
    warnings.push("immutable audit logging disabled (SE-08)");
  }
  const envs = asObj(policy["applies_to"])["environment"] as unknown[];
  const mode = asObj(policy["rollout"])["mode"];
  const history = policy["change_history"] as Array<Record<string, unknown>>;
  if (
    envs.includes("production") &&
    (mode === "enforce" || mode === "contain") &&
    history[history.length - 1]?.["version"] === policy["version"] &&
    asObj(policy["rollback"])["previous_version"] === null
  ) {
    warnings.push(
      "first production version goes straight to enforcement; consider observe → warn → protect first",
    );
  }
  return warnings;
}
