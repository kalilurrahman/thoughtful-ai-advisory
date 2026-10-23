---
title: "One-pager — VERITRAIL Agent"
audience: AI governance teams, risk analysts, product owners
version: 1.0.0
effective_date: 2026-10-21
---

# VERITRAIL Agent — a governance copilot that cites its sources

**Faster assessments, gap analysis and reports — with every recommendation tied to a control.**

## The problem

Governance teams are outnumbered by AI projects. Assessments take days, questions repeat, and generic AI assistants
answer compliance questions confidently and wrongly.

## What it does

| Journey | What happens | Guardrails |
|---|---|---|
| **Ask VERITRAIL** | Answers governance questions from the VERITRAIL control library, assessment template and your registered content | Cites control IDs; if nothing supports an answer it says: "No supporting evidence or framework source is available." |
| **Guided assessment** | Walks a user through the maturity self-assessment or a use-case assessment conversationally | Answers labelled User-asserted; pre-filled answers labelled Inferred |
| **Gap analysis** | Turns answers and evidence into a gap register with severities and owners | Every gap cites controls and evidence status |
| **Report generation** | Drafts maturity reports, executive summaries and evidence-pack covers | Standard disclaimer; prohibited-claim check; drafts only |

## Built-in safety

- **Least privilege:** each of the Agent's tools declares a permission level; write tools create drafts (IS-11).
- **Human approval:** changing a risk tier, approving an exception, changing production runtime policy, exporting
  sensitive evidence and sending external communications create pending approvals — never self-executing (IS-13).
- **Redaction first:** sensitive data is masked before any external model call or log write (IS-04).
- **Audit:** material actions are logged to a tamper-evident audit log with trace IDs (SE-08).
- **No compliance claims:** outputs are checked for prohibited statements such as claims of compliance or certification.

## Who it is for

Governance teams that want to scale assessments without scaling headcount; business owners who need help completing
intake and assessments correctly.

## What you can verify in a demo

Ask a question with a known answer and check the cited control; ask something outside the library and see the agent
decline; attempt to change a risk tier and see a pending approval created instead.

## Limitations

The Agent's knowledge is bounded by the VERITRAIL library and the content you provide; it does not give legal advice, and
its answers should be reviewed. Answer quality, citation accuracy and hallucination resistance are measured in pilots
(feedback survey section C) and in the agent evaluation suite.

## Commercials

Premium tier uplift or usage-based (hypothesis to validate in pilots — see `pricing_models.md`).
