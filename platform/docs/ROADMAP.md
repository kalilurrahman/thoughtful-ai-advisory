# AEGIS Roadmap

Version 3.0 · 21 October 2026 · Owner: Product Lead · Status: Active

This roadmap sequences AEGIS as **increments with dependencies, definitions of done and exit criteria**. It
deliberately carries **no calendar estimates for future work**: an increment starts when its dependencies meet their
exit criteria, and it ends when its own exit criteria are met. Stories live in [BACKLOG](BACKLOG.md); risks in
[RISK_REGISTER](RISK_REGISTER.md); requirements in [PRODUCT_REQUIREMENTS](PRODUCT_REQUIREMENTS.md).

## 1. Status at a glance (21 October 2026)

| Phase | Increment | Status |
|---|---|---|
| 0 | Framework & content foundation | Content built in sprint 1 (control library, framework docs, mappings, industry packs) — pending human review |
| 1 | Website | In progress — built in sprint 1 |
| 2 | Maturity self-assessment & lead capture | In progress — built in sprint 1 |
| 3 | AEGIS Agent MVP | In progress — built in sprint 1 |
| 4 | Runtime Shield Advisor & policy-as-code | In progress — built in sprint 1 |
| 5 | Design-partner pilots | Kits ready; execution **Blocked — requires real design partners** |
| 6 | Commercial launch & GTM | Commercial kit ready; execution **Blocked — requires real design partners/customers** |
| 7+ | Platform expansion (post-pilot) | Not started — scope set by pilot evidence |

## 2. Dependency map

```
                 ┌──────────────────────────────────────────────┐
                 │ Phase 0  Framework & content foundation       │
                 │ controls.yaml · assessment template · mappings│
                 └───────┬───────────────┬───────────────┬───────┘
                         │               │               │
               ┌─────────▼───┐   ┌───────▼───────┐   ┌───▼──────────────┐
               │ Phase 1     │   │ Phase 2       │   │ Phase 4          │
               │ Website     │◄──┤ Self-assess.  │   │ Runtime Shield   │
               └─────┬───────┘   └───────┬───────┘   └───┬──────────────┘
                     │                   │               │
                     │           ┌───────▼───────┐       │
                     │           │ Phase 3       │◄──────┘ (draft_runtime_policy tool)
                     │           │ AEGIS Agent   │
                     │           └───────┬───────┘
                     │                   │
               ┌─────▼───────────────────▼───────────────▼─────┐
               │ Phase 5  Design-partner pilots (A and B)       │
               │ needs: 1–4 exit criteria + signed partners     │
               └───────────────────────┬───────────────────────┘
                                       │ evidence (scorecards, survey, objections)
               ┌───────────────────────▼───────────────────────┐
               │ Phase 6  Commercial launch & GTM               │
               └───────────────────────┬───────────────────────┘
                                       │
               ┌───────────────────────▼───────────────────────┐
               │ Phase 7+ Platform expansion (Register/Control/ │
               │ Assurance productization, integrations, hosting)│
               └───────────────────────────────────────────────┘
```

| Dependency | Why |
|---|---|
| Phase 0 → all | Every component cites controls and reads the assessment template |
| Phase 2 → Phase 1 | Assessment tool page and lead forms are part of the site |
| Phase 4 → Phase 3 | The Agent's `draft_runtime_policy` tool calls the Shield generator |
| Phases 1–4 → Phase 5 | Pilots use the website, self-assessment, Agent and Shield Advisor |
| Signed design partners → Phase 5 | External dependency; tracked as R-12 |
| Phase 5 → Phase 6 | Pricing, messaging and case studies must come from pilot evidence |
| Phase 6 → Phase 7+ | Expansion scope prioritized by paid demand |

## 3. Increments, definitions of done and exit criteria

### Phase 0 — Framework & content foundation

| Item | Detail |
|---|---|
| Scope | Control library (64 controls), assessment template, framework/pillars/maturity docs, generated compliance mapping, industry packs, decision log entries |
| Definition of done | Content files exist; content tests pass; every cited control ID exists; no prohibited claims; mapping regenerates identically |
| Exit criteria | Governance Content Lead review complete; legal review of compliance mapping disclaimers and EU AI Act timeline caveat scheduled |

### Phase 1 — Website

