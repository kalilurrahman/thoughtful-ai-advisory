# VERITRAIL Decision Log

Architecture and product decisions, newest last. Each entry: context → decision → consequences.
Status values: Accepted, Superseded, Proposed.

| ID | Date | Decision | Status | Owner |
|---|---|---|---|---|
| DEC-0001 | 2026-10-21 | Single control library (`content/controls/controls.yaml`) is the only source of control IDs | Accepted | Governance Content Lead |
| DEC-0002 | 2026-10-21 | Data-driven self-assessment rules interpreted by twin Python/JS engines with a parity test | Accepted | Orchestrator |
| DEC-0003 | 2026-10-21 | Integer round-half-up scoring arithmetic | Accepted | Orchestrator |
| DEC-0004 | 2026-10-21 | Keep blueprint scoring formula (min score 20) | Accepted | Product Lead |
| DEC-0005 | 2026-10-21 | Python static site generator + vanilla JS instead of Next.js/Astro for the MVP | Accepted | Orchestrator |
| DEC-0006 | 2026-10-21 | Stdlib HTTP API with pluggable CRM/email adapters; local adapters by default | Accepted | Orchestrator |
| DEC-0007 | 2026-10-21 | Transactional email templates pre-approved once; all other external email needs per-message approval | Accepted | Product Lead / Marketing |
| DEC-0008 | 2026-10-21 | Deterministic-first VERITRAIL Agent; LLM optional and phrasing-only | Accepted | AI/Agent Engineer |
| DEC-0009 | 2026-10-21 | Hash-chained JSONL audit log as MVP immutability mechanism | Accepted | Security Engineer |
| DEC-0010 | 2026-10-21 | All self-assessment output labelled User-asserted; risk tiers labelled Inferred and require human confirmation | Accepted | Governance Content Lead |
| DEC-0011 | 2026-10-21 | Framework mappings published as "indicative" with explicit coverage gaps | Accepted | Governance Content Lead |
| DEC-0012 | 2026-10-21 | Regulatory timelines not asserted; flagged for verification | Accepted | Legal (pending) |
| DEC-0013 | 2026-10-21 | Pilots and commercial execution marked Blocked until real design partners sign | Accepted | Product Lead |
| DEC-0014 | 2026-10-21 | Hyphenated `/app/*` directories each contain an importable Python package | Accepted | Orchestrator |
| DEC-0015 | 2026-10-21 | Lead qualification tags never returned to the respondent | Accepted | GTM Lead |
| DEC-0016 | 2026-10-21 | Known detector limitations pinned as strict-xfail tests; shared redaction extended with cloud-token patterns | Accepted | Security Engineer |
| DEC-0017 | 2026-10-21 | Public Agent demo pinned to `viewer`; write tools require authenticated assessor role | Accepted | Security Engineer |

---

### DEC-0001 — One control library
**Context.** The agent, assessment, Shield advisor, reports and website all cite controls. Divergent IDs would break the citation-first principle.
**Decision.** 64 controls across five pillars (AO, EI, GL, IS, SE) live in `content/controls/controls.yaml`, each with objective, evidence, owner role, priority, applies-to scope and indicative NIST AI RMF / ISO/IEC 42001 / EU AI Act mappings. IS-11, IS-14 and SE-08 keep the meanings used in Blueprint v2.0 examples.
**Consequences.** Website build fails on unknown control IDs. Tests in every workstream check citations against the library. Library changes need versioning (`library.version`) and a review entry here.

### DEC-0002 — Twin engines, one rule set
**Context.** The self-assessment must give an instant result on a static site, and also produce a server-side PDF and CRM record.
**Decision.** Scoring, flags, action plan, modules and lead rules are data in `maturity_self_assessment.yaml`. Python (`veritrail_assessment.engine`) is the reference engine. The browser engine interprets the same data. `tests/integration/test_website_engine_parity.py` compares the two on random and edge-case inputs.
**Consequences.** Any rule change is a YAML change plus a parity run. Logic that can't be expressed as data needs a decision entry.

### DEC-0003 — Integer arithmetic for scores
**Context.** Python's `round()` uses banker's rounding and JS floats differ at .x5 boundaries, which would make browser and PDF results disagree.
**Decision.** `round_half_up_1dp(num, den) = floor((20·num + den) / (2·den)) / 10` on integer numerators. Overall uses the LCM of domain denominators.
**Consequences.** Scores agree exactly across engines. The documented formula is equivalent to Σ(domain% × weight).

### DEC-0004 — Keep the blueprint's scoring formula
**Context.** `DomainScore = sum/max × 100` with a 1–5 scale gives a floor of 20 (all "Not started" = 20, "Initial").
**Decision.** Keep the blueprint formula for transparency and continuity. Document the floor in the maturity model.
**Consequences.** Level thresholds (0–39 Initial…) apply unchanged. Revisit after pilot calibration (backlog item).

