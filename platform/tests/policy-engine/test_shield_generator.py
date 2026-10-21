"""Policy generator: validity, YAML<->JSON round-trip, versioning and lifecycle helpers."""
from __future__ import annotations

import copy
import json

import pytest
import yaml

from aegis_policy.schema import validate_policy
from aegis_shield.advisor import advise
from aegis_shield.examples import CUSTOMER_SUPPORT_PROFILE, FINANCIAL_OPS_PROFILE, INTERNAL_RAG_PROFILE
from aegis_shield.generator import (
    add_approval,
    bump_version,
    diff_policies,
    from_json,
    from_yaml,
    generate_policy,
    new_version,
    record_change,
    summarize_diff,
    to_json,
    to_yaml,
    transition_status,
)

OWNER = {"name": "Alex Owner", "role": "AI System Owner"}
SEC = {"name": "Sam Sec", "role": "Security Lead"}
RISK = {"name": "Riley Risk", "role": "Risk & Compliance Lead"}


@pytest.fixture
def pol():
    return generate_policy(copy.deepcopy(CUSTOMER_SUPPORT_PROFILE))


@pytest.mark.parametrize("profile", [CUSTOMER_SUPPORT_PROFILE, FINANCIAL_OPS_PROFILE, INTERNAL_RAG_PROFILE, {}])
def test_generate_policy_valid_without_precomputed_advice(profile):
    p = generate_policy(copy.deepcopy(profile))
    assert validate_policy(p) == []
    assert p["status"] == "draft" and p["version"] == "0.1.0"
    assert p["change_history"][0]["change_type"] == "created"


def test_generate_policy_with_advice_matches_advise_output():
    a = advise(copy.deepcopy(FINANCIAL_OPS_PROFILE))
    p = generate_policy(copy.deepcopy(FINANCIAL_OPS_PROFILE), advice=a)  # advice from advise() (no _normalized)
    assert p == a["policy"]


def test_generation_is_deterministic(pol):
    assert generate_policy(copy.deepcopy(CUSTOMER_SUPPORT_PROFILE)) == pol


def test_tool_rules_map_from_matrix(pol):
    rules = {r["tool"]: r for r in pol["tools"]["rules"]}
    assert rules["payments.issue_refund"]["action"] == "ALLOW"
    assert rules["payments.issue_refund"]["require_approval_if"][0]["value"] == 50
    assert rules["crm.delete_customer"]["action"] == "REQUIRE_HUMAN_APPROVAL"
    assert rules["crm.lookup_order"]["additional_parameters"] is False  # parameters were declared
    assert "transform.strip_unapproved_urls" in {t["id"] for t in pol["content"]["transforms"]}


@pytest.mark.parametrize("profile", [CUSTOMER_SUPPORT_PROFILE, FINANCIAL_OPS_PROFILE, INTERNAL_RAG_PROFILE])
def test_yaml_json_round_trip(profile):
    p = generate_policy(copy.deepcopy(profile))
    y = to_yaml(p)
    j = to_json(p)
    assert from_yaml(y) == p
    assert from_json(j) == p
    assert from_json(to_json(from_yaml(y))) == p
    assert from_yaml(to_yaml(from_json(j))) == p
    assert yaml.safe_load(y) == json.loads(j)
    assert y.startswith("# AEGIS runtime policy")
    assert validate_policy(from_yaml(y)) == []


def test_yaml_dates_stay_strings(pol):
    loaded = from_yaml(to_yaml(pol))
    assert isinstance(loaded["change_history"][0]["date"], str)


@pytest.mark.parametrize("v,part,expected", [
    ("0.1.0", "minor", "0.2.0"), ("0.1.0", "major", "1.0.0"), ("1.2.3", "patch", "1.2.4"),
    ("1.9.9", "minor", "1.10.0"), ("2.0.0-rc.1", "patch", "2.0.0"),
])
def test_bump_version(v, part, expected):
    assert bump_version(v, part) == expected


def test_bump_version_rejects_bad_part():
    with pytest.raises(ValueError):
        bump_version("1.0.0", "huge")