| Item | Detail |
|---|---|
| Scope | IA and pages per [WEBSITE_CONTENT_PLAN](WEBSITE_CONTENT_PLAN.md); static generator; CTAs; forms; SEO artefacts; privacy-friendly events |
| Definition of done | Site builds from content; front-matter validation; unknown-control and prohibited-claim checks pass; no cookies/trackers/CDNs; forms post to API |
| Exit criteria | Accessibility checklist and legal review of privacy notice/terms complete (R-22); demo environment deployable |

### Phase 2 — Maturity self-assessment & lead capture

| Item | Detail |
|---|---|
| Scope | 24-question assessment; Python and browser engines; preliminary API; lead capture; Markdown/PDF report; lead tags |
| Definition of done | Engine and report tests pass; parity test passes; User-asserted labels and disclaimer on all outputs; tags never returned to respondent |
| Exit criteria | End-to-end flow demonstrated on synthetic data; median completion time measured in internal testing |

### Phase 3 — AEGIS Agent MVP

| Item | Detail |
|---|---|
| Scope | Journeys: Ask AEGIS, guided assessment, gap analysis, report generation; 14 tools with permissions; approvals; audit; redaction; optional LLM |
| Definition of done | Agent evaluation suite passes (citations valid, no-source message, no prohibited claims, injection cases); sensitive actions create pending approvals |
| Exit criteria | Demo script steps (c) and (d) succeed reliably; security tests for redaction and RBAC pass |

### Phase 4 — Runtime Shield Advisor & policy-as-code

| Item | Detail |
|---|---|
| Scope | Advisor; `aegis.policy/v1` schema, validator, evaluator; decisions; rollout modes; lifecycle; kill switch; limits; policy packs |
| Definition of done | Policy-engine tests pass; all policy packs validate; advisor output validates; default-deny enforced; no raw logging |
| Exit criteria | 45-minute demo Shield segment runs end-to-end; at least one reference integration example documented |

### Phase 5 — Design-partner pilots

| Item | Detail |
|---|---|
| Scope | Pilot A (regulated enterprise, 20–100 AI systems) and Pilot B (AI-forward, LLM apps and agents), 4–6 weeks each, using `content/pilots/` kits |
| Entry criteria | Phases 1–4 exit criteria met; partner qualified (score ≥ 32) and signed; safeguards signed |
| Definition of done | Scorecards complete with evidence references; survey analyzed; executive report delivered; follow-on proposal presented |
| Exit criteria | Per pilot: M1 ≥ 25 systems registered; M2 100% of High-tier assessed; M3 ≥ 70% agent-assisted completion; M4 ≥ 2 runtime policies drafted; M5 report accepted; M6 follow-on discussion initiated — or a documented explanation of misses and resulting backlog changes |
| Current status | **Blocked — requires real design partners** (tracker: both "Not started — awaiting design-partner recruitment") |

### Phase 6 — Commercial launch & GTM

| Item | Detail |
|---|---|
| Scope | Pricing validation; one-pagers; ROI calculator; demo scripts; proposals; case studies (with approval); onboarding; GTM stages L1–L4 |
| Entry criteria | Commercial kit complete (done); at least one pilot readout for validated launch (L3) |
| Definition of done | Pricing hypotheses revised with pilot evidence; first paid follow-on signed; onboarding plan executed for first customer |
| Exit criteria | Repeatable Baseline → platform conversion observed; case studies published only with written approval and verified metrics |
| Current status | Kit ready; execution **Blocked — requires real design partners/customers** |

### Phase 7+ — Platform expansion (post-pilot, scope set by evidence)

Candidate increments, prioritized after Phase 5: production multi-tenant hosting and SSO; Register discovery
connectors (procurement, cloud AI services, SaaS admin APIs); ITSM/GRC connectors; Assurance control-testing
automation; WORM evidence storage; LLM-gateway integrations for Shield; additional industry packs; additional controls
for unmapped NIST AI RMF subcategories and ISO/IEC 42001 clauses (see `docs/COMPLIANCE_MAPPING.md` §7).

## 4. Roadmap governance

- Re-sequencing requires a DECISION_LOG entry when it changes a phase's scope or exit criteria.
- Phase status changes only on evidence (tests, signed documents, scorecards).
- Reviewed at each pilot readout and whenever a High risk changes rating.
