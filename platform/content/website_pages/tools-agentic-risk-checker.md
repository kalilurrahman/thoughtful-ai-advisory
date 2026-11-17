---
title: "Agentic AI risk checker — review one agent's tools, autonomy and containment"
h1: "Agentic AI risk checker"
slug: /tools/agentic-risk-checker/
description: "Free VERITRAIL tool: review an AI agent's tools, privileges, approvals, injection exposure, containment, limits and logging. Browser-only; nothing stored."
section: tools
nav_label: "Agentic risk checker"
nav_order: 60
template: tool
tool: agentic-risk-checker
schema_type: WebPage
primary_cta: guardrails
secondary_cta: assessment
updated: 2026-11-17
---

Agents carry risks that model-centric assessments miss: what they can touch, what they can do without asking, and how quickly they can be stopped. The checker reviews a single agent across seven areas and returns an indicative posture with an evidence label, the critical gaps for that agent's exposure, and the next actions in priority order.

## What it checks

| Area | Question | Controls |
|---|---|---|
| Tool inventory | Is every tool, scope and data store the agent can reach listed in a registry? | EI-07 |
| Least privilege | Is access default-deny and limited to the declared purpose? | IS-11 |
| High-impact actions | Do irreversible, external or financial operations require human approval? | IS-13 |
| Injection exposure | Has the agent been tested against instructions carried in untrusted content? | IS-14, IS-01 |
| Containment | Can the agent, a tool or a tenant be disabled quickly, and has that been tested? | IS-15 |
| Limits | Are rate, token, tool-call and cost limits enforced? | IS-16 |
| Logging | Are tool calls and policy decisions logged tamper-evidently? | SE-08 |

Which areas count as critical depends on the agent: one that acts autonomously, acts outside your organisation or holds write-capable tools is held to approvals, containment and least privilege; one that reads untrusted content is held to injection testing. A "No" in a critical area makes the agent **not ready for autonomous operation**.

{{controls:EI-07,IS-11,IS-13,IS-14,IS-15}}

## How to read the result

- **Ready for supervised operation** — every area answered, three quarters or more covered, no critical gap.
- **Needs controls before expansion** — gaps or unanswered areas, none critical for this agent.
- **Not ready for autonomous operation** — at least one critical gap for this agent's exposure.

Every answer is yours and is labelled accordingly: "Yes" is *user-asserted* until the evidence behind it is reviewed, "Partly" is *inferred*, and a missing answer is *missing evidence*. The posture requires confirmation by an accountable reviewer before it is recorded.

## Go further

The [guardrail generator](/tools/guardrail-generator/) drafts the tool permission matrix and runtime policy the checker will ask you about, and the [maturity self-assessment](/tools/maturity-assessment/) flags untested agents as a critical gap across the whole programme.

{{disclaimer}}
