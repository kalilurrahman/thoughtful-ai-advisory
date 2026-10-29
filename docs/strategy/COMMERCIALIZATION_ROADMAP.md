# VERITRAIL — commercial readiness review and product roadmap

| | |
|---|---|
| **Document** | Commercial readiness review, opportunities and feature roadmap |
| **Date** | 2026-10-29 |
| **Scope** | The React/TanStack site and TILLER workspace (`src/`), the Supabase schema (`drizzle/`), the Python reference platform (`platform/`) and the existing product, GTM and pricing documents |
| **Status** | Recommendation. Prices and targets are hypotheses to validate, the same as in `platform/content/commercial/pricing_models.md` |
| **Companions** | [PRD](../product/PRD.md) · [Capabilities index](../product/CAPABILITIES_INDEX.md) · [Platform roadmap](../../platform/docs/ROADMAP.md) · [GTM plan](../../platform/docs/GTM_PLAN.md) · [Pricing hypotheses](../../platform/content/commercial/pricing_models.md) |

---

## 1. Verdict in one paragraph

VERITRAIL is an unusually complete **demo and content asset**: 56 governed pages, a 64-control library with
indicative NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings, four free browser tools with Python parity, a
12-screen governance workspace, a parity-tested platform console, PWA install, search, theming and about 1,000
passing Python tests. It is **not yet a product that someone can buy and use with their team**. Five
things are missing: payment, team collaboration, durable per-record data, real evidence, and real outputs.
Today a buyer can try VERITRAIL, but they cannot pay for it, invite colleagues, upload proof, or hand an auditor
a signed report. The fastest route to revenue is to keep the services-led Governance Baseline as the main offer.
Next to it, add a **self-serve "Team" SaaS tier** built on the workspace that already exists. Then grow it
into a multi-system, evidence-backed system of record. Runtime enforcement (Shield) is the premium tier that
comes after that.

---

## 2. What you already have (assets to sell)

| Asset | Where | Why it matters commercially |
|---|---|---|
| Governed control library (64 controls, 5 pillars, indicative mappings) | `platform/content/controls` | Defensible IP. Competitors often ship generic GRC checklists, so this is the core of the product |
| Evidence-first principles (Verified / User-asserted / Inferred / Missing; scores capped without evidence) | PRD §6 | A clear message for auditors and second-line buyers: "evidence over assertion" |
| Free tools: maturity assessment, risk triage, guardrail generator, Ask VERITRAIL | `src/features/site/engines` | Top-of-funnel lead generation that runs with no server cost |
| TILLER workspace: inventory, gates, guardrails, incidents, decisions, change reviews, monitoring, corrective actions, roadmap, playbook, templates | `src/features/governance` | Almost every screen an AI governance lead needs is designed and built |
| Runtime Shield policy engine (7 decisions × 5 rollout modes, kill switch), agent with approvals and a hash-chained audit log | `src/features/platform`, `platform/app` | The base for a premium, engineer-facing product |
| Industry packs (BFSI, healthcare, public sector, SaaS, GCC) and 6 policy packs | `platform/content/industry_packs`, `policy_packs` | Ready-made upsell add-ons |
| Commercial kit: pricing hypotheses, one-pagers, ROI calculator, demo script, objection handling, 90-day onboarding | `platform/content/commercial` | Sales enablement already exists |
| Quality machinery: parity fixtures, content checks, prohibited-claim scan, product catalog test | `src/test`, `platform/tests` | Lets a small team ship safely and quickly |

---

## 3. Commercial readiness scorecard

Scored 0–4 (0 absent, 2 demo-grade, 4 sellable), from the code and the documents as they stand today.

