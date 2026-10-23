---
title: "VERITRAIL Pillars"
version: 1.0.0
status: published
effective_date: 2026-10-21
owner: VERITRAIL Governance Content Lead
review_cadence: quarterly
source: content/controls/controls.yaml (VERITRAIL-CTRL-LIB v1.0.0)
---

# The Five VERITRAIL Pillars

> VERITRAIL supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.

Every control in the VERITRAIL Control Library belongs to exactly one pillar. Control titles, owners, priorities and
scopes below are taken verbatim from `content/controls/controls.yaml`; if this page and the YAML ever disagree, the
YAML wins (a unit test, `tests/unit/test_content_framework.py`, checks that every control appears here).

**How to read "maturity indicators".** Each pillar lists what an assessor would typically observe at three points on
the VERITRAIL maturity scale. They are descriptive aids for validation interviews, not scoring rules — scoring is defined
only in `maturity_self_assessment.yaml` and explained in [`maturity_model.md`](maturity_model.md).

**Scope key.** `all` = every AI system; `high_risk` = systems tiered High; `genai` = generative AI / LLM systems;
`agentic` = AI agents and autonomous workflows; `third_party` = vendor and embedded AI.

---

## Pillar AO — Accountability & Operating Model

**Purpose.** Establish who owns AI risk, who has the authority to approve, restrict or stop AI, what the organization
will and will not do with AI, and how governance is resourced. Without this pillar every other control lacks an
owner and a decision-maker.

**Outcomes.**
- A published, versioned AI governance policy with a named executive owner (AO-01).
- A cross-functional forum that actually makes approve/restrict/stop decisions — and records them (AO-02).
- Clear RACI and escalation paths across business, technology, risk, legal, privacy and security (AO-03, AO-06).
- Leadership-approved risk appetite and tier criteria that the inventory and lifecycle gates use (AO-04).
- A register of legal, regulatory and contractual obligations mapped to systems, maintained by counsel (AO-07).
- Every use case screened against prohibited and restricted uses (AO-10).
- Staff and operators trained in proportion to their role (AO-05).

**Controls.**

| ID | Control | Priority | Applies to | Modules | Owner |
|---|---|---|---|---|---|
| AO-01 | AI governance policy | critical | all | Control | Chief AI Officer / AI Governance Lead |
| AO-02 | Executive accountability and AI governance forum | critical | all | Control | Executive sponsor (CIO/CRO/COO) |
| AO-03 | AI roles, responsibilities and RACI | high | all | Control | AI Governance Lead |
| AO-04 | AI risk appetite and tolerance | high | all | Control, Assess | Chief Risk Officer |
| AO-05 | AI literacy and role-based training | high | all | Control | HR / Learning lead with AI Governance Lead |
| AO-06 | Escalation paths and decision rights | high | all | Control | AI Governance Lead |
| AO-07 | Regulatory and contractual obligations register | high | all | Control | Legal / Compliance |
| AO-08 | Responsible AI principles and objectives | medium | all | Control | AI Governance Lead |
| AO-09 | Third-party AI accountability | medium | third_party | Register, Control | Procurement / Vendor Risk |
| AO-10 | Prohibited and restricted AI use policy | critical | all | Control, Assess | Legal / AI Governance Lead |
| AO-11 | Stakeholder engagement and feedback | medium | high_risk | Control, Assurance | Product Owner |
| AO-12 | Governance resourcing | medium | all | Control | Executive sponsor |

**Key evidence.** Approved AI policy with version and approval record (AO-01); forum terms of reference and decision
log showing approve/restrict/stop decisions (AO-02); RACI matrix (AO-03); approved risk appetite statement and
tier criteria (AO-04); training completion by role (AO-05); escalation matrix and sample escalations (AO-06);
obligations register with legal review records (AO-07); prohibited/restricted use list and intake screening
records (AO-10).

**Assessment questions.** STR-Q1, STR-Q2, STR-Q3, HUM-Q3 (and FST-Q3 for AO-11).

**Maturity indicators.**

