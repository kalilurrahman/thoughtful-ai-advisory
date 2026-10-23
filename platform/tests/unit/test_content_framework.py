"""Citation, claim and consistency checks for VERITRAIL framework content and all docs/GTM workstream files."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from veritrail_common.content import controls, controls_by_id, load_assessment_template
from veritrail_common.evidence import find_prohibited_claims

ROOT = Path(__file__).resolve().parents[2]
CONTROL_RE = re.compile(r"\b(?:AO|EI|GL|IS|SE)-\d{2}\b")
TEXT_EXT = {".md", ".yaml", ".yml", ".csv", ".py"}


def owned_files() -> list[Path]:
    files = [ROOT / "content" / n for n in ("veritrail_framework.md", "pillars.md", "maturity_model.md")]
    files += sorted((ROOT / "content" / "industry_packs").glob("*.yaml"))
    for d in ("commercial", "pilots"):
        files += sorted(p for p in (ROOT / "content" / d).rglob("*")
                        if p.is_file() and p.suffix in TEXT_EXT and "__pycache__" not in p.parts)
    files += [ROOT / "docs" / f"{n}.md" for n in (
        "PRODUCT_REQUIREMENTS", "COMPLIANCE_MAPPING", "WEBSITE_CONTENT_PLAN", "PILOT_PLAYBOOK", "GTM_PLAN",
        "ROADMAP", "RISK_REGISTER", "BACKLOG")]
    files += [ROOT / "docs" / "tools" / "gen_compliance_mapping.py",
              ROOT / "output" / "VERITRAIL_Launch_and_Enhancement_Blueprint_v3.md"]
    return files


FILES = owned_files()
IDS = [str(p.relative_to(ROOT)) for p in FILES]


def test_owned_files_exist():
    missing = [str(p.relative_to(ROOT)) for p in FILES if not p.exists()]
    assert not missing, missing


@pytest.mark.parametrize("path", FILES, ids=IDS)
def test_every_cited_control_id_exists(path):
    cited = set(CONTROL_RE.findall(path.read_text(encoding="utf-8")))
    unknown = cited - set(controls_by_id())
    assert not unknown, f"{path.name} cites unknown control IDs: {sorted(unknown)}"


@pytest.mark.parametrize("path", FILES, ids=IDS)
def test_no_prohibited_compliance_claims(path):
    assert find_prohibited_claims(path.read_text(encoding="utf-8")) == []


def test_all_64_controls_are_cited_somewhere():
    cited = set()
    for p in FILES:
        cited |= set(CONTROL_RE.findall(p.read_text(encoding="utf-8")))
    assert set(controls_by_id()) <= cited


def test_pillars_doc_lists_every_control_with_exact_title_and_pillar():
    text = (ROOT / "content" / "pillars.md").read_text(encoding="utf-8")
    sections = re.split(r"\n## Pillar ", text)
    by_pillar = {s[:2]: s for s in sections[1:]}
    assert set(by_pillar) == {"AO", "EI", "GL", "IS", "SE"}
    for c in controls():
        row = f"| {c['id']} | {c['title']} | {c['priority']} | {c['applies_to']} |"
        assert row in by_pillar[c["pillar"]], f"{c['id']} missing or mismatched in pillars.md"


def test_maturity_model_weights_and_levels_match_template():
    text = (ROOT / "content" / "maturity_model.md").read_text(encoding="utf-8")
    t = load_assessment_template()
    for d in t["domains"]:
        assert re.search(rf"\| {re.escape(d['name'])} \| `{d['id']}` \| {d['weight']} \|", text), d["id"]
    for lv in t["scoring"]["levels"]:
        assert f"**{lv['name']}**" in text
        assert lv["interpretation"] in text
    for q in t["questions"]:
        assert q["id"] in text


def test_maturity_worked_example_matches_engine():
    engine = pytest.importorskip("veritrail_assessment.engine")
    answers = {"STR-Q1": 3, "STR-Q2": 2, "STR-Q3": 3, "INV-Q1": 2, "INV-Q2": 2, "INV-Q3": 3,
               "RSK-Q1": 3, "RSK-Q2": 2, "RSK-Q3": 2, "DAT-Q1": 3, "DAT-Q2": 4, "DAT-Q3": 2,
               "SEC-Q1": 3, "SEC-Q2": 2, "SEC-Q3": 3, "FST-Q1": 2, "FST-Q2": 3, "FST-Q3": 2,
               "HUM-Q1": 3, "HUM-Q2": 3, "HUM-Q3": 2, "ASR-Q1": 2, "ASR-Q2": 2, "ASR-Q3": 3}
    profile = {"industry": "bfsi", "org_size": "1000-5000", "ai_systems": "25-99", "uses_agents": True,
               "eu_operations": False}
    r = engine.score_assessment(answers, profile)
    assert r["overall_score"] == 50.8 and r["maturity_level"] == "Developing"
    flags = [f["id"] for f in r["critical_flags"]]
    assert flags == ["FLAG-NO-INVENTORY", "FLAG-SENSITIVE-DATA-EXPOSURE", "FLAG-AGENTS-UNTESTED", "FLAG-NO-EVIDENCE"]
    rec = [c["id"] for c in r["recommended_controls"]]
    assert rec[:9] == ["EI-01", "EI-09", "IS-04", "IS-03", "IS-14", "IS-11", "IS-12", "SE-05", "SE-08"]
    text = (ROOT / "content" / "maturity_model.md").read_text(encoding="utf-8")
    assert "254/5 = 50.8 → Developing" in text


def test_framework_doc_covers_layers_modules_and_limits():
    text = (ROOT / "content" / "veritrail_framework.md").read_text(encoding="utf-8")
    for layer in ("AI System of Record", "Assessment & Risk Engine", "Policy & Control Library",
                  "Lifecycle Governance", "Runtime Shield", "Assurance & Evidence"):
        assert layer in text
    for module in ("Assess", "Register", "Control", "Shield", "Assurance", "Agent"):
        assert f"**{module}**" in text
    for label in ("Verified", "User-asserted", "Inferred", "Missing evidence", "Critical gap"):
        assert label in text
    assert "Official Journal" in text and "Digital Omnibus" in text
    for decision in ("ALLOW", "DENY", "REDACT", "TRANSFORM", "REQUIRE_HUMAN_APPROVAL", "ESCALATE", "RATE_LIMIT"):
        assert decision in text
