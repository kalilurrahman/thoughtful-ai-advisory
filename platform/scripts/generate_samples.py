#!/usr/bin/env python3
"""Regenerate synthetic sample deliverables in output/sample_reports.

Everything produced here is SYNTHETIC — fictional organizations, self-reported
answers — and is labelled as such. It demonstrates the product; it is not
evidence about any real organization.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for d in sorted((ROOT / "app").iterdir()):
    if d.is_dir():
        sys.path.insert(0, str(d))

from veritrail_assessment.engine import score_assessment  # noqa: E402
from veritrail_assessment.risk_tier import calculate_risk_tier  # noqa: E402
from veritrail_reports.exporters import write_json, write_markdown  # noqa: E402
from veritrail_reports.maturity import render_maturity_markdown  # noqa: E402
from veritrail_reports.pdf import markdown_to_pdf  # noqa: E402

OUT = ROOT / "output" / "sample_reports"
BANNER = ("> **Synthetic example.** Fictional organization and self-reported answers generated to demonstrate "
          "VERITRAIL outputs. Not evidence about any real organization.\n\n")

PERSONAS = [
    {
        "slug": "example_health_group_initial",
        "lead": {"company": "Example Health Group (synthetic)", "name": "Synthetic CISO"},
        "profile": {"industry": "healthcare_pharma", "org_size": "5000+", "ai_systems": "unknown",
                    "uses_agents": False, "eu_operations": True},
        "answers": {"STR-Q1": 2, "STR-Q2": 1, "STR-Q3": 2, "INV-Q1": 1, "INV-Q2": 1, "INV-Q3": 2,
                    "RSK-Q1": 2, "RSK-Q2": 1, "RSK-Q3": 1, "DAT-Q1": 2, "DAT-Q2": 3, "DAT-Q3": 2,
                    "SEC-Q1": 2, "SEC-Q2": 1, "SEC-Q3": 2, "FST-Q1": 1, "FST-Q2": 2, "FST-Q3": 1,
                    "HUM-Q1": 2, "HUM-Q2": 2, "HUM-Q3": 1, "ASR-Q1": 1, "ASR-Q2": 1, "ASR-Q3": 1},
    },
    {
        "slug": "example_bank_developing",
        "lead": {"company": "Example Bank plc (synthetic)", "name": "Synthetic CRO"},
        "profile": {"industry": "bfsi", "org_size": "5000+", "ai_systems": "25-99", "uses_agents": True,
                    "eu_operations": True},
        "answers": {"STR-Q1": 4, "STR-Q2": 3, "STR-Q3": 3, "INV-Q1": 2, "INV-Q2": 3, "INV-Q3": 2,
                    "RSK-Q1": 4, "RSK-Q2": 3, "RSK-Q3": 2, "DAT-Q1": 3, "DAT-Q2": 4, "DAT-Q3": 2,
                    "SEC-Q1": 3, "SEC-Q2": 2, "SEC-Q3": 2, "FST-Q1": 4, "FST-Q2": 3, "FST-Q3": 3,
                    "HUM-Q1": 3, "HUM-Q2": 3, "HUM-Q3": 2, "ASR-Q1": 3, "ASR-Q2": 2, "ASR-Q3": 3},
    },
    {
        "slug": "examplesoft_saas_defined",
        "lead": {"company": "ExampleSoft (synthetic)", "name": "Synthetic VP Engineering"},
        "profile": {"industry": "saas_product", "org_size": "250-1000", "ai_systems": "10-24", "uses_agents": True,
                    "eu_operations": False},
        "answers": {"STR-Q1": 4, "STR-Q2": 3, "STR-Q3": 4, "INV-Q1": 4, "INV-Q2": 3, "INV-Q3": 4,
                    "RSK-Q1": 3, "RSK-Q2": 4, "RSK-Q3": 3, "DAT-Q1": 4, "DAT-Q2": 3, "DAT-Q3": 4,
                    "SEC-Q1": 4, "SEC-Q2": 3, "SEC-Q3": 4, "FST-Q1": 3, "FST-Q2": 4, "FST-Q3": 2,
                    "HUM-Q1": 3, "HUM-Q2": 4, "HUM-Q3": 3, "ASR-Q1": 3, "ASR-Q2": 3, "ASR-Q3": 4},
    },
]

USE_CASES = {
    "customer_support_agent": {
        "name": "Customer support agent", "purpose": "Answer customer queries and update tickets using CRM data",
        "decision_impact": "advisory", "affected_parties": "customers", "data_sensitivity": "personal",
        "autonomy": "acts_with_approval", "tools": ["crm_read", "crm_write", "send_email"], "external_actions": True,
        "domain_category": "customer_service", "genai": True, "vendor_model": True, "eu_exposure": True,
        "environment": "production"},
    "credit_decision_support": {
        "name": "SME credit decision support", "purpose": "Recommend credit limits for small-business applicants",
        "decision_impact": "material", "affected_parties": "customers", "data_sensitivity": "personal",
        "autonomy": "suggests", "domain_category": "credit", "genai": False, "vendor_model": False,
        "eu_exposure": True, "environment": "production"},
    "meeting_summariser": {
        "name": "Internal meeting summariser", "purpose": "Summarise internal meeting transcripts",
        "decision_impact": "none", "affected_parties": "internal", "data_sensitivity": "internal",
        "autonomy": "suggests", "domain_category": "internal_productivity", "genai": True, "vendor_model": True},
}


def main() -> int:
    mdir = OUT / "maturity"
    index = ["# Sample maturity reports (synthetic)", "", "| Organization | Score | Level | Critical flags | Files |",
             "|---|---|---|---|---|"]
    for p in PERSONAS:
        r = score_assessment(p["answers"], p["profile"])
        md = BANNER + render_maturity_markdown(r, p["lead"], generated="2026-10-21")
        write_markdown(md, mdir / f"{p['slug']}.md")
        markdown_to_pdf(md, mdir / f"{p['slug']}.pdf", title=f"AI Governance Maturity Report — {p['lead']['company']}")
        write_json({"synthetic": True, "lead": p["lead"], "profile": p["profile"], "answers": p["answers"], "result": r},
                   mdir / f"{p['slug']}.json")
        index.append(f"| {p['lead']['company']} | {r['overall_score']} | {r['maturity_level']} | {len(r['critical_flags'])} | "
                     f"[md]({p['slug']}.md) · [pdf]({p['slug']}.pdf) · [json]({p['slug']}.json) |")
        print(f"maturity: {p['slug']}: {r['overall_score']} {r['maturity_level']}")
    write_markdown("\n".join(index) + "\n", mdir / "README.md")

    rdir = OUT / "risk_tier"
    for k, prof in USE_CASES.items():
        r = calculate_risk_tier(prof)
        write_json({"synthetic": True, "profile": prof, "result": r}, rdir / f"{k}.json")
        print(f"risk tier: {k}: {r['tier']} ({r['score']})")

    bp = ROOT / "output" / "VERITRAIL_Launch_and_Enhancement_Blueprint_v3.md"
    if bp.exists():
        markdown_to_pdf(bp.read_text(encoding="utf-8"), ROOT / "output" / "VERITRAIL_Enterprise_Blueprint.pdf",
                        title="VERITRAIL Enterprise Blueprint v3.0")
        print("blueprint pdf: output/VERITRAIL_Enterprise_Blueprint.pdf")
    return 0


if __name__ == "__main__":
    sys.exit(main())
