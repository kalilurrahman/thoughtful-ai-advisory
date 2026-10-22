import { describe, expect, it } from "vitest";
import fixturesRaw from "./fixtures/platform-misc-parity.json?raw";
import { bundledContent } from "@/features/platform/checks/bundle";
import {
  controlIdsFrom,
  runAllChecks,
  runContentChecks,
  runWebsitePageChecks,
  scanProhibitedClaims,
  splitlines,
} from "@/features/platform/checks/content-checks";

/* eslint-disable @typescript-eslint/no-explicit-any -- fixture JSON */
const fx = (JSON.parse(fixturesRaw) as any).content_checks;

describe("content checks on the repository content (CI guard)", () => {
  const [content, pages] = runAllChecks(bundledContent);

  it("bundles the same files the Python parity export scanned", () => {
    expect(bundledContent.map((f) => f.path)).toEqual(fx.files);
  });

  it("check_content.py: all steps pass", () => {
    expect(content.errors).toEqual([]);
    expect(content.ok).toBe(true);
    expect(content.output).toContain("All content checks passed.");
  });

  it("check_website_pages.py: no errors", () => {
    expect(pages.errors).toEqual([]);
    expect(pages.ok).toBe(true);
  });
});

describe("content checks parity with the Python scripts", () => {
  it("prints the same step lines as check_content.py on the bundled files", () => {
    const r = runContentChecks(bundledContent);
    expect(r.steps.map((s) => s.line)).toEqual(fx.content.lines);
    expect(r.errors).toEqual(fx.content.errors);
  });

  it("matches check_website_pages.py -v (summary, per-page words and FAQ counts)", () => {
    const r = runWebsitePageChecks(bundledContent, controlIdsFrom(bundledContent));
    expect(r.steps[0]?.line).toBe(fx.website.summary);
    expect(r.rows).toEqual(fx.website.rows);
    expect(r.errors).toEqual(fx.website.errors);
    expect(r.warnings).toEqual(fx.website.warnings);
  });

  it("scans paragraphs for prohibited claims with the same negation/instruction rules", () => {
    for (const [name, s] of Object.entries(fx.scan_samples as Record<string, any>)) {
      expect(scanProhibitedClaims({ path: `content/${name}`, text: s.text })).toEqual(s.hits);
    }
  });

  it("detects broken content", () => {
    const broken = bundledContent.map((f) =>
      f.path === "content/website_pages/about.md"
        ? { ...f, text: f.text.replace(/\n---\n/, "\n---\nSee [x](/no-such-page/) and IS-99.\n") }
        : f,
    );
    const [c, p] = runAllChecks(broken);
    expect(c.errors).toContain("unknown control ID IS-99 in content/website_pages/about.md");
    expect(p.errors).toContain("about.md: broken internal link /no-such-page/");
    expect(p.errors).toContain("about.md: unknown control ID IS-99");
    expect(splitlines("a\r\nb\rc\n")).toEqual(["a", "b", "c"]);
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */

describe("ContentChecks UI", () => {
  it("runs the checks in the browser and reports pass/fail per check", async () => {
    const { render, screen } = await import("@testing-library/react");
    const { createElement } = await import("react");
    const { ContentChecks } = await import("@/features/platform/content-checks");
    render(createElement(ContentChecks));
    expect(await screen.findByText("All content checks passed.")).toBeInTheDocument();
    expect(screen.getAllByText("Pass").length).toBeGreaterThanOrEqual(7);
  });
});
