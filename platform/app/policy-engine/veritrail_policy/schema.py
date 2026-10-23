"""VERITRAIL runtime policy-as-code schema and validator.

Implemented in plain Python (no jsonschema dependency). ``validate_policy``
returns a list of human-readable error strings; an empty list means the policy
is structurally and semantically valid. ``lint_policy`` returns non-blocking
warnings (governance smells a reviewer should look at).

The schema is declared as data (``POLICY_SCHEMA``) so it can be rendered into
documentation and reused by tooling. See docs/RUNTIME_SHIELD_DESIGN.md.
"""
from __future__ import annotations

import re
from typing import Any

from .constants import (
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
    REQUIRE_HUMAN_APPROVAL,
    RISK_TIERS,
    ROLLOUT_MODES,
    SCHEMA_VERSION,
    STATUSES,
    TOOL_RULE_ACTIONS,
    TRANSFORM_TYPES,
)

SEMVER_RE = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?"
    r"(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$"
)
POLICY_ID_RE = r"^[a-z0-9][a-z0-9._-]{2,79}$"
RULE_ID_RE = r"^[a-z0-9][a-z0-9._:-]{1,99}$"
CONTROL_ID_RE = r"^(AO|EI|GL|IS|SE)-\d{2}$"
DATE_RE = r"^\d{4}-\d{2}-\d{2}([T ][0-9:.+\-Z]+)?$"

# ---------------------------------------------------------------------------
# Declarative schema
# ---------------------------------------------------------------------------
# Spec keys: type (string|integer|number|boolean|array|object|any), nullable,
# enum, pattern, min_length, max_length, min, max, items, min_items, unique,
# fields, required, additional (bool), values (spec for free-form mapping values),
# description.


def _str(**kw):
    return {"type": "string", **kw}


def _int(**kw):
    return {"type": "integer", **kw}


def _bool(**kw):
    return {"type": "boolean", **kw}


def _list(items, **kw):
    return {"type": "array", "items": items, **kw}


def _obj(fields, required=(), additional=False, **kw):
    return {"type": "object", "fields": fields, "required": list(required), "additional": additional, **kw}


_CITATIONS = _list(_str(pattern=CONTROL_ID_RE), unique=True,
                   description="VERITRAIL control IDs from content/controls/controls.yaml")

PARAM_SPEC = _obj(
    {
        "type": _str(enum=list(PARAM_TYPES)),
        "required": _bool(),
        "description": _str(),
        "min": {"type": "number"},
        "max": {"type": "number"},
        "min_length": _int(min=0),
        "max_length": _int(min=0),
        "max_items": _int(min=0),
        "regex": _str(min_length=1, max_length=500),
        "enum": _list({"type": "any"}, min_items=1),
        "domain_allow_list": _list(_str(min_length=1), min_items=1),
    },
    required=["type"],
    description="Parameter validation rule",
)

CONDITION_SPEC = _obj(
    {
        "param": _str(min_length=1),
        "op": _str(enum=list(CONDITION_OPS)),
        "value": {"type": "any"},
        "reason": _str(),
    },
    required=["param", "op", "value"],
)

TOOL_RULE_SPEC = _obj(
    {
        "id": _str(pattern=RULE_ID_RE),
        "tool": _str(min_length=1, max_length=200),
        "operation": _str(enum=list(OPERATIONS)),
        "action": _str(enum=list(TOOL_RULE_ACTIONS)),
        "description": _str(),
        "scopes": _list(_str(min_length=1), unique=True),
        "allowed_roles": _list(_str(min_length=1), unique=True),
        "parameters": {"type": "object", "fields": {}, "required": [], "additional": True, "values": PARAM_SPEC},
        "additional_parameters": _bool(),
        "require_approval_if": _list(CONDITION_SPEC),
        "approval_roles": _list(_str(min_length=1), unique=True),
        "max_calls_per_session": _int(min=1),
        "allow_pii_entities": _list(_str(min_length=1), unique=True),
        "citations": _CITATIONS,
    },
    required=["id", "tool", "operation", "action"],
)

DETECTOR_SPEC = _obj(
    {
        "enabled": _bool(),
        "apply_to": _list(_str(enum=list(CONTENT_SURFACES)), unique=True),
        "action": _str(enum=["DENY", "ESCALATE", "REQUIRE_HUMAN_APPROVAL"]),
        "decode_obfuscation": _bool(),
    },
    required=["enabled", "action"],
)

