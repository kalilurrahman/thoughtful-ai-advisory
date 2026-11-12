import { describe, expect, it } from "vitest";
import { CHANGE_IMPACT_ROUNDS, scoreChangeImpact } from "@/features/governance/change-impact-game";
describe("change impact game", () => {
  it("rewards complete change-area identification and returns feedback", () => {
    const round = CHANGE_IMPACT_ROUNDS[0]!;
    expect(scoreChangeImpact(round.id, [...round.expected])).toMatchObject({ correct: true });
    expect(scoreChangeImpact(round.id, [])).toMatchObject({
      correct: false,
      feedback: expect.any(String),
    });
  });
});
