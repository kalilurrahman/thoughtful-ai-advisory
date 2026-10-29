---
title: "VERITRAIL Assurance — AI control testing, incidents and evidence packs"
h1: "VERITRAIL Assurance: demonstrate that AI governance works, continuously"
slug: /solutions/assurance/
description: "VERITRAIL Assurance tests AI controls, retains evidence, logs actions tamper-evidently, manages AI incidents and produces audit-ready evidence packs on request."
section: solutions
nav_label: "VERITRAIL Assurance"
nav_order: 60
template: page
schema_type: Service
primary_cta: baseline
secondary_cta: demo
faq:
  - q: "Who can mark evidence as Verified?"
    a: "Only a named human reviewer. VERITRAIL records who reviewed each item and when. Automated checks can support review but cannot by themselves make evidence Verified."
  - q: "Does VERITRAIL decide whether an AI incident must be reported to a regulator?"
    a: "No. VERITRAIL structures the incident record and prompts the notification assessment, but whether a notification obligation applies is a determination for your legal and compliance teams."
updated: 2026-10-21
---

**Core message: governance that cannot be evidenced on request is governance you cannot rely on.**

When an auditor, customer, board member or authority asks "show me", most organizations assemble evidence by hand from email threads, shared drives and screenshots. VERITRAIL Assurance makes evidence a by-product of governance: controls are tested on a schedule, decisions are logged tamper-evidently, incidents follow a defined path, and an evidence pack for any material AI system can be produced from the record.

## Capabilities

- **Control testing programme (SE-01).** Test plans per control with design and operating-effectiveness steps, sampling guidance, tester and date recorded.
- **Evidence repository and retention (SE-02).** Evidence items linked to controls and systems, with retention rules and access control on evidence itself.
- **Evidence labelling.** Every item is Verified, User-asserted, Inferred, Missing evidence or Critical gap; only a named reviewer can mark an item Verified.
- **Tamper-evident action logging (SE-08).** Hash-chained logs of AI decisions, policy decisions, tool calls and approvals, with verification.
- **AI incident management (SE-04).** Incident categories for harmful output, data leakage, unauthorized action, security compromise, fairness concerns and drift; containment links to the [Shield](/solutions/shield/) kill switch; a notification-assessment step for legal review.
- **Monitoring and post-market plans (GL-08, SE-09, SE-12).** Performance and drift thresholds, review records and post-deployment monitoring plans for high-risk systems.
- **Evidence packs (SE-05).** One-click assembly of a system's record, assessments, approvals, tests, policies, monitoring, incidents and corrective actions — each labelled.
- **Metrics and management review (SE-03, SE-07)** and **corrective action tracking (SE-06).**

## Who it is for

- **Second-line risk and compliance testing teams** running AI control tests.
- **Internal audit** planning risk-based AI audits (SE-10).
- **AI Governance Leads** answering customer questionnaires and preparing for external assessments.
- **CISOs and operational risk** managing AI incidents.

## Outputs

| Output | Contents |
|---|---|
| Evidence pack (PDF, Markdown, JSON index) | Per-system evidence index with labels, gaps and reviewer sign-offs |
| Control test results | Test steps, samples, result, tester, date, linked findings |
| Incident register and post-incident reviews | Timeline, containment, notification decision record, corrective actions |
| Governance KPI pack | Inventory coverage, tier distribution, overdue findings by severity, time-to-produce evidence, drill results |
| Audit log verification report | Hash-chain verification result for the period |

## Example: evidence pack index (excerpt)

| Item | Control | Evidence status | Reviewer |
|---|---|---|---|
| Inventory record v7 with owner acceptance | EI-01, EI-03 | Verified | AI Governance Lead |
| Pre-deployment risk and impact assessment | GL-02 | Verified | AI Risk Lead |
| Approval with three conditions | GL-03 | Verified | Governance forum secretary |
| Prompt-injection test report | IS-14 | User-asserted — report referenced but not provided | — |
| Kill-switch drill record | IS-15 | Missing evidence | — |
| Runtime policy v1.3.0 and decision-log extract | IS-12, SE-08 | Verified | Security Architecture |
| Fairness evaluation | IS-05 | Critical gap — High-tier system with no evaluation performed | — |

A pack like this is useful precisely because it shows the gaps. It is not a compliance attestation.

{{controls:SE-01,SE-02,SE-04,SE-05,SE-08,SE-12}}

## How it fits

Assurance draws on records from [Register](/solutions/register/), decisions from [Control](/solutions/control/) and policy decisions from [Shield](/solutions/shield/). The [VERITRAIL Agent](/solutions/agent/) can draft an evidence index and highlight missing items; exporting sensitive evidence outside the organization requires human approval.

## Limitations

VERITRAIL can show what evidence exists and who reviewed it; it cannot attest to the truth of evidence supplied to it. Hash-chained logs are tamper-evident, not tamper-proof, and depend on protecting the log store. Whether an evidence pack satisfies a particular auditor, certification body or authority is their determination.

{{disclaimer}}

{{cta:baseline}}