TRANSFORM_SPEC = _obj(
    {
        "id": _str(pattern=RULE_ID_RE),
        "type": _str(enum=list(TRANSFORM_TYPES)),
        "apply_to": _list(_str(enum=["response"]), unique=True),
        "text": _str(min_length=1, max_length=1000),
        "domain_allow_list": _list(_str(min_length=1)),
        "max_chars": _int(min=1),
    },
    required=["id", "type"],
)

PERSON_APPROVAL_SPEC = _obj(
    {"name": _str(min_length=1), "role": _str(min_length=1), "approved_at": _str(pattern=DATE_RE),
     "note": _str()},
    required=["name", "role", "approved_at"],
)

POLICY_SCHEMA = _obj(
    {
        "schema_version": _str(enum=[SCHEMA_VERSION]),
        "policy_id": _str(pattern=POLICY_ID_RE),
        "policy_name": _str(min_length=3, max_length=200),
        "description": _str(),
        "version": _str(pattern=SEMVER_RE.pattern),
        "status": _str(enum=list(STATUSES)),
        "owner": _str(min_length=1),
        "applies_to": _obj(
            {
                "agent_name": _list(_str(min_length=1), min_items=1),
                "environment": _list(_str(enum=list(ENVIRONMENTS) + ["*"]), min_items=1),
                "risk_tier": _list(_str(enum=list(RISK_TIERS) + ["*"]), min_items=1),
                "tenant": _list(_str(min_length=1), min_items=1),
                "model": _list(_str(min_length=1), min_items=1),
            },
            required=["agent_name", "environment"],
        ),
        "rollout": _obj(
            {
                "mode": _str(enum=list(ROLLOUT_MODES)),
                "exit_criteria": _list(_str(min_length=1)),
                "notes": _str(),
            },
            required=["mode"],
        ),
        "identity": _obj(
            {
                "required": _bool(),
                "required_claims": _list(_str(min_length=1), unique=True),
                "allowed_roles": _list(_str(min_length=1), unique=True),
                "allowed_issuers": _list(_str(min_length=1), unique=True),
                "tenant_binding": _bool(),
            },
            required=["required", "required_claims"],
        ),
        "tools": _obj(
            {
                "default_action": _str(enum=list(DEFAULT_TOOL_ACTIONS)),
                "deny_list": _list(_str(min_length=1), unique=True),
                "rules": _list(TOOL_RULE_SPEC),
            },
            required=["default_action", "rules"],
        ),
        "content": _obj(
            {
                "max_input_chars": _int(min=1),
                "pii_redaction": _obj(
                    {
                        "enabled": _bool(),
                        "entities": _list(_str(min_length=1), unique=True),
                        "apply_to": _list(_str(enum=list(CONTENT_SURFACES)), unique=True),
                        "action": _str(enum=["REDACT", "DENY", "ESCALATE"]),
                    },
                    required=["enabled", "entities", "action"],
                ),
                "prompt_injection": DETECTOR_SPEC,
                "jailbreak": DETECTOR_SPEC,
                "transforms": _list(TRANSFORM_SPEC),
            },
            required=["max_input_chars", "pii_redaction", "prompt_injection", "jailbreak"],
        ),
        "limits": _obj(
            {
                "requests_per_minute": _int(min=1),
                "tool_calls_per_session": _int(min=1),
                "tokens_per_day": _int(min=1),
                "cost_per_month_usd": {"type": "number", "min": 0},
                "action_on_breach": _str(enum=["RATE_LIMIT", "ESCALATE"]),
                "alert_at_percent": _int(min=1, max=100),
            },
            required=["requests_per_minute", "tool_calls_per_session", "tokens_per_day", "cost_per_month_usd"],
        ),
        "logging": _obj(
            {
                "immutable_audit": _bool(),
                "prompt_logging": _str(enum=list(LOGGING_LEVELS)),
                "response_logging": _str(enum=list(LOGGING_LEVELS)),
                "tool_param_logging": _str(enum=list(LOGGING_LEVELS)),
                "sink": _str(),
            },
            required=["immutable_audit", "prompt_logging", "response_logging"],
        ),
        "kill_switch": _obj(
            {
                "enabled": _bool(),
                "engaged": _bool(),
                "scopes": _list(_str(enum=list(KILL_SWITCH_SCOPES)), min_items=1, unique=True),
                "engaged_targets": _list(_obj(
                    {"scope": _str(enum=list(KILL_SWITCH_SCOPES)), "target": _str(min_length=1),
                     "reason": _str(), "engaged_by": _str(), "engaged_at": _str(pattern=DATE_RE)},
                    required=["scope", "target"],
                )),
                "authorized_roles": _list(_str(min_length=1), min_items=1, unique=True),
                "target_time_to_disable_minutes": _int(min=1),
            },
            required=["enabled", "scopes", "authorized_roles"],
        ),
        "rollback": _obj(
            {
                "previous_version": _str(pattern=SEMVER_RE.pattern, nullable=True),
                "strategy": _str(enum=["revert_to_previous", "contain", "disable"]),
                "triggers": _list(_str(min_length=1)),
            },
            required=["previous_version", "strategy"],
        ),
        "shadow_mode": _obj(
            {
                "enabled": _bool(),
                "evaluate_as": _str(enum=list(ROLLOUT_MODES)),
            },
            required=["enabled"],
        ),
        "evidence_retention_days": _int(min=1, max=3650),
        "approval": _obj(
            {
                "required_approver_roles": _list(_str(min_length=1), min_items=1, unique=True),
                "min_approvers": _int(min=1),
                "separation_of_duties": _bool(),
                "approved_by": _list(PERSON_APPROVAL_SPEC),
                "approved_at": _str(pattern=DATE_RE, nullable=True),
            },
            required=["required_approver_roles", "min_approvers", "approved_by", "approved_at"],
        ),
        "change_history": _list(_obj(
            {
                "version": _str(pattern=SEMVER_RE.pattern),
                "date": _str(pattern=DATE_RE),
                "author": _str(min_length=1),
                "change_type": _str(enum=list(CHANGE_TYPES)),
                "summary": _str(min_length=1),
            },
            required=["version", "date", "author", "change_type", "summary"],
        ), min_items=1),
        "escalation": _obj({"queue": _str(), "contact_role": _str()}, additional=True),
        "citations": dict(_CITATIONS, min_items=1),
        "metadata": {"type": "object", "fields": {}, "required": [], "additional": True},
    },
    required=[
        "schema_version", "policy_id", "policy_name", "version", "status", "owner", "applies_to",
        "rollout", "identity", "tools", "content", "limits", "logging", "kill_switch", "rollback",
        "shadow_mode", "evidence_retention_days", "approval", "change_history", "citations",
    ],
)

