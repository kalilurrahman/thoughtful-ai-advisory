---
title: "EU AI Act readiness with AEGIS — obligations, roles and evidence"
h1: "EU AI Act readiness"
slug: /compliance/eu-ai-act/
description: "Prepare evidence for key EU AI Act obligation areas — risk management, data, documentation, logging, transparency, oversight, incidents — with AEGIS."
section: compliance
nav_label: "EU AI Act readiness"
nav_order: 40
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: assessment
faq:
  - q: "Can AEGIS tell us whether our AI system is high-risk under the EU AI Act?"
    a: "No. AEGIS captures the facts that matter for classification — domain, intended purpose, decision impact, affected parties — and flags regulatory relevance for legal review. Classification is a legal determination for your counsel."
  - q: "When do the EU AI Act obligations apply?"
    a: "The Regulation applies in stages. Applicability timelines must be verified against the current Official Journal text and any amendments, including the European Commission's 2025 Digital Omnibus proposals. AEGIS content has not been verified against post-2025 changes."
  - q: "We only use AI built by vendors. Does the Act affect us?"
    a: "Possibly. Deployers of high-risk AI systems have their own obligations, and some deployers can take on provider obligations — for example by substantially modifying a system. Your legal team should assess your role for each system."
updated: 2026-10-21
---

{{disclaimer}}

Regulation (EU) 2024/1689 — the EU AI Act — establishes harmonized rules for AI systems placed on the market, put into service or used in the EU. It takes a risk-based approach: certain practices are prohibited, high-risk AI systems carry extensive requirements, certain systems carry transparency obligations, general-purpose AI models have their own regime, and all providers and deployers have AI literacy obligations.

This page explains how AEGIS controls and evidence relate to the main obligation areas. It is a readiness guide, not legal advice. Whether and how the Act applies to a given system depends on facts and legal analysis that AEGIS does not perform.

## Important: verify timelines and current text

The Act applies in stages. As originally published in the Official Journal, the main milestones were: entry into force in August 2024; prohibited practices and AI literacy applying from February 2025; general-purpose AI model obligations from August 2025; most remaining provisions, including Annex III high-risk requirements and Article 50 transparency, from August 2026; and high-risk systems that are safety components of products covered by Annex I legislation from August 2027.

**These dates may have changed.** In 2025 the European Commission published "Digital Omnibus" proposals that would amend aspects of the AI Act, including the timing of high-risk obligations. Applicability timelines must be verified against the current Official Journal text and any adopted amendments. AEGIS has not verified post-2025 changes, and this page should not be relied on for dates.

## Provider or deployer? Start with roles

Obligations depend heavily on your role for each AI system:

| Role | Who it is, in short | Main obligations for high-risk systems |
|---|---|---|
| **Provider** | Develops an AI system (or has it developed) and places it on the market or puts it into service under its own name or trademark | Risk management, data governance, technical documentation, logging capability, transparency to deployers, human-oversight design, accuracy/robustness/cybersecurity, quality management system, conformity assessment, registration, post-market monitoring, serious incident reporting |
| **Deployer** | Uses an AI system under its authority in a professional context | Use according to instructions, assign competent human oversight, ensure relevant input data, monitor operation, keep logs under its control, inform affected workers and individuals where required, cooperate with authorities; certain deployers must carry out a fundamental rights impact assessment (Art. 27) |

A deployer, distributor or importer can **become a provider** — for example by putting its name or trademark on a high-risk system, making a substantial modification, or changing a system's intended purpose so that it becomes high-risk (Art. 25). AEGIS captures role per system and responsibility allocation with vendors (AO-09, EI-08, GL-11); the role determination itself is a legal question.

{{controls:AO-07,AO-09,EI-02,GL-11}}

## Obligation areas and AEGIS controls

The mapping below uses the article references in AEGIS Control Library v1.0.0. It is indicative: implementing the listed controls supports readiness work but does not by itself satisfy any article.