| Stage | What an assessor typically sees |
|---|---|
| Initial | No AI policy, or a draft with no approval record; AI decisions made project by project; nobody can name the accountable executive. |
| Defined | Policy approved and published; forum chartered and meeting; RACI exists; prohibited-use list exists but screening is inconsistent. |
| Optimized | Policy reviewed on a cadence with evidence of change; forum decisions traceable to inventory records; risk appetite metrics reported; training completion and effectiveness measured by role; obligations register reconciled against systems each quarter. |

---

## Pillar EI — Enterprise AI Inventory

**Purpose.** Create and maintain a complete, owned and classified record of every AI system, model, prompt, agent,
tool, data source and vendor AI product — the AI system of record. Risk tiering, oversight and evidence cannot be
applied to systems you do not know about (critical flag FLAG-NO-INVENTORY).

**Outcomes.**
- One inventory, not spreadsheets per business unit, with coverage attested by owners (EI-01, EI-11).
- Every system tiered with approved, documented criteria (EI-02).
- A named business owner and technical owner per system (EI-03).
- Purpose, users, affected parties and foreseeable misuse documented (EI-04).
- Models, prompts, configurations, data sources, agents and tool permissions versioned and linked (EI-05, EI-06, EI-07).
- Vendor and embedded AI visible, with contract and DPA references (EI-08).
- Shadow AI periodically discovered and reconciled (EI-09).
- Every new use case enters through a standard intake (EI-12).

**Controls.**

| ID | Control | Priority | Applies to | Modules | Owner |
|---|---|---|---|---|---|
| EI-01 | Enterprise AI inventory (system of record) | critical | all | Register | AI Governance Lead / CIO office |
| EI-02 | AI risk classification and tiering | critical | all | Register, Assess | AI Risk Lead |
| EI-03 | Accountable owner per AI system | critical | all | Register | Business unit leaders |
| EI-04 | Intended purpose and context of use | high | all | Register, Assess | Product Owner |
| EI-05 | Model, prompt and component registry | high | all | Register | ML / Platform Engineering Lead |
| EI-06 | Data source and lineage registry | high | all | Register | Data Owner / CDO office |
| EI-07 | Agent and tool registry | critical | agentic | Register, Shield | Platform Engineering Lead |
| EI-08 | Third-party and vendor AI inventory | high | third_party | Register | Procurement / Vendor Risk |
| EI-09 | Shadow AI discovery | medium | all | Register | CISO / IT Asset Management |
| EI-10 | Dependency and integration mapping | medium | high_risk | Register | Enterprise Architecture |
| EI-11 | Inventory attestation and recertification | medium | all | Register, Assurance | AI Governance Lead |
| EI-12 | Use-case intake register | high | all | Register, Assess | AI CoE |

**Key evidence.** Inventory export with record counts and last-updated timestamps (EI-01); risk tier per record with
tiering approval (EI-02); populated owner fields and owner acceptance (EI-03); system profiles (EI-04); model registry
and prompt/config version history (EI-05); data-flow diagrams (EI-06); agent tool/permission manifests (EI-07);
vendor AI register with contract/DPA references (EI-08); discovery scan and reconciliation records (EI-09);
attestation records (EI-11); intake register with status (EI-12).

**Assessment questions.** INV-Q1, INV-Q2, INV-Q3, RSK-Q2 (EI-05), DAT-Q1 (EI-06).

**Maturity indicators.**

| Stage | What an assessor typically sees |
|---|---|
| Initial | Inventory is partial or per-team; vendor AI and agents are missing; owners unknown for many systems; no tiering. |
| Defined | A single inventory exists for most systems; tier criteria approved; owners named; agents registered but tool permissions incomplete. |
| Optimized | Inventory is reconciled automatically against discovery signals (procurement, API keys, SaaS AI features); every record tiered, owned and attested on cadence; model/prompt/agent changes update the record and trigger reassessment. |

---

## Pillar GL — Governance & Lifecycle Control

**Purpose.** Apply risk-proportionate gates to every AI system from intake to retirement, so that high-risk systems
get rigorous assessment and approval while low-risk systems move quickly.

