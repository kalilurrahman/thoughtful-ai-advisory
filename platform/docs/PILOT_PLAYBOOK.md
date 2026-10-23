# VERITRAIL Pilot Playbook

Version 3.0 · 21 October 2026 · Owner: Delivery Lead · Status: Ready — awaiting design partners

> **Both pilots are "Not started — awaiting design-partner recruitment."** No partner is signed and no results exist.
> See [`content/pilots/pilot_status_tracker.md`](../content/pilots/pilot_status_tracker.md).

This playbook ties together everything needed to recruit, run and close an VERITRAIL design-partner pilot. The same
playbook, with paid terms, runs the commercial **Governance Baseline**.

## 1. Why pilots

Pilots validate the product with real organizations before scale: whether the framework is clear, the assessment
credible and short enough, the Agent trustworthy, runtime guardrails practical, reports useful — and whether
organizations will pay, for what, and how. Every pilot output feeds the backlog, the risk register and the pricing
hypotheses.

## 2. The two pilots

| | Pilot A | Pilot B |
|---|---|---|
| Partner | Regulated enterprise, 20–100 AI systems | AI-forward SaaS / GCC / enterprise with LLM apps and agents |
| Focus | Inventory, maturity, compliance evidence (readiness), workflow | Agent governance, runtime guardrails, developer adoption, policy-as-code |
| Typical sectors | BFSI, healthcare & pharma, public sector, regulated GCC | SaaS, GCC/IT services, digital-native enterprise |
| Agent reviews | Optional (if agents exist) | Core (2) |
| Typical follow-on | Register + Control, then Assurance | Shield (+ Register for agents) |
| Plan | [`pilot_a/pilot_plan.md`](../content/pilots/pilot_a/pilot_plan.md) | [`pilot_b/pilot_plan.md`](../content/pilots/pilot_b/pilot_plan.md) |
| Kit index | [`pilot_a/kit_index.md`](../content/pilots/pilot_a/kit_index.md) | [`pilot_b/kit_index.md`](../content/pilots/pilot_b/kit_index.md) |

## 3. End-to-end flow

```
Recruit ─► Qualify ─► Contract ─► W1 Kick-off ─► W2 Inventory ─► W3 Maturity ─► W4 Deep-dives ─► W5 Gaps ─► W6 Readout ─► Convert
 tracker    scorecard  NDA/DPA/    safeguards     workshop kit    session guide  deep-dive plan    gap register  exec report   proposal
 outreach   (≥32/48)   agreement   onboarding     intake CSV                     agent protocol    roadmap       survey        onboarding
                                   checklist                                                       Shield recs
```

## 4. Week by week

| Week | Objective | Key artefacts | Metric checkpoint |
|---|---|---|---|
| 1 — Kick-off, scope, data access | Agree scope, success metrics and safeguards; collect metadata; record baselines | Onboarding checklist (A/B); [`data_access_privacy_safeguards.md`](../content/pilots/templates/data_access_privacy_safeguards.md) | Safeguards signed (gate) |
| 2 — Inventory workshops | Register ≥ 25 systems with owners and tier factors; surface vendor/shadow AI | [`inventory_workshop_kit.md`](../content/pilots/templates/inventory_workshop_kit.md); [`ai_inventory_intake_template.csv`](../content/pilots/templates/ai_inventory_intake_template.csv) | M1 |
| 3 — Maturity + evidence | Self-reported vs. validated maturity; evidence index | [`maturity_assessment_session_guide.md`](../content/pilots/templates/maturity_assessment_session_guide.md) | M3; S6 |
| 4 — Deep-dives (5) + agent reviews (≤ 2) | Tier-proportionate assessments; confirmed tiers; tool matrices; draft policies | [`deep_dive_assessment_plan.md`](../content/pilots/templates/deep_dive_assessment_plan.md); [`agent_review_protocol.md`](../content/pilots/templates/agent_review_protocol.md) | M2 progress; M4 drafts |
| 5 — Gap analysis, control mapping, runtime recs | Consolidated, cited gap register; remediation roadmap; runtime recommendations | [`gap_register_template.csv`](../content/pilots/templates/gap_register_template.csv); [`remediation_roadmap_template.md`](../content/pilots/templates/remediation_roadmap_template.md); [`runtime_shield_recommendations_template.md`](../content/pilots/templates/runtime_shield_recommendations_template.md) | M2, M4 final |
| 6 — Exec readout, feedback, proposal | Leadership-ready report; structured feedback; follow-on proposal | [`executive_readiness_report_template.md`](../content/pilots/templates/executive_readiness_report_template.md); [`feedback_survey.md`](../content/pilots/templates/feedback_survey.md); [`commercial_follow_on_proposal.md`](../content/pilots/templates/commercial_follow_on_proposal.md) | M5, M6 |

