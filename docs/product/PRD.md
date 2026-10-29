# VERITRAIL — product requirements

| | |
|---|---|
| **Product** | VERITRAIL Enterprise — AI governance, runtime guardrails and evidence |
| **Document** | Product requirements (PRD), version 1.0 |
| **Updated** | 2026-10-24 |
| **Status** | Describes the product as built, the gaps against it and what comes next |
| **Companion documents** | [Capabilities index](CAPABILITIES_INDEX.md) · [Epics and user stories](EPICS_AND_STORIES.md) · [Use cases](USE_CASES.md) · [Product index](README.md) |

Requirement IDs (FR-, NFR-) trace to the epics (E01–E16) and stories in
[EPICS_AND_STORIES.md](EPICS_AND_STORIES.md); every capability (CAP-) is listed in the
[capabilities index](CAPABILITIES_INDEX.md) with its route, status, data and tests.

## 1. Summary

VERITRAIL helps an organisation inventory its AI, assess risk, govern the lifecycle, protect LLM
applications and agents at runtime, and prove responsible AI with evidence. It is delivered as:

- a **public website** of 56 governed Markdown pages, a 64-control library and a 38-term glossary,
  shared with the Python reference platform;
- **free tools** that run in the browser — a maturity self-assessment, risk triage, a guardrail
  generator and a cited question-answering tool;
- the **TILLER governance workspace** — assessment, release gates, guardrails, an AI inventory,
  incidents, decisions, change reviews, monitoring, corrective actions, a roadmap, guidance and
  evidence packs — usable as an open demo or, signed in, as a private Cloud workspace;
- a **platform console** of parity-tested TypeScript ports of the Python platform (agent,
  policy simulator, pilot rehearsal, ROI, samples, content checks, admin);
- an **installable app** with offline reading, site-wide search and in-text definitions.

The commercial entry point is the 4–6 week **Governance Baseline** engagement; the software
supports it and the free tools generate qualified leads for it.

## 2. Problem

Organisations are deploying models, LLM applications and tool-using agents faster than they can
govern them. Five problems recur:

1. **No inventory.** Nobody can say with confidence what AI is in use, who owns it or what data it
   touches — and nothing can be gated, protected or evidenced if it is not registered.
2. **Inconsistent, slow approvals.** Risk is judged case by case, without a shared tiering method
   or record of the rationale.
3. **Agents act without guardrails.** Tool permissions, approvals for high-impact actions,
   redaction, limits and a kill switch are designed late, if at all.
4. **Assertion instead of evidence.** Policies exist on paper, but evidence that controls operate
   is scattered or missing when a regulator, customer or auditor asks.
5. **Regulatory uncertainty.** The EU AI Act, NIST AI RMF and ISO/IEC 42001 overlap; teams need a
   readiness view without vendors claiming to certify compliance.

## 3. Vision and positioning

**Evidence over assertion.** Every finding VERITRAIL produces says how it is known — Verified,
User-asserted, Inferred or Missing evidence — and every recommendation cites a control from one
governed library. VERITRAIL supports readiness; it never certifies conformity, determines legal
compliance or takes a high-impact action without a human.

Six modules, one system: **Assess** (baseline), **Register** (inventory), **Control** (risk-tiered
lifecycle gates), **Shield** (runtime guardrails), **Assurance** (testing, incidents and evidence
packs) and the **Agent** (a governance copilot across them).

## 4. Goals and non-goals

### Goals

| # | Goal | Measured by (section 9) |
|---|---|---|
| G1 | Give a prospective buyer a credible, self-serve understanding of the method and an honest first result | Assessment completion and report-unlock rates |
| G2 | Convert interest into qualified Governance Baseline conversations | Leads by type; assessment leads with qualification tags |
| G3 | Let a governance lead run a programme from one workspace: inventory, assessment, gates, operations and evidence | Workspaces saved; registers in use |
| G4 | Show runtime guardrails for agents concretely — policy, approvals and audit — before any deployment | Guardrail drafts downloaded; simulator and agent console use |
| G5 | Keep every claim defensible: cited controls, labelled evidence, indicative mappings, human confirmation | Content checks pass; zero prohibited claims |
| G6 | Be fast, accessible and usable on any device, including installed and offline | Core Web Vitals, WCAG 2.2 AA, install outcomes |

