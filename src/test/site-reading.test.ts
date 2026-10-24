import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  readingMinutes,
  renderMarkdownHtml,
  splitSections,
} from "@/features/site/markdown";
import { getSitePage, sitePages } from "@/features/site/pages";
import { artFor } from "@/features/site/illustrations";
import { formatDate } from "@/features/site/reading";

describe("reading aids in rendered Markdown", () => {
  it("turns bold-led lists into feature cards and numbered steps", () => {
    const features = renderMarkdownHtml(
      "- **One.** a\n- **Two.** b\n- **Three.** c\n- **Four.** d",
    );
    expect(features).toContain('<ul class="feature-list feature-list--grid">');
    expect(renderMarkdownHtml("- **One.** a\n- **Two.** b")).toContain('<ul class="feature-list">');
    expect(renderMarkdownHtml("1. **First.** a\n2. **Second.** b")).toContain(
      '<ol class="step-list">',
    );
  });

  it("turns link-led lists into link cards and leaves ordinary lists alone", () => {
    expect(renderMarkdownHtml("- [A](/a) — x\n- [B](/b) — y")).toContain('<ul class="link-list">');
    expect(renderMarkdownHtml("- plain\n- **mixed** item")).toContain("<ul>");
    expect(renderMarkdownHtml("- only one **item**")).toContain("<ul>");
  });

  it("renders core messages as callouts and arrow lines as sequences", () => {
    expect(renderMarkdownHtml("**Core message: AI proposes.**")).toContain(
      '<p class="key-message"><span class="key-message-label">Core message</span> AI proposes.</p>',
    );
    const flow = renderMarkdownHtml("**Baseline → Register → Control**");
    expect(flow).toContain('<ol class="flow-steps" aria-label="Sequence">');
    expect(flow).toContain("<li>Register</li>");
    // A bold lead-in to a list stays a plain paragraph.
    expect(renderMarkdownHtml("**In the full report:**")).toContain(
      "<p><strong>In the full report:</strong></p>",
    );
  });

  it("labels table cells so tables can stack into cards on phones", () => {
    const html = renderMarkdownHtml("| Layer | What |\n|---|---|\n| Baseline | Start |");
    expect(html).toContain(
      'class="table-wrap" role="region" tabindex="0" aria-label="Scrollable table"><table class="stack-table">',
    );
    expect(html).toContain('<td data-label="What">Start</td>');
    const wide = renderMarkdownHtml(
      "| a | b | c | d | e | f |\n|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 |",
    );
    expect(wide).toContain('aria-label="Scrollable table"><table>');
  });

  it("adds copy and collapse controls to code blocks", () => {
    const short = renderMarkdownHtml("```yaml\na: 1\n```");
    expect(short).toContain('<span class="code-lang">YAML</span>');
    expect(short).toContain("data-code-copy");
    expect(short).not.toContain("data-code-expand");
    const long = renderMarkdownHtml(
      `\`\`\`\n${Array.from({ length: 30 }, (_, i) => `line ${i}`).join("\n")}\n\`\`\``,
    );
    expect(long).toContain('class="code-figure is-collapsed"');
    expect(long).toContain("Show all 30 lines");
  });

  it("links control IDs in text, but not inside links or headings", () => {
    const html = renderMarkdownHtml("See IS-11 and XX-99.\n\n## About IS-11\n\n[IS-13 page](/x)");
    expect(html).toContain('<a class="control-ref" href="/framework/controls/is-11"');
    expect(html).toContain("XX-99");
    expect(html).toContain('<h2 id="about-is-11">About IS-11</h2>');
    expect(html).toContain('<a href="/x">IS-13 page</a>');
  });

  it("builds an 'On this page' list whose links match the rendered heading ids", () => {
    for (const page of sitePages) {
      const html = renderMarkdownHtml(page.body.replace(/\{\{[^}]*\}\}/g, ""));
      for (const h of extractHeadings(page.body))
        expect(html, `${page.source}#${h.id}`).toContain(`id="${h.id}"`);
    }
  });

  it("estimates reading time and formats review dates the same on server and browser", () => {
    expect(readingMinutes("word ".repeat(1100))).toBe(5);
    expect(readingMinutes("")).toBe(1);
    expect(formatDate("2026-10-21")).toBe("21 October 2026");
    expect(formatDate("soon")).toBe("soon");
  });
});

describe("home page sections", () => {
  it("keeps the sections the home layouts draw", () => {
    const home = getSitePage("/");
    const ids = splitSections(home?.body ?? "").map((s) => s.id);
    for (const id of [
      "four-ways-to-start",
      "six-layers-one-governance-system",
      "five-pillars-64-controls",
      "how-it-works",
      "value-by-stakeholder",
    ])
      expect(ids).toContain(id);
  });

  it("gives every content section an illustration", () => {
    for (const page of sitePages.filter((p) => p.path !== "/"))
      expect(artFor(page.path, page.section), page.source).toBeDefined();
  });
});