| Dimension | Score | Evidence from the codebase | What "sellable" needs |
|---|---|---|---|
| Value proposition and content | **4** | Control library, playbook, 56 pages, disclaimers, claim guard | Expert review of the mappings (OQ-06) |
| Lead generation | **3** | 8 lead forms → `site_leads`, rate limits, assessment gate, analytics funnel | Confirmation e-mails, CRM push, a truly gated Blueprint (R6) |
| Accounts and identity | **2** | Supabase auth with e-mail and OAuth; `profiles` table | MFA, SSO (SAML/OIDC) for enterprise, verified sign-in tests |
| Team collaboration | **0** | `organizations.owner_id = auth.uid()`; every RLS policy is owner-only | Members, roles, invitations, separation of duties in the database |
| Data model | **1** | Each register is **one JSONB blob per org** (`ai_systems.systems`, `roadmap_items.items` …), saved manually through `save_aegis_workspace` | Row-per-record tables, autosave, history, concurrency control |
| Multiple systems and workspaces | **1** | One workspace per user; assessment and gate scores are workspace-level | Per-system assessments and gates; several workspaces |
| Evidence | **1** | `evidence-files.ts` is a demo; reports are labelled previews with blank sign-off | Uploads to private storage, reviewer status, retention, hashes |
| Outputs (reports, exports) | **2** | PDF/DOCX/XLSX/PPTX previews; CSV with formula-injection protection | Real, dated, signed reports built from live records |
| Monetisation | **0** | No billing. The `/plans` screen says "Assess from $499", but `pricing_models.md` prices the Baseline at $25k–60k | Checkout, entitlements, plan limits, one consistent price story |
| Notifications and workflow | **0** | No e-mail, push or reminders (PRD non-goal) | Due-date reminders, review requests, digests |
| Integrations | **1** | HubSpot/webhook adapters in Python only | Jira/ServiceNow, Slack/Teams, SSO, model registries, CI |
| AI features | **2** | Advisor through the Lovable AI gateway **without sign-in** (R2); deterministic Ask VERITRAIL | Metered, signed-in AI with citations; usage limits per plan |
| Trust, security and legal | **1** | RLS, CSP, cookieless analytics; legal text is placeholder; no domain (R4) | Terms, DPA, privacy notice, a security page, sub-processor list, status page |
| Operations | **2** | CI tests, smoke test, Lovable hosting on Cloudflare Workers | Error monitoring, backups and restore drill, uptime, support channel |

**Reading:** the product's *front half* (content, tools, design) is ahead of its *back half* (tenancy, data,
billing, evidence). The roadmap below is weighted toward closing the back half.

---

## 4. Market and positioning recommendations

### 4.1 Segments, in order of how fast they can pay

| # | Segment | Why now | Entry product | Buys through |
|---|---|---|---|---|
| 1 | **Mid-market and scale-up SaaS** selling to enterprises (10–50 AI features or agents) | Enterprise customers now send AI questionnaires; the seller needs an inventory, policies and evidence fast | Self-serve **Team** plan + "AI Trust Pack" export | Card / annual invoice, founder or CTO |
| 2 | **Regulated enterprise** (BFSI, healthcare, public sector, GCCs) | Audit findings, regulator requests, EU exposure, board reporting | **Governance Baseline** engagement → Business / Enterprise | Procurement, CRO / CAIO |
| 3 | **Consultancies and advisory firms** | They need a method and tooling to deliver AI governance work to many clients | **Partner** plan: multi-client workspaces, white-label reports | Practice lead |
| 4 | **AI-forward platform teams** (agents in production) | Agent incidents, tool permissions, kill switches | **Shield** (policy-as-code + enforcement SDK) | Engineering budget, usage-based |

Segment 3 is the most under-used opportunity. The workspace, templates, playbook and Baseline method are
already *a consultant's toolkit*. Selling seats to consultancies multiplies distribution without a large sales team.

### 4.2 Positioning line

> **VERITRAIL is the evidence-first system of record for AI governance: inventory every AI system, tier it,
> gate it, guard it and prove it, citing one governed control library and never claiming to certify compliance.**

Keep the existing non-claims (no certification, no legal determinations). They are a trust advantage with
legal and audit buyers.

### 4.3 Packaging (hypothesis — replaces the inconsistent `/plans` copy)

| Plan | For | Includes | Limits | Indicative price (hypothesis) |
|---|---|---|---|---|
| **Free** | Individuals evaluating | Public tools, playbook, templates, 1 private workspace, 5 AI systems, Markdown export | 1 user, no evidence uploads, watermark on reports | $0 |
| **Team** | First governance hire, scale-ups | Inventory, per-system triage and gates, incidents, decisions, corrective actions, evidence uploads (5 GB), reports without watermark, reminders, AI advisor (metered) | 5 operator seats, unlimited free approvers and viewers, 50 AI systems | $300–600 / month, billed annually |
| **Business** | Governance functions | Team + SSO, audit log export, Jira/ServiceNow/Slack, custom controls, 1 industry pack, Trust Pack portal | 15 operator seats, 250 AI systems | $20k–45k / year |
| **Enterprise** | Regulated enterprises | Business + Shield, data residency, SCIM, custom retention, all packs, dedicated support | Custom | $60k–250k / year |
| **Partner** | Consultancies | Multi-client workspaces, white-label exports, client hand-off | Per active client workspace | $150–400 per client per month |
| **Services** | Any | Governance Baseline (fixed fee, credited to year 1), Managed Governance Service | — | As in `pricing_models.md` |

