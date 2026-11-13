# Kickoff prompt for Claude Code

Copy the folder `design_handoff_veritrail_assurance/` into the repo at `docs/design/assurance/`, commit it, then paste:

---
You are implementing the VERITRAIL Assurance design system in this repo (TanStack Start, React 19, Tailwind v4, shadcn/ui, Phosphor).

Read, in order: `AGENTS.md`, `docs/design/assurance/README.md`, `docs/design/assurance/CLAUDE_CODE_TASKS.md`. Open the `.dc.html` prototypes in a browser for reference (Laptop/Tablet/Phone toggle in the Workspace file).

Constraints:
1. **Rule zero:** migrate, don't rewrite. No existing content, route, tool, control, FAQ, glossary term or data record may be removed, reworded or regenerated. Only the home page and section heroes may be re-laid out, and their copy still comes from the governed Markdown.
2. Tokens only in `src/styles.css`; palettes and fonts registered in `src/lib/theme.ts`; keep light/dark parity and AA contrast (theme.test.ts).
3. Keep both headers on one row from 360px; add 834px to smoke widths.
4. Work phase by phase. After each phase run `npm run lint && npm test && npm run build && npm run test:smoke`, then commit with message `assurance: phase N — <summary>`. Never force-push (Lovable sync).
5. If a test would require changing content fixtures, stop and report instead.

Start with Phase 1 and show me the diff summary before Phase 2.
---
