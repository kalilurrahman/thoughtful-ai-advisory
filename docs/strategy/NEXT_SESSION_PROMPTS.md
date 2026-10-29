# Prompts for the next sessions

Paste one of these into a new session. Both start from the branch `claude/keen-volta-u75pqc`, which holds the unmerged billing, teams, autosave and audit work. If that branch has been merged, start from `main` instead.

## 1. Fix the content audit findings, one by one

```text
You are working on VERITRAIL, an AI governance product: a React/TanStack Start website and workspace on Lovable Cloud (Supabase), with a Python reference platform in platform/. Read AGENTS.md first and follow it strictly. In particular:
- never rewrite pushed history (Lovable syncs this repo), and keep the branch working after every commit;
- public content lives in platform/content and is shared with the Python platform;
- record public content revisions in src/data/content-changelog.ts;
- describe every route and feature in docs/product/catalog.yaml, then run `node scripts/build-product-docs.mjs`;
- define colours and fonts only as tokens in src/styles.css.

Start from the branch `claude/keen-volta-u75pqc`: fetch it and base your branch on it.

Task: fix the findings in docs/strategy/CONTENT_AUDIT.md ONE AT A TIME, in the order of its section 9 "Prioritised fix list" (P0, then P1, then P2). Read the whole audit and the files it cites first. Re-check each finding against the current code, because some may already be fixed.

For each item:
1. Re-check the finding and say in one line what you will change.
2. Make the smallest correct change. Edit the governed Markdown or YAML; never add presentation markup to the Markdown.
3. Update everything kept in parity: the TypeScript ports of the Python checks (src/features/platform/checks), the parity fixtures (`python3 platform/scripts/export_platform_misc_parity_fixtures.py`), the sitemap (`node scripts/generate-sitemap.mjs`), the product docs and the content change log.
4. Run the checks:
   - `npx tsc --noEmit -p .`
   - `npx vitest run`
   - `python platform/scripts/check_website_pages.py`
   - `python platform/scripts/check_content.py`
   - `cd platform && python -m pytest -q tests/unit tests/integration tests/security`
   For changes that affect screens, start `npx vite dev --host 127.0.0.1 --port 4173`, run `CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/smoke-test.mjs http://127.0.0.1:4173`, and look at the changed screens at 390px and 1280px.
5. Commit each item with a clear message, push, and tell me in two lines what changed before moving on.

These decisions are mine. Ask me with AskUserQuestion, and work on other items while you wait:
- Whether to keep the names VERITRAIL and TILLER. A trademark clearance search is needed; rename nothing without my answer.
- The final legal text: entity name, address, contacts, refund window and governing law. You may fix the factual rows (which features use AI, the CRM as a processor, e-mail behaviour). Leave the [bracketed] items for me and list them at the end.
- Workspace maturity levels: adopt the website's five levels and thresholds (Initial <40, Developing 40–59, Defined 60–74, Managed 75–89, Optimized 90+), or rename the workspace score to "readiness index". Recommend one.
- US or UK spelling as the house standard. The audit recommends US.
- Plan limits that are not enforced yet: mark them "coming soon" (recommended), or enforce them.

Guidance:
- EU AI Act refresh: Regulation (EU) 2026/1744 (the Digital Omnibus) was published on 24 July 2026. Annex III high-risk obligations now apply from 2 December 2027, and Annex I product-embedded systems from 2 August 2028. Check this against EUR-Lex if you can reach it. Keep the "verify against the Official Journal" caveat, but state the adopted position with a date.
- Never introduce compliance claims. The product supports readiness; it never certifies or determines compliance. Run the prohibited-claim scan.
- Risk tiers: show VERITRAIL tier names (Low, Medium, High, Prohibited-review) in the inventory, never EU AI Act categories.
- A user's own "Verified" choice must not look like reviewer verification. Follow the audit's recommendation.

Environment:
- The bun lockfile points at a blocked package mirror. Copy package.json to a temporary folder, run `BUN_CONFIG_REGISTRY=https://registry.npmjs.org bun install` there, and move node_modules into the repo. Don't change any lockfile.
- PostgreSQL 16 is installed for testing SQL. Create a stand-in `auth` schema (users table, `auth.uid()`) and the roles anon, authenticated and service_role.
- Don't create a pull request unless I ask.

