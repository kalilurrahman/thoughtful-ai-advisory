"""Pilot kit completeness and honesty checks (content/pilots/)."""
from __future__ import annotations

import csv
from pathlib import Path

import pytest

from aegis_common.evidence import GAP_SEVERITIES, EvidenceStatus

ROOT = Path(__file__).resolve().parents[2]
PILOTS = ROOT / "content" / "pilots"
NOT_STARTED = "Not started — awaiting design-partner recruitment"

PER_PILOT = ["pilot_plan.md", "success_metrics_scorecard.md", "success_metrics_scorecard.csv",
             "onboarding_checklist.md", "kit_index.md"]
TEMPLATES = ["data_access_privacy_safeguards.md", "inventory_workshop_kit.md", "ai_inventory_intake_template.csv",
             "maturity_assessment_session_guide.md", "deep_dive_assessment_plan.md", "agent_review_protocol.md",
             "gap_register_template.csv", "remediation_roadmap_template.md",
             "runtime_shield_recommendations_template.md", "executive_readiness_report_template.md",
             "feedback_survey.md", "commercial_follow_on_proposal.md"]


def _csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


@pytest.mark.parametrize("pilot", ["pilot_a", "pilot_b"])
@pytest.mark.parametrize("name", PER_PILOT)
def test_per_pilot_files_exist(pilot, name):
    assert (PILOTS / pilot / name).is_file()


@pytest.mark.parametrize("name", TEMPLATES)
def test_templates_exist_and_are_linked_from_both_kit_indexes(name):
    assert (PILOTS / "templates" / name).is_file()
    for pilot in ("pilot_a", "pilot_b"):
        assert name in (PILOTS / pilot / "kit_index.md").read_text(encoding="utf-8"), (pilot, name)


def test_status_tracker_is_honest():
    text = (PILOTS / "pilot_status_tracker.md").read_text(encoding="utf-8")
    rows = [line for line in text.splitlines() if line.startswith("| **A**") or line.startswith("| **B**")]
    assert len(rows) == 2
    for row in rows:
        assert NOT_STARTED in row
        assert "— (none)" in row
    for section in ("Recruitment criteria", "Qualification scorecard", "Outreach sequence"):
        assert section in text
    funnel = text.split("## 4. Recruitment funnel tracker")[1].split("## 5.")[0]
    for line in funnel.splitlines():
        if line.startswith("| ") and not line.startswith("| Stage") and not line.startswith("|---"):
            assert line.endswith("| 0 | 0 |"), line


@pytest.mark.parametrize("pilot", ["pilot_a", "pilot_b"])
def test_pilot_plans_cover_six_weeks_and_status(pilot):
    text = (PILOTS / pilot / "pilot_plan.md").read_text(encoding="utf-8")
    assert NOT_STARTED in text
    for wk in range(1, 7):
        assert f"| {wk} — " in text, f"week {wk} missing"


@pytest.mark.parametrize("pilot", ["pilot_a", "pilot_b"])
def test_scorecards_have_core_metrics_with_method_and_source_and_no_results(pilot):
    rows = {r["metric_id"]: r for r in _csv(PILOTS / pilot / "success_metrics_scorecard.csv")}
    targets = {"M1": ">=25", "M2": "100%", "M3": ">=70%", "M4": ">=2", "M5": "Accepted", "M6": "Yes"}
    for mid, tgt in targets.items():
        assert mid in rows
        assert rows[mid]["target"].startswith(tgt)
        assert rows[mid]["measurement_method"] and rows[mid]["data_source"]
    for r in rows.values():
        assert r["result"] == "" and r["met"] == "" and r["evidence_ref"] == "", "results must stay empty until measured"
    md = (PILOTS / pilot / "success_metrics_scorecard.md").read_text(encoding="utf-8")
    assert "No results recorded" in md


def test_intake_template_matches_risk_tier_engine():
    rt = pytest.importorskip("aegis_assessment.risk_tier")
    rows = _csv(PILOTS / "templates" / "ai_inventory_intake_template.csv")
    header = set(rows[0].keys())
    assert set(rt.INTAKE_FIELDS) <= header, set(rt.INTAKE_FIELDS) - header
    assert {"business_owner_role", "technical_owner_role", "preliminary_risk_tier", "evidence_status"} <= header
    for r in rows:
        assert r["name"].startswith("[SYNTHETIC EXAMPLE]")
        profile = {k: r[k] for k in ("name", "purpose", "decision_impact", "affected_parties", "data_sensitivity",
                                     "autonomy", "domain_category")}
        profile.update({k: r[k] == "true" for k in ("genai", "external_actions", "eu_exposure", "vendor_model")})
        profile["tools"] = [t for t in r["tools"].split(";") if t]
        tier = rt.calculate_risk_tier(profile)["tier"]
        assert tier == r["preliminary_risk_tier"], (r["system_id"], tier)
        assert r["evidence_status"] in {s.value for s in EvidenceStatus}


def test_gap_register_template_columns_and_values():
    rows = _csv(PILOTS / "templates" / "gap_register_template.csv")
    required = {"gap_id", "system_id", "assessment_question_id", "finding", "control_ids", "framework_mappings",
                "evidence_status", "severity", "owner_role", "roadmap_horizon", "target_date", "status"}
    assert required <= set(rows[0].keys())
    for r in rows:
        assert r["evidence_status"] in {s.value for s in EvidenceStatus}
        assert r["severity"] in GAP_SEVERITIES
        assert r["roadmap_horizon"] in {"30", "60", "90", "180"}
        assert "SYNTHETIC EXAMPLE" in r["system_name"]


def test_safeguards_cover_required_topics():
    text = (PILOTS / "templates" / "data_access_privacy_safeguards.md").read_text(encoding="utf-8").lower()
    for needle in ("metadata-only", "redact", "nda", "dpa", "retention", "deletion", "access roles",
                   "no production data", "external llm"):
        assert needle in text, needle


def test_feedback_survey_covers_required_topics():
    text = (PILOTS / "templates" / "feedback_survey.md").read_text(encoding="utf-8")
    for section in ("Framework clarity", "Assessment length and credibility", "citations, hallucination resistance",
                    "Report usefulness", "Runtime guardrails practicality", "Integration barriers",
                    "Willingness to pay and pricing preference", "Strongly disagree"):
        assert section in text, section


def test_agent_review_and_deep_dive_scope():
    agent = (PILOTS / "templates" / "agent_review_protocol.md").read_text(encoding="utf-8")
    assert "up to 2 agents" in agent.lower() and "observe" in agent.lower()
    deep = (PILOTS / "templates" / "deep_dive_assessment_plan.md").read_text(encoding="utf-8")
    assert "5 priority systems" in deep


def test_qualification_scorecard_weights():
    rows = [r for r in _csv(PILOTS / "design_partner_qualification_scorecard.csv") if r["criterion_id"] != "TOTAL"]
    assert sum(int(r["weight"]) for r in rows) * 3 == 48
