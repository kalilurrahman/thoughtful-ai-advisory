---
title: "VERITRAIL Compliance Mapping — NIST AI RMF, ISO/IEC 42001, EU AI Act"
generated: 2026-10-21
source: content/controls/controls.yaml (VERITRAIL-CTRL-LIB v1.0.0)
generator: docs/tools/gen_compliance_mapping.py
owner: VERITRAIL Governance Content Lead
---

# VERITRAIL Compliance Mapping

<!-- GENERATED FILE — do not edit by hand. Run: python3 docs/tools/gen_compliance_mapping.py -->

> **IMPORTANT — READ FIRST**
>
> VERITRAIL supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.
>
> Framework mappings are indicative VERITRAIL interpretations to support governance readiness and evidence collection. They do not constitute legal advice, a certification, or a determination of conformity with ISO/IEC 42001 or compliance with the EU AI Act or any other law.
>
> - This crosswalk is VERITRAIL's own indicative interpretation. It is **not** an official crosswalk published by
>   NIST, ISO/IEC or the European Commission.
> - A mapping means an VERITRAIL control *can produce evidence relevant to* a framework element. It does **not** mean
>   that implementing the control satisfies that element.
> - **EU AI Act timelines:** applicability dates must be verified against the current Official Journal text of
>   Regulation (EU) 2024/1689 and any amendments. The Commission's 2025 "Digital Omnibus" proposals may change
>   high-risk timelines; their status has **not been verified in this repository**.
> - Jurisdiction- and sector-specific use requires qualified legal review.

## Contents

1. Methodology
2. Summary statistics
3. NIST AI RMF 1.0 crosswalk (by function)
4. ISO/IEC 42001:2023 crosswalk (clauses and Annex A)
5. EU AI Act crosswalk (by article)
6. Control-by-control matrix
7. Coverage gaps — what VERITRAIL does not cover
8. EU AI Act applicability timeline — verification required
9. Maintenance

## 1. Methodology

1. **Single source.** Every table below is generated from the `mappings` field of the 64 controls in
   `content/controls/controls.yaml` (library VERITRAIL-CTRL-LIB v1.0.0, effective 2026-10-21).
   No mapping appears here that is not in that file.
2. **Mapping basis.** A control is mapped to a framework element when the control's objective and evidence
   would be relevant to demonstrating the practice described by that element. Mappings were authored by the VERITRAIL
   Governance Content Lead and are subject to quarterly review.
3. **References.** NIST AI RMF references use AI 100-1 (AI RMF 1.0) subcategory identifiers; ISO/IEC 42001
   references use clause numbers and Annex A control identifiers of the 2023 edition; EU AI Act references use
   article numbers of Regulation (EU) 2024/1689. No standard text is reproduced. Users should consult their
   licensed copy of ISO/IEC 42001 and the official EU AI Act text.
4. **Many-to-many.** One control can map to several framework elements and vice versa. Coverage counts
   indicate breadth of evidence support, not depth or sufficiency.
5. **Gap analysis.** Framework elements not referenced by any control are listed in §7 together with areas that
   VERITRAIL deliberately does not cover. Reference lists used for gap analysis are compiled from the published
   structures and should be checked against official copies.
6. **Readiness indicators.** The self-assessment's framework readiness indicators
   (`maturity_self_assessment.yaml` → `readiness_groups`) are a separate, coarser grouping of questions and are
   also indicative only.

## 2. Summary statistics

| Measure | Value |
|---|---|
| VERITRAIL controls | 64 |
| Controls with ≥1 NIST AI RMF mapping | 64 |
| Controls with ≥1 ISO/IEC 42001 mapping | 64 |
| Controls with ≥1 EU AI Act mapping | 58 |
| NIST AI RMF subcategories referenced | 54 of 72 |
| ISO/IEC 42001 clauses/sub-clauses referenced | 23 of 28 in reference list |
| ISO/IEC 42001 Annex A controls referenced | 37 of 38 in reference list |
| EU AI Act articles referenced | 22 |

## 3. NIST AI RMF 1.0 crosswalk (by function)

Source: NIST AI 100-1. Voluntary framework; "alignment" here means VERITRAIL controls can produce evidence relevant
to the subcategory.

### GOVERN

*Cultivate a culture of risk management; policies, accountability, workforce, third parties.* — 17 of 19 subcategories referenced.

