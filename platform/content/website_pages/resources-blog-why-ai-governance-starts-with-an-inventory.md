---
title: "Why AI governance starts with an inventory"
h1: "Why AI governance starts with an inventory"
slug: /resources/blog/why-ai-governance-starts-with-an-inventory/
description: "Every AI governance control depends on knowing what AI you run. Why inventories fail, what a minimum viable record contains, and how to reach coverage fast."
section: resources
nav_label: "Why governance starts with an inventory"
nav_order: 71
nav_exclude: true
template: page
schema_type: Article
primary_cta: baseline
secondary_cta: assessment
updated: 2026-10-21
---

*AEGIS editorial team · Published 21 October 2026 · About 8 minutes to read*

Ask an executive team how many AI systems their organization runs and you will usually get a number. Ask how that number was produced, and the conversation changes. It might come from an AI CoE project list, a board paper from last year, or a procurement search for "AI" in contract titles. Each source captures part of the picture. None captures agents that engineering teams assembled last quarter, AI features switched on inside existing SaaS products, or the assistant a team built on a personal API key.

This matters because almost every AI governance control assumes the inventory exists. You cannot risk-assess a system you have not found, approve a deployment you do not know about, apply runtime guardrails to an agent that is not routed through them, or produce an evidence pack for something that has no record. In the AEGIS maturity model, inventory is one of the three most heavily weighted domains, and a low score on the inventory question raises a **Critical gap** flag regardless of the overall result. That is not because inventories are glamorous. It is because everything else is built on them.

## Why inventories fail

Organizations rarely lack the intention to build an AI inventory. They lack one that stays accurate. In our experience designing the AEGIS framework, the failures fall into four patterns.

**1. Scope that is too narrow.** Many inventories start in the model risk or data science function and list trained models. Generative AI changed what "an AI system" looks like: a prompt and a retrieval index on top of a foundation-model API, an agent wired to a ticketing system, a "summarize" button in a CRM. If the scope definition does not explicitly include LLM applications, agents, vendor AI products and embedded AI features, they will not be counted.

**2. A one-time exercise.** Inventories built for a board paper or an audit request decay quickly. New use cases appear weekly; owners move on; vendor features change. Without a mechanism to keep records current, the inventory becomes a historical document.

**3. Records without owners.** A record that names a team rather than a person tends to go unmaintained. When a question arises — is this system still in use? did the vendor change the model? — nobody is accountable for answering it.

**4. Agents without tool manifests.** An agent's risk depends heavily on what it can reach and do. An inventory record that says "customer support agent" but not "can read CRM, issue refunds up to a threshold, send external email" cannot support least-privilege decisions or runtime policy.

## What the inventory must enable

It helps to work backwards from what the inventory is for. In the AEGIS framework, the inventory pillar (EI) exists to make four things possible:

- **Proportionate governance.** Every record gets a risk tier, based on decision impact, data sensitivity, autonomy, affected parties and regulatory relevance (EI-02). The tier decides how much assessment and which approvers a system needs.
- **Accountability.** Every system has a named business owner and technical owner who have accepted the role (EI-03).
- **Runtime control.** Every agent's tools, scopes and permitted operations are registered (EI-07), giving security teams a baseline for default-deny access and approval rules.
- **Evidence.** Inventory exports with record counts and timestamps, owner acceptances and attestation records are themselves evidence that a control is operating (EI-01, EI-11).

{{controls:EI-01,EI-02,EI-03,EI-07,EI-09,EI-11}}

## Start with a minimum viable record

The fastest way to stall an inventory is to design the perfect record — 60 fields, every one mandatory. Owners will not complete it, and coverage will stall at the systems the governance team already knew about.

We recommend starting with a minimum viable record that is enough to tier and assign ownership, then enriching records for systems that turn out to be material:

