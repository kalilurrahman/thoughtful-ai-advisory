# Handoff: VERITRAIL Assurance design system

## Overview
A visual and interaction uplift for veritrail.kalilurrahman.com (repo `kalilurrahman/thoughtful-ai-advisory`). It evolves the existing **Broadsheet** theme into an "Assurance" theme built for audit, compliance and regulatory advisory work, and makes the TILLER workspace and public site work well on phone, tablet and laptop.

## About the design files
Files in this bundle are **design references created in HTML** — prototypes showing intended look and behaviour, not production code to paste in. Recreate them in the existing codebase: **TanStack Start + React 19 + Tailwind v4 + shadcn/ui (new-york) + Radix + Phosphor/Lucide icons**, following `AGENTS.md` (tokens only in `src/styles.css`; palettes/fonts registered in `src/lib/theme.ts`; tests in `src/test/theme.test.ts` and `npm run test:smoke`).

## Non-negotiable: content is migrated, not regenerated
Every existing page, tool, control, FAQ and data record moves into the new UI **as is**. Only the home page and section hero areas may be re-laid out. See "Rule zero" in `CLAUDE_CODE_TASKS.md`.

## Fidelity
**High-fidelity.** Colours, type, spacing, radii, states and copy are final. Copy comes from the repo's governed content — keep it sourced from `platform/content` / `src/data`, never hard-coded.

---
## 1. Files in this bundle
| File | What it is |
|---|---|
| `veritrail-assurance.css` | Drop-in palette + font blocks using the repo's existing token names |
| `tokens/*.css` | Full token reference (base ramps + semantic aliases) |
| `VERITRAIL Workspace.dc.html` | Interactive workspace prototype; top toolbar switches Laptop 1280 / Tablet 834 / Phone 390 |
| `VERITRAIL Website.dc.html` | Responsive public home page |
| `components/` | Reference React components (inline styles over CSS vars) + `.d.ts` prop contracts |
| `CLAUDE_CODE_TASKS.md` | Ordered, testable task list to paste into Claude Code |

Open the `.dc.html` files in a browser from the design-system project root (they load `styles.css` and `assets/`).

## 2. Design tokens
### Colour (light → dark)
| Role | Light | Dark |
|---|---|---|
| background / canvas | #F5F7F8 | #081118 |
| card | #FFFFFF | #0F1B24 |
| foreground (text-strong) | #0B1620 | #F2F5F7 |
| body text | #1E2C38 | #D5DDE3 |
| muted text | #4A5866 | #A3B0BA |
| border | #D6DDE2 | #22333F |
| hairline / row rule | #E3E8EB | #18262F |
| input border | #8A96A1 | #5A6D7C |
| primary (brand teal) | #007396 (hover #005E7B, press #004961) | #4FB8E3 |
| primary soft / ink | #E1F3FA / #004961 | #0B2A37 / #A3E0F7 |
| sidebar (command navy) | #0D1D29, active #1D3A4F, hover #142A3A | #050C12 |
| focus ring | #0088B0 | #62C5EE |
| seal (attested) | #946A00 · surface #F8EDD2 · ink #7A5600 | #E2BF63 · #2A2110 |

**Audit status** (ink / surface): Effective #0D6A4A / #DFF2E9 · Partial #8A5300 / #FCEFD4 · Gap #A8124A / #FCE6EE · Not tested #4A5866 / #EDF1F3 · In review #004961 / #E1F3FA · Attested = seal.
**EU AI Act tiers**: Prohibited #FFFFFF on #4A0B2A · High-risk #A8124A on #FCE6EE · Limited #8A5300 on #FCEFD4 · Minimal #33424F on #EDF1F3.
All text pairs ≥ 4.5:1 on card and canvas (verify with the existing contrast test).