| Subcategory | VERITRAIL controls | Control titles |
|---|---|---|
| GOVERN 1.1 | AO-01, AO-07, AO-10 | AO-01 AI governance policy; AO-07 Regulatory and contractual obligations register; AO-10 Prohibited and restricted AI use policy |
| GOVERN 1.2 | AO-01, AO-08 | AO-01 AI governance policy; AO-08 Responsible AI principles and objectives |
| GOVERN 1.3 | AO-04, EI-02 | AO-04 AI risk appetite and tolerance; EI-02 AI risk classification and tiering |
| GOVERN 1.4 | AO-12, GL-03, GL-04, SE-02, SE-05 | AO-12 Governance resourcing; GL-03 Risk-tiered approval gates; GL-04 Change management and reassessment triggers; SE-02 Evidence repository and retention; SE-05 Audit-ready evidence packs |
| GOVERN 1.5 | EI-11, GL-12, SE-03, SE-07 | EI-11 Inventory attestation and recertification; GL-12 Periodic review and recertification; SE-03 Governance metrics and leadership reporting; SE-07 Management review |
| GOVERN 1.6 | EI-01, EI-05, EI-07, EI-09 | EI-01 Enterprise AI inventory (system of record); EI-05 Model, prompt and component registry; EI-07 Agent and tool registry; EI-09 Shadow AI discovery |
| GOVERN 1.7 | GL-09 | GL-09 Retirement and decommissioning |
| GOVERN 2.1 | AO-02, AO-03, AO-06, EI-03 | AO-02 Executive accountability and AI governance forum; AO-03 AI roles, responsibilities and RACI; AO-06 Escalation paths and decision rights; EI-03 Accountable owner per AI system |
| GOVERN 2.2 | AO-05 | AO-05 AI literacy and role-based training |
| GOVERN 2.3 | AO-02 | AO-02 Executive accountability and AI governance forum |
| GOVERN 3.2 | IS-09, IS-13 | IS-09 Human oversight design; IS-13 Human approval for high-impact actions |
| GOVERN 4.2 | SE-11 | SE-11 Stakeholder transparency reporting |
| GOVERN 4.3 | AO-06 | AO-06 Escalation paths and decision rights |
| GOVERN 5.1 | AO-11 | AO-11 Stakeholder engagement and feedback |
| GOVERN 5.2 | AO-11 | AO-11 Stakeholder engagement and feedback |
| GOVERN 6.1 | AO-09, EI-08, GL-11, IS-10 | AO-09 Third-party AI accountability; EI-08 Third-party and vendor AI inventory; GL-11 Vendor AI due diligence and contract controls; IS-10 Secure model and prompt supply chain |
| GOVERN 6.2 | AO-09 | AO-09 Third-party AI accountability |

### MAP

*Establish context, categorize the AI system, and identify risks and impacts.* — 12 of 18 subcategories referenced.

| Subcategory | VERITRAIL controls | Control titles |
|---|---|---|
| MAP 1.1 | AO-10, EI-02, EI-04, EI-12, GL-01, GL-02, IS-03 | AO-10 Prohibited and restricted AI use policy; EI-02 AI risk classification and tiering; EI-04 Intended purpose and context of use; EI-12 Use-case intake register; GL-01 Intake triage workflow; GL-02 Pre-deployment risk and impact assessment; IS-03 Privacy assessment and data minimisation |
| MAP 1.2 | EI-04 | EI-04 Intended purpose and context of use |
| MAP 1.5 | AO-04, EI-02 | AO-04 AI risk appetite and tolerance; EI-02 AI risk classification and tiering |
| MAP 1.6 | GL-01 | GL-01 Intake triage workflow |
| MAP 2.2 | GL-06 | GL-06 Technical documentation |
| MAP 2.3 | EI-06, IS-02 | EI-06 Data source and lineage registry; IS-02 Data governance and quality |
| MAP 3.1 | GL-02 | GL-02 Pre-deployment risk and impact assessment |
| MAP 3.4 | EI-04 | EI-04 Intended purpose and context of use |
| MAP 3.5 | IS-09 | IS-09 Human oversight design |
| MAP 4.1 | EI-05, EI-07, EI-10, GL-11 | EI-05 Model, prompt and component registry; EI-07 Agent and tool registry; EI-10 Dependency and integration mapping; GL-11 Vendor AI due diligence and contract controls |
| MAP 4.2 | EI-10 | EI-10 Dependency and integration mapping |
| MAP 5.1 | GL-02, IS-01, IS-06 | GL-02 Pre-deployment risk and impact assessment; IS-01 AI threat modelling; IS-06 Safety and harm evaluation |

### MEASURE

*Analyze, assess, benchmark and monitor AI risks and trustworthiness characteristics.* — 14 of 22 subcategories referenced.

| Subcategory | VERITRAIL controls | Control titles |
|---|---|---|
| MEASURE 1.1 | GL-02 | GL-02 Pre-deployment risk and impact assessment |
| MEASURE 1.3 | SE-01, SE-10 | SE-01 Control testing programme; SE-10 Independent review and internal audit |
| MEASURE 2.1 | GL-05, IS-02 | GL-05 Pre-release validation and testing; IS-02 Data governance and quality |
| MEASURE 2.3 | GL-05 | GL-05 Pre-release validation and testing |
| MEASURE 2.4 | SE-12 | SE-12 Model performance and drift monitoring |
| MEASURE 2.5 | GL-05, IS-07 | GL-05 Pre-release validation and testing; IS-07 Accuracy and robustness testing |
| MEASURE 2.6 | IS-06 | IS-06 Safety and harm evaluation |
| MEASURE 2.7 | IS-01, IS-10, IS-11, IS-12, IS-14 | IS-01 AI threat modelling; IS-10 Secure model and prompt supply chain; IS-11 Least-privilege tool access; IS-12 Runtime guardrails and policy enforcement; IS-14 Prompt-injection and data-leakage testing |
| MEASURE 2.8 | IS-08, SE-08 | IS-08 Transparency and AI disclosures; SE-08 Immutable action logging |
| MEASURE 2.9 | GL-06, IS-08, SE-05, SE-11 | GL-06 Technical documentation; IS-08 Transparency and AI disclosures; SE-05 Audit-ready evidence packs; SE-11 Stakeholder transparency reporting |
| MEASURE 2.10 | EI-06, IS-03, IS-04 | EI-06 Data source and lineage registry; IS-03 Privacy assessment and data minimisation; IS-04 Sensitive data redaction and masking |
| MEASURE 2.11 | IS-05 | IS-05 Bias and fairness testing |
| MEASURE 3.1 | GL-08, SE-12 | GL-08 Post-deployment monitoring; SE-12 Model performance and drift monitoring |
| MEASURE 4.1 | SE-01 | SE-01 Control testing programme |