A 4-week compressed variant merges Weeks 2–3 and 4–5 when the partner already has a usable inventory.

## 5. Success metrics

| ID | Metric | Target | Where measured |
|---|---|---|---|
| M1 | AI systems registered | ≥ 25 | Register export + owner confirmations |
| M2 | High-risk systems assessed | 100% of confirmed High-tier in scope | Deep-dive records + tier approvals |
| M3 | Agent-assisted assessment completion | ≥ 70% | Pilot workspace audit log |
| M4 | Runtime policies drafted | ≥ 2 | Validated draft policies + review record |
| M5 | Executive report accepted | Accepted | Sponsor sign-off |
| M6 | Follow-on commercial discussion initiated | Yes | CRM + proposal |

Measurement method and data source per metric: [`pilot_a/success_metrics_scorecard.md`](../content/pilots/pilot_a/success_metrics_scorecard.md),
[`pilot_b/success_metrics_scorecard.md`](../content/pilots/pilot_b/success_metrics_scorecard.md). Supplementary
signals S1–S9 feed the ROI model, maturity calibration and Shield design.

## 6. Non-negotiables during pilots

1. **Metadata-only by default; no production data into external LLMs.** Exceptions only with written approval.
2. **Evidence labels on every finding.** Verified only with a named reviewer.
3. **No compliance claims.** Readiness indicators only, with the standard disclaimer.
4. **Human approval** for tier changes, exceptions, production runtime policy changes, sensitive exports and external
   communications. VERITRAIL never activates partner runtime policy.
5. **Real control IDs only**, from `content/controls/controls.yaml`.
6. **No publicity** — names, logos, quotes or metrics — without written approval and verified metrics.
7. **Honest scorecards** — empty until measured; misses explained, not hidden.

## 7. Roles and RACI

| Activity | VERITRAIL delivery lead | VERITRAIL analyst | VERITRAIL Shield lead | VERITRAIL commercial lead | Partner sponsor | Partner pilot lead | System owners |
|---|---|---|---|---|---|---|---|
| Qualification & contract | C | — | — | A/R | C | C | — |
| Safeguards sign-off | R | — | — | C | I | A | — |
| Inventory workshops | A | R | — | — | I | R | R |
| Maturity calibration | A | R | — | — | I | R | C |
| Deep-dives | A | R | C | — | I | C | R |
| Agent reviews | C | C | A/R | — | I | C | R |
| Gap register & roadmap | A | R | R | — | I | C | C |
| Executive readout | A/R | C | C | C | A (acceptance) | R | I |
| Follow-on proposal | C | — | C | A/R | A (decision) | C | — |

A = accountable, R = responsible, C = consulted, I = informed.

## 8. Risks specific to pilots

| Risk | Mitigation |
|---|---|
| R-01 sensitive data | Safeguards gate in Week 1; redaction; metadata-only |
| R-05 scope creep | Scope note; swap-or-defer rule |
| R-06 low conversion | Qualification with budget path; Week 6 proposal; conversion credit |
| R-12 recruitment | Outreach sequence; warm intros; self-assessment lead tags |
| R-13 optimism bias | Validated score alongside self-reported |

## 9. After the pilot

- Update the tracker, scorecard and survey analysis.
- Feed results into [BACKLOG](BACKLOG.md), [RISK_REGISTER](RISK_REGISTER.md), `content/commercial/pricing_models.md`
  and the ROI model (replace hypotheses with measured signals where valid).
- On conversion, start the [90-day onboarding plan](../content/commercial/customer_onboarding_90_day_plan.md).
- Delete or return pilot data per the retention schedule and confirm in writing.
