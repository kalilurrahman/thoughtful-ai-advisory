import { describe, expect, it } from "vitest";
import {
  EVIDENCE_DETECTIVE_ROUNDS,
  evidenceDetectiveScore,
} from "@/features/governance/evidence-detective";
describe("evidence detective game", () => {
  it("scores only completed evidence assessments", () => {
    const first = EVIDENCE_DETECTIVE_ROUNDS[0]!;
    expect(evidenceDetectiveScore({ [first.id]: first.best })).toMatchObject({
      answered: 1,
      correct: 1,
      complete: false,
    });
  });
});