def test_new_version_resets_to_draft_and_records_rollback(pol):
    v2 = new_version(pol, {"limits": {"requests_per_minute": 10}}, part="minor", author="Pat Engineer",
                     summary="Tighten rate limit")
    assert v2["version"] == "0.2.0" and v2["status"] == "draft"
    assert v2["rollback"] == {**pol["rollback"], "previous_version": "0.1.0", "strategy": "revert_to_previous"}
    assert v2["change_history"][-1]["summary"] == "Tighten rate limit"
    assert v2["limits"]["requests_per_minute"] == 10 and pol["limits"]["requests_per_minute"] != 10
    assert validate_policy(v2) == []


def test_diff_policies(pol):
    v2 = new_version(pol, {"limits": {"requests_per_minute": 10}}, author="Pat", summary="x")
    v2["tools"]["rules"] = [r for r in v2["tools"]["rules"] if r["tool"] != "crm.delete_customer"]
    v2["tools"]["rules"][0]["parameters"]["order_id"]["regex"] = "^ORD-[0-9]{8}$"
    d = diff_policies(pol, v2)
    paths = {x["path"]: x for x in d}
    assert paths["version"]["old"] == "0.1.0" and paths["version"]["new"] == "0.2.0"
    assert paths["limits.requests_per_minute"]["new"] == 10
    assert paths["tools.rules[tool.crm-delete-customer]"]["change"] == "removed"
    assert "tools.rules[tool.crm-lookup-order].parameters.order_id.regex" in paths
    summary = summarize_diff(d)
    assert any(s.startswith("limits.requests_per_minute") for s in summary)
    assert not any(s.startswith("change_history") for s in summary)
    assert diff_policies(pol, copy.deepcopy(pol)) == []


def test_record_change_appends_without_mutating(pol):
    p2 = record_change(pol, "Pat", "note", "modified")
    assert len(p2["change_history"]) == len(pol["change_history"]) + 1


def test_full_lifecycle_requires_human_approvals(pol):
    p = transition_status(pol, "in_review", {"name": "Pat Author"})
    with pytest.raises(PermissionError, match="approvals from all required roles"):
        transition_status(p, "approved", OWNER)
    p = add_approval(p, OWNER)
    p = add_approval(p, SEC)
    with pytest.raises(PermissionError):
        transition_status(p, "approved", OWNER)          # Risk & Compliance still missing
    p = add_approval(p, RISK)
    p = transition_status(p, "approved", OWNER)
    assert p["approval"]["approved_at"] and validate_policy(p) == []
    with pytest.raises(PermissionError, match="activation"):
        transition_status(p, "active", {"name": "Random Dev", "role": "Developer"})
    p = transition_status(p, "active", SEC)
    assert p["status"] == "active" and validate_policy(p) == []
    assert [h["change_type"] for h in p["change_history"]] == ["created", "status_change", "approved", "activated"]
    p = transition_status(p, "retired", OWNER)
    assert p["status"] == "retired"


def test_illegal_transitions(pol):
    with pytest.raises(ValueError, match="illegal status transition"):
        transition_status(pol, "active", OWNER)            # draft cannot jump to active
    with pytest.raises(ValueError, match="illegal"):
        transition_status(pol, "approved", OWNER)


def test_add_approval_guards(pol):
    with pytest.raises(ValueError, match="in_review"):
        add_approval(pol, OWNER)                           # not in review yet
    p = transition_status(pol, "in_review", {"name": "Pat"})
    with pytest.raises(PermissionError, match="not a required approver role"):
        add_approval(p, {"name": "Dev", "role": "Developer"})
    with pytest.raises(PermissionError, match="separation of duties"):
        add_approval(p, {"name": "AEGIS Runtime Shield Advisor (automated draft)", "role": "AI System Owner"})
    p = add_approval(p, OWNER)
    with pytest.raises(ValueError, match="already approved"):
        add_approval(p, {"name": "Alex Owner", "role": "Security Lead"})


def test_changes_requested_clears_approvals(pol):
    p = add_approval(transition_status(pol, "in_review", {"name": "Pat"}), OWNER)
    back = transition_status(p, "draft", SEC, note="changes requested")
    assert back["approval"]["approved_by"] == [] and validate_policy(back) == []