| Obligation area | Article | Applies chiefly to | AEGIS controls (indicative) | Evidence AEGIS helps you hold |
|---|---|---|---|---|
| AI literacy | Art. 4 | Providers and deployers | AO-05 | Role-based curriculum and completion records |
| Prohibited practices | Art. 5 | All operators | AO-10 | Prohibited/restricted use list; intake screening records |
| High-risk classification | Art. 6 | Providers (and deployers assessing role) | EI-02, EI-12, AO-07 | Classification facts; legal review records |
| Risk management system | Art. 9 | Providers of high-risk systems | AO-04, GL-01, GL-02, GL-03, GL-05, GL-10, GL-12, IS-06 | Risk assessments; approvals; residual-risk acceptance; periodic review |
| Data and data governance | Art. 10 | Providers of high-risk systems | EI-06, IS-02, IS-03, IS-04, IS-05 | Data source register; quality checks; bias testing; privacy assessment |
| Technical documentation | Art. 11 | Providers of high-risk systems | GL-06, EI-04, EI-05, EI-07, EI-10, SE-05 | Technical documentation pack; system profile; model and component registry |
| Record-keeping | Art. 12 | Providers (logging capability) | SE-08 | Log configuration; tamper-evidence; retention settings |
| Transparency to deployers | Art. 13 | Providers of high-risk systems | IS-08, SE-11, EI-04 | Instructions for use; capability and limitation statements |
| Human oversight | Art. 14 | Providers (design) and deployers (operation) | IS-09, IS-13, IS-11, IS-12, IS-15 | Oversight design; approval rules and records; kill-switch tests |
| Accuracy, robustness and cybersecurity | Art. 15 | Providers of high-risk systems | GL-05, IS-01, IS-07, IS-10, IS-11, IS-12, IS-14, IS-16, SE-12 | Validation results; adversarial test reports; threat models; drift monitoring |
| Quality management system | Art. 17 | Providers of high-risk systems | AO-01, AO-02, AO-12, SE-01, SE-07 | Policy; forum records; control testing; management review |
| Deployer obligations | Art. 26 | Deployers of high-risk systems | AO-03, EI-01, EI-03, GL-07, GL-08, IS-09, SE-04, SE-08 | Inventory; oversight assignments; monitoring; logs; incident records |
| Fundamental rights impact assessment | Art. 27 | Certain deployers | GL-02, AO-11 | Impact assessment; stakeholder input |
| Transparency for certain AI systems | Art. 50 | Providers and deployers of in-scope systems | IS-08 | Disclosure text and placement |
| Post-market monitoring | Art. 72 | Providers of high-risk systems | SE-09, GL-08, SE-12 | Monitoring plan; monitoring outputs |
| Serious incident reporting | Art. 73 | Providers (deployers inform providers) | SE-04 | Incident procedure; incident log; notification decision records |

{{controls:AO-05,AO-10,GL-02,IS-08,IS-09,SE-04,SE-08,SE-09}}

## What is not covered

- **General-purpose AI model obligations** (for GPAI model providers) are not mapped in Control Library v1.0.0. Organizations that provide GPAI models need separate analysis.
- **Conformity assessment procedures, CE marking and registration mechanics** are referenced only where an AEGIS control supports the underlying evidence (for example GL-03 and GL-04 relate to Art. 43; EI-01 to Art. 49).
- **Sector and product legislation** referenced by Annex I (for example medical devices or machinery) has its own requirements outside AEGIS's scope.
- **Penalties, authority procedures and national implementation** are outside AEGIS's scope.

## A readiness workflow

1. **Inventory and screen.** Register every AI system with EU exposure (EI-01) and screen against prohibited practices (AO-10).
2. **Capture classification facts.** Domain, purpose, decision impact, affected parties and autonomy for each system (EI-02, EI-04). Route potential high-risk and Article 50 cases to legal review (AO-07).
3. **Record your role.** Provider, deployer or both, per system; responsibility allocation with vendors (AO-09).
4. **Assess and close gaps** against the obligation areas relevant to your role, using the [gap-analysis method](/compliance/gap-analysis/).
5. **Operate and evidence.** Logging, oversight, monitoring, incident handling and documentation, maintained continuously.

The self-assessment produces indicative EU AI Act readiness indicators for selected themes (Art. 4, 9, 10, 11–12, 13 and 50, 14, 15, 72–73). The [EU AI Act readiness checker](/tools/eu-ai-act-readiness-checker/), which will go deeper by role, is planned.

{{cta:baseline}}
