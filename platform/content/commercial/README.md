---
title: "AEGIS commercial kit"
version: 1.0.0
effective_date: 2026-10-21
owner: AEGIS Commercial Lead
---

# AEGIS commercial kit

> AEGIS is pre-pilot: there are no customers, case studies or measured results yet. All prices are hypotheses to
> validate in pilots. Never claim or imply otherwise.

| Asset | File | Use |
|---|---|---|
| Pricing models & packaging | [`pricing_models.md`](pricing_models.md) | Internal; pricing hypotheses, land-and-expand, discount rules |
| One-pager — Governance Baseline | [`one_pagers/governance_baseline.md`](one_pagers/governance_baseline.md) | Land offer |
| One-pager — Register | [`one_pagers/register.md`](one_pagers/register.md) | AI system of record |
| One-pager — Control | [`one_pagers/control.md`](one_pagers/control.md) | Policies, gates, lifecycle |
| One-pager — Shield | [`one_pagers/shield.md`](one_pagers/shield.md) | Runtime guardrails |
| One-pager — Assurance | [`one_pagers/assurance.md`](one_pagers/assurance.md) | Evidence and testing |
| One-pager — Agent | [`one_pagers/agent.md`](one_pagers/agent.md) | Governance copilot |
| One-pager — Industry packs | [`one_pagers/industry_packs.md`](one_pagers/industry_packs.md) | Sector overlays |
| Pilot-to-platform proposal | [`pilot_to_platform_proposal_template.md`](pilot_to_platform_proposal_template.md) | Conversion |
| ROI & business-case calculator | [`roi_calculator.py`](roi_calculator.py) | `python3 content/commercial/roi_calculator.py --help` |
| ROI worked example | [`roi_worked_example.md`](roi_worked_example.md) · [`roi_worked_example.csv`](roi_worked_example.csv) | Synthetic; shows sensitivity |
| Demo script (20 / 45 min) | [`demo_script.md`](demo_script.md) | Website → assessment → Agent → Shield → report |
| Objection handling | [`objection_handling.md`](objection_handling.md) | Sales and pilots |
| Case-study template | [`case_study_template.md`](case_study_template.md) | Requires written customer approval + verified metrics |
| 90-day onboarding plan | [`customer_onboarding_90_day_plan.md`](customer_onboarding_90_day_plan.md) | Post-signature |

Tests: `python3 -m pytest tests/unit/test_content_roi.py tests/unit/test_content_commercial.py -q`
