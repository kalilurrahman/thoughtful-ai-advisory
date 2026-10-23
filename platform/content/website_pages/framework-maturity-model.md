---
title: "VERITRAIL AI Governance Maturity Model — 5 levels, 8 weighted domains"
h1: "The VERITRAIL AI Governance Maturity Model"
slug: /framework/maturity-model/
description: "Five maturity levels from Initial to Optimized and eight weighted domains: how the VERITRAIL self-assessment scores AI governance and what each level means."
section: framework
nav_label: "Maturity model"
nav_order: 30
template: page
schema_type: WebPage
primary_cta: assessment
secondary_cta: baseline
faq:
  - q: "Is a maturity score a compliance rating?"
    a: "No. The score is an indicative, self-reported view of governance practice. It is labelled User-asserted and does not determine conformity with ISO/IEC 42001, compliance with the EU AI Act or alignment with NIST AI RMF."
  - q: "Why are some domains weighted more heavily?"
    a: "Inventory, risk management and security each carry 14% because weaknesses there tend to undermine every other domain: you cannot oversee or evidence systems you have not found, assessed or secured."
  - q: "What score should we aim for?"
    a: "There is no universal target. Many organizations aim for Defined (60+) across all domains before pursuing Managed in the domains most relevant to their risk profile. Your governance forum should set the target in line with risk appetite."
updated: 2026-10-21
---

The VERITRAIL maturity model gives leadership a consistent, comparable view of how well AI is governed — and, more usefully, where to invest next. It underpins the free [maturity self-assessment](/tools/maturity-assessment/) and is validated with evidence during a [Governance Baseline](/contact/book-governance-baseline/).

## Five maturity levels

| Level | Score range | Interpretation |
|---|---|---|
| **Initial** | 0–39 | AI governance is ad hoc; immediate foundational work required. |
| **Developing** | 40–59 | Basic practices exist but are inconsistent and hard to evidence. |
| **Defined** | 60–74 | Core governance is established; expand coverage and automation. |
| **Managed** | 75–89 | Controls are monitored and integrated into operations. |
| **Optimized** | 90–100 | Governance is adaptive, automated and continuously assured. |

Scores are reported to one decimal place; a score such as 59.9 is Developing and 60.0 is Defined.

## Eight weighted domains

| Domain | Weight | Questions | What it covers | Key controls |
|---|---|---|---|---|
| Strategy & Accountability | 12% | STR-Q1 to STR-Q3 | Policy and ownership, governance forum authority, roles and escalation | AO-01, AO-02, AO-03, AO-06 |
| AI Inventory & Visibility | 14% | INV-Q1 to INV-Q3 | Inventory completeness, classification, owners, purpose, data sources and dependencies | EI-01, EI-02, EI-03, EI-04 |
| Risk Management & Lifecycle | 14% | RSK-Q1 to RSK-Q3 | Pre-deployment assessment, change control and reassessment, retirement and exceptions | GL-02, GL-03, GL-04, GL-09 |
| Data & Privacy | 12% | DAT-Q1 to DAT-Q3 | Data sources and flows, privacy assessment, redaction of sensitive data | EI-06, IS-02, IS-03, IS-04 |
| Security & Resilience | 14% | SEC-Q1 to SEC-Q3 | Threat modelling, adversarial testing of LLM apps and agents, kill switch and rollback | IS-01, IS-14, IS-11, IS-15 |
| Fairness, Safety & Transparency | 12% | FST-Q1 to FST-Q3 | Bias and harm evaluation, AI disclosures, explanation and appeal | IS-05, IS-06, IS-08 |
| Human Oversight & Operations | 12% | HUM-Q1 to HUM-Q3 | Human review and approval, monitoring, operator training | IS-09, IS-13, GL-08, AO-05 |
| Assurance, Evidence & Improvement | 10% | ASR-Q1 to ASR-Q3 | Control testing, evidence packs, leadership metrics and corrective action | SE-01, SE-05, SE-08, SE-03 |

Each question is answered on a five-point scale:

