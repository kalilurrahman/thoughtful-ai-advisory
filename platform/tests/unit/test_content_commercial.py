"""Commercial kit completeness and honesty checks (content/commercial/)."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
COM = ROOT / "content" / "commercial"
ONE_PAGERS = ["governance_baseline", "register", "control", "shield", "assurance", "agent", "industry_packs"]
FILES = ["README.md", "pricing_models.md", "pilot_to_platform_proposal_template.md", "roi_calculator.py",
         "roi_worked_example.md", "roi_worked_example.csv", "demo_script.md", "objection_handling.md",
         "case_study_template.md", "customer_onboarding_90_day_plan.md"]


@pytest.mark.parametrize("name", FILES)
def test_files_exist(name):
    assert (COM / name).is_file()


@pytest.mark.parametrize("name", ONE_PAGERS)
def test_one_pagers_exist_with_limits_and_pricing_caveat(name):
    text = (COM / "one_pagers" / f"{name}.md").read_text(encoding="utf-8")
    assert re.search(r"## (Limitations|What it is not|Important limits)", text), name
    assert "hypothesis to validate in pilots" in text, name


def test_pricing_ranges_labelled_as_hypotheses():
    text = (COM / "pricing_models.md").read_text(encoding="utf-8")
    assert "hypothesis to validate in pilots" in text.lower()
    assert "not market data" in text
    for module in ("Governance Baseline", "Register", "Control", "Shield", "Assurance", "Agent", "Industry packs",
                   "Managed Governance Service"):
        assert f"**{module}**" in text, module
    assert "Baseline ──► Register ──► Control ──► Shield ──► Assurance ──► Managed Governance Service" in text


def test_case_study_rule_requires_written_approval_and_verified_metrics():
    text = (COM / "case_study_template.md").read_text(encoding="utf-8")
    assert "written approval" in text and "verified" in text.lower()
    assert "No case study, quote, logo, metric or customer reference may be published" in text


def test_demo_script_has_both_versions_and_flow():
    text = (COM / "demo_script.md").read_text(encoding="utf-8")
    assert "## 20-minute version" in text and "## 45-minute version" in text
    assert "website → self-assessment → VERITRAIL Agent → Shield Advisor → report" in text
    for slug in ("/tools/maturity-assessment/", "/tools/guardrail-generator/", "/tools/ask-veritrail/"):
        assert slug in text
        page = ROOT / "content" / "website_pages" / (slug.strip("/").replace("/", "-") + ".md")
        assert page.exists(), f"demo references missing page {slug}"


def test_no_invented_customers_claimed():
    for p in list(COM.rglob("*.md")):
        text = p.read_text(encoding="utf-8").lower()
        assert "trusted by" not in text and "our customers include" not in text, p.name
