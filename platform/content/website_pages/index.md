---
title: "AEGIS Enterprise — AI governance, runtime guardrails and evidence"
h1: "Govern every AI system, agent, and decision with evidence."
lead: "AEGIS Enterprise helps organizations inventory AI, assess risk, govern the lifecycle, protect LLM applications and agents at runtime, and prove responsible AI continuously."
slug: /
description: "AEGIS helps enterprises inventory AI, assess risk, govern the lifecycle, protect LLM apps and agents at runtime, and evidence responsible AI continuously."
section: home
nav_label: "Home"
nav_order: 0
template: home
schema_type: WebPage
primary_cta: assessment
secondary_cta: baseline
faq:
  - q: "Does AEGIS make my organization compliant with the EU AI Act or ISO/IEC 42001?"
    a: "No. AEGIS supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, determine EU AI Act compliance or replace legal advice. Framework mappings are indicative."
  - q: "Where should we start?"
    a: "Most organizations start with the free 8-minute maturity self-assessment, then validate the result with evidence in a 4–6 week AEGIS Governance Baseline."
  - q: "Does AEGIS work with agents as well as models?"
    a: "Yes. AEGIS registers agents and their tools, and AEGIS Shield evaluates prompts, responses and tool calls against versioned runtime policy, including human approval for high-impact actions."
updated: 2026-10-21
---

## Four ways to start

- [Run the AI Governance Maturity Self-Assessment](/tools/maturity-assessment/) — 24 questions, about 8 minutes, an indicative score across 8 domains.
- [Book an AEGIS Governance Baseline](/contact/book-governance-baseline/) — a fixed-scope 4–6 week engagement that validates your position with evidence.
- [Explore the AEGIS Agent](/solutions/agent/) — a governance copilot that cites controls and labels evidence.
- [Download the AEGIS Enterprise Blueprint](/resources/blueprint/) — the operating model, control library and rollout plan in one document.

## The problem: five questions most enterprises cannot answer with evidence

AI adoption has outpaced the governance designed to control it. Models arrive through vendor products, business teams build assistants on public APIs, and engineering teams give agents access to tools and data. When a board member, auditor, customer or regulator asks a direct question, the honest answer is often "we think so".

1. **What AI do we actually run?** Which systems, models, agents and vendor AI features are in use, who owns each one, and what data does it touch?
2. **Which of them are high-risk, and why?** Is there a consistent, approved basis for classifying decision impact, data sensitivity, autonomy and regulatory relevance?
3. **Who approved each system, and under what conditions?** Can we show the risk assessment, the approver and the conditions that were attached before go-live?
4. **What stops an agent from doing something it should not?** Are tool permissions, data handling and high-impact actions governed at runtime, or only described in a policy document?
5. **Could we produce evidence tomorrow?** If asked, could we hand over an evidence pack for a material AI system — logs, approvals, test results, monitoring — without a fire drill?

AEGIS exists to turn each of those questions into a governed, evidenced answer.

## Six layers, one governance system

| Layer | What it does | AEGIS capability |
|---|---|---|
| 1. Baseline | Establishes where you are today, with evidence status for every finding | [AEGIS Assess](/solutions/assess/) and the [maturity self-assessment](/tools/maturity-assessment/) |
| 2. System of record | One owned, classified inventory of AI systems, models, agents and vendor AI | [AEGIS Register](/solutions/register/) |
| 3. Lifecycle control | Risk-proportionate intake, approval, change, monitoring and retirement gates | [AEGIS Control](/solutions/control/) |
| 4. Runtime protection | Policy-as-code guardrails for prompts, responses and agent tool calls | [AEGIS Shield](/solutions/shield/) |
| 5. Assurance | Control testing, tamper-evident logs, incidents and audit-ready evidence packs | [AEGIS Assurance](/solutions/assurance/) |
| 6. Copilot | A governance agent that drafts assessments, gap registers and reports with citations | [AEGIS Agent](/solutions/agent/) |

