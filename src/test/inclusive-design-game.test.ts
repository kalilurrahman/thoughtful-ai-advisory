import { describe, expect, it } from "vitest";
import {
  INCLUSIVE_DESIGN_ROUNDS,
  inclusiveDesignScore,
} from "@/features/governance/inclusive-design-game";
describe("inclusive AI design game", () => {
  it("tracks answered decisions and supports a complete round", () => {
    expect(inclusiveDesignScore({ [INCLUSIVE_DESIGN_ROUNDS[0]!.id]: 0 })).toMatchObject({
      attempted: 1,
      sound: 1,
      complete: false,
    });
    expect(
      inclusiveDesignScore(
        Object.fromEntries(INCLUSIVE_DESIGN_ROUNDS.map((round) => [round.id, round.best])),
      ).complete,
    ).toBe(true);
  });
});
