---
title: "Governance & Lifecycle Control (GL) — VERITRAIL Framework pillar"
h1: "Pillar 3: Governance & Lifecycle Control"
slug: /framework/pillars/lifecycle/
description: "VERITRAIL GL controls set risk-proportionate gates from intake and assessment through approval, change, monitoring, exceptions and retirement of AI systems."
section: framework
nav_label: "Lifecycle (GL)"
nav_order: 18
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: demo
faq:
  - q: "Will lifecycle gates slow down AI delivery?"
    a: "They should not for low-risk use cases. GL controls are risk-proportionate: triage routes low-tier use cases through a light path and reserves full assessment and forum approval for higher tiers."
  - q: "What counts as a material change that triggers reassessment?"
    a: "VERITRAIL recommends defining triggers for model or version changes, prompt and system-instruction changes, new data sources, new vendors, new agent tools or permissions, and changes in intended purpose or user population (GL-04)."
updated: 2026-10-21
---

**Core question: what gates does an AI system pass from intake to retirement?**

The lifecycle pillar is where governance meets delivery. It defines the path an AI use case takes from idea to production and, eventually, to retirement — and it makes that path proportionate to risk. A chatbot that summarizes internal policies should not wait for the same approvals as a model that influences credit decisions. Both should leave a record.

## The VERITRAIL lifecycle

| Stage | What happens | Key controls | Gate evidence |
|---|---|---|---|
| Intake | Use case captured with purpose, data, autonomy and owner | EI-12, AO-10 | Intake record; prohibited/restricted use screening |
| Triage | Risk triggers route the use case to the right assessment depth and approvers | GL-01, EI-02 | Triage decision with rationale; provisional tier |
| Assess | Tier-proportionate risk and impact assessment; vendor due diligence where relevant | GL-02, GL-11, IS-03 | Completed assessment; reviewer sign-off; residual-risk statement |
| Validate | Performance, robustness and safety tested against acceptance criteria | GL-05, IS-07, IS-14 | Test plan and results; release sign-off |
| Approve | Approval by an authority matched to tier, with conditions | GL-03, GL-10 | Approval record with conditions; exceptions with expiry |
| Go-live | Conditions, monitoring, oversight and rollback verified before launch | GL-07, IS-15 | Go-live checklist; condition verification |
| Operate | Monitoring against thresholds; change control on models, prompts, data, tools | GL-08, GL-04, SE-12 | Monitoring reviews; change tickets with reassessment |
| Recertify | Periodic review at tier-based cadence | GL-12 | Review calendar; recertification records |
| Retire | Restrict, remediate or decommission safely, including data and model disposal | GL-09 | Retirement records |

## Controls in this pillar

| Control | Objective | Priority / scope | Evidence that demonstrates it |
|---|---|---|---|
| GL-01 Intake triage workflow | Route each intake by risk triggers to the right assessment depth and approvers | High / all AI | Triage criteria; triage decisions with rationale |
| GL-02 Pre-deployment risk and impact assessment | Documented, tier-proportionate risk and impact assessment before production | Critical / all AI | Completed assessment; reviewer sign-off; residual-risk statement |
| GL-03 Risk-tiered approval gates | Approvals proportionate to tier, with recorded conditions | Critical / all AI | Approval matrix by tier; approval records with conditions |
| GL-04 Change management and reassessment triggers | Model, prompt, data, vendor, tool and agent changes under change control | High / all AI | Change policy with AI triggers; change tickets referencing reassessment |
| GL-05 Pre-release validation and testing | Performance, robustness and safety validated against acceptance criteria | High / all AI | Test plan and results; acceptance criteria; release sign-off |
| GL-06 Technical documentation | Design, data, performance, limitations and controls documented | High-tier / EU high-risk | Technical documentation pack; model/system card |
| GL-07 Deployment conditions and go-live readiness | Approval conditions, monitoring, oversight and rollback in place before go-live | High / all AI | Go-live checklist; condition verification record |
| GL-08 Post-deployment monitoring | Performance, drift, misuse, incidents and unexpected behavior monitored with thresholds | High / all AI | Dashboards; alert thresholds; monitoring review records |
| GL-09 Retirement and decommissioning | Safe restriction, remediation, retirement and disposal | Medium / all AI | Decommissioning procedure; retirement records |
| GL-10 Exceptions and risk acceptance | Exceptions with accountable approver, expiry and compensating controls | High / all AI | Exception register; approver and expiry per exception |
| GL-11 Vendor AI due diligence and contract controls | AI-specific due diligence and contract terms for data use, model changes, incident notice, audit rights | High / third-party | Vendor AI questionnaire; contract clauses; due-diligence approval |
| GL-12 Periodic review and recertification | Tier-based re-review and recertification of continued use | Medium / all AI | Review calendar; recertification records |

{{controls:GL-02,GL-03,GL-04,GL-10}}

## Proportionality in practice

VERITRAIL risk tiers are **Prohibited-review**, **High**, **Medium** and **Low**. A typical configuration — which your forum should adapt and approve under AO-04 — looks like this:

| Tier | Assessment depth | Approver | Review cadence |
|---|---|---|---|
| Prohibited-review | Legal review before any further work | Governance forum with Legal | Case by case |
| High | Full risk and impact assessment plus relevant deep-dive modules | Governance forum | Frequent (for example, every 6 months) |
| Medium | Standard assessment | Risk lead + business owner | Periodic (for example, annually) |
| Low | Light intake record and screening | Business owner | Periodic attestation |

Changing a system's risk tier or approving an exception are decisions VERITRAIL always routes to a named human approver; neither the platform nor the VERITRAIL Agent changes a tier on its own.

## Common failure modes

- **Gates that stop at go-live.** Approval is recorded but nobody checks whether its conditions were implemented (GL-07) or whether a later prompt change invalidated it (GL-04).
- **Permanent exceptions.** Exceptions without expiry become shadow policy. GL-10 requires an approver, expiry date and compensating controls.
- **Vendor AI bypassing the gate.** Procurement of AI features skips intake. GL-11 integrates AI due diligence into purchasing.

## How VERITRAIL helps

[VERITRAIL Control](/solutions/control/) runs intake, triage, approvals, change triggers and exceptions as workflows that create evidence by default. [VERITRAIL Assess](/solutions/assess/) provides the assessment modules described in [Assessment modules](/framework/assessment-modules/), and the [runbooks](/framework/runbooks/) describe how to stand the process up.

## Indicative framework alignment

GL controls align indicatively with NIST AI RMF MAP 1, MAP 3 and MAP 5, MEASURE 2 and MANAGE 1–2; ISO/IEC 42001 clauses 6.1.3, 6.1.4, 8.1 and 8.4 and Annex A.5–A.6; and EU AI Act Art. 9 (risk management), Art. 11 (technical documentation, GL-06), Art. 26 (deployer obligations, GL-07, GL-08), Art. 43 (conformity assessment-related change handling, GL-03, GL-04) and Art. 72 (post-market monitoring, GL-08).

{{disclaimer}}

{{cta:baseline}}
