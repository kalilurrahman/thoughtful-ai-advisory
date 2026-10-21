---
title: "The AEGIS AI Governance Framework"
version: 1.0.0
status: published
effective_date: 2026-10-21
owner: AEGIS Governance Content Lead
review_cadence: quarterly
sources:
  - content/controls/controls.yaml (AEGIS-CTRL-LIB v1.0.0, 64 controls)
  - content/assessment_templates/maturity_self_assessment.yaml (AEGIS-SA-MATURITY v1.0.0)
---

# The AEGIS AI Governance Framework

> **Disclaimer.** AEGIS supports governance readiness, control implementation and evidence collection.
> It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice.
> Framework mappings are indicative.

## 1. What AEGIS is for

Enterprises are deploying AI faster than they can answer basic governance questions: *What AI do we run? Who owns it?
How risky is it? Who approved it? What stops an agent from doing something it should not? Can we prove any of this
to an auditor, a customer or a regulator?*

AEGIS is an operating framework and a product suite for answering those questions with **evidence**. It is built on
three ideas:

1. **Know it.** You cannot govern AI you do not know about. A complete, owned and classified AI system of record
   comes first (controls EI-01, EI-02, EI-03).
2. **Gate it.** Risk-proportionate lifecycle gates — intake, assessment, approval, change, monitoring, retirement —
   so that effort goes where risk is (GL-01, GL-02, GL-03, GL-04).
3. **Guard it and prove it.** Runtime guardrails for LLM applications and agents (IS-11, IS-12, IS-13, IS-15), and
   tamper-evident logs and evidence packs that show controls actually operated (SE-02, SE-05, SE-08).

AEGIS is **framework-aligned, not framework-replacing**. Each of the 64 AEGIS controls carries indicative mappings to
NIST AI RMF 1.0 (AI 100-1), ISO/IEC 42001:2023 and Regulation (EU) 2024/1689 (the EU AI Act). One control,
implemented once, produces evidence that can be reused across all three. See
[`docs/COMPLIANCE_MAPPING.md`](../docs/COMPLIANCE_MAPPING.md) for the full crosswalk and its limitations.

## 2. Framework structure at a glance

| Element | Count | Authoritative source |
|---|---|---|
| Pillars | 5 | `content/controls/controls.yaml` → `pillars` |
| Controls | 64 (AO 12, EI 12, GL 12, IS 16, SE 12) | `content/controls/controls.yaml` → `controls` |
| Assessment domains | 8 (weighted) | `content/assessment_templates/maturity_self_assessment.yaml` → `domains` |
| Self-assessment questions | 24 (3 per domain) | same file → `questions` |
| Maturity levels | 5 (Initial → Optimized) | same file → `scoring.levels`; descriptors in [`maturity_model.md`](maturity_model.md) |
| Evidence labels | 5 | `aegis_common.evidence.EvidenceStatus` |
| Product layers | 6 | this document, §4 |
| Product modules | 6 + industry packs | this document, §5 |

### 2.1 The five pillars

| ID | Pillar | Governing question | Controls |
|---|---|---|---|
| AO | Accountability & Operating Model | Who owns AI risk, who decides, and how is governance resourced? | AO-01 … AO-12 |
| EI | Enterprise AI Inventory | What AI do we have, who owns it and how risky is it? | EI-01 … EI-12 |
| GL | Governance & Lifecycle Control | What gates does each AI system pass from idea to retirement? | GL-01 … GL-12 |
| IS | Integrity, Safety & Security | Is the AI fair, safe, secure and contained at runtime? | IS-01 … IS-16 |
| SE | Stewardship, Evidence & Assurance | Can we prove controls operate, learn from incidents and improve? | SE-01 … SE-12 |

Full pillar definitions — purpose, outcomes, key controls, evidence and maturity indicators — are in
[`pillars.md`](pillars.md).

### 2.2 How pillars relate to assessment domains

The eight assessment domains are the lens used to *measure* maturity; the five pillars are the lens used to
*organize* controls. Every control lists the domains it contributes to (`domains:` in `controls.yaml`).

| Assessment domain (weight) | Primary pillars | Example controls |
|---|---|---|
| Strategy & Accountability (12) | AO | AO-01, AO-02, AO-03, AO-06 |
| AI Inventory & Visibility (14) | EI | EI-01, EI-02, EI-03, EI-09 |
| Risk Management & Lifecycle (14) | GL, EI | GL-01, GL-02, GL-03, GL-04, EI-05 |
| Data & Privacy (12) | IS, EI | IS-02, IS-03, IS-04, EI-06 |
| Security & Resilience (14) | IS | IS-01, IS-10, IS-11, IS-14, IS-15 |
| Fairness, Safety & Transparency (12) | IS, AO | IS-05, IS-06, IS-08, AO-11 |
| Human Oversight & Operations (12) | IS, GL, SE | IS-09, IS-13, GL-08, SE-12, AO-05 |
| Assurance, Evidence & Improvement (10) | SE | SE-01, SE-02, SE-05, SE-08 |