### MANAGE

*Prioritize, respond to and treat risks; monitor, recover and communicate.* — 11 of 13 subcategories referenced.

| Subcategory | VERITRAIL controls | Control titles |
|---|---|---|
| MANAGE 1.1 | GL-03 | GL-03 Risk-tiered approval gates |
| MANAGE 1.2 | GL-07 | GL-07 Deployment conditions and go-live readiness |
| MANAGE 1.3 | GL-10 | GL-10 Exceptions and risk acceptance |
| MANAGE 1.4 | GL-10 | GL-10 Exceptions and risk acceptance |
| MANAGE 2.1 | GL-07 | GL-07 Deployment conditions and go-live readiness |
| MANAGE 2.2 | IS-11, IS-12, IS-13, IS-16 | IS-11 Least-privilege tool access; IS-12 Runtime guardrails and policy enforcement; IS-13 Human approval for high-impact actions; IS-16 Rate, budget and resource limits |
| MANAGE 2.3 | SE-04 | SE-04 AI incident management and reporting |
| MANAGE 2.4 | GL-04, GL-09, IS-12, IS-15 | GL-04 Change management and reassessment triggers; GL-09 Retirement and decommissioning; IS-12 Runtime guardrails and policy enforcement; IS-15 Kill switch and rollback |
| MANAGE 4.1 | GL-08, SE-08, SE-09 | GL-08 Post-deployment monitoring; SE-08 Immutable action logging; SE-09 Post-market monitoring plan |
| MANAGE 4.2 | SE-03, SE-06 | SE-03 Governance metrics and leadership reporting; SE-06 Corrective action and continuous improvement |
| MANAGE 4.3 | SE-04 | SE-04 AI incident management and reporting |

## 4. ISO/IEC 42001:2023 crosswalk

Clause references are to the management-system requirements (Clauses 4–10); Annex A references are to reference
controls. Certification against ISO/IEC 42001 can only be granted by an accredited certification body.

### 4.1 Clauses 4–10

| Clause | Clause title | Sub-clause | VERITRAIL controls | Control titles |
|---|---|---|---|---|
| 4 | Context of the organization | 4.1 | AO-07 | AO-07 Regulatory and contractual obligations register |
| 4 | Context of the organization | 4.2 | AO-07, AO-11 | AO-07 Regulatory and contractual obligations register; AO-11 Stakeholder engagement and feedback |
| 5 | Leadership | 5.1 | AO-02 | AO-02 Executive accountability and AI governance forum |
| 5 | Leadership | 5.2 | AO-01 | AO-01 AI governance policy |
| 5 | Leadership | 5.3 | AO-02, AO-03, AO-06 | AO-02 Executive accountability and AI governance forum; AO-03 AI roles, responsibilities and RACI; AO-06 Escalation paths and decision rights |
| 6 | Planning | 6.1 | AO-07 | AO-07 Regulatory and contractual obligations register |
| 6 | Planning | 6.1.1 | AO-04 | AO-04 AI risk appetite and tolerance |
| 6 | Planning | 6.1.2 | AO-04, EI-02, IS-01 | AO-04 AI risk appetite and tolerance; EI-02 AI risk classification and tiering; IS-01 AI threat modelling |
| 6 | Planning | 6.1.3 | GL-10 | GL-10 Exceptions and risk acceptance |
| 6 | Planning | 6.1.4 | GL-02 | GL-02 Pre-deployment risk and impact assessment |
| 6 | Planning | 6.2 | AO-08 | AO-08 Responsible AI principles and objectives |
| 6 | Planning | 6.3 | GL-04 | GL-04 Change management and reassessment triggers |
| 7 | Support | 7.1 | AO-12 | AO-12 Governance resourcing |
| 7 | Support | 7.2 | AO-05 | AO-05 AI literacy and role-based training |
| 7 | Support | 7.3 | AO-05 | AO-05 AI literacy and role-based training |
| 7 | Support | 7.5 | EI-01, GL-06, SE-02, SE-05 | EI-01 Enterprise AI inventory (system of record); GL-06 Technical documentation; SE-02 Evidence repository and retention; SE-05 Audit-ready evidence packs |
| 8 | Operation | 8.1 | GL-01, GL-03 | GL-01 Intake triage workflow; GL-03 Risk-tiered approval gates |
| 8 | Operation | 8.4 | GL-02 | GL-02 Pre-deployment risk and impact assessment |
| 9 | Performance evaluation | 9.1 | EI-11, GL-08, SE-01, SE-03, SE-09 | EI-11 Inventory attestation and recertification; GL-08 Post-deployment monitoring; SE-01 Control testing programme; SE-03 Governance metrics and leadership reporting; SE-09 Post-market monitoring plan |
| 9 | Performance evaluation | 9.2 | SE-01, SE-05, SE-10 | SE-01 Control testing programme; SE-05 Audit-ready evidence packs; SE-10 Independent review and internal audit |
| 9 | Performance evaluation | 9.3 | GL-12, SE-03, SE-07 | GL-12 Periodic review and recertification; SE-03 Governance metrics and leadership reporting; SE-07 Management review |
| 10 | Improvement | 10.1 | SE-06 | SE-06 Corrective action and continuous improvement |
| 10 | Improvement | 10.2 | SE-04, SE-06 | SE-04 AI incident management and reporting; SE-06 Corrective action and continuous improvement |

