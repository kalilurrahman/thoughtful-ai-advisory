---
title: "Runtime guardrail generator for LLM apps and AI agents — AEGIS"
h1: "Runtime guardrail generator"
slug: /tools/guardrail-generator/
description: "Describe an LLM app or AI agent and get a draft risk profile, tool permission matrix, approval rules and an AEGIS policy-as-code starting point to review."
section: tools
nav_label: "Guardrail generator"
nav_order: 30
template: tool
tool: guardrail-generator
schema_type: WebPage
primary_cta: guardrails
secondary_cta: demo
faq:
  - q: "Can I deploy the generated policy directly to production?"
    a: "You should not. The output is a draft starting point. It must be reviewed by the system owner and security, tested in Observe mode, and approved before any production use. Changing production runtime policy always requires human approval in AEGIS."
  - q: "What should I not enter?"
    a: "Do not enter secrets, credentials, personal data or confidential details. Describe the system in general terms — tool names and categories, data sensitivity, autonomy — which is all the generator needs."
updated: 2026-10-21
---

Describe your LLM application or agent — what it is for, what data it handles, what tools it can use and how autonomously it acts — and the generator drafts the controls AEGIS would recommend, as a policy you can take to your engineering and security teams.

## What you will provide

- Purpose and environment (development, pilot, production).
- Data sensitivity, from public to special-category.
- Autonomy: suggests only, acts with approval, or acts autonomously.
- Tools the system can call and the operations each performs — read, write, delete, external send, payment or export.
- Whether it uses a vendor model and whether it affects customers or the public.

## What you will get

| Output | What it contains | Controls |
|---|---|---|
| Risk profile | Suggested tier and the factors behind it (Inferred) | EI-02 |
| Tool permission matrix | Each tool and operation with ALLOW, DENY or REQUIRE_HUMAN_APPROVAL; default-deny for anything unlisted | IS-11, IS-13 |
| Data handling | Redaction entities and surfaces (prompts, responses, tool parameters, tool outputs) | IS-04 |
| Limits | Requests per minute, tool calls per session, tokens per day, monthly cost cap | IS-16 |
| Monitoring and logging | Decision logging, redacted logging levels, tamper-evident audit | SE-08, GL-08 |
| Incident response | Kill-switch scopes, authorized roles and target time-to-disable | IS-15, SE-04 |
| Rollout plan | Observe → Warn → Protect → Enforce, with exit criteria; Contain for incidents | IS-12 |
| Draft policy | YAML and JSON in the AEGIS policy schema, status *draft* | IS-12 |

{{controls:IS-11,IS-12,IS-13,IS-04,IS-16,IS-15}}

## How to use the draft

1. **Review** with the business owner, platform engineering and security. Check every ALLOW rule against the agent's declared purpose.
2. **Adjust** thresholds — for example, the value above which a refund needs approval — to your risk appetite.
3. **Deploy in Observe mode** and review the decision log for false positives and missing rules.
4. **Promote** through Warn, Protect and Enforce against exit criteria, with approval at each production change.

The method is explained in [AEGIS Shield](/solutions/shield/) and in [Runtime guardrails for AI agents: a practical rollout model](/resources/blog/runtime-guardrails-for-ai-agents/).

## Limitations

The generator works from your description; it cannot see your code, prompts or infrastructure. Recommendations are a starting point grounded in AEGIS controls, not a security assessment, and do not replace threat modelling (IS-01) or adversarial testing (IS-14).

{{cta:demo}}
