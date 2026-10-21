# AEGIS Launch — Status Report

**As of:** 21 October 2026 · **Increment:** Sprint 1, launch build (Phases 1–4 built; Phases 5–6 prepared) · **Owner:** AEGIS Launch Orchestrator

> Status discipline: "Done" means built **and** covered by passing automated tests, or (for content) passing automated content checks. Nothing here claims customer validation, and every sample uses a fictional organization.

## 1. Summary

| Phase | Scope | Status | Evidence |
|---|---|---|---|
| Foundation | 64-control library, assessment template, audit chain, redaction, evidence labels, claim guard | ✅ Done | `tests/unit/test_common.py`, `scripts/check_content.py` |
| 1 Website | 56 authored pages + generated control pages (121 pages total), SEO, JSON-LD, sitemap, a11y/link checks, forms, cookieless analytics | ✅ Built — ⏳ not deployed | `make site` (build checks pass), website tests |
| 2 Self-assessment | 24 questions / 8 weighted domains, instant score, business-email gate, MD/PDF report, CRM + email adapters, lead qualification | ✅ Built — ⏳ awaiting real CRM/ESP credentials | `tests/unit/test_assessment_engine.py`, `tests/integration/test_api.py`, JS↔Python parity test |
| 3 AEGIS Agent MVP | Ask AEGIS, guided assessment, gap analysis, reports (MD/PDF/CSV/JSON), 14 tools, RBAC, approvals, audit | ✅ Done | Agent eval 73/73 (safety 27/27), agent unit/security tests, `docs/AGENT_DESIGN.md` |
| 4 Runtime Shield | Advisor, policy-as-code generator (YAML/JSON, versioning), engine (7 decisions × 5 rollout modes, kill switch, limits), 6 policy packs | ✅ Done | `tests/policy-engine`, `tests/security/test_policy_*` |
| 5 Pilots | Pilot A/B plans, metrics scorecards, onboarding, safeguards, workshop kit, templates, feedback survey, proposal; synthetic dress rehearsal run | ✅ Prepared — ⛔ execution blocked (no design partners yet) | `content/pilots/`, `output/sample_reports/pilot_dry_run/` |
| 6 Commercial | Pricing hypotheses, 7 one-pagers, proposal template, ROI calculator (tested), demo script, objection handling, case-study template, 90-day onboarding | ✅ Prepared — ⛔ validation blocked on pilots | `content/commercial/`, `tests/unit/test_content_roi.py` |

## 2. Completed work (this increment)
- **Governed content:** control library v1.0.0 (AO 12, EI 12, GL 12, IS 16, SE 12), each with indicative NIST AI RMF / ISO/IEC 42001 / EU AI Act mappings. Also the maturity template, use-case question bank (9 modules), 5 industry packs, 6 runtime policy packs and email templates with an approval model.
- **Engines:** a reference maturity engine with integer round-half-up arithmetic, and a browser engine held to identical output by a parity test. Use-case risk tiering with explainable factors, an EU AI Act Art. 5 prohibited-practice screen and an Annex III-like trigger for legal review. The safest default applies when facts are missing.
- **API:** lead capture with business-email gate, consent and honeypot; HMAC-gated report downloads; CRM adapters (JSONL, webhook, HubSpot); mail adapters (outbox, SMTP); cookieless analytics. Also the risk-tier, Shield and Agent endpoints, a strict CSP and security headers, and rate limiting.
- **Admin CLI:** audit-chain verification, approvals with separation of duties, lead export, funnel analytics.
- **Reports:** Markdown→PDF renderer and CSV exporter with formula-injection protection. Maturity report with all ten required sections.
- **Docs:** all 13 required docs, plus BACKLOG, CONTRIBUTING (contracts) and 9 architecture diagrams (PNG/SVG, solution diagram also as PDF).
- **Samples (synthetic):** 3 maturity reports (Initial, Developing, Defined), 3 risk-tier results, Agent run, Shield advice and policies, and a full Pilot A dress rehearsal:
  - 28 systems registered and tier-confirmed through approvals
  - 12 High-tier deep dives covering 100% of High-tier systems
  - 403 gaps, 40 Critical remediation tasks created after confirmation
  - 2 runtime policies drafted with activation pending approval
  - evidence pack exported only after approval, and self-approval refused
  - audit chain of 675 records verified
