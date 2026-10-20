import { describe, expect, it } from "vitest";
import { governanceDecisionSchema } from "@/features/governance/decision-schema";

const baseDecision = {
  id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
  system: "Clinical summarizer",
  outcome: "Approved",
  decidedAt: "2026-10-20",
  reviewBy: null,
  approver: "AI Oversight Committee",
  rationale: "Reviewed against approved use and controls.",
  conditions: "",
};

describe("governance decision validation", () => {
  it("accepts a complete unconditional approval and supplies history defaults", () => {
    expect(governanceDecisionSchema.parse(baseDecision)).toMatchObject({
      lifecycle: "Current",
      history: [],
    });
  });

  it.each(["Risk accepted", "Conditional approval"] as const)(
    "requires a review date for %s",
    (outcome) => {
      const parsed = governanceDecisionSchema.safeParse({ ...baseDecision, outcome });
      expect(parsed.success).toBe(false);
      if (!parsed.success) expect(parsed.error.issues[0]?.path).toContain("reviewBy");
    },
  );

  it("rejects review dates earlier than the decision date", () => {
    const parsed = governanceDecisionSchema.safeParse({
      ...baseDecision,
      reviewBy: "2026-10-19",
    });
    expect(parsed.success).toBe(false);
  });
});
