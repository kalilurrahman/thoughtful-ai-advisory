---
title: "Pilot B success-metrics scorecard"
pilot: B
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead with VERITRAIL Shield Lead
status: Not started — no measurements recorded
---

# Pilot B — success-metrics scorecard

> **No results recorded.** The pilot has not started. Every "Result" cell stays empty until measured. Never estimate
> or back-fill a result. Machine-readable version: [`success_metrics_scorecard.csv`](success_metrics_scorecard.csv).

## Core metrics (from the VERITRAIL Blueprint)

| ID | Metric | Target | Measurement method | Data source | When | Owner | Result | Met? |
|---|---|---|---|---|---|---|---|---|
| M1 | AI systems registered | ≥ 25 | Count Register records (LLM features, agents, internal AI tools, vendor AI) meeting the completeness definition and confirmed by owner | Register export + owner confirmation log | End W2; final W6 | VERITRAIL delivery lead | | |
| M2 | High-risk systems assessed | 100% of confirmed High-tier systems in scope | (High-tier systems with completed, owner-reviewed GL-02 assessment) ÷ (confirmed High-tier systems in scope) | Register tier field + deep-dive records + tier approval records | End W4; final W6 | VERITRAIL delivery lead | | |
| M3 | Agent-assisted assessment completion | ≥ 70% | Participants completing the self-assessment through the VERITRAIL Agent ÷ participants invited | Pilot workspace audit log | End W3 | VERITRAIL product lead | | |
| M4 | Runtime policies drafted | ≥ 2 | Draft `veritrail.policy/v1` policies for the reviewed agents that pass `validate_policy` with zero errors and were reviewed with the agent owner | Policy files + validation output + review record | End W4–W5 | VERITRAIL Shield lead | | |
| M5 | Executive report accepted | Accepted | Sponsor written confirmation (accept / accept with changes / decline) | Sponsor sign-off record | W6 | VERITRAIL delivery lead | | |
| M6 | Follow-on commercial discussion initiated | Yes | Proposal presented and dated next meeting with a budget holder agreed | CRM record + proposal | W6 | VERITRAIL commercial lead | | |

## Pilot B supplementary signals (not pass/fail)

| ID | Signal | Measurement method | Data source | Owner | Result | Notes |
|---|---|---|---|---|---|---|
| S4 | Observe-mode decision review | If the partner runs an Observe trial in non-production: count of would-be decisions by type (DENY, REQUIRE_HUMAN_APPROVAL, REDACT…) and reviewer-judged false-positive share on a sample | Partner-operated decision logs (metadata/redacted), reviewed in partner environment | Shield lead | | Optional; requires partner choice |
| S5 | Developer adoption | Policies committed to partner repo; CI schema validation added (Y/N); engineers who reviewed or edited a policy (count) | Partner repo metadata shown by partner; survey | Shield lead | | Policy-as-code adoption signal |
| S7 | Agent citation accuracy | Correct citations on reviewer check, sample ≥ 20 Agent answers | Reviewer log | Product lead | | |
| S8 | Survey scores | Section means A–H, especially E (runtime practicality) | Feedback survey | Product lead | | |
| S9 | Approval-rule workability | Approver roles named for every REQUIRE_HUMAN_APPROVAL rule; partner estimate of approval latency acceptability | Agent review records; survey E4 | Shield lead | | Informs R-04 runtime friction |

## Evidence labels for scorecard entries

Results from partner statements are **User-asserted**; results from logs or documents reviewed by a named VERITRAIL
reviewer are **Verified**.