**Outcomes.**
- Intake triaged against risk triggers to the right assessment depth (GL-01).
- A documented risk and impact assessment before production, proportionate to tier (GL-02).
- Approvals by authorities proportionate to tier, with recorded conditions (GL-03), verified at go-live (GL-07).
- Model, prompt, data, vendor, tool and agent changes trigger reassessment when material (GL-04).
- Validation against acceptance criteria before release (GL-05) and technical documentation for material systems (GL-06).
- Monitoring in production (GL-08), periodic recertification (GL-12) and safe retirement (GL-09).
- Exceptions recorded with approver, expiry and compensating controls (GL-10).
- Vendor AI subject to due diligence and AI-specific contract terms (GL-11).

**Controls.**

| ID | Control | Priority | Applies to | Modules | Owner |
|---|---|---|---|---|---|
| GL-01 | Intake triage workflow | high | all | Assess, Control | AI CoE |
| GL-02 | Pre-deployment risk and impact assessment | critical | all | Assess | AI Risk Lead |
| GL-03 | Risk-tiered approval gates | critical | all | Control | AI Governance Forum |
| GL-04 | Change management and reassessment triggers | high | all | Control | Engineering / Change Advisory Board |
| GL-05 | Pre-release validation and testing | high | all | Assess, Assurance | QA / ML Engineering |
| GL-06 | Technical documentation | high | high_risk | Control, Assurance | Product / ML Engineering |
| GL-07 | Deployment conditions and go-live readiness | high | all | Control | Product Owner |
| GL-08 | Post-deployment monitoring | high | all | Assurance | ML Ops / Product Owner |
| GL-09 | Retirement and decommissioning | medium | all | Control, Register | Product Owner |
| GL-10 | Exceptions and risk acceptance | high | all | Control | AI Governance Forum |
| GL-11 | Vendor AI due diligence and contract controls | high | third_party | Assess, Control | Procurement / Vendor Risk |
| GL-12 | Periodic review and recertification | medium | all | Control, Assurance | AI Risk Lead |

**Key evidence.** Triage criteria and decisions with rationale (GL-01); completed assessments with reviewer sign-off
and residual-risk statement (GL-02); approval matrix by tier and approval records with conditions (GL-03); change
tickets referencing reassessment (GL-04); test plans and release sign-off (GL-05); technical documentation pack /
system card (GL-06); go-live checklist (GL-07); monitoring dashboards and thresholds (GL-08); retirement records
(GL-09); exception register with approver and expiry (GL-10); vendor AI questionnaire and contract clauses (GL-11);
recertification records (GL-12).

**Assessment questions.** RSK-Q1, RSK-Q2, RSK-Q3, HUM-Q2 (GL-08), ASR-Q2 (GL-06).

**Maturity indicators.**

| Stage | What an assessor typically sees |
|---|---|
| Initial | Systems reach production without assessment (critical flag FLAG-NO-PREDEPLOY-ASSESSMENT); approvals informal; no change triggers for prompts or models. |
| Defined | Mandatory assessment gate for new systems; tiered approval matrix in use; exceptions recorded but expiry not enforced; prompt/model changes inconsistently routed. |
| Optimized | Gates embedded in delivery pipelines; reassessment triggered automatically by registry changes; exception expiry enforced; cycle-time and gate-bypass metrics reviewed by the forum. |

---

## Pillar IS — Integrity, Safety & Security

**Purpose.** Make AI systems fair, safe, private, secure and contained — at design time and at runtime. This pillar
holds the Runtime Shield controls for LLM applications and agents.

**Outcomes.**
- AI threat models covering prompt injection, poisoning, extraction and unsafe tool use (IS-01).
- Governed data quality and documented privacy assessment with minimisation (IS-02, IS-03).
- Sensitive data redacted from prompts, responses, logs and external model calls (IS-04).
- Bias, safety, accuracy and robustness evaluated for high-risk systems (IS-05, IS-06, IS-07).
- AI interactions and AI-influenced decisions disclosed (IS-08); oversight, override and appeal designed in (IS-09).
- Secure model, prompt and plugin supply chain (IS-10).
- Agents restricted to least-privilege tools, evaluated against versioned runtime policy, required to obtain human
  approval for high-impact actions, rate-limited, and able to be stopped (IS-11, IS-12, IS-13, IS-15, IS-16).
