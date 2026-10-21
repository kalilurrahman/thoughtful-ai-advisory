"""Shared vocabulary for AEGIS runtime policy-as-code.

"AI proposes. AEGIS evaluates. Approved actions execute."
"""
from __future__ import annotations

SCHEMA_VERSION = "aegis.policy/v1"

# --- Decisions -------------------------------------------------------------
ALLOW = "ALLOW"
DENY = "DENY"
REDACT = "REDACT"
TRANSFORM = "TRANSFORM"
REQUIRE_HUMAN_APPROVAL = "REQUIRE_HUMAN_APPROVAL"
ESCALATE = "ESCALATE"
RATE_LIMIT = "RATE_LIMIT"

DECISIONS = (ALLOW, DENY, REDACT, TRANSFORM, REQUIRE_HUMAN_APPROVAL, ESCALATE, RATE_LIMIT)

# Precedence used to combine verdicts from several checks into one would-be
# decision (higher wins). Blocking decisions outrank payload-modifying ones.
DECISION_PRECEDENCE = {
    DENY: 100,
    ESCALATE: 80,
    RATE_LIMIT: 70,
    REQUIRE_HUMAN_APPROVAL: 60,
    REDACT: 40,
    TRANSFORM: 30,
    ALLOW: 0,
}
BLOCKING_DECISIONS = frozenset({DENY, ESCALATE, RATE_LIMIT, REQUIRE_HUMAN_APPROVAL})
MODIFYING_DECISIONS = frozenset({REDACT, TRANSFORM})
PERMITTING_DECISIONS = frozenset({ALLOW, REDACT, TRANSFORM})

# --- Rollout modes ---------------------------------------------------------
OBSERVE = "observe"    # log the would-be decision, always ALLOW, payload untouched
WARN = "warn"          # ALLOW, payload untouched, warning flag when would-be != ALLOW
PROTECT = "protect"    # apply REDACT / TRANSFORM, never block
ENFORCE = "enforce"    # full decisions
CONTAIN = "contain"    # kill switch active for the whole policy scope: DENY everything

ROLLOUT_MODES = (OBSERVE, WARN, PROTECT, ENFORCE, CONTAIN)

# --- Lifecycle -------------------------------------------------------------
STATUSES = ("draft", "in_review", "approved", "active", "retired")
STATUS_TRANSITIONS = {
    "draft": {"in_review", "retired"},
    "in_review": {"draft", "approved", "retired"},
    "approved": {"active", "draft", "retired"},
    "active": {"retired"},
    "retired": set(),
}

# --- Tools -----------------------------------------------------------------
OPERATIONS = ("read", "write", "delete", "external_send", "payment", "export")
HIGH_IMPACT_OPERATIONS = frozenset({"delete", "external_send", "payment", "export"})
IRREVERSIBLE_OPERATIONS = frozenset({"delete", "payment"})
TOOL_RULE_ACTIONS = (ALLOW, DENY, REQUIRE_HUMAN_APPROVAL, ESCALATE)
DEFAULT_TOOL_ACTIONS = (DENY, ESCALATE, REQUIRE_HUMAN_APPROVAL)  # never ALLOW: default-deny

# --- Requests --------------------------------------------------------------
REQUEST_TYPES = ("prompt", "response", "tool_call", "tool_output")
CONTENT_SURFACES = ("prompt", "response", "tool_params", "tool_output")

ENVIRONMENTS = ("dev", "test", "staging", "production")
RISK_TIERS = ("Low", "Medium", "High", "Prohibited-review")
KILL_SWITCH_SCOPES = ("agent", "tool", "model", "tenant")
LOGGING_LEVELS = ("none", "metadata", "redacted")  # raw/full logging is intentionally unsupported
TRANSFORM_TYPES = ("append_disclosure", "strip_unapproved_urls", "truncate")
PARAM_TYPES = ("string", "integer", "number", "boolean", "array")
CONDITION_OPS = ("gt", "gte", "lt", "lte", "eq", "ne", "in", "not_in")
CHANGE_TYPES = ("created", "modified", "status_change", "approved", "activated", "retired", "rollback")

# Controls cited by every evaluation (versioned runtime policy + immutable decision log).
BASE_CITATIONS = ("IS-12", "SE-08")
