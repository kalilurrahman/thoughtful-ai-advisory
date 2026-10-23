---
title: "NIST AI RMF and VERITRAIL — indicative mapping to Govern, Map, Measure, Manage"
h1: "NIST AI Risk Management Framework and VERITRAIL"
slug: /compliance/nist-ai-rmf/
description: "How VERITRAIL controls relate indicatively to the NIST AI RMF 1.0 functions Govern, Map, Measure and Manage, with subcategory-level mappings and known gaps."
section: compliance
nav_label: "NIST AI RMF"
nav_order: 20
template: page
schema_type: WebPage
primary_cta: assessment
secondary_cta: baseline
faq:
  - q: "Is the NIST AI RMF mandatory?"
    a: "The NIST AI RMF 1.0 (NIST AI 100-1) is a voluntary framework. Some organizations adopt it as their internal reference, and some customers, contracts or sector expectations may refer to it. Whether it is required in your context is a question for your legal and compliance teams."
  - q: "Does VERITRAIL cover the NIST Generative AI Profile?"
    a: "VERITRAIL includes controls specific to generative and agentic AI (for example IS-04, IS-12, IS-14, IS-16), but Control Library v1.0.0 maps only to AI RMF 1.0 subcategories. It does not include a mapping to the Generative AI Profile (NIST AI 600-1)."
updated: 2026-10-21
---

{{disclaimer}}

The NIST AI Risk Management Framework (AI RMF 1.0, published as NIST AI 100-1) organizes AI risk management into four functions. **GOVERN** cultivates a culture and structure of risk management and applies across the others; **MAP** establishes context and identifies risks; **MEASURE** analyzes, assesses and tracks them; **MANAGE** prioritizes and acts on them. Each function is broken into categories and subcategories describing outcomes.

The AI RMF describes outcomes, not controls. VERITRAIL provides a set of concrete controls, with owners and evidence, that an organization can use to work toward those outcomes. The tables below list every AI RMF subcategory that at least one VERITRAIL control maps to in Control Library v1.0.0.

## GOVERN

GOVERN covers policies and processes, accountability structures, workforce and oversight roles, organizational culture, engagement with AI actors, and third-party risk.

| AI RMF subcategory | VERITRAIL controls (indicative) |
|---|---|
| GOVERN 1.1 | AO-01, AO-07, AO-10 |
| GOVERN 1.2 | AO-01, AO-08 |
| GOVERN 1.3 | AO-04, EI-02 |
| GOVERN 1.4 | AO-12, GL-03, GL-04, SE-02, SE-05 |
| GOVERN 1.5 | EI-11, GL-12, SE-03, SE-07 |
| GOVERN 1.6 | EI-01, EI-05, EI-07, EI-09 |
| GOVERN 1.7 | GL-09 |
| GOVERN 2.1 | AO-02, AO-03, AO-06, EI-03 |
| GOVERN 2.2 | AO-05 |
| GOVERN 2.3 | AO-02 |
| GOVERN 3.2 | IS-09, IS-13 |
| GOVERN 4.2 | SE-11 |
| GOVERN 4.3 | AO-06 |
| GOVERN 5.1 | AO-11 |
| GOVERN 5.2 | AO-11 |
| GOVERN 6.1 | AO-09, EI-08, GL-11, IS-10 |
| GOVERN 6.2 | AO-09 |

{{controls:AO-01,AO-02,EI-01,IS-13}}

## MAP

MAP covers establishing context and intended purpose, categorizing the system, understanding capabilities and costs, mapping risks across components including third-party ones, and characterizing impacts.

| AI RMF subcategory | VERITRAIL controls (indicative) |
|---|---|
| MAP 1.1 | AO-10, EI-02, EI-04, EI-12, GL-01, GL-02, IS-03 |
| MAP 1.2 | EI-04 |
| MAP 1.5 | AO-04, EI-02 |
| MAP 1.6 | GL-01 |
| MAP 2.2 | GL-06 |
| MAP 2.3 | EI-06, IS-02 |
| MAP 3.1 | GL-02 |
| MAP 3.4 | EI-04 |
| MAP 3.5 | IS-09 |
| MAP 4.1 | EI-05, EI-07, EI-10, GL-11 |
| MAP 4.2 | EI-10 |
| MAP 5.1 | GL-02, IS-01, IS-06 |