# ---------------------------------------------------------------------------
# Structural validation
# ---------------------------------------------------------------------------
_TYPE_NAMES = {
    "string": str, "boolean": bool, "array": list, "object": dict,
}


def _type_ok(value: Any, typ: str) -> bool:
    if typ == "any":
        return True
    if typ == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if typ == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(value, _TYPE_NAMES[typ])


def _check(value: Any, spec: dict, path: str, errors: list[str]) -> None:
    if value is None:
        if not spec.get("nullable"):
            errors.append(f"{path}: must not be null")
        return
    typ = spec.get("type", "any")
    if not _type_ok(value, typ):
        hint = ""
        if typ == "string" and value.__class__.__name__ in ("date", "datetime"):
            hint = " (quote dates in YAML)"
        errors.append(f"{path}: expected {typ}, got {type(value).__name__}{hint}")
        return
    if "enum" in spec and typ != "array" and value not in spec["enum"]:
        errors.append(f"{path}: {value!r} not one of {spec['enum']}")
    if typ == "string":
        if "pattern" in spec and not re.match(spec["pattern"], value):
            errors.append(f"{path}: {value!r} does not match required format")
        if "min_length" in spec and len(value) < spec["min_length"]:
            errors.append(f"{path}: shorter than {spec['min_length']} characters")
        if "max_length" in spec and len(value) > spec["max_length"]:
            errors.append(f"{path}: longer than {spec['max_length']} characters")
    elif typ in ("integer", "number"):
        if "min" in spec and value < spec["min"]:
            errors.append(f"{path}: must be >= {spec['min']}")
        if "max" in spec and value > spec["max"]:
            errors.append(f"{path}: must be <= {spec['max']}")
    elif typ == "array":
        if "min_items" in spec and len(value) < spec["min_items"]:
            errors.append(f"{path}: must contain at least {spec['min_items']} item(s)")
        if spec.get("unique"):
            seen = set()
            for v in value:
                key = repr(v)
                if key in seen:
                    errors.append(f"{path}: duplicate item {v!r}")
                seen.add(key)
        if "items" in spec:
            for i, item in enumerate(value):
                _check(item, spec["items"], f"{path}[{i}]", errors)
    elif typ == "object":
        fields = spec.get("fields", {})
        for req in spec.get("required", []):
            if req not in value:
                errors.append(f"{path}.{req}: required field missing" if path else f"{req}: required field missing")
        for k, v in value.items():
            sub = f"{path}.{k}" if path else str(k)
            if not isinstance(k, str):
                errors.append(f"{sub}: keys must be strings")
                continue
            if k in fields:
                _check(v, fields[k], sub, errors)
            elif "values" in spec:
                _check(v, spec["values"], sub, errors)
            elif not spec.get("additional", False):
                errors.append(f"{sub}: unknown field")


