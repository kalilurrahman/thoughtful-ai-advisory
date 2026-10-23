---
title: "AI use-case risk triage — suggest a risk tier in 3 minutes"
h1: "AI use-case risk triage"
slug: /tools/risk-triage/
description: "Answer a short intake about one AI use case and get a suggested VERITRAIL risk tier, the factors behind it and the modules it needs. A human confirms it."
section: tools
nav_label: "Risk triage"
nav_order: 50
template: tool
tool: risk-triage
schema_type: WebPage
primary_cta: baseline
secondary_cta: guardrails
faq:
  - q: "Is the suggested tier the same as EU AI Act high-risk classification?"
    a: "No. VERITRAIL tiers are an internal governance classification. The triage flags regulatory relevance — for example, domains such as credit, employment or essential services — so that your legal team can assess classification under the EU AI Act or other law."
  - q: "Why does the result say it requires human confirmation?"
    a: "Because changing or confirming a risk tier is a governance decision. The triage result is labelled Inferred; an accountable approver must confirm or change it (EI-02)."
updated: 2026-10-21
---

Describe one AI system or use case and get a suggested **VERITRAIL risk tier — Prohibited-review, High, Medium or Low** — with the reasoning behind it. Use it at intake to decide how much assessment a use case needs and who should approve it.

## The intake

| Question | Options |
|---|---|
| Domain | customer service, internal productivity, credit, employment, healthcare, biometric, education, critical infrastructure, law enforcement, migration, justice, essential services, other |
| Decision impact | none, advisory, material, automated decision |
| Affected parties | internal, customers, public, vulnerable groups |
| Data sensitivity | public, internal, confidential, personal, special-category |
| Autonomy | none, suggests, acts with approval, acts autonomously |
| External actions | Can it send messages, update records or move money? |
| Other factors | Generative AI, vendor model, EU exposure, tools it can access, environment, number of users |

Fields you leave blank are listed in the result as missing, so you can see how confident the suggestion is.

## The result

- **Suggested tier** and score, labelled **Inferred** and marked as requiring human confirmation.
- **Factors** that contributed, each with a control citation.
- **Triggers** — for example, a domain that warrants legal review.
- **Required assessment modules**, such as data and privacy, agentic AI or fairness and safety — see [Assessment modules](/framework/assessment-modules/).
- **Suggested approval authority and review cadence.**

{{controls:EI-02,EI-12,GL-01,AO-10}}

## Limitations

The triage is a rules-based starting point, not a risk assessment. It cannot see context you do not provide, and it does not determine legal classification. A **Prohibited-review** result means "stop and get legal review", not that the use case is prohibited.

## Next steps

Use the result to route the use case through intake and assessment. If the system is an LLM app or agent, draft its runtime controls with the [guardrail generator](/tools/guardrail-generator/).

{{disclaimer}}

{{cta:baseline}}
