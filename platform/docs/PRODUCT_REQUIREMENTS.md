# AEGIS Product Requirements Document (PRD)

Version 3.0 · 21 October 2026 · Owner: Product Lead (content: Governance Content Lead) · Status: Approved for MVP build

Related: [ROADMAP](ROADMAP.md) · [BACKLOG](BACKLOG.md) · [RISK_REGISTER](RISK_REGISTER.md) ·
[COMPLIANCE_MAPPING](COMPLIANCE_MAPPING.md) · [TECHNICAL_ARCHITECTURE](TECHNICAL_ARCHITECTURE.md) ·
[API_SPECIFICATION](API_SPECIFICATION.md) · Blueprint v3: `output/AEGIS_Launch_and_Enhancement_Blueprint_v3.md`

> AEGIS supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.

## 1. Product vision

AEGIS helps enterprises **know, gate, guard and prove** their AI: a complete AI system of record, risk-proportionate
lifecycle controls, runtime guardrails for LLM apps and agents, and audit-ready evidence — all tied to a 64-control
library with indicative mappings to NIST AI RMF, ISO/IEC 42001 and the EU AI Act.

**Product principles:** evidence over assertion; cite or stay silent; humans approve high-impact actions; redact first;
tamper-evident by default; least privilege; readiness, not certification.

## 2. Personas

| ID | Persona | Context | Primary modules |
|---|---|---|---|
| P1 | **Head of AI Governance / Chief AI Officer** | Accountable for AI policy and the governance forum; small team; asked by the board "what AI do we run?" | Assess, Register, Control, Agent |
| P2 | **Chief Risk Officer / second line** | Owns risk appetite; needs AI in the risk taxonomy and MRM | Assess, Control, Assurance |
| P3 | **CISO / security architect** | Agents with tool access, prompt injection, data leakage, kill switches | Shield, Register |
| P4 | **Platform / AI engineering lead** | Ships LLM features and agents; wants guardrails that don't block delivery | Shield, Agent |
| P5 | **Legal / privacy counsel (DPO)** | Obligations register, privacy assessments, transparency; wary of over-claiming | Control, Assurance |
| P6 | **Internal audit** | Needs evidence that controls operate | Assurance |
| P7 | **Business / product owner of an AI system** | Must register, assess and get approval without becoming a governance expert | Register, Agent |
| P8 | **Website visitor / evaluator** | Researching AI governance; self-assesses before talking to sales | Website, self-assessment, tools |
| P9 | **AEGIS delivery consultant** | Runs Governance Baselines and pilots | All, pilot kits |

## 3. Jobs to be done

| ID | When… | I want to… | So that… | Persona |
|---|---|---|---|---|
| J1 | the board asks what AI we use | produce a complete, owned, tiered inventory | I can answer with confidence and evidence | P1, P2 |
| J2 | a new AI use case is proposed | triage it to the right assessment depth and approver | low-risk work moves fast and high-risk work gets scrutiny | P1, P7 |
| J3 | I need to know our governance maturity | get a credible, quick baseline with prioritized actions | I can plan and secure budget | P1, P8 |
| J4 | an agent gets tool access | define what it may do, what needs approval, and how to stop it | a manipulated agent cannot cause unauthorized actions | P3, P4 |
| J5 | an auditor or customer asks for proof | produce an evidence pack for a system on request | I avoid weeks of reconstruction | P6, P1 |
| J6 | I'm asked about framework alignment | see indicative mappings and their limits | I can discuss readiness without over-claiming | P5, P2 |
| J7 | I'm a product owner with an AI feature | complete intake and assessment with guidance | I get approval without learning the whole framework | P7 |
| J8 | I'm evaluating vendors | try the product's thinking before a sales call | I can judge credibility quickly | P8 |
| J9 | I deliver a Baseline or pilot | use standard kits, templates and scorecards | every engagement is consistent and measurable | P9 |

## 4. Requirements by phase

Priority: **Must** (MVP blocker), **Should**, **Could**. Phases and their exit criteria are in [ROADMAP](ROADMAP.md).

### Phase 0 — Framework & content foundation

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-0-01 | Single control library of 64 controls across 5 pillars with objective, evidence, owner, priority, scope, modules and indicative mappings | Must | `controls.yaml` loads; IDs unique `AO/EI/GL/IS/SE-NN`; every control has ≥ 1 NIST and ISO mapping |
| PRD-0-02 | Framework, pillar and maturity-model documentation consistent with the library | Must | `content/aegis_framework.md`, `pillars.md`, `maturity_model.md` exist; tests confirm every control appears in `pillars.md` and every cited ID exists |
| PRD-0-03 | Generated compliance crosswalk with methodology, disclaimers and coverage gaps | Must | `docs/COMPLIANCE_MAPPING.md` regenerates byte-identically from `docs/tools/gen_compliance_mapping.py`; contains EU AI Act timeline-verification caveat |
| PRD-0-04 | Five industry packs with use cases, tier hints, emphasized controls, evidence, regimes (verify with counsel), policy packs and discovery questions | Should | Pack tests pass; tier hints agree with risk-tier engine |

