"""Policy-as-code schema validation."""
from __future__ import annotations

import copy
import datetime

import pytest

from aegis_policy.schema import POLICY_SCHEMA, lint_policy, parse_semver, semver_key, validate_policy
from pe_helpers import _base_policy


def errs(p):
    return validate_policy(p)


def has(errors, fragment):
    return any(fragment in e for e in errors), errors


def test_test_policy_is_valid(policy):
    assert errs(policy) == []


def test_non_mapping_rejected():
    assert validate_policy(["not", "a", "policy"])[0].startswith("policy: expected a mapping")
    assert validate_policy(None)


@pytest.mark.parametrize("field", POLICY_SCHEMA["required"])
def test_every_required_top_level_field_enforced(policy, field):
    del policy[field]
    ok, e = has(errs(policy), f"{field}: required field missing")
    assert ok, e


@pytest.mark.parametrize("version,valid", [
    ("1.0.0", True), ("0.1.0", True), ("2.10.3-rc.1", True), ("1.0.0+build.5", True),
    ("1.0", False), ("v1.0.0", False), ("01.0.0", False), ("1.0.0.0", False), ("", False),
])
def test_semver(policy, version, valid):
    policy["version"] = version
    policy["change_history"][0]["version"] = version if valid else "1.2.0"
    policy["rollback"] = {"previous_version": None, "strategy": "disable"}
    e = errs(policy)
    assert (not any(x.startswith("version:") for x in e)) is valid, e


def test_semver_ordering():
    assert semver_key("1.0.0-rc.1") < semver_key("1.0.0") < semver_key("1.0.1") < semver_key("1.10.0")
    assert parse_semver("2.3.4-beta.2")[:3] == (2, 3, 4)
    with pytest.raises(ValueError):
        parse_semver("nope")


@pytest.mark.parametrize("path,value,fragment", [
    (("status",), "live", "status"),
    (("rollout", "mode"), "block", "rollout.mode"),
    (("tools", "default_action"), "ALLOW", "tools.default_action"),   # default-deny is mandatory
    (("policy_id",), "Bad ID!", "policy_id"),
    (("evidence_retention_days",), 0, "evidence_retention_days"),
    (("limits", "requests_per_minute"), 0, "limits.requests_per_minute"),
    (("limits", "requests_per_minute"), True, "expected integer"),
    (("logging", "prompt_logging"), "full", "logging.prompt_logging"),   # raw logging unsupported
    (("kill_switch", "scopes"), ["planet"], "kill_switch.scopes"),
    (("applies_to", "environment"), ["prod"], "applies_to.environment"),
    (("citations",), [], "citations"),
    (("citations",), ["IS-99"], "unknown AEGIS control ID"),
    (("citations",), ["XX-01"], "does not match"),
])
def test_field_constraints(policy, path, value, fragment):
    target = policy
    for k in path[:-1]:
        target = target[k]
    target[path[-1]] = value
    ok, e = has(errs(policy), fragment)
    assert ok, e


def test_unknown_field_rejected(policy):
    policy["tools"]["rules"][0]["allow_everything"] = True
    ok, e = has(errs(policy), "unknown field")
    assert ok, e


def test_metadata_is_free_form(policy):
    policy["metadata"] = {"anything": {"nested": [1, 2]}}
    assert errs(policy) == []


def test_unquoted_yaml_date_hint(policy):
    policy["change_history"][0]["date"] = datetime.date(2026, 10, 21)
    ok, e = has(errs(policy), "quote dates in YAML")
    assert ok, e


def test_rule_citation_must_exist(policy):
    policy["tools"]["rules"][0]["citations"] = ["IS-77"]
    ok, e = has(errs(policy), "tools.rules[0].citations: unknown AEGIS control ID")
    assert ok, e


def test_unknown_pii_entity(policy):
    policy["content"]["pii_redaction"]["entities"].append("dna_sequence")
    ok, e = has(errs(policy), "unknown entity 'dna_sequence'")
    assert ok, e


def test_invalid_regex(policy):
    policy["tools"]["rules"][0]["parameters"]["order_id"]["regex"] = "([unclosed"
    ok, e = has(errs(policy), "invalid regular expression")
    assert ok, e


def test_param_constraint_type_mismatch(policy):
    policy["tools"]["rules"][1]["parameters"]["amount"]["regex"] = "^\\d+$"
    ok, e = has(errs(policy), "string constraints used on a number parameter")
    assert ok, e
    p2 = _base_policy()
    p2["tools"]["rules"][1]["parameters"]["amount"]["min"] = 900
    ok, e = has(errs(p2), "min greater than max")
    assert ok, e


def test_duplicate_rule_ids_and_tools(policy):
    dup = copy.deepcopy(policy["tools"]["rules"][0])
    policy["tools"]["rules"].append(dup)
    e = errs(policy)
    assert has(e, "duplicate rule id")[0] and has(e, "duplicate rule for tool")[0], e


