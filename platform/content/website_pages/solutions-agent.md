---
title: "VERITRAIL Agent — a governance copilot that cites controls and labels evidence"
h1: "VERITRAIL Agent: governance work, drafted with citations"
slug: /solutions/agent/
description: "The VERITRAIL Agent drafts AI assessments, gap registers and reports, cites VERITRAIL controls, labels evidence status and routes high-impact actions to humans."
section: solutions
nav_label: "VERITRAIL Agent"
nav_order: 70
template: page
schema_type: Service
primary_cta: demo
secondary_cta: baseline
faq:
  - q: "Can the VERITRAIL Agent approve a use case or change a risk tier?"
    a: "No. The Agent can propose a tier or draft an approval memo, but changing a risk tier, approving an exception, changing production runtime policy, exporting sensitive evidence and sending external communications all create a pending approval for a named human."
  - q: "What happens when the Agent has no source for an answer?"
    a: "It says so. If no VERITRAIL control, assessment answer, policy or evidence supports a statement, the Agent responds with: No supporting evidence or framework source is available."
  - q: "Is our data sent to an external LLM?"
    a: "Sensitive data is redacted before any external model call, and every call is logged. Deployment options, including which model provider is used, are agreed during onboarding."
updated: 2026-10-21
---

**Core message: a copilot for AI governance teams that shows its sources, admits what it does not know, and never acts on its own authority.**

Governance teams spend much of their time on structured drafting: turning workshop notes into assessments, assessments into gap registers, gap registers into roadmaps and board papers. The VERITRAIL Agent accelerates that work while following the same rules VERITRAIL applies to every AI system it governs.

## Capabilities

- **Guided use-case assessment.** Runs intake, suggests a risk tier with factors and citations, and walks the owner through the triggered [assessment modules](/framework/assessment-modules/).
- **Ask VERITRAIL.** Answers questions about your controls, gaps and framework mappings with citations to VERITRAIL control IDs, assessment question IDs, policy versions or evidence items.
- **Gap register drafting.** Converts findings into register entries with control, severity, evidence label, owner and SLA date.
- **Runtime guardrail drafting.** Produces a draft Shield policy from an agent profile for engineering and security review.
- **Report drafting.** Executive summaries, maturity reports and evidence-pack indexes in Markdown or PDF.
- **Framework lookups.** Indicative mappings from VERITRAIL controls to NIST AI RMF, ISO/IEC 42001 and EU AI Act references, always with the mapping disclaimer.

## Built to the rules it enforces

| Rule | How the Agent applies it |
|---|---|
| Citations | Every material recommendation cites at least one VERITRAIL control ID; when nothing supports a statement it says "No supporting evidence or framework source is available." |
| Evidence labels | Self-reported answers are User-asserted; suggested tiers are Inferred; only items reviewed by a named human are Verified |
| No compliance claims | Outputs are checked for prohibited claims; the Agent describes readiness and evidence, never compliance or certification |
| Human approval | Tools that change tiers, approve exceptions, change production policy, export sensitive evidence or send external communications create pending approvals |
| Least privilege | Each Agent tool declares its permission level; write tools create drafts |
| Redaction first | Sensitive data is masked before any external LLM call or log write |
| Audit | Material actions are written to a hash-chained audit log with a trace ID |

## Example: an Ask VERITRAIL answer

> **Question:** Are we ready to move our customer-support agent to production?
>
> **VERITRAIL Agent:** Not yet, based on the evidence currently recorded. Three items block go-live under GL-07 (deployment conditions and go-live readiness):
>
> 1. **Human approval for refunds — Critical gap.** The tool manifest shows `payments.issue_refund` with write access and no approval rule. Recommended: add a REQUIRE_HUMAN_APPROVAL condition above the agreed threshold. *Cites IS-13, IS-11.*
> 2. **Prompt-injection testing — User-asserted.** The owner states testing was done (answer to SEC-Q2), but no test report is attached. Recommended: attach the report for review. *Cites IS-14.*
> 3. **Kill-switch drill — Missing evidence.** No drill record exists for this agent. Recommended: run Runbook 4 and record time-to-disable. *Cites IS-15.*
>
> **Verified:** inventory record and owner acceptance (EI-01, EI-03); approval with conditions (GL-03).
> **Inferred:** risk tier High, based on customer-facing use, personal data and the ability to take external actions; awaiting confirmation by the AI Risk Lead (EI-02).
>
> I have drafted a gap register entry for each item. Sending the register to the vendor requires your approval.
>
> *VERITRAIL supports governance readiness, control implementation and evidence collection. This is not a compliance determination.*

## Who it is for

- **AI Governance Leads and CoE teams** who need to scale assessment and reporting.
- **Consultants and advisors** who want a structured, citation-backed drafting assistant for client work.
- **Risk and compliance analysts** preparing gap registers and leadership reports.

## Try it

The [Ask VERITRAIL demo](/tools/ask-veritrail/) is a limited, public version that answers questions about the VERITRAIL framework and controls. It does not have access to any organization's data.

{{controls:IS-13,IS-04,SE-08,GL-02,EI-02}}

## Limitations

The Agent drafts; people decide. It can misread ambiguous inputs, and its answers are only as current as the records in VERITRAIL. Framework mappings are indicative interpretations, not legal advice. Every draft should be reviewed by a qualified person before use, and outputs labelled User-asserted or Inferred should not be relied on as Verified.

See our [Responsible AI statement](/legal/responsible-ai/) for how VERITRAIL uses AI in its own product.

{{cta:demo}}
