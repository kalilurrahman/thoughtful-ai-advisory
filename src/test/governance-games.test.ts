import { describe, expect, it } from "vitest";
import { GOVERNANCE_GAME_QUESTIONS, scoreGovernanceRound } from "@/features/governance/governance-games";

describe("governance scenario arcade", () => {
  it("covers major frameworks and privacy mandates with sourced scenarios", () => {
    expect(GOVERNANCE_GAME_QUESTIONS.map((question) => question.id)).toEqual(expect.arrayContaining(["nist-map", "nist-manage", "eu-literacy", "iso-improve", "dpdp-purpose"]));
    expect(GOVERNANCE_GAME_QUESTIONS.every((question) => question.url.startsWith("https://"))).toBe(true);
  });
  it("scores answers without awarding credit for unanswered prompts", () => {
    const question = GOVERNANCE_GAME_QUESTIONS[0]!;
    expect(scoreGovernanceRound({ [question.id]: question.answer })).toMatchObject({ attempted: 1, correct: 1, percent: 100, complete: false });
  });
});