## 3. Core principles

1. **Risk-proportionate.** Depth of assessment, approval authority and review cadence scale with risk tier
   (AO-04, EI-02, GL-03, GL-12). Low-risk internal productivity tools should not wait in the same queue as an
   automated credit decision.
2. **Evidence over assertion.** Every finding carries an evidence label (§6). A self-assessment answer is
   *User-asserted* until a named reviewer has examined evidence.
3. **Cite or stay silent.** Every material recommendation cites at least one AEGIS control ID and, where relevant,
   a framework mapping drawn from that control. If nothing supports a statement, AEGIS outputs:
   `No supporting evidence or framework source is available.`
4. **Humans decide high-impact matters.** Changing a risk tier, approving an exception, changing production runtime
   policy, exporting sensitive evidence and sending external communications always require a named human approver
   (IS-09, IS-13, GL-10). AEGIS drafts; people approve.
5. **Redact first.** Sensitive data is masked before any external model call or log write (IS-03, IS-04).
6. **Tamper-evident by default.** Material governance actions are appended to a hash-chained audit log with a trace
   ID (SE-08).
7. **Least privilege, deny by default.** Agents — including the AEGIS Agent itself — get only the tools and scopes
   they need; write tools create drafts (EI-07, IS-11).
8. **Readiness, not certification.** AEGIS produces readiness indicators and evidence. It never states that an
   organization or system meets a law or standard; that determination belongs to qualified legal counsel,
   accredited certification bodies, notified bodies or regulators.

## 4. The six layers

The six layers describe the AEGIS reference architecture — the capabilities an enterprise needs, whether delivered
by AEGIS modules, existing tools, or both.

| # | Layer | What it does | Key controls | Delivered by |
|---|---|---|---|---|
| 1 | **AI System of Record** | Single, owned, classified inventory of AI systems, models, prompts, agents, tools, data sources and vendor AI | EI-01 … EI-12, AO-09 | Register |
| 2 | **Assessment & Risk Engine** | Maturity self-assessment, use-case intake triage, risk tiering, impact assessment, gap analysis | AO-04, AO-10, EI-02, GL-01, GL-02, IS-03, IS-05, IS-06 | Assess, Agent |
| 3 | **Policy & Control Library** | 64 versioned controls with evidence expectations, owners and framework mappings; organizational policy templates | AO-01, AO-07, AO-08, AO-10 | Control |
| 4 | **Lifecycle Governance** | Approval gates, change and reassessment triggers, exceptions, go-live readiness, periodic review, retirement | GL-03, GL-04, GL-07, GL-09, GL-10, GL-12 | Control |
| 5 | **Runtime Shield** | Policy-as-code evaluation of prompts, responses and tool calls; human approval; rate limits; kill switch | IS-04, IS-11, IS-12, IS-13, IS-15, IS-16 | Shield |
| 6 | **Assurance & Evidence** | Tamper-evident logs, evidence repository, control testing, incidents, monitoring, evidence packs, leadership reporting | SE-01 … SE-12, GL-08 | Assurance |

```
            ┌───────────────────────────────────────────────────────────────┐
            │  6. Assurance & Evidence  (logs · evidence packs · testing)   │
            ├───────────────────────────────────────────────────────────────┤
            │  5. Runtime Shield  (policy-as-code · approvals · kill switch)│
            ├───────────────────────────────────────────────────────────────┤
            │  4. Lifecycle Governance  (gates · change · exceptions)       │
            ├───────────────────────────────────────────────────────────────┤
            │  3. Policy & Control Library  (64 controls · mappings)        │
            ├───────────────────────────────────────────────────────────────┤
            │  2. Assessment & Risk Engine  (maturity · tiering · gaps)     │
            ├───────────────────────────────────────────────────────────────┤
            │  1. AI System of Record  (systems · models · agents · vendors)│
            └───────────────────────────────────────────────────────────────┘
                 AEGIS Agent (governance copilot) works across all layers
```

## 5. Modules

| Module | Job it does | Primary layers | Typical buyer |
|---|---|---|---|
| **Assess** | Maturity baseline, use-case risk tiering, impact assessment, gap analysis | 2 | CRO, AI governance lead |
| **Register** | AI system of record, ownership, classification, shadow-AI reconciliation, attestation | 1 | CIO office, AI CoE |
| **Control** | Policies, control library, approval gates, exceptions, lifecycle workflow | 3, 4 | Risk, compliance, legal |
| **Shield** | Runtime Shield Advisor, policy-as-code, human approval, rate limits, containment for LLM apps and agents | 5 | CISO, platform engineering |
| **Assurance** | Evidence repository, control testing, incident management, monitoring, evidence packs, leadership KPIs | 6 | Internal audit, second line |
| **Agent** | Citation-backed governance copilot: Ask AEGIS, guided assessment, gap analysis, report drafting | all | All governance personas |
| **Industry packs** | Sector use-case libraries, emphasized controls, evidence expectations, discovery questions | all | Sector compliance leads |

