# VERITRAIL Risk Register

Version 3.0 · 21 October 2026 · Owner: Product Lead (register custodian) · Review: fortnightly during pilots, monthly
otherwise, and on any incident.

**Scales.** Likelihood (L) and Impact (I): 1 = very low … 5 = very high. **Score** = L × I. **Rating:** 15–25 High,
8–14 Medium, 1–7 Low. **Status:** Open (no mitigation yet) · Mitigating (mitigation in progress) · Monitoring
(mitigations in place, watching indicators) · Closed.

Scores reflect the pre-pilot position on 21 October 2026 and are judgement-based (no incident history yet).

## 1. Summary heat map

| | I=1 | I=2 | I=3 | I=4 | I=5 |
|---|---|---|---|---|---|
| **L=4** | | | R-03 | R-06, R-12, R-13 | R-02 |
| **L=3** | | | R-05, R-14, R-18, R-19 | R-04, R-07, R-09, R-16, R-17 | R-01, R-15 |
| **L=2** | | | R-21 | R-10, R-11, R-20, R-22 | R-08 |

## 2. Register

| ID | Category | Risk | L | I | Score | Owner | Mitigation | Indicators / triggers | Status |
|---|---|---|---|---|---|---|---|---|---|
| R-01 | Security / privacy | **Sensitive-data sharing**: partner or user data (PII, confidential, production prompts) reaches VERITRAIL stores or external LLMs | 3 | 5 | 15 High | Security & Privacy Lead | Metadata-only pilot default; redaction before any external LLM call or log write (`veritrail_common.redaction`); LLM optional; no production data to external LLMs; NDA/DPA; least-privilege roles; retention/deletion (`content/pilots/templates/data_access_privacy_safeguards.md`); security tests | Redaction test failures; partner requests to upload raw data; unredacted strings in logs | Mitigating |
| R-02 | Legal / product | **Unsupported compliance advice**: Agent, reports or content state or imply compliance, certification or legal conclusions, or cite non-existent controls/clauses | 4 | 5 | 20 High | Governance Content Lead | Citation-first rule with exact no-source message; `find_prohibited_claims()` in agent, reports, website build and content tests; control-ID validation tests; standard disclaimer; indicative-mapping caveats; agent evaluation suite | Survey C2–C4 below threshold; any C7 "yes"; claim-check findings | Mitigating |
| R-03 | Product | **Assessment too long** → drop-off and low lead conversion | 4 | 3 | 12 Medium | Product Lead | 24 questions, ~8 minutes; instant preliminary result before email; Agent-guided option; measure completion and time | Completion rate and median time from events; survey B1, B5 | Monitoring |
| R-04 | Product / delivery | **Runtime friction**: guardrails block legitimate work or add approval latency, so developers bypass Shield | 3 | 4 | 12 Medium | Shield Lead | Progressive rollout Observe → Warn → Protect → Enforce; exit criteria per stage; policy-as-code in repo; false-positive review; approval-latency targets | Survey E1–E4; S4 false-positive share; bypass reports | Mitigating |
| R-05 | Delivery | **Pilot scope creep**: extra systems, integrations or deliverables erode the 6-week plan | 3 | 3 | 9 Medium | Delivery Lead | Fixed scope note signed in Week 1; swap-or-defer change rule; weekly scorecard; sponsor approves swaps | Change-log entries per week; slipping exit criteria | Monitoring |
| R-06 | Commercial | **Low conversion** from pilots/Baselines to paid platform | 4 | 4 | 16 High | Commercial Lead | Qualification scorecard (budget path, sponsor); follow-on proposal at Week 6; conversion credit; ROI with measured signals; objection log | M6 outcomes; survey G1; proposal win/loss reasons | Open |
| R-07 | Legal / content | **Outdated regulatory content**: EU AI Act timelines (incl. possible Digital Omnibus changes), sector regimes or mappings go stale | 3 | 4 | 12 Medium | Governance Content Lead (with Legal) | Quarterly review; "verify against current Official Journal text and amendments" caveat everywhere; no dates presented as settled; regenerate mappings; industry-pack regimes flagged "verify with counsel" | Official publications; customer questions on dates; review overdue | Monitoring |
| R-08 | Legal | **Mapping misread** as an official crosswalk or certification evidence | 2 | 5 | 10 Medium | Governance Content Lead | Prominent disclaimers; "indicative" labelling; coverage-gap section; support-boundary column for Art. 43/49/72/73 | Customer statements referencing VERITRAIL as certification | Monitoring |
| R-09 | Security | **Prompt injection** against the VERITRAIL Agent via user input or retrieved content | 3 | 4 | 12 Medium | AI/Agent Engineer | Deterministic-first agent; injection detection; tools least-privilege with drafts and approvals; no tool can self-execute sensitive actions; security tests | Injection test failures; anomalous tool calls in audit log | Mitigating |
| R-10 | Security | **Audit-log integrity**: tampering or gaps undermine evidence | 2 | 4 | 8 Medium | Security Engineer | Hash-chained JSONL; admin verification; append-only practices; production plan for WORM storage | Verification failures | Monitoring |
| R-11 | Legal / privacy | **Lead PII handling**: consent, retention, cross-border transfer for website leads | 2 | 4 | 8 Medium | Privacy Lead | Explicit consent; business-email only; no cookies/trackers; configurable retention; privacy notice template pending legal review | Legal review outstanding; deletion requests | Mitigating |
| R-12 | Commercial | **Design-partner recruitment fails** or is slow, blocking pilots | 4 | 4 | 16 High | Commercial Lead | Warm-intro-first outreach; self-assessment lead tags; clear value for partners; no-fee/discounted pilot terms; partner channel | Funnel tracker stalls at contacted/discovery | Open |
| R-13 | Product | **Self-report optimism bias** makes maturity scores look better than evidence supports | 4 | 4 | 16 High | Product Lead | All results labelled User-asserted; validated score alongside self-reported in pilots; evidence sampling rules | Signal S6 (self vs. validated delta) | Monitoring |
| R-14 | Delivery | **Key-person and capacity risk**: small team runs two pilots plus product build | 3 | 3 | 9 Medium | Delivery Lead | Standard kits; Agent-assisted delivery; stagger pilot starts; partner delivery option | Missed weekly status; overtime | Open |
| R-15 | Commercial / legal | **Over-claiming in sales and marketing** (customers, results, endorsements, compliance) | 3 | 5 | 15 High | Commercial Lead | Banned-phrase list; case-study written-approval rule; content tests; demo rules; objection guide lines | Review findings; prospect confusion | Mitigating |
| R-16 | Commercial | **Pricing hypotheses wrong** (metric or level) | 3 | 4 | 12 Medium | Commercial Lead | Labelled hypotheses; survey G2–G5; test multiple metrics; revise after pilots | Price objections; win/loss | Open |
| R-17 | Security / product | **False sense of security**: Shield detectors miss attacks or sensitive data; customers over-rely | 3 | 4 | 12 Medium | Shield Lead | Communicate limitations; pair with adversarial testing (IS-14); defense-in-depth messaging; detector test suites | Missed detections in tests; incident reports | Mitigating |
| R-18 | Technical | **Engine parity drift** between browser and Python scoring | 3 | 3 | 9 Medium | Orchestrator | Data-driven rules; parity test in CI | Parity test failures | Monitoring |
| R-19 | Commercial | **Competitive pressure** from GRC incumbents and guardrail vendors | 3 | 3 | 9 Medium | GTM Lead | Differentiate on evidence labels + runtime + citations; partner channel; integrate rather than replace GRC | Lost deals to incumbents | Open |
| R-20 | Legal / delivery | **Liability from runtime policy outcomes** (blocking production or permitting harmful actions) | 2 | 4 | 8 Medium | Shield Lead with Legal | VERITRAIL never activates customer policy; customer named approver for production changes; draft/observe defaults; contract terms on responsibilities | Customer escalations | Monitoring |
| R-21 | Technical | **Third-party LLM dependency** (availability, data terms, behaviour change) | 2 | 3 | 6 Low | AI/Agent Engineer | LLM optional and phrasing-only; deterministic fallback; vendor due diligence (GL-11) | Provider incidents; term changes | Monitoring |
| R-22 | Legal | **Launch-blocking legal and accessibility reviews** not completed (privacy notice, terms, WCAG) | 2 | 4 | 8 Medium | Marketing Lead with Legal | Templates flagged "legal review required"; accessibility checklist before public launch (L0 exit criterion) | Review not scheduled | Open |

## 3. Risk acceptance

No risk is accepted at this time. Accepting a High risk requires the Product Lead and the accountable executive, with
a recorded rationale and review date (mirroring GL-10 for customers).

## 4. Change log

| Date | Change |
|---|---|
| 2026-10-21 | v3.0 register created from Blueprint v2.0 risks (R-01–R-07) plus product, legal, security, commercial and delivery risks R-08–R-22 |