When every item is done or waiting on me, give me a table: item, status (fixed / needs your decision / skipped and why), and commit.
```

## 2. Illustrations and share images for the site

This follows the site's rule in AGENTS.md: illustrations are inline SVG coloured by the theme tokens, so they follow light and dark mode and work offline. Raster images from an image model would break that.

```text
You are working on VERITRAIL, an AI governance product: a React/TanStack Start site on Lovable. Read AGENTS.md first and follow it strictly. Never rewrite pushed history, keep the branch working after every commit, define colours only as tokens in src/styles.css, and keep both headers on one row from 360px.

Start from the branch `claude/keen-volta-u75pqc`: fetch it and base your branch on it.

Goal: a richer, consistent set of illustrations for the website and workspace. The style is calm, professional and editorial ("broadsheet"), suited to risk, audit and security buyers. No cartoon characters, robots, glowing brains or stock-photo clichés.

Hard rules (from AGENTS.md):
- Draw every illustration as inline SVG in src/features/site/illustrations.tsx, or a sibling module in the same style.
- Colour them only with the CSS tokens: var(--primary), var(--foreground), var(--muted-foreground), var(--card), var(--border) and the success, warning and danger inks. They must work in light and dark mode, in all three palettes (Broadsheet, Midnight Gold, Financial Slate), and offline. No external images, fonts or CDNs.
- Pictures that show data (the control mosaic, the home page counts) must read from the governed content. Never hard-code the numbers.
- Every SVG needs role="img" and a <title>, or aria-hidden when it is decorative. Respect prefers-reduced-motion; any motion is optional and subtle.
- Keep pages fast: a fixed viewBox and size so nothing shifts, small files, and shared shapes (<symbol>/<use> or small components) instead of copied paths.

Steps:
1. Review what exists: illustrations.tsx and where each illustration is used (section headers, home page, tool pages, workspace gateway), public/og, scripts/generate-social-images.mjs, and the app's PWA screenshots and icons. List the pages and sections that have no visual, or a weak or repeated one.
2. Before drawing, propose a short visual system:
   - line weight, corner radius and grid;
   - one drawing per concept: inventory as a ledger or cards, risk tiers as graduated bands, runtime guardrails as a checkpoint on a path, evidence as stamped documents with labels, the audit trail as linked blocks, human approval as a hand-off between two marks;
   - one motif per website section: framework, solutions, compliance, industries, tools, resources and blog.
   Show it to me as a short list with one sample SVG, and ask me to confirm with AskUserQuestion.
3. After I confirm, draw the set in small commits:
   - a header illustration for each section and each solution module;
   - spot illustrations for the four live tools and the two planned ones;
   - empty-state illustrations for the workspace registers (inventory, incidents, decisions, change reviews, monitoring, corrective actions) and for the plans and invite pages;
   - an improved control mosaic and home page "how it works" diagram, driven by the control library.
4. Check every illustration in all three palettes, in light and dark mode, at 390px and 1280px. Playwright is pre-installed; launch it with executablePath /opt/pw-browsers/chromium, screenshot each page in each mode, and look at the screenshots yourself. Lines and text must meet WCAG AA contrast against their backgrounds. If you add tokens, extend src/test/theme.test.ts.
5. Regenerate the share images with scripts/generate-social-images.mjs against a running build; og:image URLs must stay absolute (VITE_SITE_URL). If the app's look changed, re-run the PWA screenshot script.
6. Run the checks against `npx vite dev --host 127.0.0.1 --port 4173`:
   - `npx tsc --noEmit -p .`
   - `npx vitest run`
   - `CHROMIUM_PATH=/opt/pw-browsers/chromium node scripts/smoke-test.mjs http://127.0.0.1:4173`
   If a feature changed, update docs/product/catalog.yaml and run `node scripts/build-product-docs.mjs`.
7. Commit each group and push. Finish with a contact sheet: one HTML page in docs/assets showing every illustration in light and dark mode. Send it to me.

Install note: the bun lockfile points at a blocked package mirror. Copy package.json to a temporary folder, run `BUN_CONFIG_REGISTRY=https://registry.npmjs.org bun install` there, and move node_modules into the repo. Don't change any lockfile. Don't create a pull request unless I ask.

VERITRAIL and TILLER are under trademark review and may be renamed, so keep both names out of the artwork.
```

To skip the first prompt's questions, add a line at the end such as: "Decisions: keep the names for now, US spelling, adopt the website's levels, mark unenforced limits coming soon."
