# AEGIS Backlog

Version 3.0 · 21 October 2026 · Owner: Product Lead

**Status values:** `Done — sprint 1 (pending review)` · `In progress — built in sprint 1` · `Blocked — requires real
design partners` · `Planned` · `Candidate (post-pilot)`.
**Priority:** P0 (MVP blocker) · P1 · P2. Story IDs are stable; never reuse. Requirement IDs refer to
[PRODUCT_REQUIREMENTS](PRODUCT_REQUIREMENTS.md).

## Epic E0 — Framework & governed content

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E0-S01 | As a governance lead, I want a 64-control library with mappings so every recommendation can cite a control | P0 | PRD-0-01 | Done — sprint 1 (pending review) |
| E0-S02 | As a reader, I want framework, pillar and maturity-model documents consistent with the library | P0 | PRD-0-02 | Done — sprint 1 (pending review) |
| E0-S03 | As counsel, I want a generated compliance crosswalk with disclaimers and coverage gaps | P0 | PRD-0-03 | Done — sprint 1 (pending review) |
| E0-S04 | As a sector lead, I want five industry packs with use cases, tier hints, evidence, regimes and discovery questions | P1 | PRD-0-04 | Done — sprint 1 (pending review) |
| E0-S05 | As a content lead, I want automated tests for control IDs and prohibited claims across content | P0 | NFR-01, NFR-02 | Done — sprint 1 (pending review) |
| E0-S06 | As counsel, I want a legal review of mapping disclaimers and EU AI Act timeline caveats | P0 | NFR-10 | Planned |
| E0-S07 | As a governance lead, I want new controls for unmapped NIST AI RMF subcategories / ISO clauses where justified | P2 | — | Candidate (post-pilot) |

## Epic E1 — Website

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E1-S01 | As a visitor, I want a clear home page explaining AEGIS with CTAs | P0 | PRD-1-01 | Done — sprint 1 (pending review) |
| E1-S02 | As an evaluator, I want framework, pillar, maturity and control-library pages | P0 | PRD-1-01, PRD-1-03 | Done — sprint 1 (pending review) |
| E1-S03 | As a buyer, I want solutions pages for each module with limitations | P0 | PRD-1-01 | Done — sprint 1 (pending review) |
| E1-S04 | As counsel, I want compliance pages with disclaimers and coverage gaps | P0 | PRD-1-02 | Done — sprint 1 (pending review) |
| E1-S05 | As a sector lead, I want industry pages | P1 | PRD-1-01 | Done — sprint 1 (pending review) |
| E1-S06 | As a visitor, I want contact, Baseline, demo, newsletter and design-partner forms with consent | P0 | PRD-1-04 | Done — sprint 1 (pending review) |
| E1-S07 | As marketing, I want SEO artefacts (sitemap, JSON-LD, meta validation) | P1 | PRD-1-05 | Done — sprint 1 (pending review) |
| E1-S08 | As a privacy-conscious visitor, I want no cookies or third-party trackers | P0 | PRD-1-06 | Done — sprint 1 (pending review) |
| E1-S09 | As any user, I want accessible pages (WCAG 2.2 AA target) | P1 | PRD-1-07 | Planned |
| E1-S10 | As legal, I want privacy notice and terms reviewed before public launch | P0 | R-22 | Planned |

## Epic E2 — Maturity self-assessment & lead capture

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E2-S01 | As a visitor, I want to answer 24 questions and see an instant score and level | P0 | PRD-2-01, PRD-2-02 | Done — sprint 1 (pending review) |
| E2-S02 | As a visitor, I want a detailed report (Markdown/PDF) after giving my business email and consent | P0 | PRD-2-03 | Done — sprint 1 (pending review) |
| E2-S03 | As engineering, I want browser and Python engines to agree exactly | P0 | PRD-2-04 | Done — sprint 1 (pending review) |
| E2-S04 | As a governance lead, I want critical flags, 30/60/90 plan, recommended controls and readiness indicators | P0 | PRD-2-03, PRD-2-05 | Done — sprint 1 (pending review) |
| E2-S05 | As GTM, I want internal lead tags never shown to respondents | P0 | PRD-2-06 | Done — sprint 1 (pending review) |
| E2-S06 | As product, I want completion time and drop-off measured with privacy-friendly events | P1 | PRD-2-07 | Done — sprint 1 (pending review) |

## Epic E3 — AEGIS Agent MVP

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E3-S01 | As a user, I want to Ask AEGIS and get answers citing controls, or the exact no-source message | P0 | PRD-3-01, PRD-3-03 | Done — sprint 1 (pending review) |
| E3-S02 | As a user, I want a guided assessment through conversation | P0 | PRD-3-01 | Done — sprint 1 (pending review) |
| E3-S03 | As a governance lead, I want gap analysis with evidence labels and severities | P0 | PRD-3-01 | Done — sprint 1 (pending review) |
| E3-S04 | As a governance lead, I want draft reports generated with disclaimers | P0 | PRD-3-01, PRD-3-06 | Done — sprint 1 (pending review) |
| E3-S05 | As security, I want 14 tools with declared permissions, RBAC and audit logging | P0 | PRD-3-02 | Done — sprint 1 (pending review) |
| E3-S06 | As an approver, I want sensitive actions to create pending approvals resolved by another user | P0 | PRD-3-04 | Done — sprint 1 (pending review) |
| E3-S07 | As privacy, I want redaction before any external LLM call and log write | P0 | PRD-3-05 | Done — sprint 1 (pending review) |
| E3-S08 | As security, I want prompt-injection test cases in the evaluation suite | P1 | PRD-3-07 | Done — sprint 1 (pending review) |

