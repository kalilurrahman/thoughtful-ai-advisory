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

## AEGIS architecture
- Keep supplied seed constants in src/data and pure governance rules in the governance model module; this keeps screens consistent and formulas independently testable.
- Keep resource highlights, access notes and validation provenance as string fields alongside the source register; this preserves compatibility with workspace snapshot validation without changing persistence.
- Mount a single reducer-backed governance provider and shared shell at the root; this preserves live state across all file-based routes.
- Define the governance context in a separate non-component module; provider hot updates must not replace the context identity used by mounted consumers.
- Provide installation through manifest and static icons only, without a service worker; the requested home-screen support must not cache preview pages.
- Demo evidence attachments and report outputs must remain explicitly labeled previews; the handoff specifies mock file behavior, not real signed exports.

- Persist workspace snapshots through authenticated server functions and an atomic security-invoker SQL function; organization ownership and RLS prevent cross-organization access.
- Keep public demo routes available without sign-in; personal Cloud loading and explicit saving require a validated session, with identity changes clearing prior private state.
- Use a shared desktop sidebar and mobile bottom navigation with screen-specific responsive grids; this keeps all governance workflows available across device sizes.
- Treat assessment, gate and guardrail scores as workspace-level values, and derive portfolio summaries from the live inventory; this avoids implying that systems have individual assessments that are not stored.
- Serve the public website from Markdown pages in platform/content/website_pages and the control library in platform/content/controls; the Python platform, its tests and the React site then share one governed source.
- Route public website pages through the root layout switch (site chrome for `/`, `/$` and `/framework/controls/*`; workspace shell for everything else); the governance workspace overview lives at `/workspace`.
- Expose practitioner workflows through the public Workspace menu and homepage gateway, with a content route for every built screen; the public website must not obscure the GOVERN studio.
- Run the public tools (maturity assessment, risk triage, guardrail generator, Ask AEGIS) as browser ports of the Python reference engines, held to parity by fixtures exported from Python; there is no Python runtime in the deployed site.
- Store public lead submissions only through the `submitLead` server function into the RLS-locked `site_leads` table; forms must say when nothing was recorded.
