# VERITRAIL Go-To-Market Plan

Version 3.0 · 21 October 2026 · Owner: GTM Lead / Commercial Lead · Status: Active (pre-pilot)

> VERITRAIL is pre-pilot: no customers, case studies or measured results exist. Every external message must reflect that.
> Pricing is a hypothesis (`content/commercial/pricing_models.md`).

## 1. GTM thesis

Enterprises are moving from AI experimentation to scaled deployment — including agents with tool access — while
boards, auditors, customers and regulators ask for evidence of control. VERITRAIL lands with a **fixed-scope Governance
Baseline** that turns self-reported maturity into evidence, then expands into the platform:
**Baseline → Register → Control → Shield → Assurance → Managed Governance Service.** AI-forward engineering
organizations can enter through **Shield**.

## 2. Ideal customer profiles (ICP)

| ICP | Firmographics | Triggers | Entry offer | Pilot mapping |
|---|---|---|---|---|
| **ICP-1 Regulated enterprise** | BFSI, healthcare & pharma, public sector, regulated GCCs; 1,000+ employees; 20–100+ AI systems incl. vendor AI | Audit finding; regulator or customer inquiry; board request; EU exposure; new AI policy; MRM extension to GenAI | Governance Baseline → Register + Control | Pilot A |
| **ICP-2 AI-forward builder** | SaaS/AI product companies, GCCs, digital-native enterprises; LLM features and agents in production | Agent incident or near-miss; customer security questionnaires on AI; scaling agents; enterprise deals requiring AI assurance | Shield (+ Register for agents); Baseline optional | Pilot B |
| **ICP-3 Mid-market regulated (nurture)** | 250–1,000 employees; 10–24 AI systems | First AI governance hire; customer due diligence | Self-assessment → Essentials tier | — |

**Disqualifiers:** fewer than ~10 AI systems and no agents (unless strong trigger); seeking a certificate or legal
opinion from VERITRAIL; unwilling to accept metadata-only data handling.

## 3. Buyer personas and roles in the deal

| Persona | Role in deal | Top concerns | What they need to see |
|---|---|---|---|
| Chief AI Officer / Head of AI Governance | Champion, often economic buyer for Baseline | Inventory, forum effectiveness, board reporting | Self-assessment report; Baseline deliverables; exec report template |
| CRO / second line | Economic buyer (regulated) | Risk appetite, MRM fit, evidence | Control library, mapping caveats, gap register |
| CISO | Economic buyer (Shield) / veto | Agent abuse, leakage, kill switch | Shield demo, policy-as-code, decision logs |
| Platform/AI engineering lead | Technical evaluator / champion (ICP-2) | Developer friction | Observe→Warn rollout, CI validation, policy files in repo |
| Legal / DPO | Veto | Over-claiming, data handling | Disclaimers, coverage gaps, safeguards, DPA |
| Internal audit | Influencer | Evidence quality | Evidence labels, hash-chained audit log, evidence packs |
| Procurement / vendor risk | Gatekeeper | Security questionnaire, terms | Security pack, data handling, pricing clarity |

## 4. Positioning

**For** enterprises scaling AI and agents under scrutiny, **VERITRAIL is** the evidence-first AI governance platform that
**inventories, tiers, gates, guards and proves** every AI system — **unlike** generic GRC tools (no AI system of record
or runtime guardrails), point guardrail libraries (no governance lifecycle or evidence) and consulting-only approaches
(no continuously operating controls) — **because** every VERITRAIL recommendation cites one of 64 controls, every finding
carries an evidence label, and high-impact AI actions require human approval.

**Category language:** "AI governance readiness and runtime assurance". Never "compliance automation that makes you
compliant".

## 5. Messaging

| Message | Proof (verifiable) | Persona |
|---|---|---|
| **Know every AI system.** One owned, tiered inventory — including vendor AI and agents. | Register intake + explainable tiering (EI-01, EI-02) | CAIO, CIO |
| **Gate risk, not progress.** Risk-proportionate approvals so low-risk AI moves fast. | Triage + approval matrix (GL-01, GL-03) | CAIO, CRO |
| **AI proposes. VERITRAIL evaluates. Approved actions execute.** | Policy engine decisions incl. REQUIRE_HUMAN_APPROVAL (IS-12, IS-13) | CISO, engineering |
| **Evidence, not assertions.** Every finding labelled Verified, User-asserted, Inferred, Missing evidence or Critical gap. | Reports, evidence packs, audit log (SE-05, SE-08) | Audit, CRO |
| **Readiness without over-claiming.** Indicative mappings to NIST AI RMF, ISO/IEC 42001 and the EU AI Act — with explicit coverage gaps. | `docs/COMPLIANCE_MAPPING.md` | Legal, CRO |
| **A copilot that cites its sources.** | Agent citations; no-source message | Governance teams |

Banned phrasing in all GTM material: the prohibited terms in `CONTRIBUTING.md` §5 (compliance, certification,
guarantee or regulator-approval claims about customers); invented customer counts, logos or statistics.

## 6. Channels

