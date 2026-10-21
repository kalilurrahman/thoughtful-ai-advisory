---
title: "AEGIS implementation runbooks — standing up AI governance controls"
h1: "Implementation runbooks"
slug: /framework/runbooks/
description: "Step-by-step AEGIS runbooks for AI inventory, intake and approval, agent onboarding, kill-switch drills, AI incidents, evidence packs and vendor AI review."
section: framework
nav_label: "Runbooks"
nav_order: 50
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: blueprint
updated: 2026-10-21
---

Controls say *what* must be true. Runbooks say *how* to make it true and keep it true. Each AEGIS runbook names a trigger, an owner, the steps, the evidence produced and the controls it implements. They are written for the people who do the work — AI CoE leads, platform engineers, risk analysts — and are designed to be adapted to your tooling and approved by your governance forum.

Downloadable editable versions are listed in the [runbook library](/resources/runbooks/).

## Runbook index

| # | Runbook | Trigger | Primary owner | Controls |
|---|---|---|---|---|
| 1 | Stand up the AI inventory | Programme start | AI Governance Lead | EI-01, EI-03, EI-09, EI-11 |
| 2 | Intake, triage and approval | New use case or material change | AI CoE | EI-12, GL-01, GL-02, GL-03 |
| 3 | Onboard an agent to runtime guardrails | New agent or new tool | Platform Engineering | EI-07, IS-11, IS-12, IS-13 |
| 4 | Kill-switch and rollback drill | Quarterly, and before go-live of High-tier systems | Platform Engineering / SRE | IS-15, GL-07 |
| 5 | AI incident response | Detected or reported AI incident | CISO / Operational Risk | SE-04, IS-15, AO-06 |
| 6 | Produce an evidence pack | Audit, customer or regulator request; scheduled | AI Governance Lead | SE-05, SE-02, SE-08 |
| 7 | Vendor AI review | New vendor AI product or material vendor change | Procurement / Vendor Risk | GL-11, EI-08, AO-09 |
| 8 | Periodic recertification | Tier-based review calendar | AI Risk Lead | GL-12, EI-11, SE-07 |

## Runbook 1 — Stand up the AI inventory

1. **Agree scope.** Define what counts as AI (in-house models, LLM apps, agents, vendor AI, embedded SaaS AI features, model APIs) and document deliberate exclusions.
2. **Seed from known sources.** Architecture repositories, procurement records, cloud AI service usage, API key inventories, CoE project lists.
3. **Run discovery.** Short workshops per business unit plus technical discovery of AI services and SaaS AI features (EI-09).
4. **Capture the minimum viable record** — owner, purpose, decision impact, data sensitivity, autonomy, vendor, lifecycle status — and assign provisional tiers.
5. **Confirm owners.** Each business and technical owner accepts the record (EI-03).
6. **Confirm tiers.** An AI Risk Lead confirms or adjusts each provisional tier, with rationale (EI-02).
7. **Set the attestation cycle** (EI-11) and schedule the next discovery.

**Evidence produced:** inventory export with record counts; owner acceptance records; tier confirmations; discovery reconciliation.

## Runbook 2 — Intake, triage and approval

1. Requester submits the intake (EI-12); the use case is screened against the prohibited and restricted use list (AO-10) and the outcome is recorded. Any match is escalated for legal review.
2. Triage calculates a suggested tier and required modules (GL-01). An AI CoE reviewer confirms.
3. The system owner completes the required [assessment modules](/framework/assessment-modules/) (GL-02); vendor review runs in parallel if a vendor model is used (GL-11).
4. Findings are rated; Critical and High findings must be remediated or accepted as time-bound exceptions (GL-10).
5. The approver matched to the tier approves, restricts or rejects, recording conditions (GL-03).
6. Before go-live, the product owner verifies each condition (GL-07).

**Evidence produced:** intake record; triage decision; completed assessment; approval with conditions; condition verification.

## Runbook 3 — Onboard an agent to runtime guardrails

1. Register the agent and its tool manifest — every tool, scope, data store and permitted action (EI-07).
2. Draft a policy with the [guardrail generator](/tools/guardrail-generator/): deny unlisted tools, redact sensitive data, set limits, require approval for high-impact actions.
3. Review the draft with the business owner and security; record the approved version.
4. Deploy in **Observe** mode; review decision logs for false positives and missing rules.
5. Promote through **Warn**, **Protect** and **Enforce** against agreed exit criteria. Every promotion of a production policy requires human approval.
6. Confirm the **Contain** configuration — what is disabled or restricted in an incident — and test it under Runbook 4.

**Evidence produced:** agent registry entry; versioned policy; approval records for each promotion; policy decision logs.

## Runbook 4 — Kill-switch and rollback drill

1. Select the target (system, model, agent, tool or tenant) and announce the drill window.
2. Trigger the kill switch or Contain mode; measure time-to-disable from decision to confirmed effect.
3. Verify that dependent processes fail safely and users see an appropriate message.
4. Roll back to the previous model or prompt version; verify behavior.
5. Restore service; record results and actions.

**Evidence produced:** drill record with time-to-disable; rollback verification; actions raised.

## Runbook 5 — AI incident response

1. **Detect and log.** Sources include monitoring alerts, policy denials, user reports and the concern-reporting channel (AO-06).
2. **Triage.** Classify: harmful or incorrect output, data leakage, unauthorized action, security compromise, fairness concern, drift.
3. **Contain.** Apply Contain mode, revoke tools or disable the system as needed (IS-15).
4. **Assess notification obligations.** Legal and compliance determine whether any regulatory, contractual or customer notification applies (SE-04). AEGIS does not make that determination.
5. **Remediate and review.** Root cause, corrective actions (SE-06), and lessons fed into policies and tests.

**Evidence produced:** incident record; containment timeline; notification decision record; post-incident review.

## Runbook 6 — Produce an evidence pack

1. Identify the system and the request scope.
2. Assemble: inventory record, risk assessment, approvals and conditions, test results, policy versions, monitoring outputs, incidents, corrective actions.
3. Label every item: Verified, User-asserted, Inferred, Missing evidence or Critical gap.
4. Redact sensitive content as required. Exporting sensitive evidence outside the organization requires human approval.
5. Record time-to-produce as a KPI (SE-03).

## Runbook 7 — Vendor AI review

1. Add the product or feature to the vendor AI register (EI-08).
2. Issue the AI due-diligence questionnaire: data use for training, model change notice, incident notification, audit rights, sub-processors, hosting regions (GL-11).
3. Agree the responsibility allocation between your organization and the vendor (AO-09).
4. Add AI contract terms; route through intake for tiering.

## Runbook 8 — Periodic recertification

1. The review calendar triggers recertification at the tier-based cadence (GL-12).
2. The owner re-attests the inventory record (EI-11) and confirms nothing material changed without reassessment.
3. The reviewer samples monitoring outputs, incidents and exceptions; decides to recertify, restrict or retire.
4. Results roll up to management review (SE-07).

{{controls:EI-01,GL-03,IS-13,IS-15,SE-04,SE-05}}

## Make the runbooks yours

A Governance Baseline adapts these runbooks to your organization, tooling and approval structure as part of the 90-day plan.

{{cta:baseline}}
