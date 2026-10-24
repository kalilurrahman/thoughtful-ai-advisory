<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## VERITRAIL architecture
- Keep supplied seed constants in src/data and pure governance rules in the governance model module; this keeps screens consistent and formulas independently testable.
- Keep resource highlights, access notes and validation provenance as string fields alongside the source register; this preserves compatibility with workspace snapshot validation without changing persistence.
- Mount a single reducer-backed governance provider and shared shell at the root; this preserves live state across all file-based routes.
- Define the governance context in a separate non-component module; provider hot updates must not replace the context identity used by mounted consumers.
- Provide installation through the manifest, the shield icons and a production-only service worker (`public/sw.js`, registered by `src/features/pwa/register.ts`); it must never register in development, in an iframe, on Lovable preview hosts or on localhost (unless opted in), so preview pages are never cached. Pages are network-first; server functions, POSTs, other origins, sign-in pages and URLs with query strings are never cached.
- Capture `beforeinstallprompt` with the inline `PWA_INIT_SCRIPT` and share it through `src/features/pwa/install-store.ts`; every install entry point (site header and footer, workspace header, install card) uses that one store. Install outcomes reuse the `cta_click` event, so the analytics allow-list stays in parity with the Python platform.
- Keep reading aids (cards, steps, callouts, stacked tables, control links, "On this page") in the React renderer and templates, derived from the structure authors already write; do not add presentation markup to the governed Markdown, which the Python platform also renders.
- Draw illustrations as inline SVG coloured by the Broadsheet tokens (`src/features/site/illustrations.tsx`), so they follow light/dark mode and work offline; data-driven pictures (the control mosaic, home counts) must read from the governed content.
- Demo evidence attachments and report outputs must remain explicitly labeled previews; the handoff specifies mock file behavior, not real signed exports.

- Persist workspace snapshots through authenticated server functions and an atomic security-invoker SQL function; organization ownership and RLS prevent cross-organization access.
- Keep public demo routes available without sign-in; personal Cloud loading and explicit saving require a validated session, with identity changes clearing prior private state.
- Use a shared desktop sidebar and mobile bottom navigation with screen-specific responsive grids; this keeps all governance workflows available across device sizes.
- Treat assessment, gate and guardrail scores as workspace-level values, and derive portfolio summaries from the live inventory; this avoids implying that systems have individual assessments that are not stored.
- Serve the public website from Markdown pages in platform/content/website_pages and the control library in platform/content/controls; the Python platform, its tests and the React site then share one governed source.
- Route public website pages through the root layout switch (site chrome for `/`, `/$` and `/framework/controls/*`; workspace shell for everything else); the governance workspace overview lives at `/workspace`.
- Expose practitioner workflows through the public Workspace menu and homepage gateway, with a content route for every built screen; the public website must not obscure the TILLER studio.
- Run the public tools (maturity assessment, risk triage, guardrail generator, Ask VERITRAIL) as browser ports of the Python reference engines, held to parity by fixtures exported from Python; there is no Python runtime in the deployed site.
- Store public lead submissions only through the `submitLead` server function into the RLS-locked `site_leads` table; forms must say when nothing was recorded.
- Run every Python-only platform capability from the `/platform` console as TypeScript ports, which are held to parity by fixtures from `platform/scripts/export_*_parity_fixtures.py`. Keep demo data in the browser; only leads, analytics events and admin membership live in the database.
- Gate the admin console behind sign-in and membership in `site_admins`. Admin server functions verify membership before reading with the service role.
