"""Unit tests: use-case question bank integrity, module selection, answer parsing."""
from __future__ import annotations

from aegis_common.content import controls_by_id

from aegis_agent import question_bank as qb
from agent_test_helpers import CS_PROFILE, LOW_PROFILE

REQUIRED_MODULES = {"core", "data_privacy", "security", "genai_llm", "agentic", "fairness_safety",
                    "human_oversight", "vendor_third_party"}


def test_bank_has_no_integrity_errors():
    assert qb.validate_bank() == []


def test_required_modules_present_and_populated():
    ids = {m["id"] for m in qb.modules()}
    assert REQUIRED_MODULES <= ids
    for m in qb.modules():
        assert len(m["questions"]) >= 4, m["id"]


def test_every_question_cites_real_controls_and_expected_evidence():
    known = controls_by_id()
    n = 0
    for q in qb.questions_by_id().values():
        n += 1
        assert q["controls"] and all(c in known for c in q["controls"]), q["id"]
        assert q["evidence_expected"], q["id"]
        assert q["remediation"], q["id"]
        assert q["domain"] in {"strategy", "inventory", "risk_lifecycle", "data_privacy", "security",
                               "fairness_transparency", "oversight_operations", "assurance"}, q["id"]
    assert n >= 40


def test_template_metadata_and_disclaimer():
    meta = qb.template_meta()
    assert meta["id"] == "AEGIS-UC-ASSESS" and meta["version"]
    assert "does not certify" in meta["disclaimer"].lower()


def test_intake_fields_match_risk_tier_profile_keys():
    from aegis_assessment.risk_tier import INTAKE_FIELDS
    for f in qb.intake_fields():
        assert f["id"] in INTAKE_FIELDS or f["id"] == "users_count_band", f["id"]


def test_module_selection_customer_support_agent():
    mods = {m["id"] for m in qb.select_modules(CS_PROFILE, "High")}
    assert {"core", "data_privacy", "security", "genai_llm", "agentic", "fairness_safety", "human_oversight",
            "vendor_third_party", "monitoring_assurance"} <= mods


def test_module_selection_low_risk_internal_tool_is_smaller():
    mods = {m["id"] for m in qb.select_modules(LOW_PROFILE, "Low")}
    assert "agentic" not in mods and "vendor_third_party" not in mods and "data_privacy" not in mods
    assert "core" in mods and "genai_llm" in mods


def test_risk_engine_required_modules_are_known_module_ids():
    from aegis_assessment.risk_tier import calculate_risk_tier
    ids = {m["id"] for m in qb.modules()}
    for prof in (CS_PROFILE, LOW_PROFILE):
        assert set(calculate_risk_tier(prof)["required_modules"]) <= ids


def test_question_level_applicability_narrows():
    low_q = {q["id"] for q in qb.applicable_questions(LOW_PROFILE, "Low")}
    assert "UC-MON-Q5" not in low_q  # technical documentation only for High tier / EU exposure
    hi_q = {q["id"] for q in qb.applicable_questions(CS_PROFILE, "High")}
    assert "UC-MON-Q5" in hi_q and "UC-AGT-Q3" in hi_q


def test_parse_answer_variants():
    cases = {
        "implemented": "implemented", "Yes, fully in place": "implemented", "partially implemented": "partial",
        "in progress": "partial", "not implemented": "not_implemented", "no": "not_implemented",
        "not_implemented": "not_implemented", "unknown": "unknown", "not sure": "unknown", "don't know": "unknown",
        "N/A": "not_applicable", "not applicable": "not_applicable",
        "yes but no evidence yet": "implemented", "banana": None,
    }
    for text, expected in cases.items():
        assert qb.parse_answer(text) == expected, text


def test_parse_evidence_refs():
    assert qb.parse_evidence_refs("implemented, evidence EV-104 and DOC-DPIA-07.") == ["EV-104", "DOC-DPIA-07"]
    assert qb.parse_evidence_refs("implemented") == []


def test_runtime_guardrails_cite_real_controls_and_apply():
    gs = {g["id"] for g in qb.applicable_guardrails(CS_PROFILE)}
    assert {"RG-PII-REDACTION", "RG-HUMAN-APPROVAL", "RG-TOOL-ALLOWLIST"} <= gs
