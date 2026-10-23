---
title: "Deep-dive assessment plan — 5 priority systems"
applies_to: [Pilot A, Pilot B, Governance Baseline]
week: 4
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
source: content/assessment_templates/use_case_assessment.yaml (use-case question bank, agent workstream)
---

# Deep-dive assessment plan — 5 priority systems

**Goal:** complete a documented, tier-proportionate risk and impact assessment (GL-02) for five priority systems, with
evidence labelled per finding, and confirm each system's risk tier through a named human approver (EI-02). Feeds pilot
metric M2 (100% of High-tier systems in scope assessed).

## 1. Selecting the five systems

Score each candidate from the Week 2 inventory and pick the top five, ensuring at least one agentic or GenAI system
where present.

| Criterion | Points |
|---|---|
| Preliminary tier High or Prohibited-review | 5 |
| Preliminary tier Medium | 2 |
| Customer- or public-facing | 2 |
| Personal or special-category data | 2 |
| Acts with approval or autonomously / has tools | 2 |
| Strategic importance to sponsor | 1–3 |
| Owner available in Week 4 | required |

**M2 rule:** every system whose *confirmed* tier is High within the pilot scope must be among the deep-dives or
assessed separately. If more than five High-tier systems exist, agree with the sponsor in Week 2 whether to (a) assess
all High-tier systems with a lighter-touch format, or (b) narrow the pilot scope to a business unit so that M2 remains
achievable. Record the decision.

## 2. Per-system assessment (≈ 2 × 90-minute sessions + evidence review)

| Session | Content | Controls |
|---|---|---|
| 1a. Context | Intended purpose, users, affected parties, foreseeable misuse, decision impact, autonomy | EI-04, EI-02, AO-10 |
| 1b. Data | Sources, lineage, sensitivity, privacy assessment, redaction | EI-06, IS-02, IS-03, IS-04 |
| 1c. Model & components | Model/provider, versions, prompts, change triggers, supply chain | EI-05, GL-04, IS-10 |
| 2a. Testing & performance | Validation, accuracy/robustness, bias, safety, adversarial testing | GL-05, IS-05, IS-06, IS-07, IS-14 |
| 2b. Oversight & runtime | Human oversight, approval points, runtime policy, limits, kill switch, monitoring | IS-09, IS-12, IS-13, IS-15, GL-08, SE-12 |
| 2c. Evidence & lifecycle | Approval record, documentation, logging, incident path, review cadence | GL-03, GL-06, SE-08, SE-04, GL-12 |

The VERITRAIL Agent may pre-populate answers from inventory metadata and uploaded (redacted) documents; every
pre-populated answer is labelled **Inferred** until the owner confirms it (then **User-asserted**) and a reviewer
examines evidence (then **Verified**).

## 3. Outputs per system

| Output | Notes |
|---|---|
| System profile | Purpose, owners, tier factors, preliminary tier with factor-by-factor rationale (Inferred) |
| Confirmed tier | Approver role, date, rationale — tier changes require human approval |
| Findings | Each finding: control ID(s), evidence label, severity (Critical/High/Medium/Low), framework mapping from the control's `mappings` |
| Gap register entries | `gap_register_template.csv` rows with SLA by severity (Critical 30 / High 60 / Medium 90 / Low 180 days) |
| Residual-risk statement | Draft for owner and risk lead; acceptance requires GL-10 exception process |
| Runtime recommendations | For GenAI/agentic systems, inputs to `runtime_shield_recommendations_template.md` |

## 4. Quality checks before sign-off

- Every finding cites at least one VERITRAIL control ID; no invented controls or clauses.
- Every finding carries exactly one evidence label.
- No statement that the system meets, conforms to or complies with any law or standard.
- Owner has reviewed the draft; disagreements are recorded, not silently resolved.