Principles kept from `pricing_models.md`: approvers and viewers are free, and safety basics (approvals, audit,
evidence labels) are in every plan. Fix the `$499` line on `/plans` (`src/features/governance/screens-resources.tsx:409`)
so it matches whichever packaging is approved. At the moment the two documents send different price signals.

---

## 5. Opportunities ranked

Impact: revenue or retention effect. Effort: S ≤ 1 week, M 2–4 weeks, L 1–2 months, XL more than 2 months (for a team of 2–3 engineers).

| # | Opportunity | Impact | Effort | Why |
|---|---|---|---|---|
| O1 | **Launch gate**: domain, legal pages, e-mail provider, confirmation e-mails, real Blueprint gate | High | S–M | Nothing else can be sold until the site is live and legally safe |
| O2 | **Billing + entitlements** (Dodo Payments checkout and customer portal, plan resolved on the server) | High | M | Turns traffic into revenue; enables self-serve |
| O3 | **Teams**: organization members, roles, invitations | High | M | Governance is a team sport; owner-only RLS blocks every B2B sale |
| O4 | **Normalized data + autosave** (row-per-record registers, history) | High | L | Fixes data-loss risk R5, enables per-system views, concurrency and audit |
| O5 | **Per-system assessments and release gates** | High | M | Turns the workspace into a real system of record (PRD "Later" item 3) |
| O6 | **Evidence vault** (private uploads, reviewer status, hashes, retention) | High | M | Unlocks "Verified" evidence, the core claim of the product |
| O7 | **Real reports + AI Trust Pack** (signed, dated, generated from live records; shareable read-only link) | High | M | The deliverable buyers show to auditors and customers, and a viral loop |
| O8 | **Reminders and digests** (review dates, monitoring breaches, overdue actions) | Medium | S–M | Retention: brings users back weekly |
| O9 | **Secure, metered AI advisor** (sign-in required, quotas per plan, citations enforced) | Medium | S | Closes R2 cost exposure and becomes a paid feature |
| O10 | **EU AI Act readiness checker + Agentic risk checker** (waitlists already open, E16) | Medium | M | Lead magnets tied to strong search demand; reuse the existing engines |
| O11 | **Integrations**: Jira/ServiceNow (actions), Slack/Teams (approvals), SSO/SCIM | High (enterprise) | L | Enterprise buying criteria |
| O12 | **Shield enforcement SDK / gateway** | High (premium) | XL | Differentiated, usage-priced revenue; builds on the existing policy engine |
| O13 | **Partner (consultancy) mode** | Medium–High | M | Distribution through advisory firms |
| O14 | **AI discovery** (import from cloud consoles, SaaS SSO logs, model registries) | High | L | "Shadow AI" inventory is a top buyer pain point |
| O15 | **Regulatory change feed** inside the workspace (dated, curated, mapped to controls) | Medium | S–M | Retention and authority; extends the existing content change log |

---

## 6. Feature roadmap

Phases run in order. Each phase is shippable on its own and keeps the branch working, as Lovable requires.
Every new route, tool and feature must be added to `docs/product/catalog.yaml`, with the generated docs
rebuilt (`node scripts/build-product-docs.mjs`).

```
R0 Launch gate ──► R1 Monetise (self-serve SaaS) ──► R2 System of record ──► R3 Team workflow & integrations ──► R4 Shield & enterprise
  (sellable site)     (pay, invite, autosave)          (per-system, evidence,     (notifications, Jira/Slack,          (enforcement SDK, SSO/SCIM,
                                                        real reports)               partner mode, discovery)             residency, marketplace)
```

### R0 — Launch gate (make it legally and operationally sellable)