### 4.2 Annex A reference controls

| Annex A group | Group title | Control | VERITRAIL controls | Control titles |
|---|---|---|---|---|
| A.2 | Policies related to AI | A.2.2 | AO-01, AO-10 | AO-01 AI governance policy; AO-10 Prohibited and restricted AI use policy |
| A.2 | Policies related to AI | A.2.4 | AO-01 | AO-01 AI governance policy |
| A.3 | Internal organization | A.3.2 | AO-02, AO-03, EI-03 | AO-02 Executive accountability and AI governance forum; AO-03 AI roles, responsibilities and RACI; EI-03 Accountable owner per AI system |
| A.3 | Internal organization | A.3.3 | AO-06 | AO-06 Escalation paths and decision rights |
| A.4 | Resources for AI systems | A.4.2 | AO-12, EI-01, EI-09 | AO-12 Governance resourcing; EI-01 Enterprise AI inventory (system of record); EI-09 Shadow AI discovery |
| A.4 | Resources for AI systems | A.4.3 | EI-06 | EI-06 Data source and lineage registry |
| A.4 | Resources for AI systems | A.4.4 | EI-05, EI-07, IS-11 | EI-05 Model, prompt and component registry; EI-07 Agent and tool registry; IS-11 Least-privilege tool access |
| A.4 | Resources for AI systems | A.4.5 | EI-10, IS-16 | EI-10 Dependency and integration mapping; IS-16 Rate, budget and resource limits |
| A.4 | Resources for AI systems | A.4.6 | AO-05 | AO-05 AI literacy and role-based training |
| A.5 | Assessing impacts of AI systems | A.5.2 | EI-02, EI-12, GL-02 | EI-02 AI risk classification and tiering; EI-12 Use-case intake register; GL-02 Pre-deployment risk and impact assessment |
| A.5 | Assessing impacts of AI systems | A.5.3 | GL-02 | GL-02 Pre-deployment risk and impact assessment |
| A.5 | Assessing impacts of AI systems | A.5.4 | GL-02, IS-03, IS-05, IS-06 | GL-02 Pre-deployment risk and impact assessment; IS-03 Privacy assessment and data minimisation; IS-05 Bias and fairness testing; IS-06 Safety and harm evaluation |
| A.5 | Assessing impacts of AI systems | A.5.5 | IS-06 | IS-06 Safety and harm evaluation |
| A.6 | AI system life cycle | A.6.1.2 | AO-08 | AO-08 Responsible AI principles and objectives |
| A.6 | AI system life cycle | A.6.1.3 | EI-12, GL-01, IS-01 | EI-12 Use-case intake register; GL-01 Intake triage workflow; IS-01 AI threat modelling |
| A.6 | AI system life cycle | A.6.2.2 | EI-04 | EI-04 Intended purpose and context of use |
| A.6 | AI system life cycle | A.6.2.3 | EI-05, EI-07, EI-10, GL-06, IS-10 | EI-05 Model, prompt and component registry; EI-07 Agent and tool registry; EI-10 Dependency and integration mapping; GL-06 Technical documentation; IS-10 Secure model and prompt supply chain |
| A.6 | AI system life cycle | A.6.2.4 | GL-05, IS-07, IS-14 | GL-05 Pre-release validation and testing; IS-07 Accuracy and robustness testing; IS-14 Prompt-injection and data-leakage testing |
| A.6 | AI system life cycle | A.6.2.5 | GL-03, GL-07 | GL-03 Risk-tiered approval gates; GL-07 Deployment conditions and go-live readiness |
| A.6 | AI system life cycle | A.6.2.6 | GL-04, GL-08, GL-09, IS-04, IS-09, IS-11, IS-12, IS-13, IS-15, IS-16, SE-09, SE-12 | GL-04 Change management and reassessment triggers; GL-08 Post-deployment monitoring; GL-09 Retirement and decommissioning; IS-04 Sensitive data redaction and masking; IS-09 Human oversight design; IS-11 Least-privilege tool access; IS-12 Runtime guardrails and policy enforcement; IS-13 Human approval for high-impact actions; IS-15 Kill switch and rollback; IS-16 Rate, budget and resource limits; SE-09 Post-market monitoring plan; SE-12 Model performance and drift monitoring |
| A.6 | AI system life cycle | A.6.2.7 | GL-06 | GL-06 Technical documentation |
| A.6 | AI system life cycle | A.6.2.8 | SE-08 | SE-08 Immutable action logging |
| A.7 | Data for AI systems | A.7.2 | IS-02 | IS-02 Data governance and quality |
| A.7 | Data for AI systems | A.7.3 | IS-02 | IS-02 Data governance and quality |
| A.7 | Data for AI systems | A.7.4 | IS-02, IS-03, IS-04, IS-05 | IS-02 Data governance and quality; IS-03 Privacy assessment and data minimisation; IS-04 Sensitive data redaction and masking; IS-05 Bias and fairness testing |
| A.7 | Data for AI systems | A.7.5 | EI-06 | EI-06 Data source and lineage registry |
| A.7 | Data for AI systems | A.7.6 | IS-02 | IS-02 Data governance and quality |
| A.8 | Information for interested parties of AI systems | A.8.2 | IS-08, SE-11 | IS-08 Transparency and AI disclosures; SE-11 Stakeholder transparency reporting |
| A.8 | Information for interested parties of AI systems | A.8.3 | AO-11 | AO-11 Stakeholder engagement and feedback |
| A.8 | Information for interested parties of AI systems | A.8.4 | SE-04 | SE-04 AI incident management and reporting |
| A.8 | Information for interested parties of AI systems | A.8.5 | AO-11, IS-08, SE-11 | AO-11 Stakeholder engagement and feedback; IS-08 Transparency and AI disclosures; SE-11 Stakeholder transparency reporting |
| A.9 | Use of AI systems | A.9.2 | IS-09, IS-13 | IS-09 Human oversight design; IS-13 Human approval for high-impact actions |
| A.9 | Use of AI systems | A.9.3 | AO-08 | AO-08 Responsible AI principles and objectives |
| A.9 | Use of AI systems | A.9.4 | AO-10, EI-04 | AO-10 Prohibited and restricted AI use policy; EI-04 Intended purpose and context of use |
| A.10 | Third-party and customer relationships | A.10.2 | AO-09, EI-03 | AO-09 Third-party AI accountability; EI-03 Accountable owner per AI system |
| A.10 | Third-party and customer relationships | A.10.3 | AO-09, EI-08, GL-11, IS-10 | AO-09 Third-party AI accountability; EI-08 Third-party and vendor AI inventory; GL-11 Vendor AI due diligence and contract controls; IS-10 Secure model and prompt supply chain |
| A.10 | Third-party and customer relationships | A.10.4 | GL-11 | GL-11 Vendor AI due diligence and contract controls |

