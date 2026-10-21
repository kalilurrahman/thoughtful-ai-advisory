---
title: "AI governance for GCCs and IT services — AEGIS"
h1: "AI governance for global capability centers and IT services"
slug: /industries/gcc-it-services/
description: "AEGIS for global capability centers and IT services firms building AI and agents at scale: role allocation, agent registries, guardrails, evidence."
section: industries
nav_label: "GCCs & IT services"
nav_order: 40
template: page
schema_type: WebPage
primary_cta: guardrails
secondary_cta: baseline
faq:
  - q: "Who is accountable when a GCC builds AI for its parent organization?"
    a: "Accountability should be explicitly allocated. AEGIS records business and technical owners per system (EI-03) and the allocation of responsibilities between the builder, the deploying business and any vendors (AO-09). The legal role under regimes like the EU AI Act depends on the facts and needs legal review."
  - q: "Can AEGIS support multiple clients or business units separately?"
    a: "AEGIS policies can be scoped by agent, environment, model and tenant, and evidence can be organized per client or business unit. Specific multi-tenant deployment arrangements are agreed during onboarding."
updated: 2026-10-21
---

Global capability centers (GCCs) and IT services firms increasingly build, operate and scale AI on behalf of a parent organization or clients. They are often where agentic engineering happens first — coding agents, IT operations agents, document-processing pipelines — and where questions about who is accountable for what are least clearly answered.

## Priority use cases

| Use case | Why it needs governance | Likely tier |
|---|---|---|
| AI agents in IT operations (ticket triage, remediation, access requests) | Tool access to production systems; autonomous actions | Medium to High |
| Coding assistants and code-generation agents | Supply-chain and IP risk; secrets in prompts; insecure code | Medium |
| Document and back-office processing for business units or clients | Personal and confidential data; accuracy; downstream decisions | Medium to High |
| Customer-support agents operated for clients | Customer data; disclosure; actions on accounts | High |
| Internal knowledge assistants | Data leakage across clients or business units; access control | Medium |

## Context, carefully stated

- **Role allocation.** The GCC or service provider may develop a system that the parent or client deploys, or may operate it on their behalf. Under the EU AI Act, roles such as provider and deployer carry different obligations, and a party can become a provider in some circumstances (Art. 25). Contracts and statements of work should allocate responsibilities explicitly.
- **Data protection across jurisdictions.** Cross-border processing brings multiple data-protection regimes into play — for example the GDPR for EU personal data and India's Digital Personal Data Protection Act, 2023 where applicable.
- **Client requirements.** Clients increasingly include AI-specific clauses, questionnaires and audit rights in contracts.

## AEGIS emphasis

- **Accountability allocation (AO-09, EI-03).** Named owners on both sides and a responsibility matrix per system.
- **Agent and tool registry (EI-07).** Every agent's tools, scopes and permitted operations — especially for agents with access to production infrastructure.
- **Runtime guardrails (IS-11, IS-12, IS-13, IS-16).** Default-deny tool access, approval for destructive or external operations, and limits on runaway agents.
- **Redaction and isolation (IS-04).** Masking of client and personal data before external model calls; policies scoped by tenant.
- **Client-ready evidence (SE-05, SE-11).** Evidence packs and AI documentation that answer client due diligence.

{{controls:AO-09,EI-03,EI-07,IS-04,IS-11,IS-13,IS-16,SE-05}}

## Typical first 90 days

| Days | Focus | Outputs |
|---|---|---|
| 1–30 | Register agents and their tool manifests; allocate responsibilities with parent or clients; identify agents with production access | Agent registry; responsibility matrix; high-access agent list |
| 31–60 | Draft runtime policies for high-access agents; adversarial testing; kill-switch procedures | Draft Shield policies; test results; kill-switch runbook |
| 61–90 | Promote policies from Observe toward Enforce with approval; client-facing AI documentation; evidence pack template | Approved policies; documentation; evidence pack template |

{{disclaimer}}

{{cta:guardrails}}
