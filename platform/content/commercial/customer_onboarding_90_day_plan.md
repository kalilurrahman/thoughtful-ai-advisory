---
title: "90-day customer onboarding plan"
version: 1.0.0
effective_date: 2026-10-21
owner: AEGIS Customer Success Lead
---

# 90-day customer onboarding plan

Applies after a customer signs a platform subscription (typically following a Governance Baseline or pilot). Phases are
sequenced by exit criteria; day ranges are the target cadence agreed with the customer, not a guarantee.

## Roles

| AEGIS | Customer |
|---|---|
| Customer success lead (accountable) | Executive sponsor |
| Solutions engineer (integrations, Shield) | Governance lead (day-to-day owner) |
| Governance specialist (content, assessments) | Platform/security lead (Shield) |
| Commercial lead (QBR, expansion) | Module champions per BU |

## Phase 1 — Days 0–30: Foundation

| Activity | Output | Controls | Exit criterion |
|---|---|---|---|
| Kick-off; confirm success plan carried over from the pilot/Baseline scorecard | Signed success plan | — | Sponsor approves success plan |
| Tenant setup: SSO/roles, least-privilege access, audit log enabled, retention configured | Configured workspace | IS-11, SE-08, SE-02 | Access review done |
| Import Baseline inventory; reconcile with discovery imports | Register live | EI-01, EI-09 | All Baseline systems migrated; owners confirmed |
| Confirm risk tiers through approval workflow | Approved tiers | EI-02 | 100% of systems tiered and confirmed |
| Close Critical gaps from the gap register | Remediation evidence | per gap | Critical gaps closed with Verified evidence or approved exception (GL-10) |
| Train governance users and approvers | Training records | AO-05 | Champions trained per BU |

## Phase 2 — Days 31–60: Operate

| Activity | Output | Controls | Exit criterion |
|---|---|---|---|
| Switch intake to AEGIS (EI-12) with triage routing | Live intake | EI-12, GL-01 | New use cases enter via AEGIS only |
| Activate approval matrix and change triggers | Live gates | GL-03, GL-04 | First approvals with conditions recorded |
| Shield: policies for priority agents in Observe → Warn | Decision logs | IS-12, IS-13 | Observe review complete; customer approver signs off Warn |
| AEGIS Agent rollout to governance users | Agent usage | — | Assessments completed via Agent |
| First KPI pack to forum | KPI pack | SE-03 | Forum reviews KPIs |

## Phase 3 — Days 61–90: Prove and expand

| Activity | Output | Controls | Exit criterion |
|---|---|---|---|
| Evidence pack for highest-risk system | Evidence pack + time-to-produce | SE-05 | Pack produced and reviewed by internal audit or second line |
| Shield: move first policy to Protect/Enforce **only with customer approval** | Policy version + approval record | IS-12, IS-15 | Kill switch tested; time-to-disable recorded |
| Control testing plan | Test plan | SE-01 | Plan approved |
| 90-day business review (QBR) | Measured outcomes vs. success plan; ROI model updated with measured values | — | Sponsor confirms value; next-phase plan agreed |

## Health metrics (tracked weekly)

| Metric | Healthy signal |
|---|---|
| Inventory coverage (systems registered / estimated) | Rising toward 100% |
| Tier confirmation rate | 100% by Day 30 |
| Open Critical gaps | Zero past SLA (30 days) without approved exception |
| Active governance users / licensed | ≥ 70% |
| Approval latency for high-impact agent actions | Within customer's agreed target |
| Agent answers with valid citations (sampled) | Tracked; every invalid citation triaged |

## Escalation

Off-track metric for two consecutive weeks → customer success lead and governance lead agree a recovery plan →
unresolved within two further weeks → sponsor escalation.
