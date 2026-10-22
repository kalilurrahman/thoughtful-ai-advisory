/*
 * The governed content bundled into the website for the in-browser content checks:
 * controls.yaml, assessment templates, policy packs, industry packs, website pages and
 * email_templates.yaml (all from platform/content, read at build time).
 */
import type { ContentFile } from "./content-checks";

const raw = import.meta.glob(
  [
    "../../../../platform/content/controls/*.yaml",
    "../../../../platform/content/assessment_templates/*.yaml",
    "../../../../platform/content/policy_packs/*.yaml",
    "../../../../platform/content/industry_packs/*.yaml",
    "../../../../platform/content/website_pages/*.md",
    "../../../../platform/content/email_templates.yaml",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Bundled files with paths relative to platform/ (e.g. "content/controls/controls.yaml"). */
export const bundledContent: ContentFile[] = Object.entries(raw)
  .map(([k, text]) => ({ path: k.replace(/^(\.\.\/)+platform\//, ""), text }))
  .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
