---
title: "Pilot A success-metrics scorecard"
pilot: A
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
status: Not started — no measurements recorded
---

# Pilot A — success-metrics scorecard

> **No results recorded.** The pilot has not started. Every "Result" cell stays empty until measured. Never estimate
> or back-fill a result. Machine-readable version: [`success_metrics_scorecard.csv`](success_metrics_scorecard.csv).

## Core metrics (from the VERITRAIL Blueprint)

| ID | Metric | Target | Measurement method | Data source | When | Owner | Result | Met? |
|---|---|---|---|---|---|---|---|---|
| M1 | AI systems registered | ≥ 25 | Count Register records meeting the completeness definition (inventory workshop kit §5) and confirmed by owner | Register export (timestamped) + owner confirmation log | End W2; final W6 | VERITRAIL delivery lead | | |
| M2 | High-risk systems assessed | 100% of confirmed High-tier systems in scope | (High-tier systems with completed, owner-reviewed GL-02 assessment) ÷ (confirmed High-tier systems in scope) | Register tier field + deep-dive records + tier approval records | End W4; final W6 | VERITRAIL delivery lead | | |
| M3 | Agent-assisted assessment completion | ≥ 70% | (Participants who completed the maturity self-assessment through the VERITRAIL Agent guided journey) ÷ (participants invited) | Pilot workspace audit log (session start/complete events) | End W3 | VERITRAIL product lead | | |
| M4 | Runtime policies drafted | ≥ 2 | Count draft policies that pass `validate_policy` with zero errors and were reviewed with the owner; N/A with rationale if the partner has < 2 GenAI/agent systems | Policy files + validation output + review record | End W5 | VERITRAIL Shield lead | | |
| M5 | Executive report accepted | Accepted | Sponsor confirms in writing that the report is suitable to present to leadership (accept / accept with changes / decline) | Sponsor email or sign-off record | W6 | VERITRAIL delivery lead | | |
| M6 | Follow-on commercial discussion initiated | Yes | A follow-on proposal is presented and a dated next meeting with a budget holder is agreed | CRM record + proposal document | W6 | VERITRAIL commercial lead | | |

## Supplementary signals (inform ROI and product hypotheses; not pass/fail)

| ID | Signal | Measurement method | Data source | Owner | Baseline | Pilot | Notes |
|---|---|---|---|---|---|---|---|
| S1 | Assessment effort per system | Partner-reported person-hours for their last manual assessment (baseline) vs. logged time for VERITRAIL deep-dives | Baseline interview W1; workspace timestamps + participant log | Delivery lead | | | Feeds `assessment_effort_reduction` in ROI model |
| S2 | Evidence-pack assembly time | Partner-reported hours to assemble evidence for one system (baseline) vs. time to produce the VERITRAIL evidence index/pack for one deep-dive system | Baseline interview; workspace timestamps | Delivery lead | | | Feeds `audit_prep_reduction` |
| S3 | Approval cycle time | Partner-reported median days intake → approval (baseline); pilot cannot measure post-change cycle time — record as follow-on metric | Baseline interview; partner workflow data if available | Delivery lead | | | Feeds `approval_cycle_reduction` (validate in follow-on) |
| S6 | Self-reported vs. validated score delta | Overall and per-domain difference | Assessment outputs | Delivery lead | | | Calibrates maturity model |
| S7 | Agent citation accuracy | Share of sampled Agent answers whose citations are correct on reviewer check (sample ≥ 20 answers) | Reviewer log | Product lead | | | Feeds agent evaluation set |
| S8 | Survey scores | Section means A–H | Feedback survey | Product lead | | | See survey analysis plan |

## Evidence labels for scorecard entries

A result is entered only with its evidence reference. Results drawn from partner statements (e.g. S1–S3 baselines) are
**User-asserted**; results drawn from system logs or documents reviewed by the delivery lead are **Verified**.
