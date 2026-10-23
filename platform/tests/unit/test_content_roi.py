"""Tests for the VERITRAIL ROI & business-case calculator (content/commercial/roi_calculator.py)."""
from __future__ import annotations

import csv
import importlib.util
import io
import sys
from dataclasses import asdict, replace
from pathlib import Path

import pytest

from veritrail_common.evidence import find_prohibited_claims

ROOT = Path(__file__).resolve().parents[2]
MOD_PATH = ROOT / "content" / "commercial" / "roi_calculator.py"
spec = importlib.util.spec_from_file_location("veritrail_roi_calculator", MOD_PATH)
roi = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = roi  # dataclasses need the module registered
_dont = sys.dont_write_bytecode
sys.dont_write_bytecode = True
spec.loader.exec_module(roi)
sys.dont_write_bytecode = _dont


def _item(result, item_id):
    return next(i for i in result["line_items"] if i["id"] == item_id)["value"]


def test_example_formulas_are_exact():
    r = roi.calculate(roi.EXAMPLE_INPUTS)
    assert _item(r, "L1") == 960            # 40 × 24 × 1
    assert _item(r, "L2") == 91_200         # 960 × 95
    assert _item(r, "L4") == 36_480         # × 0.40
    assert _item(r, "L5") == 57_000         # 600 × 95
    assert _item(r, "L7") == 28_500         # × 0.50
    assert _item(r, "L8") == 13.5           # 45 × 0.30
    assert _item(r, "L9") == 81_000         # 12 × 13.5 × 500
    assert _item(r, "L10") == 75_000        # 0.10 × 750k
    assert _item(r, "L11") == 15_000        # × 0.20
    s = r["summary"]
    assert s["gross_annual_benefit"] == 160_980
    assert s["year1_realized_benefit"] == 120_735
    assert s["year1_cost"] == 105_000
    assert s["year1_net_benefit"] == 15_735
    assert s["year1_roi_pct"] == 15.0
    assert s["payback_months"] == 10.4
    assert s["hours_freed_per_year"] == 684.0


def test_every_line_item_has_formula_and_every_assumption_is_labelled():
    r = roi.calculate(roi.EXAMPLE_INPUTS)
    for it in r["line_items"]:
        assert it["formula"] and it["label"] and it["unit"] in {"currency", "hours", "days"}
    keys = {a["key"] for a in r["assumptions"]}
    assert keys == set(asdict(roi.EXAMPLE_INPUTS))
    for a in r["assumptions"]:
        assert a["source"] in {roi.CUSTOMER_INPUT, roi.CUSTOMER_ESTIMATE, roi.HYPOTHESIS}
        assert a["note"]
    assert set(r["hypotheses_to_validate"]) == {
        "assessment_effort_reduction", "audit_prep_reduction", "approval_cycle_reduction",
        "incident_likelihood_reduction", "realization_rate"}
    assert "not guaranteed" in r["disclaimer"]


def test_minimal_inputs_and_no_cost_gives_no_roi():
    r = roi.calculate(roi.ROIInputs(ai_systems=10, assessment_hours_per_system=8, hourly_cost=80))
    s = r["summary"]
    assert s["gross_annual_benefit"] == 10 * 8 * 80 * 0.40
    assert s["year1_roi_pct"] is None and s["payback_months"] is None and s["steady_state_roi_pct"] is None


def test_zero_benefit_is_handled():
    r = roi.calculate(roi.ROIInputs(ai_systems=0, assessment_hours_per_system=0, hourly_cost=0,
                                    veritrail_annual_cost=10_000))
    assert r["summary"]["gross_annual_benefit"] == 0
    assert r["summary"]["payback_months"] is None
    assert r["summary"]["year1_roi_pct"] == -100.0
    assert r["summary"]["efficiency_share_of_gross_pct"] is None


@pytest.mark.parametrize("field,value", [
    ("ai_systems", -1), ("hourly_cost", -5), ("assessment_effort_reduction", 1.2),
    ("annual_incident_probability", 1.5), ("realization_rate", -0.1),
])
def test_invalid_inputs_rejected(field, value):
    with pytest.raises(ValueError):
        roi.calculate(replace(roi.EXAMPLE_INPUTS, **{field: value}))


def test_non_numeric_rejected():
    with pytest.raises(ValueError):
        roi.calculate(replace(roi.EXAMPLE_INPUTS, hourly_cost="95"))


def test_benefit_monotonic_in_hypotheses():
    base = roi.calculate(roi.EXAMPLE_INPUTS)["summary"]["gross_annual_benefit"]
    more = roi.calculate(replace(roi.EXAMPLE_INPUTS, assessment_effort_reduction=0.6))["summary"]["gross_annual_benefit"]
    assert more > base


def test_scenarios_ordered_and_capped():
    sc = roi.scenarios(roi.EXAMPLE_INPUTS)
    g = [sc[k]["summary"]["gross_annual_benefit"] for k in ("conservative", "base", "optimistic")]
    assert g[0] < g[1] < g[2]
    hi = roi.scenarios(replace(roi.EXAMPLE_INPUTS, audit_prep_reduction=0.8))["optimistic"]
    assert hi["inputs"]["audit_prep_reduction"] == 0.9


def test_markdown_and_csv_render():
    r = roi.calculate(roi.EXAMPLE_INPUTS)
    md = roi.to_markdown(r)
    assert "| L12 | Gross modelled annual benefit |" in md
    assert roi.HYPOTHESIS in md
    assert find_prohibited_claims(md) == []
    rows = list(csv.DictReader(io.StringIO(roi.to_csv(r))))
    sections = {row["section"] for row in rows}
    assert sections == {"assumption", "calculation", "summary"}
    assert len([x for x in rows if x["section"] == "assumption"]) == len(r["assumptions"])


def test_worked_example_files_in_sync():
    r = roi.calculate(roi.EXAMPLE_INPUTS)
    csv_path = ROOT / "content" / "commercial" / "roi_worked_example.csv"
    assert csv_path.read_text(encoding="utf-8") == roi.to_csv(r)
    md = (ROOT / "content" / "commercial" / "roi_worked_example.md").read_text(encoding="utf-8")
    assert "| Gross modelled annual benefit | 160,980 |" in md
    assert "Synthetic data" in md
    sc = roi.scenarios(roi.EXAMPLE_INPUTS)
    assert f"{sc['conservative']['summary']['gross_annual_benefit']:,.0f}" in md
    assert f"{sc['optimistic']['summary']['gross_annual_benefit']:,.0f}" in md


def test_cli(capsys):
    assert roi.main(["--example", "--format", "json"]) == 0
    assert '"gross_annual_benefit": 160980.0' in capsys.readouterr().out
    assert roi.main(["--hourly-cost", "90"]) == 2
    assert roi.main(["--ai-systems", "5", "--assessment-hours", "10", "--hourly-cost", "100",
                     "--realization-rate", "2"]) == 2
    assert roi.main(["--example", "--scenarios"]) == 0
    assert "conservative" in capsys.readouterr().out
