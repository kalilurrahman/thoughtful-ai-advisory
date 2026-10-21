"""Unit tests: readiness report content and MD/PDF/CSV/JSON exports."""
from __future__ import annotations

import csv
import json

from aegis_common.evidence import STANDARD_DISCLAIMER, find_prohibited_claims

from agent_test_helpers import ASSESSOR, agent, run_guided  # noqa: F401

SECTIONS = ["## 1. Executive summary", "## 2. AI system profile", "## 3. Risk tier and rationale", "## 4. Domain heat map",
            "## 5. Gap register", "## 6. Control recommendations", "## 7. Remediation roadmap (30/60/90 days)",
            "## 8. Audit-ready evidence checklist", "## 9. Runtime guardrail recommendations",
            "## Appendix B — Audit trace", "## Disclaimer"]


def _report(agent, tmp_path, synthetic=False):
    run_guided(agent, "r")
    aid = agent.store.get("sessions", "r")["assessment_id"]
    return agent.call_tool("generate_report", ASSESSOR, assessment_id=aid, out_dir=str(tmp_path / "out"),
                           synthetic=synthetic, basename="rep")


def test_markdown_has_all_sections_and_disclaimer(agent, tmp_path):
    res = _report(agent, tmp_path)
    md = open(res["paths"]["md"], encoding="utf-8").read()
    for s in SECTIONS:
        assert s in md, s
    assert STANDARD_DISCLAIMER in md and not find_prohibited_claims(md)
    assert "| Domain | Qs |" in md and "trc_" in md  # heat map table + audit trace IDs


def test_csv_gap_register_and_json(agent, tmp_path):
    res = _report(agent, tmp_path)
    rows = list(csv.DictReader(open(res["paths"]["csv"], encoding="utf-8")))
    assert rows and {"gap_id", "severity", "evidence_status", "controls", "owner_role", "due_date"} <= set(rows[0])
    data = json.load(open(res["paths"]["json"], encoding="utf-8"))
    assert data["gap_analysis"]["summary"]["gaps"] == len(rows)
    assert data["disclaimer"] == STANDARD_DISCLAIMER and data["risk"]["evidence_status"] == "Inferred"


def test_pdf_is_valid(agent, tmp_path):
    res = _report(agent, tmp_path)
    with open(res["paths"]["pdf"], "rb") as fh:
        assert fh.read(5) == b"%PDF-"


def test_synthetic_label(agent, tmp_path):
    res = _report(agent, tmp_path, synthetic=True)
    assert "Synthetic example" in open(res["paths"]["md"], encoding="utf-8").read()