- LLM apps and agents adversarially tested before release and after material change (IS-14).

**Controls.**

| ID | Control | Priority | Applies to | Modules | Owner |
|---|---|---|---|---|---|
| IS-01 | AI threat modelling | high | all | Shield, Assess | CISO / Security Architecture |
| IS-02 | Data governance and quality | high | all | Control | Data Owner |
| IS-03 | Privacy assessment and data minimisation | critical | all | Assess, Control | DPO / Privacy Lead |
| IS-04 | Sensitive data redaction and masking | critical | genai | Shield | Platform Engineering / Privacy Lead |
| IS-05 | Bias and fairness testing | high | high_risk | Assess, Assurance | Responsible AI Lead / Data Science |
| IS-06 | Safety and harm evaluation | high | high_risk | Assess | Responsible AI Lead |
| IS-07 | Accuracy and robustness testing | high | high_risk | Assess, Assurance | ML Engineering |
| IS-08 | Transparency and AI disclosures | high | all | Control | Product Owner / Legal |
| IS-09 | Human oversight design | critical | high_risk | Control, Shield | Business Owner |
| IS-10 | Secure model and prompt supply chain | high | genai | Shield | Security Architecture |
| IS-11 | Least-privilege tool access | critical | agentic | Shield | Platform Engineering / IAM |
| IS-12 | Runtime guardrails and policy enforcement | high | genai | Shield | Platform Engineering / Security |
| IS-13 | Human approval for high-impact actions | critical | agentic | Shield, Control | Business Owner |
| IS-14 | Prompt-injection and data-leakage testing | critical | genai | Shield, Assess | Security Testing / Red Team |
| IS-15 | Kill switch and rollback | critical | all | Shield | Platform Engineering / SRE |
| IS-16 | Rate, budget and resource limits | medium | genai | Shield | Platform Engineering / FinOps |

**Key evidence.** Threat models with mitigation tracking (IS-01); privacy/data-protection impact assessments,
retention schedules and transfer assessments (IS-03); redaction configuration, test results and masked log samples
(IS-04); fairness, safety and robustness test results (IS-05, IS-06, IS-07); disclosure text and placement (IS-08);
oversight design and override/appeal procedures (IS-09); approved model/provider list (IS-10); tool permission
matrix and access reviews (IS-11); versioned runtime policy, policy decision logs and enforcement-mode configuration
(IS-12); approval records with approver identity (IS-13); red-team results and re-test evidence (IS-14); kill-switch
test record with time-to-disable (IS-15); limit configuration and breach alerts (IS-16).

**Assessment questions.** DAT-Q1, DAT-Q2, DAT-Q3, SEC-Q1, SEC-Q2, SEC-Q3, FST-Q1, FST-Q2, FST-Q3, HUM-Q1.

**Maturity indicators.**

| Stage | What an assessor typically sees |
|---|---|
| Initial | Sensitive data reaches prompts and logs unmasked; agents hold broad API keys; no adversarial testing; no way to switch an agent off quickly. |
| Defined | Redaction on the highest-sensitivity systems; tool permission matrices for production agents; runtime policy in Observe or Warn mode; adversarial testing before major releases. |
| Optimized | Runtime policy versioned and enforced (Protect/Enforce) with decision logs feeding monitoring; approval rules for high-impact actions tested; kill switch exercised with measured time-to-disable; fairness and robustness thresholds monitored in production. |

---

## Pillar SE — Stewardship, Evidence & Assurance

**Purpose.** Prove that controls operate, detect and learn from incidents, and drive continuous improvement through
measurement, independent review and management attention.

