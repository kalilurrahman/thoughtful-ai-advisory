---
title: "ISO/IEC 42001 readiness with VERITRAIL — clauses 4–10 and Annex A themes"
h1: "ISO/IEC 42001 and VERITRAIL"
slug: /compliance/iso-42001/
description: "How VERITRAIL controls support an ISO/IEC 42001 AI management system across clauses 4–10 and Annex A — indicative mappings for readiness, not certification."
section: compliance
nav_label: "ISO/IEC 42001"
nav_order: 30
template: page
schema_type: WebPage
primary_cta: baseline
secondary_cta: blueprint
faq:
  - q: "Can using VERITRAIL get us ISO/IEC 42001 certification?"
    a: "No tool can do that. Certification is a decision by an accredited certification body after an audit of your AI management system. VERITRAIL can help you implement controls and organize the evidence an auditor would expect, which is readiness work."
  - q: "Does VERITRAIL produce a Statement of Applicability?"
    a: "VERITRAIL can help you draft one by showing which Annex A controls your VERITRAIL controls relate to and what evidence exists. The Statement of Applicability, including justifications for inclusion and exclusion, remains your organization's document and decision."
updated: 2026-10-21
---

{{disclaimer}}

ISO/IEC 42001:2023 specifies requirements for establishing, implementing, maintaining and continually improving an **AI management system (AIMS)**. Like other ISO management-system standards, its clauses 4–10 follow the harmonized structure — context, leadership, planning, support, operation, performance evaluation and improvement — and Annex A provides a reference set of AI-specific controls that organizations consider when treating AI risks.

Organizations pursuing 42001 typically struggle less with understanding the standard than with operating it: keeping an AI inventory current, running impact assessments consistently, and retaining documented information that an auditor can sample. That is where VERITRAIL helps.

## Clauses 4–10

| Clause | Theme | How VERITRAIL supports it | VERITRAIL controls (indicative) |
|---|---|---|---|
| 4 Context of the organization | Internal and external issues, interested parties, AIMS scope | Obligations register, stakeholder engagement, inventory scope decisions | AO-07 (4.1, 4.2), AO-11 (4.2) |
| 5 Leadership | Leadership commitment, AI policy, roles and responsibilities | Policy template, governance forum, RACI and escalation | AO-01 (5.2), AO-02 (5.1, 5.3), AO-03 (5.3), AO-06 (5.3) |
| 6 Planning | AI risk assessment and treatment, AI system impact assessment, objectives, planning changes | Risk appetite and tiering, threat modelling, exceptions, impact assessment, objectives, change triggers | AO-04 (6.1.1, 6.1.2), EI-02 (6.1.2), IS-01 (6.1.2), GL-10 (6.1.3), GL-02 (6.1.4), AO-08 (6.2), GL-04 (6.3) |
| 7 Support | Resources, competence, awareness, documented information | Resourcing, role-based AI literacy, inventory, technical documentation, evidence repository | AO-12 (7.1), AO-05 (7.2, 7.3), EI-01, GL-06, SE-02, SE-05 (7.5) |
| 8 Operation | Operational planning and control, risk assessment and treatment in operation, impact assessment | Intake triage, approval gates, pre-deployment assessment | GL-01, GL-03 (8.1), GL-02 (8.4) |
| 9 Performance evaluation | Monitoring and measurement, internal audit, management review | Monitoring, control testing, KPIs, internal audit, management review, recertification | GL-08, SE-01, SE-03, SE-09, EI-11 (9.1); SE-01, SE-05, SE-10 (9.2); SE-07, SE-03, GL-12 (9.3) |
| 10 Improvement | Continual improvement, nonconformity and corrective action | Corrective action register, incident lessons learned | SE-06 (10.1, 10.2), SE-04 (10.2) |

{{controls:AO-01,AO-02,GL-02,SE-01,SE-06,SE-07}}

## Annex A themes

| Annex A area | Theme | VERITRAIL controls (indicative) |
|---|---|---|
| A.2 | Policies related to AI | AO-01, AO-10 |
| A.3 | Internal organization (roles, reporting of concerns) | AO-02, AO-03, AO-06, EI-03 |
| A.4 | Resources for AI systems (data, tooling, system and computing, human resources) | AO-05, AO-12, EI-01, EI-05, EI-06, EI-07, EI-09, EI-10, IS-11, IS-16 |
| A.5 | Assessing impacts of AI systems | EI-02, EI-12, GL-02, IS-03, IS-05, IS-06 |
| A.6 | AI system life cycle (objectives, design, verification and validation, deployment, operation and monitoring, technical documentation, event logs) | AO-08, EI-04, EI-05, EI-07, EI-10, EI-12, GL-01, GL-03 to GL-09, IS-01, IS-04, IS-07, IS-09 to IS-16, SE-08, SE-09, SE-12 |
| A.7 | Data for AI systems (quality, provenance, preparation) | EI-06, IS-02, IS-03, IS-04, IS-05 |
| A.8 | Information for interested parties (system documentation, reporting of incidents, communication) | AO-11, IS-08, SE-04, SE-11 |
| A.9 | Use of AI systems (responsible use processes, objectives, intended use) | AO-08, AO-10, EI-04, IS-09, IS-13 |
| A.10 | Third-party and customer relationships | AO-09, EI-03, EI-08, GL-11, IS-10 |

The Annex A.6.2.6 reference (AI system operation and monitoring) is the most heavily mapped in the VERITRAIL library — twelve controls relate to it, including runtime guardrails, human approval and the kill switch. This reflects how much of the operational burden for generative and agentic AI falls in that area.

## A practical readiness path

1. **Define AIMS scope.** Decide which organizational units, AI systems and roles (developer, provider, user) are in scope, using the inventory (EI-01) and obligations register (AO-07).
2. **Establish leadership elements.** Policy (AO-01), forum (AO-02), roles (AO-03), objectives (AO-08).
3. **Run risk and impact assessment.** Apply tiering (EI-02) and tier-proportionate assessment (GL-02) across in-scope systems.
4. **Draft the Statement of Applicability.** Use VERITRAIL mappings as a starting point to identify relevant Annex A controls and existing evidence; your organization decides and justifies inclusions and exclusions.
5. **Operate and evidence.** Run lifecycle gates, monitoring and runtime controls; retain documented information (SE-02).
6. **Evaluate and improve.** Control testing (SE-01), internal audit (SE-10), management review (SE-07), corrective action (SE-06).
7. **Engage a certification body** if certification is your goal. VERITRAIL evidence packs can support the audit; the decision is the auditor's.

## Limitations

The VERITRAIL mappings refer to clause and Annex A identifiers only. ISO/IEC 42001 is a copyrighted standard; you need a licensed copy to interpret its requirements, and the companion guidance in ISO/IEC 42005 (impact assessment) and ISO/IEC 23894 (AI risk management) may also be relevant. Mappings are indicative and reviewed quarterly.

The self-assessment groups questions into indicative readiness indicators for clauses 4–10 — see the [maturity model](/framework/maturity-model/) — and every control's mappings are listed in the [control library](/framework/controls/).

{{cta:baseline}}
