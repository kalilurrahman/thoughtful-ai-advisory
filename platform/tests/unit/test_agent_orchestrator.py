"""Unit tests: orchestrator journeys — Ask AEGIS answer structure, guided state machine, sessions."""
from __future__ import annotations

from aegis_common.content import controls_by_id
from aegis_common.evidence import NO_SOURCE_MESSAGE, find_prohibited_claims

from agent_test_helpers import ASSESSOR, CS_DESCRIPTION, VIEWER, agent, run_guided  # noqa: F401

ANSWER_KEYS = {"session_id", "trace_id", "intent", "state", "answer", "message", "claims", "sources", "citations",
               "missing_evidence", "next_actions", "required_approvals", "pending_approvals", "cta",
               "clarifying_question", "confidence", "tool_calls", "disclaimer"}


def test_answer_structure_and_citations(agent):
    r = agent.handle("What does IS-13 require?", "s1", ASSESSOR)
    assert ANSWER_KEYS <= set(r)
    assert "IS-13" in r["citations"] and all(c in controls_by_id() for c in r["citations"])
    ctrl = next(s for s in r["sources"] if s["type"] == "control" and s["id"] == "IS-13")
    assert ctrl["mappings"]["eu_ai_act"] == ["Art. 14"]           # framework mappings from controls.yaml
    assert r["claims"] and r["claims"][0]["evidence_status"] == "Missing evidence"
    assert r["missing_evidence"] and r["next_actions"] and r["cta"]["url"]
    assert any(s["type"] == "question" for s in r["sources"])     # question IDs cited


def test_retrieval_answer_cites_policy_pack_version(agent):
    r = agent.handle("What does the customer-support agent runtime policy pack say about refunds?", "s1", ASSESSOR)
    pol = [s for s in r["sources"] if s["type"] == "policy"]
    assert pol and pol[0]["policy_id"] and pol[0]["policy_version"]


def test_low_confidence_returns_exact_no_source_message(agent):
    r = agent.handle("Which controls map to EU AI Act Art. 99?", "s1", ASSESSOR)
    assert NO_SOURCE_MESSAGE in r["message"]
    r = agent.handle("Tell me about quantum blockchain synergy paradigms in AI", "s1", ASSESSOR)
    assert NO_SOURCE_MESSAGE in r["message"] or r["clarifying_question"]


def test_compliance_question_gets_readiness_framing(agent):
    for q in ("Are we EU AI Act compliant?", "Certify us for ISO 42001", "Is our chatbot GDPR compliant?"):
        r = agent.handle(q, "s1", ASSESSOR)
        assert r["intent"] == "compliance_readiness", q
        assert "cannot determine" in r["message"] and not find_prohibited_claims(r["message"])
        assert r["disclaimer"]


def test_guided_flow_state_machine(agent):
    r = agent.handle("assess a use case", "g", ASSESSOR)
    assert r["state"] == "intake" and r["clarifying_question"]
    r = agent.handle(CS_DESCRIPTION.split(":", 1)[1], "g", ASSESSOR)
    assert r["state"] == "tier_review" and "Preliminary risk tier: High" in r["message"]
    r = agent.handle("autonomy: suggests", "g", ASSESSOR)               # correction recalculates
    assert r["state"] == "tier_review"
    r = agent.handle("autonomy: acts_with_approval", "g", ASSESSOR)
    r = agent.handle("continue", "g", ASSESSOR)
    assert r["state"] == "questions" and r["pending_approvals"][0]["type"] == "confirm_risk_tier"
    first_q = next(s["id"] for s in r["sources"] if s["type"] == "question")
    r = agent.handle("implemented, evidence EV-1", "g", ASSESSOR)
    assert first_q in r["message"] and "pending named review" in r["message"]
    r = agent.handle("What does SE-08 require?", "g", ASSESSOR)          # side question re-prompts
    assert r["intent"] == "control_lookup" and "Back to the assessment" in r["message"] and r["state"] == "questions"
    r = agent.handle("skip", "g", ASSESSOR)
    assert "Inferred" in r["message"]
    r = agent.handle("remaining: partial", "g", ASSESSOR)
    assert r["state"] == "complete" and r["intent"] == "assessment_complete"
    assert all(c["evidence_status"] in {"Verified", "User-asserted", "Inferred", "Missing evidence", "Critical gap"}
               for c in r["claims"])


def test_intake_reprompts_on_unparseable_answer(agent):
    agent.handle("assess a use case: an internal assistant called DocHelper that summarises internal documents for employees",
                 "i", ASSESSOR)
    r = agent.handle("purple", "i", ASSESSOR)
    assert r["intent"] == "clarify" and r["clarifying_question"] and r["state"] == "intake"


def test_cancel_resets_guided_flow(agent):
    agent.handle(CS_DESCRIPTION, "c", ASSESSOR)
    r = agent.handle("cancel", "c", ASSESSOR)
    assert r["state"] == "idle"


def test_post_assessment_intents(agent):
    run_guided(agent, "p")
    r = agent.handle("show me the gap analysis", "p", ASSESSOR)
    assert r["intent"] == "gap_analysis" and "GAP-001" in r["message"]
    r = agent.handle("create remediation tasks for high gaps", "p", ASSESSOR)
    assert r["data"]["status"] == "confirmation_required" and not agent.store.list("tasks")
    r = agent.handle("confirm", "p", ASSESSOR)
    assert agent.store.list("tasks") and r["data"]["status"] == "created"
    r = agent.handle("generate report", "p", ASSESSOR)
    assert r["intent"] == "report" and set(r["data"]["paths"]) == {"md", "pdf", "csv", "json"}


def test_viewer_gets_preview_only(agent):
    r = agent.handle(CS_DESCRIPTION, "v", VIEWER)
    assert r["state"] == "preview_complete" and "IS-13" in r["citations"]
    assert agent.store.list("systems") == [] and agent.store.list("assessments") == []


def test_sessions_are_isolated_per_user(agent):
    run_guided(agent, "shared")
    r = agent.handle("show me the gap analysis", "shared", {"id": "intruder", "role": "assessor"})
    assert r["session_id"] != "shared" and r["intent"] == "clarify"
    assert agent.audit.query(action="agent.security.session_mismatch")


def test_every_turn_is_audited_with_trace(agent):
    r = agent.handle("What does IS-11 require?", "a", ASSESSOR)
    turns = agent.audit.query(action="agent.turn", trace_id=r["trace_id"])
    assert len(turns) == 1 and turns[0]["details"]["intent"] == "control_lookup"
    assert agent.audit.verify()[0]


def test_out_of_scope_and_help(agent):
    r = agent.handle("Give me a lasagna recipe", "o", ASSESSOR)
    assert r["intent"] == "out_of_scope" and NO_SOURCE_MESSAGE in r["message"]
    assert agent.handle("help", "o", ASSESSOR)["intent"] == "help"
