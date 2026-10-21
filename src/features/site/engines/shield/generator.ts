/**
 * Policy-as-code generator for the Runtime Shield Advisor — port of
 * platform/app/runtime-shield/aegis_shield/generator.py.
 *
 * `generatePolicy(profile, advice)` produces a policy that is valid per the AEGIS policy
 * schema and always: `status: draft` with no approvals recorded; `rollout.mode: observe`
 * with shadow evaluation as `enforce`; default-deny for tools with denied tools listed
 * explicitly; immutable audit logging with redacted/metadata-only content logging.
 */
import { stringify } from "yaml";
import type { Advice, ApprovalCondition, ToolEntry } from "./advisor";
import { analyze } from "./advisor";
import { SCHEMA_VERSION } from "./constants";
import { normalizeProfile, slug } from "./profile";
import type { JsonObject } from "./py";
import { validatePolicy } from "./schema";

export const GENERATOR_AUTHOR = "AEGIS Runtime Shield Advisor (automated draft)";
export const INITIAL_VERSION = "0.1.0";

export interface PolicyToolRule {
  id: string;
  tool: string;
  operation: string;
  action: string;
  description: string;
  scopes: string[];
  parameters: Record<string, JsonObject>;
  additional_parameters: boolean;
  citations: string[];
  require_approval_if?: ApprovalCondition[];
  approval_roles?: string[];
  max_calls_per_session?: number;
  allow_pii_entities?: string[];
}

export interface PolicyTransform {
  id: string;
  type: string;
  apply_to: string[];
  max_chars?: number;
  text?: string;
  domain_allow_list?: string[];
}

