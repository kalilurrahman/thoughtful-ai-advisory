"""Unit tests: the 14 tools, permission declarations, audit logging, drafts and confirmations."""
from __future__ import annotations

import json

import pytest

from aegis_agent.config import PERMISSION_LEVELS, coerce_user
from aegis_agent.tools import TOOL_REGISTRY, ToolContext, ToolInputError, invoke
from agent_test_helpers import ASSESSOR, CS_PROFILE, agent  # noqa: F401

EXPECTED = {
    "search_aegis_knowledge": "read", "search_ai_inventory": "read", "create_ai_system_record": "create_draft",
    "start_assessment": "create_draft", "submit_assessment_response": "create_draft", "calculate_risk_tier": "compute",
    "identify_gaps": "compute", "recommend_controls": "compute", "create_remediation_task": "write_confirm",
    "generate_report": "create_draft", "search_runtime_logs": "read", "draft_runtime_policy": "create_draft",
    "request_human_approval": "create_draft", "export_evidence_pack": "approval_required",
}


def _ctx(agent, user=ASSESSOR):
    return ToolContext(store=agent.store, audit=agent.audit, user=coerce_user(user), trace_id="trc_test", session_id="s")


def test_registry_declares_all_14_tools_with_permissions():
    assert set(TOOL_REGISTRY) == set(EXPECTED)
    for name, spec in TOOL_REGISTRY.items():
        assert spec.permission == EXPECTED[name] and spec.permission in PERMISSION_LEVELS
        assert spec.requires_approval == (spec.permission == "approval_required")
        assert callable(spec.fn) and spec.description


def test_invoke_audits_with_trace_and_redacted_inputs(agent):
    ctx = _ctx(agent)
    invoke(ctx, "search_aegis_knowledge", query="contact jane.doe@example.com about IS-11")
    recs = agent.audit.query(action="agent.tool.search_aegis_knowledge")
    assert recs and recs[-1]["trace_id"] == "trc_test" and recs[-1]["outcome"] == "success"
    assert "jane.doe@example.com" not in json.dumps(recs[-1]) and "[REDACTED:email]" in json.dumps(recs[-1])
    assert agent.audit.verify()[0]


def test_calculate_risk_tier_is_inferred_and_needs_confirmation(agent):
    res = invoke(_ctx(agent), "calculate_risk_tier", profile=CS_PROFILE)
    assert res["tier"] == "High" and res["evidence_status"] == "Inferred" and res["requires_human_confirmation"]
    assert res["engine"] == "aegis_assessment.risk_tier"


def test_system_record_is_draft_and_assessment_flow(agent):
    ctx = _ctx(agent)
    sysrec = invoke(ctx, "create_ai_system_record", profile=CS_PROFILE)["system"]
    assert sysrec["status"] == "draft" and sysrec["risk_tier"] is None
    st = invoke(ctx, "start_assessment", system_id=sysrec["id"])
    assert st["status"] == "in_progress" and st["question_count"] >= 30
    assert invoke(ctx, "search_ai_inventory", query="helpbot")["count"] == 1
    r = invoke(ctx, "submit_assessment_response", assessment_id=st["assessment_id"], question_id="UC-SEC-Q3",
               answer="not_implemented")
    assert r["status"] == "recorded" and r["evidence_status"] == "User-asserted"
    with pytest.raises(ToolInputError):
        invoke(ctx, "submit_assessment_response", assessment_id=st["assessment_id"], question_id="UC-SEC-Q3", answer="maybe")
    with pytest.raises(ToolInputError):
        invoke(ctx, "submit_assessment_response", assessment_id=st["assessment_id"], question_id="UC-NOPE-Q1", answer="unknown")
    g = invoke(ctx, "identify_gaps", assessment_id=st["assessment_id"])
    assert any(x["question_id"] == "UC-SEC-Q3" and x["severity"] == "Critical" for x in g["gaps"])
    recs = invoke(ctx, "recommend_controls", assessment_id=st["assessment_id"], limit=3)
    assert recs["controls"][0]["id"] == "IS-15"


def test_remediation_task_requires_explicit_confirmation(agent):
    ctx = _ctx(agent)
    st = invoke(ctx, "start_assessment", profile=CS_PROFILE)
    invoke(ctx, "submit_assessment_response", assessment_id=st["assessment_id"], question_id="UC-SEC-Q3", answer="not_implemented")
    prev = invoke(ctx, "create_remediation_task", assessment_id=st["assessment_id"], severities=["Critical"])
    assert prev["status"] == "confirmation_required" and agent.store.list("tasks") == []
    prev2 = invoke(ctx, "create_remediation_task", assessment_id=st["assessment_id"], severities=["Critical"], confirmed="yes")
    assert prev2["status"] == "confirmation_required"  # only literal True counts as confirmation
    done = invoke(ctx, "create_remediation_task", assessment_id=st["assessment_id"], severities=["Critical"], confirmed=True)
    assert done["status"] == "created" and len(agent.store.list("tasks")) == done["count"] >= 1


def test_draft_runtime_policy_is_draft_not_active(agent):
    res = invoke(_ctx(agent), "draft_runtime_policy", profile=CS_PROFILE)
    assert res["status"] in ("draft", "unavailable")
    if res["status"] == "draft":
        pol = agent.store.get("policies", res["policy_id"])
        assert pol["status"] == "draft" and pol["environment"] == "non-production"
        assert res["guardrails"]


def test_request_human_approval_creates_pending_and_dedupes(agent):
    ctx = _ctx(agent)
    a = invoke(ctx, "request_human_approval", action="change_risk_tier", resource_id="sys_x", payload={"to_tier": "Low"}, reason="r")
    b = invoke(ctx, "request_human_approval", action="change_risk_tier", resource_id="sys_x", payload={"to_tier": "Low"}, reason="r")
    assert a["status"] == "pending" and b["approval_id"] == a["approval_id"] and b["deduplicated"]
    rec = agent.store.get("approvals", a["approval_id"])
    assert rec["approval_id"] == a["approval_id"] and rec["type"] == "change_risk_tier" and rec["requested_by"] == ASSESSOR["id"]
    with pytest.raises(ToolInputError):
        invoke(ctx, "request_human_approval", action="delete_everything")


def test_search_runtime_logs_redacts(agent):
    d = agent.store.root / "runtime_logs"
    d.mkdir(parents=True)
    (d / "decisions.jsonl").write_text(json.dumps({"decision": "DENY", "system": "helpbot",
                                                   "prompt": "email bob@example.com"}) + "\n")
    res = invoke(_ctx(agent), "search_runtime_logs", query="helpbot")
    assert res["count"] == 1 and "bob@example.com" not in json.dumps(res["records"])


def test_generate_report_writes_all_formats(agent, tmp_path):
    ctx = _ctx(agent)
    st = invoke(ctx, "start_assessment", profile=CS_PROFILE)
    res = invoke(ctx, "generate_report", assessment_id=st["assessment_id"], out_dir=str(tmp_path / "r"))
    assert res["status"] == "draft" and set(res["paths"]) == {"md", "pdf", "csv", "json"}
    assert all(res["paths"].values()), res["errors"]
