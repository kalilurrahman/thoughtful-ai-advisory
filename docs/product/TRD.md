# VERITRAIL — Technical Reference Document

| | |
|---|---|
| **Product** | VERITRAIL Enterprise — AI governance, runtime guardrails and evidence |
| **Document** | Technical Reference Document (TRD), version 1.0 |
| **Updated** | 2026-10-30 |
| **Status** | Reflects the current codebase; stub items are noted throughout |
| **Companion documents** | [PRD](PRD.md) · [Deferred stubs](DEFERRED_STUBS.md) · [Capabilities index](CAPABILITIES_INDEX.md) · [Billing setup](../veritrail/BILLING_SETUP.md) |

---

## 1. Technology stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Router | TanStack Router (file-based, `src/routes/`) |
| Styling | Plain CSS with design tokens in `src/styles.css` |
| State management | Reducer-backed `GovernanceProvider` (`src/features/governance/store.tsx`) |
| Validation | Zod (schema-first; shared between client and server functions) |
| Testing | Vitest + `@testing-library/react` + jsdom |
| Server functions | Cloudflare Workers via Nitro (Lovable Cloud) |
| Database | Supabase (PostgreSQL 15, RLS, pgcrypto) |
| Auth | Supabase Auth (magic link + OAuth) |
| Deployment | Cloudflare Pages / Workers (Lovable Cloud hosting) |
| Payment processing | Dodo Payments (merchant of record) — **stub-dodo** |
| Email delivery | Not configured — **stub-smtp** |
| AI model | Lovable AI Gateway → Claude (`claude-*` model) |
| PWA | Workbox-free custom service worker (`public/sw.js`) |
| Offline search | Client-side index built from governed content at build time |

---

## 2. Repository layout

```
/
├── src/
│   ├── routes/              # TanStack Router file-based routes
│   ├── features/
│   │   ├── governance/      # Workspace screens, store, model, schemas
│   │   ├── billing/         # PlansScreen, billing server functions
│   │   ├── site/            # Public website components, illustrations
│   │   ├── search/          # Client-side search index + UI
│   │   └── pwa/             # Service worker registration, install store
│   ├── data/                # Governed seed data (plans, playbook, templates, controls)
│   ├── lib/                 # Theme, Supabase client, utilities
│   └── test/                # Test files (co-located with features or here)
├── platform/
│   ├── content/             # Governed Markdown pages, controls, glossary (shared with Python)
│   └── scripts/             # Parity fixture exporters (Python)
├── public/                  # Static assets, sw.js, manifest
├── docs/
│   ├── product/             # PRD, TRD, DEFERRED_STUBS, catalog.yaml, generated docs
│   ├── veritrail/           # Operational guides (billing, PWA release, Python port map)
│   └── assets/              # Screenshots, illustrations
└── scripts/                 # Build scripts (build-product-docs.mjs, generate-social-images.mjs)
```

---

## 3. Client architecture

### 3.1 State management

All governance workspace state is held in a single reducer (`GovernanceState`) mounted at the application root via `GovernanceProvider`. The state is never derived from page visits or private saves — it is loaded from the Cloud on sign-in or seeded from the public demo.

**`GovernanceState` shape (key fields):**

```typescript
{
  workspaceId?: string        // Supabase workspace row id
  revision?: number           // Optimistic-lock revision counter (migration 0013)
  planId?: PlanId             // "free" | "team" | "business" | "enterprise"
  systems: System[]           // AI inventory
  answers: Record<string, string>  // Control assessment answers (flat, keyed by control id)
  monitoringPlans: MonitoringPlan[]
  correctiveActions: CorrectiveAction[]
  incidents: Incident[]
  decisions: Decision[]
  changes: Change[]
  roadmap: RoadmapItem[]
  evidencePacks: EvidencePack[]
}
```

**Action types (selected):**

| Type | Description |
|---|---|
| `register-system` | Add a new AI system to inventory |
| `retire-system` | Mark a system as retired |
| `set-answer` | Record an assessment answer |
| `monitor-update-plan` | Edit monitoring plan threshold/cadence/owner |
| `transition-corrective-action` | Move action through Open→In progress→Pending verification→Closed |
| `edit-corrective-evidence` | Update completion evidence on an in-progress action |
| `corrective-action` | Create a new corrective action |

