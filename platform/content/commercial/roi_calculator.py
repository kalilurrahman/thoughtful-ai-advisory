#!/usr/bin/env python3
"""AEGIS ROI & business-case calculator.

Transparent, assumption-labelled estimate of the annual value of AI governance automation with AEGIS.
Every output line carries its formula and the assumptions it depends on. Every assumption carries a source label:

* ``Customer input``                        — a fact the customer provides about today's operation
* ``Customer estimate``                     — a judgement the customer makes (e.g. value of a day of delay)
* ``AEGIS hypothesis — validate in pilot``  — an AEGIS effect-size assumption NOT yet measured with customers

IMPORTANT: AEGIS has no measured customer results yet. The default effect sizes are planning hypotheses to be
replaced with pilot measurements (see content/pilots/). Do not present outputs as guaranteed savings.

Usage::

    python3 content/commercial/roi_calculator.py --ai-systems 40 --assessment-hours 24 --hourly-cost 95 \
        --audit-prep-hours 600 --approval-cycle-days 45 --new-use-cases 12 --format md
    python3 content/commercial/roi_calculator.py --example --format csv

Library::

    from roi_calculator import ROIInputs, calculate, to_markdown
    result = calculate(ROIInputs(ai_systems=40, ...))
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import sys
from dataclasses import MISSING, asdict, dataclass, fields

CUSTOMER_INPUT = "Customer input"
CUSTOMER_ESTIMATE = "Customer estimate"
HYPOTHESIS = "AEGIS hypothesis — validate in pilot"

DISCLAIMER = (
    "Illustrative business case. Effect sizes labelled 'AEGIS hypothesis — validate in pilot' have not been measured "
    "with customers. Results are estimates, not guaranteed savings, and are not financial advice. Risk-reduction value "
    "is an expected-value estimate, not a prediction that incidents will or will not occur."
)


@dataclass
class ROIInputs:
    # --- customer inputs: today's operation
    ai_systems: int
    assessment_hours_per_system: float
    hourly_cost: float
    audit_prep_hours_per_year: float = 0.0
    approval_cycle_days: float = 0.0
    assessments_per_system_per_year: float = 1.0
    new_use_cases_per_year: int = 0
    # --- customer estimates
    delay_cost_per_day: float = 0.0               # value lost per use case per day of approval delay (0 = ignore)
    annual_incident_probability: float = 0.0      # probability of >=1 material AI incident per year (0..1)
    expected_incident_cost: float = 0.0           # expected total cost of such an incident
    aegis_annual_cost: float = 0.0                # subscription (from proposal); 0 = benefits only
    implementation_cost: float = 0.0              # one-time (e.g. Governance Baseline fee)
    # --- AEGIS effect hypotheses (validate in pilot)
    assessment_effort_reduction: float = 0.40
    audit_prep_reduction: float = 0.50
    approval_cycle_reduction: float = 0.30
    incident_likelihood_reduction: float = 0.20
    realization_rate: float = 0.75                # share of modelled benefit realized in year 1 (adoption ramp)


ASSUMPTION_META = {
    "ai_systems": (CUSTOMER_INPUT, "Number of AI systems in scope (inventory count or best estimate)."),
    "assessment_hours_per_system": (CUSTOMER_INPUT, "Person-hours to complete one risk/impact assessment today."),
    "hourly_cost": (CUSTOMER_INPUT, "Blended fully loaded hourly cost of people doing governance work."),
    "audit_prep_hours_per_year": (CUSTOMER_INPUT, "Person-hours per year assembling AI evidence for audits, customers and regulators."),
    "approval_cycle_days": (CUSTOMER_INPUT, "Average calendar days from use-case intake to approval decision today."),
    "assessments_per_system_per_year": (CUSTOMER_INPUT, "Assessments or reassessments per system per year (initial, change-triggered, periodic)."),
    "new_use_cases_per_year": (CUSTOMER_INPUT, "New AI use cases going through approval per year."),
    "delay_cost_per_day": (CUSTOMER_ESTIMATE, "Business value lost per use case per day of approval delay. Default 0 excludes this benefit."),
    "annual_incident_probability": (CUSTOMER_ESTIMATE, "Probability of at least one material AI incident in a year."),
    "expected_incident_cost": (CUSTOMER_ESTIMATE, "Expected cost of a material AI incident (response, remediation, legal, customer impact)."),
    "aegis_annual_cost": (CUSTOMER_INPUT, "Annual AEGIS subscription from the commercial proposal (pricing is itself a hypothesis)."),
    "implementation_cost": (CUSTOMER_INPUT, "One-time cost, e.g. Governance Baseline fee and internal implementation effort."),
    "assessment_effort_reduction": (HYPOTHESIS, "Share of assessment effort removed by agent-assisted, pre-populated assessments."),
    "audit_prep_reduction": (HYPOTHESIS, "Share of audit-preparation effort removed by continuous evidence capture and evidence packs."),
    "approval_cycle_reduction": (HYPOTHESIS, "Share of approval cycle time removed by triage, routing and complete submissions."),
    "incident_likelihood_reduction": (HYPOTHESIS, "Relative reduction in material-incident likelihood from runtime guardrails, testing and oversight."),
    "realization_rate": (HYPOTHESIS, "Share of modelled benefit realized in year 1, reflecting adoption ramp."),
}

_FRACTIONS = {"annual_incident_probability", "assessment_effort_reduction", "audit_prep_reduction",
              "approval_cycle_reduction", "incident_likelihood_reduction", "realization_rate"}


def validate(inp: ROIInputs) -> None:
    for f in fields(inp):
        v = getattr(inp, f.name)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            raise ValueError(f"{f.name} must be a number, got {v!r}")
        if v < 0:
            raise ValueError(f"{f.name} must be >= 0, got {v}")
        if f.name in _FRACTIONS and v > 1:
            raise ValueError(f"{f.name} must be a fraction between 0 and 1, got {v}")


def _r(x: float, nd: int = 2) -> float:
    return round(x + 0.0, nd)


def calculate(inp: ROIInputs) -> dict:
    """Return a fully explained ROI estimate. Pure function; no I/O."""
    validate(inp)
    items: list[dict] = []

    def add(item_id: str, label: str, formula: str, value: float, deps: list[str], unit: str = "currency"):
        items.append({"id": item_id, "label": label, "formula": formula, "value": _r(value), "unit": unit,
                      "assumptions": deps})
        return value

    base_assess_hours = add(
        "L1", "Assessment effort today (hours/yr)",
        "ai_systems × assessment_hours_per_system × assessments_per_system_per_year",
        inp.ai_systems * inp.assessment_hours_per_system * inp.assessments_per_system_per_year,
        ["ai_systems", "assessment_hours_per_system", "assessments_per_system_per_year"], "hours")
    base_assess_cost = add("L2", "Assessment cost today", "L1 × hourly_cost",
                           base_assess_hours * inp.hourly_cost, ["hourly_cost"])
    assess_hours_saved = add("L3", "Assessment hours saved", "L1 × assessment_effort_reduction",
                             base_assess_hours * inp.assessment_effort_reduction,
                             ["assessment_effort_reduction"], "hours")
    assess_saving = add("L4", "Assessment cost saving", "L2 × assessment_effort_reduction",
                        base_assess_cost * inp.assessment_effort_reduction, ["assessment_effort_reduction"])
    base_audit_cost = add("L5", "Audit-preparation cost today", "audit_prep_hours_per_year × hourly_cost",
                          inp.audit_prep_hours_per_year * inp.hourly_cost,
                          ["audit_prep_hours_per_year", "hourly_cost"])
    audit_hours_saved = add("L6", "Audit-preparation hours saved", "audit_prep_hours_per_year × audit_prep_reduction",
                            inp.audit_prep_hours_per_year * inp.audit_prep_reduction,
                            ["audit_prep_reduction"], "hours")
    audit_saving = add("L7", "Audit-preparation cost saving", "L5 × audit_prep_reduction",
                       base_audit_cost * inp.audit_prep_reduction, ["audit_prep_reduction"])
    days_saved = add("L8", "Approval days saved per use case", "approval_cycle_days × approval_cycle_reduction",
                     inp.approval_cycle_days * inp.approval_cycle_reduction,
                     ["approval_cycle_days", "approval_cycle_reduction"], "days")
    ttv = add("L9", "Time-to-value benefit", "new_use_cases_per_year × L8 × delay_cost_per_day",
              inp.new_use_cases_per_year * days_saved * inp.delay_cost_per_day,
              ["new_use_cases_per_year", "delay_cost_per_day"])
    base_loss = add("L10", "Expected annual incident loss today",
                    "annual_incident_probability × expected_incident_cost",
                    inp.annual_incident_probability * inp.expected_incident_cost,
                    ["annual_incident_probability", "expected_incident_cost"])
    risk_value = add("L11", "Risk-reduction value (expected)", "L10 × incident_likelihood_reduction",
                     base_loss * inp.incident_likelihood_reduction, ["incident_likelihood_reduction"])
    gross = add("L12", "Gross modelled annual benefit", "L4 + L7 + L9 + L11",
                assess_saving + audit_saving + ttv + risk_value, [])
    realized = add("L13", "Year-1 realized benefit", "L12 × realization_rate", gross * inp.realization_rate,
                   ["realization_rate"])
    hours_freed = add("L14", "Governance hours freed per year (modelled)", "L3 + L6",
                      assess_hours_saved + audit_hours_saved, [], "hours")
    year1_cost = add("L15", "Year-1 cost", "aegis_annual_cost + implementation_cost",
                     inp.aegis_annual_cost + inp.implementation_cost, ["aegis_annual_cost", "implementation_cost"])
    net_y1 = add("L16", "Year-1 net benefit", "L13 − L15", realized - year1_cost, [])
    net_steady = add("L17", "Steady-state annual net benefit", "L12 − aegis_annual_cost",
                     gross - inp.aegis_annual_cost, ["aegis_annual_cost"])

    roi_y1 = (net_y1 / year1_cost) if year1_cost > 0 else None
    roi_steady = (net_steady / inp.aegis_annual_cost) if inp.aegis_annual_cost > 0 else None
    payback_months = (year1_cost / (realized / 12)) if (realized > 0 and year1_cost > 0) else None

    assumptions = []
    for f in fields(inp):
        src, note = ASSUMPTION_META[f.name]
        assumptions.append({"key": f.name, "value": getattr(inp, f.name), "source": src, "note": note})

    hard_savings = assess_saving + audit_saving
    return {
        "inputs": asdict(inp),
        "line_items": items,
        "summary": {
            "gross_annual_benefit": _r(gross),
            "year1_realized_benefit": _r(realized),
            "year1_cost": _r(year1_cost),
            "year1_net_benefit": _r(net_y1),
            "year1_roi_pct": None if roi_y1 is None else _r(roi_y1 * 100, 1),
            "steady_state_net_benefit": _r(net_steady),
            "steady_state_roi_pct": None if roi_steady is None else _r(roi_steady * 100, 1),
            "payback_months": None if payback_months is None else _r(payback_months, 1),
            "hours_freed_per_year": _r(hours_freed, 1),
            "efficiency_share_of_gross_pct": _r(hard_savings / gross * 100, 1) if gross > 0 else None,
        },
        "assumptions": assumptions,
        "hypotheses_to_validate": [a["key"] for a in assumptions if a["source"] == HYPOTHESIS],
        "disclaimer": DISCLAIMER,
    }


SCENARIO_FACTORS = {"conservative": 0.5, "base": 1.0, "optimistic": 1.5}
_SCALED = ("assessment_effort_reduction", "audit_prep_reduction", "approval_cycle_reduction",
           "incident_likelihood_reduction")


def scenarios(inp: ROIInputs) -> dict[str, dict]:
    """Conservative / base / optimistic: scale every effect hypothesis by 0.5 / 1.0 / 1.5 (capped at 0.9)."""
    out = {}
    for name, k in SCENARIO_FACTORS.items():
        d = asdict(inp)
        for key in _SCALED:
            d[key] = min(0.9, d[key] * k)
        out[name] = calculate(ROIInputs(**d))
    return out


# --------------------------------------------------------------------------- rendering

def _fmt(v, unit: str) -> str:
    if v is None:
        return "n/a"
    if unit == "currency":
        return f"{v:,.0f}"
    if unit == "hours":
        return f"{v:,.1f} h"
    if unit == "days":
        return f"{v:,.1f} d"
    return str(v)


def to_markdown(result: dict, title: str = "AEGIS ROI estimate", currency: str = "USD") -> str:
    s = result["summary"]
    lines = [f"# {title}", "", f"> {result['disclaimer']}", "", f"Currency: {currency}. All values per year unless stated.",
             "", "## Summary", "", "| Measure | Value |", "|---|---|"]
    rows = [
        ("Gross modelled annual benefit", _fmt(s["gross_annual_benefit"], "currency")),
        ("Year-1 realized benefit", _fmt(s["year1_realized_benefit"], "currency")),
        ("Year-1 cost", _fmt(s["year1_cost"], "currency")),
        ("Year-1 net benefit", _fmt(s["year1_net_benefit"], "currency")),
        ("Year-1 ROI", "n/a" if s["year1_roi_pct"] is None else f"{s['year1_roi_pct']}%"),
        ("Steady-state annual net benefit", _fmt(s["steady_state_net_benefit"], "currency")),
        ("Steady-state ROI", "n/a" if s["steady_state_roi_pct"] is None else f"{s['steady_state_roi_pct']}%"),
        ("Payback", "n/a" if s["payback_months"] is None else f"{s['payback_months']} months"),
        ("Governance hours freed (modelled)", _fmt(s["hours_freed_per_year"], "hours")),
        ("Efficiency savings share of gross benefit",
         "n/a" if s["efficiency_share_of_gross_pct"] is None else f"{s['efficiency_share_of_gross_pct']}%"),
    ]
    lines += [f"| {a} | {b} |" for a, b in rows]
    lines += ["", "## Calculation", "", "| Line | Item | Formula | Value |", "|---|---|---|---|"]
    for it in result["line_items"]:
        lines.append(f"| {it['id']} | {it['label']} | `{it['formula']}` | {_fmt(it['value'], it['unit'])} |")
    lines += ["", "## Assumptions", "", "| Assumption | Value | Source | Note |", "|---|---|---|---|"]
    for a in result["assumptions"]:
        lines.append(f"| `{a['key']}` | {a['value']} | {a['source']} | {a['note']} |")
    lines += ["", "Hypotheses to validate in pilots: " + ", ".join(f"`{k}`" for k in result["hypotheses_to_validate"]), ""]
    return "\n".join(lines)


def to_csv(result: dict) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(["section", "id", "label", "formula", "value", "unit", "source", "note"])
    for a in result["assumptions"]:
        w.writerow(["assumption", a["key"], a["key"], "", a["value"], "", a["source"], a["note"]])
    for it in result["line_items"]:
        w.writerow(["calculation", it["id"], it["label"], it["formula"], it["value"], it["unit"],
                    "derived", "depends on: " + ", ".join(it["assumptions"]) if it["assumptions"] else "derived"])
    for k, v in result["summary"].items():
        w.writerow(["summary", k, k, "", "" if v is None else v, "", "derived", ""])
    return buf.getvalue()


# Synthetic worked example (fictional organization; not a customer).
EXAMPLE_INPUTS = ROIInputs(
    ai_systems=40,
    assessment_hours_per_system=24,
    hourly_cost=95,
    audit_prep_hours_per_year=600,
    approval_cycle_days=45,
    assessments_per_system_per_year=1,
    new_use_cases_per_year=12,
    delay_cost_per_day=500,
    annual_incident_probability=0.10,
    expected_incident_cost=750_000,
    aegis_annual_cost=75_000,
    implementation_cost=30_000,
)


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="AEGIS ROI & business-case calculator (assumption-labelled).")
    p.add_argument("--example", action="store_true", help="use the synthetic worked-example inputs")
    p.add_argument("--format", choices=["md", "csv", "json"], default="md")
    p.add_argument("--scenarios", action="store_true", help="print conservative/base/optimistic summaries (md/json)")
    p.add_argument("--currency", default="USD")
    flag = {
        "ai_systems": "--ai-systems", "assessment_hours_per_system": "--assessment-hours",
        "hourly_cost": "--hourly-cost", "audit_prep_hours_per_year": "--audit-prep-hours",
        "approval_cycle_days": "--approval-cycle-days",
        "assessments_per_system_per_year": "--assessments-per-year", "new_use_cases_per_year": "--new-use-cases",
        "delay_cost_per_day": "--delay-cost-per-day", "annual_incident_probability": "--incident-probability",
        "expected_incident_cost": "--incident-cost", "aegis_annual_cost": "--aegis-annual-cost",
        "implementation_cost": "--implementation-cost",
        "assessment_effort_reduction": "--assessment-effort-reduction",
        "audit_prep_reduction": "--audit-prep-reduction", "approval_cycle_reduction": "--approval-cycle-reduction",
        "incident_likelihood_reduction": "--incident-likelihood-reduction", "realization_rate": "--realization-rate",
    }
    for f in fields(ROIInputs):
        p.add_argument(flag[f.name], dest=f.name, type=float, default=None,
                       help=f"{ASSUMPTION_META[f.name][1]} [{ASSUMPTION_META[f.name][0]}]")
    return p


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    if args.example:
        base = asdict(EXAMPLE_INPUTS)
    else:
        base = {f.name: f.default for f in fields(ROIInputs) if f.default is not MISSING}
    for f in fields(ROIInputs):
        v = getattr(args, f.name)
        if v is not None:
            base[f.name] = v
    missing = [k for k in ("ai_systems", "assessment_hours_per_system", "hourly_cost") if k not in base]
    if missing:
        print("missing required inputs: " + ", ".join(missing), file=sys.stderr)
        return 2
    for k in ("ai_systems", "new_use_cases_per_year"):
        if k in base:
            base[k] = int(base[k])
    try:
        inp = ROIInputs(**base)
        result = calculate(inp)
    except ValueError as e:
        print(f"invalid input: {e}", file=sys.stderr)
        return 2
    if args.scenarios:
        sc = {k: v["summary"] for k, v in scenarios(inp).items()}
        if args.format == "json":
            print(json.dumps(sc, indent=2))
        else:
            print("| Scenario | Gross benefit | Year-1 net | Year-1 ROI | Payback (months) |")
            print("|---|---|---|---|---|")
            for k, s in sc.items():
                print(f"| {k} | {s['gross_annual_benefit']:,.0f} | {s['year1_net_benefit']:,.0f} | "
                      f"{s['year1_roi_pct']}% | {s['payback_months']} |")
        return 0
    if args.format == "json":
        print(json.dumps(result, indent=2))
    elif args.format == "csv":
        sys.stdout.write(to_csv(result))
    else:
        print(to_markdown(result, currency=args.currency))
    return 0


if __name__ == "__main__":
    sys.exit(main())
