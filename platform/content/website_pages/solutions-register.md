---
title: "VERITRAIL Register — the AI system of record for models, agents and vendor AI"
h1: "VERITRAIL Register: one system of record for every AI system and agent"
slug: /solutions/register/
description: "VERITRAIL Register inventories AI systems, models, prompts, data sources, agents, tools and vendor AI with named owners, risk tiers and periodic attestation."
section: solutions
nav_label: "VERITRAIL Register"
nav_order: 30
template: page
schema_type: Service
primary_cta: baseline
secondary_cta: demo
faq:
  - q: "Can Register import from our existing CMDB or model registry?"
    a: "VERITRAIL supports structured CSV and JSON import and export so inventory records can be seeded from existing sources. Specific integrations are scoped during the Governance Baseline or design-partner programme."
  - q: "How does Register find shadow AI?"
    a: "Register supports a discovery and reconciliation workflow (EI-09): you import findings from sources such as SaaS management, cloud billing, API gateways or surveys, and reconcile them into owned records. VERITRAIL does not scan your network itself."
updated: 2026-10-21
---

**Core message: you cannot govern AI you cannot see. Register gives every AI system, model, agent and vendor AI product a record, an owner and a risk tier.**

Inventories fail in predictable ways: they are built once for a board paper, they list models but miss agents and embedded SaaS AI, and nobody owns keeping them current. VERITRAIL Register is designed around the controls that prevent those failures.

## Capabilities

- **AI system of record (EI-01).** A single inventory spanning in-house models, LLM applications, agents, vendor AI products and AI features in SaaS tools, with record counts and last-updated timestamps.
- **Risk classification (EI-02).** Classification by business criticality, data sensitivity, decision impact, autonomy and regulatory relevance, producing a suggested tier that a human confirms.
- **Named ownership (EI-03).** Business and technical owner per system, with owner acceptance recorded.
- **System profiles (EI-04).** Intended purpose, users, affected parties, context of use and foreseeable misuse.
- **Model, prompt and data registries (EI-05, EI-06).** Versions, prompts, system instructions, configuration, data sources and lineage.
- **Agent and tool registry (EI-07).** Every agent, every tool, API, plugin and data store it can reach, and the operations it is permitted to perform — the baseline for runtime least privilege in [VERITRAIL Shield](/solutions/shield/).
- **Vendor AI inventory (EI-08).** Vendor products, embedded features and foundation-model providers, with contract and data-processing references.
- **Shadow AI reconciliation (EI-09)** and **owner attestation (EI-11)** to keep the inventory current.
- **Use-case intake register (EI-12).** Proposed use cases are captured before build or procurement and flow into [VERITRAIL Control](/solutions/control/).

## Who it is for

- **CIO and CTO offices** that need a complete picture of AI in the estate.
- **CISOs** who need to know which agents can reach which systems and data.
- **AI Governance Leads** who need the inventory to drive tiering, assessment and evidence.
- **Procurement and vendor risk teams** responsible for third-party AI.

## Outputs

| Output | Use |
|---|---|
| Inventory export (CSV / JSON) with record counts and coverage | Board and audit reporting; evidence for EI-01 |
| Tier distribution and owner coverage metrics | Leadership KPIs (SE-03) |
| Agent tool/permission manifests | Input to runtime policy; access reviews (IS-11) |
| Attestation and reconciliation records | Evidence for EI-09 and EI-11 |
| Per-system profile | Starting point for technical documentation (GL-06) and evidence packs (SE-05) |

## Example: an agent record

| Field | Value |
|---|---|
| System | Claims triage assistant (agent) |
| Business owner / technical owner | Head of Claims Operations / Platform Engineering Lead |
| Intended purpose | Summarize incoming claims and propose routing; does not decide claims |
| Decision impact | Advisory |
| Data sensitivity | Personal, including some special-category health data |
| Autonomy | Suggests |
| Tools | Claims system (read), document store (read), ticketing (write — create only) |
| Vendor model | Yes — foundation-model API under enterprise agreement |
| Suggested tier | High (Inferred — special-category data, vulnerable affected parties); awaiting confirmation by AI Risk Lead |
| Required modules | Core, data and privacy, security, generative AI, agentic, fairness and safety, human oversight, vendor, monitoring |

{{controls:EI-01,EI-02,EI-03,EI-07,EI-08,EI-09}}

## Limitations

Register is only as complete as the sources and discovery feeding it. VERITRAIL does not perform network or endpoint scanning; it reconciles discovery results you provide. Suggested tiers are Inferred until confirmed. Coverage attestations are User-asserted unless sampled and verified.

Read [Why AI governance starts with an inventory](/resources/blog/why-ai-governance-starts-with-an-inventory/).

{{cta:baseline}}
