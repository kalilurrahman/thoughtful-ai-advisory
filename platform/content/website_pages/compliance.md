---
title: "AI governance readiness: NIST AI RMF, ISO/IEC 42001, EU AI Act"
h1: "Compliance readiness, without compliance claims"
slug: /compliance/
description: "How VERITRAIL helps organize evidence against NIST AI RMF, ISO/IEC 42001 and the EU AI Act — indicative mappings, a gap-analysis method and honest limits."
section: compliance
nav_label: "Compliance overview"
nav_order: 10
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: assessment
faq:
  - q: "Can VERITRAIL certify us against ISO/IEC 42001?"
    a: "No. Certification against ISO/IEC 42001 is performed by accredited certification bodies. VERITRAIL helps you implement controls and organize the evidence an auditor would expect to see."
  - q: "Are VERITRAIL framework mappings official?"
    a: "No. They are VERITRAIL's indicative interpretation, maintained in the versioned control library. They are not published or endorsed by NIST, ISO or the European Commission, and they do not establish conformity or compliance."
updated: 2026-10-21
---

{{disclaimer}}

AI governance obligations and expectations are arriving from several directions at once: voluntary frameworks such as the NIST AI Risk Management Framework, certifiable management-system standards such as ISO/IEC 42001, and binding law such as the EU AI Act — alongside sector rules, data-protection law and customer contracts. Each uses different language and a different unit of analysis.

VERITRAIL takes a deliberately modest position in this landscape. We help you **implement controls and collect evidence** in one structure, and we show how that structure relates to each framework. We do not make compliance determinations, and we are wary of any tool that claims to.

## What VERITRAIL provides

| Capability | What it gives you | What it does not do |
|---|---|---|
| Control library with indicative mappings | Each of the 64 VERITRAIL controls maps to NIST AI RMF subcategories, ISO/IEC 42001 clauses and Annex A controls, and EU AI Act articles | Replace the source text, legal interpretation or an official crosswalk |
| Readiness indicators | Self-assessment answers grouped by framework area and banded Limited, Partial or Substantial | Measure conformity or compliance |
| Gap analysis method | Findings with severity, evidence labels, owners and SLAs | Decide legal applicability |
| Evidence packs | Per-system bundles of labelled evidence | Attest that evidence satisfies a given auditor or authority |

## Framework guides

- **[NIST AI RMF](/compliance/nist-ai-rmf/)** — how VERITRAIL controls relate to the GOVERN, MAP, MEASURE and MANAGE functions.
- **[ISO/IEC 42001](/compliance/iso-42001/)** — how VERITRAIL supports an AI management system across clauses 4–10 and Annex A themes.
- **[EU AI Act readiness](/compliance/eu-ai-act/)** — key obligation areas, the provider/deployer distinction, and how VERITRAIL evidence relates to them.
- **[Gap analysis method](/compliance/gap-analysis/)** — severity, evidence status, SLAs and workflow.

## One control, many frameworks

The value of a unified control library is that one piece of evidence can support several frameworks. Consider SE-08 (immutable action logging):

| Framework | Indicative mapping for SE-08 |
|---|---|
| NIST AI RMF | MEASURE 2.8, MANAGE 4.1 |
| ISO/IEC 42001 | Annex A.6.2.8 |
| EU AI Act | Art. 12 (record-keeping), Art. 19, Art. 26 |

{{controls:SE-08}}

Implementing tamper-evident logging once, and evidencing it once, supports readiness work in all three. The same is true of the inventory (EI-01), pre-deployment assessment (GL-02) and human oversight (IS-09).

## How to read a mapping

A mapping says "this VERITRAIL control is relevant to this framework reference". It does not say "implementing this control satisfies that reference". Framework requirements often have conditions, scope limits and details that a short control objective cannot capture. Read [Readiness is not compliance: how to read framework mappings](/resources/blog/readiness-is-not-compliance/) for a longer discussion.

## Regulatory change

Regulatory texts and their application dates change. For the EU AI Act in particular, applicability timelines must be verified against the current Official Journal text and any amendments, including the European Commission's 2025 "Digital Omnibus" proposals. VERITRAIL content has not been verified against post-2025 changes; our control library is versioned and reviewed quarterly, and every citation states the library version.

## Where to start

If you need to understand your position against these frameworks, start with the [maturity self-assessment](/tools/maturity-assessment/) for indicative readiness indicators, then validate them with evidence in a [Governance Baseline](/contact/book-governance-baseline/).

{{cta:baseline}}