| Feature | How it integrates | Done when |
|---|---|---|
| Production domain, `VITE_SITE_URL`, canonical and OG URLs | Env config; regenerate share images (`scripts/generate-social-images.mjs`) | Sitemap and OG images resolve on the real domain |
| Legal pages: terms, privacy, DPA, sub-processors, security overview, AI-use notice | New Markdown pages in `platform/content/website_pages` (shared with Python) | Legal review signed off; content checks pass |
| Transactional e-mail (HTTP API provider such as Resend or Postmark — Workers has no SMTP) | New `src/features/platform/email.server.ts` called from `submitLead`; templates from `platform/content/email_templates.yaml` | Lead and assessment forms send a confirmation; forms still say when nothing was sent |
| Truly gated Blueprint (R6) | Move PDF to private storage; signed URL returned after `submitLead` | The direct URL returns 403 |
| Sign-in required for the AI advisor, plus a per-user quota (R2) | `advisor.functions.ts` behind `auth-middleware`; reuse `rate-limit.server.ts` | Anonymous calls are refused with a clear message |
| Error monitoring, uptime check, backup and restore drill | Sentry (or similar) in `src/start.ts`; Supabase PITR | A restore drill is documented |
| One price story | Update `/plans` copy and `pricing_models.md` together | No conflicting figures on the site |

**Exit metric:** site live; first 100 assessment completions; confirmation e-mails delivered.

### R1 — Monetise: self-serve SaaS MVP

| Feature | How it integrates | Done when |
|---|---|---|
| **Organization members and roles** (`owner`, `admin`, `operator`, `approver`, `viewer`) | New `organization_members` table; rewrite RLS from `owner_id = auth.uid()` to a `is_org_member(org, role)` security-definer helper; invitations table with e-mailed tokens | A second user can be invited and sees only that org; cross-org tests pass |
| **Billing** | Dodo Payments (merchant of record) checkout and customer portal through server functions; `billing_customers`, `billing_subscriptions` updated by a signed webhook route — **built**, see `docs/veritrail/BILLING_SETUP.md` | Upgrade, renewal, failed-payment and cancel paths verified in Dodo test mode |
| **Entitlements** | Pure `src/features/billing/entitlements.ts` (plan → limits: seats, systems, storage, AI calls), checked in server functions **and** shown in the UI | Limits enforced on the server; upgrade prompts at limits; unit tests per plan |
| **Autosave + save-status indicator** | Debounced save from the governance provider; reconcile `save_aegis_workspace` vs migration `0009` in the same change (R1 risk) | No "unsaved changes" loss on reload; save conflicts detected by `updated_at` |
| **Several workspaces** (one per business unit or client) | `workspaces` table under an organization; workspace switcher in the workspace header ("More actions" menu on phones) | A user can create, rename and switch; the sample stays available |
| **Onboarding wizard → first value in 10 minutes** | Extend `/onboarding` and `/start`: pick industry pack → import 3 systems → run triage → see gaps | Activation event `workspace_activated` recorded (add it to the analytics allow-list in parity with Python) |
| **Account settings**: profile, MFA (TOTP), delete account, export my data | Supabase MFA; data export server function | GDPR export and delete work end to end |

**Exit metrics:** first paying Team customers; free → paid conversion measured; activation ≥ 40% of new sign-ups.

### R2 — System of record (depth that justifies the subscription)

| Feature | How it integrates | Done when |
|---|---|---|
| **Normalized registers** — row-per-record tables for systems, incidents, decisions, change reviews, monitoring plans, corrective actions, roadmap items | New migrations with `workspace_id` FKs and RLS by membership; a one-time migration that expands the JSONB blobs; keep the snapshot schema as an import/export format | Old snapshots import cleanly; per-record `created_by`, `updated_at` and history |
| **Per-system assessments and release gates** | `system_assessments` (TILLER 12 controls per system) and `release_gates`; portfolio summaries computed from them (keep `model.ts` pure and tested) | Each system has its own score, gate result and blockers; the workspace view becomes a roll-up |
| **Decisions update the inventory** | Decision approval → status change on the linked system, recorded in history | Tested state machine, like the existing correction and withdrawal rules |
| **Evidence vault** | Supabase Storage private bucket per org; `evidence_items` (control, system, hash, uploader, reviewer, status, expiry); review flow sets evidence to Verified | Scores above 2 require Verified evidence from the vault; files never reach the service worker cache |
| **Real reports** | Replace preview-only outputs with generated reports from live records, labelled with workspace, date, version and evidence status; keep demo-workspace outputs labelled as previews (AGENTS.md rule) | Reports reproduce from stored data; sign-off block records the approver |
| **AI Trust Pack** | Public, revocable read-only link: inventory summary, policies, control coverage, evidence status, no raw files unless allowed | Buyers can send one link to a customer's security reviewer |
| **Immutable audit log** | Append-only `audit_events` with hash chaining (port of the existing `audit.ts`) | Chain verifies; export to CSV/JSON |
| **Custom controls and frameworks** | Org-level overlay on the governed library (add, tailor, map), never editing the public library | Custom controls show in gates and reports, labelled as custom |

