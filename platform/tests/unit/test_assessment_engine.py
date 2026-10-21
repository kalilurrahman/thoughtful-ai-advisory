import itertools
import random

import pytest

from aegis_assessment.engine import (AssessmentInputError, preliminary_result, round_half_up_1dp,
                                     score_assessment)
from aegis_common.content import controls_by_id, load_assessment_template
from aegis_common.evidence import find_prohibited_claims

T = load_assessment_template()
QIDS = [q["id"] for q in T["questions"]]


def answers(v=3, **over):
    a = {q: v for q in QIDS}
    a.update({k.replace("_", "-"): x for k, x in over.items()})
    return a


def test_template_shape():
    assert len(T["questions"]) == 24
    assert len(T["domains"]) == 8
    assert sum(d["weight"] for d in T["domains"]) == 100
    weights = {d["name"]: d["weight"] for d in T["domains"]}
    assert weights == {
        "Strategy & Accountability": 12, "AI Inventory & Visibility": 14, "Risk Management & Lifecycle": 14,
        "Data & Privacy": 12, "Security & Resilience": 14, "Fairness, Safety & Transparency": 12,
        "Human Oversight & Operations": 12, "Assurance, Evidence & Improvement": 10}
    for d in T["domains"]:
        assert sum(1 for q in T["questions"] if q["domain"] == d["id"]) == 3
    assert [s["score"] for s in T["scale"]] == [1, 2, 3, 4, 5]


def test_all_template_control_ids_exist():
    lib = controls_by_id()
    for q in T["questions"]:
        assert q["controls"] and all(c in lib for c in q["controls"])
    for f in T["critical_flags"]:
        assert all(c in lib for c in f["controls"])


@pytest.mark.parametrize("v,expected,level", [(1, 20.0, "Initial"), (2, 40.0, "Developing"), (3, 60.0, "Defined"),
                                               (4, 80.0, "Managed"), (5, 100.0, "Optimized")])
def test_uniform_answers(v, expected, level):
    r = score_assessment(answers(v), {})
    assert r["overall_score"] == expected
    assert r["maturity_level"] == level
    assert all(d["score"] == expected for d in r["domains"])


def test_round_half_up():
    assert round_half_up_1dp(1, 4) == 0.3  # 0.25 -> 0.3 (not banker's 0.2)
    assert round_half_up_1dp(140, 3) == 46.7
    assert round_half_up_1dp(100, 15) == 6.7


def test_weighted_overall_exact():
    # Only inventory (w14) at 5, others at 1 -> 20 + (100-20)*0.14 = 31.2
    a = answers(1, **{"INV_Q1": 5, "INV_Q2": 5, "INV_Q3": 5})
    r = score_assessment(a, {})
    assert r["overall_score"] == 31.2
    assert r["maturity_level"] == "Initial"


def test_overall_matches_float_formula_randomised():
    rnd = random.Random(42)
    for _ in range(300):
        a = {q: rnd.randint(1, 5) for q in QIDS}
        r = score_assessment(a, {})
        exp = 0.0
        for d in T["domains"]:
            qs = [q["id"] for q in T["questions"] if q["domain"] == d["id"]]
            exp += sum(a[q] for q in qs) / (5 * len(qs)) * 100 * d["weight"] / 100
        assert abs(r["overall_score"] - exp) <= 0.05 + 1e-9


def test_level_boundaries():
    levels = T["scoring"]["levels"]
    from aegis_assessment.engine import _level_for
    assert _level_for(39.9, levels)["name"] == "Initial"
    assert _level_for(40.0, levels)["name"] == "Developing"
    assert _level_for(59.9, levels)["name"] == "Developing"
    assert _level_for(60.0, levels)["name"] == "Defined"
    assert _level_for(74.9, levels)["name"] == "Defined"
    assert _level_for(75.0, levels)["name"] == "Managed"
    assert _level_for(89.9, levels)["name"] == "Managed"
    assert _level_for(90.0, levels)["name"] == "Optimized"


def test_strengths_and_gaps_ordering_and_limits():
    a = answers(3)
    a.update({"SEC-Q2": 1, "INV-Q1": 1, "STR-Q1": 1, "ASR-Q1": 2, "DAT-Q3": 2, "HUM-Q1": 2})
    a.update({"FST-Q2": 5, "RSK-Q1": 4, "SEC-Q1": 5})
    r = score_assessment(a, {})
    gaps = [g["question_id"] for g in r["gaps"]]
    # score asc, then weight desc (INV 14 & SEC 14 before STR 12), then order
    assert gaps[:3] == ["INV-Q1", "SEC-Q2", "STR-Q1"]
    assert len(gaps) == 5
    assert all(g["action"] and g["controls"] for g in r["gaps"])
    strengths = [s["question_id"] for s in r["strengths"]]
    assert strengths == ["SEC-Q1", "FST-Q2", "RSK-Q1"]


