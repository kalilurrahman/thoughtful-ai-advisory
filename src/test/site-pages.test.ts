import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PLATFORM_TOOLS } from "@/features/platform/catalog";
import { controls, getControl, siteConfig } from "@/features/site/content";
import { renderMarkdownHtml, safeHref, splitShortcodes } from "@/features/site/markdown";
import {
  breadcrumbsFor,
  getSitePage,
  isSitePath,
  siteNav,
  sitePages,
  toPath,
} from "@/features/site/pages";

const knownPaths = new Set<string>([
  ...sitePages.map((p) => p.path),
  "/framework/controls",
  ...controls.map((c) => `/framework/controls/${c.id.toLowerCase()}`),
  "/workspace",
  "/platform",
  ...PLATFORM_TOOLS.map((t) => `/platform/${t.slug}`),
]);

function internalLinks(markdown: string): string[] {
  return [...markdown.matchAll(/\]\((\/[^)\s#]*)/g)].map((m) => toPath(m[1] ?? "/"));
}

describe("public website pages", () => {
  it("loads every Markdown page with unique paths", () => {
    expect(sitePages.length).toBeGreaterThanOrEqual(56);
    expect(new Set(sitePages.map((p) => p.path)).size).toBe(sitePages.length);
    for (const p of sitePages) {
      expect(p.title, p.source).toBeTruthy();
      expect(p.description, p.source).toBeTruthy();
    }
  });

  it("serves the home page and section landing pages", () => {
    expect(getSitePage("/")?.template).toBe("home");
    for (const id of ["framework", "solutions", "compliance", "industries", "tools", "resources"]) {
      expect(getSitePage(`/${id}/`), id).toBeDefined();
    }
  });

  it("resolves every internal Markdown link and CTA to a page", () => {
    const broken: string[] = [];
    for (const p of sitePages) {
      for (const href of internalLinks(p.body + p.faq.map((f) => f.a).join("\n"))) {
        if (href.startsWith("/downloads/")) {
          if (!existsSync(join(process.cwd(), "public", href))) broken.push(`${p.source}: ${href}`);
        } else if (!knownPaths.has(href)) broken.push(`${p.source}: ${href}`);
      }
    }
    for (const cta of Object.values(siteConfig.ctas)) {
      if (!knownPaths.has(toPath(cta.url))) broken.push(`cta: ${cta.url}`);
    }
    expect(broken).toEqual([]);
  });

  it("references only known controls and CTAs in shortcodes", () => {
    for (const p of sitePages) {
      for (const seg of splitShortcodes(p.body)) {
        if (seg.kind === "controls")
          seg.ids.forEach((id) => expect(getControl(id), `${p.source} ${id}`).toBeDefined());
        if (seg.kind === "cta")
          expect(siteConfig.ctas[seg.key], `${p.source} ${seg.key}`).toBeDefined();
        if (seg.kind === "md")
          expect(seg.text, p.source).not.toMatch(/\{\{\s*(cta|controls|disclaimer)/);
      }
    }
  });

  it("builds navigation whose links all resolve", () => {
    expect(siteNav.map((s) => s.id)).toEqual([
      "workspace",
      ...siteConfig.nav_sections.map((s) => s.id),
      "platform",
    ]);
    // Workspace links are app routes, checked against the router in app-routing.test.tsx.
    for (const item of siteNav.filter((s) => s.id !== "workspace").flatMap((s) => s.items))
      expect(knownPaths.has(item.url), item.url).toBe(true);
    expect(
      siteNav.find((s) => s.id === "framework")?.items.some((i) => i.url === "/framework/controls"),
    ).toBe(true);
  });

  it("builds breadcrumbs from the page hierarchy", () => {
    const crumbs = breadcrumbsFor("/framework/pillars/inventory", "Inventory");
    expect(crumbs.map((c) => c.url)).toEqual([
      "/",
      "/framework",
      "/framework/pillars",
      "/framework/pillars/inventory",
    ]);
  });

  it("classifies site and workspace paths", () => {
    expect(isSitePath("/")).toBe(true);
    expect(isSitePath("/tools/risk-triage")).toBe(true);
    expect(isSitePath("/inventory")).toBe(false);
  });
});

describe("safe Markdown rendering", () => {
  it("escapes raw HTML and neutralises unsafe links", () => {
    const html = renderMarkdownHtml(
      "<script>alert(1)</script>\n\n[x](javascript:alert(1)) [y](/tools/risk-triage/)",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="#"');
    expect(html).toContain('href="/tools/risk-triage"');
  });

  it("demotes h1, adds heading ids and wraps tables", () => {
    const html = renderMarkdownHtml("# Title\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain('<h2 id="title">');
    expect(html).toContain('class="table-wrap"');
  });

  it("makes code blocks keyboard-focusable so they can be scrolled", () => {
    expect(renderMarkdownHtml("```\nconst a = 1;\n```")).toContain('<pre tabindex="0">');
  });

  it("keeps fragments and external URLs", () => {
    expect(safeHref("/framework/#pillars")).toBe("/framework#pillars");
    expect(safeHref("https://example.com/a/")).toBe("https://example.com/a/");
    expect(safeHref("data:text/html,x")).toBe("#");
  });
});
