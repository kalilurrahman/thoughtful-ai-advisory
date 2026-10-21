---
title: "AEGIS ROI worked example (synthetic)"
status: illustrative
effective_date: 2026-10-21
generated_by: content/commercial/roi_calculator.py --example
---

# AEGIS ROI worked example — synthetic organization

> **Synthetic data.** "Example Co" is fictional. No figure below is a customer result or a market statistic. Effect
> sizes labelled *AEGIS hypothesis — validate in pilot* have not been measured. Pricing used here is itself a
> hypothesis (see `pricing_models.md`).

## Scenario

Example Co is a regulated enterprise with **40 AI systems**, a manual assessment process (**24 person-hours** per
assessment, one assessment per system per year), **600 hours/year** of AI evidence preparation for audits and customer
reviews, a **45-day** approval cycle and **12 new use cases** per year. Its governance team estimates that each day of
approval delay costs **USD 500** per use case in deferred value, and that there is a **10%** annual chance of a
material AI incident costing **USD 750,000**. The illustrative AEGIS proposal is **USD 75,000/year** plus a
**USD 30,000** Governance Baseline.

Reproduce:

```
python3 content/commercial/roi_calculator.py --example                 # Markdown (below)
python3 content/commercial/roi_calculator.py --example --format csv    # roi_worked_example.csv
python3 content/commercial/roi_calculator.py --example --scenarios     # sensitivity table
```

## Result

> Illustrative business case. Effect sizes labelled 'AEGIS hypothesis — validate in pilot' have not been measured with customers. Results are estimates, not guaranteed savings, and are not financial advice. Risk-reduction value is an expected-value estimate, not a prediction that incidents will or will not occur.

Currency: USD. All values per year unless stated.

### Summary

| Measure | Value |
|---|---|
| Gross modelled annual benefit | 160,980 |
| Year-1 realized benefit | 120,735 |
| Year-1 cost | 105,000 |
| Year-1 net benefit | 15,735 |
| Year-1 ROI | 15.0% |
| Steady-state annual net benefit | 85,980 |
| Steady-state ROI | 114.6% |
| Payback | 10.4 months |
| Governance hours freed (modelled) | 684.0 h |
| Efficiency savings share of gross benefit | 40.4% |

### Calculation

| Line | Item | Formula | Value |
|---|---|---|---|
| L1 | Assessment effort today (hours/yr) | `ai_systems × assessment_hours_per_system × assessments_per_system_per_year` | 960.0 h |
| L2 | Assessment cost today | `L1 × hourly_cost` | 91,200 |
| L3 | Assessment hours saved | `L1 × assessment_effort_reduction` | 384.0 h |
| L4 | Assessment cost saving | `L2 × assessment_effort_reduction` | 36,480 |
| L5 | Audit-preparation cost today | `audit_prep_hours_per_year × hourly_cost` | 57,000 |
| L6 | Audit-preparation hours saved | `audit_prep_hours_per_year × audit_prep_reduction` | 300.0 h |
| L7 | Audit-preparation cost saving | `L5 × audit_prep_reduction` | 28,500 |
| L8 | Approval days saved per use case | `approval_cycle_days × approval_cycle_reduction` | 13.5 d |
| L9 | Time-to-value benefit | `new_use_cases_per_year × L8 × delay_cost_per_day` | 81,000 |
| L10 | Expected annual incident loss today | `annual_incident_probability × expected_incident_cost` | 75,000 |
| L11 | Risk-reduction value (expected) | `L10 × incident_likelihood_reduction` | 15,000 |
| L12 | Gross modelled annual benefit | `L4 + L7 + L9 + L11` | 160,980 |
| L13 | Year-1 realized benefit | `L12 × realization_rate` | 120,735 |
| L14 | Governance hours freed per year (modelled) | `L3 + L6` | 684.0 h |
| L15 | Year-1 cost | `aegis_annual_cost + implementation_cost` | 105,000 |
| L16 | Year-1 net benefit | `L13 − L15` | 15,735 |
| L17 | Steady-state annual net benefit | `L12 − aegis_annual_cost` | 85,980 |

### Assumptions