## 5. EU AI Act crosswalk (by article)

Regulation (EU) 2024/1689. Many articles apply only to specific roles (provider, deployer, importer,
distributor) and to specific risk categories; whether an article applies to a given organization or system is a
legal determination. The "VERITRAIL support boundary" column states where VERITRAIL support stops.

| Article | Title | VERITRAIL controls | VERITRAIL support boundary |
|---|---|---|---|
| Art. 4 | AI literacy | AO-05 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 5 | Prohibited AI practices | AO-10 | Supports screening of use cases against a prohibited/restricted list. Whether a practice is prohibited is a legal determination. |
| Art. 6 | Classification rules for high-risk AI systems | AO-07, EI-02, EI-12 | Supports classification evidence and intake triage. VERITRAIL risk tiers are not the legal high-risk classification. |
| Art. 9 | Risk management system | AO-04, GL-01, GL-02, GL-03, GL-05, GL-10, GL-12, IS-06 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 10 | Data and data governance | EI-06, IS-02, IS-03, IS-04, IS-05 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 11 | Technical documentation | EI-04, EI-05, EI-07, EI-10, GL-06, SE-05 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 12 | Record-keeping | SE-08 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 13 | Transparency and provision of information to deployers | EI-04, IS-08, SE-11 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 14 | Human oversight | IS-09, IS-11, IS-12, IS-13, IS-15 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 15 | Accuracy, robustness and cybersecurity | GL-05, IS-01, IS-07, IS-10, IS-11, IS-12, IS-14, IS-16, SE-12 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 17 | Quality management system | AO-01, AO-02, AO-12, SE-01, SE-07 | Supports governance-policy, forum and testing evidence that can feed a provider's quality management system; does not constitute a QMS. |
| Art. 18 | Documentation keeping | SE-02, SE-05 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 19 | Automatically generated logs | SE-02, SE-08 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 20 | Corrective actions and duty of information | SE-06 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 25 | Responsibilities along the AI value chain | AO-09, EI-08, GL-11 | Supports documenting role allocation and vendor accountability; role determination (provider/deployer/etc.) requires counsel. |
| Art. 26 | Obligations of deployers of high-risk AI systems | AO-01, AO-03, AO-06, AO-07, AO-09, EI-01, EI-03, GL-07, GL-08, IS-09, SE-04, SE-08 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 27 | Fundamental rights impact assessment for high-risk AI systems | AO-11, GL-02 | Supports impact-assessment workflow and stakeholder input; the FRIA content and any notification obligations must be confirmed by counsel. |
| Art. 43 | Conformity assessment | GL-03, GL-04 | Supports internal approval gates and change control that produce evidence a conformity assessment may use. VERITRAIL does NOT perform conformity assessment and is not a notified body. |
| Art. 49 | Registration | EI-01 | Inventory data can help prepare registration information. VERITRAIL does NOT register systems in the EU database. |
| Art. 50 | Transparency obligations for providers and deployers of certain AI systems | IS-08 | Evidence support only; applicability and sufficiency require legal review. |
| Art. 72 | Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems | GL-08, SE-09, SE-12 | Supports monitoring plans and monitoring evidence; provider post-market monitoring obligations remain with the provider. |
| Art. 73 | Reporting of serious incidents | SE-04 | Supports incident detection, triage and records; it does not file serious-incident reports with authorities. |

Controls with no EU AI Act mapping (good practice not tied to a specific article): AO-08, EI-09, EI-11, GL-09, SE-03, SE-10.

## 6. Control-by-control matrix

