---
title: "Pilot B plan — AI-forward SaaS / GCC / enterprise with LLM apps and agents"
pilot: B
version: 1.0.0
effective_date: 2026-10-21
owner: AEGIS Delivery Lead with AEGIS Shield Lead
status: Not started — awaiting design-partner recruitment
---

# Pilot B — AI-forward organization with LLM apps and agents

> **Status: Not started — awaiting design-partner recruitment.** No design partner has been signed. This plan is the
> template that will be tailored to the first qualified partner (see `../pilot_status_tracker.md`).

## 1. Design-partner profile

AI-forward SaaS company, global capability center (GCC) or enterprise running **LLM applications and agents** in or
near production, with an engineering/platform team willing to trial policy-as-code, and a security or governance
owner accountable for agent risk.

## 2. Hypotheses this pilot tests

| ID | Hypothesis | Measured by |
|---|---|---|
| HB-1 | The Shield Advisor produces tool permission matrices and draft policies engineers accept as realistic | M4, survey E1–E2 |
| HB-2 | Observe → Warn rollout surfaces useful would-be decisions without blocking developers | Observe-mode decision review (S4), survey E3 |
| HB-3 | Human-approval rules for high-impact actions are workable in practice | Survey E4; approval-rule review |
| HB-4 | Developers adopt policy-as-code in their workflow (repo, CI validation) | S5 developer adoption |
| HB-5 | Agent governance pain converts to a paid Shield (+ Register) engagement | M6, survey G1–G3 |

## 3. Focus areas

1. **Agent governance** — agent and tool registry, threat models, least privilege (EI-07, IS-01, IS-11).
2. **Runtime guardrails** — versioned runtime policy, redaction, approvals, limits, kill switch (IS-04, IS-12, IS-13,
   IS-15, IS-16).
3. **Developer adoption** — policy files in the repository, schema validation in CI, Observe-mode decision logs (SE-08).
4. **Policy-as-code** — `aegis.policy/v1` policies drafted, validated and staged through rollout modes.

## 4. Scope

| In scope | Out of scope |
|---|---|
| Inventory of LLM apps and agents (target ≥ 25 AI systems incl. features, internal tools and vendor AI) | Production enforcement (Enforce/Contain) — requires partner approval beyond the pilot |
| Maturity self-assessment (lighter calibration) | Live adversarial testing unless separately authorized in writing, non-production only |
| 5 deep-dives weighted to GenAI/agentic systems; **2 agent reviews (core)** | Production prompts/responses leaving the partner environment |
| ≥ 2 draft runtime policies; Observe-mode trial in non-production if the partner chooses | Building integrations to partner gateways beyond a reference adapter |
| Gap register, roadmap, runtime recommendations, executive report | Statements of compliance or certification |

## 5. Six-week plan

| Week | Activities | Deliverables | Partner effort (indicative) | Exit criteria |
|---|---|---|---|---|
| 1 — Kick-off, scope, data access | Kick-off; choose 2 agents; sign safeguards; collect agent/tool manifests (metadata); baseline S4–S5 | Safeguards; agent shortlist; architecture sketch | Sponsor 1 h; platform lead 4 h; security 2 h | Safeguards signed; agents selected |
| 2 — Inventory workshops | Engineering-led workshops incl. feature-level LLM inventory and shadow AI | Register ≥ 25 records; agent registry entries | Each team 1.5 h | M1 measured |
| 3 — Maturity + evidence | Agent-guided self-assessments; short calibration focused on security, oversight, data | Self-reported + validated maturity | Participants 15 min + 60 min | M3 measured |
| 4 — Deep-dives + agent reviews | 5 deep-dives (GenAI/agentic weighted); 2 agent reviews; advisor runs | Agent review records; tool matrices; draft policies (Observe) | Agent owners 4 h each | M4 drafts exist and validate against schema |
| 5 — Gap analysis, control mapping, runtime recs | Gap register; runtime recommendations; optional Observe-mode trial in non-production; CI validation demo | Runtime recommendations; rollout plan; gap register | Platform lead 4 h | Owners reviewed; rollout exit criteria agreed |
| 6 — Exec readout, feedback, proposal | Readout to sponsor + engineering leadership; survey; proposal | Executive report; survey; proposal | Sponsor 1 h | M5, M6 |

## 6. Roles

| AEGIS | Partner |
|---|---|
| Delivery lead | Executive sponsor (CTO/CISO/VP Engineering) |
| Shield lead (accountable for agent reviews and policies) | Platform/AI engineering lead |
| Governance analyst | Agent owners (business + technical) |
| Product lead | Security architect; privacy lead |
| Commercial lead | Governance/risk contact |

## 7. Success metrics

See [`success_metrics_scorecard.md`](success_metrics_scorecard.md). Same six core metrics as Pilot A (M1–M6) with
Pilot B supplementary signals S4 (Observe-mode decision review) and S5 (developer adoption).

## 8. Governance of the pilot

- Weekly status with platform lead and governance contact; scorecard updated weekly.
- Scope-change and stop rules as in Pilot A (§8 of `../pilot_a/pilot_plan.md`).
- **Runtime safety rule:** AEGIS never activates or changes partner runtime policy. Any Observe-mode trial runs in a
  non-production environment chosen and operated by the partner; moving beyond Observe requires the partner's named
  approver (IS-12, IS-13).