### Non-goals

- Certifying ISO/IEC 42001 conformity or determining EU AI Act (or any legal) compliance.
- Classifying systems as "high-risk" under the EU AI Act — VERITRAIL tiers are its own method.
- Acting autonomously on high-impact decisions (tier changes, exceptions, production policy,
  evidence export, external communication).
- Hosting customer AI traffic: Shield policies are drafted, simulated and exported, not enforced
  in a VERITRAIL-run proxy (see section 10, Later).
- Sending messages: there is no e-mail, SMS or push sending today.

## 5. Personas

Ten personas are defined in the [product index](README.md#personas). The primary ones are the
**AI governance lead** (runs the programme), the **AI system owner** (registers and fixes), the
**approver** (confirms tiers and releases), the **CISO / security architect** and
**engineering lead** (runtime guardrails), the **Chief Risk / Compliance Officer** (risk position
and readiness), the **internal auditor** (evidence), the **consultant** (runs the method for
clients), the **prospective buyer** (evaluates) and the **site administrator** (leads and funnel).

## 6. Product principles

These are requirements on every feature, enforced by tests where possible.

1. **Cite controls.** Recommendations cite IDs from `platform/content/controls/controls.yaml`;
   unknown IDs are dropped (the advisor) or fail tests (content checks).
2. **Label evidence.** Results say Verified, User-asserted, Inferred or Missing evidence. Workspace
   scores of 3 or more are capped at 2 until evidence is Verified.
3. **Humans decide.** Suggested tiers stay Inferred until confirmed; the agent queues sensitive
   actions for a different person to approve; policies are drafted in Observe mode.
4. **Indicative mappings.** NIST AI RMF, ISO/IEC 42001 and EU AI Act references are labelled
   indicative, with the standard disclaimer on compliance content.
5. **Say when nothing happened.** Forms and the assessment gate state plainly when nothing was
   saved or sent; forms are never queued offline.
6. **Privacy first.** Analytics are cookieless, honour Do Not Track and Global Privacy Control,
   and store no IP or identifiers; raw assessment answers are never stored with a lead.
7. **One governed source.** Website pages, controls, glossary and assessment templates live in
   `platform/content` and are shared by the Python platform and the React site; TypeScript ports
   are parity-tested against the Python outputs.

## 7. Scope and release status

| Surface | Status | Notes |
|---|---|---|
| Website, control library, glossary | Live | 56 pages, 64 controls, 38 terms |
| Free tools (assessment, triage, guardrails, Ask) | Live | Two further tools are planned (waitlist) |
| Lead capture and qualification | Live | Rate-limited per client; no confirmation e-mails yet |
| TILLER workspace | Live | Open demo; private workspace when signed in (manual save) |
| Reports and audit pack | Preview | Labelled demo previews with blank sign-off |
| Platform console | Demo / live | Agent, simulator, rehearsal and samples on synthetic data; ROI, content checks and admin live |
| Installable app, search, glossary tips | Live | Real-device verification pending publication |

## 8. Functional requirements

Each requirement is detailed as user stories with acceptance criteria in
[EPICS_AND_STORIES.md](EPICS_AND_STORIES.md).

### 8.1 Website and content (E01, E02)

- **FR-01** Render every page in `platform/content/website_pages` from Markdown and front matter,
  with navigation by section, breadcrumbs, FAQs, calls to action and structured data.
- **FR-02** Make long pages scannable: "On this page", feature and step cards, link cards,
  callouts, stacked tables on phones, copyable code, FAQ accordions and reading progress.
- **FR-03** Link control IDs in text to their control page; define glossary terms on first mention.
- **FR-04** Publish the control library by pillar and one page per control with owner, priority,
  scope, evidence examples, indicative mappings, related questions and critical flags.
- **FR-05** Show the compliance disclaimer on compliance pages; never use prohibited claims.
- **FR-06** Give each section an illustration and a 1200×630 share image.

### 8.2 Free tools (E03)

- **FR-10** Maturity self-assessment: 24 questions in 8 weighted domains, an indicative level, a
  free preliminary result, and a detailed report with a 30/60/90-day plan behind a business-email
  gate; Python parity; answers kept only in the tab session.
- **FR-11** Risk triage: Prohibited-review, High, Medium or Low with factors, triggers, missing
  facts, approval authority and review cadence; raise Low to Medium when three key facts are
  missing; label Inferred.
- **FR-12** Guardrail generator: rating across autonomy, tool risk, data exposure and blast
  radius; permission matrix; a `veritrail.policy/v1` draft (version 0.1.0, Observe) in YAML, JSON,
  Markdown and PDF.
- **FR-13** Ask VERITRAIL: deterministic answers citing controls, computed in the browser with no
  model or network; refuse injection, approval bypass and compliance determinations.

### 8.3 Leads (E04)

- **FR-20** Baseline, demo, contact, newsletter (also used for whitepapers), design-partner,
  blueprint, waitlist and assessment forms store to `site_leads` through a server function with consent, a honeypot
  and a business-email rule where required.
- **FR-21** Tag assessment leads by the template's qualification rules; optionally push to a CRM
  webhook or HubSpot without failing the lead.

### 8.4 Workspace (E05–E11)

- **FR-30** Score 12 TILLER controls 0–4 with evidence status; compute pillar scores, the
  VERITRAIL Index and maturity band.
- **FR-31** Gate release as Cleared, Conditional or Blocked against tier floors (High 70, Medium
  55, Low 40); turn blockers into roadmap items.
- **FR-32** Configure the workspace tier and 21 guardrails in seven groups with required coverage
  (6 / 18 / 21 by tier).
- **FR-33** Register AI systems with a structured triage, live tier and rationale; filter, edit
  and export the inventory to CSV with formula-injection protection.
- **FR-34** Run incidents, decisions (with review dates, supersede history, and corrections or
  withdrawals that keep the original record), change reviews
  (with escalation and "not assessed" blocking approval), monitoring plans (thresholds, breaches,
  due dates) and corrective actions (evidence and verified closure).
- **FR-35** Show a phased roadmap and a lifecycle checklist derived from the workspace.
- **FR-36** Provide the playbook (12 chapters, notes, progress), eight templates, a source
  register, guided start, six calculators and an AI advisor that maps a concern to controls and
  corrective actions.
- **FR-37** Generate executive, scorecard and audit-evidence packs in PDF, DOCX, XLSX and PPTX,
  labelled previews with blank sign-off.

### 8.5 Accounts (E12)

- **FR-40** Sign in by e-mail and password (with confirmation and reset), Google, Apple,
  Microsoft or Lovable; clear demo state on sign-in.
- **FR-41** Save and restore one workspace per user, scoped to the user's organisation by RLS.
- **FR-42** Show the Assess, Govern and Assure plans and the free snapshot.

### 8.6 Platform console (E13) and administration (E14)

- **FR-50** Run the agent (roles, 14 least-privilege tools, approvals with separation of duties,
  hash-chained audit log), the policy simulator (rollout modes and kill switch), the pilot
  rehearsal, ROI with labelled hypotheses, the sample reports and the content checks — each
  matching the Python outputs.
- **FR-51** Give administrators leads, submissions (CSV) and the funnel, with membership
  re-checked on the server before any service-role read.
- **FR-52** Record cookieless events from a fixed allow-list (`page_view`, `cta_click`,
  `assessment_*`, `form_submit`, `tool_use`, `outbound_click`) in parity with the Python platform.

### 8.7 App, search and reading (E15)

- **FR-60** Be installable: manifest with maskable icons, shortcuts and screenshots; an install
  card and header button on Chromium; step-by-step instructions on iPhone, iPad and Safari for Mac.
- **FR-61** Read visited pages offline through a production-only, network-first service worker
  that never caches sign-in, server functions or query URLs.
- **FR-62** Search pages, sections, FAQs, controls, glossary terms, workspace screens and platform
  tools from one box (⌘K, Ctrl+K or "/"), with control IDs matched exactly.
- **FR-63** Keep the website and workspace headers on one row from 360 px; the smoke test fails
  the build otherwise.
- **FR-64** Let viewers choose a colour theme (Broadsheet, Midnight Gold, Financial Slate), a
  mode (Auto, which follows the device and is the default, or always light or dark) and a font
  (Editorial serif, KR Tools, Modern sans) from one Appearance panel; apply the choice before
  first paint, keep it in the browser only, and meet WCAG AA in every theme.

## 9. Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-01 | Accessibility | WCAG 2.2 AA: keyboard access, visible focus, 44 px touch targets, labelled controls, reduced-motion support, sufficient contrast in light and dark themes |
| NFR-02 | Performance | Server-rendered pages; LCP under 2.5 s and CLS under 0.1 on a mid-range phone over 4G; no layout shift from images (fixed dimensions) |
| NFR-03 | Responsiveness | No horizontal scrolling or header wrapping from 360 px to 1440 px (smoke test at 390 px and 1280 px) |
| NFR-04 | Offline | Visited pages readable offline; a clear offline page otherwise; the service worker registers only in production on the real origin |
| NFR-05 | Security | Supabase RLS on every table; service role only in server functions after a membership check; no secrets in the client; honeypot on forms |
| NFR-06 | Privacy | Cookieless analytics; DNT and GPC honoured; no IP or identifiers stored; sanitised event properties; no raw assessment answers stored |
| NFR-07 | Integrity | Hash-chained audit logs that verify; approvals by a different person than the requester |
| NFR-08 | Parity | TypeScript engines match the Python reference outputs (fixtures in `src/test`) |
| NFR-09 | Content governance | Content checks pass; prohibited claims absent; disclaimers present on compliance pages |
| NFR-10 | Browsers | Current Chrome, Edge, Firefox and Safari; iOS and iPadOS 16.4+ for install; no syntax that breaks Safari before 16.4 (for example regex look-behind) |
| NFR-11 | Quality gates | CI runs typecheck, lint, unit tests (including this catalog), build and a browser smoke test of every page |
| NFR-12 | SEO and sharing | Sitemap, robots.txt, canonical links matching the sitemap, structured data, and Open Graph and Twitter images per section |

## 10. Success metrics

| Metric | Source | Target (first two quarters after launch) |
|---|---|---|
| Assessment start rate (starts ÷ page views of the tool) | `assessment_start`, `page_view` | ≥ 25% |
| Assessment completion (preliminary ÷ start) | `assessment_preliminary` | ≥ 50% |
| Report unlock (lead submitted ÷ gate view) | `assessment_lead_submitted`, `assessment_gate_view` | ≥ 30% |
| Baseline and demo requests | `site_leads` by form | Tracked monthly; qualified share ≥ 50% |
| Call-to-action effectiveness | `cta_click` by `cta` (hero, header, menu, blocks) | Identify the top three CTAs by conversion |
| Workspace adoption | Saved workspaces | Tracked monthly |
| Activation (saved private workspace with 3 or more triaged AI systems) | `tool_use` with `tool: workspace`, `milestone: activated` (once per workspace per browser) | 40% or more of new sign-ups within 7 days |
| Install interest | `cta_click` for `pwa-install-card`, `pwa-install-header` and `pwa-install-menu` against `pwa-install-not-now` | More installs than dismissals; the browser's own accept or cancel is not recorded |
| Defensibility | Content checks; prohibited-claim scan | 100% pass on every release |

Targets are starting hypotheses to revisit with real data. `tool_use` (with the tool and its tier,
rating or intent) and `form_submit` (with the form) count use of each free tool and lead form.

## 11. Roadmap

**Now (shipped).** Everything marked Live, Demo or Preview in the
[capabilities index](CAPABILITIES_INDEX.md).

**Next (close the known gaps).**

1. Autosave and a workspace switcher; reconcile the save function (see risk R1).
2. Real-device install and offline verification; Google Play and Microsoft Store listings
   ([release guide](../veritrail/PWA_RELEASE_GUIDE.md)).

**Later (new capability).**

1. Agentic AI risk checker and EU AI Act readiness checker (E16, waitlists open).
2. Private evidence upload with reviewer status; several workspaces and team roles; SSO and MFA.
3. Per-system release gates; decisions that update inventory status.
4. Telemetry-fed monitoring; a runtime enforcement point for Shield policies.
5. Governance briefing notifications (Web Push) after consent and a sending service exist.
6. Enforce seat, system and workspace limits per plan (billing through Dodo Payments is built).

## 12. Risks and mitigations

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Migration `0009` renames `save_aegis_workspace` to `save_veritrail_workspace` | Save would break if the client called only one name | The client calls the new name and falls back to the old one; regenerate Supabase types once `0009` is live |
| R2 | The advisor calls the Lovable AI gateway | Cost and abuse exposure | Sign-in required and a daily allowance per plan (`consume_ai_quota`); monitor usage |
| R3 | No confirmation e-mails on lead forms | Missed follow-up | Add a sending provider (HTTP API); lead forms are already rate-limited per client |
| R4 | Placeholder legal text, contact address and `site_url` | Not ready for public launch or store listings | Legal review; set the production domain before submission |
| R5 | No autosave; one workspace per user | Lost work; poor fit for teams | Autosave and workspace selection (Next) |
| R6 | Blueprint PDF is public, so its form gate is cosmetic | Lower lead capture than reported | Serve the file from a signed URL after submission, or drop the gate |
| R7 | Readers mistake readiness for compliance | Reputational and legal exposure | Disclaimers, indicative labels and the prohibited-claim scan (G5) |

## 13. Dependencies

- **Lovable Cloud / Supabase** — authentication, Postgres with RLS, server functions.
- **Lovable AI gateway** — the workspace advisor (`LOVABLE_API_KEY`), signed-in only with a daily allowance per plan.
- **Dodo Payments** — merchant of record for the self-serve plans: checkout, customer portal and
  subscription webhooks ([billing setup](../veritrail/BILLING_SETUP.md)).
- **Cloudflare Workers** (via Nitro) — hosting; no SMTP, so e-mail must use an HTTP API.
- **Python reference platform** in `platform/` — the source of governed content and the parity
  fixtures.
- Optional **CRM** — webhook or HubSpot for lead push.

## 14. Open questions

1. Which e-mail provider sends lead confirmations and, later, briefing notifications?
2. Should the advisor require sign-in, or stay open with rate limits?
3. When do teams need several workspaces and roles — before or after the first paying customer?
4. Should the Blueprint stay gated (and be made truly gated) or be published openly?
5. What is the production domain, and when will legal review the privacy notice and terms?
6. Are store listings (Google Play, Microsoft Store) worth their upkeep before customer demand?

## 15. Keeping this document current

The capabilities index, epics and user stories, and use cases are generated from
[`catalog.yaml`](catalog.yaml) by `node scripts/build-product-docs.mjs`; `npm test` fails if a
route, tool page or glossary has no capability, if a reference is broken, or if the generated
files are out of date. Update this PRD by hand when goals, principles, risks or the roadmap change.