**Outcomes.**
- A periodic control-testing programme with retained results (SE-01) and a controlled evidence repository (SE-02).
- Tamper-evident logs of AI decisions, tool calls, policy decisions and approvals (SE-08).
- An audit-ready evidence pack producible for any material system on request (SE-05).
- AI incidents detected, triaged, contained, reported where required and reviewed (SE-04).
- Post-deployment monitoring plans and drift monitoring with thresholds (SE-09, SE-12).
- Governance KPIs reviewed by leadership; corrective actions tracked to closure; management review and independent
  audit on a risk-based cycle (SE-03, SE-06, SE-07, SE-10).
- Appropriate transparency to deployers, customers and affected parties (SE-11).

**Controls.**

| ID | Control | Priority | Applies to | Modules | Owner |
|---|---|---|---|---|---|
| SE-01 | Control testing programme | high | all | Assurance | Second line / Compliance Testing |
| SE-02 | Evidence repository and retention | high | all | Assurance | AI Governance Lead |
| SE-03 | Governance metrics and leadership reporting | medium | all | Assurance | AI Governance Lead |
| SE-04 | AI incident management and reporting | high | all | Assurance, Shield | CISO / Operational Risk |
| SE-05 | Audit-ready evidence packs | high | high_risk | Assurance | AI Governance Lead |
| SE-06 | Corrective action and continuous improvement | medium | all | Assurance, Control | AI Governance Lead |
| SE-07 | Management review | medium | all | Assurance | Executive sponsor |
| SE-08 | Immutable action logging | critical | all | Shield, Assurance | Platform Engineering / Security Operations |
| SE-09 | Post-market monitoring plan | high | high_risk | Assurance | Product Owner |
| SE-10 | Independent review and internal audit | medium | all | Assurance | Internal Audit |
| SE-11 | Stakeholder transparency reporting | medium | high_risk | Assurance | Product Owner |
| SE-12 | Model performance and drift monitoring | high | all | Assurance | ML Ops |

**Key evidence.** Control test plans and dated results with testers (SE-01); evidence repository, retention policy
and access controls (SE-02); KPI dashboard and leadership pack (SE-03); incident procedure, log and post-incident
reviews (SE-04); sample evidence pack with time-to-produce metric (SE-05); corrective-action register (SE-06);
management review minutes (SE-07); log configuration, tamper-evidence mechanism and sample extract (SE-08);
post-market monitoring plan (SE-09); internal audit reports (SE-10); instructions for use and transparency reports
(SE-11); drift metrics, thresholds and alert history (SE-12).

**Assessment questions.** ASR-Q1, ASR-Q2, ASR-Q3, HUM-Q2 (SE-04, SE-12).

**Maturity indicators.**

| Stage | What an assessor typically sees |
|---|---|
| Initial | Evidence scattered across email and shared drives; producing an evidence pack takes weeks or is impossible (critical flag FLAG-NO-EVIDENCE); AI incidents handled as generic IT tickets. |
| Defined | Evidence repository exists for high-risk systems; logs retained but not tamper-evident; incident procedure includes AI-specific categories; KPIs defined. |
| Optimized | Evidence generated as a by-product of operation (policy decision logs, approvals, tests) into a tamper-evident store; evidence packs produced in hours; control tests partly automated; KPIs drive corrective action reviewed in management review and audited independently. |

---

## Cross-pillar control sets used across VERITRAIL

| Set | Controls | Used by |
|---|---|---|
| Critical-priority controls | AO-01, AO-02, AO-10, EI-01, EI-02, EI-03, EI-07, GL-02, GL-03, IS-03, IS-04, IS-09, IS-11, IS-13, IS-14, IS-15, SE-08 | Governance Baseline minimum review set |
| Agent governance set | EI-07, IS-01, IS-11, IS-12, IS-13, IS-14, IS-15, IS-16, SE-08 | Agent review protocol (`content/pilots/templates/agent_review_protocol.md`) |
| Evidence & audit set | GL-06, SE-01, SE-02, SE-05, SE-08, EI-11 | Assurance module, evidence packs |
| Third-party AI set | AO-09, EI-08, GL-11, IS-10 | Vendor AI reviews |
