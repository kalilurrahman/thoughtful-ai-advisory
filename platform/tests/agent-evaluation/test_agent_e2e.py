"""End-to-end: full guided assessment of a customer-support agent reading CRM data, exported in all four formats."""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests" / "unit"))

from veritrail_common.content import controls_by_id  # noqa: E402
from veritrail_common.evidence import STANDARD_DISCLAIMER, find_prohibited_claims  # noqa: E402

from veritrail_agent import llm  # noqa: E402
from veritrail_agent.orchestrator import VeritrailAgent  # noqa: E402

ASSESSOR = {"id": "e2e-assessor", "role": "assessor", "name": "Asha Rao"}
APPROVER = {"id": "e2e-approver", "role": "approver", "name": "Dana Lee"}
SCRIPT = {  # question -> answer; anything not listed is answered "unknown"
    "UC-CORE-Q1": "implemented, evidence EV-E2E-1", "UC-CORE-Q4": "not implemented", "UC-DATA-Q3": "not implemented",
    "UC-DATA-Q4": "partial", "UC-AGT-Q2": "not implemented - shared key", "UC-AGT-Q3": "implemented, evidence EV-E2E-2",
    "UC-AGT-Q4": "implemented", "UC-FAIR-Q1": "not applicable", "UC-SEC-Q3": "partial", "UC-GEN-Q1": "no",
}


def test_full_guided_assessment_and_exports(tmp_path):
    llm.set_llm_adapter(None)
    agent = VeritrailAgent(tmp_path / "agent")
    sid = "e2e"
    try:
        r = agent.handle("I want to assess a new use case", sid, ASSESSOR)
        assert r["state"] == "intake" and r["clarifying_question"]
        r = agent.handle("A customer-support agent that reads CRM data (customer profiles and order history), drafts replies "
                         "to customers and can issue refunds with supervisor approval. It uses GPT-4o via Azure OpenAI and "
                         "serves EU customers.", sid, ASSESSOR)
        # name is the only required field that cannot be inferred
        assert r["state"] == "intake" and "name" in (r["clarifying_question"] or "").lower()
        r = agent.handle("SupportPilot", sid, ASSESSOR)
        assert r["state"] == "tier_review" and "High" in r["message"]
        r = agent.handle("continue", sid, ASSESSOR)
        assert r["state"] == "questions"
        tier_apr = r["pending_approvals"][0]["approval_id"]
        asked = 0
        while r["state"] == "questions":
            qid = next(s["id"] for s in r["sources"] if s["type"] == "question")
            r = agent.handle(SCRIPT.get(qid, "unknown"), sid, ASSESSOR)
            asked += 1
            assert asked < 80
        assert r["state"] == "complete" and r["intent"] == "assessment_complete"
        session = agent.store.get("sessions", sid)
        aid, sys_id = session["assessment_id"], session["system_id"]
        a = agent.store.get("assessments", aid)
        assert asked == len(a["questions"]) and a["status"] == "completed"
        assert {"agentic", "genai_llm", "data_privacy", "vendor_third_party"} <= {m["id"] for m in a["modules"]}

        # human steps outside the chat
        agent.review_evidence("EV-E2E-2", APPROVER)
        agent.resolve_approval(tier_apr, "approve", APPROVER)
        assert agent.store.get("systems", sys_id)["risk_tier"] == "High"

        g = agent.call_tool("identify_gaps", ASSESSOR, assessment_id=aid)
        by_q = {f["question_id"]: f for f in g["findings"]}
        assert by_q["UC-AGT-Q3"]["evidence_status"] == "Verified"
        assert by_q["UC-CORE-Q1"]["evidence_status"] == "User-asserted"         # evidence referenced, not reviewed
        assert by_q["UC-AGT-Q4"]["evidence_status"] == "User-asserted"         # claim without evidence
        assert by_q["UC-AGT-Q2"]["evidence_status"] == "Critical gap" and by_q["UC-AGT-Q2"]["severity"] == "Critical"
        assert by_q["UC-DATA-Q4"]["evidence_status"] == "Missing evidence"
        assert all(c in controls_by_id() for f in g["findings"] for c in f["controls"])

        r = agent.handle("generate report", sid, ASSESSOR)
        paths = r["data"]["paths"]
        assert set(paths) == {"md", "pdf", "csv", "json"} and all(Path(p).exists() for p in paths.values())
        md = Path(paths["md"]).read_text(encoding="utf-8")
        assert "SupportPilot" in md and STANDARD_DISCLAIMER in md and not find_prohibited_claims(md)
        assert "Confirmed by Dana Lee" in md                                    # tier confirmation recorded
        for sec in ("Executive summary", "AI system profile", "Risk tier and rationale", "Domain heat map", "Gap register",
                    "Control recommendations", "Remediation roadmap", "Audit-ready evidence checklist",
                    "Runtime guardrail recommendations", "Appendix B — Audit trace"):
            assert sec in md, sec
        assert Path(paths["pdf"]).read_bytes()[:5] == b"%PDF-"
        rows = list(csv.DictReader(open(paths["csv"], encoding="utf-8")))
        assert len(rows) == g["summary"]["gaps"] and rows[0]["severity"] == "Critical"
        data = json.loads(Path(paths["json"]).read_text(encoding="utf-8"))
        assert data["assessment_id"] == aid and data["audit_trace"]
        # every tool call and turn is in the hash-chained audit log
        assert agent.audit.verify()[0]
        actions = {rec["action"] for rec in agent.audit.records()}
        assert {"agent.turn", "agent.tool.start_assessment", "agent.tool.submit_assessment_response",
                "agent.tool.identify_gaps", "agent.tool.generate_report", "approval.approved", "evidence.reviewed"} <= actions
    finally:
        llm.reset_llm_adapter()


def test_sample_run_generator(tmp_path):
    from veritrail_agent.sample_run import run_sample
    s = run_sample(tmp_path / "out", tmp_path / "data")
    assert s["synthetic"] and s["audit_chain_valid"] and not s["report_errors"]
    for p in s["report"].values():
        assert Path(p).exists()
    t = Path(s["transcript"]).read_text(encoding="utf-8")
    assert "Synthetic example" in t and not find_prohibited_claims(t)
