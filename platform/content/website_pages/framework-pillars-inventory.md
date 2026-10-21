---
title: "Enterprise AI Inventory (EI) — AEGIS Framework pillar"
h1: "Pillar 2: Enterprise AI Inventory"
slug: /framework/pillars/inventory/
description: "AEGIS EI controls build one owned, classified system of record for AI systems, models, prompts, data, agents, tools, vendor AI and shadow AI use."
section: framework
nav_label: "Inventory (EI)"
nav_order: 17
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: assessment
faq:
  - q: "What counts as an AI system for inventory purposes?"
    a: "AEGIS recommends a broad scope: in-house models, LLM applications, agents, vendor AI products, AI features embedded in SaaS tools and foundation-model APIs. Scope decisions should be documented so that exclusions are deliberate."
  - q: "Can we use our CMDB as the AI inventory?"
    a: "Sometimes, if it can hold the AI-specific fields: intended purpose, risk tier, models and prompts, data sources, agent tools and permitted actions, and owner attestations. AEGIS Register can complement or feed an existing CMDB."
updated: 2026-10-21
---

**Core question: what AI do we run, who owns it, and how risky is it?**

Every governance activity depends on knowing what exists. You cannot assess, approve, monitor, protect or evidence an AI system that is not in your inventory. That is why the AEGIS self-assessment raises a **Critical gap** flag when inventory maturity is low — and why the inventory pillar is usually the first workstream in a Governance Baseline.

## What good looks like

- A single system of record covering AI systems, models, agents and vendor AI, with record counts and last-updated timestamps.
- Every record classified by business criticality, data sensitivity, decision impact, autonomy and regulatory relevance, with a risk tier confirmed by a human.
- A named business owner and technical owner per system who have accepted the role.
- Intended purpose, users, affected parties and foreseeable misuse documented.
- Models, versions, prompts and configuration recorded; data sources and lineage recorded.
- Every agent registered with the tools, APIs and data stores it can reach and the actions it may take.
- A periodic shadow-AI discovery and reconciliation, and owner attestations that records are current.

## Controls in this pillar

| Control | Objective | Priority / scope | Evidence that demonstrates it |
|---|---|---|---|
| EI-01 Enterprise AI inventory (system of record) | Complete, current inventory of AI systems, models, agents and vendor AI in one system of record | Critical / all AI | Inventory export with record counts; coverage attestation; last-updated timestamps |
| EI-02 AI risk classification and tiering | Classify by criticality, data sensitivity, decision impact, autonomy and regulatory relevance; assign a tier | Critical / all AI | Classification criteria; tier per record; tiering approvals |
| EI-03 Accountable owner per AI system | Named accountable business owner and technical owner for every system | Critical / all AI | Owner fields populated; owner acceptance records |
| EI-04 Intended purpose and context of use | Purpose, users, affected parties, context of use and foreseeable misuse | High / all AI | System profile; users and affected parties; misuse analysis |
| EI-05 Model, prompt and component registry | Models, versions, prompts, system instructions, fine-tunes and configuration | High / all AI | Model registry entries; prompt/config version history |
| EI-06 Data source and lineage registry | Data sources, classifications, provenance and flows | High / all AI | Data source register; data-flow diagrams; classifications |
| EI-07 Agent and tool registry | Every agent, the tools, APIs, plugins and data stores it can access, and its permitted actions | Critical / agentic | Agent registry entries; tool/permission manifest per agent |
| EI-08 Third-party and vendor AI inventory | Vendor AI products, embedded AI features and foundation-model providers with contract and DPA details | High / third-party | Vendor AI register; contract/DPA references |
| EI-09 Shadow AI discovery | Periodic discovery of unregistered AI use, reconciled into the inventory | Medium / all AI | Discovery scan reports; reconciliation records |
| EI-10 Dependency and integration mapping | Upstream and downstream dependencies for material systems | Medium / high-risk | Dependency map; integration inventory |
| EI-11 Inventory attestation and recertification | Owners periodically attest records are complete and accurate | Medium / all AI | Attestation records; exceptions for stale records |
| EI-12 Use-case intake register | Every proposed use case captured through standard intake before build or procurement | High / all AI | Intake form; intake register with status |

{{controls:EI-01,EI-02,EI-03,EI-07}}

## The minimum viable record

A complete record can hold dozens of fields. To get to coverage quickly, AEGIS recommends starting with a minimum viable record and enriching material systems afterward:

| Field | Why it matters | Control |
|---|---|---|
| System name and short description | Identification | EI-01 |
| Business owner and technical owner | Accountability | EI-03 |
| Intended purpose and affected parties | Risk context | EI-04 |
| Decision impact (none / advisory / material / automated decision) | Tiering input | EI-02 |
| Data sensitivity (public to special-category) | Tiering and privacy input | EI-02, EI-06 |
| Autonomy (none / suggests / acts with approval / acts autonomously) | Tiering and runtime controls | EI-02, EI-07 |
| Built, bought or embedded; vendor name | Third-party accountability | EI-08 |
| Lifecycle status (proposed, pilot, production, retired) | Gate applicability | EI-12 |
| Provisional risk tier and who confirmed it | Proportionate governance | EI-02 |

## Common failure modes

- **Spreadsheet decay.** An inventory built once for a board paper and never updated. EI-11 attestations and EI-09 discovery keep it current.
- **Model-only scope.** Inventories that list ML models but miss LLM assistants, agents and AI features inside SaaS tools.
- **Agents without tool manifests.** An agent's risk depends heavily on what it can do. Without EI-07, runtime least-privilege (IS-11) has no baseline.
- **Tiers nobody confirmed.** Automated tier suggestions are useful but are **Inferred** until a human confirms them.

## How AEGIS helps

- [AEGIS Register](/solutions/register/) provides the system of record, intake register, agent and tool registry, and attestation workflow.
- The [AI use-case risk triage](/tools/risk-triage/) tool suggests a provisional tier from a short intake; the result is labelled Inferred and requires human confirmation.
- The Governance Baseline inventories up to 25 AI systems as a starting point.

Read [Why AI governance starts with an inventory](/resources/blog/why-ai-governance-starts-with-an-inventory/) for a practical approach.

## Indicative framework alignment

EI controls align indicatively with NIST AI RMF GOVERN 1.6 (inventory) and MAP 1 and MAP 4 (context and component mapping); ISO/IEC 42001 Annex A.4 (resources for AI systems) and A.5.2; and EU AI Act provisions including Art. 6 (classification, EI-02 and EI-12), Art. 26 (deployer obligations, EI-01 and EI-03) and Art. 49 (registration, EI-01).

{{disclaimer}}

## Next step

{{cta:baseline}}
