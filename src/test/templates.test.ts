import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { GOVERNANCE_TEMPLATES } from "@/data/templates";

// --- Data-layer tests ---

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

// --- Rendering tests (stub-templates-ui) ---

const writeTextMock = vi.fn().mockResolvedValue(undefined);
const createObjectURLMock = vi.fn(() => "blob:mock-url");
const revokeObjectURLMock = vi.fn();
const anchorClickMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("navigator", { clipboard: { writeText: writeTextMock } });
  // Stub URL methods — preserve the real constructor.
  vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURLMock);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURLMock);
  // Stub anchor click to avoid jsdom navigation errors.
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(anchorClickMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

import { TemplatesScreen } from "@/features/governance/screens-templates";

const firstTemplate = GOVERNANCE_TEMPLATES[0]!;
// Find a template whose category is NOT "All" (i.e. any real category).
const nonAllCategories = ["Programme", "Lifecycle", "Assurance", "Operations"] as const;
type Category = (typeof nonAllCategories)[number];
const templatesByCategory = Object.fromEntries(
  nonAllCategories.map((cat) => [cat, GOVERNANCE_TEMPLATES.filter((t) => t.category === cat)]),
) as Record<Category, typeof GOVERNANCE_TEMPLATES>;
// Pick the first category that has at least one template.
const filterCategory = nonAllCategories.find((cat) => templatesByCategory[cat].length > 0)!;
const templatesInCategory = templatesByCategory[filterCategory]!;
const templatesOutsideCategory = GOVERNANCE_TEMPLATES.filter(
  (t) => t.category !== filterCategory,
);

describe("TemplatesScreen rendering", () => {
  it("renders at least the first template", () => {
    render(createElement(TemplatesScreen));
    // The title appears in both the list panel and the builder pane; just confirm it's present.
    expect(screen.getAllByText(firstTemplate.title).length).toBeGreaterThan(0);
  });

  it("category filter shows only matching templates", () => {
    render(createElement(TemplatesScreen));
    const filterButton = screen.getByRole("button", { name: filterCategory });
    fireEvent.click(filterButton);
    // The list panel has aria-label="Available templates" — query it by aria-label.
    const listPanel = screen.getByLabelText(/available templates/i);
    // Every template outside the selected category should not appear in the list panel.
    for (const template of templatesOutsideCategory) {
      expect(listPanel.textContent).not.toContain(template.title);
    }
    // Templates in the category must appear somewhere on screen.
    for (const template of templatesInCategory) {
      expect(screen.getAllByText(template.title).length).toBeGreaterThan(0);
    }
  });

  it("search input filters templates by title", () => {
    render(createElement(TemplatesScreen));
    const searchInput = screen.getByRole("textbox", { name: /search templates/i });
    fireEvent.change(searchInput, { target: { value: "zzzNothingMatchesThisXyz" } });
    expect(screen.queryByText("No templates match your search.")).toBeTruthy();
    // Clear filter.
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getAllByText(firstTemplate.title).length).toBeGreaterThan(0);
  });

  it("context fields interpolate into the Markdown output (copy path)", async () => {
    render(createElement(TemplatesScreen));
    // Fill in context fields.
    const orgInput = screen.getByPlaceholderText("Organisation name");
    const ownerInput = screen.getByPlaceholderText("Name or role");
    const systemInput = screen.getByPlaceholderText("AI system or programme");
    fireEvent.change(orgInput, { target: { value: "Acme Corp" } });
    fireEvent.change(ownerInput, { target: { value: "Jane Smith" } });
    fireEvent.change(systemInput, { target: { value: "Loan Decisioning v2" } });
    // Click Copy draft.
    const copyButton = screen.getByRole("button", { name: /copy draft/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledOnce());
    const calledWith: string = writeTextMock.mock.calls[0]![0] as string;
    expect(calledWith).toContain("Acme Corp");
    expect(calledWith).toContain("Jane Smith");
    expect(calledWith).toContain("Loan Decisioning v2");
  });

  it("Copy button calls navigator.clipboard.writeText with the rendered Markdown", async () => {
    render(createElement(TemplatesScreen));
    const copyButton = screen.getByRole("button", { name: /copy draft/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledOnce());
    const calledWith: string = writeTextMock.mock.calls[0]![0] as string;
    // Sanity-check the markdown contains the template title.
    expect(calledWith).toContain(firstTemplate.title);
  });

  it("Download button triggers a file download", () => {
    render(createElement(TemplatesScreen));
    const downloadButton = screen.getByRole("button", { name: /download markdown/i });
    fireEvent.click(downloadButton);
    expect(createObjectURLMock).toHaveBeenCalledOnce();
    expect(anchorClickMock).toHaveBeenCalledOnce();
    expect(revokeObjectURLMock).toHaveBeenCalledOnce();
  });
});
