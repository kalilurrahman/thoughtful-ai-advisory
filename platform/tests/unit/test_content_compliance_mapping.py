"""The generated compliance crosswalk must be current, complete and carry its disclaimers and gaps."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

from aegis_common.content import controls
from aegis_common.evidence import STANDARD_DISCLAIMER, find_prohibited_claims

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / "docs" / "COMPLIANCE_MAPPING.md"
GEN = ROOT / "docs" / "tools" / "gen_compliance_mapping.py"

_spec = importlib.util.spec_from_file_location("aegis_gen_compliance_mapping", GEN)
gen = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = gen
_dont = sys.dont_write_bytecode
sys.dont_write_bytecode = True
_spec.loader.exec_module(gen)
sys.dont_write_bytecode = _dont


def test_document_is_up_to_date_with_controls_yaml():
    assert DOC.read_text(encoding="utf-8") == gen.render(), \
        "docs/COMPLIANCE_MAPPING.md is stale: run python3 docs/tools/gen_compliance_mapping.py"
    assert gen.main(["--check"]) == 0


def test_render_is_deterministic():
    assert gen.render() == gen.render()


def test_every_control_in_matrix_with_its_mappings():
    text = DOC.read_text(encoding="utf-8")
    matrix = text.split("## 6. Control-by-control matrix")[1].split("## 7.")[0]
    for c in controls():
        assert f"| {c['id']} | {c['title']} |" in matrix
        for ref in c["mappings"].get("eu_ai_act") or []:
            assert ref in text


def test_every_mapped_reference_appears_in_its_framework_section():
    text = DOC.read_text(encoding="utf-8")
    nist = text.split("## 3. NIST")[1].split("## 4.")[0]
    iso = text.split("## 4. ISO")[1].split("## 5.")[0]
    eu = text.split("## 5. EU AI Act crosswalk")[1].split("## 6.")[0]
    for c in controls():
        m = c["mappings"]
        for r in m.get("nist_ai_rmf") or []:
            assert f"| {r} |" in nist, r
        for r in m.get("iso_42001") or []:
            assert f"| {r} |" in iso, r
        for r in m.get("eu_ai_act") or []:
            assert f"| {r} |" in eu, r


def test_no_unknown_references_against_reference_lists():
    text = DOC.read_text(encoding="utf-8")
    assert "are not in the reference lists" not in text


def test_disclaimers_methodology_and_coverage_gaps_present():
    text = DOC.read_text(encoding="utf-8")
    assert STANDARD_DISCLAIMER in text
    for needle in ("## 1. Methodology", "## 7. Coverage gaps", "Official Journal", "Digital Omnibus",
                   "not been verified in this", "notified bod", "CE marking", "EU database",
                   "General-purpose AI (GPAI)", "accredited certification body", "not** an official crosswalk"):
        assert needle in text, needle
    assert find_prohibited_claims(text) == []


def test_support_boundaries_for_articles_aegis_cannot_discharge():
    text = DOC.read_text(encoding="utf-8")
    for art, phrase in (("Art. 43", "does NOT perform conformity assessment"),
                        ("Art. 49", "does NOT register systems"),
                        ("Art. 73", "does not file serious-incident reports")):
        row = next(line for line in text.splitlines() if line.startswith(f"| {art} |"))
        assert phrase in row
