---
title: "The VERITRAIL Framework — five pillars and 64 AI governance controls"
h1: "The VERITRAIL Framework"
slug: /framework/
description: "Five pillars, 64 controls, an 8-domain maturity model and implementation runbooks — an evidence-first structure for governing AI systems and agents."
section: framework
nav_label: "Framework"
nav_order: 10
template: page
schema_type: WebPage
primary_cta: blueprint
secondary_cta: assessment
faq:
  - q: "Is the VERITRAIL Framework a standard?"
    a: "No. It is an operational control framework that helps you implement and evidence AI governance. It maps indicatively to NIST AI RMF, ISO/IEC 42001 and the EU AI Act, but it is not an official crosswalk or a certification scheme."
  - q: "How often is the control library updated?"
    a: "The control library is versioned and reviewed quarterly. Every control citation in VERITRAIL outputs includes the library version so you can trace which version a recommendation was based on."
updated: 2026-10-21
---

The VERITRAIL Framework is the backbone of everything VERITRAIL does. The self-assessment scores against it, the VERITRAIL Agent cites it, Shield policies reference it, and evidence packs are organized by it. It was designed around one test: **can an organization show, with evidence, that a control is operating?**

## Why another framework?

NIST AI RMF, ISO/IEC 42001 and the EU AI Act each describe *what* good AI governance should achieve, at different levels of abstraction and with different legal force. Teams implementing them run into the same practical problems:

- **The unit of work is unclear.** A framework outcome such as "AI risks are identified and documented" does not tell an engineering lead what to build or an auditor what to look at.
- **Ownership is diffuse.** Without a named owner role per control, everything belongs to "governance" and nothing gets done.
- **Evidence is an afterthought.** Policies get written; the records that prove the policy is followed do not.
- **Agents are not covered well.** Tool access, autonomous actions and runtime containment need explicit controls, not just model-centric guidance.

The VERITRAIL Framework addresses these by defining each control with an objective, a scope (`all`, `high_risk`, `genai`, `agentic` or `third_party`), an owner role, a priority, the evidence that demonstrates it, the VERITRAIL module that implements it, and indicative framework mappings.

## Structure

| Component | What it is | Where to go |
|---|---|---|
| Five pillars | The organizing structure: accountability, inventory, lifecycle, integrity/safety/security, and assurance | [Five pillars](/framework/pillars/) |
| Control library | 64 controls (AO, EI, GL, IS, SE), versioned, with evidence requirements and mappings | [Control library](/framework/controls/) |
| Maturity model | Five levels and eight weighted domains used by the self-assessment | [Maturity model](/framework/maturity-model/) |
| Assessment modules | Organization-level and use-case-level assessments, triggered by risk tier | [Assessment modules](/framework/assessment-modules/) |
| Implementation runbooks | Step-by-step procedures to stand up and operate key controls | [Runbooks](/framework/runbooks/) |

## The five pillars at a glance

**Accountability & Operating Model (AO-01 to AO-12).** Policy, an executive forum with authority to stop use cases, RACI, risk appetite, AI literacy, escalation, obligations register, prohibited-use screening and resourcing. [Read more](/framework/pillars/accountability/).

**Enterprise AI Inventory (EI-01 to EI-12).** A single system of record for AI systems, models, prompts, data sources, agents and their tools, vendor AI and shadow AI, with risk tiers and named owners. [Read more](/framework/pillars/inventory/).

**Governance & Lifecycle Control (GL-01 to GL-12).** Intake triage, pre-deployment assessment, risk-tiered approvals, change triggers, validation, technical documentation, go-live checks, monitoring, retirement, exceptions, vendor due diligence and recertification. [Read more](/framework/pillars/lifecycle/).

**Integrity, Safety & Security (IS-01 to IS-16).** Threat modelling, data quality, privacy, redaction, fairness, safety, robustness, transparency, human oversight, supply chain, least-privilege tool access, runtime guardrails, human approval for high-impact actions, adversarial testing, kill switch and resource limits. [Read more](/framework/pillars/integrity-safety-security/).

**Stewardship, Evidence & Assurance (SE-01 to SE-12).** Control testing, evidence retention, metrics, incident management, evidence packs, corrective action, management review, tamper-evident logging, post-market monitoring, internal audit, transparency reporting and drift monitoring. [Read more](/framework/pillars/stewardship-assurance/).

## The controls that matter most on day one

Of the 64 controls, 17 are marked **critical** priority. If you can evidence nothing else, these are the ones that close the largest exposures — no inventory, no pre-deployment assessment, unprotected sensitive data, untested agents and no way to stop a misbehaving system:

{{controls:AO-01,AO-02,AO-10,EI-01,EI-02,EI-03,EI-07,GL-02,GL-03,IS-03,IS-04,IS-09,IS-11,IS-13,IS-14,IS-15,SE-08}}

## Evidence-first by design

Every VERITRAIL finding carries one of five evidence labels:

| Label | Meaning |
|---|---|
| Verified | Evidence exists and has been reviewed by a named reviewer |
| User-asserted | Someone states the control is implemented, but evidence has not been provided |
| Inferred | Inferred as a likely gap or fact from responses or metadata |
| Missing evidence | Required evidence has not been provided |
| Critical gap | Material privacy, security, safety, legal or operational exposure |

Self-assessment answers are always User-asserted. Only evidence reviewed by a named human becomes Verified. This distinction is what lets a board pack, an audit response or a customer questionnaire be honest about what is known. The full method is described in [Gap analysis](/compliance/gap-analysis/).

## Relationship to external frameworks

Each control carries indicative mappings to NIST AI RMF 1.0 subcategories, ISO/IEC 42001:2023 clauses and Annex A controls, and EU AI Act (Regulation (EU) 2024/1689) articles. See [NIST AI RMF](/compliance/nist-ai-rmf/), [ISO/IEC 42001](/compliance/iso-42001/) and [EU AI Act readiness](/compliance/eu-ai-act/) for how to use them.

{{disclaimer}}

## Get the full framework

The VERITRAIL Enterprise Blueprint packages the pillars, the control library, the maturity model and a phased rollout plan in a single document for your governance forum.

{{cta:blueprint}}
