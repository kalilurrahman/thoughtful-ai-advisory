import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import catalogYaml from "../../docs/product/catalog.yaml?raw";
import { PLATFORM_TOOLS } from "@/features/platform/catalog";
import { sitePages } from "@/features/site/pages";

// docs/product/catalog.yaml is the source of the capabilities index, epics and user stories, and
// use cases (scripts/build-product-docs.mjs). These checks keep it complete and consistent with
// the app: every route and tool has a capability, every reference resolves, and the generated
// Markdown matches the catalog.

interface Story {
  id: string;
  persona: string;
  status: string;
  acceptance: string[];
  routes?: string[];
  tests?: string[];
  capabilities?: string[];
}
interface Catalog {
  personas: Array<{ id: string }>;
  areas: Array<{ id: string }>;
  epics: Array<{ id: string; area: string; status: string; stories: Story[] }>;
  use_cases: Array<{ id: string; actors: string[]; stories: string[]; flow: string[] }>;
  capabilities: Array<{
    id: string;
    route: string;
    area: string;
    status: string;
    data: string;
    epic: string;
    personas: string[];
    source: string[];
    tests: string[];
  }>;
}

const ROOT = process.cwd();
const catalog = parse(catalogYaml) as Catalog;
const stories = catalog.epics.flatMap((e) => e.stories);
const personaIds = new Set(catalog.personas.map((p) => p.id));
const capRoutes = new Set(catalog.capabilities.map((c) => c.route).filter(Boolean));
const testFiles = new Set(
  Object.keys(import.meta.glob("./*.test.{ts,tsx}")).map((f) => f.replace("./", "")),
);

/** src/routes file → URL path (TanStack flat routes: "." is "/", "index" is the parent). */
function routePaths(): string[] {
  const files = Object.keys(import.meta.glob("../routes/*.tsx"));
  const paths: string[] = [];
  for (const file of files) {
    const name = file.replace("../routes/", "").replace(/\.tsx$/, "");
    if (name === "__root") continue;
    const path = `/${name.split(".").join("/")}`.replace(/\/index$/, "") || "/";
    if (path === "/platform/$tool") paths.push(...PLATFORM_TOOLS.map((t) => `/platform/${t.slug}`));
    else paths.push(path === "/index" ? "/" : path);
  }
  return paths;
}

function expectUnique(ids: string[], what: string) {
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  expect(dupes, `duplicate ${what}`).toEqual([]);
}

describe("product catalog", () => {
  it("has a capability for every app route, platform tool and the glossary", () => {
    const paths = routePaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/glossary");
    expect(paths).toContain("/platform/agent");
    const missing = paths.filter((p) => !capRoutes.has(p));
    expect(missing, "routes with no capability in docs/product/catalog.yaml").toEqual([]);
  });

  it("has a capability for every tool page on the website", () => {
    const tools = sitePages.filter((p) => p.tool);
    expect(tools.length).toBeGreaterThanOrEqual(4);
    for (const page of tools) expect(capRoutes.has(page.path), page.path).toBe(true);
  });

  it("uses unique IDs", () => {
    expectUnique(
      catalog.personas.map((p) => p.id),
      "persona",
    );
    expectUnique(
      catalog.areas.map((a) => a.id),
      "area",
    );
    expectUnique(
      catalog.epics.map((e) => e.id),
      "epic",
    );
    expectUnique(
      stories.map((s) => s.id),
      "story",
    );
    expectUnique(
      catalog.use_cases.map((u) => u.id),
      "use case",
    );
    expectUnique(
      catalog.capabilities.map((c) => c.id),
      "capability",
    );
    expectUnique(catalog.capabilities.map((c) => c.route).filter(Boolean), "capability route");
  });

  it("resolves every persona, area, epic, story and capability reference", () => {
    const areaIds = new Set(catalog.areas.map((a) => a.id));
    const epicIds = new Set(catalog.epics.map((e) => e.id));
    const storyIds = new Set(stories.map((s) => s.id));
    const capIds = new Set(catalog.capabilities.map((c) => c.id));
    for (const e of catalog.epics) {
      expect(areaIds.has(e.area), e.id).toBe(true);
      for (const s of e.stories) {
        expect(s.id.startsWith(`S${e.id.slice(1)}.`), `${s.id} belongs to ${e.id}`).toBe(true);
        expect(personaIds.has(s.persona), `${s.id} persona`).toBe(true);
        expect(["done", "partial", "planned"]).toContain(s.status);
        expect(s.acceptance.length, `${s.id} acceptance criteria`).toBeGreaterThan(0);
        for (const c of s.capabilities ?? []) expect(capIds.has(c), `${s.id} → ${c}`).toBe(true);
      }
    }
    for (const u of catalog.use_cases) {
      expect(u.flow.length, u.id).toBeGreaterThan(0);
      for (const a of u.actors) expect(personaIds.has(a), `${u.id} actor ${a}`).toBe(true);
      for (const s of u.stories) expect(storyIds.has(s), `${u.id} → ${s}`).toBe(true);
    }
    for (const c of catalog.capabilities) {
      expect(areaIds.has(c.area), `${c.id} area`).toBe(true);
      expect(epicIds.has(c.epic), `${c.id} epic`).toBe(true);
      expect(["live", "demo", "preview", "planned"]).toContain(c.status);
      expect(["none", "session", "browser", "memory", "cloud", "server"]).toContain(c.data);
      for (const p of c.personas) expect(personaIds.has(p), `${c.id} persona ${p}`).toBe(true);
    }
  });

  it("points at source files and tests that exist", () => {
    for (const c of catalog.capabilities) {
      for (const s of c.source) expect(existsSync(join(ROOT, s)), `${c.id} source ${s}`).toBe(true);
      for (const t of c.tests) expect(testFiles.has(t), `${c.id} test ${t}`).toBe(true);
    }
    for (const s of stories)
      for (const t of s.tests ?? []) expect(testFiles.has(t), `${s.id} test ${t}`).toBe(true);
  });

  it("delivers every capability through at least one user story", () => {
    const storyRoutes = new Set(stories.flatMap((s) => s.routes ?? []));
    const storyCaps = new Set(stories.flatMap((s) => s.capabilities ?? []));
    const contentRoute = sitePages.some(
      (p) => p.template === "page" && p.path !== "/" && storyRoutes.has(p.path),
    );
    const orphans = catalog.capabilities.filter(
      (c) =>
        !storyCaps.has(c.id) && !storyRoutes.has(c.route) && !(c.route === "/$" && contentRoute),
    );
    expect(orphans.map((c) => c.id)).toEqual([]);
  });

  it("only lists story routes that exist", () => {
    const known = new Set([...routePaths(), ...sitePages.map((p) => p.path)]);
    for (const s of stories)
      for (const r of s.routes ?? []) expect(known.has(r), `${s.id} route ${r}`).toBe(true);
  });

  it("keeps the generated product docs in step with the catalog", () => {
    // Fails when catalog.yaml or the website pages changed without regenerating the docs.
    expect(() =>
      execFileSync(process.execPath, ["scripts/build-product-docs.mjs", "--check"], {
        cwd: ROOT,
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