| Control | Title | Pillar | NIST AI RMF | ISO/IEC 42001 | EU AI Act |
|---|---|---|---|---|---|
| AO-01 | AI governance policy | Accountability & Operating Model | GOVERN 1.1, GOVERN 1.2 | 5.2, A.2.2, A.2.4 | Art. 17, Art. 26 |
| AO-02 | Executive accountability and AI governance forum | Accountability & Operating Model | GOVERN 2.1, GOVERN 2.3 | 5.1, 5.3, A.3.2 | Art. 17 |
| AO-03 | AI roles, responsibilities and RACI | Accountability & Operating Model | GOVERN 2.1 | 5.3, A.3.2 | Art. 26 |
| AO-04 | AI risk appetite and tolerance | Accountability & Operating Model | GOVERN 1.3, MAP 1.5 | 6.1.1, 6.1.2 | Art. 9 |
| AO-05 | AI literacy and role-based training | Accountability & Operating Model | GOVERN 2.2 | 7.2, 7.3, A.4.6 | Art. 4 |
| AO-06 | Escalation paths and decision rights | Accountability & Operating Model | GOVERN 2.1, GOVERN 4.3 | 5.3, A.3.3 | Art. 26 |
| AO-07 | Regulatory and contractual obligations register | Accountability & Operating Model | GOVERN 1.1 | 4.1, 4.2, 6.1 | Art. 6, Art. 26 |
| AO-08 | Responsible AI principles and objectives | Accountability & Operating Model | GOVERN 1.2 | 6.2, A.6.1.2, A.9.3 | — |
| AO-09 | Third-party AI accountability | Accountability & Operating Model | GOVERN 6.1, GOVERN 6.2 | A.10.2, A.10.3 | Art. 25, Art. 26 |
| AO-10 | Prohibited and restricted AI use policy | Accountability & Operating Model | GOVERN 1.1, MAP 1.1 | A.9.4, A.2.2 | Art. 5 |
| AO-11 | Stakeholder engagement and feedback | Accountability & Operating Model | GOVERN 5.1, GOVERN 5.2 | 4.2, A.8.3, A.8.5 | Art. 27 |
| AO-12 | Governance resourcing | Accountability & Operating Model | GOVERN 1.4 | 7.1, A.4.2 | Art. 17 |
| EI-01 | Enterprise AI inventory (system of record) | Enterprise AI Inventory | GOVERN 1.6 | A.4.2, 7.5 | Art. 26, Art. 49 |
| EI-02 | AI risk classification and tiering | Enterprise AI Inventory | MAP 1.1, MAP 1.5, GOVERN 1.3 | 6.1.2, A.5.2 | Art. 6 |
| EI-03 | Accountable owner per AI system | Enterprise AI Inventory | GOVERN 2.1 | A.3.2, A.10.2 | Art. 26 |
| EI-04 | Intended purpose and context of use | Enterprise AI Inventory | MAP 1.1, MAP 1.2, MAP 3.4 | A.6.2.2, A.9.4 | Art. 11, Art. 13 |
| EI-05 | Model, prompt and component registry | Enterprise AI Inventory | MAP 4.1, GOVERN 1.6 | A.4.4, A.6.2.3 | Art. 11 |
| EI-06 | Data source and lineage registry | Enterprise AI Inventory | MAP 2.3, MEASURE 2.10 | A.4.3, A.7.5 | Art. 10 |
| EI-07 | Agent and tool registry | Enterprise AI Inventory | GOVERN 1.6, MAP 4.1 | A.4.4, A.6.2.3 | Art. 11 |
| EI-08 | Third-party and vendor AI inventory | Enterprise AI Inventory | GOVERN 6.1 | A.10.3 | Art. 25 |
| EI-09 | Shadow AI discovery | Enterprise AI Inventory | GOVERN 1.6 | A.4.2 | — |
| EI-10 | Dependency and integration mapping | Enterprise AI Inventory | MAP 4.1, MAP 4.2 | A.4.5, A.6.2.3 | Art. 11 |
| EI-11 | Inventory attestation and recertification | Enterprise AI Inventory | GOVERN 1.5 | 9.1 | — |
| EI-12 | Use-case intake register | Enterprise AI Inventory | MAP 1.1 | A.5.2, A.6.1.3 | Art. 6 |
| GL-01 | Intake triage workflow | Governance & Lifecycle Control | MAP 1.1, MAP 1.6 | 8.1, A.6.1.3 | Art. 9 |
| GL-02 | Pre-deployment risk and impact assessment | Governance & Lifecycle Control | MAP 1.1, MAP 3.1, MAP 5.1, MEASURE 1.1 | 6.1.4, 8.4, A.5.2, A.5.3, A.5.4 | Art. 9, Art. 27 |
| GL-03 | Risk-tiered approval gates | Governance & Lifecycle Control | MANAGE 1.1, GOVERN 1.4 | 8.1, A.6.2.5 | Art. 9, Art. 43 |
| GL-04 | Change management and reassessment triggers | Governance & Lifecycle Control | GOVERN 1.4, MANAGE 2.4 | 6.3, A.6.2.6 | Art. 43 |
| GL-05 | Pre-release validation and testing | Governance & Lifecycle Control | MEASURE 2.1, MEASURE 2.3, MEASURE 2.5 | A.6.2.4 | Art. 9, Art. 15 |
| GL-06 | Technical documentation | Governance & Lifecycle Control | MAP 2.2, MEASURE 2.9 | 7.5, A.6.2.7, A.6.2.3 | Art. 11 |
| GL-07 | Deployment conditions and go-live readiness | Governance & Lifecycle Control | MANAGE 1.2, MANAGE 2.1 | A.6.2.5 | Art. 26 |
| GL-08 | Post-deployment monitoring | Governance & Lifecycle Control | MEASURE 3.1, MANAGE 4.1 | 9.1, A.6.2.6 | Art. 26, Art. 72 |
| GL-09 | Retirement and decommissioning | Governance & Lifecycle Control | GOVERN 1.7, MANAGE 2.4 | A.6.2.6 | — |
| GL-10 | Exceptions and risk acceptance | Governance & Lifecycle Control | MANAGE 1.3, MANAGE 1.4 | 6.1.3 | Art. 9 |
| GL-11 | Vendor AI due diligence and contract controls | Governance & Lifecycle Control | GOVERN 6.1, MAP 4.1 | A.10.3, A.10.4 | Art. 25 |
| GL-12 | Periodic review and recertification | Governance & Lifecycle Control | GOVERN 1.5 | 9.3 | Art. 9 |
| IS-01 | AI threat modelling | Integrity, Safety & Security | MAP 5.1, MEASURE 2.7 | 6.1.2, A.6.1.3 | Art. 15 |
| IS-02 | Data governance and quality | Integrity, Safety & Security | MAP 2.3, MEASURE 2.1 | A.7.2, A.7.3, A.7.4, A.7.6 | Art. 10 |
| IS-03 | Privacy assessment and data minimisation | Integrity, Safety & Security | MEASURE 2.10, MAP 1.1 | A.7.4, A.5.4 | Art. 10 |
| IS-04 | Sensitive data redaction and masking | Integrity, Safety & Security | MEASURE 2.10 | A.7.4, A.6.2.6 | Art. 10 |
| IS-05 | Bias and fairness testing | Integrity, Safety & Security | MEASURE 2.11 | A.5.4, A.7.4 | Art. 10 |
| IS-06 | Safety and harm evaluation | Integrity, Safety & Security | MEASURE 2.6, MAP 5.1 | A.5.4, A.5.5 | Art. 9 |
| IS-07 | Accuracy and robustness testing | Integrity, Safety & Security | MEASURE 2.5 | A.6.2.4 | Art. 15 |
| IS-08 | Transparency and AI disclosures | Integrity, Safety & Security | MEASURE 2.8, MEASURE 2.9 | A.8.2, A.8.5 | Art. 13, Art. 50 |
| IS-09 | Human oversight design | Integrity, Safety & Security | GOVERN 3.2, MAP 3.5 | A.9.2, A.6.2.6 | Art. 14, Art. 26 |
| IS-10 | Secure model and prompt supply chain | Integrity, Safety & Security | GOVERN 6.1, MEASURE 2.7 | A.10.3, A.6.2.3 | Art. 15 |
| IS-11 | Least-privilege tool access | Integrity, Safety & Security | MEASURE 2.7, MANAGE 2.2 | A.6.2.6, A.4.4 | Art. 15, Art. 14 |
| IS-12 | Runtime guardrails and policy enforcement | Integrity, Safety & Security | MANAGE 2.2, MANAGE 2.4, MEASURE 2.7 | A.6.2.6 | Art. 15, Art. 14 |
| IS-13 | Human approval for high-impact actions | Integrity, Safety & Security | GOVERN 3.2, MANAGE 2.2 | A.9.2, A.6.2.6 | Art. 14 |
| IS-14 | Prompt-injection and data-leakage testing | Integrity, Safety & Security | MEASURE 2.7 | A.6.2.4 | Art. 15 |
| IS-15 | Kill switch and rollback | Integrity, Safety & Security | MANAGE 2.4 | A.6.2.6 | Art. 14 |
| IS-16 | Rate, budget and resource limits | Integrity, Safety & Security | MANAGE 2.2 | A.4.5, A.6.2.6 | Art. 15 |
| SE-01 | Control testing programme | Stewardship, Evidence & Assurance | MEASURE 1.3, MEASURE 4.1 | 9.1, 9.2 | Art. 17 |
| SE-02 | Evidence repository and retention | Stewardship, Evidence & Assurance | GOVERN 1.4 | 7.5 | Art. 18, Art. 19 |
| SE-03 | Governance metrics and leadership reporting | Stewardship, Evidence & Assurance | GOVERN 1.5, MANAGE 4.2 | 9.1, 9.3 | — |
| SE-04 | AI incident management and reporting | Stewardship, Evidence & Assurance | MANAGE 4.3, MANAGE 2.3 | 10.2, A.8.4 | Art. 73, Art. 26 |
| SE-05 | Audit-ready evidence packs | Stewardship, Evidence & Assurance | GOVERN 1.4, MEASURE 2.9 | 7.5, 9.2 | Art. 11, Art. 18 |
| SE-06 | Corrective action and continuous improvement | Stewardship, Evidence & Assurance | MANAGE 4.2 | 10.1, 10.2 | Art. 20 |
| SE-07 | Management review | Stewardship, Evidence & Assurance | GOVERN 1.5 | 9.3 | Art. 17 |
| SE-08 | Immutable action logging | Stewardship, Evidence & Assurance | MEASURE 2.8, MANAGE 4.1 | A.6.2.8 | Art. 12, Art. 19, Art. 26 |
| SE-09 | Post-market monitoring plan | Stewardship, Evidence & Assurance | MANAGE 4.1 | 9.1, A.6.2.6 | Art. 72 |
| SE-10 | Independent review and internal audit | Stewardship, Evidence & Assurance | MEASURE 1.3 | 9.2 | — |
| SE-11 | Stakeholder transparency reporting | Stewardship, Evidence & Assurance | GOVERN 4.2, MEASURE 2.9 | A.8.2, A.8.5 | Art. 13 |
| SE-12 | Model performance and drift monitoring | Stewardship, Evidence & Assurance | MEASURE 2.4, MEASURE 3.1 | A.6.2.6 | Art. 72, Art. 15 |