## Five pillars, 64 controls

The [AEGIS Framework](/framework/) organizes governance into five pillars and a library of 64 controls, each with an objective, an owner role, the evidence that demonstrates it, and indicative mappings to NIST AI RMF, ISO/IEC 42001 and the EU AI Act.

| Pillar | The question it answers |
|---|---|
| [Accountability & Operating Model (AO)](/framework/pillars/accountability/) | Who owns AI risk, who decides, and how is governance resourced? |
| [Enterprise AI Inventory (EI)](/framework/pillars/inventory/) | What AI do we run, who owns it, and how risky is it? |
| [Governance & Lifecycle Control (GL)](/framework/pillars/lifecycle/) | What gates does an AI system pass from intake to retirement? |
| [Integrity, Safety & Security (IS)](/framework/pillars/integrity-safety-security/) | Are data, fairness, safety, security and runtime behavior controlled? |
| [Stewardship, Evidence & Assurance (SE)](/framework/pillars/stewardship-assurance/) | Can we prove it, test it, learn from incidents and improve? |

Browse every control in the [AEGIS Control Library](/framework/controls/).

## How it works

**Baseline → Register → Control → Shield → Assurance**

1. **Baseline.** Start with the self-assessment, then validate it in a [Governance Baseline](/contact/book-governance-baseline/). Every finding carries an evidence label — Verified, User-asserted, Inferred, Missing evidence or Critical gap — so leaders can see what is known and what is assumed.
2. **Register.** Build the AI system of record: owners, intended purpose, data sources, models, agents, tools and vendors, each classified into a risk tier that a human confirms.
3. **Control.** Route every new use case and material change through risk-tiered intake, assessment and approval, with exceptions that expire.
4. **Shield.** Put versioned runtime policy in front of LLM applications and agents: redact sensitive data, deny unregistered tools, and require human approval for high-impact actions. Roll out in stages — Observe, Warn, Protect, Enforce — with a tested Contain mode for incidents.
5. **Assurance.** Test controls, retain tamper-evident logs, manage AI incidents and produce evidence packs on request.

## What AEGIS does — and does not — claim

AEGIS supports governance readiness, control implementation and evidence collection. Our framework mappings to NIST AI RMF, ISO/IEC 42001 and the EU AI Act are indicative interpretations designed to help you organize evidence. They are not an official crosswalk, a legal opinion or a conformity assessment.

{{disclaimer}}

Read more in [Readiness is not compliance: how to read framework mappings](/resources/blog/readiness-is-not-compliance/) and in our [Responsible AI statement](/legal/responsible-ai/).

## Value by stakeholder

| Stakeholder | What they need | What AEGIS provides |
|---|---|---|
| CISO | Visibility and control over LLM apps, agents and AI data flows | Agent and tool registry, threat modelling, prompt-injection testing, runtime policy, kill switch and tamper-evident logs |
| CIO / CTO | Scale AI safely without slowing delivery | Risk-proportionate gates, so low-risk use cases move quickly and high-risk ones get the right scrutiny |
| Chief Risk / Compliance Officer | A defensible risk position and readiness evidence | Risk appetite linkage, tiering, exception register, indicative framework mappings and audit-ready evidence packs |
| Head of AI CoE | A repeatable intake-to-production path | Standard intake, triage, assessment modules, approval workflow and reusable runbooks |
| Engineering lead | Clear, testable requirements instead of policy prose | Policy-as-code with ALLOW / DENY / REQUIRE_HUMAN_APPROVAL rules, staged enforcement and change control |
| Consultant / advisor | A structured, evidence-first method for client work | The control library, gap-analysis method, templates and the AEGIS Agent for drafting with citations |

## Start with an honest baseline

The self-assessment takes about 8 minutes and returns an indicative maturity level, domain scores, critical flags and a 30/60/90-day action plan. Results are self-reported and labelled User-asserted until evidence is reviewed.

{{cta:assessment}}

{{cta:baseline}}
