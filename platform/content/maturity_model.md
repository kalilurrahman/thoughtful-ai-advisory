---
title: "VERITRAIL AI Governance Maturity Model"
version: 1.0.0
status: published
effective_date: 2026-10-21
owner: VERITRAIL Governance Content Lead
review_cadence: quarterly
source: content/assessment_templates/maturity_self_assessment.yaml (VERITRAIL-SA-MATURITY v1.0.0)
---

# VERITRAIL AI Governance Maturity Model

> All self-assessment results are **User-asserted**: answers are self-reported and no evidence has been reviewed.
> Results are readiness indicators only. VERITRAIL supports governance readiness, control implementation and evidence
> collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice.
> Framework mappings are indicative.

## 1. Purpose and authority

This document explains the VERITRAIL maturity model in prose: what each level means in each domain, how scores are
calculated, and what evidence a validator would expect at each level. **The scoring rules themselves live only in
`content/assessment_templates/maturity_self_assessment.yaml`** and are implemented identically by the Python engine
(`app/assessment-engine`) and the browser engine (`app/website`), with parity enforced by an engine-parity
test in `tests/integration/` (DEC-0002). If anything here conflicts with the YAML, the YAML wins.

## 2. Answer scale

Each of the 24 questions is answered on a 1–5 scale:

| Score | Label | Meaning |
|---|---|---|
| 1 | Not started | No practice exists. |
| 2 | Initial / ad hoc | Practice exists informally or in pockets; not documented or repeatable. |
| 3 | Defined for some systems | Documented practice applied to some systems or business units. |
| 4 | Consistently implemented | Practice applied consistently across material AI systems with records. |
| 5 | Measured, automated, and continuously improved | Practice is measured, largely automated and improved from metrics. |

## 3. Domains and weights

| # | Domain | ID | Weight | Questions |
|---|---|---|---|---|
| 1 | Strategy & Accountability | `strategy` | 12 | STR-Q1, STR-Q2, STR-Q3 |
| 2 | AI Inventory & Visibility | `inventory` | 14 | INV-Q1, INV-Q2, INV-Q3 |
| 3 | Risk Management & Lifecycle | `risk_lifecycle` | 14 | RSK-Q1, RSK-Q2, RSK-Q3 |
| 4 | Data & Privacy | `data_privacy` | 12 | DAT-Q1, DAT-Q2, DAT-Q3 |
| 5 | Security & Resilience | `security` | 14 | SEC-Q1, SEC-Q2, SEC-Q3 |
| 6 | Fairness, Safety & Transparency | `fairness_transparency` | 12 | FST-Q1, FST-Q2, FST-Q3 |
| 7 | Human Oversight & Operations | `oversight_operations` | 12 | HUM-Q1, HUM-Q2, HUM-Q3 |
| 8 | Assurance, Evidence & Improvement | `assurance` | 10 | ASR-Q1, ASR-Q2, ASR-Q3 |
| | **Total** | | **100** | 24 |

Inventory, risk lifecycle and security carry the highest weights because they are prerequisites for everything
else: you cannot assess, gate or protect AI you have not inventoried.

## 4. Scoring formula

Let `a_q` be the answer (1–5) to question `q`, `n_d` the number of questions in domain `d` (3 in v1.0.0) and `w_d`
the domain weight (integer percent).

```
domain_score_d = round_half_up_1dp( Σ_{q∈d} a_q × 100 / (5 × n_d) )

overall_score  = round_half_up_1dp( Σ_d ( Σ_{q∈d} a_q × w_d / (5 × n_d) ) )
                 — computed from UNROUNDED domain values

round_half_up_1dp(num/den) = floor((20 × num + den) / (2 × den)) / 10     (exact integer arithmetic)

maturity_level = the level whose [min, max] range contains overall_score
```

Because the lowest answer is 1, the minimum achievable overall score is **20.0** and the maximum is **100.0**.

### 4.1 Maturity levels

| Level | Score range | Interpretation (from the template) |
|---|---|---|
| **Initial** | 0 – 39.9 | AI governance is ad hoc; immediate foundational work required. |
| **Developing** | 40 – 59.9 | Basic practices exist but are inconsistent and hard to evidence. |
| **Defined** | 60 – 74.9 | Core governance is established; expand coverage and automation. |
| **Managed** | 75 – 89.9 | Controls are monitored and integrated into operations. |
| **Optimized** | 90 – 100 | Governance is adaptive, automated and continuously assured. |

### 4.2 Derived outputs

| Output | Rule (from the template) |
|---|---|
| Strengths | Questions scoring ≥ 4; top 5 sorted by score desc, domain weight desc, question order asc |
| Gaps | Questions scoring ≤ 3; top 5 sorted by score asc, domain weight desc, question order asc |
| 30/60/90-day action plan | Score 1–2 → 30 days (stabilise); 3 → 60 days (standardise); 4 → 90 days (scale and automate); up to 5 per horizon |
| Critical flags | Nine rules (e.g. FLAG-NO-INVENTORY when INV-Q1 ≤ 2; FLAG-AGENTS-UNTESTED when SEC-Q2 ≤ 2 and the respondent uses agents) — each labelled **Critical gap** and citing controls |
| Recommended controls | Up to 10: controls from fired flags, then from gaps, de-duplicated |
| Framework readiness indicators | Average of mapped questions as a percentage, banded Limited (<50) / Partial (50–74.9) / Substantial (≥75) for NIST AI RMF functions, ISO/IEC 42001 clause groups and EU AI Act article groups — indicative only |
| Recommended modules | Rules over domain scores, flags and profile (e.g. Shield when the respondent uses agents) |

