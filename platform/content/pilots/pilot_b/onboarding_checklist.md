---
title: "Pilot B onboarding checklist"
pilot: B
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead with VERITRAIL Shield Lead
status: Not started
---

# Pilot B — onboarding checklist (LLM apps and agents)

Complete before or during Week 1. A pilot does not proceed to Week 2 until every **Gate** item is done.

## Commercial and legal

| # | Item | Owner | Gate | Done |
|---|---|---|---|---|
| 1 | Qualification scorecard ≥ threshold (`../pilot_status_tracker.md`) | VERITRAIL commercial lead | Gate | ☐ |
| 2 | Mutual NDA executed | VERITRAIL commercial lead | Gate | ☐ |
| 3 | Pilot agreement signed (scope, fee/no-fee, feedback, publication restriction) | VERITRAIL commercial lead | Gate | ☐ |
| 4 | DPA executed if any personal data could be processed | VERITRAIL privacy lead | Gate (if applicable) | ☐ |
| 5 | Security questionnaire / vendor onboarding complete | VERITRAIL security lead | Gate | ☐ |

## People

| # | Item | Owner | Gate | Done |
|---|---|---|---|---|
| 6 | Executive sponsor (CTO/CISO/VP Eng) named | Partner | Gate | ☐ |
| 7 | Platform/AI engineering lead with ~4 h/week | Partner | Gate | ☐ |
| 8 | Owners (business + technical) for the 2 agents to review | Partner | Gate | ☐ |
| 9 | Security architect and privacy lead named | Partner | | ☐ |
| 10 | Engineering teams for inventory workshops identified | Partner | | ☐ |

## Data access, safeguards and runtime safety

| # | Item | Owner | Gate | Done |
|---|---|---|---|---|
| 11 | `data_access_privacy_safeguards.md` §8 sign-off completed | Partner security + privacy | Gate | ☐ |
| 12 | Named users and roles provisioned (least privilege) | VERITRAIL delivery lead | Gate | ☐ |
| 13 | Agreement that VERITRAIL never activates partner runtime policy; Observe trial (if any) runs in partner-operated non-production | Partner platform lead | Gate | ☐ |
| 14 | Written authorization if any adversarial testing is in scope (non-production only) | Partner security lead | Gate (if applicable) | ☐ |
| 15 | Incident contact and notification timeframe | Both | Gate | ☐ |

## Materials (metadata only)

| # | Item | Owner | Done |
|---|---|---|---|
| 16 | List of LLM features, agents and internal AI tools | Platform lead | ☐ |
| 17 | Tool/API manifests for the 2 agents (operations, scopes) — no secrets | Agent technical owners | ☐ |
| 18 | Existing guardrail, gateway, rate-limit and logging configuration descriptions | Platform lead | ☐ |
| 19 | Existing adversarial test summaries (if any) | Security | ☐ |
| 20 | Kill-switch / incident runbooks for AI systems (if any) | SRE / security | ☐ |
| 21 | Model provider list and contract/DPA references | Procurement | ☐ |

## Baseline and scope

| # | Item | Owner | Gate | Done |
|---|---|---|---|---|
| 22 | Scope note: teams, target system count, 2 agents, deep-dive candidates | VERITRAIL delivery lead | Gate | ☐ |
| 23 | Success metrics M1–M6 and signals S4/S5/S9 agreed | VERITRAIL delivery lead | Gate | ☐ |
| 24 | Decide whether an Observe-mode trial will run (partner choice) | Partner platform lead | | ☐ |
| 25 | Dates booked for workshops, agent reviews and readout | Partner | Gate | ☐ |
