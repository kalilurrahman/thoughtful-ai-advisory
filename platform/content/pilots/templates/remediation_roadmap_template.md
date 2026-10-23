---
title: "Remediation roadmap template"
applies_to: [Pilot A, Pilot B, Governance Baseline]
week: 5
version: 1.0.0
effective_date: 2026-10-21
owner: VERITRAIL Delivery Lead
---

# Remediation roadmap — [Organization] — [date]

> Prepared from the gap register dated [date]. All items cite VERITRAIL controls. Status labels follow the VERITRAIL evidence
> model. This roadmap supports governance readiness; it is not a compliance determination or legal advice.

## 1. Summary

| Measure | Value |
|---|---|
| Gaps in register | [n] (Critical [n] / High [n] / Medium [n] / Low [n]) |
| Critical gaps (must close in 30 days) | [n] |
| Systems in scope | [n] |
| Recommended VERITRAIL modules | [from engine `recommended_modules`, e.g. Register, Control, Shield] |

## 2. Horizons

Horizons follow the self-assessment action-plan rules (score 1–2 → 30 days, 3 → 60, 4 → 90) and gap SLAs (Critical 30,
High 60, Medium 90, Low 180 days). Where both apply, use the earlier date.

### Days 0–30 — Stabilise

| # | Action | Gap IDs | Controls | Owner (role) | Evidence of completion | Status |
|---|---|---|---|---|---|---|
| 1 | [e.g. Name accountable owners for all registered systems] | [GAP-…] | EI-03 | [role] | Owner fields populated; owner acceptance records | Not started |
| 2 | [e.g. Block unredacted external model calls on sensitive systems] | | IS-04, IS-03 | | Redaction config + test results | |
| 3 | [e.g. Document and test kill switch for production agents] | | IS-15 | | Kill-switch test record with time-to-disable | |

### Days 31–60 — Standardise

| # | Action | Gap IDs | Controls | Owner (role) | Evidence of completion | Status |
|---|---|---|---|---|---|---|
| 1 | [e.g. Mandatory tier-proportionate assessment gate] | | GL-02, GL-03 | | Approval matrix; first approval records | |
| 2 | [e.g. AI change triggers in change management] | | GL-04, EI-05 | | Change policy; tickets referencing reassessment | |

### Days 61–90 — Scale and automate

| # | Action | Gap IDs | Controls | Owner (role) | Evidence of completion | Status |
|---|---|---|---|---|---|---|
| 1 | [e.g. Move runtime policy from Observe to Warn/Protect on agent X] | | IS-12, IS-13 | | Policy version, approval record, decision logs | |
| 2 | [e.g. Evidence pack for highest-risk system] | | SE-05, SE-08 | | Evidence pack; time-to-produce metric | |

### Beyond 90 days

| # | Action | Controls | Owner (role) | Dependency |
|---|---|---|---|---|
| 1 | [e.g. Periodic control-testing programme] | SE-01, SE-10 | | |

## 3. Dependencies and risks

| Dependency / risk | Affects | Mitigation | Owner |
|---|---|---|---|
| [e.g. Inventory completion before tiering] | Days 31–60 items | | |

## 4. Governance of the roadmap

- Reviewed by the AI governance forum (AO-02) monthly; progress reported as KPIs (SE-03).
- An item closes only when evidence is **Verified** by a named reviewer.
- Deferring a Critical or High item requires an exception with approver, expiry and compensating controls (GL-10).
