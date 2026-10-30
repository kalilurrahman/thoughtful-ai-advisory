import { describe, expect, it } from "vitest";
import { PLAYBOOK_CHAPTERS } from "@/data/playbook";

// Stub: full UI tests for PlaybookScreen require a rendering harness that wraps
// the TanStack Router location hook. Wire up once a router test helper is added
// (TODO: stub-playbook-ui). The data-layer checks below run immediately.

describe("playbook data", () => {
  it("has at least one chapter", () => {
    expect(PLAYBOOK_CHAPTERS.length).toBeGreaterThan(0);
  });

  it("every chapter has a unique id, a non-empty title, part, and standfirst", () => {
    const ids = new Set<string>();
    for (const chapter of PLAYBOOK_CHAPTERS) {
      expect(ids.has(chapter.id), `duplicate id: ${chapter.id}`).toBe(false);
      ids.add(chapter.id);
      expect(chapter.title.trim().length).toBeGreaterThan(0);
      expect(chapter.part.trim().length).toBeGreaterThan(0);
      expect(chapter.standfirst.trim().length).toBeGreaterThan(0);
    }
  });

  it("every chapter has at least one outcome and one section with a non-empty heading", () => {
    for (const chapter of PLAYBOOK_CHAPTERS) {
      expect(chapter.outcomes.length, `no outcomes in ${chapter.id}`).toBeGreaterThan(0);
      expect(chapter.sections.length, `no sections in ${chapter.id}`).toBeGreaterThan(0);
      for (const section of chapter.sections) {
        expect(
          section.heading.trim().length,
          `empty section heading in ${chapter.id}`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

// TODO (stub-playbook-ui): render PlaybookScreen with a mock router, verify:
//   - part filter shows only matching chapters
//   - search input filters by title/standfirst
//   - "Mark complete" persists chapter id in localStorage under progressKey
//   - chapter notes persist across re-renders via localStorage
//   - deep-link hash scrolls to the matching chapter id
