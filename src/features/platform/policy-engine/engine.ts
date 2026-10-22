/**
 * AEGIS policy decision engine — browser port of
 * platform/app/policy-engine/aegis_policy/engine.py.
 *
 * "AI proposes. AEGIS evaluates. Approved actions execute."
 *
 * `new PolicyEngine(policy).evaluate(request)` evaluates a prompt, model response, tool call or
 * tool output against one runtime policy. Evaluation order:
 *
 *  1. request shape (malformed => DENY)
 *  2. kill switch (policy-level, targeted, runtime-engaged, or rollout mode `contain`)
 *  3. scope (`applies_to`) — out-of-scope requests are default-denied
 *  4. identity (required claims, issuer, roles, tenant binding)
 *  5. payload size (oversize => DENY, content not scanned or logged)
 *  6. content detectors (prompt injection, jailbreak, PII)
 *  7. tool rules (deny-list, default-deny, roles, scopes, parameters, approval conditions)
 *  8. limits (requests/min, tool calls/session, tokens/day, cost/month)
 *  9. transforms (responses)
 * 10. verdicts combine by precedence into the would-be decision; a valid single-use human
 *     approval bound to the exact action converts REQUIRE_HUMAN_APPROVAL to ALLOW
 * 11. the rollout mode maps would-be => effective decision
 * 12. every evaluation is appended to the hash-chained AuditLog with redacted content only
 *
 * State (rate windows, usage, approvals, runtime kill switches) is in memory only.
 */
import {
  cpLen,
  cpSlice,
  deepClone,
  isPlainObject,
  pyRepr,
  pyRound,
  pyStr,
  pyTruthy,
} from "../../site/engines/shield/py";
import { validatePolicy } from "../../site/engines/shield/schema";
import { AuditLog, canonicalJson, newId, sha256Hex, type AuditRecord } from "../audit";
import * as detectors from "./detectors";
import { conditionMet, domainAllowed, validateParams, type ApprovalCondition } from "./params";
import { fnmatchcase, pyRegex, pyRstrip, pyUtcDate, pyUtcIsoFromEpoch } from "./pyre";

// ------------------------------------------------------------------ constants

export const ALLOW = "ALLOW";
export const DENY = "DENY";
export const REDACT = "REDACT";
export const TRANSFORM = "TRANSFORM";
export const REQUIRE_HUMAN_APPROVAL = "REQUIRE_HUMAN_APPROVAL";
export const ESCALATE = "ESCALATE";
export const RATE_LIMIT = "RATE_LIMIT";

export type DecisionName =
  | "ALLOW"
  | "DENY"
  | "REDACT"
  | "TRANSFORM"
  | "REQUIRE_HUMAN_APPROVAL"
  | "ESCALATE"
  | "RATE_LIMIT";

/** Precedence used to combine verdicts (higher wins). */
export const DECISION_PRECEDENCE: Readonly<Record<string, number>> = {
  DENY: 100,
  ESCALATE: 80,
  RATE_LIMIT: 70,
  REQUIRE_HUMAN_APPROVAL: 60,
  REDACT: 40,
  TRANSFORM: 30,
  ALLOW: 0,
};
export const BLOCKING_DECISIONS: ReadonlySet<string> = new Set([
  DENY,
  ESCALATE,
  RATE_LIMIT,
  REQUIRE_HUMAN_APPROVAL,
]);
export const MODIFYING_DECISIONS: ReadonlySet<string> = new Set([REDACT, TRANSFORM]);
export const PERMITTING_DECISIONS: ReadonlySet<string> = new Set([ALLOW, REDACT, TRANSFORM]);

export const OBSERVE = "observe";
export const WARN = "warn";
export const PROTECT = "protect";
export const ENFORCE = "enforce";
export const CONTAIN = "contain";
export type RolloutMode = "observe" | "warn" | "protect" | "enforce" | "contain";

export const ROLLOUT_MODE_DESCRIPTIONS: Readonly<Record<RolloutMode, string>> = {
  observe: "Log the would-be decision; always ALLOW with the payload untouched.",
  warn: "ALLOW with the payload untouched; warning flag when the would-be decision is not ALLOW.",
  protect: "Apply REDACT / TRANSFORM to the payload, but never block.",
  enforce: "Full decisions.",
  contain: "Kill switch active for the whole policy scope: DENY everything.",
};

export const STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  draft: ["in_review", "retired"],
  in_review: ["draft", "approved", "retired"],
  approved: ["active", "draft", "retired"],
  active: ["retired"],
  retired: [],
};

export const REQUEST_TYPES = ["prompt", "response", "tool_call", "tool_output"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];
export const KILL_SWITCH_SCOPES = ["agent", "tool", "model", "tenant"] as const;
/** Controls cited by every evaluation (versioned runtime policy + immutable decision log). */
export const BASE_CITATIONS = ["IS-12", "SE-08"] as const;

export const LOG_CONTENT_MAX_CHARS = 4000;
const DEFAULT_PII_SURFACES = ["prompt", "response", "tool_output"];
const DEFAULT_INJECTION_SURFACES = ["prompt", "tool_output"];
const DEFAULT_JAILBREAK_SURFACES = ["prompt"];
const SURFACE: Record<RequestType, string> = {
  prompt: "prompt",
  response: "response",
  tool_output: "tool_output",
  tool_call: "tool_params",
};

// ------------------------------------------------------------------ types

/** A policy document (aegis.policy/v1); validated by the shield schema port. */
export type Policy = Record<string, unknown>;
type Dict = Record<string, unknown>;

export class PolicyValidationError extends Error {
  readonly errors: string[];
  constructor(errors: string[]) {
    super("invalid policy: " + errors.slice(0, 10).join("; "));
    this.name = "PolicyValidationError";
    this.errors = errors;
  }
}

/** Python PermissionError equivalent (role / separation-of-duties refusals). */
export class PolicyPermissionError extends Error {
  override name = "PermissionError";
}

/** Python KeyError equivalent (unknown or expired approval request). */
export class PolicyKeyError extends Error {
  override name = "KeyError";
}

export interface Verdict {
  decision: string;
  rule_id: string;
  reason: string;
  citations: readonly string[];
}

const verdict = (
  decision: string,
  rule_id: string,
  reason: string,
  citations: readonly string[] = [],
): Verdict => ({ decision, rule_id, reason, citations });

export interface Decision {
  /** Effective decision under the rollout mode. */
  decision: string;
  /** Decision the policy would take under full enforcement. */
  would_be_decision: string;
  mode: string;
  reasons: string[];
  matched_rules: string[];
  citations: string[];
  /** What the caller may forward (null when blocked). */
  payload: unknown;
  /** Payload after policy redaction/transforms (always computed; null when oversize). */
  redacted_payload: unknown;
  warning: boolean;
  kill_switch: boolean;
  findings: Record<string, unknown>;
  policy_id: string;
  policy_version: string;
  policy_status: string;
  /** True when the policy is not 'active' (draft/in_review/approved). */
  simulation: boolean;
  approval_request_id: string | null;
  shadow: { evaluate_as: string; decision: string; warning: boolean } | null;
  trace_id: string;
  audit_id: string;
  latency_ms: number;
  /** True when the caller may proceed (using `payload`). */
  allowed: boolean;
}

