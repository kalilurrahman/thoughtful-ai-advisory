# VERITRAIL — Session Handover Note

**Date:** 2026-10-30  
**Branch:** `main` (all work merged)  
**Author:** Claude Code session `session_01WAXdxh8yJ4LNvTmFk9As6t`

---

## What was done

All frontend stub work is complete and merged to `main` via PRs #41 and #42.

### PR #41 — Stubs and TODOs audit
- Audited all deferred stubs; confirmed UI-completable ones vs backend-blocked ones

### PR #42 — Stub UI interfaces, rendering tests, TRD, PRD v1.1
- **stub-smtp**: Collapsible email preview card in `team-panel.tsx` with `[Not connected]` badge
- **stub-dodo**: Inline checkout-preview card in `plans-screen.tsx` when Dodo env vars are absent
- **stub-sod**: Opener name + advisory notice in `screens-actions.tsx` on corrective action close
- **stub-gate-per-system**: Gate badge per system card in `screens-operations.tsx` (workspace-wide; per-system deferred)
- **Rendering tests**: PlaybookScreen + TemplatesScreen now have full jsdom rendering tests (1115 total, all passing)
- **`docs/product/TRD.md`**: New Technical Reference Document (tech stack, schema, architecture, stubs)
- **`docs/product/PRD.md`**: Updated to v1.1 (roadmap, risks, open questions)

---

## What remains (blocked on external services or decisions)

| Stub | What's needed | Reference |
|---|---|---|
| **stub-smtp** | Pick a transactional email provider (e.g. Resend); set `RESEND_API_KEY`; wire `sendInviteEmail` in `create_organization_invite` server function | `docs/product/DEFERRED_STUBS.md` |
| **stub-dodo** | Create Dodo Payments account + products; set `DODO_WEBHOOK_SECRET`, `DODO_PRODUCT_TEAM_MONTHLY`, `DODO_PRODUCT_TEAM_ANNUAL`, `DODO_PRODUCT_BUSINESS_MONTHLY`, `DODO_PRODUCT_BUSINESS_ANNUAL`; deploy webhook handler | `docs/veritrail/BILLING_SETUP.md` |
| **stub-sod** | Add `actorId?: string` to corrective action history schema; new Supabase migration; populate from `userId` in GovernanceProvider; add server-side identity check in transition function | `docs/product/DEFERRED_STUBS.md` |
| **stub-gate-per-system** | Architectural decision on per-system answers model (currently a flat map shared across all systems); then implement `systemGateStatus` helper | `docs/product/DEFERRED_STUBS.md` |

---

## Key files to know

| File | Purpose |
|---|---|
| `src/features/governance/store.tsx` | GovernanceProvider — all workspace state and autosave |
| `src/features/governance/model.ts` | Pure governance rules (gate, pillar scores, guardrails) |
| `src/data/plans.ts` | Plan limits and pricing labels |
| `src/features/billing/plans-screen.tsx` | Billing UI with stub-dodo preview card |
| `src/features/governance/team-panel.tsx` | Team management with stub-smtp email preview |
| `src/features/governance/screens-actions.tsx` | Corrective actions with stub-sod advisory notice |
| `src/features/governance/screens-operations.tsx` | AI inventory with stub-gate-per-system badge |
| `docs/product/TRD.md` | Full technical reference |
| `docs/product/PRD.md` | Product requirements v1.1 |
| `docs/product/DEFERRED_STUBS.md` | Step-by-step wiring instructions for all stubs |
| `supabase/migrations/` | Migrations 0001–0013; 0009 must be applied on live DB |

---

## Test suite

```
npm test              # all 1115 unit tests
npm run test:smoke    # browser smoke (Playwright, 390px + 1280px)
npm run test:coverage # with coverage report
```

CI requires both `Typecheck, lint, test, build` and `Browser smoke test` to pass.

---

## Next session starting point

1. Check open issues on GitHub for any new requests
2. If wiring a stub, start with `docs/product/DEFERRED_STUBS.md` for the exact steps
3. If adding a new screen or route, update `docs/product/catalog.yaml` and regenerate docs with `node scripts/build-product-docs.mjs` (otherwise `product-catalog.test.ts` fails)
