---
title: "Agentic AI risk checker (planned) — join the waitlist"
h1: "Agentic AI risk checker — planned"
slug: /tools/agentic-risk-checker/
description: "Planned VERITRAIL tool: review an AI agent's tools, autonomy, approvals and containment against VERITRAIL controls. Not yet available — join the waitlist."
section: tools
nav_label: "Agentic risk checker (planned)"
nav_order: 60
template: tool
tool: waitlist
schema_type: WebPage
primary_cta: guardrails
secondary_cta: assessment
updated: 2026-10-21
---

**Status: planned. This tool is not available yet.** Join the waitlist and we will let you know when an early version is ready to test. We do not have a release date to share.

## What it is intended to do

Agents carry risks that model-centric assessments miss: what they can touch, what they can do without asking, and how quickly they can be stopped. The agentic risk checker is planned to review a single agent across:

| Area | Questions it will ask | Controls |
|---|---|---|
| Tool inventory | Which tools, scopes and data stores can the agent reach? | EI-07 |
| Least privilege | Is access default-deny and limited to the declared purpose? | IS-11 |
| High-impact actions | Which operations are irreversible, external or financial, and do they require approval? | IS-13 |
| Injection exposure | Does the agent read untrusted content that could carry instructions? Has it been tested? | IS-14, IS-01 |
| Containment | Can the agent, a tool or a tenant be disabled quickly? Has that been tested? | IS-15 |
| Limits | Are there rate, token, tool-call and cost limits? | IS-16 |
| Logging | Are tool calls and policy decisions logged tamper-evidently? | SE-08 |

{{controls:EI-07,IS-11,IS-13,IS-14,IS-15}}

## Available today

The [guardrail generator](/tools/guardrail-generator/) already drafts a tool permission matrix and runtime policy for an agent, and the [maturity self-assessment](/tools/maturity-assessment/) flags untested agents as a critical gap.
