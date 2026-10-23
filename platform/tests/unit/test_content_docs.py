"""Structure and honesty checks for planning docs and the v3 blueprint (docs/GTM workstream)."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from veritrail_common.content import controls, load_assessment_template

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
BLUEPRINT = ROOT / "output" / "VERITRAIL_Launch_and_Enhancement_Blueprint_v3.md"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def test_prd_sections_and_unique_requirement_ids():
    text = _read(DOCS / "PRODUCT_REQUIREMENTS.md")
    for s in ("## 2. Personas", "## 3. Jobs to be done", "## 4. Requirements by phase",
              "## 5. Non-functional requirements", "## 6. Out of scope"):
        assert s in text
    ids = re.findall(r"^\| (PRD-\d-\d{2}|NFR-\d{2}) \|", text, re.M)
    assert len(ids) == len(set(ids)) and len(ids) >= 40
    for phase in range(0, 7):
        assert f"PRD-{phase}-01" in ids


def test_roadmap_has_dependencies_dod_exit_criteria_and_no_calendar_dates():
    text = _read(DOCS / "ROADMAP.md")
    assert "Dependency map" in text
    assert text.count("Definition of done") >= 7 and text.count("Exit criteria") >= 7
    assert not re.search(r"\b(Q[1-4]\s*20\d\d|H[12]\s*20\d\d|20(2[7-9]|3\d))\b", text)
    assert not re.search(r"\b(January|February|March|April|May|June|July|August|September|October|November|"
                         r"December)\s+20(2[7-9]|3\d)\b", text)
    assert "Blocked — requires real design partners" in text


ALLOWED_BACKLOG = {"Done — sprint 1 (pending review)", "In progress — built in sprint 1",
                   "Blocked — requires real design partners", "Planned", "Candidate (post-pilot)"}


def _backlog_rows():
    rows = {}
    for line in _read(DOCS / "BACKLOG.md").splitlines():
        m = re.match(r"^\| (E\d-S\d{2}) \|", line)
        if m:
            rows[m.group(1)] = [c.strip() for c in line.strip("|").split("|")]
    return rows


def test_backlog_statuses():
    rows = _backlog_rows()
    assert len(rows) >= 50
    for sid, cells in rows.items():
        assert cells[-1] in ALLOWED_BACKLOG, (sid, cells[-1])
    mvp = [sid for sid in rows if sid[:2] in {"E1", "E2", "E3", "E4"}]
    built = [sid for sid in mvp if rows[sid][-1] in ("In progress — built in sprint 1", "Done — sprint 1 (pending review)")]
    assert len(built) >= 25
    for sid in ("E5-S04", "E5-S05", "E5-S06", "E5-S07", "E6-S06", "E6-S07", "E6-S08"):
        assert rows[sid][-1] == "Blocked — requires real design partners", sid


def test_risk_register_scores_and_required_topics():
    text = _read(DOCS / "RISK_REGISTER.md")
    rows = re.findall(r"^\| (R-\d{2}) \| ([^|]+) \| ([^|]+) \| (\d) \| (\d) \| (\d+) (High|Medium|Low) \| ([^|]+) \|",
                      text, re.M)
    assert len(rows) >= 20
    for rid, _cat, _risk, l, i, score, rating, owner in rows:
        s = int(l) * int(i)
        assert int(score) == s, rid
        assert rating == ("High" if s >= 15 else "Medium" if s >= 8 else "Low"), rid
        assert owner.strip()
    lowered = text.lower()
    for topic in ("sensitive-data sharing", "unsupported compliance advice", "assessment too long", "runtime friction",
                  "pilot scope creep", "outdated regulatory content", "low conversion"):
        assert topic in lowered, topic
    for cat in ("Product", "Legal", "Security", "Commercial", "Delivery"):
        assert cat in text


def test_gtm_lead_rules_match_assessment_template():
    text = _read(DOCS / "GTM_PLAN.md")
    for rule in load_assessment_template()["lead_rules"]:
        assert f"`{rule['tag']}`" in text and rule["label"] in text, rule["tag"]
    for s in ("Ideal customer profiles", "Positioning", "Messaging", "Channels", "Launch plan", "Funnel metrics",
              "Lead qualification rules"):
        assert s in text


def test_website_plan_sections_and_key_pages_exist():
    text = _read(DOCS / "WEBSITE_CONTENT_PLAN.md")
    for s in ("Information architecture", "Page briefs", "SEO plan", "Conversion paths", "Content governance"):
        assert s in text
    pages = {p.stem for p in (ROOT / "content" / "website_pages").glob("*.md")}
    for stem in ("tools-maturity-assessment", "tools-guardrail-generator", "contact-book-governance-baseline"):
        assert stem in pages


def test_pilot_playbook_links_resolve():
    text = _read(DOCS / "PILOT_PLAYBOOK.md")
    for link in re.findall(r"\]\((\.\./content/[^)]+)\)", text):
        assert (DOCS / link).resolve().exists(), link


def test_blueprint_is_v3_master_document():
    text = _read(BLUEPRINT)
    assert "v3.0" in text and "21 October 2026" in text
    for c in controls():
        assert f"| {c['id']} | {c['title']} |" in text, c["id"]
    for s in ("Scoring", "Agent", "Policy schema summary", "Pilots", "Commercial kit", "Risks", "Repository artefact index"):
        assert s in text, s
    assert "Not started — awaiting design-partner recruitment" in text
    assert "Official Journal" in text and "Digital Omnibus" in text


def test_blueprint_lists_all_agent_tools():
    tools = pytest.importorskip("veritrail_agent.tools")
    text = _read(BLUEPRINT)
    for name, spec in tools.TOOL_REGISTRY.items():
        assert f"`{name}` | {spec.permission} |" in text, name


def test_blueprint_repo_paths_exist():
    text = _read(BLUEPRINT)
    index = text.split("## 18. Repository artefact index")[1]
    other_workstream_docs = {"docs/DATA_MODEL.md", "docs/AGENT_DESIGN.md", "docs/RUNTIME_SHIELD_DESIGN.md",
                             "docs/STATUS.md"}
    for path in re.findall(r"`((?:content|docs|output|app|tests)/[A-Za-z0-9_./-]+)`", index):
        if path in other_workstream_docs or "*" in path:
            continue
        assert (ROOT / path.rstrip("/")).exists(), path