- **Master document:** `output/AEGIS_Launch_and_Enhancement_Blueprint_v3.md` (+ PDF as the website's Enterprise Blueprint download).

## 3. Validation results (final build)
| Check | Result |
|---|---|
| Full automated test suite (`make test`) | **999 passed, 0 failed, 9 xfailed.** The xfails deliberately pin known detector limitations and fail loudly if fixed |
| — unit / integration / agent-evaluation / policy-engine / security | 439 / 79 / 5 (73 eval cases) / 293 / 183 (+9 xfail) |
| Agent evaluation | 73/73 cases. Safety categories 27/27, also with a deliberately hostile LLM adapter. Self-authored cases, so a held-out set from pilot transcripts is still needed |
| Python ↔ browser engine parity | 72 random and edge cases + 10 invalid inputs, identical output. Browser Markdown report identical to server |
| Website build checks | 121 pages + 404. No missing meta/h1, broken links, unlabelled inputs, inline/external scripts or prohibited claims |
| Content checks (`make check`) | 64 controls; every control reference resolves; 6 policy packs valid; 0 prohibited-claim hits |
| Live smoke test (API + site) | Lead → emailed report → signed PDF download; Ask AEGIS answer per Blueprint §4.5; injection refused; Shield policy generated |
| Browser check | Desktop and mobile screenshots in `docs/screenshots/`. Header CTA spacing bug found and fixed |
| Pilot dress rehearsal | 28 systems, 12/12 High-tier deep dives, 403 gaps, 2 policies, approval-gated export, self-approval refused, 675-record audit chain verified |

## 3a. In progress
- None in this increment. Next increment is the launch gate (§8).

## 4. Blocked
| Item | Blocker | Unblock action |
|---|---|---|
| Public website launch | No production domain/hosting; legal review of privacy/terms templates; named email-template approver (placeholder in `content/email_templates.yaml`) | Assign domain + host; legal review; replace placeholder approver (DEC-0007) |
| Live CRM / email | No CRM/ESP account credentials | Configure `AEGIS_CRM_*`, `AEGIS_MAIL_*` (API_SPECIFICATION §3); enable DKIM/SPF/DMARC and double opt-in |
| Pilots A and B | No signed design partners | Run outreach per `content/pilots/` recruitment plan; sign NDA/DPA; then follow PILOT_PLAYBOOK |
| Commercial validation, case studies | Depend on pilots | Do not publish case studies without written customer approval and verified metrics |

## 5. Assumptions
1. Target buyers are regulated enterprises and AI-forward SaaS/GCC firms as defined in the blueprint.
2. The blueprint's scoring formula is retained, including the floor of 20 (DEC-0004).
3. A Python static site is acceptable instead of Next.js/Astro for the MVP. Content is portable (DEC-0005).
4. The public Agent demo runs as least-privilege `viewer`. Authenticated roles need SSO before any customer use.
5. Price points in `content/commercial/pricing_models.md` are hypotheses to validate in pilots.

## 6. Open questions
| ID | Question | Owner |
|---|---|---|
| OQ-01 | Current EU AI Act application dates, including the status of the 2025 Digital Omnibus proposals. Content currently tells readers to verify | Legal |
| OQ-02 | Retention periods for leads, audit and pilot data | Legal / DPO |
| OQ-03 | Named approver for transactional email templates | Marketing lead |
| OQ-04 | Production hosting region and data-residency commitments for EU/India customers | CTO |
| OQ-05 | Which LLM provider (if any) for optional agent phrasing, and its contractual data terms | CTO / Security |
| OQ-06 | Validation of framework mappings by an ISO/IEC 42001 lead implementer and an EU AI Act specialist | Governance Content Lead |

## 7. Top risks (full list in docs/RISK_REGISTER.md)
1. **Unsupported compliance advice.** Mitigated by the claim guard on all outputs, citation enforcement, evidence labels, a CI content scan and agent safety evals.
2. **Regulatory content drift.** Mitigated by versioned content and dated disclaimers. Legal review (OQ-01, OQ-06) is outstanding.
3. **Heuristic detectors.** Regex PII and injection detection is limited. Known gaps are documented as xfail tests. Production needs DLP and a classifier.
4. **Single-node file storage.** Acceptable for demo and pilots. A database is needed before multi-tenant SaaS.
5. **Pilot recruitment.** No partners yet. This is the critical path to commercial proof.

## 8. Next actions (in priority order)
1. Close the launch gate: legal review (privacy, terms, compliance pages), named approvers, domain and hosting, CRM/ESP credentials. Then deploy the site and API.
2. Recruit design partners: start outreach for Pilot A (regulated, 20–100 AI systems) and Pilot B (agents/LLM apps) using the qualification scorecard.
3. Get expert review of the framework mappings and refresh the EU AI Act timeline content.
4. Production hardening: SSO/RBAC, PostgreSQL store, WORM audit sink, DLP-grade redaction.
5. Calibrate the maturity scoring with pilot data (backlog item) and convert pilot feedback into backlog stories.