# ---------------------------------------------------------------------------
# Semantic validation
# ---------------------------------------------------------------------------

def parse_semver(version: str) -> tuple[int, int, int, tuple]:
    m = SEMVER_RE.match(version or "")
    if not m:
        raise ValueError(f"not a semantic version: {version!r}")
    pre = tuple(int(p) if p.isdigit() else p for p in (m.group(4) or "").split(".") if p)
    return int(m.group(1)), int(m.group(2)), int(m.group(3)), pre


def semver_key(version: str) -> tuple:
    """Sort key implementing SemVer 2.0 precedence (pre-release < release)."""
    ma, mi, pa, pre = parse_semver(version)
    pre_key = tuple((0, p) if isinstance(p, int) else (1, p) for p in pre)
    return (ma, mi, pa, 0 if pre else 1, pre_key)


def _known_control_ids() -> set[str] | None:
    try:
        from veritrail_common.content import controls_by_id
        return set(controls_by_id())
    except Exception:  # pragma: no cover - content unavailable
        return None


def _known_pii_entities() -> set[str]:
    from veritrail_common.redaction import PII_PATTERNS
    return set(PII_PATTERNS)


def _param_semantic(params: dict, prefix: str, errors: list[str]) -> None:
    for pname, ps in params.items():
        if not isinstance(ps, dict):
            continue
        pp = f"{prefix}.{pname}"
        if "regex" in ps and isinstance(ps["regex"], str):
            try:
                re.compile(ps["regex"])
            except re.error as exc:
                errors.append(f"{pp}.regex: invalid regular expression ({exc})")
        if isinstance(ps.get("min"), (int, float)) and isinstance(ps.get("max"), (int, float)) \
                and ps["min"] > ps["max"]:
            errors.append(f"{pp}: min greater than max")
        ptype = ps.get("type")
        if ptype in ("integer", "number", "boolean") and any(k in ps for k in ("regex", "max_length", "domain_allow_list")):
            errors.append(f"{pp}: string constraints used on a {ptype} parameter")
        if ptype in ("string", "boolean") and any(k in ps for k in ("min", "max")):
            errors.append(f"{pp}: numeric bounds used on a {ptype} parameter")


def validate_parameter_specs(params: Any) -> list[str]:
    """Validate a tool's ``parameters`` mapping on its own (used for advisor/agent input)."""
    if not isinstance(params, dict):
        return ["parameters: expected a mapping"]
    errors: list[str] = []
    for name, spec in params.items():
        if not isinstance(name, str):
            errors.append("parameters: names must be strings")
            continue
        _check(spec, PARAM_SPEC, f"parameters.{name}", errors)
    if not errors:
        _param_semantic(params, "parameters", errors)
    return errors


