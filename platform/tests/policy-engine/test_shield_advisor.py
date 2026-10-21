"""Runtime Shield Advisor outputs for low / medium / high-risk profiles."""
from __future__ import annotations

import copy
import json

import pytest

from aegis_common.content import get_control
from aegis_common.evidence import EvidenceStatus, find_prohibited_claims
from aegis_policy.engine import PolicyEngine
from aegis_policy.schema import validate_policy
from aegis_shield.advisor import advise
from aegis_shield.examples import (
    AUTONOMOUS_HIGH_RISK_PROFILE,
    CUSTOMER_SUPPORT_PROFILE,
    FINANCIAL_OPS_PROFILE,
    INTERNAL_RAG_PROFILE,
)
from aegis_shield.render import render_advice_markdown

CONTRACT_KEYS = {"risk_profile", "tool_matrix", "data_handling", "approval_rules", "limits", "monitoring",
                 "incident_response", "rollout", "citations", "policy"}
LABELS = {s.value for s in EvidenceStatus}

MEDIUM_PROFILE = {
    "app_name": "Order Status FAQ Bot",
    "purpose": "Answer customer questions about order status",
    "users": ["Retail customers"],
    "model": "gpt-4o-mini", "vendor": "OpenAI",
    "tools": [{"name": "orders.get_status", "operation": "read",
               "parameters": {"order_id": {"type": "string", "regex": "^ORD-[0-9]{6}$", "required": True}}}],
    "data_categories": ["Customer contact details", "Order history"],
    "autonomy": "suggests", "human_approval_model": "none", "environment": "production",
    "risk_tier": "Medium", "affected_parties": "customers",
    "regulatory_obligations": ["GDPR"], "customer_obligations": [], "existing_controls": ["SSO"],
}

PROFILES = {
    "low": INTERNAL_RAG_PROFILE,
    "medium": MEDIUM_PROFILE,
    "high": FINANCIAL_OPS_PROFILE,
    "critical": AUTONOMOUS_HIGH_RISK_PROFILE,
    "support": CUSTOMER_SUPPORT_PROFILE,
    "empty": {},
}


@pytest.fixture(scope="module")
def outputs():
    return {k: advise(copy.deepcopy(p)) for k, p in PROFILES.items()}


