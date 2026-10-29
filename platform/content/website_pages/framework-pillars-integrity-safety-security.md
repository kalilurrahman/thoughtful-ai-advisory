---
title: "Integrity, Safety & Security (IS) — VERITRAIL Framework pillar"
h1: "Pillar 4: Integrity, Safety & Security"
slug: /framework/pillars/integrity-safety-security/
description: "VERITRAIL IS controls cover data quality, privacy, redaction, fairness, safety, robustness, transparency, human oversight and runtime guardrails for AI agents."
section: framework
nav_label: "Integrity & Security (IS)"
nav_order: 19
template: page
schema_type: WebPage
primary_cta: guardrails
secondary_cta: baseline
faq:
  - q: "Why does this pillar have more controls than the others?"
    a: "Because it covers both the classic responsible-AI concerns (data, privacy, fairness, safety, transparency, oversight) and the security and runtime controls that LLM applications and agents need (threat modelling, supply chain, least privilege, guardrails, approvals, kill switch and limits)."
  - q: "Do runtime guardrails replace pre-release testing?"
    a: "No. Guardrails (IS-12) reduce exposure at runtime but cannot catch every failure. Pre-release adversarial testing (IS-14), threat modelling (IS-01) and validation (GL-05) remain necessary."
updated: 2026-10-21
---

**Core question: are data, fairness, safety, security and runtime behavior actually controlled?**

This pillar contains 16 controls — the largest in the framework — because it spans two disciplines that are converging. Responsible-AI teams have long worked on data quality, fairness, safety and transparency. Security teams are now dealing with prompt injection, model supply chain risk, and agents that can call tools and take actions. VERITRAIL puts them in one pillar so that a single assessment covers both, and so that runtime protection is designed with oversight in mind.

## Three groups of controls

### Data and privacy

| Control | Objective | Priority / scope | Evidence |
|---|---|---|---|
| IS-02 Data governance and quality | Quality, representativeness and fitness of training, fine-tuning and grounding data | High / all AI | Data quality checks; dataset documentation; data approvals |
| IS-03 Privacy assessment and data minimisation | Privacy, consent, retention, cross-border transfer and minimisation assessed | Critical / all AI | Privacy/data-protection impact assessment; retention schedule; transfer assessment |
| IS-04 Sensitive data redaction and masking | Sensitive data redacted, masked or excluded from prompts, responses, logs and external model calls | Critical / GenAI | Redaction configuration; redaction tests; log samples showing masking |

### Fairness, safety and transparency

| Control | Objective | Priority / scope | Evidence |
|---|---|---|---|
| IS-05 Bias and fairness testing | Bias and discriminatory outcomes tested before release and periodically | High-tier / EU high-risk | Fairness test plan and results; mitigation records |
| IS-06 Safety and harm evaluation | Safety risks and unintended harms evaluated | High-tier / EU high-risk | Harm analysis; safety evaluation; residual-risk sign-off |
| IS-07 Accuracy and robustness testing | Accuracy and robustness measured, including adversarial conditions | High-tier / EU high-risk | Accuracy metrics with thresholds; robustness results |
| IS-08 Transparency and AI disclosures | Users informed when interacting with AI or when AI materially influences a decision | High / all AI | Disclosure text and placement; explanation approach |
| IS-09 Human oversight design | Review, override, escalation and appeal proportionate to decision impact | Critical-priority / EU high-risk | Oversight design; override/appeal procedures; oversight records |

### Security and runtime control

