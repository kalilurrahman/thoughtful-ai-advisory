---
title: "Stewardship, Evidence & Assurance (SE) — VERITRAIL Framework pillar"
h1: "Pillar 5: Stewardship, Evidence & Assurance"
slug: /framework/pillars/stewardship-assurance/
description: "VERITRAIL SE controls cover control testing, evidence retention, tamper-evident logging, AI incidents, monitoring, internal audit and evidence packs."
section: framework
nav_label: "Assurance (SE)"
nav_order: 20
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: demo
faq:
  - q: "What is an audit-ready evidence pack?"
    a: "A structured bundle for one AI system containing its inventory record, risk assessment, approvals and conditions, test results, runtime policy versions, monitoring outputs, incidents and corrective actions — each item labelled with its evidence status."
  - q: "Does an evidence pack prove compliance?"
    a: "No. It organizes evidence so that auditors, customers or regulators can evaluate it. Whether that evidence satisfies a particular legal or certification requirement is a judgement for qualified reviewers, not for VERITRAIL."
updated: 2026-10-21
---

**Core question: can we prove it, test it, learn from incidents and improve?**

The assurance pillar closes the loop. Controls that are never tested drift into fiction; logs that can be edited are not evidence; incidents that are not reviewed repeat. Stewardship, Evidence & Assurance controls make governance demonstrable — to leadership, internal audit, customers, and, where relevant, supervisors and market surveillance authorities.

## What good looks like

- A control-testing programme that checks design and operating effectiveness and keeps results.
- An evidence repository with retention aligned to obligations and access controls on evidence itself.
- Tamper-evident logs of AI decisions, tool calls, policy decisions and approvals.
- An AI incident procedure — detection, triage, containment, notification where required, post-incident review.
- Performance and drift monitoring with thresholds that trigger review.
- The ability to produce an evidence pack for any material AI system on request, and a measured time-to-produce.
- Leadership KPIs, management review and independent review on a risk-based cycle.

## Controls in this pillar

| Control | Objective | Priority / scope | Evidence that demonstrates it |
|---|---|---|---|
| SE-01 Control testing programme | Periodic design and operating-effectiveness testing with retained results | High / all AI | Control test plan; results with dates and testers |
| SE-02 Evidence repository and retention | Controlled evidence repository with retention aligned to obligations | High / all AI | Repository; retention policy; access controls |
| SE-03 Governance metrics and leadership reporting | KPIs reported to leadership and used for corrective action | Medium / all AI | KPI dashboard; leadership pack; actions arising |
| SE-04 AI incident management and reporting | Detect, triage, contain, report and learn from AI incidents, including regulatory notification where required | High / all AI | Incident procedure; incident log; post-incident reviews |
| SE-05 Audit-ready evidence packs | Evidence pack for any material system on request | High-tier / EU high-risk | Sample evidence pack; time-to-produce metric |
| SE-06 Corrective action and continuous improvement | Nonconformities and corrective actions tracked to closure | Medium / all AI | Corrective action register; closure evidence |
| SE-07 Management review | Periodic review of the governance system's suitability and effectiveness | Medium / all AI | Review minutes; decisions and actions |
| SE-08 Immutable action logging | Decisions, tool calls, policy decisions and approvals in tamper-evident, retained logs | Critical / all AI | Log configuration; tamper-evidence mechanism; retention; sample extract |
| SE-09 Post-market monitoring plan | Post-market / post-deployment monitoring plan for high-risk systems | High-tier / EU high-risk | Monitoring plan; monitoring outputs |
| SE-10 Independent review and internal audit | Independent review or internal audit on a risk-based cycle | Medium / all AI | Audit plan; audit reports; management responses |
| SE-11 Stakeholder transparency reporting | Information to deployers, customers and affected parties on capabilities, limits and governance | Medium-tier / EU high-risk | Instructions for use; customer-facing AI documentation; transparency reports |
| SE-12 Model performance and drift monitoring | Performance and data/concept drift monitored against thresholds | High / all AI | Drift metrics and thresholds; alert history; review records |

{{controls:SE-01,SE-04,SE-05,SE-08}}

## Evidence quality, not evidence volume

More documents do not mean better assurance. VERITRAIL labels every evidence item so reviewers can see its strength at a glance:

| Label | What it means for assurance |
|---|---|
| Verified | Reviewed by a named reviewer; can be relied on, subject to scope |
| User-asserted | Stated by the control owner; needs evidence before reliance |
| Inferred | Derived from responses or metadata; needs confirmation |
| Missing evidence | Required evidence not provided; treat the control as not demonstrated |
| Critical gap | Material exposure; escalate and remediate within the Critical SLA |

See [Gap analysis](/compliance/gap-analysis/) for how labels combine with severity and remediation SLAs.

## Tamper-evident logging

SE-08 asks for logs whose integrity can be checked. VERITRAIL's own platform writes material actions — policy decisions, approvals, evidence exports, assessment results — to a hash-chained audit log in which each entry includes the hash of the previous one, so that deletion or alteration of an entry is detectable on verification. Hash chaining is tamper-evident, not tamper-proof: protect the log store, restrict administrative access, and retain verification results as evidence too.

## Common failure modes

- **Testing the policy, not the practice.** Control tests that confirm a document exists rather than sampling whether the process was followed.
- **Incident processes that ignore AI.** The security incident process has no category for harmful outputs, model drift or agent misbehavior, so AI incidents go unrecorded.
- **Evidence assembled on demand.** Evidence packs are built in a scramble before each audit. Measure time-to-produce and make it a KPI (SE-03, SE-05).

## How VERITRAIL helps

[VERITRAIL Assurance](/solutions/assurance/) provides control testing, evidence repository, incident workflow and evidence-pack generation. [VERITRAIL Shield](/solutions/shield/) feeds policy decisions and approvals into the tamper-evident log. The [VERITRAIL Agent](/solutions/agent/) can assemble a draft evidence index for a system, labelling each item — export of sensitive evidence always requires human approval.

## Indicative framework alignment

SE controls align indicatively with NIST AI RMF MEASURE 1.3, MEASURE 4.1 and MANAGE 4; ISO/IEC 42001 clauses 7.5, 9 and 10 and Annex A.6.2.8 and A.8.4; and EU AI Act Art. 12 (record-keeping, SE-08), Art. 17–20 (provider quality and documentation obligations), Art. 72 (post-market monitoring, SE-09) and Art. 73 (serious incident reporting, SE-04).

{{disclaimer}}

{{cta:baseline}}