export interface Policy {
  schema_version: string;
  policy_id: string;
  policy_name: string;
  description: string;
  version: string;
  status: string;
  owner: string;
  applies_to: {
    agent_name: string[];
    environment: string[];
    risk_tier: string[];
    tenant: string[];
    model: string[];
  };
  rollout: { mode: string; exit_criteria: string[]; notes: string };
  identity: {
    required: boolean;
    required_claims: string[];
    allowed_roles: string[];
    tenant_binding: boolean;
  };
  tools: { default_action: string; deny_list: string[]; rules: PolicyToolRule[] };
  content: {
    max_input_chars: number;
    pii_redaction: { enabled: boolean; entities: string[]; apply_to: string[]; action: string };
    prompt_injection: {
      enabled: boolean;
      apply_to: string[];
      action: string;
      decode_obfuscation: boolean;
    };
    jailbreak: {
      enabled: boolean;
      apply_to: string[];
      action: string;
      decode_obfuscation: boolean;
    };
    transforms: PolicyTransform[];
  };
  limits: {
    requests_per_minute: number;
    tool_calls_per_session: number;
    tokens_per_day: number;
    cost_per_month_usd: number;
    action_on_breach: string;
    alert_at_percent: number;
  };
  logging: {
    immutable_audit: boolean;
    prompt_logging: string;
    response_logging: string;
    tool_param_logging: string;
    sink: string;
  };
  kill_switch: {
    enabled: boolean;
    engaged: boolean;
    scopes: string[];
    engaged_targets: JsonObject[];
    authorized_roles: string[];
    target_time_to_disable_minutes: number;
  };
  rollback: { previous_version: string | null; strategy: string; triggers: string[] };
  shadow_mode: { enabled: boolean; evaluate_as: string };
  evidence_retention_days: number;
  approval: {
    required_approver_roles: string[];
    min_approvers: number;
    separation_of_duties: boolean;
    approved_by: JsonObject[];
    approved_at: string | null;
  };
  escalation: { queue: string; contact_role: string };
  change_history: Array<{
    version: string;
    date: string;
    author: string;
    change_type: string;
    summary: string;
  }>;
  citations: string[];
  metadata: {
    generated_by: string;
    advisor_version: string;
    evidence_status: string;
    overall_risk: string;
    requires_human_approval: boolean;
    synthetic: boolean;
    denied_tools: Array<{ tool: string; reasons: string[] }>;
    notice: string;
  };
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function ruleFromEntry(m: ToolEntry): PolicyToolRule {
  const rule: PolicyToolRule = {
    id: `tool.${slug(m.tool, 80)}`,
    tool: m.tool,
    operation: m.operation,
    action: m.engine_action,
    description: m.reasons.join("; "),
    scopes: m.scopes,
    parameters: m.parameters,
    additional_parameters: !m.strict_parameters,
    citations: m.citations,
  };
  if (m.require_approval_if.length) rule.require_approval_if = m.require_approval_if;
  if (m.approval_roles.length) rule.approval_roles = m.approval_roles;
  if (m.max_calls_per_session) rule.max_calls_per_session = Math.trunc(m.max_calls_per_session);
  if (m.allow_pii_entities.length) rule.allow_pii_entities = m.allow_pii_entities;
  return rule;
}

/** Generate a draft runtime policy from a profile (and optionally precomputed advice). */
export function generatePolicy(profile: unknown, advice?: Advice, today?: string): Policy {
  const adv = advice ?? analyze(profile ?? {});
  const n = adv._normalized ?? normalizeProfile(profile ?? {});
  const risk = adv.risk_profile;
  const rating = risk.overall.rating;
  const tier = risk.user_asserted_risk_tier || risk.inferred_risk_tier;
  const dh = adv.data_handling;
  const limits = adv.limits;
  const ir = adv.incident_response;

  const rules: PolicyToolRule[] = [];
  const denyList: string[] = [];
  const seen = new Set<string>();
  for (const m of adv.tool_matrix) {
    if (seen.has(m.tool)) continue;
    seen.add(m.tool);
    if (m.decision === "denied") denyList.push(m.tool);
    else rules.push(ruleFromEntry(m));
  }

  const transforms: PolicyTransform[] = [
    {
      id: "transform.truncate_response",
      type: "truncate",
      apply_to: ["response"],
      max_chars: 16000,
    },
  ];
  const citations = new Set([
    "IS-04",
    "IS-11",
    "IS-12",
    "IS-14",
    "IS-15",
    "IS-16",
    "SE-08",
    "EI-07",
    "GL-04",
  ]);
  if (["customers", "public", "vulnerable"].includes(n.affected_parties)) {
    transforms.push({
      id: "transform.ai_disclosure",
      type: "append_disclosure",
      apply_to: ["response"],
      text: "This response was generated with AI assistance.",
    });
    citations.add("IS-08");
  }
  if (n.allowed_link_domains.length) {
    transforms.push({
      id: "transform.strip_unapproved_urls",
      type: "strip_unapproved_urls",
      apply_to: ["response"],
      domain_allow_list: [...n.allowed_link_domains],
    });
  }
  for (const r of rules) {
    for (const c of r.citations) citations.add(c);
    if (r.action === "REQUIRE_HUMAN_APPROVAL" || r.require_approval_if?.length)
      citations.add("IS-13");
  }

  const approvers = adv.policy_approver_roles.length
    ? adv.policy_approver_roles
    : ["AI System Owner", "Security Lead"];
  const stage1 = adv.rollout.stages[0];
  const policy: Policy = {
    schema_version: SCHEMA_VERSION,
    policy_id: `pol-${slug(n.agent_name, 70)}`,
    policy_name: `${n.app_name} — Runtime Policy`,
    description:
      `Draft runtime policy generated by AEGIS for ${n.app_name}` +
      (n.purpose ? ` (${n.purpose})` : "") +
      `. Overall runtime risk: ${rating} (Inferred). Review before rollout.`,
    version: INITIAL_VERSION,
    status: "draft",
    owner: n.owner,
    applies_to: {
      agent_name: [n.agent_name],
      environment: [n.environment],
      risk_tier: [tier],
      tenant: [n.tenant],
      model: n.model ? [n.model] : ["*"],
    },
    rollout: {
      mode: "observe",
      exit_criteria: stage1 ? stage1.exit_criteria : [],
      notes: adv.rollout.promotion_rule,
    },
    identity: {
      required: true,
      required_claims: ["sub", "tenant_id", "roles"],
      allowed_roles: n.allowed_roles,
      tenant_binding: true,
    },
    tools: { default_action: "DENY", deny_list: denyList, rules },
    content: {
      max_input_chars: rating === "Low" || rating === "Medium" ? 32000 : 16000,
      pii_redaction: {
        enabled: true,
        entities: dh.redaction_entities,
        apply_to: dh.redaction_surfaces,
        action: "REDACT",
      },
      prompt_injection: {
        enabled: true,
        apply_to: ["prompt", "tool_output", "tool_params"],
        action: "DENY",
        decode_obfuscation: true,
      },
      jailbreak: { enabled: true, apply_to: ["prompt"], action: "DENY", decode_obfuscation: true },
      transforms,
    },
    limits: {
      requests_per_minute: limits.requests_per_minute,
      tool_calls_per_session: limits.tool_calls_per_session,
      tokens_per_day: limits.tokens_per_day,
      cost_per_month_usd: limits.cost_per_month_usd,
      action_on_breach: limits.action_on_breach,
      alert_at_percent: limits.alert_at_percent,
    },
    logging: {
      immutable_audit: true,
      prompt_logging: dh.prompt_logging,
      response_logging: dh.response_logging,
      tool_param_logging: "redacted",
      sink: "aegis_common.audit.AuditLog (hash-chained JSONL); ship to WORM storage in production",
    },
    kill_switch: {
      enabled: true,
      engaged: false,
      scopes: ir.kill_switch.scopes,
      engaged_targets: [],
      authorized_roles: ir.kill_switch.authorized_roles,
      target_time_to_disable_minutes: ir.kill_switch.target_time_to_disable_minutes,
    },
    rollback: {
      previous_version: null,
      strategy: "disable",
      triggers: ir.playbooks.map((p) => p.trigger),
    },
    shadow_mode: { enabled: true, evaluate_as: "enforce" },
    evidence_retention_days: dh.evidence_retention_days,
    approval: {
      required_approver_roles: approvers,
      min_approvers: approvers.length,
      separation_of_duties: true,
      approved_by: [],
      approved_at: null,
    },
    escalation: { queue: ir.escalation.queue, contact_role: ir.escalation.contact_role },
    change_history: [
      {
        version: INITIAL_VERSION,
        date: today ?? todayUtc(),
        author: GENERATOR_AUTHOR,
        change_type: "created",
        summary:
          "Initial draft generated from the Runtime Shield Advisor profile; requires human review.",
      },
    ],
    citations: [...citations].sort(),
    metadata: {
      generated_by: "aegis_shield.generator",
      advisor_version: adv.advisor_version,
      evidence_status: "Inferred",
      overall_risk: rating,
      requires_human_approval: true,
      synthetic: n.synthetic,
      denied_tools: adv.tool_matrix
        .filter((m) => m.decision === "denied")
        .map((m) => ({ tool: m.tool, reasons: m.reasons })),
      notice:
        "Draft generated by AEGIS. AEGIS does not activate policies: promotion beyond draft/observe " +
        "requires review and recorded human approval. Detection is heuristic.",
    },
  };
  const errors = validatePolicy(policy);
  if (errors.length) {
    // generator bug or invalid input: never silently emit an invalid policy
    throw new Error("generated policy failed validation: " + errors.join("; "));
  }
  return policy;
}

/** YAML header lines written above every generated policy (same text as the Python generator). */
export function policyYamlHeader(policy: Pick<Policy, "policy_id" | "version" | "status">): string {
  return (
    `# AEGIS runtime policy ${policy.policy_id} v${policy.version} (status: ${policy.status})\n` +
    "# Draft policies require review and recorded human approval before activation.\n"
  );
}

/**
 * Serialize a policy to YAML. Mirrors PyYAML's `safe_dump(sort_keys=False, width=110)` layout:
 * insertion key order, block sequences not indented under their key, single-quoted strings
 * where quoting is needed, literal blocks for multi-line strings, and YAML 1.1 quoting so
 * strings such as 'yes' / 'on' stay strings for YAML 1.1 parsers.
 */
export function toYaml(policy: Policy): string {
  return (
    policyYamlHeader(policy) +
    stringify(policy, {
      version: "1.1",
      indentSeq: false,
      lineWidth: 110,
      singleQuote: true,
      blockQuote: "literal",
    })
  );
}

export function toJson(policy: Policy): string {
  return JSON.stringify(policy, null, 2);
}