### DEC-0005 — Static site generator for the MVP
**Context.** The blueprint suggested Next.js or Astro. Package registries may be unavailable in build environments, and the main web requirements are content, SEO, accessibility and Core Web Vitals.
**Decision.** Python + Markdown + Jinja2 static generator, vanilla JS for interactive tools, no third-party CDNs or cookies.
**Consequences.** Zero runtime dependencies and a deterministic build that deploys to any static host or CDN. Content stays portable Markdown with front matter, so moving to Astro later is a template rewrite only. Trade-off: no component framework, and no on-demand ISR.

### DEC-0006 — Stdlib API, pluggable integrations
**Decision.** `veritrail_api` uses `http.server` (ThreadingHTTPServer) behind a reverse proxy in production. CRM adapters: JSONL (default), generic webhook, HubSpot Forms. Mail: `.eml` outbox (default) or SMTP.
**Consequences.** Works end to end with no third-party accounts. Production needs TLS termination, a proxy and persistent storage (see TECHNICAL_ARCHITECTURE §Deployment).

### DEC-0007 — External communications approval model
**Context.** The operating principles require human approval for external communications. Report delivery is a user-requested transactional email.
**Decision.** Templates in `content/email_templates.yaml` carry `status` and an `approval` record (approver, date, reference). The API sends only approved templates. Any other message is queued in `var/approvals/` for a human approver. Nurture/marketing templates stay `draft`.
**Consequences.** The approver field is a **placeholder** and must be replaced with a named approver before launch (open question OQ-03).

### DEC-0008 — Deterministic-first agent
**Context.** No LLM key in the build environment. Trust requires citations and no fabricated compliance claims.
**Decision.** Intent routing, retrieval (BM25 over governed content), the assessment state machine and report composition are deterministic. An optional LLM adapter may rephrase, but only sees redacted text, and its output is discarded unless it passes citation validation and the prohibited-claim check.
**Consequences.** Answers are reproducible and testable (agent-evaluation suite). Phrasing is more templated than an LLM's.

### DEC-0009 — Tamper-evident audit log
**Decision.** Append-only JSONL with SHA-256 hash chaining (`veritrail_common.audit`). `veritrail-admin audit verify` detects modification, deletion and reordering.
**Consequences.** This gives tamper *evidence*, not prevention. Production must also ship records to WORM/object-lock storage or a SIEM (Risk R-SEC-03).

### DEC-0010 — Evidence labelling defaults
**Decision.** All self-assessment output is *User-asserted*. Risk tiers and advisor outputs are *Inferred* and carry `requires_human_confirmation`. *Verified* needs an evidence reference plus a named reviewer.

### DEC-0011 — Indicative mappings with explicit gaps
**Decision.** Mappings are labelled indicative VERITRAIL interpretations. COMPLIANCE_MAPPING lists what VERITRAIL does not cover (e.g. notified-body conformity assessment, CE marking, EU database registration, GPAI provider obligations).

### DEC-0012 — Regulatory timelines
**Context.** No web access was available in the build session, and post-2025 amendments (e.g. the Commission's November 2025 "Digital Omnibus" proposals affecting high-risk timelines) could not be verified.
**Decision.** Content does not assert application dates. It instructs readers to verify against the current Official Journal text. Legal review is required before launch (OQ-01).

### DEC-0013 — Honest status for pilots and commercial work
**Decision.** Pilot kits, the commercial kit and the ROI calculator are built and tested. Pilot execution is **Blocked** until real design partners sign. No case studies, logos, testimonials or results are published until then. Price points are labelled hypotheses.

### DEC-0014 — Repository layout
**Decision.** Keep the required `/app/<hyphenated>` directories. Each holds an importable package (`veritrail_assessment`, `veritrail_policy`, `veritrail_shield`, …). The root `conftest.py` and the Makefile set `PYTHONPATH`.

### DEC-0015 — Lead qualification is internal
**Decision.** Lead tags (baseline_priority, shield_candidate, …) are computed for CRM routing and stripped from API responses to respondents. The browser engine computes them but the UI never shows them.

### DEC-0016 — Honest limitation tests
**Decision.** Detector gaps (paraphrased or non-English injection, names, addresses, DOB, passport numbers, free-text health data) are encoded as `xfail(strict=True)` tests. They document the limitation and fail as soon as it is fixed, which forces the docs to be updated. AWS `AKIA…` keys, GitHub `ghp_…` tokens and chat-template tokens (`<|im_start|>`) were added to `veritrail_common.redaction`, so the cloud-token limitation became a passing test. `redact(text, entities=[])` now redacts nothing. The audit log caches the last hash, keyed on file size, to avoid an O(n) rescan on every append.

### DEC-0017 — Public demo identity
**Decision.** `POST /api/agent/message` always runs as `{"id": "public-demo", "role": "viewer"}`, so the website demo provides Q&A, risk-tier previews and control recommendations only. Recording answers, generating stored reports and requesting approvals need the assessor role, which needs SSO before customer use (backlog).
