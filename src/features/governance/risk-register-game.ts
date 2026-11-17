export type RiskRegisterRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RISK_REGISTER_ROUNDS: RiskRegisterRound[] = [
  {
    id: "vague-entry",
    scenario:
      'The register contains an entry reading "AI risk — high" with no system, scenario, or mechanism, and no one can say what it means.',
    choices: [
      "Rewrite it as a specific risk statement tied to a system and a failure scenario, then reassess it",
      "Leave it because the high rating gets attention in reporting",
      "Delete it to tidy the register",
    ],
    best: 0,
    assurance: "Specific risk statements",
    feedback:
      "A register entry must describe something: rewrite it as a specific risk statement tied to a system and failure scenario, then reassess it.",
  },
  {
    id: "orphan-owner",
    scenario:
      "A high-rated risk has been open for two quarters with no named owner and a treatment plan that says only 'mitigate'.",
    choices: [
      "Assign a named owner, define treatment actions with dates, and report status against them",
      "Keep it open until someone volunteers to own it",
      "Downgrade it so it no longer requires an owner",
    ],
    best: 0,
    assurance: "Owned, dated treatment",
    feedback:
      "Risk without an owner does not move: assign a named owner, define treatment actions with dates, and report status against them.",
  },
  {
    id: "residual-untracked",
    scenario:
      "A treatment was marked complete, but no one recorded what risk remains or tested whether the control actually reduced it.",
    choices: [
      "Record residual risk with supporting evidence, and verify the control reduced exposure before closing the treatment",
      "Close the treatment once the task is done and move on",
      "Reopen the risk at its original rating to be safe",
    ],
    best: 0,
    assurance: "Evidence-backed residual risk",
    feedback:
      "Completing a task is not reducing a risk: record residual risk with evidence and verify the control reduced exposure before closing treatment.",
  },
  {
    id: "duplicate-bloat",
    scenario:
      "The register has grown to hundreds of entries with duplicates, retired systems, and risks nobody recognises, so teams stop using it.",
    choices: [
      "Review the register with owners, merge duplicates, close entries for retired systems, and record the rationale",
      "Keep every entry so nothing is lost from the audit trail",
      "Start a fresh register and abandon the old one",
    ],
    best: 0,
    assurance: "Register hygiene",
    feedback:
      "A bloated register stops being read: review with owners, merge duplicates, close retired-system entries, and record the rationale so the history survives.",
  },
];

export function riskRegisterScore(answers: Record<string, number>) {
  const done = RISK_REGISTER_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RISK_REGISTER_ROUNDS.length,
  };
}