### 4.3 Worked example (synthetic)

A fictional respondent that uses agents answers as follows (synthetic data, not a customer):

| Domain | Answers | Sum | Domain score | Weighted contribution (unrounded) |
|---|---|---|---|---|
| Strategy (12) | 3, 2, 3 | 8 | 53.3 | 8 × 12 / 15 = 6.4 |
| Inventory (14) | 2, 2, 3 | 7 | 46.7 | 7 × 14 / 15 = 6.5333… |
| Risk & lifecycle (14) | 3, 2, 2 | 7 | 46.7 | 6.5333… |
| Data & privacy (12) | 3, 4, 2 | 9 | 60.0 | 7.2 |
| Security (14) | 3, 2, 3 | 8 | 53.3 | 7.4666… |
| Fairness & transparency (12) | 2, 3, 2 | 7 | 46.7 | 5.6 |
| Oversight & operations (12) | 3, 3, 2 | 8 | 53.3 | 6.4 |
| Assurance (10) | 2, 2, 3 | 7 | 46.7 | 4.6666… |
| **Overall** | | | | **254/5 = 50.8 → Developing** |

Critical flags fired: FLAG-NO-INVENTORY (INV-Q1 = 2), FLAG-SENSITIVE-DATA-EXPOSURE (DAT-Q3 = 2),
FLAG-AGENTS-UNTESTED (SEC-Q2 = 2 with agents in use), FLAG-NO-EVIDENCE (ASR-Q2 = 2). Recommended controls would
start with EI-01, EI-09, IS-04, IS-03, IS-14, IS-11, IS-12, SE-05, SE-08. All findings are **User-asserted**; the
four flags are **Critical gap**.

## 5. Levels × domains descriptor grid

Use these descriptors in validation interviews to test whether a self-reported level is plausible. They describe
typical observable states; they do not change the score.

### 5.1 Strategy & Accountability (AO-01, AO-02, AO-03, AO-06)

| Level | Descriptor |
|---|---|
| Initial | No AI policy or accountable executive; AI decisions are made project by project. |
| Developing | Draft policy or principles exist; an informal working group discusses AI; roles unclear outside the core team. |
| Defined | Approved policy (AO-01); chartered forum with approve/restrict/stop authority (AO-02); published RACI and escalation matrix (AO-03, AO-06). |
| Managed | Forum decisions recorded and traceable to inventory records; risk appetite (AO-04) used in tiering; obligations register (AO-07) maintained by counsel. |
| Optimized | Policy and appetite reviewed on cadence using KPIs (SE-03); governance resourcing (AO-12) planned against AI portfolio growth; management review (SE-07) drives change. |

### 5.2 AI Inventory & Visibility (EI-01, EI-02, EI-03, EI-04, EI-06, EI-08, EI-09, EI-10)

| Level | Descriptor |
|---|---|
| Initial | No inventory or scattered spreadsheets; vendor AI and agents unknown. |
| Developing | Partial inventory for some business units; owners missing for many records; no consistent tiering. |
| Defined | Single system of record (EI-01) for most systems; approved tier criteria applied (EI-02); owners named (EI-03). |
| Managed | Purpose, data sources and dependencies complete for material systems (EI-04, EI-06, EI-10); vendor AI inventoried (EI-08); owner attestation on cadence (EI-11). |
| Optimized | Shadow-AI discovery reconciled automatically (EI-09); registry changes trigger reassessment; coverage measured and reported. |

### 5.3 Risk Management & Lifecycle (GL-01, GL-02, GL-03, GL-04, GL-09, GL-10, EI-05)

| Level | Descriptor |
|---|---|
| Initial | AI reaches production without risk assessment; no AI-specific change triggers. |
| Developing | Assessments happen for some projects, often after build; approvals informal. |
| Defined | Mandatory tier-proportionate assessment gate (GL-02) and approval matrix (GL-03); exception register (GL-10). |
| Managed | Model, prompt, data, vendor, tool and agent changes route to reassessment (GL-04, EI-05); retirement procedure used (GL-09); exception expiry enforced. |
| Optimized | Gates embedded in delivery pipelines; cycle-time and bypass metrics reviewed; triage (GL-01) tuned from outcome data. |

### 5.4 Data & Privacy (EI-06, IS-02, IS-03, IS-04)

