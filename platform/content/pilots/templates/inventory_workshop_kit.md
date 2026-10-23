---
title: "AI inventory workshop kit"
applies_to: [Pilot A, Pilot B, Governance Baseline]
week: 2
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
related_controls: [EI-01, EI-02, EI-03, EI-04, EI-05, EI-06, EI-07, EI-08, EI-09, EI-10, EI-12]
---

# AI inventory workshop kit

**Goal:** register at least 25 AI systems (pilot success metric M1) with owners, purpose and tier factors, and surface
shadow and vendor AI. Output feeds the VERITRAIL Register (EI-01) and the risk-tier engine (EI-02).

**Format:** 2–4 workshops of 90 minutes, one per business unit or platform group, plus one 60-minute vendor/procurement
session. Pre-work: partner sends existing inventories, procurement lists of AI vendors, and API-key/provider lists
(metadata only — see `data_access_privacy_safeguards.md`).

**Intake template:** [`ai_inventory_intake_template.csv`](ai_inventory_intake_template.csv). Field names match the
VERITRAIL risk-tier engine (`veritrail_assessment.risk_tier.INTAKE_FIELDS`) so records can be tiered directly.

## 1. Attendees

| Role | Why |
|---|---|
| Business-unit AI owners / product owners | Purpose, users, decision impact (EI-03, EI-04) |
| Technical owners / ML or platform engineers | Models, prompts, tools, data sources (EI-05, EI-06, EI-07) |
| Procurement / vendor risk (vendor session) | Vendor and embedded AI (EI-08) |
| Security / IT asset management (optional) | Shadow-AI signals (EI-09) |
| Partner pilot lead | Decisions on scope and follow-ups |
| VERITRAIL facilitator + scribe | Run the session, capture records live |

## 2. Agenda (90 minutes)

| Time | Segment | Output |
|---|---|---|
| 0–10 | Purpose, definitions ("what counts as an AI system": ML models, GenAI apps, agents, vendor AI features), privacy ground rules | Shared definition |
| 10–25 | Known systems walk-through from pre-work list | Draft records confirmed or corrected |
| 25–50 | Discovery prompts (§4) to surface unlisted, vendor and shadow AI | New records |
| 50–75 | Record completion: owner, purpose, decision impact, affected parties, data sensitivity, autonomy, tools, vendor | Records ≥ 80% complete |
| 75–85 | Preliminary tier preview (Inferred, needs human confirmation) for 2–3 systems to show value | Tier previews |
| 85–90 | Gaps, follow-ups, owners and dates | Follow-up list |

## 3. Facilitator script

**Opening (read or paraphrase).**
"Thank you for your time. Today we're building a list of every AI system your team uses or runs — including vendor
tools with AI features and agents. This is not an audit and nothing here is a finding about anyone. We capture
metadata only: names, purposes, owners and how the system works. Please don't share personal data, customer data or
credentials. Every risk tier we show today is a preliminary, inferred tier that a named person on your side must
confirm."

**Definitions.** "For this workshop, an AI system is anything that uses a machine-learning model or a generative model
to produce predictions, recommendations, content or actions — built in-house, bought, or switched on inside a SaaS
product. Agents are AI systems that can call tools or take actions."

**Walk-through (per known system).** Ask, in order:
1. "What does it do, in one sentence, and who uses it?" → `purpose`, `users_count_band`
2. "Who is accountable for it on the business side, and who on the technical side?" → `business_owner_role`,
   `technical_owner_role` (roles, not names, unless the partner agrees)
3. "Does its output inform or make decisions about people? Advisory, material, or automated?" → `decision_impact`
4. "Who is affected — internal staff, customers, the public, vulnerable groups?" → `affected_parties`
5. "What is the most sensitive data it touches?" → `data_sensitivity`
6. "Does it suggest, act with approval, or act on its own? Which tools or APIs can it call? Can it act outside the
   organization?" → `autonomy`, `tools`, `external_actions`
7. "Which model or vendor powers it? Is it generative?" → `vendor_model`, `vendor_name`, `model_provider`, `genai`
8. "Is it live? Since when? Has it been assessed?" → `lifecycle_stage`, `environment`, `last_assessment_date`
9. "Does it affect people in the EU, or is it offered on the EU market?" → `eu_exposure`

**If the group stalls:** use the discovery prompts in §4; move incomplete records to follow-ups rather than guessing.

**Closing.** "We'll send you the draft records within two working days. Owners confirm or correct them by [date].
Preliminary tiers stay labelled *Inferred* until an owner and the risk lead confirm them."

## 4. Discovery prompts (shadow and vendor AI)

- "Which SaaS tools you use have added AI features this year? Are they switched on?" (EI-08, EI-09)
- "Do any teams pay for AI tools on corporate cards or expense them?" (EI-09)
- "Which teams hold API keys for model providers?" (EI-09, IS-10)
- "Are there scripts, spreadsheets or bots that call a model?" (EI-01)
- "Which agents or automations can send emails, update records or trigger payments?" (EI-07, IS-13)
- "Are there pilots or proofs of concept that quietly became production?" (EI-12, GL-02)
- Industry-pack discovery questions for the partner's sector (`content/industry_packs/<sector>.yaml`).

## 5. After the workshop

| Step | Owner | When |
|---|---|---|
| Clean records, de-duplicate, mark incomplete fields | VERITRAIL scribe | +1 working day |
| Run preliminary risk tiering (Inferred) | VERITRAIL analyst | +2 working days |
| Send records to owners for confirmation | Partner pilot lead | +2 working days |
| Owners confirm records; risk lead confirms tiers (human approval) | Partner | by end of Week 2 |
| Report M1 (systems registered) and record completeness | VERITRAIL delivery lead | end of Week 2 |

**Record completeness definition:** a record counts toward M1 when `name`, `purpose`, `business_owner_role`,
`decision_impact`, `affected_parties`, `data_sensitivity`, `autonomy` and `lifecycle_stage` are populated and the
owner has confirmed it.
