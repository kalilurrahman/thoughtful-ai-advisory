import { describe, expect, it } from "vitest";
import { PLATFORM_TOOLS } from "@/features/platform/catalog";
import {
  buildSearchEntries,
  normalize,
  prepare,
  search,
  SUGGESTED_URLS,
} from "@/features/search/search-index";
import { controls } from "@/features/site/content";
import { GLOSSARY } from "@/features/site/glossary";
import { sitePages, workspaceNav } from "@/features/site/pages";

const entries = buildSearchEntries(GLOSSARY);
const index = prepare(entries);
const ids = new Set(entries.map((e) => e.id));
const top = (q: string) => search(index, q)[0]?.id;

describe("site search index", () => {
  it("indexes every published page, control, glossary term, workspace screen and platform tool", () => {
    for (const p of sitePages.filter((page) => !page.noindex))
      expect(ids.has(`page:${p.path}`), p.path).toBe(true);
    for (const c of controls) expect(ids.has(`control:${c.id}`), c.id).toBe(true);
    for (const t of GLOSSARY) expect(ids.has(`glossary:${t.id}`), t.id).toBe(true);
    for (const item of workspaceNav.items)
      expect(ids.has(`workspace:${item.url}`), item.url).toBe(true);
    for (const t of PLATFORM_TOOLS) expect(ids.has(`platform:${t.slug}`), t.slug).toBe(true);
  });

  it("gives every entry a unique id and an in-app URL", () => {
    expect(ids.size).toBe(entries.length);
    for (const e of entries) expect(e.url.startsWith("/"), e.id).toBe(true);
  });

  it("links glossary results to their anchor on the glossary page", () => {
    const g = entries.find((e) => e.id === "glossary:kill-switch");
    expect(g?.url).toBe("/glossary#kill-switch");
  });

  it("indexes page sections and FAQs with links into the page", () => {
    expect(entries.some((e) => e.kind === "section" && e.url.includes("#"))).toBe(true);
    expect(
      entries.filter((e) => e.kind === "faq").every((e) => e.url.endsWith("#faq-heading")),
    ).toBe(true);
  });

  it("offers suggestions that exist", () => {
    for (const url of SUGGESTED_URLS)
      expect(
        entries.some((e) => e.url === url),
        url,
      ).toBe(true);
  });
});

describe("site search ranking", () => {
  it("normalises case, accents and punctuation", () => {
    expect(normalize("IS-11 Least-privilege")).toBe("is 11 least privilege");
    expect(normalize("  Conformité  ")).toBe("conformite");
  });

  it("puts the control first for any spelling of a control ID", () => {
    for (const q of ["IS-11", "is11", "is 11", "Is-11"]) expect(top(q), q).toBe("control:IS-11");
  });

  it("puts an exact glossary term first", () => {
    expect(top("kill switch")).toBe("glossary:kill-switch");
    expect(top("Prompt injection")).toBe("glossary:prompt-injection");
  });

  it("requires every word to match and returns nothing for an empty query", () => {
    expect(search(index, "")).toEqual([]);
    expect(search(index, "   ")).toEqual([]);
    expect(search(index, "kill switch zzzqqq")).toEqual([]);
  });

  it("ranks a page title match above a passing mention", () => {
    const results = search(index, "risk triage");
    expect(results[0]?.url).toBe("/tools/risk-triage");
  });

  it("respects the result limit", () => {
    expect(search(index, "ai", 5)).toHaveLength(5);
  });
});
