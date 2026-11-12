import { describe, expect, it } from "vitest";
import { vendorChallengeScore, VENDOR_CHALLENGES } from "@/features/governance/vendor-challenge";
describe("AI vendor assurance challenge", () => {
  it("scores only answered supplier due-diligence scenarios", () => {
    expect(vendorChallengeScore({ [VENDOR_CHALLENGES[0]!.id]: 0 })).toMatchObject({
      answered: 1,
      preferred: 1,
      complete: false,
    });
  });
});
