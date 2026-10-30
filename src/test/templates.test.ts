import { describe, expect, it } from "vitest";
import { GOVERNANCE_TEMPLATES } from "@/data/templates";

// Stub: full UI tests for TemplatesScreen (copy-to-clipboard, context interpolation)
// require a jsdom environment that mocks navigator.clipboard. Wire up once a
// clipboard mock helper is available (TODO: stub-templates-ui).

describe("governance templates data", () => {
  it("has at least one template", () => {
    expect(GOVERNANCE_TEMPLATES.length).toBeGreaterThan(0);
  });

  it("every template has a unique id, a non-empty title, description, and a known category", () => {
    const ids = new Set<string>();
    const validCategories = new Set(["Programme", "Lifecycle", "Assurance", "Operations"]);
    for (const template of GOVERNANCE_TEMPLATES) {
      expect(ids.has(template.id), `duplicate id: ${template.id}`).toBe(false);
      ids.add(template.id);
      expect(template.title.trim().length, `empty title: ${template.id}`).toBeGreaterThan(0);
      expect(
        template.description.trim().length,
        `empty description: ${template.id}`,
      ).toBeGreaterThan(0);
      expect(
        validCategories.has(template.category),
        `unknown category "${template.category}" in ${template.id}`,
      ).toBe(true);
    }
  });

  it("every template has at least one section with a non-empty heading", () => {
    for (const template of GOVERNANCE_TEMPLATES) {
      expect(template.sections.length, `no sections in ${template.id}`).toBeGreaterThan(0);
      for (const section of template.sections) {
        expect(
          section.heading.trim().length,
          `empty section heading in ${template.id}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

// TODO (stub-templates-ui): render TemplatesScreen in jsdom with a clipboard mock, verify:
//   - category filter shows only matching templates
//   - search input filters by title/description/category
//   - context fields (organisation, owner, system, date) interpolate into the generated Markdown
//   - "Copy" button calls navigator.clipboard.writeText with the rendered Markdown
//   - "Download" button triggers a file download with a .md extension