/** Decision.enforced: the effective decision equals the would-be decision. */
export function isEnforced(d: Decision): boolean {
  return d.decision === d.would_be_decision;
}

export interface EngineRequest {
  type?: unknown;
  content?: unknown;
  tool?: unknown;
  params?: unknown;
  identity?: unknown;
  context?: unknown;
  session?: unknown;
  usage?: unknown;
  approval_id?: unknown;
  trace_id?: unknown;
  requested_scopes?: unknown;
  [key: string]: unknown;
}

export interface CoercedRequest {
  type: RequestType | null;
  content: unknown;
  tool: unknown;
  params: unknown;
  trace_id: string | null;
  identity: Dict;
  context: Record<string, string>;
  session: { id: string | null; tool_calls: number };
  usage: { tokens: number | null; cost_usd: number | null };
  approval_id: string | null;
  requested_scopes: string[];
}

export interface Actor {
  name: string;
  role: string;
  sub?: string;
}

export interface KillSwitchEntry {
  scope: string;
  target: string;
  reason: string;
  engaged_by: string;
  role: string;
  engaged_at: string;
}

export interface PendingApproval {
  tool: string | null;
  request_type: string | null;
  approval_roles: string[];
  requester: unknown;
  trace_id: string;
  created_at: number;
  reasons: string[];
}

export interface ApprovalRecord {
  approver: string;
  role: string;
  note: string;
  approved_at: number;
  tool: string | null;
  trace_id: string;
}

export interface PolicyEngineOptions {
  /** Defaults to a fresh in-memory AuditLog. */
  auditLog?: AuditLog;
  /** Time source in seconds since the epoch (deterministic tests). */
  clock?: () => number;
  /** Merged under each request's `context` (agent_name, environment, ...). */
  defaultContext?: Record<string, unknown>;
  validate?: boolean;
  /** Lifetime of a granted, unused human approval. */
  approvalTtlSeconds?: number;
  /** Id factory (aegis_common.ids.new_id); injectable for deterministic tests. */
  newId?: (prefix: string) => string;
  /** High-resolution timer in seconds (time.perf_counter); used for latency_ms. */
  perfCounter?: () => number;
}

// ------------------------------------------------------------------ audit log with injectable ids

/**
 * AuditLog whose record ids / timestamps can be injected. Records are hashed exactly like
 * `AuditLog.append`, so `verify()` and `verifyChain()` work unchanged.
 */
export class EngineAuditLog extends AuditLog {
  private readonly idFactory: (prefix: string) => string;
  private readonly tsFactory: () => string;

  constructor(
    opts: { newId?: (prefix: string) => string; ts?: () => string; records?: AuditRecord[] } = {},
  ) {
    super(opts.records ?? []);
    this.idFactory = opts.newId ?? newId;
    this.tsFactory = opts.ts ?? (() => new Date().toISOString());
  }

  override append(
    action: string,
    actor: string,
    details: Record<string, unknown> = {},
    opts: { traceId?: string; resource?: string | null; outcome?: string; ts?: string } = {},
  ): AuditRecord {
    const id = this.idFactory("aud");
    const body: Omit<AuditRecord, "hash"> = {
      id,
      ts: opts.ts ?? this.tsFactory(),
      trace_id: opts.traceId ?? this.idFactory("trc"),
      actor,
      action,
      resource: opts.resource ?? null,
      outcome: opts.outcome ?? "success",
      details,
      prev_hash: this.lastHash,
    };
    const rec: AuditRecord = { ...body, hash: sha256Hex(canonicalJson(body)) };
    this.records.push(rec);
    return rec;
  }
}

// ------------------------------------------------------------------ helpers

const TRACE_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
/** Markdown links/images and bare URLs in responses (markdown-image exfiltration defence). */
const URL_RE = pyRegex("(!?\\[[^\\]]*\\]\\()?(https?://[^\\s)\\]>\\\"']+)(\\))?", "ig")!;

function cleanStr(v: unknown, maxLen = 256): string | null {
  return typeof v === "string" && v ? cpSlice(v, maxLen) : null;
}

function cleanNum(v: unknown): number | null {
  if (typeof v !== "number" || Number.isNaN(v) || v < 0 || v === Infinity) return null;
  return v;
}

const EMPTY_SESSION = { id: null, tool_calls: 0 };

/**
 * Normalize an untrusted request into well-typed fields. Returns [request, shapeProblem].
 * Unknown/ill-typed optional fields are dropped; an ill-typed *required* field produces a shape
 * problem so the engine fails closed (DENY) instead of throwing.
 */
export function coerceRequest(raw: unknown): [CoercedRequest, string | null] {
  if (!isPlainObject(raw)) return [coerceRequest({})[0], "request must be an object"];
  let problem: string | null = null;
  let rtype: RequestType | null = null;
  const t = raw["type"];
  if (typeof t === "string" && (REQUEST_TYPES as readonly string[]).includes(t)) {
    rtype = t as RequestType;
  } else {
    problem = "request type must be one of " + REQUEST_TYPES.join(", ");
  }
  const tid = raw["trace_id"];
  const identity: Dict = {};
  const ident = raw["identity"];
  if (isPlainObject(ident)) {
    for (const [k, v] of Object.entries(ident)) {
      if (k === "roles" || k === "groups" || k === "scopes") {
        identity[k] = Array.isArray(v)
          ? v.filter((x): x is string => typeof x === "string")
          : typeof v === "string" && v
            ? [v]
            : [];
      } else if (typeof v === "string") identity[k] = cpSlice(v, 512);
      else if (typeof v === "number" || typeof v === "boolean") identity[k] = v;
    }
  }
  const ctx = raw["context"];
  const context: Record<string, string> = {};
  if (isPlainObject(ctx)) {
    for (const [k, v] of Object.entries(ctx)) if (typeof v === "string") context[k] = v;
  }
  const sess = isPlainObject(raw["session"]) ? raw["session"] : {};
  const tc = sess["tool_calls"];
  const usage = isPlainObject(raw["usage"]) ? raw["usage"] : {};
  let requested: string[] = [];
  const scopes = raw["requested_scopes"];
  if (scopes === null || scopes === undefined) requested = [];
  else if (Array.isArray(scopes) && scopes.every((x) => typeof x === "string")) {
    requested = scopes as string[];
  } else {
    problem = problem ?? "requested_scopes must be a list of strings";
  }
  return [
    {
      type: rtype,
      content: raw["content"],
      tool: raw["tool"],
      params: raw["params"],
      trace_id: typeof tid === "string" && TRACE_RE.test(tid) ? tid : null,
      identity,
      context,
      session: {
        id: cleanStr(sess["id"]),
        tool_calls: typeof tc === "number" && Number.isInteger(tc) && tc > 0 ? tc : 0,
      },
      usage: { tokens: cleanNum(usage["tokens"]), cost_usd: cleanNum(usage["cost_usd"]) },
      approval_id: cleanStr(raw["approval_id"], 64),
      requested_scopes: requested,
    },
    problem,
  ];
}

