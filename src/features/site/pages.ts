import { parse } from "yaml";
import { PLATFORM_TOOLS } from "../platform/catalog";
import { siteConfig } from "./content";

// Website pages are the Markdown + YAML front-matter files in
// platform/content/website_pages (CONTRIBUTING.md §4 of the platform). They are bundled
// at build time, so editing a page there updates the React site.

const files = import.meta.glob("../../../platform/content/website_pages/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type PageTemplate = "home" | "page" | "tool" | "form";

export interface FaqItem {
  q: string;
  a: string;
}

export interface SitePage {
  source: string;
  title: string;
  h1: string;
  lead?: string;
  /** Router path without trailing slash, e.g. "/tools/risk-triage" ("/" for home). */
  path: string;
  description: string;
  section: string;
  navLabel: string;
  navOrder: number;
  navExclude: boolean;
  noindex: boolean;
  template: PageTemplate;
  tool?: string;
  form?: string;
  primaryCta?: string;
  secondaryCta?: string;
  faq: FaqItem[];
  updated?: string;
  body: string;
}

const FRONT_MATTER_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export function toPath(slug: string): string {
  const trimmed = slug.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function str(v: unknown): string | undefined {
  return v === undefined || v === null ? undefined : String(v);
}

export function parsePage(source: string, text: string): SitePage {
  const m = FRONT_MATTER_RE.exec(text.replace(/^\uFEFF/, ""));
  if (!m) throw new Error(`${source}: missing YAML front matter`);
  const meta = (parse(m[1] ?? "") ?? {}) as Record<string, unknown>;
  const title = str(meta["title"]) ?? source;
  const page: SitePage = {
    source,
    title,
    h1: str(meta["h1"]) ?? title,
    path: toPath(str(meta["slug"]) ?? "/"),
    description: str(meta["description"]) ?? "",
    section: str(meta["section"]) ?? "home",
    navLabel: str(meta["nav_label"]) ?? str(meta["h1"]) ?? title,
    navOrder: Number(meta["nav_order"] ?? 100),
    navExclude: meta["nav_exclude"] === true,
    noindex: meta["noindex"] === true,
    template: (str(meta["template"]) ?? "page") as PageTemplate,
    faq: Array.isArray(meta["faq"]) ? (meta["faq"] as FaqItem[]) : [],
    body: text.slice(m[0].length),
  };
  const optional = {
    lead: str(meta["lead"]),
    tool: str(meta["tool"]),
    form: str(meta["form"]),
    primaryCta: str(meta["primary_cta"]),
    secondaryCta: str(meta["secondary_cta"]),
    updated: str(meta["updated"]),
  };
  for (const [k, v] of Object.entries(optional)) {
    if (v !== undefined) (page as unknown as Record<string, unknown>)[k] = v;
  }
  return page;
}

export const sitePages: SitePage[] = Object.entries(files)
  .map(([file, text]) => parsePage(file.split("/").pop() ?? file, text))
  .sort((a, b) => a.path.localeCompare(b.path));

const byPath = new Map(sitePages.map((p) => [p.path, p]));

export function getSitePage(path: string): SitePage | undefined {
  return byPath.get(toPath(path));
}

export const CONTROL_LIBRARY_PATH = toPath(siteConfig.control_library.slug);

export interface NavItem {
  label: string;
  url: string;
}
export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/** Header navigation, built like the platform builder's build_nav(). */
const publicNav: NavSection[] = siteConfig.nav_sections.flatMap((sec) => {
  const landing = byPath.get(`/${sec.id}`);
  const items: NavItem[] = sitePages
    .filter((p) => p.section === sec.id && !p.navExclude && !p.noindex && p !== landing)
    .map((p) => ({ label: p.navLabel, url: p.path, order: p.navOrder }))
    .concat(
      sec.id === "framework"
        ? [
            {
              label: siteConfig.control_library.nav_label,
              url: CONTROL_LIBRARY_PATH,
              order: siteConfig.control_library.nav_order,
            },
          ]
        : [],
    )
    .sort((a, b) => a.order - b.order || a.label.toLowerCase().localeCompare(b.label.toLowerCase()))
    .map(({ label, url }) => ({ label, url }));
  const entries: NavItem[] = [];
  if (landing)
    entries.push({ label: items.length ? "Overview" : landing.navLabel, url: landing.path });
  entries.push(...items);
  return entries.length ? [{ id: sec.id, label: sec.label, items: entries }] : [];
});

export const workspaceNav: NavSection = {
  id: "workspace",
  label: "Workspace",
  items: [
    { label: "Governance overview", url: "/workspace" },
    { label: "TILLER assessment", url: "/assess" },
    { label: "AI inventory", url: "/inventory" },
    { label: "Roadmap", url: "/roadmap" },
    { label: "Guardrails", url: "/guardrails" },
    { label: "Release readiness", url: "/gates" },
    { label: "Governance decisions", url: "/decisions" },
    { label: "Change reviews", url: "/changes" },
    { label: "Monitoring", url: "/monitoring" },
    { label: "Incidents & near misses", url: "/incidents" },
    { label: "Corrective actions", url: "/actions" },
    { label: "Lifecycle checklist", url: "/checklist" },
    { label: "AI Governance Playbook", url: "/playbook" },
    { label: "Templates", url: "/templates" },
    { label: "Knowledge hub", url: "/knowledge" },
    { label: "Calculators", url: "/calculators" },
    { label: "Start here", url: "/start" },
    { label: "Reports & audit pack", url: "/export" },
    { label: "Plans", url: "/plans" },
    { label: "Workspace & account", url: "/more" },
  ],
};

export const siteNav: NavSection[] = [workspaceNav, ...publicNav];

// The Platform console is a React section rather than Markdown pages.
siteNav.push({
  id: "platform",
  label: "Platform",
  items: [{ label: "Overview", url: "/platform" }].concat(
    PLATFORM_TOOLS.map((t) => ({ label: t.title, url: `/platform/${t.slug}` })),
  ),
});

export const footerColumns = siteNav.map((s) => ({ label: s.label, items: s.items.slice(0, 7) }));

export interface Crumb {
  label: string;
  url?: string;
  current?: boolean;
}

/** Breadcrumb trail for a path; `currentLabel` labels the final crumb. */
export function breadcrumbsFor(path: string, currentLabel: string): Crumb[] {
  if (path === "/") return [];
  const crumbs: Crumb[] = [{ label: "Home", url: "/" }];
  const segs = path.replace(/^\//, "").split("/");
  for (let i = 1; i < segs.length; i++) {
    const p = `/${segs.slice(0, i).join("/")}`;
    const page = byPath.get(p);
    const seg = segs[i - 1] ?? "";
    const label =
      page?.navLabel ??
      siteConfig.section_labels[seg] ??
      seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
    const generated = p === CONTROL_LIBRARY_PATH;
    crumbs.push(
      page && !page.noindex ? { label, url: p } : generated ? { label, url: p } : { label },
    );
  }
  crumbs.push({ label: currentLabel, url: path, current: true });
  return crumbs;
}

/** Top-level path segments owned by the public website (everything else is the workspace). */
export const SITE_SECTIONS = new Set([
  ...sitePages.map((p) => p.path.split("/")[1] ?? "").filter(Boolean),
  "framework",
  "platform",
]);

export function isSitePath(pathname: string): boolean {
  if (pathname === "/") return true;
  return SITE_SECTIONS.has(pathname.split("/")[1] ?? "");
}
