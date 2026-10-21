---
title: "The five AEGIS pillars of enterprise AI governance"
h1: "Five pillars of AI governance"
slug: /framework/pillars/
description: "Accountability, inventory, lifecycle control, integrity and security, and assurance: how the five AEGIS pillars organize 64 controls into one operating model."
section: framework
nav_label: "Five pillars"
nav_order: 15
template: page
schema_type: WebPage
primary_cta: assessment
secondary_cta: blueprint
updated: 2026-10-21
---

The five AEGIS pillars divide AI governance into parts that each have a clear owner, a clear purpose and clear evidence. They are deliberately ordered: accountability comes first because without decision rights nothing else sticks, and assurance comes last because it tests whether everything before it actually works.

| Pillar | Prefix | Controls | Core question | Typical accountable owner |
|---|---|---|---|---|
| [Accountability & Operating Model](/framework/pillars/accountability/) | AO | 12 | Who owns AI risk, who decides, and how is governance resourced? | Executive sponsor, AI Governance Lead |
| [Enterprise AI Inventory](/framework/pillars/inventory/) | EI | 12 | What AI do we run, who owns it, and how risky is it? | AI Governance Lead, CIO office |
| [Governance & Lifecycle Control](/framework/pillars/lifecycle/) | GL | 12 | What gates does an AI system pass from intake to retirement? | AI CoE, AI Risk Lead, Governance Forum |
| [Integrity, Safety & Security](/framework/pillars/integrity-safety-security/) | IS | 16 | Are data, fairness, safety, security and runtime behavior controlled? | CISO, Privacy Lead, Platform Engineering |
| [Stewardship, Evidence & Assurance](/framework/pillars/stewardship-assurance/) | SE | 12 | Can we prove it, learn from incidents and improve? | AI Governance Lead, second line, Internal Audit |

## How the pillars work together

Consider a business team that wants to deploy an agent that drafts customer refund decisions and can issue refunds through a payments API.

- **Accountability (AO).** The use case is screened against the prohibited and restricted use policy (AO-10). The risk appetite (AO-04) determines which tier triggers forum review (AO-02).
- **Inventory (EI).** The use case enters the intake register (EI-12). The agent, its model, its prompts and the payments tool are registered (EI-05, EI-07) with a named business and technical owner (EI-03) and a provisional risk tier that a human confirms (EI-02).
- **Lifecycle (GL).** Triage routes it to a full pre-deployment assessment (GL-01, GL-02). Approval is granted with conditions (GL-03), and go-live is blocked until those conditions are verified (GL-07).
- **Integrity, Safety & Security (IS).** The agent gets only the tools it needs (IS-11). Refunds above a threshold require human approval at runtime (IS-13), customer data is redacted before external model calls (IS-04), and the agent is tested for prompt injection before release (IS-14). A kill switch is tested (IS-15).
- **Assurance (SE).** Every policy decision, tool call and approval is logged tamper-evidently (SE-08). Monitoring and drift thresholds feed reviews (SE-12), incidents follow a defined procedure (SE-04), and an evidence pack can be produced on request (SE-05).

No single pillar is sufficient. An inventory without lifecycle gates is a list. Runtime guardrails without accountability are configuration nobody owns. Assurance without the first four pillars has nothing to test.

## Pillars and the AEGIS modules

| AEGIS module | Primary pillars | What it operationalizes |
|---|---|---|
| [Assess](/solutions/assess/) | AO, EI, GL | Maturity baseline, use-case triage and risk/impact assessment |
| [Register](/solutions/register/) | EI | AI system of record, agent and tool registry, vendor AI inventory |
| [Control](/solutions/control/) | AO, GL | Policies, approval gates, change triggers, exceptions |
| [Shield](/solutions/shield/) | IS | Runtime policy, redaction, least privilege, human approval, kill switch |
| [Assurance](/solutions/assurance/) | SE | Control testing, logging, incidents, evidence packs, monitoring |
| [Agent](/solutions/agent/) | All | Citation-backed drafting of assessments, gap registers and reports |

## Where to begin

If you are unsure where you stand, take the [maturity self-assessment](/tools/maturity-assessment/). It scores eight domains that cut across the pillars and flags critical gaps — for example, no reliable inventory (EI-01, EI-09) or no tested kill switch (IS-15) — so you can prioritize the right pillar first.

{{controls:AO-02,EI-01,GL-02,IS-13,SE-08}}

The complete list of controls, with objectives, evidence and indicative mappings, is in the [AEGIS Control Library](/framework/controls/).

{{cta:assessment}}