function matchAny(value: unknown, patterns: readonly unknown[]): boolean {
  if (patterns.includes("*")) return true;
  if (value === null || value === undefined) return false;
  return patterns.some((p) => fnmatchcase(pyStr(value), pyStr(p)));
}

/** Map a would-be decision to the effective decision for a rollout mode -> [decision, warning]. */
export function applyMode(
  mode: string,
  wouldBe: string,
  hasRedaction: boolean,
  hasTransform: boolean,
): [string, boolean] {
  if (mode === CONTAIN) return [DENY, false];
  if (mode === OBSERVE) return [ALLOW, false];
  if (mode === WARN) return [ALLOW, wouldBe !== ALLOW];
  if (mode === PROTECT) {
    const eff = hasRedaction ? REDACT : hasTransform ? TRANSFORM : ALLOW;
    return [eff, BLOCKING_DECISIONS.has(wouldBe)];
  }
  if (mode === ENFORCE) return [wouldBe, false];
  throw new Error(`unknown rollout mode '${mode}'`);
}

function* iterStrings(value: unknown, depth = 0): Generator<string> {
  if (depth > 20) return;
  if (typeof value === "string") yield value;
  else if (isPlainObject(value)) {
    for (const v of Object.values(value)) yield* iterStrings(v, depth + 1);
  } else if (Array.isArray(value)) {
    for (const v of value) yield* iterStrings(v, depth + 1);
  }
}

function cloneValue<T>(v: T): T {
  if (v === null || v === undefined || typeof v !== "object") return v;
  return typeof structuredClone === "function" ? structuredClone(v) : deepClone(v);
}

/**
 * len(json.dumps(v, sort_keys=True, separators=(",", ":"), ensure_ascii=False)) — Python writes
 * NaN / Infinity / -Infinity for non-finite floats, which matters for size accounting.
 */
function pyCanonicalLength(v: unknown): number {
  return cpLen(pyCanonical(v));
}

function pyCanonical(v: unknown): string {
  if (typeof v === "number" && !Number.isFinite(v)) {
    return Number.isNaN(v) ? "NaN" : v > 0 ? "Infinity" : "-Infinity";
  }
  if (Array.isArray(v)) return `[${v.map(pyCanonical).join(",")}]`;
  if (isPlainObject(v)) {
    const keys = Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort();
    return `{${keys.map((k) => `${canonicalJson(k)}:${pyCanonical(v[k])}`).join(",")}}`;
  }
  return canonicalJson(v);
}

function combine(verdicts: readonly Verdict[]): string {
  let best = ALLOW;
  let bestP = -1;
  for (const v of verdicts) {
    const p = DECISION_PRECEDENCE[v.decision] ?? 0;
    if (p > bestP) {
      best = v.decision;
      bestP = p;
    }
  }
  return best;
}

function countsReason(counts: Record<string, number>): string {
  return Object.keys(counts)
    .sort()
    .map((k) => `${k}×${counts[k]}`)
    .join(", ");
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => pyStr(x)) : [];
}

function d(v: unknown): Dict {
  return isPlainObject(v) ? v : {};
}

function nonEmptyList(v: unknown): unknown[] | null {
  return Array.isArray(v) && v.length ? v : null;
}

// ------------------------------------------------------------------ engine

/** Evaluate requests against one AEGIS runtime policy. */
export class PolicyEngine {
  readonly policy: Policy;
  readonly audit: AuditLog;
  readonly clock: () => number;
  readonly defaultContext: Record<string, unknown>;
  readonly approvalTtlSeconds: number;
  private readonly newId: (prefix: string) => string;
  private readonly perfCounter: () => number;
  private readonly reqTimes = new Map<string, number[]>();
  private readonly sessionToolCalls = new Map<string, number>();
  private readonly sessionToolCallsByTool = new Map<string, number>();
  private readonly tokens = new Map<string, number>();
  private readonly cost = new Map<string, number>();
  private runtimeKills: KillSwitchEntry[] = [];
  private readonly pending = new Map<string, PendingApproval>();
  private readonly approved = new Map<string, ApprovalRecord>();
  private readonly rulesByTool = new Map<string, Dict>();

  constructor(policy: Policy, opts: PolicyEngineOptions = {}) {
    if (opts.validate ?? true) {
      const errors = validatePolicy(policy);
      if (errors.length) throw new PolicyValidationError(errors);
    }
    this.policy = deepClone(policy);
    this.newId = opts.newId ?? newId;
    this.audit = opts.auditLog ?? new EngineAuditLog({ newId: this.newId });
    this.clock = opts.clock ?? (() => Date.now() / 1000);
    this.defaultContext = { ...(opts.defaultContext ?? {}) };
    this.approvalTtlSeconds = opts.approvalTtlSeconds ?? 3600;
    this.perfCounter =
      opts.perfCounter ??
      (() => (typeof performance !== "undefined" ? performance.now() / 1000 : Date.now() / 1000));
    for (const r of (d(this.policy["tools"])["rules"] as Dict[] | undefined) ?? []) {
      this.rulesByTool.set(String(r["tool"]), r);
    }
  }

  private get p(): Dict {
    return this.policy;
  }

  get policyRef(): string {
    return `${pyStr(this.p["policy_id"])}@${pyStr(this.p["version"])}`;
  }

  private nowIso(): string {
    return pyUtcIsoFromEpoch(this.clock());
  }

  private scopeKey(ctx: Dict, identity: Dict): unknown[] {
    return [ctx["tenant"] || identity["tenant_id"] || "-", ctx["agent_name"] || "-"];
  }

  // ------------------------------------------------------------ kill switch
  /** Engage a runtime kill switch. `actor` = {name, role}; role must be authorized. */
  engageKillSwitch(scope: string, target: string, actor: Actor, reason: string): KillSwitchEntry {
    const ks = d(this.p["kill_switch"]);
    if (!(KILL_SWITCH_SCOPES as readonly string[]).includes(scope)) {
      throw new Error(`unknown kill-switch scope '${scope}'`);
    }
    if (!strList(ks["authorized_roles"]).includes(actor?.role)) {
      this.audit.append(
        "policy.kill_switch.engage",
        actor?.name ?? "unknown",
        { scope, target, policy: this.policyRef },
        { resource: `policy:${this.policyRef}`, outcome: "denied" },
      );
      throw new PolicyPermissionError("actor role is not authorized to engage the kill switch");
    }
    const entry: KillSwitchEntry = {
      scope,
      target,
      reason,
      engaged_by: actor.name,
      role: actor.role,
      engaged_at: this.nowIso(),
    };
    this.runtimeKills.push(entry);
    this.audit.append(
      "policy.kill_switch.engage",
      actor.name,
      { ...entry, policy: this.policyRef },
      { resource: `policy:${this.policyRef}` },
    );
    return entry;
  }