| Assumption | Value | Source | Note |
|---|---|---|---|
| `ai_systems` | 40 | Customer input | Number of AI systems in scope (inventory count or best estimate). |
| `assessment_hours_per_system` | 24 | Customer input | Person-hours to complete one risk/impact assessment today. |
| `hourly_cost` | 95 | Customer input | Blended fully loaded hourly cost of people doing governance work. |
| `audit_prep_hours_per_year` | 600 | Customer input | Person-hours per year assembling AI evidence for audits, customers and regulators. |
| `approval_cycle_days` | 45 | Customer input | Average calendar days from use-case intake to approval decision today. |
| `assessments_per_system_per_year` | 1 | Customer input | Assessments or reassessments per system per year (initial, change-triggered, periodic). |
| `new_use_cases_per_year` | 12 | Customer input | New AI use cases going through approval per year. |
| `delay_cost_per_day` | 500 | Customer estimate | Business value lost per use case per day of approval delay. Default 0 excludes this benefit. |
| `annual_incident_probability` | 0.1 | Customer estimate | Probability of at least one material AI incident in a year. |
| `expected_incident_cost` | 750000 | Customer estimate | Expected cost of a material AI incident (response, remediation, legal, customer impact). |
| `aegis_annual_cost` | 75000 | Customer input | Annual AEGIS subscription from the commercial proposal (pricing is itself a hypothesis). |
| `implementation_cost` | 30000 | Customer input | One-time cost, e.g. Governance Baseline fee and internal implementation effort. |
| `assessment_effort_reduction` | 0.4 | AEGIS hypothesis — validate in pilot | Share of assessment effort removed by agent-assisted, pre-populated assessments. |
| `audit_prep_reduction` | 0.5 | AEGIS hypothesis — validate in pilot | Share of audit-preparation effort removed by continuous evidence capture and evidence packs. |
| `approval_cycle_reduction` | 0.3 | AEGIS hypothesis — validate in pilot | Share of approval cycle time removed by triage, routing and complete submissions. |
| `incident_likelihood_reduction` | 0.2 | AEGIS hypothesis — validate in pilot | Relative reduction in material-incident likelihood from runtime guardrails, testing and oversight. |
| `realization_rate` | 0.75 | AEGIS hypothesis — validate in pilot | Share of modelled benefit realized in year 1, reflecting adoption ramp. |

Hypotheses to validate in pilots: `assessment_effort_reduction`, `audit_prep_reduction`, `approval_cycle_reduction`, `incident_likelihood_reduction`, `realization_rate`


## Sensitivity — read this before using the numbers

| Scenario (effect hypotheses × 0.5 / 1.0 / 1.5) | Gross benefit | Year-1 net | Year-1 ROI | Payback (months) |
|---|---|---|---|---|
| Conservative | 80,490 | -44,632 | -42.5% | 20.9 |
| Base | 160,980 | 15,735 | 15.0% | 10.4 |
| Optimistic | 241,470 | 76,102 | 72.5% | 7.0 |

**Without the time-to-value benefit** (`--delay-cost-per-day 0`), the base case falls to a gross benefit of
USD 79,980, a year-1 net of USD −45,015 and a steady-state net of USD 4,980. In other words:

1. At this scale, **efficiency savings alone roughly cover the subscription but not the first year**. The business
   case depends materially on faster approvals (time-to-value) and on risk reduction — both of which are customer
   estimates multiplied by unvalidated AEGIS hypotheses.
2. The pilot scorecards therefore measure assessment time per system, evidence-pack assembly time and approval
   cycle time before and after (see `content/pilots/pilot_a/success_metrics_scorecard.md`). Replace the hypotheses
   with measured values before using this model in a proposal.
3. Present ranges (conservative/base/optimistic), never a single headline number, and show the assumptions table.

## How to use in a sales conversation

- Fill the *Customer input* lines with the prospect during discovery; let them set the *Customer estimate* lines.
- Keep AEGIS hypotheses at defaults or lower; never raise them above the optimistic scenario without pilot data.
- Attach the Markdown or CSV output to the proposal so the customer's finance team can audit every formula.