| Score | Label | Meaning |
|---|---|---|
| 1 | Not started | No practice exists. |
| 2 | Initial / ad hoc | Practice exists informally or in pockets; not documented or repeatable. |
| 3 | Defined for some systems | Documented practice applied to some systems or business units. |
| 4 | Consistently implemented | Applied consistently across material AI systems, with records. |
| 5 | Measured, automated and continuously improved | Measured, largely automated and improved from metrics. |

## How the score is calculated

1. **Domain score** = sum of the domain's answers × 100 ÷ (5 × number of questions), rounded half-up to one decimal place.
2. **Overall score** = the weighted sum of unrounded domain values using the weights above (which total 100), rounded half-up to one decimal place.
3. **Maturity level** = the level whose range contains the overall score.

Because each answer starts at 1, the lowest possible overall score is 20.0, not zero. The calculation is deterministic and identical in the browser and on the server, so the same answers always produce the same result.

## Critical flags override averages

Averages can hide serious exposures. A respondent can score well overall while having no way to stop a misbehaving agent. The model therefore raises **critical flags**, labelled *Critical gap*, regardless of the overall score:

| Flag | Raised when | Controls |
|---|---|---|
| No reliable AI inventory | INV-Q1 scored 2 or lower | EI-01, EI-09 |
| AI deployed without pre-deployment risk assessment | RSK-Q1 scored 2 or lower | GL-02, GL-03 |
| Sensitive data may reach prompts, logs or external models | DAT-Q3 scored 2 or lower | IS-04, IS-03 |
| Agents or LLM apps not tested for prompt injection and unsafe tool use | SEC-Q2 scored 2 or lower and the organization uses agents | IS-14, IS-11, IS-12 |
| No tested kill switch or rollback | SEC-Q3 scored 2 or lower | IS-15 |
| High-impact decisions lack defined human oversight | HUM-Q1 scored 2 or lower | IS-09, IS-13 |
| Cannot produce audit-ready evidence | ASR-Q2 scored 2 or lower | SE-05, SE-08 |
| EU-facing AI without consistent AI-interaction disclosure | FST-Q2 scored 2 or lower with EU exposure | IS-08 |
| No AI governance policy or accountable owner | STR-Q1 scored 1 | AO-01, AO-02 |

## Framework readiness indicators

The self-assessment also groups questions into indicative readiness indicators for NIST AI RMF (GOVERN, MAP, MEASURE, MANAGE), ISO/IEC 42001 (clauses 4–10) and selected EU AI Act themes (for example Art. 4, 9, 10, 14 and 15). Each indicator is banded as **Limited readiness** (below 50), **Partial readiness** (50–74.9) or **Substantial readiness** (75 and above).

These indicators are a way to prioritize evidence collection. They are not a measure of conformity or compliance, and "Substantial readiness" means only that self-reported practices in that area are relatively mature.

{{disclaimer}}

## From score to plan

The result includes up to five strengths and five gaps, a 30/60/90-day action plan (answers of 1–2 go into the first 30 days, 3 into days 31–60, and 4 into days 61–90), recommended controls and recommended VERITRAIL modules. A typical progression:

- **Initial → Developing:** policy and forum (AO-01, AO-02), a first inventory (EI-01), intake and pre-deployment assessment (EI-12, GL-02).
- **Developing → Defined:** risk tiering applied to every record (EI-02), change triggers (GL-04), redaction (IS-04), adversarial testing (IS-14), kill switch (IS-15).
- **Defined → Managed:** runtime guardrails in enforcement (IS-12), monitoring and drift thresholds (GL-08, SE-12), control testing (SE-01), evidence packs (SE-05).
- **Managed → Optimized:** automated evidence collection, KPI-driven corrective action (SE-03, SE-06), independent review (SE-10).

## Limitations

The self-assessment is self-reported, so every result is User-asserted. Respondents tend to be optimistic about practices they own and pessimistic about others'. Scores are most useful for prioritization and for tracking change over time — and become decision-grade once validated with evidence.

{{cta:assessment}}