def _semantic(policy: dict, errors: list[str]) -> None:
    known_controls = _known_control_ids()

    def check_citations(cits, path):
        if known_controls is None or not isinstance(cits, list):
            return
        for c in cits:
            if isinstance(c, str) and c not in known_controls:
                errors.append(f"{path}: unknown VERITRAIL control ID {c!r}")

    check_citations(policy.get("citations"), "citations")

    # Versions
    version = policy.get("version")
    rollback = policy.get("rollback") or {}
    prev = rollback.get("previous_version")
    if isinstance(version, str) and isinstance(prev, str):
        try:
            if semver_key(prev) >= semver_key(version):
                errors.append("rollback.previous_version: must be lower than version")
        except ValueError:
            pass
    if rollback.get("strategy") == "revert_to_previous" and prev is None:
        errors.append("rollback.strategy: revert_to_previous requires rollback.previous_version")
    history = policy.get("change_history")
    if isinstance(history, list) and isinstance(version, str):
        if not any(isinstance(h, dict) and h.get("version") == version for h in history):
            errors.append("change_history: must contain an entry for the current version")

    # Tools
    tools = policy.get("tools") or {}
    rules = tools.get("rules") if isinstance(tools.get("rules"), list) else []
    deny_list = set(tools.get("deny_list") or []) if isinstance(tools.get("deny_list"), list) else set()
    seen_ids, seen_tools = set(), set()
    pii_known = _known_pii_entities()
    for i, r in enumerate(rules):
        if not isinstance(r, dict):
            continue
        p = f"tools.rules[{i}]"
        rid, tool = r.get("id"), r.get("tool")
        if rid in seen_ids:
            errors.append(f"{p}.id: duplicate rule id {rid!r}")
        seen_ids.add(rid)
        if tool in seen_tools:
            errors.append(f"{p}.tool: duplicate rule for tool {tool!r}")
        seen_tools.add(tool)
        if tool in deny_list and r.get("action") != "DENY":
            errors.append(f"{p}: tool {tool!r} is on tools.deny_list but rule action is {r.get('action')}")
        check_citations(r.get("citations"), f"{p}.citations")
        params = r.get("parameters") if isinstance(r.get("parameters"), dict) else {}
        _param_semantic(params, f"{p}.parameters", errors)
        conds = r.get("require_approval_if") if isinstance(r.get("require_approval_if"), list) else []
        for j, c in enumerate(conds):
            if isinstance(c, dict) and c.get("param") not in params:
                errors.append(f"{p}.require_approval_if[{j}].param: {c.get('param')!r} is not a declared parameter")
            if isinstance(c, dict) and c.get("op") in ("in", "not_in") and not isinstance(c.get("value"), list):
                errors.append(f"{p}.require_approval_if[{j}].value: must be a list for op {c.get('op')}")
        needs_approver = r.get("action") == REQUIRE_HUMAN_APPROVAL or bool(conds)
        if needs_approver and not r.get("approval_roles"):
            errors.append(f"{p}.approval_roles: required when the rule can require human approval")
        if r.get("operation") in IRREVERSIBLE_OPERATIONS and r.get("action") == "ALLOW" and not conds:
            errors.append(
                f"{p}: {r.get('operation')} operations must not be unconditionally ALLOWed "
                "(use REQUIRE_HUMAN_APPROVAL or require_approval_if) — IS-13")
        for ent in r.get("allow_pii_entities") or []:
            if ent not in pii_known:
                errors.append(f"{p}.allow_pii_entities: unknown entity {ent!r}")

    # Content
    content = policy.get("content") or {}
    pii = content.get("pii_redaction") or {}
    for ent in pii.get("entities") or []:
        if isinstance(ent, str) and ent not in pii_known:
            errors.append(f"content.pii_redaction.entities: unknown entity {ent!r} (known: {sorted(pii_known)})")
    if pii.get("enabled") and not pii.get("entities"):
        errors.append("content.pii_redaction.entities: must list at least one entity when enabled")
    seen_t = set()
    for i, t in enumerate(content.get("transforms") or []):
        if not isinstance(t, dict):
            continue
        if t.get("id") in seen_t:
            errors.append(f"content.transforms[{i}].id: duplicate transform id")
        seen_t.add(t.get("id"))
        if t.get("type") == "append_disclosure" and not t.get("text"):
            errors.append(f"content.transforms[{i}].text: required for append_disclosure")
        if t.get("type") == "strip_unapproved_urls" and not t.get("domain_allow_list"):
            errors.append(f"content.transforms[{i}].domain_allow_list: required for strip_unapproved_urls")
        if t.get("type") == "truncate" and not t.get("max_chars"):
            errors.append(f"content.transforms[{i}].max_chars: required for truncate")

    # Kill switch / rollout
    ks = policy.get("kill_switch") or {}
    rollout = policy.get("rollout") or {}
    if rollout.get("mode") == "contain" and not ks.get("enabled"):
        errors.append("rollout.mode: contain requires kill_switch.enabled = true")
    ks_scopes = set(ks.get("scopes") or []) if isinstance(ks.get("scopes"), list) else set()
    for i, t in enumerate(ks.get("engaged_targets") or []):
        if isinstance(t, dict) and t.get("scope") not in ks_scopes:
            errors.append(f"kill_switch.engaged_targets[{i}].scope: {t.get('scope')!r} not in kill_switch.scopes")

    # Approval / status
    status = policy.get("status")
    appr = policy.get("approval") or {}
    approved_by = appr.get("approved_by") if isinstance(appr.get("approved_by"), list) else []
    if status == "draft" and approved_by:
        errors.append("approval.approved_by: a draft policy must not carry approvals (approvals bind to a reviewed version)")
    if status in ("approved", "active"):
        if not approved_by:
            errors.append(f"approval.approved_by: status {status} requires recorded human approval")
        if not appr.get("approved_at"):
            errors.append(f"approval.approved_at: status {status} requires an approval timestamp")
        roles = {a.get("role") for a in approved_by if isinstance(a, dict)}
        missing = [r for r in appr.get("required_approver_roles") or [] if r not in roles]
        if missing:
            errors.append(f"approval: missing approval from required role(s) {missing}")
        names = {a.get("name") for a in approved_by if isinstance(a, dict)}
        if isinstance(appr.get("min_approvers"), int) and len(names) < appr["min_approvers"]:
            errors.append(f"approval: {len(names)} distinct approver(s) recorded, min_approvers is {appr['min_approvers']}")
        if appr.get("separation_of_duties") and isinstance(history, list):
            authors = {h.get("author") for h in history
                       if isinstance(h, dict) and h.get("version") == version
                       and h.get("change_type") in ("created", "modified", "rollback")}
            clash = names & authors
            if clash:
                errors.append(f"approval: separation of duties violated — {sorted(clash)} authored and approved this version")
    envs = (policy.get("applies_to") or {}).get("environment") or []
    logging_ = policy.get("logging") or {}
    if status == "active" and ("production" in envs or "*" in envs) and logging_.get("immutable_audit") is not True:
        errors.append("logging.immutable_audit: must be true for an active production policy (SE-08)")


