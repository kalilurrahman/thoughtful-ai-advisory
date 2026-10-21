# Executive Readiness Report — Example Regional Bank (synthetic)

> **SYNTHETIC DRESS REHEARSAL.** Fictional organization, generated answers. This report demonstrates the AEGIS Pilot A workflow and outputs; it is not evidence about any real organization.

**Prepared:** 2026-10-21 · **Scope:** AEGIS Governance Baseline (Pilot A profile) · **Prepared by:** AEGIS Agent-assisted workflow, synthetic analyst

## 1. Executive summary

- **28 AI systems** registered as draft inventory records (EI-01); preliminary tiers: High 12, Medium 14, Low 2. Tiers are Inferred and were confirmed through the approval queue (EI-02, IS-13).
- **Enterprise maturity: 48.1 / 100 — Developing** (self-reported, User-asserted).
- **12 deep-dive assessments** covering every High-tier system; **403 gaps** identified (Critical 40, High 254, Medium 90, Low 19).
- **2 runtime policies** drafted for agentic systems; both remain in draft/observe mode pending human approval to activate (IS-12, IS-13).
- Evidence position: Missing evidence: 262, User-asserted: 101, Critical gap: 40.

## 2. AI portfolio by risk tier

| Tier | Systems | Examples |
|---|---|---|
| High | 12 | SME credit decisioning model, Retail credit scorecard, Card fraud detection, KYC document verification |
| Medium | 14 | AML transaction monitoring, Chargeback dispute assistant, Marketing propensity model, Internal code assistant |
| Low | 2 | Meeting summariser, Branch staffing forecast |

## 3. Maturity baseline by domain

| Domain | Score |
|---|---|
| Strategy & Accountability | 53.3 |
| AI Inventory & Visibility | 40.0 |
| Risk Management & Lifecycle | 46.7 |
| Data & Privacy | 53.3 |
| Security & Resilience | 46.7 |
| Fairness, Safety & Transparency | 46.7 |
| Human Oversight & Operations | 53.3 |
| Assurance, Evidence & Improvement | 46.7 |

## 4. Risk heat map — gaps by system and severity

| System | Tier | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| Retail credit scorecard | High | 5 | 21 | 5 | 2 |
| KYC document verification | High | 4 | 19 | 5 | 2 |
| Biometric face match (ID&V) | High | 2 | 25 | 3 | 1 |
| Collections outreach agent | High | 6 | 26 | 8 | 2 |
| CV screening assistant | High | 4 | 23 | 9 | 2 |
| SME credit decisioning model | High | 1 | 19 | 8 | 1 |
| Card fraud detection | High | 2 | 24 | 7 | 3 |
| Customer support agent | High | 6 | 25 | 10 | 1 |
| Mortgage valuation model | High | 1 | 22 | 8 | 1 |
| Robo-advice portfolio tool | High | 4 | 17 | 8 | 2 |
| Employee attrition model | High | 3 | 17 | 7 | 1 |
| Cyber threat detection | High | 2 | 16 | 12 | 1 |

## 5. Most frequent Critical/High control gaps

| Control | Occurrences |
|---|---|
| IS-03 Privacy assessment and data minimisation | 28 |
| EI-05 Model, prompt and component registry | 25 |
| SE-04 AI incident management and reporting | 19 |
| SE-02 Evidence repository and retention | 18 |
| IS-08 Transparency and AI disclosures | 14 |
| GL-11 Vendor AI due diligence and contract controls | 14 |
| AO-09 Third-party AI accountability | 14 |
| GL-04 Change management and reassessment triggers | 13 |
| IS-06 Safety and harm evaluation | 13 |
| IS-10 Secure model and prompt supply chain | 12 |

## 6. Remediation roadmap

- **First 30 days:** close Critical gaps (owners and due dates in the gap register), stand up the AI system of record as authoritative (EI-01, EI-03), enable redaction and kill switch for agentic systems (IS-04, IS-15).
- **Days 31–60:** High gaps; adversarial testing of LLM apps and agents (IS-14); change triggers for model/prompt/tool changes (GL-04); move runtime policies from observe to warn/protect (IS-12).
- **Days 61–90:** Medium gaps; control-testing programme and evidence repository (SE-01, SE-02); leadership KPI pack (SE-03); enforce mode for agents after approval (IS-13).

## 7. Runtime Shield recommendations

| Agent | Policy | Version | Status | Rollout mode | Risk rating | Activation |
|---|---|---|---|---|---|---|
| Customer support agent | pol-customer-support-agent | 0.1.0 | draft | observe | High | apr_mvi8hwkv3b5b0409 (pending) |
| Collections outreach agent | pol-collections-outreach-agent | 0.1.0 | draft | observe | Critical | apr_mvi8hwlj3ae88ab5 (pending) |

## 8. Pilot success metrics (dry run)

| Metric | Target | Result | Status |
|---|---|---|---|
| AI systems registered | ≥ 25 | 28 | Met (synthetic) |
| High-risk systems assessed | 100% | 12/12 (100%) | Met (synthetic) |
| Agent-assisted assessment completion | ≥ 70% | 100% (all responses captured via agent tools; scripted) | Met (synthetic — not a measure of user adoption) |
| Critical gaps documented with owners | Yes | 40 critical gaps, all with owner role + due date | Met (synthetic) |
| Runtime policies drafted | ≥ 2 | 2 | Met (synthetic) |
| Executive report accepted | Yes | Report generated | Requires real partner |
| Follow-on commercial discussion initiated | Yes | — | Requires real partner |

## 9. Governance checks exercised

- W2: registered 28 AI systems as draft records
- W2: 28 tier confirmations approved by approver; separation-of-duties check: PASS — self-approval refused (ApprovalError)
- W3: maturity baseline 48.1 (Developing), 6 critical flags
- W4: completed 12 deep-dive assessments via agent tools (419 responses)
- W4: 2 agent reviews; runtime policies drafted (status draft, activation pending human approval)
- W5: gap register 403 gaps; 40 remediation tasks created for Critical gaps after explicit confirmation
- W6: evidence pack export: first call -> pending_approval; after approval -> exported (7 items)

## 10. Artefacts

- `01_ai_inventory.csv` — inventory with preliminary tiers
- `02_maturity_baseline.{md,pdf}`
- `03_deep_dives/<system>/` — per-system report (md, pdf, csv gap register, json)
- `04_runtime_policies/` — advisor output + policy YAML/JSON for two agents
- `05_gap_register.csv` — consolidated
- `06_evidence_pack/` — approval-gated evidence pack
- `metrics.json`, `run_log.md`

*AEGIS supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.*
