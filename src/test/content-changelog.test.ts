import { describe, expect, it } from "vitest";
import {
  contentUpdatedAt,
  formatContentDate,
  recentContentChanges,
} from "@/features/governance/content-changelog-model";

const CHANGES = [
  { id: "older", date: "2026-10-23", title: "Earlier update", summary: "Earlier content" },
  { id: "newer", date: "2026-10-27", title: "Latest update", summary: "Latest content" },
];

describe("public content change log", () => {
  it("uses the latest recorded content date, not the page visit date", () => {
    expect(contentUpdatedAt(CHANGES)).toBe("2026-10-27");
  });

  it("returns recent changes newest first without changing the source", () => {
    expect(recentContentChanges(CHANGES).map((change) => change.id)).toEqual(["newer", "older"]);
    expect(recentContentChanges(CHANGES, 1).map((change) => change.id)).toEqual(["newer"]);
    expect(CHANGES[0]?.id).toBe("older");
  });

  it("does not invent an update date when there is no history", () => {
    expect(contentUpdatedAt([])).toBeNull();
  });

  it("formats recorded dates in DD/MM/YYYY for India", () => {
    expect(formatContentDate("2026-10-27")).toBe("27/10/2026");
  });
});