**Save path:** `saveNow()` in `GovernanceProvider` calls `save_workspace_checked` (server function) with the current revision. A stale revision returns a conflict; the workspace is never silently overwritten.

### 3.2 Routing

TanStack Router with file-based routes under `src/routes/`. The root layout switch (`src/routes/__root.tsx`) applies:
- **Site chrome** (`SiteLayout`) for `/`, `/$`, `/framework/controls/*`
- **Workspace shell** (`WorkspaceLayout`) for all `/workspace/*`, `/platform/*`, and account routes

### 3.3 Plan limits

Plan limits are defined in `src/data/plans.ts` and enforced in the UI:
- `aiSystems` — maximum registered systems (Register button disabled at limit, alert shown)
- `operatorSeats` — displayed in the team panel
- `advisorPerDay` — enforced by `consume_ai_quota` server function

```typescript
type PlanId = "free" | "team" | "business" | "enterprise"
interface PlanLimits {
  operatorSeats: number   // free:1, team:5, business:15, enterprise:1000
  aiSystems: number       // free:5, team:50, business:250, enterprise:10000
  workspaces: number      // free:1, team:3, business:10, enterprise:100
  advisorPerDay: number   // free:5, team:50, business:200, enterprise:1000
  evidenceStorageMb: number
  unwatermarkedReports: boolean
}
```

### 3.4 Theme system

Colors and fonts are tokens defined in `src/styles.css`. The mode (`data-mode`), effective `dark` class, palette (`data-palette`), and font (`data-font`) are applied to `<html>` by `src/lib/theme.ts` before first paint.

Three palettes are available: **Broadsheet** (default), **Midnight Gold**, **Financial Slate**. Each must define a complete light and dark block with AA-contrast tokens. `src/test/theme.test.ts` verifies this.

---

## 4. Server functions

All server functions run in Cloudflare Workers via Lovable's Nitro layer. Every function that touches user data calls `requireSupabaseAuth` middleware, which validates the Supabase JWT from the `Authorization` header.

### 4.1 Workspace

| Function | Auth | Description |
|---|---|---|
| `save_workspace_checked` | Required | Atomic upsert with revision check; uses `save_veritrail_workspace` SQL function (security-invoker, migration 0013). Falls back to `save_aegis_workspace` while migration 0009 is unapplied. |
| `load_workspace` | Required | Reads the latest snapshot for the caller's organization. |
| `adopt_workspace` | Required | Adopts a demo workspace into the caller's account. |

### 4.2 Team management

| Function | Auth | Description |
|---|---|---|
| `getTeam` | Required | Returns members, invitations, seat counts. |
| `inviteMember` | Required | Creates an invitation token; returns `{ ok, link }`. **Email delivery not wired** (stub-smtp). |
| `revokeInvitation` | Required | Deletes the invitation row. |
| `setMemberRole` | Required | Updates `organization_members.role`. |
| `removeMember` | Required | Removes a workspace member. |
| `acceptInvitation` | Required | Validates token, adds caller to organization. |
| `create_organization_invite` | Security-definer SQL | Called by `inviteMember`. |

### 4.3 Billing

| Function | Auth | Description |
|---|---|---|
| `getBillingStatus` | Required | Reads Dodo customer + subscriptions; returns plan, renewal date, prices. Returns `BILLING_UNAVAILABLE` when env vars absent. |
| `startCheckout` | Required | Creates Dodo checkout session and redirects. Shows inline preview when unavailable (stub-dodo UI). |
| `openBillingPortal` | Required | Redirects to Dodo customer portal. |
| Webhook handler | None (signed) | Updates `organization_plan` on checkout completion; verifies `DODO_WEBHOOK_SECRET`. |

**Required env vars:** `DODO_WEBHOOK_SECRET`, `DODO_PRODUCT_TEAM_MONTHLY`, `DODO_PRODUCT_TEAM_ANNUAL`, `DODO_PRODUCT_BUSINESS_MONTHLY`, `DODO_PRODUCT_BUSINESS_ANNUAL`.

### 4.4 Advisor