### Typography
| Style | Font | Size / line | Weight | Notes |
|---|---|---|---|---|
| Display | Source Serif 4 | clamp(40→68px) / 1.1 | 600 | tracking −0.02em, hero only |
| H1 page title | Source Serif 4 | clamp(32→46px) / 1.1 | 600 | tracking −0.01em |
| H2 section | Source Serif 4 | clamp(24→32px) / 1.3 | 600 | |
| H3 | IBM Plex Sans | 22 / 1.3 | 600 | |
| H4 / card title | IBM Plex Sans | 18 / 1.3 | 600 | |
| Lead | IBM Plex Sans | 19 / 1.55 | 400 | |
| Body | IBM Plex Sans | 15 / 1.6 | 400 | reading max 68ch |
| Label | IBM Plex Sans | 13 / 1.35 | 500 | |
| Caption | IBM Plex Sans | 12 / 1.45 | 400 | |
| Overline | IBM Plex Mono | 11 / 1.3 | 500 | UPPERCASE, +0.1em |
| Code / ID | IBM Plex Mono | 13 / 1.35 | 500 | control IDs, citations, timestamps |
| KPI | Source Serif 4 | clamp(32→44px) / 1 | 600 | tabular-nums; unit at 0.45em muted |
| Index | Source Serif 4 | clamp(56→88px) / .85 | 600 | tracking −0.03em |

Google Fonts URL: `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap`

### Spacing, radius, elevation, motion
Spacing 2·4·8·12·16·20·24·32·40·48·64·96. Gutter clamp(16px, 2.5vw, 32px). Content max 1240px.
Radius: badge 2 · control 4 · card 6 · sheet 10 · chip pill.
Shadow: card `0 1px 2px rgba(11,22,32,.06)`; popover `0 1px 2px rgba(11,22,32,.05), 0 4px 12px rgba(11,22,32,.06)`; drawer `0 2px 6px rgba(11,22,32,.08), 0 16px 40px rgba(11,22,32,.14)`. Dark: no card shadow.
Motion: 120ms (hover), 200ms (state), 320ms (drawer) · `cubic-bezier(.2,0,0,1)`.
Signature rule: `border-bottom: 4px double var(--rule)` under every page title.

