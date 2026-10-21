---
title: "AEGIS gap-analysis method — severity, evidence status and SLAs"
h1: "Gap analysis method"
slug: /compliance/gap-analysis/
description: "The AEGIS gap-analysis method: five evidence statuses, four severities with 30/60/90/180-day remediation SLAs, and a human-reviewed workflow."
section: compliance
nav_label: "Gap analysis method"
nav_order: 50
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: agent
faq:
  - q: "What is the difference between Missing evidence and Critical gap?"
    a: "Missing evidence means the required evidence has not been provided, so the control cannot be relied on. Critical gap means there is a material privacy, security, safety, legal or operational exposure — for example, an agent that can make payments with no approval rule."
  - q: "Can a gap be closed by accepting the risk?"
    a: "Yes, through a documented exception (GL-10) with an accountable approver, compensating controls and an expiry date. Approving an exception always requires a named human approver."
updated: 2026-10-21
---

{{disclaimer}}

A gap analysis is only as useful as it is honest. The AEGIS method is designed so that anyone reading a gap register can tell, for every line, **what the gap is, how sure we are, how serious it is, who owns it and when it must be fixed.** It is the method used in the Governance Baseline, by the AEGIS Agent, and in every AEGIS report.

## 1. Evidence status

Every finding carries exactly one evidence status:

| Status | Definition | Typical example |
|---|---|---|
| **Verified** | Evidence exists and has been reviewed by a named reviewer | Approval record for the system, sampled and checked by the AI Risk Lead |
| **User-asserted** | The control owner states it is implemented, but evidence is absent | "We red-team every release" with no test report attached |
| **Inferred** | Inferred as a likely gap or fact from responses or metadata | Risk tier suggested from intake answers; gap inferred from a low self-assessment score |
| **Missing evidence** | Required evidence has not been provided | No kill-switch drill record exists |
| **Critical gap** | Material privacy, security, safety, legal or operational exposure | Unredacted customer data sent to an external model; agent can delete records without approval |

Two rules keep the labels honest:

- **Self-assessment answers are always User-asserted.** A high score in the self-assessment is a claim, not evidence.
- **Only a named human can make something Verified.** Automated checks can support review, but AEGIS records the reviewer's identity and date for every Verified item.

## 2. Severity and remediation SLAs

| Severity | Remediation SLA | Typical characteristics |
|---|---|---|
| **Critical** | 30 days | Critical-priority control not implemented for a Medium-or-higher tier system, or any Critical gap evidence status |
| **High** | 60 days | High-priority control not implemented, or critical control partially implemented, for a higher-tier system |
| **Medium** | 90 days | Partial implementation; evidence gaps where the control is stated to be implemented |
| **Low** | 180 days | Minor gaps on lower-priority controls or lower-tier systems |

For use-case assessments, severity is calculated from three inputs: the **priority** of the cited control (critical, high, medium), the **confirmed risk tier** of the system, and the **answer** (not implemented, partially implemented, unknown). An answer of "implemented" without evidence is treated as an evidence gap and capped at Medium — the fix is to produce and review evidence, not to rebuild the control. SLAs run from the date the finding is confirmed, not from when it was first suspected.

## 3. The finding record

| Field | Example |
|---|---|
| Finding ID | F-2026-014 |
| System | Customer-support agent (High tier, confirmed) |
| Finding | Payments tool callable without human approval |
| Control | IS-13 Human approval for high-impact actions; related IS-11 |
| Framework references (indicative) | NIST AI RMF GOVERN 3.2, MANAGE 2.2; ISO/IEC 42001 A.9.2; EU AI Act Art. 14 |
| Evidence status | Critical gap |
| Severity / SLA | Critical / 30 days |
| Owner | Head of Customer Operations (business); Platform Engineering Lead (technical) |
| Recommended action | Add a REQUIRE_HUMAN_APPROVAL rule above an agreed threshold; restrict tool scope; verify in Observe mode, then enforce |
| Status | Open → In remediation → Ready for re-test → Closed (Verified) / Exception (GL-10) |

{{controls:IS-13,GL-10,SE-06,SE-05}}

## 4. Workflow

1. **Scope.** Agree the systems, frameworks and evidence period. Confirm roles (for example provider or deployer under the EU AI Act) with legal where relevant.
2. **Collect.** Self-assessment and use-case assessments; evidence requests mapped to each control's evidence list.
3. **Label.** Assign an evidence status to each control per system. Unreviewed submissions stay User-asserted.
4. **Map.** Link each finding to AEGIS controls and, indicatively, to framework references from the control library.
5. **Rate.** Calculate severity; assign owners; set SLA due dates.
6. **Review.** A named human reviewer confirms findings, tiers and severities. Tier changes and exception approvals are decisions for accountable approvers, never automated.
7. **Plan.** Group findings into a 30/60/90-day plan and a longer remediation roadmap.
8. **Remediate and re-test.** Owners remediate; reviewers re-test and mark findings Verified-closed, or record an exception with expiry.
9. **Report.** Track overdue findings by severity as a leadership KPI (SE-03) and feed lessons into corrective action (SE-06).

## 5. What the method does not do

It does not determine legal applicability or compliance. A register with no open Critical findings is evidence of progress, not a declaration of conformity with any standard or law. Where a finding concerns a legal obligation, the recommended action includes legal review.

## Use it

The method is applied in the [Governance Baseline](/contact/book-governance-baseline/), and the [AEGIS Agent](/solutions/agent/) drafts gap register entries in this format for human review.

{{cta:baseline}}