### Phase 1 — Website

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-1-01 | Static website with IA in [WEBSITE_CONTENT_PLAN](WEBSITE_CONTENT_PLAN.md): home, framework, solutions, compliance, industries, tools, resources, contact, legal | Must | Site builds from `content/website_pages/*.md`; every page has valid front matter; no broken internal links |
| PRD-1-02 | Every compliance-related page carries the standard disclaimer and no prohibited claims | Must | Build check runs `find_prohibited_claims()` on all pages with zero findings |
| PRD-1-03 | Control citations rendered from the library (`{{controls:…}}`) | Must | Build fails on unknown control ID |
| PRD-1-04 | Conversion paths: self-assessment, Governance Baseline booking, demo, blueprint download, newsletter | Must | Forms post to `/api/contact` or `/api/leads`; consent required; free-mail domains rejected for gated assets |
| PRD-1-05 | SEO: titles, meta descriptions (120–160 chars), canonical, sitemap, JSON-LD | Should | Build-time validation of lengths and sitemap |
| PRD-1-06 | Privacy: no cookies, no third-party trackers or CDNs; privacy-friendly events only | Must | Security test asserts no third-party origins and no `Set-Cookie` from site |
| PRD-1-07 | Accessibility: semantic HTML, keyboard navigation, alt text, contrast | Should | Automated checks on templates; manual review before launch |

### Phase 2 — Maturity self-assessment & lead capture

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-2-01 | 24-question, 8-domain assessment driven by `maturity_self_assessment.yaml` | Must | Weights 12/14/14/12/14/12/12/10; levels Initial 0–39.9 … Optimized 90–100 |
| PRD-2-02 | Instant preliminary result without PII | Must | `/api/assessment/preliminary` returns score, level, domains; no personal data stored |
| PRD-2-03 | Full report (Markdown + PDF) after business-email lead capture with consent | Must | `/api/leads` returns report links; report contains strengths, gaps, flags, 30/60/90 plan, recommended controls, readiness indicators, modules, disclaimer |
| PRD-2-04 | Browser and Python engines produce identical results | Must | Parity test passes on random and edge inputs |
| PRD-2-05 | All results labelled User-asserted; critical flags labelled Critical gap | Must | Report and API outputs include labels |
| PRD-2-06 | Lead qualification tags computed internally and never shown to the respondent | Must | Tags absent from respondent-facing API/report |
| PRD-2-07 | Median completion ≤ 10 minutes | Should | Event analytics median time; survey B5 in pilots |

### Phase 3 — AEGIS Agent MVP

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-3-01 | Journeys: Ask AEGIS, guided assessment, gap analysis, report generation | Must | Each journey demonstrable end-to-end via `/api/agent/message` |
| PRD-3-02 | 14 tools with declared permission levels (read, compute, create_draft, write_confirm, approval_required) | Must | `TOOL_REGISTRY` has 14 entries; RBAC enforced; every call audited |
| PRD-3-03 | Citations on every material recommendation; exact no-source message otherwise | Must | Agent evaluation suite: 100% of recommendations cite valid control IDs; out-of-scope prompts return `No supporting evidence or framework source is available.` |
| PRD-3-04 | Human approval for tier changes, exceptions, production policy changes, sensitive exports, external communications | Must | Attempts create pending approvals; approvals resolved by a different user with approver role |
| PRD-3-05 | Redaction before any external LLM call and log write; LLM optional | Must | Security tests show masked PII in outbound payloads and logs |
| PRD-3-06 | Prohibited-claim guard on generated text | Must | `find_prohibited_claims()` returns zero on agent outputs in evaluation set |
| PRD-3-07 | Prompt-injection resistance for retrieved and user content | Should | Injection test cases in agent evaluation pass |

### Phase 4 — Runtime Shield

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-4-01 | Shield Advisor: profile → risk profile, tool matrix, data handling, approval rules, limits, monitoring, incident response, rollout, citations, draft policy | Must | `/api/shield/advise` returns all sections; policy validates with zero errors |
| PRD-4-02 | Policy-as-code schema `aegis.policy/v1` with validator and evaluator | Must | `validate_policy` and `PolicyEngine.evaluate` covered by policy-engine tests |
| PRD-4-03 | Decisions ALLOW, DENY, REDACT, TRANSFORM, REQUIRE_HUMAN_APPROVAL, ESCALATE, RATE_LIMIT with precedence | Must | Engine tests per decision type |
| PRD-4-04 | Rollout modes Observe → Warn → Protect → Enforce → Contain | Must | Mode behaviour tests (Observe never blocks; Contain denies all in scope) |
| PRD-4-05 | Default-deny tools; high-impact operations require approval | Must | Validator rejects default ALLOW |
| PRD-4-06 | Policy lifecycle draft → in_review → approved → active → retired; activation requires human approval | Must | Status-transition tests |
| PRD-4-07 | Reference policy packs | Should | ≥ 5 packs in `content/policy_packs/` validate |
| PRD-4-08 | Logging levels none/metadata/redacted only (no raw) | Must | Schema rejects raw logging |