Industry packs: `content/industry_packs/` (healthcare & pharma, BFSI, GCC & IT services, SaaS product, public sector).

### 5.1 Commercial motion (summary)

Land with the fixed-scope **AEGIS Governance Baseline** (4–6 weeks), then expand:
**Baseline → Register → Control → Shield → Assurance → Managed Governance Service.** See
[`content/commercial/pricing_models.md`](commercial/pricing_models.md). All pricing is a hypothesis to validate in
pilots.

## 6. Evidence labels

Every finding, gap and report statement carries exactly one label.

| Label | Meaning | Typical source |
|---|---|---|
| **Verified** | Evidence exists and has been reviewed by a named reviewer | Evidence ID + reviewer + review date |
| **User-asserted** | The user states the practice exists; no evidence reviewed | Self-assessment answers, interview statements |
| **Inferred** | Inferred as a likely fact or gap from responses or metadata | Risk-tier calculation, metadata analysis |
| **Missing evidence** | Required evidence has not been provided | Evidence request outstanding |
| **Critical gap** | Material privacy, security, safety, legal or operational exposure | Critical flags (e.g. FLAG-NO-INVENTORY) |

Gap severity and remediation targets used across AEGIS deliverables (from `aegis_common.evidence`):
Critical — 30 days, High — 60 days, Medium — 90 days, Low — 180 days.

## 7. Risk tiers

AEGIS assigns each AI system an **Inferred** tier that a human must confirm (EI-02). Tiers drive assessment depth,
approval authority and review cadence.

| Tier | Typical triggers | Assessment depth | Approval |
|---|---|---|---|
| Prohibited-review | Possible prohibited practice screened under AO-10 | Legal review before any further work | Legal + AI governance forum |
| High | Material or automated decisions about people; special-category data; autonomous external actions; regulated domain categories | Full GL-02 impact assessment + IS-05/IS-06/IS-07/IS-14 testing as applicable | AI governance forum (AO-02, GL-03) |
| Medium | Customer-facing GenAI; confidential data; agents acting with approval | Standard assessment, threat model (IS-01), runtime policy (IS-12) | Risk lead + business owner |
| Low | Internal productivity, no personal data, advisory only | Lightweight intake (EI-12, GL-01) | Business owner |

The tiering algorithm and its factors are implemented in `app/assessment-engine` (`calculate_risk_tier`); every
factor cites a control.

## 8. Lifecycle

```
 Intake ──► Triage ──► Assess ──► Approve ──► Go-live ──► Operate & monitor ──► Change ──► Retire
 EI-12      GL-01      GL-02      GL-03       GL-07       GL-08, SE-12, IS-12    GL-04     GL-09
            AO-10      IS-03      GL-10                   SE-04, SE-08           (re-assess)
            EI-02      IS-01                                                     GL-12 periodic review
```

## 9. Agentic AI

Agents raise distinct risks: they act, call tools, chain decisions and can be manipulated through their inputs.
AEGIS treats agent governance as a first-class concern:

- **Register** every agent and its tool/permission manifest (EI-07).
- **Constrain** tools to least privilege, deny by default (IS-11).
- **Evaluate** every prompt, response and tool call against versioned runtime policy (IS-12), with decisions
  ALLOW, DENY, REDACT, TRANSFORM, REQUIRE_HUMAN_APPROVAL, ESCALATE and RATE_LIMIT.
- **Require human approval** for high-impact, irreversible or external actions (IS-13).
- **Limit** rate, tokens, cost and tool calls (IS-16) and keep a tested **kill switch** (IS-15).
- **Test** for prompt injection, jailbreak, data leakage and unsafe tool use (IS-14).
- **Log** every decision and approval in tamper-evident logs (SE-08).
- **Roll out** runtime enforcement progressively: Observe → Warn → Protect → Enforce → Contain.

## 10. What AEGIS does not do

- It does not certify ISO/IEC 42001 conformity, perform EU AI Act conformity assessment, affix or authorize CE
  marking, register systems in the EU database, or act as a notified body.
- It does not provide legal advice or determine whether a law applies to a given system. Regulatory obligations
  (AO-07) must be confirmed by qualified counsel.
- It does not verify evidence automatically: *Verified* status requires a named human reviewer.
- It does not cover obligations specific to general-purpose AI model providers in depth.
- Regulatory applicability dates (including EU AI Act timelines) must be verified against the current Official Journal text and any amendments, such as the Commission's 2025 "Digital Omnibus" proposals; this repository has
  not verified post-2025 changes.

See the coverage-gap section of [`docs/COMPLIANCE_MAPPING.md`](../docs/COMPLIANCE_MAPPING.md).

## 11. Governance of this framework

| Item | Rule |
|---|---|
| Owner | AEGIS Governance Content Lead |
| Review cadence | Quarterly, and on material regulatory change |
| Change control | Control IDs are never reused; retired controls are marked, not deleted; mapping changes are versioned |
| Regulatory content | Every regulatory statement is re-verified at each review; outdated content risk tracked as R-07 in `docs/RISK_REGISTER.md` |