## Epic E4 — Runtime Shield

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E4-S01 | As a platform lead, I want the Shield Advisor to turn a system profile into a risk profile, tool matrix and draft policy | P0 | PRD-4-01 | Done — sprint 1 (pending review) |
| E4-S02 | As engineering, I want an `aegis.policy/v1` schema and validator | P0 | PRD-4-02 | Done — sprint 1 (pending review) |
| E4-S03 | As engineering, I want an evaluator returning the seven decisions with precedence | P0 | PRD-4-03 | Done — sprint 1 (pending review) |
| E4-S04 | As a platform lead, I want rollout modes Observe → Warn → Protect → Enforce → Contain | P0 | PRD-4-04 | Done — sprint 1 (pending review) |
| E4-S05 | As security, I want default-deny tools and approval for high-impact operations | P0 | PRD-4-05 | Done — sprint 1 (pending review) |
| E4-S06 | As an approver, I want policy lifecycle states with human approval for activation | P0 | PRD-4-06 | Done — sprint 1 (pending review) |
| E4-S07 | As a platform lead, I want reference policy packs | P1 | PRD-4-07 | Done — sprint 1 (pending review) |
| E4-S08 | As a platform lead, I want LLM-gateway integration adapters | P2 | — | Candidate (post-pilot) |

## Epic E5 — Design-partner pilots

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E5-S01 | As delivery, I want Pilot A and Pilot B plans, scorecards and onboarding checklists | P0 | PRD-5-01, PRD-5-02 | Done — sprint 1 (pending review) |
| E5-S02 | As delivery, I want shared templates (safeguards, workshop kit, session guide, deep-dive plan, agent review, gap register, roadmap, Shield recs, exec report, survey, follow-on proposal) | P0 | PRD-5-01, PRD-5-03 | Done — sprint 1 (pending review) |
| E5-S03 | As commercial, I want recruitment criteria, outreach sequence and qualification scorecard | P0 | PRD-5-04 | Done — sprint 1 (pending review) |
| E5-S04 | As commercial, I want to recruit and sign a Pilot A design partner | P0 | PRD-5-04 | Blocked — requires real design partners |
| E5-S05 | As commercial, I want to recruit and sign a Pilot B design partner | P0 | PRD-5-04 | Blocked — requires real design partners |
| E5-S06 | As delivery, I want to run Pilot A and record scorecard results with evidence | P0 | PRD-5-04 | Blocked — requires real design partners |
| E5-S07 | As delivery, I want to run Pilot B and record scorecard results with evidence | P0 | PRD-5-04 | Blocked — requires real design partners |
| E5-S08 | As product, I want pilot feedback to update framework, assessment, agent and pricing | P1 | PRD-5-05 | Blocked — requires real design partners |
| E5-S09 | As delivery, I want a pilot workspace that logs Agent-assisted completion (for M3) | P0 | PRD-5-02 | Planned |

## Epic E6 — Commercial launch & GTM

| ID | Story | Priority | Req | Status |
|---|---|---|---|---|
| E6-S01 | As commercial, I want pricing models and packaged tiers labelled as hypotheses | P0 | PRD-6-01 | Done — sprint 1 (pending review) |
| E6-S02 | As sales, I want seven one-pagers | P0 | PRD-6-02 | Done — sprint 1 (pending review) |
| E6-S03 | As sales, I want an ROI calculator with transparent formulas and a worked example | P0 | PRD-6-03 | Done — sprint 1 (pending review) |
| E6-S04 | As sales, I want 20/45-minute demo scripts, objection handling, proposal and case-study templates, and a 90-day onboarding plan | P0 | PRD-6-04 | Done — sprint 1 (pending review) |
| E6-S05 | As GTM, I want ICP, messaging, channels, launch stages and lead rules matching the self-assessment | P0 | PRD-6-05 | Done — sprint 1 (pending review) |
| E6-S06 | As commercial, I want pricing validated with pilot evidence | P0 | PRD-6-06 | Blocked — requires real design partners |
| E6-S07 | As commercial, I want the first paid follow-on signed | P0 | PRD-6-06 | Blocked — requires real design partners |
| E6-S08 | As marketing, I want approved case studies (written approval + verified metrics) | P1 | PRD-6-06 | Blocked — requires real design partners |
| E6-S09 | As GTM, I want a partner programme for advisory firms and SIs | P2 | — | Candidate (post-pilot) |
| E6-S10 | As GTM, I want SEO keyword research to validate cluster hypotheses | P1 | PRD-1-05 | Planned |

## Epic E7 — Platform expansion (post-pilot)

| ID | Story | Priority | Status |
|---|---|---|---|
| E7-S01 | Production multi-tenant hosting with SSO | P1 | Candidate (post-pilot) |
| E7-S02 | Register discovery connectors (procurement, cloud AI services, SaaS admin) | P1 | Candidate (post-pilot) |
| E7-S03 | ITSM/GRC connectors | P2 | Candidate (post-pilot) |
| E7-S04 | Assurance control-testing automation and WORM evidence storage | P2 | Candidate (post-pilot) |
| E7-S05 | Additional industry packs based on pilot demand | P2 | Candidate (post-pilot) |