## 7. Coverage gaps — what VERITRAIL does not cover

VERITRAIL is a governance-readiness and evidence product. The following areas are outside its scope or only
supported as evidence inputs. Buyers should plan for them separately.

### 7.1 Out-of-scope and partially supported areas

| Framework | Area | VERITRAIL position |
|---|---|---|
| EU AI Act | Conformity assessment by notified bodies and internal-control conformity assessment procedures (Art. 43, Annexes VI–VII) | Not covered. GL-03/GL-04 produce approval and change evidence only. Notified-body assessment is performed by designated bodies; VERITRAIL is not one. |
| EU AI Act | EU declaration of conformity (Art. 47) and CE marking (Art. 48) | Not covered. VERITRAIL does not draw up declarations or authorize CE marking. |
| EU AI Act | Registration in the EU database (Art. 49, Art. 71) | Not covered. EI-01 inventory data may help prepare registration information; registration itself is performed by the obligated party. |
| EU AI Act | General-purpose AI (GPAI) model provider obligations, including systemic-risk models (Chapter V, Arts. 51–56) and codes of practice | Not covered in depth. VERITRAIL treats foundation models as third-party components (EI-08, GL-11, IS-10) from a deployer/downstream-provider perspective. |
| EU AI Act | Provider obligations as a whole (Art. 16), authorised representatives (Art. 22), importers (Art. 23) and distributors (Art. 24) | Partially supported through evidence controls (GL-06, SE-02, SE-05) but role-specific obligations are not modelled. |
| EU AI Act | Quality management system as a complete system (Art. 17) and technical documentation content per Annex IV | Partially supported. AO-01, AO-02, SE-01, SE-07 and GL-06 produce inputs; VERITRAIL does not validate Annex IV completeness. |
| EU AI Act | Serious-incident notification to market surveillance authorities (Art. 73) and cooperation with authorities (Art. 21) | Process support only (SE-04). VERITRAIL does not file reports or interact with authorities. |
| EU AI Act | Regulatory sandboxes, real-world testing (Arts. 57–63), penalties (Arts. 99–101) and governance bodies | Not covered. |
| EU AI Act | Annex I product legislation interplay (e.g. medical devices, machinery) | Not covered. Sector product-safety conformity routes remain with the manufacturer and its notified body. |
| ISO/IEC 42001 | Certification audit by an accredited certification body | Not covered. VERITRAIL supports readiness and evidence; only an accredited certification body can issue certification. |
| ISO/IEC 42001 | Clauses with no VERITRAIL control mapping in v1.0.0 (see unmapped list below), e.g. 4.3 scope and 4.4 AI management system | Not mapped. The organization must define AIMS scope and the management system itself. |
| NIST AI RMF | Subcategories with no VERITRAIL control mapping in v1.0.0 (see unmapped list below) | Not mapped. Many relate to workforce diversity, organizational culture, TEVV methodology and third-party contingency; candidates for future controls. |
| All | Jurisdictions and sector regimes outside the three frameworks (privacy law, sector regulators, US state AI laws, etc.) | Not mapped in controls.yaml. Industry packs list regimes to consider, flagged 'verify with counsel'. AO-07 maintains the organization's own obligations register. |
| All | Legal determinations of applicability, role (provider/deployer) and risk classification | Not covered. Requires qualified legal counsel. |