| Field | Why it matters |
|---|---|
| Name and short description | Identification |
| Business owner and technical owner | Accountability |
| Intended purpose and who is affected | Risk context |
| Decision impact: none, advisory, material, automated decision | Tiering |
| Data sensitivity: public through special-category | Tiering and privacy |
| Autonomy: none, suggests, acts with approval, acts autonomously | Tiering and runtime control |
| Built, bought or embedded; vendor | Third-party accountability |
| Lifecycle status | Which gates apply |
| Provisional tier and who confirmed it | Proportionate governance |

For material systems, add the model and prompt registry entries (EI-05), data sources and lineage (EI-06), the agent tool manifest (EI-07) and dependency mapping (EI-10).

## Getting to coverage in weeks, not quarters

A practical sequence, which is also the basis of Runbook 1 in the [AEGIS implementation runbooks](/framework/runbooks/):

**Agree scope in writing.** Define what counts: in-house models, LLM applications, agents, vendor AI products, AI features in SaaS tools, direct use of model APIs. Record deliberate exclusions — for example, spell-checkers — so that they are decisions, not oversights.

**Seed from what you already have.** Architecture repositories, procurement and contract records, cloud bills that show AI service usage, API gateway logs, the CoE's project list, the model risk inventory if one exists. None is complete, but together they give you a starting population.

**Run short discovery workshops.** Thirty minutes per business unit, with a simple question: what tools or features do you use that generate, summarize, classify, predict or act? People will mention things that never went through procurement. That is the point.

**Reconcile shadow AI deliberately.** Discovery will surface AI use that bypassed intake. Treat it as information, not infraction: bring it into the inventory, assign an owner, tier it, and route it through the appropriate assessment (EI-09). Organizations that punish discovery get less of it.

**Confirm owners and tiers.** Owners accept their records. A risk lead confirms or adjusts each provisional tier. Tools — including the AEGIS [risk triage](/tools/risk-triage/) — can suggest a tier, but a suggestion is Inferred until a human confirms it.

**Set the maintenance rhythm.** Owner attestation on a cadence that matches tier (EI-11), periodic discovery, and a rule that new use cases enter through intake (EI-12) so the inventory grows from the front door rather than through archaeology.

## How to tell whether your inventory is working

Five questions make a quick test:

1. Can you produce an export, today, with a record count and the date each record was last updated?
2. Does every record have a named owner who has accepted the role?
3. Does every record have a risk tier, and can you say who confirmed it?
4. For every agent, can you list the tools it can call and the operations it can perform?
5. When did you last reconcile discovered AI use against the inventory, and what did you find?

If you can answer all five with evidence, the inventory is doing its job. If not, you have found your starting point — and the gaps will tell you which of the four failure patterns you are dealing with.

## Common objections

**"We already have a CMDB."** Possibly enough, if it can hold AI-specific fields such as decision impact, autonomy, risk tier, prompts and agent tool permissions, and if owners actually maintain them. Often the practical answer is an AI-specific system of record that feeds or references the CMDB.

**"Our AI is all from vendors."** Vendor AI still needs an owner, a tier and a record of what data it processes. Under many regimes, deploying a vendor's system carries its own obligations. Third-party AI is in scope for good reason (EI-08, AO-09).

**"This will slow teams down."** A minimum viable record takes minutes. What slows teams down is discovering, late in a deployment, that a system needs an assessment nobody planned for.

## Where this fits

An inventory is not governance on its own; it is the precondition for it. Once you know what you run, the [lifecycle gates](/framework/pillars/lifecycle/), [runtime guardrails](/solutions/shield/) and [assurance](/solutions/assurance/) have something to work on.

If you want to know where you stand, the [maturity self-assessment](/tools/maturity-assessment/) takes about 8 minutes and will flag an inventory gap if you have one. If you want help building the inventory itself, a [Governance Baseline](/contact/book-governance-baseline/) inventories up to 25 AI systems as its first workstream.

{{cta:baseline}}
