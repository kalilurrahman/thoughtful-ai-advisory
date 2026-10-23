"""Unit tests: gap classification (evidence labels), severity, SLA due dates, roadmap, heat map."""
from __future__ import annotations

from datetime import date

from veritrail_common.content import get_control
from veritrail_common.evidence import GAP_SEVERITY_SLA_DAYS

from veritrail_agent import gaps
from veritrail_agent.question_bank import get_question

AS_OF = date(2026, 10, 21)


def _assessment(responses: dict, tier="High", questions=None):
    return {"id": "asm_t", "system_id": "sys_t", "risk": {"tier": tier},
            "questions": questions or list(responses), "responses": responses}


def _lookup(reviewed: dict):
    return lambda ref: reviewed.get(ref)


def _finding(res, qid):
    return next(f for f in res["findings"] if f["question_id"] == qid)


def test_verified_requires_reviewed_evidence_by_named_reviewer():
    a = _assessment({"UC-AGT-Q3": {"answer": "implemented", "evidence_refs": ["EV-1"]}})
    unreviewed = gaps.identify_gaps(a, _lookup({"EV-1": {"id": "evd_1", "reviewed_by": None}}), AS_OF)
    f = _finding(unreviewed, "UC-AGT-Q3")
    assert f["evidence_status"] == "User-asserted" and f["is_gap"] and f["severity"] == "Low"
    reviewed = gaps.identify_gaps(a, _lookup({"EV-1": {"id": "evd_1", "reviewed_by": "Dana Lee", "review_status": "accepted"}}), AS_OF)
    f = _finding(reviewed, "UC-AGT-Q3")
    assert f["evidence_status"] == "Verified" and not f["is_gap"] and f["severity"] is None
    rejected = gaps.identify_gaps(a, _lookup({"EV-1": {"id": "evd_1", "reviewed_by": "Dana Lee", "review_status": "rejected"}}), AS_OF)
    assert _finding(rejected, "UC-AGT-Q3")["evidence_status"] == "User-asserted"


def test_claim_without_evidence_is_user_asserted_and_capped_at_medium():
    res = gaps.identify_gaps(_assessment({"UC-AGT-Q2": {"answer": "implemented"}}, tier="Prohibited-review"), as_of=AS_OF)
    f = _finding(res, "UC-AGT-Q2")
    assert f["evidence_status"] == "User-asserted" and f["gap_type"] == "evidence" and f["severity"] == "Medium"


def test_not_implemented_critical_question_is_critical_gap_at_high_tier():
    res = gaps.identify_gaps(_assessment({"UC-SEC-Q3": {"answer": "not_implemented"}}), as_of=AS_OF)
    f = _finding(res, "UC-SEC-Q3")
    assert f["severity"] == "Critical" and f["evidence_status"] == "Critical gap"
    assert f["due_date"] == "2026-11-20" and f["sla_days"] == GAP_SEVERITY_SLA_DAYS["Critical"]
    assert f["owner_role"] == get_control("IS-15")["owner_role"]
    assert f["horizon"] == "30"


def test_severity_scales_with_tier():
    sev = {t: _finding(gaps.identify_gaps(_assessment({"UC-CORE-Q2": {"answer": "not_implemented"}}, tier=t), as_of=AS_OF),
                       "UC-CORE-Q2")["severity"] for t in ("Low", "Medium", "High")}
    order = ["Low", "Medium", "High", "Critical"]
    assert order.index(sev["Low"]) <= order.index(sev["Medium"]) <= order.index(sev["High"])


def test_unknown_and_partial_are_missing_evidence():
    res = gaps.identify_gaps(_assessment({"UC-CORE-Q2": {"answer": "unknown"}, "UC-CORE-Q5": {"answer": "partial"}}), as_of=AS_OF)
    assert {_finding(res, q)["evidence_status"] for q in ("UC-CORE-Q2", "UC-CORE-Q5")} == {"Missing evidence"}


def test_unanswered_is_inferred_gap():
    res = gaps.identify_gaps(_assessment({}, questions=["UC-CORE-Q1"]), as_of=AS_OF)
    f = _finding(res, "UC-CORE-Q1")
    assert f["answer"] == "unanswered" and f["evidence_status"] == "Inferred" and f["is_gap"]


def test_not_applicable_is_self_declared_not_gap():
    res = gaps.identify_gaps(_assessment({"UC-FAIR-Q1": {"answer": "not_applicable"}}), as_of=AS_OF)
    f = _finding(res, "UC-FAIR-Q1")
    assert f["evidence_status"] == "User-asserted" and not f["is_gap"]


def test_gap_ordering_ids_and_mappings():
    res = gaps.identify_gaps(_assessment({"UC-CORE-Q2": {"answer": "partial"}, "UC-SEC-Q3": {"answer": "not_implemented"},
                                          "UC-GEN-Q3": {"answer": "implemented"}}), as_of=AS_OF)
    assert [g["gap_id"] for g in res["gaps"]] == ["GAP-001", "GAP-002", "GAP-003"]
    assert res["gaps"][0]["question_id"] == "UC-SEC-Q3"
    assert res["gaps"][0]["framework_mappings"]["eu_ai_act"] == get_control("IS-15")["mappings"]["eu_ai_act"]
    assert res["summary"]["by_severity"]["Critical"] == 1


def test_recommend_controls_heat_map_roadmap():
    qs = ["UC-SEC-Q3", "UC-CORE-Q2", "UC-AGT-Q3"]
    res = gaps.identify_gaps(_assessment({"UC-SEC-Q3": {"answer": "not_implemented"}, "UC-CORE-Q2": {"answer": "partial"},
                                          "UC-AGT-Q3": {"answer": "implemented"}}, questions=qs), as_of=AS_OF)
    recs = gaps.recommend_controls_from_gaps(res["gaps"])
    assert recs[0]["id"] == "IS-15" and recs[0]["highest_severity"] == "Critical"
    hm = {r["domain"]: r for r in gaps.heat_map(res["findings"])}
    assert hm["security"]["rating"] == "Critical exposure"
    rm = gaps.roadmap(res["gaps"])
    assert set(rm) == {"30", "60", "90", "backlog"} and rm["30"][0]["gap_id"] == "GAP-001"


def test_every_question_classifies_for_every_answer():
    for qid in ("UC-CORE-Q1", "UC-DATA-Q3", "UC-AGT-Q4", "UC-VEN-Q2"):
        q = get_question(qid)
        for ans in ("implemented", "partial", "not_implemented", "unknown", "not_applicable", None):
            f = gaps.classify_response(q, {"answer": ans} if ans else None, "Medium", lambda r: None)
            assert f["evidence_status"] in {"Verified", "User-asserted", "Inferred", "Missing evidence", "Critical gap"}
