---
title: "Agent review protocol (up to 2 agents)"
applies_to: [Pilot A, Pilot B, Governance Baseline]
week: 4
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead with VERITRAIL Shield Lead
related_controls: [EI-07, IS-01, IS-04, IS-11, IS-12, IS-13, IS-14, IS-15, IS-16, SE-04, SE-08]
---

# Agent review protocol (up to 2 agents)

**Goal:** review up to two AI agents (systems that call tools or take actions) against the VERITRAIL agent governance
control set, produce a tool permission matrix and runtime policy recommendations, and draft at least one runtime
policy per agent in Observe mode (pilot metric M4: ≥ 2 runtime policies drafted).

**This is a design and configuration review, not a penetration test.** Adversarial testing of live systems is only
performed if separately authorized in writing by the partner's security lead, in a non-production environment.

## 1. Inputs (metadata only)

- Agent registry entry or description: purpose, users, model/provider, environment (EI-07)
- Tool/API list with operations (read, write, delete, external_send, payment, export) and scopes
- Existing guardrails, approval steps, rate limits, logging configuration
- Existing test results (prompt injection, jailbreak, leakage) if any (IS-14)
- Incident and kill-switch procedures (IS-15, SE-04)

## 2. Review steps

| Step | Activity | Output | Controls |
|---|---|---|---|
| 1 | Confirm registry entry and tier factors (autonomy, external actions, data sensitivity) | Confirmed agent profile; Inferred tier for human confirmation | EI-07, EI-02 |
| 2 | Threat-model the agent: injection via inputs and tool outputs, data exfiltration, excessive agency, runaway loops | Threat list with likelihood/impact | IS-01 |
| 3 | Build the tool permission matrix: each tool × operation → ALLOW / DENY / REQUIRE_HUMAN_APPROVAL / ESCALATE; default deny | Tool matrix | IS-11, IS-13 |
| 4 | Data handling: what must be redacted in prompts, responses, tool parameters and logs | Redaction rules | IS-04 |
| 5 | Limits: rate, token, cost and tool-call ceilings | Limit set | IS-16 |
| 6 | Oversight: approval rules for high-impact operations (delete, external_send, payment, export) and approver roles | Approval rules | IS-13 |
| 7 | Containment: kill-switch scope (agent / tool / model / tenant), time-to-disable target, rollback | Containment plan | IS-15 |
| 8 | Logging and monitoring: metadata or redacted logging; decision logs; alerts | Logging spec | SE-08, IS-12 |
| 9 | Generate draft policy with the Runtime Shield Advisor (`POST /api/shield/advise`) and review it with the owner | Draft policy (status: draft, rollout: observe) | IS-12 |
| 10 | Rollout recommendation: Observe → Warn → Protect → Enforce → Contain with exit criteria | Rollout plan | IS-12 |

## 3. Rules

- Draft policies are created with status `draft` and rollout mode `observe`. Moving any policy toward production or
  changing a production runtime policy requires named human approval by the partner — VERITRAIL never activates policy.
- Findings use evidence labels; configuration seen in the partner's environment by a named reviewer can be Verified.
- No production prompts, responses or tool outputs are copied out of the partner environment.

## 4. Agent review record (one per agent)

| Field | Value |
|---|---|
| Agent ID / name | |
| Owner (business / technical role) | |
| Purpose and users | |
| Tools and operations | |
| Preliminary tier (Inferred) / confirmed tier and approver | |
| Top threats (IS-01) | |
| Tool matrix complete (IS-11) | Y/N |
| High-impact operations requiring approval (IS-13) | |
| Redaction rules (IS-04) | |
| Limits (IS-16) | |
| Kill-switch scope and tested time-to-disable (IS-15) | |
| Logging level and tamper evidence (SE-08) | |
| Adversarial testing status (IS-14) | Verified / User-asserted / Missing evidence / Critical gap |
| Draft policy ID and version | |
| Recommended rollout stage and exit criteria | |
| Findings → gap register IDs | |