| Channel | Role | ICP | Notes |
|---|---|---|---|
| Website + free tools (assessment, guardrail generator, risk triage, Ask VERITRAIL) | Primary demand capture | All | No cookies/trackers; business-email gate for full report |
| Founder/expert-led outbound to design-partner targets | Pilot recruitment | ICP-1, ICP-2 | Outreach sequence in `content/pilots/pilot_status_tracker.md` |
| Content (blog, blueprint, newsletter) | Authority, nurture | All | Reviewed by Governance Content Lead |
| Partners: advisory/audit firms, system integrators, GCC ecosystems | Delivery capacity and referrals | ICP-1 | Partners deliver Baselines on VERITRAIL kits; referral terms TBD |
| Industry events and closed-door roundtables | Trust building | ICP-1 | Speak on readiness vs. compliance, agent guardrails |
| Developer community (policy-as-code examples, policy packs) | Bottom-up adoption | ICP-2 | Policy packs as public examples once reviewed |
| Cloud/AI marketplaces | Later procurement channel | All | After production hosting exists |

## 7. Launch plan (sequenced stages with exit criteria)

| Stage | Activities | Exit criteria |
|---|---|---|
| L0 — Ready to recruit | MVP website, self-assessment, Agent demo, Shield Advisor live in demo environment; pilot kits and commercial kit complete | Demo script runs end-to-end on synthetic data; all content tests pass; legal review of privacy notice and terms |
| L1 — Design-partner recruitment | Outreach to 20–30 targets per pilot; discovery calls; qualification | One qualified, signed partner per pilot (score ≥ 32) |
| L2 — Pilots | Run Pilot A and Pilot B (6-week plans) | Scorecards complete; survey analyzed; follow-on proposals presented |
| L3 — Validated launch | Update pricing, messaging, framework and backlog from pilot evidence; publish approved case studies only with written approval | ≥ 1 paid follow-on; pricing hypotheses revised with evidence |
| L4 — Scale | Partner channel; industry-pack-led campaigns; marketplace listing (after hosting) | Repeatable Baseline → platform conversion observed across several customers |

Sequencing and exit criteria — not calendar dates — govern progression; see [ROADMAP](ROADMAP.md).

## 8. Lead qualification rules (match the self-assessment)

The self-assessment computes internal tags from `content/assessment_templates/maturity_self_assessment.yaml` →
`lead_rules`. Tags are never shown to the respondent (DEC-0015). GTM routing uses them as follows:

| Tag | Rule (from template) | Label | Routing | SLA |
|---|---|---|---|---|
| `baseline_priority` | overall score < 60 | High-priority Governance Baseline candidate | Personal follow-up offering Baseline scoping call | 2 business days |
| `platform_candidate` | ai_systems ∈ {10-24, 25-99, 100+} | Platform candidate (10+ AI systems) | Account research; Register/Control demo | 3 business days |
| `shield_candidate` | uses_agents = true | Runtime Shield candidate | Engineering-oriented follow-up; guardrail generator + 45-min Shield session | 3 business days |
| `compliance_led` | industry ∈ {healthcare_pharma, bfsi, public_sector} or eu_operations = true | Compliance-led candidate | Send relevant industry page and compliance-mapping caveats; Baseline | 3 business days |
| `register_opportunity` | FLAG-NO-INVENTORY fired | Immediate Register/Assess opportunity | Inventory-focused follow-up (workshop kit preview) | 2 business days |
| `assurance_opportunity` | FLAG-NO-EVIDENCE fired | Assurance opportunity | Evidence-pack-focused follow-up | 3 business days |

**Lead scoring for prioritization** (internal, additive): `baseline_priority` 3 · `platform_candidate` 2 ·
`shield_candidate` 2 · `compliance_led` 2 · `register_opportunity` 2 · `assurance_opportunity` 1; plus org_size
5000+ → 2, 1000-5000 → 1. **≥ 6 = sales-qualified (SQL)**, 3–5 = marketing-qualified (MQL, nurture + invite to
Baseline webinar), < 3 = newsletter nurture. Free-mail domains are rejected at capture.

**Pilot qualification** of leads uses the design-partner scorecard (`content/pilots/pilot_status_tracker.md` §2).

## 9. Funnel metrics

Targets are set only after the first measured baseline — no targets are invented here.

| Stage | Metric | Source |
|---|---|---|
| Awareness | Site sessions (aggregate), top entry pages | `/api/events` (privacy-friendly) |
| Activation | Assessment start rate; completion rate; median completion time | Events |
| Capture | Lead conversion from completed assessment; consent rate | `/api/leads` |
| Qualification | MQL and SQL counts by tag; time to first touch vs. SLA | Admin leads export / CRM |
| Opportunity | Baseline scoping calls; demos; design-partner applications | CRM |
| Pilot | Pilots signed; scorecard M1–M6 met | Pilot scorecards |
| Revenue | Baseline → platform conversion; ACV; module mix | CRM |
| Retention/expansion | Modules per customer; 90-day health metrics | Onboarding plan |

Funnel review: weekly during L1–L2; monthly afterwards.

## 10. Sales motion and assets

| Step | Asset |
|---|---|
| Discovery | Industry pack discovery questions; self-assessment report |
| Demo | `content/commercial/demo_script.md` (20/45 min) |
| Business case | `content/commercial/roi_calculator.py` + worked example (with sensitivity) |
| Objections | `content/commercial/objection_handling.md` |
| Proposal | Governance Baseline one-pager; `pilot_to_platform_proposal_template.md` |
| Onboarding | `customer_onboarding_90_day_plan.md` |

## 11. GTM risks

Tracked in [RISK_REGISTER](RISK_REGISTER.md): low conversion (R-06), unsupported compliance advice (R-02), outdated
regulatory content (R-07), sales over-claiming (R-15), and design-partner recruitment failure (R-12).
