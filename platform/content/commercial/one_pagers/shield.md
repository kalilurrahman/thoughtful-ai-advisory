---
title: "One-pager — VERITRAIL Shield"
audience: CISO, Head of Platform Engineering, AI engineering leads
version: 1.0.0
effective_date: 2026-10-21
---

# VERITRAIL Shield — runtime guardrails for LLM apps and agents

**AI proposes. VERITRAIL evaluates. Approved actions execute.**

## The problem

Agents call tools, move data and act on behalf of users. A single prompt injection can turn a helpful agent into one
that exfiltrates data or issues refunds. Most teams have no versioned policy for what an agent may do, no approval step
for high-impact actions, and no tested way to switch it off.

## What it does

| Capability | Controls supported |
|---|---|
| Runtime Shield Advisor: describe a system, get a risk profile, tool permission matrix, data-handling rules, approval rules, limits and a draft policy | IS-01, IS-11 |
| Policy-as-code (`veritrail.policy/v1`) evaluated on prompts, responses, tool calls and tool outputs | IS-12 |
| Decisions: ALLOW, DENY, REDACT, TRANSFORM, REQUIRE_HUMAN_APPROVAL, ESCALATE, RATE_LIMIT | IS-12, IS-13 |
| Default-deny tool access; high-impact operations (delete, external send, payment, export) require approval | IS-11, IS-13 |
| Redaction before model calls and in logs (metadata or redacted logging only) | IS-04 |
| Rate, token, cost and tool-call limits | IS-16 |
| Kill switch by agent, tool, model or tenant | IS-15 |
| Tamper-evident decision logs | SE-08 |
| Progressive rollout: Observe → Warn → Protect → Enforce → Contain | IS-12 |

## Outputs

Versioned policies with change history · policy decision logs · approval records with approver identity · kill-switch
test records · rollout-stage evidence.

## Who it is for

Platform and security teams shipping LLM features and agents; AI-forward SaaS companies and GCCs scaling agent use.

## What you can verify in a demo

Describe an agent with refund and email tools; review the generated tool matrix and policy; evaluate a test request in
Observe mode, then in Enforce mode, and see REQUIRE_HUMAN_APPROVAL for a high-value refund.

## Limitations

Shield evaluates what is routed through it; it cannot govern calls that bypass it. Detection of injection and sensitive
data is pattern- and policy-based and will not catch everything — pair with adversarial testing (IS-14). Production
policy changes always require your named approver.

## Commercials

Per environment plus per agent, with an optional usage tier (hypothesis to validate in pilots — see
`pricing_models.md`).
