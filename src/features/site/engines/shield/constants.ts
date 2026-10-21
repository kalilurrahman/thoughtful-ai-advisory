/**
 * Shared vocabulary for AEGIS runtime policy-as-code — port of
 * platform/app/policy-engine/aegis_policy/constants.py.
 *
 * "AI proposes. AEGIS evaluates. Approved actions execute."
 */

export const SCHEMA_VERSION = "aegis.policy/v1";

export const DECISIONS = [
  "ALLOW",
  "DENY",
  "REDACT",
  "TRANSFORM",
  "REQUIRE_HUMAN_APPROVAL",
  "ESCALATE",
  "RATE_LIMIT",
] as const;

export const ROLLOUT_MODES = ["observe", "warn", "protect", "enforce", "contain"] as const;

export const STATUSES = ["draft", "in_review", "approved", "active", "retired"] as const;

export const OPERATIONS = [
  "read",
  "write",
  "delete",
  "external_send",
  "payment",
  "export",
] as const;
export type Operation = (typeof OPERATIONS)[number];
export const HIGH_IMPACT_OPERATIONS: ReadonlySet<string> = new Set([
  "delete",
  "external_send",
  "payment",
  "export",
]);
export const IRREVERSIBLE_OPERATIONS: ReadonlySet<string> = new Set(["delete", "payment"]);
export const TOOL_RULE_ACTIONS = ["ALLOW", "DENY", "REQUIRE_HUMAN_APPROVAL", "ESCALATE"] as const;
export const DEFAULT_TOOL_ACTIONS = ["DENY", "ESCALATE", "REQUIRE_HUMAN_APPROVAL"] as const;

export const CONTENT_SURFACES = ["prompt", "response", "tool_params", "tool_output"] as const;
export const ENVIRONMENTS = ["dev", "test", "staging", "production"] as const;
export const RISK_TIERS = ["Low", "Medium", "High", "Prohibited-review"] as const;
export const KILL_SWITCH_SCOPES = ["agent", "tool", "model", "tenant"] as const;
export const LOGGING_LEVELS = ["none", "metadata", "redacted"] as const;
export const TRANSFORM_TYPES = ["append_disclosure", "strip_unapproved_urls", "truncate"] as const;
export const PARAM_TYPES = ["string", "integer", "number", "boolean", "array"] as const;
export const CONDITION_OPS = ["gt", "gte", "lt", "lte", "eq", "ne", "in", "not_in"] as const;
export const CHANGE_TYPES = [
  "created",
  "modified",
  "status_change",
  "approved",
  "activated",
  "retired",
  "rollback",
] as const;

/**
 * Entity names known to the AEGIS redaction module (keys of
 * aegis_common.redaction.PII_PATTERNS, in declaration order).
 */
export const PII_ENTITIES = [
  "email",
  "payment_card",
  "iban",
  "us_ssn",
  "uk_nino",
  "india_pan",
  "india_aadhaar",
  "phone",
  "ip_address",
  "api_key",
  "aws_access_key",
  "github_token",
] as const;
export const PII_ENTITY_SET: ReadonlySet<string> = new Set(PII_ENTITIES);