### 7.2 NIST AI RMF subcategories not referenced by any VERITRAIL control (v1.0.0)

- **GOVERN** (2): GOVERN 3.1, GOVERN 4.1
- **MAP** (6): MAP 1.3, MAP 1.4, MAP 2.1, MAP 3.2, MAP 3.3, MAP 5.2
- **MEASURE** (8): MEASURE 1.2, MEASURE 2.2, MEASURE 2.12, MEASURE 2.13, MEASURE 3.2, MEASURE 3.3, MEASURE 4.2, MEASURE 4.3
- **MANAGE** (2): MANAGE 3.1, MANAGE 3.2

### 7.3 ISO/IEC 42001 elements not referenced by any VERITRAIL control (v1.0.0)

- **Clauses/sub-clauses:** 4.3, 4.4, 7.4, 8.2, 8.3
- **Annex A controls:** A.2.3

Note: a parent clause (e.g. 6.1) may be referenced while some of its sub-clauses are not, and vice versa.

## 8. EU AI Act applicability timeline — verification required

As originally published, Regulation (EU) 2024/1689 entered into force on 1 August 2024 with staggered
application (Art. 113): prohibitions and AI-literacy provisions from 2 February 2025; GPAI and governance
provisions from 2 August 2025; most remaining provisions, including many high-risk obligations, from
2 August 2026; and Art. 6(1) product-embedded high-risk systems from 2 August 2027.

**These dates must be verified against the current Official Journal text and any amending acts before use.**
The European Commission's 2025 "Digital Omnibus" proposals included changes that may defer or condition
high-risk timelines. Whether and in what form such changes were adopted has **not been verified in this
repository**. Do not present any date in this section to a customer as current without legal confirmation.

## 9. Maintenance

| Item | Rule |
|---|---|
| Regeneration | Run `python3 docs/tools/gen_compliance_mapping.py` after any change to controls.yaml; `tests/unit/test_content_compliance_mapping.py` fails if this file is stale |
| Review cadence | Quarterly, and on any material regulatory change (risk R-07 in `docs/RISK_REGISTER.md`) |
| Change control | Mapping changes are made in controls.yaml only, with a version bump of the control library |
| Legal review | Required before any mapping is used in customer-facing compliance statements |

*VERITRAIL supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.*
