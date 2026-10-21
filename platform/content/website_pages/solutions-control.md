---
title: "AEGIS Control — risk-tiered AI intake, approval and lifecycle governance"
h1: "AEGIS Control: risk-proportionate gates from intake to retirement"
slug: /solutions/control/
description: "AEGIS Control runs AI intake, triage, risk-tiered approvals, change triggers, exceptions and recertification as workflows that produce evidence by default."
section: solutions
nav_label: "AEGIS Control"
nav_order: 40
template: page
schema_type: Service
primary_cta: demo
secondary_cta: baseline
faq:
  - q: "Can AEGIS Control approve use cases automatically?"
    a: "It can route and pre-populate decisions, but approvals are made by the human approvers defined in your approval matrix. Risk-tier changes and exception approvals always require a named human approver."
  - q: "Does Control replace our existing GRC or ticketing tools?"
    a: "Not necessarily. Control holds the AI-specific workflow and evidence; decisions and records can be exported to existing GRC or ticketing systems. Integration scope is agreed during onboarding."
updated: 2026-10-21
---

**Core message: governance should be fast for low-risk AI and rigorous for high-risk AI — and leave a record either way.**

AEGIS Control turns your AI policy into workflows. Every use case passes intake and triage; the risk tier determines assessment depth and the approver; approvals carry conditions that are checked before go-live; and material changes trigger reassessment. The result is a lifecycle that business teams can navigate and auditors can follow.

## Capabilities

- **Policy and operating-model kit.** Templates for the AI governance policy (AO-01), forum charter (AO-02), RACI (AO-03), risk appetite and tier criteria (AO-04), escalation matrix (AO-06) and prohibited and restricted use list (AO-10).
- **Intake and triage (EI-12, GL-01).** Standard intake, prohibited-use screening, suggested tier and required assessment modules.
- **Risk-tiered approval gates (GL-03).** An approval matrix by tier; approvals recorded with conditions and approver identity.
- **Go-live readiness (GL-07).** Conditions of approval become a checklist that must be verified before launch.
- **Change triggers (GL-04).** Model, prompt, data, vendor, tool and agent changes route to reassessment when material.
- **Exceptions with expiry (GL-10).** Residual-risk acceptances with an accountable approver, compensating controls and an expiry date.
- **Vendor AI due diligence (GL-11).** AI-specific questionnaire and contract clause checklist integrated with intake.
- **Recertification and retirement (GL-12, GL-09).** Tier-based review calendar; restrict, remediate or retire decisions recorded.

## Who it is for

- **AI CoE heads** who need a single intake-to-production path.
- **Risk and compliance leaders** who need approvals and exceptions to be consistent and evidenced.
- **Engineering leads** who want clear, early requirements instead of late-stage surprises.

## Outputs

| Output | Evidence for |
|---|---|
| Intake register with status and screening outcome | EI-12, AO-10 |
| Triage decisions with rationale | GL-01 |
| Approval records with conditions and approver | GL-03 |
| Go-live condition verification | GL-07 |
| Change tickets linked to reassessment | GL-04 |
| Exception register with approver, expiry and compensating controls | GL-10 |
| Forum decision log (approve / restrict / stop) | AO-02 |

## Example: an approval matrix

| Tier | Assessment | Approver | Conditions typically attached |
|---|---|---|---|
| Prohibited-review | Legal review before further work | Governance forum with Legal | Proceed only on documented legal opinion |
| High | Full assessment and all triggered modules | Governance forum | Human oversight design, adversarial testing, runtime policy in Enforce, monitoring thresholds, 6-month review |
| Medium | Standard assessment | Delegated risk lead | Disclosure, redaction, monitoring, annual review |
| Low | Intake and screening | Business owner | Attestation at review cadence |

This is an illustrative starting point; your forum should set and approve its own matrix in line with risk appetite (AO-04).

{{controls:AO-10,GL-01,GL-03,GL-04,GL-07,GL-10}}

## Example: change triggers that catch what release processes miss

Generative AI systems change in ways traditional change management does not notice. A typical AEGIS trigger set (GL-04) includes:

| Change | Default handling |
|---|---|
| New model or model version, including a vendor's silent upgrade | Reassessment of validation and adversarial testing results |
| Edited prompt or system instruction in production | Change ticket with diff; re-run of injection tests for High tier |
| New data source or retrieval index | Data and privacy module re-run |
| New agent tool, scope or operation | Tool manifest update, runtime policy change with human approval |
| Change of intended purpose or user population | Full re-triage; possible tier change, confirmed by a named approver |

{{controls:GL-04,EI-05,EI-07}}

## How it fits

Control consumes inventory records from [AEGIS Register](/solutions/register/) and assessments from [AEGIS Assess](/solutions/assess/), hands approved runtime conditions to [AEGIS Shield](/solutions/shield/), and feeds decision records to [AEGIS Assurance](/solutions/assurance/). The [lifecycle pillar](/framework/pillars/lifecycle/) and [runbooks](/framework/runbooks/) describe the underlying method.

## Limitations

Workflows only produce evidence when teams use them. Control cannot detect AI deployed outside the process — that is why it is paired with shadow-AI reconciliation in Register. Approval quality depends on approvers having the time and information to challenge; AEGIS supplies the information, not the judgement.

{{cta:demo}}