| Level | Descriptor |
|---|---|
| Initial | Data sources for AI undocumented; sensitive data may reach prompts, logs and external models. |
| Developing | Privacy reviews happen for some systems; redaction absent or manual. |
| Defined | Data sources and flows documented for material systems (EI-06); privacy impact assessment embedded in intake (IS-03); data quality checks (IS-02). |
| Managed | Redaction/masking deployed for prompts, responses, logs and external calls on sensitive systems (IS-04) with test evidence. |
| Optimized | Redaction coverage and effectiveness measured; retention and transfer controls automated; data-quality thresholds monitored. |

### 5.5 Security & Resilience (IS-01, IS-10, IS-11, IS-12, IS-14, IS-15)

| Level | Descriptor |
|---|---|
| Initial | AI outside security review; agents hold broad credentials; no ability to stop an AI system quickly. |
| Developing | Some AI systems threat-modelled; ad hoc red-teaming; manual shutdown procedures. |
| Defined | Threat modelling for material systems (IS-01); approved model/provider list (IS-10); adversarial testing before release (IS-14); kill-switch procedure documented (IS-15). |
| Managed | Least-privilege tool matrices for agents (IS-11); versioned runtime policy in Protect/Enforce mode (IS-12); kill switch tested with measured time-to-disable. |
| Optimized | Runtime decision logs feed monitoring and detection; re-testing triggered by material change; containment exercised regularly. |

### 5.6 Fairness, Safety & Transparency (IS-05, IS-06, IS-08, IS-09, AO-11)

| Level | Descriptor |
|---|---|
| Initial | No bias, safety or harm evaluation; users not told when AI is involved. |
| Developing | Evaluation for a few flagship systems; disclosure inconsistent. |
| Defined | Bias, safety and harm evaluation for high-impact systems with thresholds (IS-05, IS-06); standard AI disclosures (IS-08). |
| Managed | Explanations and appeal routes for affected individuals (IS-08, IS-09); stakeholder feedback collected and acted on (AO-11). |
| Optimized | Fairness and harm metrics monitored in production; feedback loops change systems and policies. |

### 5.7 Human Oversight & Operations (IS-09, IS-13, GL-08, SE-12, SE-04, AO-05)

| Level | Descriptor |
|---|---|
| Initial | High-impact AI decisions lack defined review, override or appeal; no production monitoring. |
| Developing | Oversight relies on individual diligence; monitoring limited to uptime. |
| Defined | Human review, override and approval points defined (IS-09, IS-13); monitoring with thresholds (GL-08); operator training (AO-05). |
| Managed | Drift and misuse monitored (SE-12); AI incidents handled through a defined procedure (SE-04); approvals recorded with approver identity. |
| Optimized | Oversight effectiveness measured (override rates, approval latency); training effectiveness tracked; monitoring automated with escalation. |

### 5.8 Assurance, Evidence & Improvement (SE-01, SE-02, SE-03, SE-05, SE-06, SE-07, SE-08, GL-06)

| Level | Descriptor |
|---|---|
| Initial | Evidence scattered; an audit-ready pack cannot be produced. |
| Developing | Evidence assembled manually on request; control testing ad hoc. |
| Defined | Evidence repository with retention (SE-02); periodic control testing (SE-01); technical documentation for material systems (GL-06). |
| Managed | Tamper-evident logs (SE-08); evidence packs on request (SE-05); KPIs to leadership (SE-03); corrective actions tracked (SE-06). |
| Optimized | Evidence generated as a by-product of operation; management review (SE-07) and independent review (SE-10) drive improvement. |

## 6. Evidence expectations per level

A self-assessment produces **User-asserted** results. In a Governance Baseline or pilot, validators test the
self-reported level against evidence. Typical expectations:

| Level | Evidence a validator expects to see | Typical evidence label outcome |
|---|---|---|
| Initial | None expected; interview confirms absence | Missing evidence / Critical gap |
| Developing | Drafts, emails, isolated examples for one or two systems | User-asserted or Inferred; some Missing evidence |
| Defined | Approved documents (policy, RACI, approval matrix, assessment templates) and records for a sample of systems | Verified for documents; sample records Verified or Missing evidence |
| Managed | Records across all material systems: inventory export with owners and tiers, approval records, change tickets with reassessment, monitoring dashboards, runtime policy decision logs | Verified on sample testing |
| Optimized | Metrics over time, automated evidence, management review minutes, independent review reports, corrective actions closed | Verified, with trend data |

**Validation rules used in VERITRAIL engagements**

1. A finding is **Verified** only when a named reviewer has examined the evidence item; record evidence ID,
   reviewer and date.
2. If a respondent self-reports 4 or 5 and cannot produce records for a sample of systems, record the finding as
   **Missing evidence** and recompute a *validated* score alongside (never instead of) the self-reported score.
3. Any critical flag remains **Critical gap** until evidence of remediation is Verified.
4. Validated scores are still readiness indicators — they are never a determination of conformity or compliance.

## 7. Limitations

- The self-assessment has three questions per domain; it is a screening instrument, not an audit.
- Self-reported answers tend to be optimistic; validation typically adjusts some scores downward. VERITRAIL has not yet
  measured the size of this effect — pilots will collect it (see `content/pilots/`).
- Framework readiness indicators are indicative groupings of questions, not official framework scoring.
- Weights are VERITRAIL design choices to be reviewed after pilot feedback.
