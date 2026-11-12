import { describe, expect, it } from "vitest";
import { crosswalkScore, FRAMEWORK_CROSSWALK } from "@/features/governance/framework-crosswalk";

describe("AI governance framework crosswalk game", () => {
  it("links learning rounds to authoritative sources", () => {
    expect(FRAMEWORK_CROSSWALK.map((item) => item.id)).toEqual(expect.arrayContaining(["context", "management-system", "literacy", "data-purpose", "measure"]));
    expect(FRAMEWORK_CROSSWALK.every((item) => item.url.startsWith("https://"))).toBe(true);
  });
  it("scores completed answers without counting unanswered rounds", () => {
    expect(crosswalkScore({ context: 0 })).toMatchObject({ attempted: 1, correct: 1, complete: false });
  });
});