def test_critical_flags_profile_conditions():
    a = answers(4, SEC_Q2=1, FST_Q2=2)
    assert not any(f["id"] == "FLAG-AGENTS-UNTESTED" for f in score_assessment(a, {"uses_agents": False})["critical_flags"])
    flags = {f["id"] for f in score_assessment(a, {"uses_agents": True, "eu_operations": True})["critical_flags"]}
    assert {"FLAG-AGENTS-UNTESTED", "FLAG-EU-TRANSPARENCY"} <= flags
    # string booleans from forms are normalised
    flags2 = {f["id"] for f in score_assessment(a, {"uses_agents": "yes", "eu_operations": "true"})["critical_flags"]}
    assert flags == flags2


def test_flags_are_user_asserted():
    r = score_assessment(answers(1), {"uses_agents": True, "eu_operations": True})
    assert len(r["critical_flags"]) == len(T["critical_flags"])
    assert all(f["evidence_status"] == "User-asserted" for f in r["critical_flags"])
    assert r["evidence_status"] == "User-asserted"


def test_action_plan_horizons():
    a = answers(5)
    a.update({"INV-Q1": 1, "RSK-Q1": 3, "SEC-Q3": 4})
    r = score_assessment(a, {})
    assert [x["question_id"] for x in r["action_plan"]["30"]] == ["INV-Q1"]
    assert [x["question_id"] for x in r["action_plan"]["60"]] == ["RSK-Q1"]
    assert [x["question_id"] for x in r["action_plan"]["90"]] == ["SEC-Q3"]
    assert all(len(v) <= 5 for v in score_assessment(answers(1), {})["action_plan"].values())


def test_recommended_controls_dedup_and_cited():
    r = score_assessment(answers(1), {"uses_agents": True})
    ids = [c["id"] for c in r["recommended_controls"]]
    assert len(ids) == len(set(ids)) <= 10
    assert ids[0] == "EI-01"  # first flag (no inventory) controls lead
    assert all(c["mappings"] for c in r["recommended_controls"])


def test_modules_and_lead_rules():
    r = score_assessment(answers(5), {"uses_agents": False, "ai_systems": "0-9", "industry": "other"})
    assert [m["module"] for m in r["recommended_modules"]] == ["Agent"]
    assert r["lead"]["tags"] == []
    r2 = score_assessment(answers(2), {"uses_agents": True, "ai_systems": "100+", "industry": "bfsi"})
    assert set(m["module"] for m in r2["recommended_modules"]) == {"Assess", "Register", "Control", "Shield", "Assurance", "Agent"}
    assert {"baseline_priority", "platform_candidate", "shield_candidate", "compliance_led",
            "register_opportunity", "assurance_opportunity"} == set(r2["lead"]["tags"])


def test_readiness_indicators_cover_three_frameworks():
    r = score_assessment(answers(3), {})
    fws = [f["framework"] for f in r["readiness"]]
    assert fws == ["NIST AI RMF", "ISO/IEC 42001", "EU AI Act"]
    for f in r["readiness"]:
        for g in f["groups"]:
            assert g["value"] == 60.0 and g["band"] == "Partial readiness"
            assert "compliant" not in g["band"].lower()


def test_preliminary_has_no_detail_fields():
    p = preliminary_result(answers(3))
    assert set(p) == {"template_id", "template_version", "evidence_status", "overall_score", "maturity_level",
                      "level_interpretation", "domains"}


@pytest.mark.parametrize("bad", [
    {},                                   # missing everything
    {**{q: 3 for q in QIDS}, "X-Q9": 3},  # unknown id
    {**{q: 3 for q in QIDS}, "STR-Q1": 0},
    {**{q: 3 for q in QIDS}, "STR-Q1": 6},
    {**{q: 3 for q in QIDS}, "STR-Q1": 2.5},
    {**{q: 3 for q in QIDS}, "STR-Q1": "abc"},
    {**{q: 3 for q in QIDS}, "STR-Q1": True},
    {**{q: 3 for q in QIDS}, "STR-Q1": None},
])
def test_invalid_answers_rejected(bad):
    with pytest.raises(AssessmentInputError):
        score_assessment(bad, {})


def test_string_numeric_answers_accepted():
    assert score_assessment({q: "4" for q in QIDS}, {})["overall_score"] == 80.0


def test_result_never_contains_compliance_claims():
    import json
    for v in (1, 3, 5):
        r = score_assessment(answers(v), {"uses_agents": True, "eu_operations": True})
        assert find_prohibited_claims(json.dumps(r)) == []
