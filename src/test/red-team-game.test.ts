import { describe, expect, it } from "vitest";
import { RED_TEAM_ROUNDS, redTeamScore } from "@/features/governance/red-team-game";
describe("AI security defender game", () => {
  it("scores only answered defensive scenarios", () => {
    expect(redTeamScore({ [RED_TEAM_ROUNDS[0]!.id]: 0 })).toMatchObject({
      attempted: 1,
      defended: 1,
      complete: false,
    });
  });
});