**Exit metrics:** median systems per paying workspace ≥ 15; evidence items per workspace ≥ 30; first Trust Pack shared.

### R3 — Team workflow and integrations (retention and enterprise readiness)

| Feature | How it integrates | Done when |
|---|---|---|
| **Notifications**: assignments, approvals requested, review dates, monitoring breaches, overdue actions; weekly digest | Scheduled worker (Cloudflare cron) + e-mail provider from R0; per-user preferences; Web Push later (PWA guide already assesses it) | Users can mute by type; every e-mail has an unsubscribe |
| **Approval workflow with separation of duties in the database** | Port the agent's approval rules; approver cannot be the requester; queues per role | Self-approval refused at the database level |
| **Comments and @mentions** on systems, incidents and decisions | `comments` table with RLS | Mentioned users are notified |
| **Jira / ServiceNow** sync for corrective actions | OAuth apps; two-way status sync | Closing in Jira closes in VERITRAIL with evidence prompt |
| **Slack / Microsoft Teams** approvals and alerts | Bot apps calling server functions | Approve or reject from chat, recorded in the audit log |
| **CSV/XLSX bulk import and public REST API with API keys** | `/api/v1` routes; scoped keys per workspace | Import 200 systems in one go; API documented |
| **AI discovery connectors (beta)**: Azure/AWS/GCP AI resources, Okta/Entra SaaS app logs, Hugging Face/MLflow registries | Pull-only connectors suggesting draft inventory entries labelled Inferred | Suggested systems require human confirmation (keeps "humans decide") |
| **Partner mode** | Partner organization owns many client workspaces; white-label logo and colours on exports; hand-off of a client workspace | A consultancy can run 5 clients from one login |
| **Regulatory change feed** | Dated, curated register in `src/data` (same pattern as the content change log), mapped to controls; "what changed for me" view | Each entry cites its source and affected controls |
| **New free tools**: EU AI Act readiness checker, Agentic AI risk checker (E16) | Python reference engine first, then a browser port with parity fixtures | Waitlist converted; parity tests pass |

**Exit metrics:** weekly active operators ÷ seats ≥ 60%; logo retention ≥ 90% after 6 months; first Business deals.

### R4 — Shield and enterprise (premium, usage-based revenue)

| Feature | How it integrates | Done when |
|---|---|---|
| **Shield enforcement SDK** (TypeScript and Python) evaluating `veritrail.policy/v1` locally | Package the existing policy engine; policies pulled from VERITRAIL; decisions streamed back as metadata only | Observe → Warn → Enforce rollout; kill switch propagates fast enough for the SLA set in the design |
| **Hosted policy decision point / LLM gateway (optional)** | Separate service, not the marketing site; keep it out of the Workers app | Load-tested; per-1,000-action metering for billing |
| **Telemetry-fed monitoring** | Ingest decision logs and model metrics into monitoring plans; breaches open incidents automatically (as drafts) | Breach → draft incident → human confirms |
| **SSO (SAML/OIDC), SCIM, audit export to SIEM** | Enterprise auth; webhook/stream to Splunk or Sentinel | Enterprise security questionnaire answered from the security page |
| **Data residency (EU, US, India) and custom retention** | Region-pinned Supabase projects; retention jobs (OQ-02, OQ-04) | Region chosen at org creation; documented |
| **Marketplace listings and app stores** | AWS/Azure marketplace for procurement; Google Play and Microsoft Store packaging (already planned in the PWA guide) | Private offers possible through a marketplace |
| **Assurance testing**: red-team and eval runs linked to controls | Import eval results (e.g. from CI) as evidence items | Evals appear as Verified evidence with their source |

