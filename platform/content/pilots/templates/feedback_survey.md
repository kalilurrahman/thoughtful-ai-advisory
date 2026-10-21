---
title: "Pilot feedback survey"
applies_to: [Pilot A, Pilot B]
week: 6
version: 1.0.0
effective_date: 2026-10-21
owner: AEGIS Product Lead
---

# AEGIS pilot feedback survey

**Who:** every partner participant (sponsor, pilot lead, system owners, risk/legal/privacy/security, engineers).
**When:** Week 6, before the executive readout is finalized; sponsor interview separately. **Time:** ~12 minutes.
**Privacy:** responses are pseudonymised for product improvement. Quotes are never published without written approval.

Scale for Likert items: 1 = Strongly disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly agree, N/A.

## About you

- R1. Role: Executive sponsor / Governance or risk / Legal or privacy / Security / Engineering or platform / Business owner / Other
- R2. Pilot: A (regulated enterprise) / B (AI-forward, agents)
- R3. Which parts did you use? Website · Self-assessment · AEGIS Agent · Inventory workshop · Deep-dive · Agent review · Shield Advisor · Reports

## A. Framework clarity

| ID | Statement | 1–5 |
|---|---|---|
| A1 | The five pillars and eight domains made sense for our organization. | |
| A2 | Control descriptions were clear enough to act on. | |
| A3 | The evidence labels (Verified, User-asserted, Inferred, Missing evidence, Critical gap) were clear and useful. | |
| A4 | The framework mappings to NIST AI RMF, ISO/IEC 42001 and the EU AI Act were useful and appropriately caveated. | |

- A5 (open). Which controls or areas were missing, duplicated or unclear?

## B. Assessment length and credibility

| ID | Statement | 1–5 |
|---|---|---|
| B1 | The self-assessment length was acceptable. | |
| B2 | The maturity score felt credible for our organization. | |
| B3 | The validated score (after evidence review) was fair. | |
| B4 | The deep-dive assessments asked the right questions without unnecessary burden. | |

- B5. Roughly how long did the self-assessment take you? (minutes)
- B6 (open). Which questions were confusing or irrelevant?

## C. AEGIS Agent — answer quality, citations, hallucination resistance

| ID | Statement | 1–5 |
|---|---|---|
| C1 | The Agent's answers were accurate. | |
| C2 | Citations (control IDs, question IDs, framework references) were present and correct when I checked them. | |
| C3 | When the Agent did not know, it said so rather than inventing an answer. | |
| C4 | The Agent never claimed we were compliant or certified. | |
| C5 | The Agent saved me time compared with doing the task manually. | |
| C6 | I was comfortable with how the Agent handled sensitive information (redaction, approvals). | |

- C7. Did you see any answer you believe was wrong or invented? Yes / No — if yes, describe (no sensitive data).
- C8 (open). What would make you trust the Agent more?

## D. Report usefulness

| ID | Statement | 1–5 |
|---|---|---|
| D1 | The executive readiness report was suitable to share with our leadership. | |
| D2 | The gap register and remediation roadmap were actionable. | |
| D3 | The report was honest about limitations and evidence status. | |

- D4 (open). What would you add or remove?

## E. Runtime guardrails practicality

| ID | Statement | 1–5 |
|---|---|---|
| E1 | The Shield Advisor's tool permission matrix matched how our agents really work. | |
| E2 | The draft runtime policies were realistic to deploy in our stack. | |
| E3 | The Observe → Warn → Protect → Enforce → Contain rollout would reduce friction for our developers. | |
| E4 | Human-approval rules for high-impact actions were workable (latency, approver availability). | |

- E5 (open). What would block runtime enforcement in your environment?

## F. Integration barriers

- F1. Which systems would AEGIS need to integrate with? (tick) Ticketing/ITSM · GRC tool · CMDB/asset inventory · Cloud/ML platform · LLM gateway · IAM/SSO · SIEM · Data catalog · Other
- F2 (1–5). Integration effort would be acceptable for our team.
- F3 (open). What is the biggest technical, security or procurement barrier to adopting AEGIS?

## G. Willingness to pay and pricing preference

- G1 (1–5). AEGIS addresses a problem we would allocate budget to in the next budget cycle.
- G2. Which module would you buy first? Governance Baseline · Register · Control · Shield · Assurance · Agent · Industry pack · None
- G3. Preferred pricing model: Per AI system · Per user · Per business unit · Per environment/agent · Per governed action/usage · Enterprise subscription · Fixed-fee services
- G4. Which budget would fund it? Risk/compliance · Security · CIO/IT · Data/AI CoE · Business unit · Other
- G5 (open). Compared with alternatives (internal build, GRC extensions, consultants), what would AEGIS need to be worth to you?
- G6. Would you be willing to (tick) continue to a paid engagement · act as a reference (private) · co-author a case study (subject to approval)

## H. Overall

- H1 (0–10). How likely are you to recommend AEGIS to a peer?
- H2 (open). The single most valuable thing about the pilot.
- H3 (open). The single biggest thing to fix.

## Analysis plan

| Signal | Threshold for "validated" | Feeds |
|---|---|---|
| Framework clarity (A1–A4 mean) | ≥ 4.0 | Framework backlog |
| Assessment credibility (B2–B3 mean) | ≥ 3.8; B5 median ≤ 15 min | Assessment backlog, R-03 |
| Agent trust (C1–C4 mean); C7 "yes" count | ≥ 4.0; every C7 "yes" triaged as a defect | Agent evaluation set, R-02 |
| Report usefulness (D1–D3 mean) | ≥ 4.0 | Report templates |
| Runtime practicality (E1–E4 mean) | ≥ 3.5 | Shield backlog, R-04 |
| Willingness to pay (G1) and pricing preference (G3) | G1 ≥ 4 from sponsor | Pricing hypotheses in `content/commercial/pricing_models.md` |