## 3. Screens / views
### 3.1 App shell (all workspace routes)
- **Laptop ≥1024**: 248px navy sidebar (logo row 60px with bottom hairline rgba(255,255,255,.07); group overline 11px mono #A9B8C4; items 40px high, 14px/500, radius 4, icon 19px; active = bg #1D3A4F + inset 2px left bar #62C5EE + white text; count in mono 11px, alerts #FF8FB4). Org footer pinned bottom.
- **Tablet 640–1023**: same sidebar as 72px icon rail (labels hidden, `title` tooltips).
- **Phone <640**: no sidebar; 64px bottom nav (4 items: Overview, Assess, Systems, Evidence), active = brand colour, fill icon, 28×2px top bar. Add `env(safe-area-inset-bottom)`.
- **Top bar**: 60px, sticky, canvas @88% + blur(10px), bottom border. Laptop/tablet: search field (max 420px, 36px, ⌘K kbd). Phone: shield + wordmark instead of search. Right: org overline, "Demo" chip (brand-soft), theme toggle 36px. Must stay one row from 360px (smoke test).
- **Page header**: overline → serif H1 (+ primary action right, wraps under on phone) → double rule → mono meta line (left/right, wraps).

### 3.2 Overview (`/workspace`)
1. Release-gate banner (full width, clickable → assessment). States: Blocked (gap colours), Conditional (partial), Ready (effective). 10px dot with 4px halo, overline context, 16/600 title, caption detail listing blocking control codes.
2. KPI tiles: `grid-template-columns: repeat(auto-fit, minmax(160px,1fr))` → 4-up laptop, 2-up phone. 3px top rule in tone; serif value; icon 20px top-right; label; mono delta line.
3. Two panels `repeat(auto-fit, minmax(min(100%,340px),1fr))`: **VERITRAIL Index** (big serif number, band name, 5-segment band meter, verified-evidence line) and **TILLER pillars** (letter, name, NIST function overline, 6px track with 2×14px target tick, score coloured by distance to target: < target−20 gap, < target partial, else effective). Clicking a pillar opens Assessment filtered to it.
4. Remediation roadmap: 4 phase cards (01 Stabilize … 04 Assure), done items with filled check in effective green.

### 3.3 TILLER assessment (`/assess` or existing route)
- Pillar filter tabs (segmented, sunken track, active = card + shadow-1, counts in mono).
- **Laptop**: list (flex 1) + sticky detail panel (max 460px) side by side. **Tablet/phone**: master → detail; detail shows "← All controls" back link.
- Control row: 44px mono code column (brand), question 14/500, caption meta "Critical · Owner · Evidence: X", status badge right. Selected = surface-selected + 3px inset brand bar.
- Detail: code chip (brand outline), pillar overline, status badge; serif 22px question; hint; **Maturity** 5-button segmented (0 None … 4 Optimized, 52px tall); **Evidence** 4-button segmented (None, Claimed, Partial, Attached; ≥44px); "What good looks like" checklist; framework refs as mono chips.
- Status rule: s≥3 & evidence Attached → Attested; s≥3 & evidence ≥Partial → Effective; s≥2 → Partial; else Gap. Gate blocks while any Critical control is Gap. (Prototype heuristic — wire to `src/features/governance/model.ts` real rules.)
- Every change appends to the evidence trail.

### 3.4 AI inventory (`/inventory`)
- Tier tabs with counts + "Register & triage" primary. Phone adds a 44px search field (top-bar search is hidden).
- Stats strip: registered / under review / approved / not approved.
- System cards `repeat(auto-fill, minmax(min(100%,290px),1fr))`: name 17/600, tier tag (mono caps) top-right, caption meta, hairline, status dot + label, vendor mono.
- Click → right drawer `width: min(440px,100%)` over scrim; facts as dl (mono overline keys); Disposition 2×2 buttons (Approved, Approved with limits, Under review, Not approved) — selecting writes to trail.
- Keep the disclaimer: "Screening is a preliminary inference, not a legal classification or approval…"

### 3.5 Evidence & audit trail (`/export` + new trail view)
- Export pack cards (Executive one-pager, Detailed scorecard, Audit evidence pack) — remain labelled previews per AGENTS.md.
- Sign-off panel: disabled with reason while blocking controls exist; seal-gold button when ready; signed state shows name, UTC time and pack hash.
- Append-only timeline: dot coloured by outcome, title 14/500, mono UTC timestamp right, "who · ref" caption.

### 3.6 Website home (`/`)
Sticky header (logo, 6 menus ≥1100px, else Menu sheet; Book Baseline hidden <640 and moved into sheet) → **navy hero** (scoped `data-theme=dark`/`.dark` tokens) with copy left and a live "evidence trail" card right → proof strip (64 controls · 5 pillars · 6 layers · 24 questions) → Four ways to start → The problem (pull-quote "We think so." + 5 numbered questions) → Six layers → How it works (5-step tabs with label chips) → Value by stakeholder (chip selector + need/provides split) → claims disclaimer → navy CTA band → footer. All copy from `platform/content/website_pages/index.md`.

## 4. Interactions & behaviour
- Hover: surfaces → `--surface-hover`; primary → hover teal; links underline (offset 3px).
- Focus-visible: 2px ring `--ring`, offset 2px, on every interactive element.
- Drawer: slide-in 320ms from right; Esc and scrim close; focus trapped (use Radix Dialog/vaul Drawer — vaul already installed for phone sheets).
- Score bars animate width 300ms.
- Theme toggle keeps the existing Auto/Light/Dark model from `theme.ts`.
- Reduced motion: disable transitions.

## 5. State
Re-use `GovernanceProvider` (`src/features/governance/store.tsx`). New UI state only: selected control id, pillar filter, inventory tier filter + query, drawer system id, phone master/detail flag. Trail entries should be persisted server-side as an append-only table (new migration) — until then label as preview.

## 6. Assets
Brand marks in `brand/` (SVG, 64×64 viewBox): `veritrail-mark-a|b|c.svg` (master options), `product-register|assess|control|shield|assurance|agent|policy.svg`, `tiller-mark.svg`. Colours: navy #0D1D29, teal #007396, light teal #62C5EE, seal #E2BF63, white. Third-party frameworks are shown as typographic labels only — never imitate their logos.

## 7. Guardrail icon mapping (Phosphor, bold weight in 44px status tiles)
Data database · Input arrow-square-in · Output arrow-square-out · Agent robot · Human oversight user-check · Monitoring pulse · Testing flask · Prompt injection syringe · PII masking eye-slash · Groundedness anchor · Toxicity warning-octagon · Tool allow-list wrench · Spend limit currency-circle-dollar · Approval gate hand-palm · Kill switch power · Audit log scroll · Observe eye · Warn warning · Protect shield-check · Enforce lock-key · Contain prohibit · ALLOW check-circle · DENY x-circle · REQUIRE_HUMAN_APPROVAL user-focus.

## 8. Previous assets (unchanged)
Shield mark `public/favicon.svg` / `public/veritrail-logo.png` (unchanged). Icons: Phosphor (already a dependency).