{{controls:EI-04,GL-01,GL-02}}

## MEASURE

MEASURE covers selecting methods and metrics, evaluating trustworthy characteristics — validity, safety, security and resilience, transparency, privacy, fairness and others — tracking risks over time, and gathering feedback on measurement efficacy.

| AI RMF subcategory | VERITRAIL controls (indicative) |
|---|---|
| MEASURE 1.1 | GL-02 |
| MEASURE 1.3 | SE-01, SE-10 |
| MEASURE 2.1 | GL-05, IS-02 |
| MEASURE 2.3 | GL-05 |
| MEASURE 2.4 | SE-12 |
| MEASURE 2.5 | GL-05, IS-07 |
| MEASURE 2.6 | IS-06 |
| MEASURE 2.7 | IS-01, IS-10, IS-11, IS-12, IS-14 |
| MEASURE 2.8 | IS-08, SE-08 |
| MEASURE 2.9 | GL-06, IS-08, SE-05, SE-11 |
| MEASURE 2.10 | EI-06, IS-03, IS-04 |
| MEASURE 2.11 | IS-05 |
| MEASURE 3.1 | GL-08, SE-12 |
| MEASURE 4.1 | SE-01 |

{{controls:IS-05,IS-07,IS-14,SE-12}}

## MANAGE

MANAGE covers prioritizing and responding to risks, strategies to maximize benefits and minimize negative impacts (including mechanisms to supersede, disengage or deactivate systems), managing third-party risk, and risk treatment including incident response, recovery and communication.

| AI RMF subcategory | VERITRAIL controls (indicative) |
|---|---|
| MANAGE 1.1 | GL-03 |
| MANAGE 1.2 | GL-07 |
| MANAGE 1.3 | GL-10 |
| MANAGE 1.4 | GL-10 |
| MANAGE 2.1 | GL-07 |
| MANAGE 2.2 | IS-11, IS-12, IS-13, IS-16 |
| MANAGE 2.3 | SE-04 |
| MANAGE 2.4 | GL-04, GL-09, IS-12, IS-15 |
| MANAGE 4.1 | GL-08, SE-08, SE-09 |
| MANAGE 4.2 | SE-03, SE-06 |
| MANAGE 4.3 | SE-04 |

{{controls:IS-12,IS-15,SE-04}}

## Known gaps in the mapping

Mapping coverage is uneven, and we would rather say so than imply completeness:

- **MANAGE 3 (third-party risk management)** has no direct mapping in v1.0.0. Third-party controls (AO-09, EI-08, GL-11, IS-10) currently map to GOVERN 6; organizations using the AI RMF as a reference should consider whether those controls also support MANAGE 3 outcomes in their context.
- Several subcategories — for example parts of GOVERN 3 and GOVERN 4, MAP 2.1, MEASURE 2.2 and MEASURE 2.12–2.13 — are not mapped. That does not mean they are irrelevant; it means VERITRAIL does not yet have a control whose objective clearly corresponds to them.
- The Generative AI Profile (NIST AI 600-1) is not mapped.

## Using the mapping in practice

1. **Choose your reference.** If the AI RMF is your organization's chosen reference, use the function view in the self-assessment's readiness indicators to see where self-reported practices are weakest.
2. **Implement through controls.** Work through VERITRAIL controls with owners and evidence rather than trying to "implement a subcategory".
3. **Evidence once, reuse often.** The same evidence for SE-08 or GL-02 supports NIST, ISO/IEC 42001 and EU AI Act readiness work.
4. **Profile your organization.** The AI RMF encourages organizations to build profiles for their context. VERITRAIL risk tiers and the [maturity model](/framework/maturity-model/) can inform your current and target profiles.

The self-assessment groups questions into GOVERN, MAP, MEASURE and MANAGE readiness indicators — see the [maturity model](/framework/maturity-model/). Browse full mappings per control in the [control library](/framework/controls/).

{{cta:assessment}}
