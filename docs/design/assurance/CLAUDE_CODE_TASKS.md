# Claude Code task list — VERITRAIL Assurance uplift

Paste this file into Claude Code at the repo root. Work on a branch; do not force-push (Lovable sync).
Read `AGENTS.md`, then `design_handoff_veritrail_assurance/README.md` before starting.


## Rule zero — migrate, don't rewrite (applies to every phase)
This is a **visual migration**. All existing content must survive unchanged:
- Do **not** delete, rename, shorten, reword or reorder any page, section, FAQ, control, glossary term, template, playbook entry, tool, calculator, game, route or data record. Governed Markdown in `platform/content/**`, `platform/content/controls`, `glossary.yaml` and `src/data/**` is read-only for this work.
- Do **not** remove existing features (search ⌘K, glossary tooltips, "On this page", reading progress, stacked tables, PWA install, offline page, Appearance panel, Broadsheet / Midnight Gold / Financial Slate palettes). Assurance is **added** and made default; old palettes stay selectable.
- Change only presentation: tokens, components, layout, iconography, illustrations, shell.
- **Exception — hero and landing pages only:** the home page (`/`, `src/features/site/home.tsx`) and section landing heroes may be re-laid out per §3.6. Their copy still comes from `index.md` frontmatter/sections; new copy is allowed only in hero eyebrow/sub-lines and must be added to the Markdown, not hard-coded.
- Before/after check: `node scripts/check_website_pages.py` / `npm test` content tests must pass with **zero** fixture or snapshot updates to content. If a test needs a content change, stop and ask.
- Keep `npm run test:smoke` route count identical (152 pages) — no route may disappear.

## Phase 1 — Tokens & theme (no visual regressions yet)
1. Append the blocks from `veritrail-assurance.css` to `src/styles.css` after the slate palette.
2. Register new tokens in `@theme inline` as Tailwind colours: `seal`, `seal-surface`, `seal-ink`, `info-ink`, `info-surface`, `risk-{prohibited,high,limited,minimal}-{ink,surface}`, `viz-track`, `viz-target`, `nav-muted`.
3. Add `"assurance"` to `Palette` and `PALETTES` in `src/lib/theme.ts` (light swatch: bg #f5f7f8, card #ffffff, primary #007396, fg #0b1620; dark: #081118, #0f1b24, #4fb8e3, #f2f5f7). Add the new tokens to every other palette block too (theme.test requires parity) — reuse the Broadsheet success/danger/warning values.
4. Add font option `{ id: "plex", name: "Assurance", body: IBM Plex Sans, heading: Source Serif 4, stylesheet: <Google URL from README> }`.
5. Switch `DEFAULT_PALETTE` → `"assurance"`, `DEFAULT_FONT` → `"plex"`; preload the Plex stylesheet in `__root.tsx` (default font ships with the page).
**Accept:** `npm test` green incl. `theme.test.ts` AA checks; Appearance panel shows the new palette.

## Phase 2 — Primitives
6. Create `src/components/assurance/`: `StatusBadge`, `RiskTierTag`, `KpiTile`, `PillarScore`, `ControlRow`, `GateBanner`, `PageHeader`, `FilterTabs`, `EvidenceTimeline`. Use the `.d.ts` contracts in `components/` as props; style with Tailwind classes on tokens (no inline colours). Build on shadcn `Badge`, `Button`, `Tabs`, `ToggleGroup`.
7. Add `seal` variant to `src/components/ui/button.tsx`; set button radius to `rounded-sm` (4px), heights 32/40/48.
**Accept:** unit render tests for each primitive (status → label text present; never colour-only).

## Phase 3 — Shell
8. Restyle the workspace sidebar to command navy (`bg-sidebar`) with the active inset bar; add the 72px icon-rail mode for 640–1023px.
9. Bottom nav (<640): 4 items + safe-area padding; keep "More actions" menu for overflow.
10. Top bar: translucent sticky, ⌘K search (existing `src/features/search`), org overline, workspace chip.
**Accept:** `npm run test:smoke` (no header wrap at 390/1280); add 834px to the smoke widths.

## Phase 4 — Screens
11. Overview → §3.2. 12. Assessment master/detail → §3.3 (wire status/gate to `model.ts`). 13. Inventory cards + drawer → §3.4 (vaul on phone, Radix Dialog sheet on desktop). 14. Evidence & audit trail → §3.5 (labelled preview until an append-only table exists). 15. Public home → §3.6, keeping content parsed from `index.md` with plain-render fallback.
**Accept:** each screen matches the prototype at 390 / 834 / 1280 in light and dark; no horizontal scroll; all targets ≥44px on phone; Lighthouse a11y ≥ 95.

## Phase 5 — Brand assets
16a. Copy `brand/*.svg` to `public/brand/`. Master mark = the option the owner picks in `VERITRAIL Brand Marks.dc.html` (1a/1b/1c); until decided keep the current `favicon.svg`.
16b. Regenerate favicons and PWA icons from the master mark with `node scripts/generate-pwa-icons.mjs` (maskable safe zone 80%).
16c. Use product marks (Register, Assess, Control, Shield, Assurance, Agent, Policy engine, TILLER) at 32–44px on the matching existing solutions pages, the Workspace menu and the Platform console tool cards. Do not add new pages.
16d. Guardrail icons: map the existing `GR` categories and Shield modes to the Phosphor glyphs listed in README §7 via one `guardrailIcon(name)` helper.
16e. Social images: rebuild `scripts/generate-social-images.mjs` templates on the 1200×630 layout in the Brand Marks file (navy, mark + wordmark, mono eyebrow, serif title, right-side data visual). Keep one image per existing section; titles come from page frontmatter.

## Phase 6 — Docs
16. Update `docs/product/catalog.yaml` for any new route and run `node scripts/build-product-docs.mjs`.
17. Regenerate social images (`scripts/generate-social-images.mjs`) and PWA screenshots.
18. Add a section to `docs/veritrail/UX_PWA_UPLIFT.md` describing the Assurance theme.