def _walk_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from _walk_strings(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _walk_strings(v)


@pytest.mark.parametrize("key", list(PROFILES))
def test_contract_keys_and_json_serializable(outputs, key):
    a = outputs[key]
    assert CONTRACT_KEYS <= set(a)
    assert {"missing_inputs", "clarifying_questions", "evidence", "policy_yaml", "policy_json"} <= set(a)
    assert "_normalized" not in a
    json.loads(json.dumps(a))  # strictly JSON-serializable


@pytest.mark.parametrize("key,rating,tier", [
    ("low", "Low", "Low"), ("medium", "Medium", "Medium"), ("high", "High", "High"),
    ("critical", "Critical", "High"), ("support", "High", "High"),
])
def test_overall_rating(outputs, key, rating, tier):
    r = outputs[key]["risk_profile"]
    assert r["overall"]["rating"] == rating, r["overall"]["rationale"]
    assert r["inferred_risk_tier"] == tier
    assert r["evidence_status"] == "Inferred" and r["requires_human_confirmation"] is True
    for dim in ("autonomy", "blast_radius", "data_exposure", "tool_risk"):
        assert r[dim]["level"] in ("Low", "Medium", "High", "Critical") and r[dim]["rationale"]


def test_tier_mismatch_flagged_but_not_changed(outputs):
    r = outputs["support"]["risk_profile"]
    assert r["user_asserted_risk_tier"] == "Medium" and r["inferred_risk_tier"] == "High" and r["tier_mismatch"]
    assert "requires human approval" in r["overall"]["rationale"]
    # the policy keeps the registered (asserted) tier as scope; AEGIS does not change it
    assert outputs["support"]["policy"]["applies_to"]["risk_tier"] == ["Medium"]


@pytest.mark.parametrize("key", list(PROFILES))
def test_generated_policy_is_valid_draft_observe_and_unapproved(outputs, key):
    p = outputs[key]["policy"]
    assert validate_policy(p) == []
    assert outputs[key]["policy_validation"]["valid"] is True
    assert p["status"] == "draft" and p["rollout"]["mode"] == "observe"
    assert p["approval"]["approved_by"] == [] and p["approval"]["approved_at"] is None
    assert p["tools"]["default_action"] == "DENY"
    assert p["logging"]["immutable_audit"] is True
    assert outputs[key]["requires_human_approval"] is True
    assert outputs[key]["activation"].startswith("Not activated")
    assert json.loads(outputs[key]["policy_json"]) == p


def test_approver_roles_scale_with_risk(outputs):
    assert outputs["low"]["policy"]["approval"]["required_approver_roles"] == ["AI System Owner"]
    assert len(outputs["medium"]["policy"]["approval"]["required_approver_roles"]) == 2
    assert len(outputs["high"]["policy"]["approval"]["required_approver_roles"]) == 3


@pytest.mark.parametrize("key", list(PROFILES))
def test_all_citations_are_real_control_ids(outputs, key):
    a = outputs[key]
    assert a["citations"], "every output must cite controls"
    for c in a["citations"]:
        assert get_control(c) is not None, c
    assert {d["id"] for d in a["citation_details"]} == set(a["citations"])
    for m in a["tool_matrix"]:
        assert m["citations"]
    for rule in a["approval_rules"] + a["data_handling"]["rules"]:
        assert rule["citations"]


def test_expected_core_controls_cited(outputs):
    cits = set(outputs["support"]["citations"])
    assert {"IS-11", "IS-12", "IS-13", "IS-04", "IS-14", "IS-15", "IS-16", "SE-08", "EI-07"} <= cits


@pytest.mark.parametrize("key", list(PROFILES))
def test_evidence_labels(outputs, key):
    ev = outputs[key]["evidence"]
    assert all(it["status"] in LABELS for it in ev["items"])
    assert not any(it["status"] == "Verified" for it in ev["items"])   # nothing human-reviewed here
    assert outputs[key]["evidence_status"] == "Inferred"
    assert all(m["evidence_status"] == "Inferred" for m in outputs[key]["tool_matrix"])


def test_user_facts_are_user_asserted(outputs):
    items = outputs["support"]["evidence"]["items"]
    asserted = [i["item"] for i in items if i["status"] == "User-asserted"]
    assert any("Tool 'payments.issue_refund' performs 'payment'" in i for i in asserted)
    assert any("Okta SSO" in i for i in asserted)
    assert any("Risk tier: Medium" in i for i in asserted)


def test_low_risk_profile(outputs):
    a = outputs["low"]
    assert [m["decision"] for m in a["tool_matrix"]] == ["allowed"]
    assert a["limits"]["requests_per_minute"] == 120
    assert a["incident_response"]["kill_switch"]["target_time_to_disable_minutes"] == 60
    assert a["evidence"]["counts"].get("Critical gap", 0) == 0


def test_medium_risk_profile(outputs):
    a = outputs["medium"]
    m = a["tool_matrix"][0]
    assert m["decision"] == "conditional" and m["engine_action"] == "ALLOW"   # personal data read
    assert a["limits"]["requests_per_minute"] == 60
    assert "transform.ai_disclosure" in {t["id"] for t in a["policy"]["content"]["transforms"]}


def test_high_risk_financial_profile(outputs):
    a = outputs["high"]
    by = {m["tool"]: m for m in a["tool_matrix"]}
    assert by["payments.schedule_payment"]["decision"] == "approval"
    assert by["payments.schedule_payment"]["approval_roles"] == ["Finance Controller"]
    assert by["vendor_master.update_bank_details"]["decision"] == "approval"
    assert by["reports.export_ledger"]["decision"] == "approval"
    assert by["erp.get_invoice"]["decision"] == "conditional"
    assert a["limits"]["cost_per_month_usd"] == 4000 and a["limits"]["evidence_status"] == "User-asserted"
    assert a["incident_response"]["kill_switch"]["target_time_to_disable_minutes"] == 5
    assert a["monitoring"]["review_cadence"]["policy_review"] == "monthly"


def test_critical_autonomous_profile_denies_irreversible_tools(outputs):
    a = outputs["critical"]
    by = {m["tool"]: m for m in a["tool_matrix"]}
    assert by["payments.wire_transfer"]["decision"] == "denied"
    assert by["email.notify_counterparty"]["decision"] == "denied"
    assert by["mystery_tool"]["operation"] == "unknown" and by["mystery_tool"]["decision"] == "denied"
    assert set(a["policy"]["tools"]["deny_list"]) >= {"payments.wire_transfer", "mystery_tool"}
    gaps = [i for i in a["evidence"]["items"] if i["status"] == "Critical gap"]
    assert gaps and "IS-13" in gaps[0]["citations"]
    qs = " ".join(q["question"] for q in a["clarifying_questions"])
    assert "mystery_tool" in qs and "inferred" in qs


def test_customer_support_refund_threshold(outputs):
    by = {m["tool"]: m for m in outputs["support"]["tool_matrix"]}
    refund = by["payments.issue_refund"]
    assert refund["decision"] == "conditional"
    assert refund["require_approval_if"] == [{"param": "amount", "op": "gt", "value": 50,
                                              "reason": "amount above auto-approval threshold 50"}]
    assert refund["parameters"]["amount"]["max"] == 500
    assert by["crm.delete_customer"]["decision"] == "approval"
    assert by["kb.search"]["decision"] == "allowed"


def test_empty_profile_is_conservative_and_asks_questions(outputs):
    a = outputs["empty"]
    assert len(a["missing_inputs"]) == 16
    assert all(m["status"] == "Missing evidence" for m in a["missing_inputs"])
    assert len(a["clarifying_questions"]) >= 16
    assumed = {x["field"]: x["assumed"] for x in a["assumptions"]}
    assert assumed["autonomy"] == "acts_autonomously" and assumed["environment"] == "production"
    assert a["policy"]["tools"]["rules"] == []


def test_rollout_plan_has_five_stages_with_exit_criteria(outputs):
    ro = outputs["support"]["rollout"]
    assert [s["mode"] for s in ro["stages"]] == ["observe", "warn", "protect", "enforce", "contain"]
    assert all(s["exit_criteria"] and s["entry_criteria"] and s["citations"] for s in ro["stages"])
    assert ro["recommended_start_mode"] == "observe"
    assert "never promotes or activates" in ro["promotion_rule"]


def test_monitoring_and_incident_sections(outputs):
    a = outputs["support"]
    metrics = {m["metric"] for m in a["monitoring"]["metrics"]}
    assert {"would_be_block_rate", "false_positive_rate", "approval_queue", "kill_switch_time_to_disable"} <= metrics
    assert any(al["alert"] == "audit_chain_broken" for al in a["monitoring"]["alerts"])
    ks = a["incident_response"]["kill_switch"]
    assert set(ks["scopes"]) == {"agent", "tool", "model", "tenant"}
    assert "overrides" in ks["precedence"]
    assert {p["id"] for p in a["incident_response"]["playbooks"]} >= {"ir.prompt_injection", "ir.data_leakage"}


def test_tool_operation_inference_from_strings():
    a = advise({"app_name": "X", "tools": ["kb.search", "tickets.update_status", "billing.issue_refund",
                                           "users.delete", "reports.export_csv", "slack.send_message", "zzz"]})
    ops = {m["tool"]: (m["operation"], m["operation_evidence"]) for m in a["tool_matrix"]}
    assert ops == {
        "kb.search": ("read", "Inferred"), "tickets.update_status": ("write", "Inferred"),
        "billing.issue_refund": ("payment", "Inferred"), "users.delete": ("delete", "Inferred"),
        "reports.export_csv": ("export", "Inferred"), "slack.send_message": ("external_send", "Inferred"),
        "zzz": ("unknown", "Missing evidence"),
    }


def test_sensitivity_upgraded_from_categories():
    a = advise({"app_name": "Clinic bot", "data_sensitivity": "internal", "data_categories": ["patient notes"],
                "vendor": "SomeVendor", "tools": [{"name": "notes.export", "operation": "export"}],
                "autonomy": "suggests", "human_approval_model": "none"})
    assert a["app"]["data_sensitivity"] == "special_category"
    assert a["policy"]["logging"]["prompt_logging"] == "metadata"
    assert any(i["status"] == "Critical gap" and "Special-category" in i["item"] for i in a["evidence"]["items"])
    assert {m["tool"]: m["decision"] for m in a["tool_matrix"]} == {"notes.export": "denied"}


@pytest.mark.parametrize("key", list(PROFILES))
def test_no_prohibited_compliance_claims(outputs, key):
    a = outputs[key]
    text = "\n".join(_walk_strings(a))
    assert find_prohibited_claims(text) == []
    md = render_advice_markdown(a)
    assert find_prohibited_claims(md) == []
    assert "does not certify" in md


def test_markdown_render_labels_synthetic(outputs):
    md = render_advice_markdown(outputs["support"])
    assert "Synthetic example" in md
    assert "## 2. Tool permission matrix" in md and "```yaml" in md
    md_real = render_advice_markdown(outputs["medium"])
    assert "Synthetic example" not in md_real


def test_advise_does_not_mutate_input():
    p = copy.deepcopy(CUSTOMER_SUPPORT_PROFILE)
    advise(p)
    assert p == CUSTOMER_SUPPORT_PROFILE


def test_generated_support_policy_enforces_refund_rules(tmp_path, outputs):
    """Integration: the advisor's draft policy, promoted to enforce in a test, behaves as advised."""
    pol = copy.deepcopy(outputs["support"]["policy"])
    pol["rollout"]["mode"] = "enforce"
    e = PolicyEngine(pol, tmp_path / "a.jsonl",
                     default_context={"agent_name": "northwind-support-agent", "environment": "production",
                                      "risk_tier": "Medium", "model": "gpt-4o-2024-08-06"})
    ident = {"sub": "agent-7", "tenant_id": "northwind", "roles": ["support_agent"]}

    def refund(amount):
        return e.evaluate({"type": "tool_call", "tool": "payments.issue_refund", "identity": ident,
                           "session": {"id": "s"}, "params": {"order_id": "ORD-1234567", "amount": amount,
                                                              "currency": "USD", "reason_code": "late_delivery"}})
    assert refund(20).decision == "ALLOW"
    assert refund(120).decision == "REQUIRE_HUMAN_APPROVAL"
    assert refund(900).decision == "DENY"
    d = e.evaluate({"type": "tool_call", "tool": "crm.export_all", "params": {}, "identity": ident})
    assert d.decision == "DENY" and "tools.default" in d.matched_rules


def test_website_form_tool_format_and_overall_rating_alias():
    a = advise({"app_name": "Form test", "tools": "crm_lookup:read\nsend_email:external_send\nmystery",
                "environment": "development"})
    ops = {m["tool"]: (m["operation"], m["operation_evidence"]) for m in a["tool_matrix"]}
    assert ops["crm_lookup"] == ("read", "User-asserted")
    assert ops["send_email"] == ("external_send", "User-asserted")
    assert ops["mystery"][0] == "unknown"
    assert a["app"]["environment"] == "dev"
    assert a["risk_profile"]["overall_rating"] == a["risk_profile"]["overall"]["rating"]


def test_agent_shaped_profile_is_accepted():
    """Shape produced by the AEGIS Agent's draft_runtime_policy tool (aliases and description hints)."""
    a = advise({"app_name": "Claims triage", "purpose": "Triage insurance claims",
                "tools": [{"name": "claims_db", "description": "claims_db (read)"},
                          {"name": "payout", "description": "payout (payment)"}],
                "data_sensitivity": "personal", "autonomy": "acts_with_approval",
                "human_approval_model": "high_impact_only", "risk_tier": "High", "vendor": "Third-party"})
    by = {m["tool"]: m for m in a["tool_matrix"]}
    assert by["claims_db"]["operation"] == "read" and by["payout"]["operation"] == "payment"
    assert by["payout"]["decision"] == "approval"
    assert a["policy"]["status"] == "draft"