def validate_policy(policy: Any) -> list[str]:
    """Validate a policy document. Returns a list of errors (empty == valid)."""
    if not isinstance(policy, dict):
        return [f"policy: expected a mapping/object, got {type(policy).__name__}"]
    errors: list[str] = []
    _check(policy, POLICY_SCHEMA, "", errors)
    try:
        _semantic(policy, errors)
    except Exception as exc:  # defensive: malformed structures already reported above
        errors.append(f"semantic validation aborted: {exc.__class__.__name__}: {exc}")
    return errors


def is_valid(policy: Any) -> bool:
    return not validate_policy(policy)


def lint_policy(policy: dict) -> list[str]:
    """Non-blocking governance warnings for reviewers."""
    warnings: list[str] = []
    if validate_policy(policy):
        return ["policy is invalid; fix validation errors first"]
    tools = policy["tools"]
    for r in tools["rules"]:
        if r["operation"] in HIGH_IMPACT_OPERATIONS and r["action"] == "ALLOW" and not r.get("require_approval_if"):
            warnings.append(f"rule {r['id']}: high-impact '{r['operation']}' allowed without approval conditions — "
                            "confirm parameter constraints are sufficient (IS-13)")
        if r["operation"] != "read" and not r.get("parameters"):
            warnings.append(f"rule {r['id']}: no parameter validation declared for a {r['operation']} tool (IS-11)")
        if r.get("additional_parameters"):
            warnings.append(f"rule {r['id']}: undeclared parameters are accepted")
    content = policy["content"]
    if not content["prompt_injection"]["enabled"]:
        warnings.append("prompt-injection detection disabled (IS-12, IS-14)")
    if not content["pii_redaction"]["enabled"]:
        warnings.append("PII redaction disabled (IS-04)")
    if not policy["identity"]["required"]:
        warnings.append("identity not required: requests can be anonymous")
    if not policy["kill_switch"]["enabled"]:
        warnings.append("kill switch disabled (IS-15)")
    if not policy["logging"]["immutable_audit"]:
        warnings.append("immutable audit logging disabled (SE-08)")
    envs = policy["applies_to"]["environment"]
    if "production" in envs and policy["rollout"]["mode"] in ("enforce", "contain") \
            and policy["change_history"][-1]["version"] == policy["version"] \
            and policy["rollback"]["previous_version"] is None:
        warnings.append("first production version goes straight to enforcement; consider observe → warn → protect first")
    return warnings
