---
title: "AEGIS assessment modules — organization and use-case assessments"
h1: "Assessment modules"
slug: /framework/assessment-modules/
description: "How AEGIS assesses AI governance at two levels: an organization-wide maturity assessment and risk-triggered deep-dive modules for each AI use case."
section: framework
nav_label: "Assessment modules"
nav_order: 40
template: page
schema_type: WebPage
primary_cta: assessment
secondary_cta: agent
faq:
  - q: "Do we need to run every module for every AI system?"
    a: "No. The core, security, and monitoring modules apply to every use case; the other modules are triggered by the intake profile and risk tier, so a low-risk internal tool gets a short assessment and a high-impact agent gets a deep one."
  - q: "Who decides the final risk tier?"
    a: "A human. AEGIS calculates a suggested tier with the factors and citations behind it, labels it Inferred, and requires an accountable approver to confirm or change it."
updated: 2026-10-21
---

AEGIS assesses AI governance at two levels, because they answer different questions:

- **Organization level — "how mature is our governance overall?"** The 24-question [maturity self-assessment](/tools/maturity-assessment/) scores eight weighted domains (see the [maturity model](/framework/maturity-model/)).
- **Use-case level — "is this AI system adequately controlled for its risk?"** An intake, a risk triage and a set of deep-dive modules selected for that system.

Both produce findings that cite AEGIS controls and carry evidence labels. Neither produces a compliance determination.

## Level 1: Organization maturity assessment

| Attribute | Detail |
|---|---|
| Scope | Whole organization or a business unit |
| Format | 24 questions, 3 per domain, scored 1–5; about 8 minutes |
| Output | Overall score and level, domain scores, strengths, gaps, critical flags, 30/60/90-day plan, recommended controls and modules, indicative readiness indicators |
| Evidence status | User-asserted (self-reported) until validated |
| Validation | In a [Governance Baseline](/contact/book-governance-baseline/), answers are tested against evidence and relabelled |

## Level 2: Use-case intake and risk triage

Every AI use case starts with a short intake. The fields are the same ones the [risk triage tool](/tools/risk-triage/) uses:

| Intake field | Example values |
|---|---|
| Domain category | customer service, internal productivity, credit, employment, healthcare, biometric, education, critical infrastructure, essential services, other |
| Decision impact | none, advisory, material, automated decision |
| Affected parties | internal, customers, public, vulnerable groups |
| Data sensitivity | public, internal, confidential, personal, special-category |
| Autonomy | none, suggests, acts with approval, acts autonomously |
| External actions | can it send messages, update records or move money? |
| Generative AI, vendor model, EU exposure | yes / no |
| Tools | the systems it can access, for example CRM, email, ticketing, payments |

Triage produces a suggested tier — **Prohibited-review, High, Medium or Low** — together with the factors that drove it, missing fields, the modules required, a suggested approval authority and review cadence. The tier is **Inferred** and requires confirmation by an accountable human (EI-02, GL-01).

{{controls:EI-12,GL-01,EI-02,GL-02}}

## Level 3: Use-case deep-dive modules

| Module | Applies when | What it examines | Representative controls |
|---|---|---|---|
| Core governance & lifecycle | Always | Owners, purpose, confirmed tier, pre-deployment assessment and approval, obligations, prohibited-use screening, change control | EI-03, EI-04, GL-02, GL-03, AO-07, AO-10, GL-04 |
| Data & privacy | Personal, special-category or confidential data | Data lineage, privacy impact, minimisation, redaction, retention | EI-06, IS-02, IS-03, IS-04 |
| Security & resilience | Always | Threat model, model and prompt supply chain, security testing, kill switch | IS-01, IS-10, IS-15 |
| Generative AI & LLM controls | Uses generative AI | Adversarial testing, runtime guardrails, limits, prompt registry, output quality | IS-14, IS-12, IS-16, EI-05 |
| Agentic AI & tool use | Acts with approval or autonomously, takes external actions, or has tools | Agent and tool registry, least privilege, human approval, action logging, limits | EI-07, IS-11, IS-13, SE-08 |
| Fairness, safety & transparency | High tier, external affected parties, or material/automated decisions | Bias testing, harm evaluation, AI disclosure, contestability | IS-05, IS-06, IS-08 |
| Human oversight & operations | High tier, material decisions, or autonomous operation | Oversight design, operator training, escalation, go-live conditions | IS-09, AO-05, AO-06, GL-07 |
| Vendor & third-party AI | Relies on a vendor model or AI service | Due diligence, contract controls, vendor inventory, vendor change monitoring | GL-11, EI-08, AO-09 |
| Monitoring, incidents & evidence | Always | Production monitoring, incident handling, evidence retention, periodic review | GL-08, SE-04, SE-02, GL-12 |

Each question lists the evidence an assessor expects to see — for example, "Tool/permission manifest per agent" for the agent registry question — so a respondent knows from the outset what "implemented" has to look like.

## How findings are rated

Answers are recorded as Implemented, Partially implemented, Not implemented, Unknown or Not applicable. Severity combines three factors: the priority of the cited control, the confirmed risk tier, and the answer. A "Not implemented" answer on a critical control for a High-tier system becomes a Critical finding; an "Implemented" answer without evidence is recorded as an evidence gap rather than an implementation gap. Severities carry remediation SLAs of 30, 60, 90 and 180 days for Critical, High, Medium and Low respectively — see [Gap analysis](/compliance/gap-analysis/).

## Runtime guardrail recommendations

The same intake also drives runtime guardrail recommendations — for example, redaction when personal data is in scope (IS-04), tool allow-listing when the system has tools (IS-11), human approval when it can take external actions (IS-13), and action logging and a kill switch for every system (SE-08, IS-15). The [guardrail generator](/tools/guardrail-generator/) turns those recommendations into a draft policy for [AEGIS Shield](/solutions/shield/).

## Who runs the modules

The modules can be completed in a facilitated workshop, by the system owner with reviewer sign-off, or in a guided conversation with the [AEGIS Agent](/solutions/agent/), which asks the questions, records answers as User-asserted, and drafts the findings with citations for a human reviewer to accept or amend.

{{cta:assessment}}
