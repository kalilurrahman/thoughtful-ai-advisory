---
title: "AI governance policy packs and runtime guardrail policies — VERITRAIL"
h1: "Policy packs"
slug: /resources/policy-packs/
description: "VERITRAIL policy packs: governance policy templates for your AI operating model and runtime guardrail policy packs for LLM apps and agents, with status."
section: resources
nav_label: "Policy packs"
nav_order: 40
template: page
schema_type: WebPage
primary_cta: guardrails
secondary_cta: baseline
updated: 2026-10-21
---

VERITRAIL policy packs come in two kinds: **governance policies** that define your operating model, and **runtime policies** — policy-as-code — that VERITRAIL Shield enforces on LLM applications and agents.

## Governance policy templates

| Template | Purpose | Controls | Status |
|---|---|---|---|
| AI governance policy | Scope, principles, risk appetite linkage, accountabilities | AO-01 | Provided in the Governance Baseline |
| Governance forum terms of reference | Membership, authority to approve, restrict or stop, decision log | AO-02 | Provided in the Governance Baseline |
| AI RACI and escalation matrix | Roles across the lifecycle; escalation routes and timeframes | AO-03, AO-06 | Provided in the Governance Baseline |
| Prohibited and restricted use list | Uses that are prohibited, restricted or conditionally permitted | AO-10 | Provided in the Governance Baseline |
| Risk-tier criteria and approval matrix | Tier definitions, approvers, conditions and review cadence | AO-04, GL-03 | Provided in the Governance Baseline |
| Exception and risk acceptance standard | Approver, expiry and compensating controls | GL-10 | Provided in the Governance Baseline |
| Vendor AI contract clause checklist | Data use, model changes, incident notice, audit rights | GL-11 | Provided in the Governance Baseline |

Standalone downloadable editions are **coming soon**.

## Runtime guardrail policy packs

Runtime packs are starting points in the VERITRAIL policy schema (`veritrail.policy/v1`) for common system types. Each pack is versioned, cites VERITRAIL controls, and begins in **Observe** mode.

| Pack | Typical rules | Controls |
|---|---|---|
| Internal knowledge assistant | Redaction, injection detection on retrieved content, no tools beyond search | IS-04, IS-12, IS-14 |
| Customer-support agent | CRM read, approval thresholds for refunds, approval for external email, deny deletion | IS-11, IS-13, IS-04 |
| IT operations agent | Read-only diagnostics, approval for changes, deny destructive operations in production | IS-11, IS-13, IS-15 |
| Coding assistant | Secret redaction, approved model list, limits on tool calls | IS-04, IS-10, IS-16 |

Downloadable packs are **coming soon**. Today, the [guardrail generator](/tools/guardrail-generator/) produces a draft policy tailored to your system in the same schema.

{{controls:AO-01,AO-10,GL-03,IS-12,IS-13}}

## Using policy packs safely

- Treat every pack as a draft. Review it with the system owner, security and, where relevant, legal.
- Deploy runtime policies in Observe mode first and promote through Warn, Protect and Enforce against exit criteria.
- Changes to production runtime policy require human approval and are recorded in the policy's change history.

See [VERITRAIL Shield](/solutions/shield/) for how policies are evaluated and enforced.

{{cta:guardrails}}