| Function | Auth | Description |
|---|---|---|
| `consume_ai_quota` | Required | Atomically increments daily call count; returns 429 when limit reached. |
| Advisor endpoint | Required | Redacts PII from input, forwards to Lovable AI Gateway. |

**Required env vars:** `LOVABLE_API_KEY`.

### 4.5 Admin

| Function | Auth + admin role | Description |
|---|---|---|
| `getLeads` | Required; checks `site_admins` membership | Returns lead form submissions with filtering and CSV export. |
| `getSubmissions` | Required; checks `site_admins` | Returns tool-use submissions. |

### 4.6 Leads

| Function | Auth | Description |
|---|---|---|
| `submitLead` | None | Rate-limited; inserts into `site_leads` via `service_role` after honeypot check. |

---

## 5. Database schema

Supabase migrations are in `supabase/migrations/`. All tables have RLS enabled; access is through security-invoker or security-definer functions. The client never uses the service role.

### Key tables

```sql
organizations          (id uuid PK, name text, created_at)
organization_members   (id uuid PK, organization_id fk, user_id uuid, role text, joined_at)
organization_invitations (id uuid PK, organization_id fk, email text, role text, token text UNIQUE, expires_at, created_by uuid)
organization_plan      (id uuid PK, organization_id fk UNIQUE, plan_id text, status text, renews_on date, cancel_at_period_end bool, dodo_customer_id text, dodo_subscription_id text)
veritrail_workspaces   (id uuid PK, organization_id fk, name text, data jsonb, revision int NOT NULL DEFAULT 0, created_at, updated_at)
site_leads             (id uuid PK, form text, email text, data jsonb, created_at)
ai_quota_usage         (id uuid PK, organization_id fk, date date, count int, UNIQUE(organization_id, date))
site_admins            (user_id uuid PK)
```

### Applied migrations

| Migration | Description |
|---|---|
| 0001–0008 | Initial schema: organizations, members, workspaces, leads |
| 0009 | Rename `save_aegis_workspace` → `save_veritrail_workspace` (apply to enable clean save path) |
| 0010 | `ai_quota_usage` table |
| 0011 | `organization_plan` table |
| 0012 | `organization_members` with roles; `site_admins` |
| 0013 | `revision` column on `veritrail_workspaces`; `save_workspace_checked` SQL function |

---

## 6. Content architecture

Governed content lives in `platform/content/` and is shared with the Python reference platform. The React site and the Python platform both render from the same source.

```
platform/content/
├── website_pages/     # Markdown pages for the public website
├── controls/          # 64 controls (YAML + Markdown)
├── glossary.yaml      # 38 terms; auto:false = listed but not underlined
└── ...
```

The React site builds a client-side search index from this content at Vite build time. Control ID queries (e.g. `is11`) are ranked first.

Seed data in `src/data/`:
- `plans.ts` — plan limits and pricing labels
- `playbook.ts` — `PLAYBOOK_CHAPTERS` (5 parts, chapter/section/outcome structure)
- `templates.ts` — `GOVERNANCE_TEMPLATES` (4 categories: Programme, Lifecycle, Assurance, Operations)
- `controls.ts` — control definitions used by the assessment

---

## 7. PWA

- **Manifest:** `public/manifest.json` — name, icons, shortcuts, screenshots, `display: standalone`
- **Service worker:** `public/sw.js` — network-first for page navigations; never caches sign-in pages, server functions, POST requests, other origins, or URLs with query strings
- **Registration:** `src/features/pwa/register.ts` — production only; never registers in dev, iframe, Lovable preview hosts, or localhost (unless `VITE_PWA_LOCALHOST` is set)
- **Install prompt:** Captured by `PWA_INIT_SCRIPT` inline in `index.html`; shared via `src/features/pwa/install-store.ts`
- **Install entry points:** Site header, site footer, workspace header, install card — all read from `install-store.ts`
- **Analytics:** Install outcomes fire `cta_click` events; matches the Python platform's analytics allow-list

---

## 8. Testing

