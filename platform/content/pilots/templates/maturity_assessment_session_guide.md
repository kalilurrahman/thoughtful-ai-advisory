---
title: "Maturity assessment session guide"
applies_to: [Pilot A, Pilot B, Governance Baseline]
week: 3
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
source: content/assessment_templates/maturity_self_assessment.yaml (VERITRAIL-SA-MATURITY v1.0.0)
---

# Maturity assessment session guide

**Goal:** produce two scores side by side — the **self-reported** maturity score (User-asserted) and a **validated**
score adjusted for evidence reviewed — plus the evidence index that supports the validated view. Feeds pilot metric M3
(agent-assisted completion) and the executive readiness report.

## 1. Format

| Step | Duration | Participants |
|---|---|---|
| A. Pre-read and individual self-assessment (web tool or VERITRAIL Agent guided assessment) | ~8–15 min each | 4–8 partner stakeholders across business, technology, risk, legal/privacy, security |
| B. Facilitated calibration session | 90 min | Same group + VERITRAIL facilitator |
| C. Evidence sampling | Rolling, Week 3 | Partner owners + VERITRAIL analyst |
| D. Validated score and readout to pilot lead | 30 min | Partner pilot lead, VERITRAIL delivery lead |

**Agent-assisted completion (M3):** invite each participant to complete step A through the VERITRAIL Agent guided assessment
journey. Record per participant whether they started and completed it through the Agent and the elapsed time (logged
in the pilot workspace audit log).

## 2. Calibration session agenda (90 minutes)

| Time | Segment |
|---|---|
| 0–10 | How scoring works: 1–5 scale, 8 weighted domains, levels Initial → Optimized; everything is User-asserted until evidence is reviewed |
| 10–20 | Show the distribution of individual answers per question (anonymised); identify questions with a spread ≥ 2 points |
| 20–70 | Discuss divergent questions, highest-weight domains first (inventory, risk & lifecycle, security — 14 each). For each: "What would we show an auditor?" Agree a consensus answer and an evidence request |
| 70–85 | Review fired critical flags (e.g. FLAG-NO-INVENTORY, FLAG-AGENTS-UNTESTED) and agree owners |
| 85–90 | Confirm evidence requests, owners and due dates |

## 3. Facilitator prompts per domain

| Domain | Prompt | Evidence to request | Controls |
|---|---|---|---|
| Strategy & Accountability | "Show me the approved policy and the last decision your forum made to restrict or stop a use case." | Policy with approval record; forum minutes | AO-01, AO-02, AO-03, AO-06 |
| AI Inventory & Visibility | "How do you know the inventory is complete? When was it last reconciled?" | Inventory export with counts and timestamps; discovery records | EI-01, EI-02, EI-03, EI-09 |
| Risk Management & Lifecycle | "Pick a system that went live last quarter: where is its assessment and approval?" | Completed assessment, approval with conditions, change tickets | GL-01, GL-02, GL-03, GL-04 |
| Data & Privacy | "Where would a customer's personal data appear in prompts or logs, and what masks it?" | PIA; redaction config and tests | EI-06, IS-03, IS-04 |
| Security & Resilience | "When did you last test an LLM app or agent for prompt injection? How fast can you switch it off?" | Red-team results; kill-switch test record | IS-01, IS-11, IS-14, IS-15 |
| Fairness, Safety & Transparency | "For a high-impact system, show bias testing and the disclosure users see." | Fairness test results; disclosure text | IS-05, IS-06, IS-08 |
| Human Oversight & Operations | "Who can override the system, and where is that recorded? What alerts exist?" | Oversight design; monitoring thresholds; training records | IS-09, IS-13, GL-08, AO-05 |
| Assurance, Evidence & Improvement | "If an auditor asked tomorrow for an evidence pack on your riskiest system, how long would it take?" | Sample evidence pack; control test results; KPI pack | SE-01, SE-02, SE-05, SE-08 |

## 4. Validation rules

1. Consensus answers remain **User-asserted** until a named reviewer examines evidence.
2. An evidence item reviewed by a named reviewer is recorded as **Verified** in the evidence index (ID, reviewer, date).
3. If a consensus answer of 4 or 5 is not supported by evidence for a sample of systems, record **Missing evidence** and
   lower the validated answer to the highest level the evidence supports.
4. A critical flag remains a **Critical gap** until remediation evidence is Verified.
5. Report both scores; never replace the self-reported score. Neither score is a compliance determination.

## 5. Outputs

- Self-reported result (engine output: overall score, level, domain scores, strengths, gaps, flags, 30/60/90 plan).
- Validated domain scores with rationale per adjusted question.
- Evidence index (template columns: evidence_id, description, question_id, control_ids, owner_role, location,
  reviewer, review_date, evidence_status).
- Inputs to the gap register (`gap_register_template.csv`).
