---
title: "Pilot A plan — Regulated enterprise (20–100 AI systems)"
pilot: A
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
status: Not started — awaiting design-partner recruitment
---

# Pilot A — Regulated enterprise

> **Status: Not started — awaiting design-partner recruitment.** No design partner has been signed. This plan is the
> template that will be tailored to the first qualified partner (see `../pilot_status_tracker.md`).

## 1. Design-partner profile

Regulated enterprise (e.g. BFSI, healthcare & pharma, public sector, or a regulated GCC) with **20–100 AI systems**,
an emerging AI governance function, and audit, regulatory or customer pressure to evidence AI controls.

## 2. Hypotheses this pilot tests

| ID | Hypothesis | Measured by |
|---|---|---|
| HA-1 | Structured workshops plus the intake template can register ≥ 25 AI systems in two weeks | M1 |
| HA-2 | Tier-proportionate deep-dives make 100% coverage of High-tier systems feasible | M2 |
| HA-3 | Governance teams will complete assessments through the VERITRAIL Agent rather than spreadsheets | M3 |
| HA-4 | The control library and evidence labels produce an executive report leadership accepts | M5 |
| HA-5 | Inventory, maturity and evidence pain converts to a paid Register/Control/Assurance engagement | M6, survey G1–G3 |
| HA-6 | ROI hypotheses (assessment effort, evidence-prep effort, approval cycle) hold directionally | Baseline vs. pilot time measurements (S1–S3) |

## 3. Focus areas

1. **Inventory** — AI system of record across business units, including vendor and shadow AI (EI-01, EI-03, EI-08, EI-09).
2. **Maturity** — self-reported vs. validated maturity with an evidence index (SE-02).
3. **Compliance evidence** — evidence packs and framework readiness indicators for the riskiest systems (SE-05, GL-06),
   explicitly framed as readiness, not compliance.
4. **Workflow** — intake triage, tier-proportionate assessment and approval gates (EI-12, GL-01, GL-02, GL-03).

## 4. Scope

| In scope | Out of scope |
|---|---|
| Up to 3 business units or the whole enterprise if ≤ 100 systems | Production data ingestion; any external LLM processing of partner data |
| Inventory of ≥ 25 systems (target), metadata only | Penetration testing; legal opinions on applicability |
| Maturity self-assessment (4–8 participants) + calibration | Integration build beyond CSV/API import of inventory |
| 5 system deep-dives; up to 2 agent reviews (if agents exist) | Remediation delivery (proposed as follow-on) |
| Gap register, remediation roadmap, executive readiness report | Statements of compliance or certification |

Scope changes go through the change rule in §8 (risk R-05, pilot scope creep).

## 5. Six-week plan

| Week | Activities | Deliverables | Partner effort (indicative) | Exit criteria |
|---|---|---|---|---|
| 1 — Kick-off, scope, data access | Kick-off with sponsor; confirm scope and success metrics; sign safeguards; collect existing inventories and policies (metadata); baseline time measurements S1–S3 | Signed safeguards; scope note; stakeholder map; baseline measurements | Sponsor 1 h; pilot lead 4 h; security/privacy 2 h | Safeguards signed; workshop dates booked |
| 2 — Inventory workshops | 2–4 BU workshops + vendor session; preliminary tiering (Inferred); owner confirmation | Register with ≥ 25 confirmed records; tier previews | Each BU 1.5 h workshop + 1 h follow-up | M1 measured; High-tier list confirmed by risk lead |
| 3 — Maturity + evidence | Individual self-assessments (Agent-guided); calibration session; evidence sampling | Self-reported + validated maturity; evidence index | Participants 15 min + 90 min; owners 2 h evidence | M3 measured; evidence index ≥ 1 item per domain |
| 4 — Deep-dives + agent reviews | 5 system deep-dives; up to 2 agent reviews | Deep-dive records; confirmed tiers; agent review records | Each system owner 3 h | M2 progress; draft policies (if agents) |
| 5 — Gap analysis, control mapping, runtime recs | Consolidate gap register; map to controls and framework mappings; runtime recommendations | Gap register; remediation roadmap; runtime recommendations | Pilot lead 3 h review | Owners reviewed gaps; Critical gaps owned |
| 6 — Executive readout, feedback, proposal | Readout to sponsor and forum; survey; follow-on proposal | Executive readiness report; survey results; proposal | Sponsor 1 h; participants 12 min survey | M5 accepted/declined recorded; M6 |

A 4-week compressed variant merges Weeks 2–3 and 4–5 for partners with an existing inventory; success metrics are
unchanged.

## 6. Roles

| VERITRAIL | Partner |
|---|---|
| Delivery lead (accountable for pilot plan and scorecard) | Executive sponsor (CRO/CIO/CAIO) |
| Governance analyst ×1–2 (workshops, assessments, gap register) | Pilot lead (AI governance / risk) |
| Shield lead (agent reviews, part-time) | BU AI owners and technical owners |
| Product lead (feedback, backlog) | Risk, legal/privacy, security representatives |
| Commercial lead (Week 1 and Week 6) | Procurement / vendor risk (vendor session) |

## 7. Success metrics

See [`success_metrics_scorecard.md`](success_metrics_scorecard.md): M1 ≥ 25 AI systems registered; M2 100% of
High-tier systems assessed; M3 ≥ 70% agent-assisted assessment completion; M4 ≥ 2 runtime policies drafted (where the
partner has fewer than two agents or LLM apps, record "not applicable" and explain); M5 executive report accepted; M6
follow-on commercial discussion initiated.

## 8. Governance of the pilot

- Weekly 30-minute status with the pilot lead; scorecard updated weekly.
- **Scope-change rule:** any addition (systems beyond agreed BUs, extra deep-dives, integrations) is logged and either
  swapped for an existing item or deferred to the follow-on proposal. The sponsor approves any swap.
- **Stop rule:** the pilot pauses if safeguards are breached or if partner availability falls below the effort in §5
  for two consecutive weeks.

## 9. Tailoring by sector

Use the matching industry pack (`content/industry_packs/*.yaml`) for priority use cases, emphasized controls, extra
evidence and discovery questions.
