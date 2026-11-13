# Lovable prompts — VERITRAIL Assurance migration

The project is Lovable-connected. Commit `docs/design/assurance/` (this folder) to `main` first so Lovable can read it. Send the prompts **one at a time**, check the preview at phone, tablet and desktop widths, then continue. Each prompt repeats the content rule because Lovable treats each prompt independently.

**Standing rule (include in every prompt):** "Visual migration only. Do not delete, rename, reword, shorten or regenerate any existing page, section, FAQ, control, glossary term, tool, template, route or data. Do not touch files in platform/content or src/data. Only the home page hero/landing layout may change."

---
### Prompt 1 — Theme tokens
> Standing rule applies. Add a new colour palette "assurance" and font option "plex" exactly as defined in docs/design/assurance/veritrail-assurance.css. Append those CSS blocks to src/styles.css after the slate palette, register the new tokens in the @theme inline block, add the matching entries to PALETTES and FONTS in src/lib/theme.ts, and make "assurance" and "plex" the defaults. Keep Broadsheet, Midnight Gold and Financial Slate selectable. Every palette must define the same tokens in light and dark so src/test/theme.test.ts passes.

### Prompt 2 — Core primitives
> Standing rule applies. Following docs/design/assurance/README.md §2 and the prop contracts in docs/design/assurance/components/**/*.d.ts, create src/components/assurance/ with StatusBadge (Effective, Partial, Gap, Not tested, In review, Attested — dot + word), RiskTierTag (Prohibited, High-risk, Limited, Minimal — mono uppercase), KpiTile, PillarScore (bar with target tick), ControlRow, GateBanner, PageHeader (serif title + 4px double rule + mono meta line), FilterTabs and EvidenceTimeline. Use Tailwind classes on the tokens only. Add a "seal" variant to the shadcn Button and set button radius to 4px.

### Prompt 3 — Workspace shell
> Standing rule applies. Restyle the workspace shell per README §3.1: 248px command-navy sidebar on screens ≥1024px with an inset light-teal bar on the active item, a 72px icon rail from 640–1023px, and the existing bottom navigation below 640px with safe-area padding. Make the top bar sticky and translucent with the existing ⌘K search, org name and workspace chip. Keep every existing navigation destination and the "More actions" menu. Headers must stay on one row from 360px.

### Prompt 4 — Overview screen
> Standing rule applies. Re-lay out the existing Governance overview (/workspace) using PageHeader, GateBanner, KpiTile and PillarScore per README §3.2. Keep all existing data, numbers, labels and links; only change presentation. KPI grid: repeat(auto-fit, minmax(160px,1fr)).

### Prompt 5 — Assessment, inventory, evidence
> Standing rule applies. Apply README §3.3–3.5 to the existing TILLER assessment, AI inventory and export screens: master/detail control view (side by side ≥1024px, back-link navigation below), system cards with tier tags and a details drawer (vaul on phones), export packs and a sign-off panel. Keep all existing fields, disclaimers ("Screening is a preliminary inference…", preview labels) and behaviour.

### Prompt 6 — Remaining workspace and platform screens
> Standing rule applies. Apply the same primitives (PageHeader, cards, StatusBadge, RiskTierTag, FilterTabs) to every other existing workspace and /platform screen — roadmap, release gates, guardrails, calculators, knowledge hub, playbook, templates, incidents, corrective actions, decisions, monitoring, changes, training, games, plans, onboarding. Restyle only; do not alter content or remove any screen.

### Prompt 7 — Public website (articles and tools)
> Standing rule applies. Apply the Assurance tokens to src/features/site/site.css and the reading components (feature cards, timelines, callouts, stacked tables, code figures, On this page, FAQ accordion). Article content and Markdown stay exactly as they are. Headings use Source Serif 4, body IBM Plex Sans, control IDs and citations IBM Plex Mono.

### Prompt 8 — Home page and section heroes (the only layout redesign)
> Re-lay out the home page per README §3.6 and docs/design/assurance/VERITRAIL Website.dc.html: navy hero with the evidence-trail card, proof strip, Four ways to start, The problem with the "We think so." pull-quote, Six layers, How it works tabs, Value by stakeholder selector, claims note, navy CTA band. All copy must still be parsed from platform/content/website_pages/index.md with the existing plain-render fallback. Apply the navy hero treatment to section landing heroes. Do not change any other page.

### Prompt 9 — Brand assets
> Standing rule applies. Copy docs/design/assurance/brand/*.svg to public/brand/. Show the product marks at 32–44px on the existing Register, Assess, Control, Shield, Assurance and Agent solution pages, the Workspace menu and the Platform tool cards. Add guardrailIcon(name) mapping guardrail categories and Shield modes to the Phosphor icons in README §7. Keep the current favicon until the owner confirms the master mark.

### Prompt 10 — Verify
> Run lint, unit tests, build and the smoke test at 390, 834 and 1280px. List any page whose text content changed compared with main — the expected answer is none except the home page layout.