**Exit metrics:** Shield ARR share ≥ 20%; net revenue retention ≥ 115%.

---

## 7. Architecture changes the roadmap depends on

1. **Tenancy model.** Replace `organizations.owner_id`-only RLS with membership-based policies, and
   add a `workspaces` level under organizations. This is the single largest blocker to selling to teams.
   Do it before the data normalization so the new tables are born with the right policies.
2. **Data model.** Move from one JSONB blob per register per org to row-per-record tables. Keep the snapshot
   schema (`store.tsx` validation) as the import/export and demo format, so the public demo stays offline and
   unchanged.
3. **Entitlements as a pure module.** Like `model.ts`, keep plan rules pure and unit-tested; enforce them in
   server functions, not only in the UI.
4. **Server-side jobs.** Notifications, payment webhooks, retention and connectors need scheduled and
   event-driven workers. Cloudflare cron triggers fit the current hosting; heavy work (gateway, discovery)
   should run as separate services.
5. **Storage.** Private Supabase Storage for evidence, with signed URLs. The service worker already never caches
   server functions or query URLs; extend that rule to storage URLs.
6. **AI usage.** All model calls go through one server function that checks sign-in, plan quota and logs usage
   (for both cost control and billing). Keep deterministic Ask VERITRAIL free and offline.
7. **Parity discipline.** New engines (EU AI Act readiness, agentic risk) follow the existing pattern:
   Python reference + exported fixtures + browser port.
8. **Migration hygiene.** Apply `0009_veritrail_rename_workspace_function.sql` only together with the client
   change and regenerated Supabase types (PRD risk R1). R1 autosave is the natural place to do that.

---

## 8. Metrics to run the business

| Funnel stage | Metric | Event / source |
|---|---|---|
| Acquire | Tool starts ÷ tool page views | `assessment_start`, `tool_use`, `page_view` |
| Capture | Leads by form, qualified share | `site_leads` |
| Activate | Sign-up → `workspace_activated` (3 systems triaged) within 7 days | new event (add to both allow-lists) |
| Convert | Free → paid within 30 days; Baseline → platform within 60 days | Dodo Payments + CRM |
| Engage | Weekly active operators ÷ paid seats | server logs (no cookies) |
| Expand | Systems per workspace, seats, add-on packs | entitlements table |
| Retain | Logo and net revenue retention | Dodo Payments |
| Trust | Prohibited-claim scan pass rate; mapping review date | content checks |

---

## 9. Risks specific to commercialization

| Risk | Mitigation |
|---|---|
| Customers read readiness as compliance | Keep the claim guard, the disclaimers and "indicative" labels in every paid output; add them to the Trust Pack |
| Regulatory dates move (for example the EU AI Act timeline and any Digital Omnibus changes) | The regulatory change feed (R3) with dated entries; legal review cadence (OQ-01) |
| Moving from blobs to rows corrupts customer data | Dual-write period, an import test over every existing snapshot, and a restore drill (R0) |
| Self-serve cannibalises the Baseline | Position the Baseline as "we run it for you in 4–6 weeks"; credit its fee to year 1 |
| AI cost overruns | Sign-in, quotas per plan, usage logging, a cheaper model for drafts |
| Lovable sync and history | No force pushes or rebases on pushed commits; keep each phase shippable |

---

## 10. First ten tickets (start here)

1. Fix the price inconsistency on `/plans` and approve one packaging (section 4.3).
2. Pick the production domain, set `VITE_SITE_URL`, regenerate share images.
3. Add the transactional e-mail provider and lead confirmation e-mails.
4. Require sign-in and a quota for the AI advisor.
5. Move the Blueprint PDF behind a signed URL.
6. Draft terms, privacy notice, DPA and the security page as governed Markdown pages; book legal review.
7. Design and migrate `organization_members` + membership-based RLS, with cross-org tests.
8. Add Dodo Payments checkout, the webhook and the pure entitlements module with tests.
9. Implement autosave with conflict detection, and reconcile `save_aegis_workspace` with migration `0009`.
10. Add the `workspace_activated` event (TypeScript and Python allow-lists) and an onboarding path to it.
