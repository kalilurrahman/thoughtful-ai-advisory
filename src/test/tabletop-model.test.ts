import { describe, expect, it } from "vitest";
import { INCIDENT_TABLETOP, tabletopResult } from "@/features/governance/tabletop-model";
describe("AI incident tabletop", () => {
  it("keeps unanswered steps out of scoring and scores a completed exercise", () => {
    expect(tabletopResult({ [INCIDENT_TABLETOP[0]!.id]: 0 })).toMatchObject({ answered: 1, bestChoices: 1, finished: false });
    expect(tabletopResult(Object.fromEntries(INCIDENT_TABLETOP.map((step) => [step.id, step.best])))).toMatchObject({ answered: 3, bestChoices: 3, finished: true });
  });
});