| Control | Objective | Priority / scope | Evidence |
|---|---|---|---|
| IS-01 AI threat modelling | Threat models covering prompt injection, data poisoning, model extraction and unsafe tool use | High / all AI | Threat model per material system; mitigation tracking |
| IS-10 Secure model and prompt supply chain | Models, weights, prompts, plugins and dependencies protected from tampering | High / GenAI | Approved model/provider list; integrity checks; dependency scans |
| IS-11 Least-privilege tool access | Agents get only the tools, scopes and data they need; deny by default | Critical / agentic | Tool permission matrix; access-scope configuration; access reviews |
| IS-12 Runtime guardrails and policy enforcement | Prompts, responses and tool calls evaluated against versioned policy before execution | High / GenAI | Versioned runtime policy; policy decision logs; enforcement-mode configuration |
| IS-13 Human approval for high-impact actions | Designated human approval before high-impact, irreversible or external agent actions | Critical / agentic | Approval rules in runtime policy; approval records with approver identity |
| IS-14 Prompt-injection and data-leakage testing | Adversarial testing before release and after material change | Critical / GenAI | Red-team results; remediation records; re-test evidence |
| IS-15 Kill switch and rollback | Ability to disable or roll back a system, model, agent, tool or tenant quickly | Critical / all AI | Kill-switch procedure; test record with time-to-disable; rollback runbook |
| IS-16 Rate, budget and resource limits | Rate, token, cost and tool-call limits contain runaway agents and abuse | Medium / GenAI | Limit configuration; limit-breach alerts |

{{controls:IS-04,IS-09,IS-11,IS-13,IS-14,IS-15}}

## Agents change the threat model

A conventional ML model produces an output that a person or system then acts on. An agent can act directly: query a database, send an email, update a record, execute code or call a payments API. That shifts several controls from "good practice" to "critical":

- **Least privilege (IS-11).** An agent's blast radius is defined by its tool permissions. Deny by default, grant per declared purpose, review access periodically.
- **Human approval (IS-13).** Irreversible, external or high-value actions should pause for a designated approver. The approval and the approver's identity are evidence.
- **Adversarial testing (IS-14).** Indirect prompt injection — instructions hidden in documents, web pages or emails the agent reads — can redirect an agent with tool access. Test before release and after every material change.
- **Containment (IS-15, IS-16).** You need to be able to stop an agent, revoke a tool or roll back a prompt quickly, and to cap the rate and cost of what it does.

## Common failure modes

- **Redaction only on the way in.** Sensitive data is masked in prompts but appears verbatim in logs or model responses. IS-04 covers prompts, responses, logs and external calls.
- **Guardrails in permanent observe mode.** Policies are deployed but never move beyond logging. VERITRAIL Shield uses a staged rollout so that enforcement is planned, not postponed.
- **Oversight that is a rubber stamp.** Human review exists but reviewers lack time, information or authority to override. IS-09 asks for oversight *design*, including how reviewers can disagree.
- **Untested kill switches.** A procedure exists but nobody knows how long disabling an agent actually takes. Test it and record time-to-disable.

## How VERITRAIL helps

- [VERITRAIL Shield](/solutions/shield/) implements IS-04, IS-11, IS-12, IS-13, IS-15 and IS-16 as policy-as-code with a staged Observe → Warn → Protect → Enforce rollout and a Contain mode for incidents.
- The [guardrail generator](/tools/guardrail-generator/) drafts a starter policy from a short profile of your LLM application or agent.
- [VERITRAIL Assess](/solutions/assess/) provides deep-dive modules for privacy, fairness and harm, and security and agentic risk.

Read [Runtime guardrails for AI agents: a practical rollout model](/resources/blog/runtime-guardrails-for-ai-agents/).

## Indicative framework alignment

IS controls align indicatively with NIST AI RMF MEASURE 2 (for example MEASURE 2.7 security and resilience, 2.10 privacy, 2.11 fairness) and MANAGE 2.2 and 2.4; ISO/IEC 42001 Annex A.5, A.6.2, A.7 and A.9; and EU AI Act Art. 10 (data governance), Art. 13 and Art. 50 (transparency), Art. 14 (human oversight) and Art. 15 (accuracy, robustness and cybersecurity).

{{disclaimer}}

{{cta:guardrails}}