def test_deny_list_conflict(policy):
    policy["tools"]["deny_list"].append("crm.lookup")
    ok, e = has(errs(policy), "is on tools.deny_list but rule action is ALLOW")
    assert ok, e


def test_irreversible_operations_cannot_be_unconditionally_allowed(policy):
    del policy["tools"]["rules"][1]["require_approval_if"]
    ok, e = has(errs(policy), "must not be unconditionally ALLOWed")
    assert ok, e


def test_approval_roles_required_for_approval_rules(policy):
    del policy["tools"]["rules"][3]["approval_roles"]
    ok, e = has(errs(policy), "approval_roles: required")
    assert ok, e


def test_condition_must_reference_declared_param(policy):
    policy["tools"]["rules"][1]["require_approval_if"].append({"param": "ghost", "op": "eq", "value": 1})
    ok, e = has(errs(policy), "'ghost' is not a declared parameter")
    assert ok, e


def test_transform_requirements(policy):
    policy["content"]["transforms"] = [{"id": "t1", "type": "append_disclosure"},
                                       {"id": "t2", "type": "truncate"}]
    e = errs(policy)
    assert has(e, "text: required for append_disclosure")[0] and has(e, "max_chars: required for truncate")[0]


def test_rollback_version_must_be_lower(policy):
    policy["rollback"]["previous_version"] = "1.2.0"
    ok, e = has(errs(policy), "previous_version: must be lower")
    assert ok, e
    p2 = _base_policy()
    p2["rollback"] = {"previous_version": None, "strategy": "revert_to_previous"}
    ok, e = has(errs(p2), "revert_to_previous requires")
    assert ok, e


def test_change_history_must_cover_current_version(policy):
    policy["change_history"][0]["version"] = "1.1.0"
    ok, e = has(errs(policy), "entry for the current version")
    assert ok, e


def test_contain_requires_kill_switch(policy):
    policy["rollout"]["mode"] = "contain"
    policy["kill_switch"]["enabled"] = False
    ok, e = has(errs(policy), "contain requires kill_switch.enabled")
    assert ok, e


def test_engaged_target_scope_must_be_configured(policy):
    policy["kill_switch"]["scopes"] = ["agent"]
    policy["kill_switch"]["engaged_targets"] = [{"scope": "tool", "target": "payments.refund"}]
    ok, e = has(errs(policy), "not in kill_switch.scopes")
    assert ok, e


# --- approval / lifecycle gates -------------------------------------------------------------

def _approved(policy, approvers):
    policy["status"] = "approved"
    policy["approval"]["approved_by"] = [{"name": n, "role": r, "approved_at": "2026-10-21T10:00:00+00:00"}
                                         for n, r in approvers]
    policy["approval"]["approved_at"] = "2026-10-21T10:00:00+00:00"
    return policy


def test_draft_cannot_carry_approvals(policy):
    policy["approval"]["approved_by"] = [{"name": "A", "role": "AI System Owner", "approved_at": "2026-10-21"}]
    ok, e = has(errs(policy), "draft policy must not carry approvals")
    assert ok, e


@pytest.mark.parametrize("status", ["approved", "active"])
def test_approved_and_active_require_human_approval(policy, status):
    policy["status"] = status
    e = errs(policy)
    assert has(e, f"status {status} requires recorded human approval")[0]
    assert has(e, "requires an approval timestamp")[0]


def test_approved_requires_all_roles_and_min_approvers(policy):
    _approved(policy, [("Alex Owner", "AI System Owner")])
    e = errs(policy)
    assert has(e, "missing approval from required role(s) ['Security Lead']")[0], e
    assert has(e, "min_approvers is 2")[0], e


def test_fully_approved_policy_valid(policy):
    _approved(policy, [("Alex Owner", "AI System Owner"), ("Sam Sec", "Security Lead")])
    assert errs(policy) == []


def test_separation_of_duties(policy):
    _approved(policy, [("Pat Author", "AI System Owner"), ("Sam Sec", "Security Lead")])
    ok, e = has(errs(policy), "separation of duties violated")
    assert ok, e


def test_active_production_policy_requires_immutable_audit(policy):
    _approved(policy, [("Alex Owner", "AI System Owner"), ("Sam Sec", "Security Lead")])
    policy["status"] = "active"
    policy["logging"]["immutable_audit"] = False
    ok, e = has(errs(policy), "must be true for an active production policy")
    assert ok, e


def test_lint_warnings(policy):
    w = lint_policy(policy)
    assert any("email-send" in x and "external_send" in x for x in w)
    assert any("undeclared parameters are accepted" in x for x in w)
    policy["content"]["prompt_injection"]["enabled"] = False
    assert any("prompt-injection detection disabled" in x for x in lint_policy(policy))
    bad = _base_policy()
    del bad["owner"]
    assert lint_policy(bad) == ["policy is invalid; fix validation errors first"]