  releaseKillSwitch(scope: string, target: string, actor: Actor, reason: string): number {
    const ks = d(this.p["kill_switch"]);
    if (!strList(ks["authorized_roles"]).includes(actor?.role)) {
      throw new PolicyPermissionError("actor role is not authorized to release the kill switch");
    }
    const before = this.runtimeKills.length;
    this.runtimeKills = this.runtimeKills.filter((k) => !(k.scope === scope && k.target === target));
    const released = before - this.runtimeKills.length;
    this.audit.append(
      "policy.kill_switch.release",
      actor.name,
      { scope, target, reason, released, policy: this.policyRef },
      { resource: `policy:${this.policyRef}` },
    );
    return released;
  }

  /** Runtime-engaged kill switches (copies). */
  runtimeKillSwitches(): KillSwitchEntry[] {
    return this.runtimeKills.map((k) => ({ ...k }));
  }

  private killSwitchMatch(ctx: Dict, identity: Dict, tool: string | null): string | null {
    const ks = d(this.p["kill_switch"]);
    if (ks["engaged"]) return "kill switch engaged for the entire policy scope";
    const values: Dict = {
      agent: ctx["agent_name"],
      tool,
      model: ctx["model"],
      tenant: ctx["tenant"] || identity["tenant_id"],
    };
    const targets: Dict[] = [
      ...((ks["engaged_targets"] as Dict[] | null | undefined) ?? []),
      ...(this.runtimeKills as unknown as Dict[]),
    ];
    for (const t of targets) {
      const v = values[String(t["scope"])];
      const target = pyStr(t["target"]);
      if (target === "*" || (v !== null && v !== undefined && fnmatchcase(pyStr(v), target))) {
        if (t["scope"] === "tool" && tool === null && target !== "*") continue;
        return `kill switch engaged for ${pyStr(t["scope"])} '${target}'`;
      }
    }
    return null;
  }

  // --------------------------------------------------------------- approvals
  private approvalKey(request: CoercedRequest, identity: Dict): string {
    const content = request.content;
    const material = {
      policy: this.policyRef,
      type: request.type,
      tool: request.tool ?? null,
      params: request.params ?? null,
      content_sha256: sha256Hex(pyTruthy(content) ? pyStr(content) : ""),
      sub: identity["sub"] ?? null,
      session: request.session.id,
    };
    return "apr_" + sha256Hex(canonicalJson(material)).slice(0, 24);
  }

  pendingApprovals(): Array<PendingApproval & { approval_request_id: string }> {
    return [...this.pending].map(([k, v]) => ({ ...v, approval_request_id: k }));
  }

  /**
   * Record a human approval for one exact pending action (single use). The role must be in
   * the rule's approval roles and the approver must not be the requesting identity.
   */
  approve(approvalRequestId: string, approver: Actor, note = ""): ApprovalRecord {
    const pending = this.pending.get(approvalRequestId);
    if (!pending) throw new PolicyKeyError("unknown or expired approval request");
    const name = approver?.name;
    const role = approver?.role;
    let problem: string | null = null;
    if (!name || !role) problem = "approver name and role are required";
    else if (pending.approval_roles.length && !pending.approval_roles.includes(role)) {
      problem = `role '${role}' is not an authorized approver for this action`;
    } else if (
      pending.requester &&
      (pending.requester === name || pending.requester === (approver.sub ?? null))
    ) {
      problem = "self-approval is not permitted (separation of duties)";
    }
    if (problem) {
      this.audit.append(
        "policy.approval.grant",
        name || "unknown",
        { approval_request_id: approvalRequestId, policy: this.policyRef, error: problem },
        { resource: `policy:${this.policyRef}`, outcome: "denied", traceId: pending.trace_id },
      );
      throw new PolicyPermissionError(problem);
    }
    const record: ApprovalRecord = {
      approver: name,
      role,
      note,
      approved_at: this.clock(),
      tool: pending.tool,
      trace_id: pending.trace_id,
    };
    this.pending.delete(approvalRequestId);
    this.approved.set(approvalRequestId, record);
    this.audit.append(
      "policy.approval.grant",
      name,
      {
        approval_request_id: approvalRequestId,
        role,
        note,
        tool: pending.tool,
        policy: this.policyRef,
      },
      { resource: `policy:${this.policyRef}`, traceId: pending.trace_id },
    );
    return record;
  }

  reject(approvalRequestId: string, approver: Partial<Actor>, reason: string): void {
    const pending = this.pending.get(approvalRequestId);
    if (!pending) throw new PolicyKeyError("unknown or expired approval request");
    this.pending.delete(approvalRequestId);
    this.audit.append(
      "policy.approval.reject",
      approver?.name ?? "unknown",
      {
        approval_request_id: approvalRequestId,
        role: approver?.role ?? null,
        reason,
        policy: this.policyRef,
      },
      { resource: `policy:${this.policyRef}`, traceId: pending.trace_id },
    );
  }

  private consumeApproval(key: string, approvalId: string | null): ApprovalRecord | null {
    if (!approvalId || approvalId !== key) return null;
    const rec = this.approved.get(key);
    if (!rec) return null;
    this.approved.delete(key);
    if (this.clock() - rec.approved_at > this.approvalTtlSeconds) return null;
    return rec;
  }

  // ------------------------------------------------------------------ checks
  private checkScope(ctx: Dict): Verdict | null {
    for (const [key, patterns] of Object.entries(d(this.p["applies_to"]))) {
      if (!matchAny(ctx[key], Array.isArray(patterns) ? patterns : [])) {
        return verdict(
          DENY,
          "scope.not_applicable",
          `request context '${key}' is outside this policy's applies_to; default-deny`,
          ["IS-12"],
        );
      }
    }
    return null;
  }

