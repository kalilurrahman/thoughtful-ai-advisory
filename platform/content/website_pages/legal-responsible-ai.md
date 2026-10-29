---
title: "Responsible AI at VERITRAIL — how our product uses AI"
h1: "Responsible AI statement"
slug: /legal/responsible-ai/
description: "How VERITRAIL uses AI in its own product: control citations, evidence labels, human approval for high-impact actions, redaction, audit logs, no overclaiming."
section: legal
nav_label: "Responsible AI"
nav_order: 30
template: page
schema_type: WebPage
primary_cta: agent
secondary_cta: demo
updated: 2026-10-21
---

VERITRAIL helps organizations govern AI. That obliges us to govern our own use of AI at least as carefully as we ask our customers to. This statement explains where VERITRAIL uses AI, the rules it follows, and the limits we acknowledge.

**Last updated:** 21 October 2026

## Where VERITRAIL uses AI

| Feature | Role of AI | Role of deterministic logic |
|---|---|---|
| VERITRAIL Agent (workspace, signed in) | An external large-language model interprets your governance concern and drafts recommended areas and actions, with each recommendation citing a VERITRAIL control | Tool permissions, approval routing, citation checks, prohibited-claim checks, redaction of common sensitive-data patterns before the call, daily usage quota, audit logging |
| Site assistant (website, signed in) | An external large-language model answers questions about VERITRAIL pages and features, drawing on a retrieval step over the site content | The retrieval step and source citations are deterministic; the model sees only page excerpts, not your workspace data |
| Ask VERITRAIL demo (website, no sign-in) | None — fully deterministic | Intent routing, retrieval and templated, cited composition; no model, no network call, no data stored |
| Maturity self-assessment | None in scoring | Scoring, levels, flags and action plans are rule-based and published |
| Risk triage | None in tiering | Tier suggestions come from published rules with citations |
| Guardrail generator and VERITRAIL Shield | None in runtime policy evaluation | Draft policies are generated from VERITRAIL rules; runtime evaluation is rule-based, versioned and logged |

We use AI where it helps people draft and navigate, and deterministic, published logic where results must be reproducible — such as scores, tiers and runtime decisions.

## The rules our AI follows

**1. Cite or say so.** Every material recommendation cites at least one VERITRAIL control ID, and where relevant an assessment question, policy version, evidence item or indicative framework mapping. If nothing supports a statement, the response is: "No supporting evidence or framework source is available."

**2. Label evidence honestly.** Self-reported information is User-asserted; derived information is Inferred; only evidence reviewed by a named person is Verified. Missing evidence and critical gaps are named as such.

**3. No compliance claims.** Our AI does not state that any organization or system is compliant, certified or approved by a regulator. Outputs are checked for such claims, and our standard disclaimer accompanies reports and compliance content.

**4. Humans approve high-impact actions.** Changing a risk tier, approving an exception, changing production runtime policy, exporting sensitive evidence and sending external communications create a pending approval for a named person. They never execute on the AI's own authority.

**5. Redaction first.** Sensitive data is masked before any call to an external model and before log writes.

**6. Least privilege.** Each Agent tool declares its permission level. Tools that write create drafts.

**7. Audit.** Material actions are recorded in a hash-chained, tamper-evident audit log with a trace ID.

{{controls:IS-04,IS-11,IS-13,SE-08,IS-08}}

## Transparency to users

AI-generated content in VERITRAIL is identified as such (IS-08). Drafts are labelled as drafts. The Ask VERITRAIL demo states that it is a limited demo and what it can and cannot do.

## Known limitations

- AI-generated drafts can be wrong, incomplete or poorly suited to a particular organization. They are inputs to human judgement.
- Pattern-based redaction and prompt-injection detection reduce risk but do not eliminate it.
- Framework mappings are indicative interpretations and may lag changes in standards and law. The control library is versioned and reviewed quarterly.
- EU AI Act timelines were updated in October 2026 for Regulation (EU) 2026/1744 (the Digital Omnibus); they must still be checked against the current Official Journal text before reliance.

## Governing our own AI

We apply the same framework to VERITRAIL itself. Our commitments: our AI features are recorded in our own inventory with owners and risk tiers; changes to models and prompts follow change control; and the Agent's tools and approval requirements are defined in policy. We will report material changes to this statement on this page.

## Questions or concerns

If you believe a VERITRAIL output is wrong, misleading or harmful, please [contact us](/contact/). We review every report.

{{cta:demo}}