Tests run with Vitest in a jsdom environment. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` and mocks `window.scrollTo` and `window.matchMedia`.

| Test file | Coverage |
|---|---|
| `product-catalog.test.ts` | Every route, tool page, glossary term has a catalog entry; generated docs are up to date |
| `theme.test.ts` | All three palettes define complete light+dark token sets with AA contrast |
| `smoke.test.ts` (browser) | Every page loads at 390 px and 1280 px; headers stay on one row |
| `governance-model.test.ts` | Gate status, pillar scores, guardrail logic |
| `actions-model.test.ts` | Corrective action state machine, SoD advisory check |
| `playbook.test.ts` | Data layer (chapters, sections, outcomes) + PlaybookScreen rendering |
| `templates.test.ts` | Data layer (templates, categories, sections) + TemplatesScreen rendering |
| `parity/*.test.ts` | TypeScript ports match Python reference fixtures |

Run all tests: `npm test`
Run with coverage: `npm run test:coverage`
Browser smoke only: `npm run test:smoke`

---

## 9. CI/CD

GitHub Actions (`.github/workflows/`):

| Job | Checks |
|---|---|
| `Typecheck, lint, test, build` | `tsc --noEmit`, ESLint, Vitest (all unit tests), `vite build` |
| `Browser smoke test` | Playwright at 390 px and 1280 px; verifies header row, page load, no console errors |

Both jobs must pass for a PR to be mergeable.

Deployments are managed by Lovable Cloud (Cloudflare Pages/Workers). Every commit to `main` is automatically deployed.

---

## 10. Stub status

See [`DEFERRED_STUBS.md`](DEFERRED_STUBS.md) for full connection steps.

| Stub ID | What is built | What is missing |
|---|---|---|
| **stub-sod** | Name-string SoD check in `transitionCorrectiveAction`; opener displayed in ActionCard; advisory notice in UI | Server-side `actorId` comparison; `actorId` field on history entries; migration |
| **stub-smtp** | Invite link generated and shown; email preview card in team panel with `[Not connected]` badge | SMTP/HTTP email provider (`RESEND_API_KEY` or similar); `sendInviteEmail` call in `create_organization_invite` |
| **stub-dodo** | Plan limits enforced in UI; billing screen with real checkout path; inline preview card when Dodo unconfigured | Dodo account + products; `DODO_*` env vars; webhook handler live in deployment |
| **stub-gate-per-system** | Workspace-wide gate badge on each system card; tooltip notes per-system is coming | Per-system answers slice; `systemGateStatus` helper; architectural decision on answer model |
| **stub-playbook-ui** | Full PlaybookScreen UI (part filter, search, mark complete, notes, deep-link); data tests | Rendering tests (router wrapper + jsdom); now implemented in `playbook.test.ts` |
| **stub-templates-ui** | Full TemplatesScreen UI (category filter, search, interpolation, copy, download); data tests | Rendering tests (clipboard mock + jsdom); now implemented in `templates.test.ts` |

---

## 11. Key architectural decisions

1. **Single reducer for workspace state** — All governance state lives in one `GovernanceProvider` reducer mounted at the root. This keeps live state consistent across all routes without per-screen fetches, and makes autosave and Cloud loading share one baseline.

2. **Flat answers map** — Assessment answers are a flat `Record<controlId, answer>` shared across all systems. Per-system answers require an architectural change (see stub-gate-per-system); this was a deliberate trade-off for the initial release.

3. **Optimistic-lock saves** — `save_workspace_checked` compares the submitted revision to the stored one. A stale revision is a conflict (never an overwrite). The client must re-load and merge before saving again.

4. **Content in the repo** — Governed Markdown and YAML live in `platform/content/` and are bundled at build time into the client-side search index. This avoids a CMS dependency and keeps content changes auditable in git.

5. **No SMTP in Cloudflare Workers** — The runtime does not expose SMTP. Email must use an HTTP API (Resend, Postmark, SendGrid). The invite link is functional without email; delivery is deferred to stub-smtp.

6. **Production-only service worker** — The SW never registers in dev, iframes, Lovable preview hosts, or localhost (without an opt-in flag). This prevents stale caches from masking development changes.

7. **Name-string SoD only** — The corrective-action separation-of-duties check compares actor name strings. This is advisory only; a determined user can bypass it. Full enforcement requires `actorId` on history entries and a server-side identity comparison (stub-sod).
