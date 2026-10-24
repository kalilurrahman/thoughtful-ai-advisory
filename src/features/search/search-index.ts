import { PLATFORM_TOOLS } from "@/features/platform/catalog";
import { controls, getPillar, siteConfig, controlUrl } from "@/features/site/content";
import { extractHeadings } from "@/features/site/markdown";
import { CONTROL_LIBRARY_PATH, sitePages, workspaceNav } from "@/features/site/pages";

// One search index for the whole app — website pages and their sections, the control library,
// FAQs, workspace screens and the platform console — built from the same governed content the
// pages render, so it never drifts from what is published. Pure data and functions: no DOM.

export type SearchKind =
  "page" | "section" | "control" | "glossary" | "workspace" | "platform" | "faq";

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  /** Where it lives, or a short description. */
  subtitle: string;
  /** Router href, optionally with a #fragment. */
  url: string;
  /** Extra words to match (description, objective, headings). */
  text: string;
}

export interface GlossarySearchTerm {
  id: string;
  term: string;
  definition: string;
  aliases?: string[];
}

interface Prepared extends SearchEntry {
  nTitle: string;
  nSubtitle: string;
  nText: string;
}

export const KIND_LABELS: Record<SearchKind, string> = {
  page: "Pages",
  section: "Page sections",
  control: "Controls",
  glossary: "Glossary",
  workspace: "Workspace",
  platform: "Platform console",
  faq: "Questions",
};

/** Lower-case, accent-free, punctuation as spaces: "IS-11 Least-privilege" → "is 11 least privilege". */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

export function buildSearchEntries(glossary: GlossarySearchTerm[] = []): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const p of sitePages) {
    if (p.noindex) continue;
    const section = siteConfig.section_labels[p.section] ?? "";
    const pageTitle = p.path === "/" ? "VERITRAIL home" : p.navLabel || p.h1;
    entries.push({
      id: `page:${p.path}`,
      kind: "page",
      title: pageTitle,
      subtitle: truncate([section, p.description].filter(Boolean).join(" · "), 120),
      url: p.path,
      text: `${p.h1} ${p.title} ${p.description} ${p.lead ?? ""}`,
    });
    for (const h of extractHeadings(p.body)) {
      entries.push({
        id: `section:${p.path}#${h.id}`,
        kind: "section",
        title: h.text,
        subtitle: pageTitle,
        url: `${p.path}#${h.id}`,
        text: pageTitle,
      });
    }
    for (const f of p.faq) {
      entries.push({
        id: `faq:${p.path}:${f.q}`,
        kind: "faq",
        title: f.q,
        subtitle: pageTitle,
        url: `${p.path}#faq-heading`,
        text: f.a,
      });
    }
  }
  entries.push({
    id: "page:/framework/controls",
    kind: "page",
    title: "VERITRAIL Control Library",
    subtitle: `Framework · All ${controls.length} controls by pillar`,
    url: CONTROL_LIBRARY_PATH,
    text: "controls library pillars evidence owners mappings",
  });
  entries.push({
    id: "page:/glossary",
    kind: "page",
    title: "Glossary",
    subtitle: `Resources · ${glossary.length} AI governance terms in plain language`,
    url: "/glossary",
    text: "glossary definitions terms",
  });
  for (const c of controls) {
    entries.push({
      id: `control:${c.id}`,
      kind: "control",
      title: `${c.id} ${c.title}`,
      subtitle: `${getPillar(c.pillar)?.name ?? c.pillar} · ${c.priority} priority`,
      url: controlUrl(c.id),
      text: `${c.objective} ${c.owner_role} ${(c.evidence ?? []).join(" ")}`,
    });
  }
  for (const t of glossary) {
    entries.push({
      id: `glossary:${t.id}`,
      kind: "glossary",
      title: t.term,
      subtitle: truncate(t.definition, 120),
      url: `/glossary#${t.id}`,
      text: `${(t.aliases ?? []).join(" ")} ${t.definition}`,
    });
  }
  for (const item of workspaceNav.items) {
    entries.push({
      id: `workspace:${item.url}`,
      kind: "workspace",
      title: item.label,
      subtitle: "TILLER governance workspace",
      url: item.url,
      text: "workspace tiller",
    });
  }
  entries.push({
    id: "platform:/platform",
    kind: "platform",
    title: "Platform console",
    subtitle: "Every Python platform capability, running in the browser",
    url: "/platform",
    text: "platform console tools",
  });
  for (const t of PLATFORM_TOOLS) {
    entries.push({
      id: `platform:${t.slug}`,
      kind: "platform",
      title: t.title,
      subtitle: truncate(t.summary, 120),
      url: `/platform/${t.slug}`,
      text: t.summary,
    });
  }
  return entries;
}

export function prepare(entries: SearchEntry[]): Prepared[] {
  return entries.map((e) => ({
    ...e,
    nTitle: normalize(e.title),
    nSubtitle: normalize(e.subtitle),
    nText: normalize(e.text),
  }));
}

const KIND_WEIGHT: Record<SearchKind, number> = {
  page: 6,
  control: 4,
  glossary: 4,
  workspace: 4,
  platform: 3,
  section: 2,
  faq: 1,
};

const CONTROL_ID_QUERY = /^(ao|ei|gl|is|se) ?(\d{2})$/;

function scoreToken(e: Prepared, token: string): number {
  const titleWords = ` ${e.nTitle}`;
  if (e.nTitle.startsWith(token)) return 14;
  if (titleWords.includes(` ${token}`)) return 9;
  if (e.nTitle.includes(token)) return 5;
  if (` ${e.nSubtitle}`.includes(` ${token}`)) return 3;
  if (` ${e.nText}`.includes(` ${token}`)) return 2;
  if (e.nSubtitle.includes(token) || e.nText.includes(token)) return 1;
  return 0;
}

/**
 * Entries matching every word of the query, best first: title matches beat body matches, and
 * pages beat sections. A control ID ("IS-11", "is11") puts that control first.
 */
export function search(index: Prepared[], query: string, limit = 40): SearchEntry[] {
  const raw = normalize(query);
  if (!raw) return [];
  // "is11", "IS 11" and "IS-11" all mean control IS-11.
  const id = CONTROL_ID_QUERY.exec(raw);
  const q = id ? `${id[1]} ${id[2]}` : raw;
  const tokens = q.split(" ").filter(Boolean);
  const wanted = id ? `control:${id[1]?.toUpperCase()}-${id[2]}` : "";
  const scored: Array<[number, Prepared]> = [];
  for (const e of index) {
    let total = 0;
    let ok = true;
    for (const t of tokens) {
      const s = scoreToken(e, t);
      if (!s) {
        ok = false;
        break;
      }
      total += s;
    }
    if (!ok) continue;
    if (e.nTitle === q) total += 40;
    if (e.id === wanted) total += 100;
    scored.push([total + KIND_WEIGHT[e.kind], e]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].title.length - b[1].title.length);
  return scored.slice(0, limit).map(([, e]) => ({
    id: e.id,
    kind: e.kind,
    title: e.title,
    subtitle: e.subtitle,
    url: e.url,
    text: e.text,
  }));
}

/** Shown before anything is typed. */
export const SUGGESTED_URLS = [
  "/tools/maturity-assessment",
  "/framework/controls",
  "/tools/risk-triage",
  "/tools/ask-veritrail",
  "/glossary",
  "/workspace",
];
