---
title: "AEGIS Assess — AI governance baseline and use-case risk assessment"
h1: "AEGIS Assess: know where you stand, with evidence"
slug: /solutions/assess/
description: "AEGIS Assess baselines AI governance maturity and triages each AI use case by risk, with evidence labels and control citations on every finding."
section: solutions
nav_label: "AEGIS Assess"
nav_order: 20
template: page
schema_type: Service
primary_cta: assessment
secondary_cta: baseline
faq:
  - q: "How is Assess different from a consulting maturity assessment?"
    a: "The method, scoring and question bank are published and deterministic, and every finding is tied to a control ID and an evidence label. The result is reproducible and can be re-run to track progress, rather than being a one-off opinion."
  - q: "Can Assess tell us whether a system is high-risk under the EU AI Act?"
    a: "No. Assess flags regulatory relevance factors and suggests an internal risk tier, labelled Inferred, for human confirmation. Legal classification under the EU AI Act is a determination for your legal team."
updated: 2026-10-21
---

**Core message: before you can govern AI, you need an honest baseline — one that separates what is evidenced from what is assumed.**

Most AI governance programmes start with a questionnaire and end with a slide that says "Developing". AEGIS Assess goes further: every finding cites the AEGIS control it relates to, carries an evidence label, and becomes a line in a gap register with a severity, an owner and a remediation SLA.

## Capabilities

- **Organization maturity assessment.** 24 questions across eight weighted domains, scored deterministically against the [AEGIS maturity model](/framework/maturity-model/). Produces an overall level, domain scores, critical flags and a 30/60/90-day plan.
- **Use-case intake and risk triage.** A short intake suggests a risk tier — Prohibited-review, High, Medium or Low — with the factors and citations behind it. The tier is labelled Inferred and requires human confirmation.
- **Deep-dive assessment modules.** Core, data and privacy, security, generative AI, agentic AI, fairness and safety, human oversight, vendor AI, and monitoring modules, selected automatically by the intake profile. See [Assessment modules](/framework/assessment-modules/).
- **Evidence-aware findings.** Each answer can carry attached evidence; findings move from User-asserted to Verified only when a named reviewer accepts the evidence.
- **Indicative framework readiness.** Readiness indicators grouped by NIST AI RMF function, ISO/IEC 42001 clause and selected EU AI Act themes — clearly labelled as indicative.

## Who it is for

- **Chief Risk and Compliance Officers** who need a defensible view of AI risk across the enterprise.
- **AI Governance Leads and AI CoE heads** who need a repeatable way to assess new use cases.
- **Consultants and internal audit teams** who want a structured, citation-backed method for client or internal reviews.

## Outputs

| Output | Contents | Evidence status |
|---|---|---|
| Maturity report (PDF / Markdown) | Score, level, domain scores, strengths, gaps, critical flags, action plan, recommended controls | User-asserted until validated |
| Use-case risk profile | Suggested tier, factors, triggers, missing fields, required modules, suggested approval authority and review cadence | Inferred; requires human confirmation |
| Gap register (CSV / JSON) | Finding, control ID, severity, evidence label, owner, SLA due date | Per finding |
| Readiness indicators | Limited / Partial / Substantial readiness by framework group | Indicative only |

## Example finding

> **Finding:** Customer-service agent can issue refunds without human approval.
> **Control:** IS-13 Human approval for high-impact actions; related IS-11 Least-privilege tool access.
> **Evidence status:** Critical gap — the tool manifest shows a payments tool with write access and no approval rule; confirmed in workshop.
> **Severity:** Critical (critical-priority control, High-tier system, not implemented). Remediation SLA: 30 days.
> **Recommended action:** Add a REQUIRE_HUMAN_APPROVAL rule for refunds above an agreed threshold and restrict the payments tool scope; verify in Observe mode before enforcing.

{{controls:GL-01,GL-02,EI-02,AO-04,IS-13}}

## How it fits

Assess is usually the first module used, through the free [self-assessment](/tools/maturity-assessment/) or the [risk triage tool](/tools/risk-triage/), and then in depth during a [Governance Baseline](/contact/book-governance-baseline/). Findings feed [AEGIS Register](/solutions/register/) (tiers and owners), [AEGIS Control](/solutions/control/) (approval gates) and [AEGIS Shield](/solutions/shield/) (runtime guardrail recommendations).

## Limitations

Self-assessment answers reflect the respondent's view and are labelled User-asserted. Suggested risk tiers are calculated from intake answers and can be wrong if the intake is incomplete; AEGIS lists missing fields and never finalizes a tier without human confirmation. Readiness indicators are not a substitute for legal review or a formal audit.

{{disclaimer}}

{{cta:assessment}}