### Phase 5 — Design-partner pilots

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-5-01 | Pilot A and Pilot B kits: plans, scorecards, onboarding, safeguards, workshop kit, session guide, deep-dive plan, agent review protocol, gap register, roadmap, Shield recommendations, exec report, survey, follow-on proposal | Must | Files in `content/pilots/`; pilot tests pass |
| PRD-5-02 | Success metrics measurable with defined method and data source | Must | Scorecards list method + source per metric |
| PRD-5-03 | Metadata-only default; no production data to external LLMs | Must | Safeguards template signed in Week 1 |
| PRD-5-04 | Recruit and run two pilots | Must | **Blocked — requires real design partners**; tracker shows status honestly |
| PRD-5-05 | Pilot feedback updates framework, assessment, agent and pricing hypotheses | Should | Survey analysis plan thresholds applied |

### Phase 6 — Commercial launch & GTM

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PRD-6-01 | Pricing models per module and packaged tiers, labelled hypotheses | Must | `pricing_models.md`; every range labelled |
| PRD-6-02 | Sales one-pagers (Baseline, Register, Control, Shield, Assurance, Agent, industry packs) | Must | Seven one-pagers; no prohibited claims |
| PRD-6-03 | ROI calculator with transparent formulas and labelled assumptions | Must | `roi_calculator.py` tests pass; worked example in sync |
| PRD-6-04 | Demo scripts (20/45 min), objection handling, proposal template, case-study template with approval rule, 90-day onboarding | Must | Files exist; case-study rule present |
| PRD-6-05 | GTM plan with ICP, lead qualification matching self-assessment tags | Must | [GTM_PLAN](GTM_PLAN.md) maps rules to `lead_rules` |
| PRD-6-06 | Commercial execution (closed deals, case studies) | Must | **Blocked — requires real design partners/customers** |

## 5. Non-functional requirements

| ID | Category | Requirement | Acceptance criteria |
|---|---|---|---|
| NFR-01 | Governance | No prohibited compliance claims in any product output or content | Automated claim checks in tests for website, agent, reports, content |
| NFR-02 | Governance | Every recommendation cites a valid control ID | Citation tests across workstreams |
| NFR-03 | Privacy | Redaction before external LLM calls and log writes; minimal PII; no cookies/trackers | Security tests |
| NFR-04 | Security | Least-privilege RBAC for agent tools and admin; separation of duties for approvals | Unit/security tests |
| NFR-05 | Auditability | Hash-chained audit log for material actions with trace IDs; verification tool | Admin `verify` passes; tamper test fails verification |
| NFR-06 | Reliability | Deterministic scoring identical across engines | Parity test |
| NFR-07 | Performance | Preliminary assessment API p95 < 300 ms on reference hardware; static pages cached | Load smoke test (target; to be measured) |
| NFR-08 | Portability | Python 3.11 stdlib + PyYAML, Markdown, Jinja2, reportlab; no build toolchain for frontend | Dependency check |
| NFR-09 | Accessibility | Target WCAG 2.2 AA for public site | Manual audit before public launch |
| NFR-10 | Content governance | Quarterly review of controls, mappings, industry packs and regulatory statements | Review log; R-07 |
| NFR-11 | Honesty | No invented customers, results or statistics; pilots shown as not started until they start | Content tests on tracker; case-study rule |
| NFR-12 | Data retention | Configurable retention for leads, reports and audit logs; deletion on request | Admin capability + documented defaults (legal review pending) |

## 6. Out of scope (v3.0)

- Certification, conformity assessment, CE marking, EU database registration, notified-body services, legal opinions.
- Deep GPAI-provider obligations tooling.
- Automatic verification of evidence (Verified always requires a named human reviewer).
- Network scanning or endpoint agents for shadow-AI discovery (imports only).
- Production multi-tenant SaaS hosting, SSO federation and enterprise integrations beyond reference adapters (planned
  after pilots).
- Native ITSM/GRC connectors (CSV/JSON/API in MVP).
- Autonomous agent actions without human approval for high-impact operations — by design, never.

## 7. Open questions

| # | Question | Resolution path |
|---|---|---|
| OQ-1 | Which pricing metric per module do buyers prefer? | Pilot survey G3 |
| OQ-2 | Does validated maturity differ materially from self-reported? | Pilot signal S6 |
| OQ-3 | Are effect-size hypotheses in the ROI model directionally right? | Pilot signals S1–S3 |
| OQ-4 | Deployment model required by regulated buyers (single-tenant, customer cloud)? | Pilot onboarding, security questionnaires |
| OQ-5 | Status of EU AI Act timeline amendments | Legal review; R-07 |