  private checkIdentity(identity: Dict, ctx: Dict): Verdict[] {
    const cfg = d(this.p["identity"]);
    const out: Verdict[] = [];
    if (!cfg["required"]) return out;
    if (!Object.keys(identity).length || identity["authenticated"] === false) {
      return [
        verdict(DENY, "identity.unauthenticated", "authenticated identity required", ["IS-11"]),
      ];
    }
    for (const claim of strList(cfg["required_claims"])) {
      const v = identity[claim];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) {
        out.push(
          verdict(
            DENY,
            "identity.missing_claim",
            `required identity claim '${claim}' missing`,
            ["IS-11"],
          ),
        );
      }
    }
    const issuers = strList(cfg["allowed_issuers"]);
    if (issuers.length && !issuers.includes(identity["iss"] as string)) {
      out.push(
        verdict(DENY, "identity.issuer", "identity issuer is not trusted by this policy", [
          "IS-11",
        ]),
      );
    }
    const roles = strList(cfg["allowed_roles"]);
    const have = (identity["roles"] as string[] | undefined) ?? [];
    if (roles.length && !have.some((r) => roles.includes(r))) {
      out.push(
        verdict(DENY, "identity.role", "identity has no role permitted by this policy", ["IS-11"]),
      );
    }
    if (
      cfg["tenant_binding"] &&
      ctx["tenant"] &&
      identity["tenant_id"] &&
      ctx["tenant"] !== identity["tenant_id"]
    ) {
      out.push(
        verdict(
          DENY,
          "identity.tenant_mismatch",
          "identity tenant does not match request tenant (cross-tenant access)",
          ["IS-11"],
        ),
      );
    }
    return out;
  }

  private surfaceEnabled(cfg: Dict, surface: string, defaults: string[]): boolean {
    return (
      Boolean(cfg["enabled"]) &&
      ((nonEmptyList(cfg["apply_to"]) as string[] | null) ?? defaults).includes(surface)
    );
  }

  /** Run detectors on text; returns [redactedText, redactionApplied]. */
  private checkContent(
    text: string,
    surface: string,
    verdicts: Verdict[],
    findings: Dict,
  ): [string, boolean] {
    const content = d(this.p["content"]);
    const inj = d(content["prompt_injection"]);
    if (this.surfaceEnabled(inj, surface, DEFAULT_INJECTION_SURFACES)) {
      const hits = detectors.scanInjection(text, (inj["decode_obfuscation"] ?? true) !== false);
      if (hits.length) {
        findings["prompt_injection"] = hits;
        verdicts.push(
          verdict(
            String(inj["action"]),
            `content.prompt_injection.${surface}`,
            `prompt-injection signals detected in ${surface}: ${hits.join(", ")}`,
            ["IS-12", "IS-14"],
          ),
        );
      }
    }
    const jb = d(content["jailbreak"]);
    if (this.surfaceEnabled(jb, surface, DEFAULT_JAILBREAK_SURFACES)) {
      const hits = detectors.scanJailbreak(text, (jb["decode_obfuscation"] ?? true) !== false);
      if (hits.length) {
        findings["jailbreak"] = hits;
        verdicts.push(
          verdict(
            String(jb["action"]),
            `content.jailbreak.${surface}`,
            `jailbreak signals detected in ${surface}: ${hits.join(", ")}`,
            ["IS-12", "IS-14"],
          ),
        );
      }
    }
    const pii = d(content["pii_redaction"]);
    if (this.surfaceEnabled(pii, surface, DEFAULT_PII_SURFACES)) {
      const r = detectors.redactText(text, strList(pii["entities"]));
      if (r.findings.length) {
        const counts = detectors.entityCounts(r);
        findings["pii"] = counts;
        verdicts.push(
          verdict(
            String(pii["action"]),
            `content.pii.${surface}`,
            `sensitive data detected in ${surface}: ` + countsReason(counts),
            ["IS-04"],
          ),
        );
        return [r.text, true];
      }
    }
    return [text, false];
  }

  private checkContentDetectorsOnly(
    text: string,
    surface: string,
    verdicts: Verdict[],
    findings: Dict,
  ): void {
    const content = d(this.p["content"]);
    const scans: Array<[string, (t: string, decode: boolean) => string[], string[]]> = [
      ["prompt_injection", detectors.scanInjection, DEFAULT_INJECTION_SURFACES],
      ["jailbreak", detectors.scanJailbreak, DEFAULT_JAILBREAK_SURFACES],
    ];
    for (const [key, scan, defaults] of scans) {
      const cfg = d(content[key]);
      if (this.surfaceEnabled(cfg, surface, defaults)) {
        const hits = scan(text, (cfg["decode_obfuscation"] ?? true) !== false);
        if (hits.length) {
          findings[key] = hits;
          verdicts.push(
            verdict(
              String(cfg["action"]),
              `content.${key}.${surface}`,
              `${key.replace(/_/g, "-")} signals detected in ${surface}: ${hits.join(", ")}`,
              ["IS-12", "IS-14"],
            ),
          );
        }
      }
    }
  }

  /** Tool rules. Returns [rule or null, approval roles]. */
  private checkTool(
    request: CoercedRequest,
    identity: Dict,
    verdicts: Verdict[],
    findings: Dict,
    sessionId: string | null,
  ): [Dict | null, string[]] {
    const tools = d(this.p["tools"]);
    const tool = request.tool as string;
    const params = request.params || {};
    if (strList(tools["deny_list"]).includes(tool)) {
      verdicts.push(
        verdict(DENY, "tools.deny_list", `tool '${tool}' is on the policy deny-list`, ["IS-11"]),
      );
      return [null, []];
    }
    const rule = this.rulesByTool.get(tool);
    if (!rule) {
      const def = String(tools["default_action"]);
      const esc = d(this.p["escalation"]);
      const roles = esc["contact_role"] ? [String(esc["contact_role"])] : [];
      verdicts.push(
        verdict(
          def,
          "tools.default",
          `tool '${tool}' is not declared in the policy; default action ${def} ` +
            "(default-deny for unknown tools)",
          ["IS-11", "EI-07"],
        ),
      );
      return [null, roles];
    }
    const rid = String(rule["id"]);
    const cits = (nonEmptyList(rule["citations"]) as string[] | null) ?? ["IS-11"];
    if (rule["action"] === DENY) {
      verdicts.push(verdict(DENY, rid, `tool '${tool}' is denied by rule ${rid}`, cits));
    } else if (rule["action"] === ESCALATE) {
      verdicts.push(
        verdict(ESCALATE, rid, `tool '${tool}' requires escalation by rule ${rid}`, cits),
      );
    }
    const allowedRoles = strList(rule["allowed_roles"]);
    const have = (identity["roles"] as string[] | undefined) ?? [];
    if (allowedRoles.length && !have.some((r) => allowedRoles.includes(r))) {
      verdicts.push(
        verdict(DENY, `${rid}.roles`, `identity lacks a role permitted to call '${tool}'`, cits),
      );
    }
    const reqScopes = request.requested_scopes;
    if (reqScopes.length) {
      const granted = strList(rule["scopes"]);
      const excess = [...new Set(reqScopes.filter((s) => !granted.includes(s)))].sort();
      if (excess.length) {
        verdicts.push(
          verdict(
            DENY,
            `${rid}.scopes`,
            `requested scope(s) ${pyRepr(excess)} exceed least-privilege scopes for '${tool}'`,
            ["IS-11"],
          ),
        );
      }
    }
    const problems = validateParams(
      params,
      (rule["parameters"] as Record<string, Dict> | undefined) || {},
      Boolean(rule["additional_parameters"] ?? false),
    );
    if (problems.length) findings["parameter_violations"] = problems.map(([code]) => code);
    for (const [code, msg] of problems) {
      verdicts.push(verdict(DENY, `${rid}.params.${code}`, msg, ["IS-11", "IS-12"]));
    }
    const limit = rule["max_calls_per_session"];
    if (limit && sessionId !== null) {
      const used = this.sessionToolCallsByTool.get(JSON.stringify([sessionId, tool])) ?? 0;
      if (used >= Number(limit)) {
        verdicts.push(
          verdict(
            RATE_LIMIT,
            `${rid}.max_calls_per_session`,
            `tool '${tool}' reached ${pyStr(limit)} calls this session`,
            ["IS-16"],
          ),
        );
      }
    }
    const approvalCits = [...new Set([...cits, "IS-13"])].sort();
    if (rule["action"] === REQUIRE_HUMAN_APPROVAL) {
      verdicts.push(
        verdict(
          REQUIRE_HUMAN_APPROVAL,
          rid,
          `tool '${tool}' (${pyStr(rule["operation"])}) requires human approval`,
          approvalCits,
        ),
      );
    }
    const conds = (rule["require_approval_if"] as ApprovalCondition[] | undefined) ?? [];
    conds.forEach((cond, i) => {
      const [met, reason] = conditionMet(params, cond);
      if (met) {
        verdicts.push(
          verdict(
            REQUIRE_HUMAN_APPROVAL,
            `${rid}.approval_if[${i}]`,
            `human approval required: ${reason}`,
            approvalCits,
          ),
        );
      }
    });
    if (
      rule["action"] === ALLOW &&
      !verdicts.some((v) => v.rule_id.startsWith(rid) && v.decision !== ALLOW)
    ) {
      verdicts.push(verdict(ALLOW, rid, `tool '${tool}' permitted by rule ${rid}`, cits));
    }
    return [rule, strList(rule["approval_roles"])];
  }

  private checkLimits(
    request: CoercedRequest,
    ctx: Dict,
    identity: Dict,
    sessionId: string | null,
    verdicts: Verdict[],
    findings: Dict,
    estTokens: number,
    cost: number,
  ): void {
    const lim = d(this.p["limits"]);
    const action = String(lim["action_on_breach"] ?? RATE_LIMIT);
    const alertPct = lim["alert_at_percent"] as number | undefined;
    const now = this.clock();
    const scope = this.scopeKey(ctx, identity);
    const alerts: string[] = [];
    const near = (name: string, used: number, limit: number) => {
      if (alertPct && limit && (used / limit) * 100 >= alertPct) {
        alerts.push(`${name} at ${pyRound((used / limit) * 100, 0)}% of limit`);
      }
    };
    const rpm = Number(lim["requests_per_minute"]);
    const key = JSON.stringify([...scope, identity["sub"] || "anonymous"]);
    const dq = this.reqTimes.get(key) ?? [];
    while (dq.length && now - dq[0]! >= 60) dq.shift();
    if (dq.length >= rpm) {
      verdicts.push(
        verdict(
          action,
          "limits.requests_per_minute",
          `rate limit of ${pyStr(lim["requests_per_minute"])} requests/minute exceeded`,
          ["IS-16"],
        ),
      );
    }
    dq.push(now);
    this.reqTimes.set(key, dq);
    near("requests_per_minute", dq.length, rpm);

    if (request.type === "tool_call") {
      const tcLimit = Number(lim["tool_calls_per_session"]);
      const supplied = request.session.tool_calls;
      const used = Math.max(
        sessionId ? (this.sessionToolCalls.get(sessionId) ?? 0) : 0,
        supplied,
      );
      if (used >= tcLimit) {
        verdicts.push(
          verdict(
            action,
            "limits.tool_calls_per_session",
            `session reached ${pyStr(lim["tool_calls_per_session"])} tool calls`,
            ["IS-16"],
          ),
        );
      }
      near("tool_calls_per_session", used + 1, tcLimit);
    }

    const day = pyUtcDate(now);
    const tpd = Number(lim["tokens_per_day"]);
    const usedTokens = this.tokens.get(JSON.stringify([...scope, day])) ?? 0;
    if (usedTokens + estTokens > tpd) {
      verdicts.push(
        verdict(
          action,
          "limits.tokens_per_day",
          `token budget of ${pyStr(lim["tokens_per_day"])}/day would be exceeded`,
          ["IS-16"],
        ),
      );
    }
    near("tokens_per_day", usedTokens + estTokens, tpd);

    const month = day.slice(0, 7);
    const cpm = Number(lim["cost_per_month_usd"]);
    const usedCost = this.cost.get(JSON.stringify([...scope, month])) ?? 0;
    if (cost && usedCost + cost > cpm) {
      verdicts.push(
        verdict(
          action,
          "limits.cost_per_month_usd",
          `monthly cost budget of USD ${pyStr(lim["cost_per_month_usd"])} would be exceeded`,
          ["IS-16"],
        ),
      );
    }
    near("cost_per_month_usd", usedCost + cost, cpm);
    if (alerts.length) findings["limit_alerts"] = alerts;
  }

  private recordUsage(
    request: CoercedRequest,
    ctx: Dict,
    identity: Dict,
    sessionId: string | null,
    estTokens: number,
    cost: number,
  ): void {
    const now = this.clock();
    const scope = this.scopeKey(ctx, identity);
    const day = pyUtcDate(now);
    if (request.type === "tool_call" && sessionId) {
      this.sessionToolCalls.set(sessionId, (this.sessionToolCalls.get(sessionId) ?? 0) + 1);
      const k = JSON.stringify([sessionId, request.tool ?? null]);
      this.sessionToolCallsByTool.set(k, (this.sessionToolCallsByTool.get(k) ?? 0) + 1);
    }
    const tk = JSON.stringify([...scope, day]);
    this.tokens.set(tk, (this.tokens.get(tk) ?? 0) + estTokens);
    const ck = JSON.stringify([...scope, day.slice(0, 7)]);
    this.cost.set(ck, (this.cost.get(ck) ?? 0) + cost);
  }

  private applyTransforms(input: string, verdicts: Verdict[]): [string, boolean] {
    let text = input;
    let changed = false;
    const transforms = (d(this.p["content"])["transforms"] as Dict[] | undefined) || [];
    for (const t of transforms) {
      if (!((nonEmptyList(t["apply_to"]) as string[] | null) ?? ["response"]).includes("response")) {
        continue;
      }
      const before = text;
      if (t["type"] === "strip_unapproved_urls") {
        const allow = strList(t["domain_allow_list"]);
        URL_RE.lastIndex = 0;
        text = text.replace(URL_RE, (m0: string, _g1: unknown, g2: string) =>
          domainAllowed(g2, allow) ? m0 : "[link removed by policy]",
        );
      } else if (t["type"] === "truncate" && cpLen(text) > Number(t["max_chars"])) {
        text = cpSlice(text, Number(t["max_chars"])) + " [truncated by policy]";
      } else if (t["type"] === "append_disclosure" && !text.includes(String(t["text"]))) {
        text = `${pyRstrip(text)}\n\n${String(t["text"])}`;
      }
      if (text !== before) {
        changed = true;
        verdicts.push(
          verdict(TRANSFORM, String(t["id"]), `response transformed by ${String(t["type"])}`, [
            "IS-12",
          ]),
        );
      }
    }
    return [text, changed];
  }

  // ------------------------------------------------------------- evaluation
  /**
   * Evaluate one request.
   *
   * request keys: type (prompt | response | tool_call | tool_output); content (string);
   * tool, params, requested_scopes (tool calls); identity {sub, tenant_id, roles, iss,
   * authenticated}; context {agent_name, environment, risk_tier, tenant, model};
   * session {id, tool_calls}; usage {tokens, cost_usd}; approval_id; trace_id.
   */
  evaluate(raw: unknown): Decision {
    const t0 = this.perfCounter();
    const [request, shapeProblem] = coerceRequest(raw);
    const traceId = request.trace_id ?? this.newId("trc");
    const ctx: Dict = { ...this.defaultContext, ...request.context };
    const identity = request.identity;
    if (!ctx["tenant"] && identity["tenant_id"]) ctx["tenant"] = identity["tenant_id"];
    const rtype = request.type;
    const tool = rtype === "tool_call" ? ((request.tool ?? null) as string | null) : null;
    const sessionId = request.session.id;
    const mode = String(d(this.p["rollout"])["mode"]);
    let verdicts: Verdict[] = [];
    const findings: Dict = {};
    const contentCfg = d(this.p["content"]);
    const maxChars = Number(contentCfg["max_input_chars"]);

    let original: unknown;
    if (rtype === "tool_call") {
      original = {
        tool: request.tool ?? null,
        params: request.params !== null && request.params !== undefined ? request.params : {},
      };
    } else {
      original = request.content ?? null;
    }
    let working: unknown = cloneValue(original);
    let redactionApplied = false;
    let transformApplied = false;
    let oversize = false;
    let approvalRoles: string[] = [];

    // 1. shape
    let malformed = shapeProblem;
    const originalParams = rtype === "tool_call" ? (original as Dict)["params"] : undefined;
    if (malformed) {
      // already malformed
    } else if (rtype === "tool_call" && (typeof request.tool !== "string" || !request.tool)) {
      malformed = "tool_call requires a tool name";
    } else if (rtype === "tool_call" && !isPlainObject(originalParams)) {
      malformed = "tool_call params must be an object";
    } else if (rtype !== "tool_call" && typeof original !== "string") {
      malformed = `${rtype} content must be a string`;
    }
    if (malformed) verdicts.push(verdict(DENY, "request.malformed", malformed, ["IS-12"]));

    // 2. kill switch (overrides everything, including observe mode)
    let killReason = this.killSwitchMatch(ctx, identity, tool);
    if (mode === CONTAIN && !killReason) {
      killReason = "rollout mode 'contain': kill switch active for the whole policy scope";
    }
    if (killReason) verdicts.push(verdict(DENY, "kill_switch", killReason, ["IS-15"]));

    if (!malformed && !killReason) {
      // 3-4. scope + identity
      const v = this.checkScope(ctx);
      if (v) verdicts.push(v);
      verdicts.push(...this.checkIdentity(identity, ctx));

      // 5. size
      const size = typeof original === "string" ? cpLen(original) : pyCanonicalLength(original);
      if (size > maxChars) {
        oversize = true;
        findings["oversize_chars"] = size;
        verdicts.push(
          verdict(
            DENY,
            "content.oversize",
            `payload of ${size} characters exceeds max_input_chars ${pyStr(contentCfg["max_input_chars"])}`,
            ["IS-12", "IS-16"],
          ),
        );
      } else {
        const surface = SURFACE[rtype as RequestType];
        if (rtype === "tool_call") {
          const params = originalParams as Dict;
          const textBlob = [...iterStrings(params)].join(" \n");
          const sub: Dict = {};
          this.checkContentDetectorsOnly(textBlob, surface, verdicts, sub);
          Object.assign(findings, sub);
          const [rule, roles] = this.checkTool(request, identity, verdicts, findings, sessionId);
          approvalRoles = roles;
          const pii = d(contentCfg["pii_redaction"]);
          if (this.surfaceEnabled(pii, surface, DEFAULT_PII_SURFACES)) {
            const exempt = strList((rule ?? {})["allow_pii_entities"]);
            const [red, counts] = detectors.redactStructure(
              params,
              strList(pii["entities"]),
              exempt,
            );
            if (Object.keys(counts).length) {
              findings["pii"] = counts;
              redactionApplied = true;
              working = { tool, params: red };
              verdicts.push(
                verdict(
                  String(pii["action"]),
                  "content.pii.tool_params",
                  "sensitive data detected in tool parameters: " + countsReason(counts),
                  ["IS-04"],
                ),
              );
            }
          }
        } else {
          approvalRoles = [];
          const [w, red] = this.checkContent(original as string, surface, verdicts, findings);
          working = w;
          redactionApplied = red;
          if (rtype === "response") {
            const [w2, tr] = this.applyTransforms(w, verdicts);
            working = w2;
            transformApplied = tr;
          }
        }
      }
    }

    if (malformed || killReason || oversize) approvalRoles = [];

    // 8. limits (skipped for killed / malformed requests: they never execute)
    const usage = request.usage;
    const estTokens = Math.trunc(
      usage.tokens !== null
        ? usage.tokens
        : typeof original === "string"
          ? Math.floor(cpLen(original) / 4) + 1
          : 0,
    );
    const cost = usage.cost_usd || 0;
    if (!malformed && !killReason) {
      this.checkLimits(request, ctx, identity, sessionId, verdicts, findings, estTokens, cost);
    }

    // 10. combine
    let wouldBe = combine(verdicts);
    let approvalKey: string | null = null;
    if (wouldBe === REQUIRE_HUMAN_APPROVAL) {
      approvalKey = this.approvalKey(request, identity);
      const rec = this.consumeApproval(approvalKey, request.approval_id);
      if (rec) {
        const note = `human approval granted by ${rec.approver} (${rec.role})`;
        verdicts = verdicts.map((v) =>
          v.decision === REQUIRE_HUMAN_APPROVAL
            ? verdict(ALLOW, v.rule_id, v.reason + " — approved", v.citations)
            : v,
        );
        verdicts.push(verdict(ALLOW, "approval.granted", note, ["IS-13"]));
        wouldBe = combine(verdicts);
        approvalKey = null;
      } else if (request.approval_id) {
        verdicts.push(
          verdict(
            REQUIRE_HUMAN_APPROVAL,
            "approval.invalid",
            "supplied approval does not match this exact action, was already used, or has expired",
            ["IS-13"],
          ),
        );
      }
    }

    // 11. rollout mode. Kill switch and malformed requests fail closed in every mode.
    let effective: string;
    let warning: boolean;
    if (killReason || malformed) {
      effective = DENY;
      warning = false;
      wouldBe = DENY;
    } else {
      [effective, warning] = applyMode(mode, wouldBe, redactionApplied, transformApplied);
    }
    let forward: unknown;
    if (!PERMITTING_DECISIONS.has(effective)) forward = null;
    else if (mode === OBSERVE || mode === WARN) forward = original;
    else forward = working;

    let shadow: Decision["shadow"] = null;
    const sm = d(this.p["shadow_mode"]);
    if (sm["enabled"] && !killReason && !malformed) {
      const sMode = String(sm["evaluate_as"] ?? ENFORCE);
      const [sDec, sWarn] = applyMode(sMode, wouldBe, redactionApplied, transformApplied);
      shadow = { evaluate_as: sMode, decision: sDec, warning: sWarn };
    }

    if (effective === REQUIRE_HUMAN_APPROVAL && approvalKey) {
      if (!approvalRoles.length) {
        const esc = d(this.p["escalation"]);
        approvalRoles = esc["contact_role"]
          ? [String(esc["contact_role"])]
          : strList(d(this.p["approval"])["required_approver_roles"]);
      }
      this.pending.set(approvalKey, {
        tool,
        request_type: rtype,
        approval_roles: approvalRoles,
        requester: identity["sub"] ?? null,
        trace_id: traceId,
        created_at: this.clock(),
        reasons: verdicts.filter((v) => v.decision === REQUIRE_HUMAN_APPROVAL).map((v) => v.reason),
      });
    } else {
      approvalKey = null;
    }

    if (PERMITTING_DECISIONS.has(effective) && !killReason) {
      this.recordUsage(request, ctx, identity, sessionId, estTokens, cost);
    }

    const reasons: string[] = [];
    for (const v of verdicts) if (!reasons.includes(v.reason)) reasons.push(v.reason);
    if (!killReason && !malformed && effective !== wouldBe) {
      reasons.push(
        `rollout mode '${mode}': would-be decision ${wouldBe} not enforced; effective ${effective}`,
      );
    }
    const status = pyStr(this.p["status"]);
    if (status !== "active") {
      reasons.push(
        `policy status is '${status}': evaluation is a simulation until a human ` +
          "approves and activates the policy",
      );
    }
    const matched: string[] = [];
    for (const v of verdicts) if (!matched.includes(v.rule_id)) matched.push(v.rule_id);
    const cits = new Set<string>(BASE_CITATIONS);
    for (const v of verdicts) for (const c of v.citations) cits.add(c);

    const decision: Decision = {
      decision: effective,
      would_be_decision: wouldBe,
      mode,
      reasons,
      matched_rules: matched,
      citations: [...cits].sort(),
      payload: forward,
      redacted_payload: oversize ? null : working,
      warning,
      kill_switch: Boolean(killReason),
      findings,
      policy_id: pyStr(this.p["policy_id"]),
      policy_version: pyStr(this.p["version"]),
      policy_status: status,
      simulation: status !== "active",
      approval_request_id: approvalKey,
      shadow,
      trace_id: traceId,
      audit_id: "",
      latency_ms: 0,
      allowed: PERMITTING_DECISIONS.has(effective),
    };
    decision.latency_ms = pyRound((this.perfCounter() - t0) * 1000, 3);
    const rec = this.auditDecision(decision, ctx, rtype, tool, original, oversize, identity);
    decision.audit_id = rec.id;
    return decision;
  }

  // ------------------------------------------------------------------ audit
  private logContent(value: unknown, level: string, oversize: boolean): unknown {
    if (level === "none") return null;
    const size =
      typeof value === "string"
        ? cpLen(value)
        : value !== null && value !== undefined
          ? pyCanonicalLength(value)
          : 0;
    if (level === "metadata" || oversize) {
      return { chars: size, omitted: oversize ? "oversize" : "metadata-only logging" };
    }
    // 'redacted': always mask with ALL known entities, regardless of the policy's entity list
    let [red] = detectors.redactStructure(value, null);
    if (typeof red === "string" && cpLen(red) > LOG_CONTENT_MAX_CHARS) {
      red = cpSlice(red, LOG_CONTENT_MAX_CHARS) + "…[truncated]";
    } else if (typeof red !== "string") {
      const s = canonicalJson(red);
      if (cpLen(s) > LOG_CONTENT_MAX_CHARS) red = { truncated_json: cpSlice(s, LOG_CONTENT_MAX_CHARS) };
    }
    return red ?? null;
  }

  private auditDecision(
    dec: Decision,
    ctx: Dict,
    rtype: string | null,
    tool: string | null,
    original: unknown,
    oversize: boolean,
    identity: Dict,
  ): AuditRecord {
    const lg = d(this.p["logging"]);
    const levels: Record<string, unknown> = {
      prompt: lg["prompt_logging"],
      response: lg["response_logging"],
      tool_output: lg["response_logging"],
      tool_call: lg["tool_param_logging"] ?? "redacted",
    };
    const level = String((rtype !== null ? levels[rtype] : undefined) ?? "metadata");
    const context: Dict = {};
    for (const [k, v] of Object.entries(ctx)) {
      if (["agent_name", "environment", "risk_tier", "tenant", "model"].includes(k)) context[k] = v;
    }
    const details: Dict = {
      policy_id: dec.policy_id,
      policy_version: dec.policy_version,
      policy_status: dec.policy_status,
      simulation: dec.simulation,
      mode: dec.mode,
      request_type: rtype,
      tool,
      decision: dec.decision,
      would_be_decision: dec.would_be_decision,
      warning: dec.warning,
      kill_switch: dec.kill_switch,
      reasons: dec.reasons,
      matched_rules: dec.matched_rules,
      citations: dec.citations,
      findings: dec.findings,
      shadow: dec.shadow,
      approval_request_id: dec.approval_request_id,
      latency_ms: dec.latency_ms,
      content_logging: level,
      content: this.logContent(original, level, oversize),
      context,
    };
    const sub = identity["sub"];
    const actor = detectors.redactText(sub ? pyStr(sub) : "anonymous", null).text;
    return this.audit.append("policy.evaluate", actor, deepClone(details), {
      traceId: dec.trace_id,
      resource: `policy:${this.policyRef}`,
      outcome: dec.decision,
    });
  }
}
