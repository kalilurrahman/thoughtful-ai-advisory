---
title: "AEGIS pilot status tracker & design-partner recruitment"
version: 1.0.0
as_of: 2026-10-21
owner: AEGIS Commercial Lead with AEGIS Delivery Lead
---

# Pilot status tracker

> **Honest status as of 21 October 2026: neither pilot has started. No design partner has been recruited or signed.**
> No pilot results, customer names, quotes or metrics exist. Update this table only from signed documents and
> measured scorecards.

| Pilot | Profile | Status | Design partner | Qualification score | Week | M1 | M2 | M3 | M4 | M5 | M6 | Next action | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **A** | Regulated enterprise, 20–100 AI systems | **Not started — awaiting design-partner recruitment** | — (none) | — | — | — | — | — | — | — | — | Build target list; start outreach sequence | Requires a real design partner |
| **B** | AI-forward SaaS / GCC / enterprise with LLM apps and agents | **Not started — awaiting design-partner recruitment** | — (none) | — | — | — | — | — | — | — | — | Build target list; start outreach sequence | Requires a real design partner |

**Status values (use only these):** Not started — awaiting design-partner recruitment · Recruiting (in outreach) ·
Qualified — contracting · Week 1–6 (in delivery) · Readout complete · Converted · Closed — not converted · Paused.

**Product readiness for pilots** (being built in sprint 1 by other workstreams; see `docs/BACKLOG.md`): website and
self-assessment, AEGIS Agent MVP, Runtime Shield Advisor and policy engine, report generation. Pilots can start once
the readiness exit criteria in `docs/ROADMAP.md` Phase 5 are met.

---

## 1. Recruitment criteria

### Must-have (both pilots)

| # | Criterion |
|---|---|
| C1 | Named executive sponsor with authority over AI governance or AI platform decisions |
| C2 | Named pilot lead able to commit ~4 hours/week for six weeks |
| C3 | Willing to sign NDA, pilot agreement and (if needed) DPA; accepts metadata-only default |
| C4 | Willing to give structured feedback (survey + sponsor interview) |
| C5 | Accepts publication restriction in both directions: no AEGIS publicity without written approval; no claims of AEGIS endorsement |
| C6 | No conflict of interest (e.g. direct competitor) |

### Pilot A specifics

| # | Criterion |
|---|---|
| A1 | Regulated sector or regulated customers (BFSI, healthcare & pharma, public sector, regulated GCC) |
| A2 | Estimated 20–100 AI systems (including vendor AI) |
| A3 | Trigger: audit finding, regulator/customer inquiry, board request, EU exposure, or new AI policy |
| A4 | Inventory immature or fragmented (self-assessment INV-Q1 ≤ 3 is a good signal) |

### Pilot B specifics

| # | Criterion |
|---|---|
| B1 | At least 2 LLM apps or agents in production or late pilot, with tool access |
| B2 | Platform/engineering team willing to review policy-as-code and (optionally) run Observe mode in non-production |
| B3 | Security or governance owner accountable for agent risk |
| B4 | Trigger: agent incident or near-miss, customer security questionnaires on AI, planned agent scale-up |

## 2. Qualification scorecard

Score each prospect 0–3 per criterion (0 = absent, 1 = weak, 2 = adequate, 3 = strong). Machine-readable version:
[`design_partner_qualification_scorecard.csv`](design_partner_qualification_scorecard.csv).

| # | Criterion | Weight | Evidence to collect | Self-assessment signal |
|---|---|---|---|---|
| Q1 | Executive sponsorship | 3 | Sponsor named and attended discovery | — |
| Q2 | Pain and urgency (trigger event) | 3 | Described trigger with date | Overall < 60 (`baseline_priority` tag) |
| Q3 | Scale fit (A: 20–100 systems; B: ≥ 2 agents) | 2 | Inventory estimate; agent list | `ai_systems` profile; `uses_agents` (`shield_candidate`) |
| Q4 | Team availability | 2 | Named pilot lead + time commitment | — |
| Q5 | Data-access feasibility | 2 | Security/privacy contact engaged; metadata-only accepted | — |
| Q6 | Budget path after pilot | 2 | Budget holder identified; procurement route known | — |
| Q7 | Learning value for AEGIS (sector/use-case diversity) | 1 | Sector; agent types | `industry` profile (`compliance_led` tag) |
| Q8 | Reference potential (private reference, case study subject to approval) | 1 | Stated willingness | — |

**Score** = Σ(score × weight); maximum 48. **Thresholds:** ≥ 32 qualify; 24–31 nurture (offer Governance Baseline or
self-assessment follow-up); < 24 decline politely. Q1 = 0 or Q5 = 0 disqualifies regardless of score.

## 3. Outreach sequence

All outreach is from named AEGIS staff, to business addresses, respecting opt-outs and applicable marketing and
privacy rules. Messages never claim existing customers, results or endorsements — AEGIS has none yet.

| Step | Channel | Content | Goal |
|---|---|---|---|
| 0 | Research | Build target list from ICP (`docs/GTM_PLAN.md`); prioritize warm introductions and self-assessment leads tagged `baseline_priority`, `platform_candidate`, `shield_candidate` | 20–30 targets per pilot |
| 1 | Warm intro or personal email | Design-partner invitation: problem, what the partner gets (inventory, maturity baseline, gap register, exec report, draft guardrails at no or reduced fee), what we ask (time, feedback), safeguards summary | Discovery call |
| 2 | Follow-up (+3–5 business days) | Share the self-assessment link and a synthetic sample report from `output/sample_reports/` (clearly labelled synthetic) | Engagement signal |
| 3 | Value add (+5–7 business days) | Short note on one relevant control area (e.g. agent tool permissions IS-11/IS-13, or inventory EI-01) with the industry pack's discovery questions | Discovery call |
| 4 | Final touch (+7–10 business days) | Brief close-the-loop message; offer to reconnect later | Close or nurture |
| 5 | Discovery call (30–45 min) | Pain, triggers, scale, sponsor, data-access constraints; industry-pack discovery questions | Score Q1–Q8 |
| 6 | Pilot proposal | Tailored pilot plan (A or B), scorecard, safeguards, agreement | Signature |

## 4. Recruitment funnel tracker

| Stage | Pilot A | Pilot B |
|---|---|---|
| Targets identified | 0 | 0 |
| Contacted | 0 | 0 |
| Discovery calls held | 0 | 0 |
| Qualified (score ≥ 32) | 0 | 0 |
| Pilot agreement signed | 0 | 0 |

## 5. Change log

| Date | Change | By |
|---|---|---|
| 2026-10-21 | Tracker created; both pilots Not started — awaiting design-partner recruitment | AEGIS content lead |
