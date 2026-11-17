export type ModelDeprecationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MODEL_DEPRECATION_ROUNDS: ModelDeprecationRound[] = [
  {
    id: "surprise-sunset",
    scenario:
      "A provider announces that the model behind a customer-facing assistant is retired in 60 days, and no one knew the version was pinned anywhere.",
    choices: [
      "Inventory where the version is used, plan the migration, and add sunset tracking so the next notice is not a surprise",
      "Upgrade to the newest model immediately across all systems",
      "Ask the provider to extend the deadline and continue as before",
    ],
    best: 0,
    assurance: "Version and sunset tracking",
    feedback:
      "Retirement notices are predictable only if you track versions: inventory where the version is used, plan migration, and add sunset tracking so the next notice is not a surprise.",
  },
  {
    id: "silent-upgrade",
    scenario:
      "A managed model is updated in place by the provider, and answers start changing without any release note or internal review.",
    choices: [
      "Pin versions where possible, monitor for behaviour change, and re-evaluate before accepting an unpinned upgrade",
      "Accept the upgrade because the provider says quality improved",
      "Add a prompt instruction telling the model to behave as before",
    ],
    best: 0,
    assurance: "Controlled model change",
    feedback:
      "Unpinned models change under you: pin versions where possible, monitor behaviour, and re-evaluate before accepting an upgrade you did not test.",
  },
  {
    id: "no-regression",
    scenario:
      "A migration to a new model is treated as a drop-in swap, and the evaluation suite is not re-run because the API contract is the same.",
    choices: [
      "Re-run the evaluation and regression suites on the new model, compare against the old baseline, and record the result",
      "Swap it and watch user complaints for a week",
      "Run a handful of spot checks in a notebook",
    ],
    best: 0,
    assurance: "Migration regression testing",
    feedback:
      "The same API is not the same behaviour: re-run evaluation and regression suites against the old baseline, and record the result before migrating.",
  },
  {
    id: "unrecorded-reapproval",
    scenario:
      "The migrated system is live and looks fine, but the risk assessment, guardrail settings and approval record still describe the old model.",
    choices: [
      "Update the assessment, guardrails and approval record for the new model, and record who re-approved it",
      "Leave the documents as they are until the next annual review",
      "Add a note that the model changed and close the migration ticket",
    ],
    best: 0,
    assurance: "Re-approval after migration",
    feedback:
      "A migration changes the thing that was approved: update the assessment, guardrails and approval record, and record who re-approved it.",
  },
];

export function modelDeprecationScore(answers: Record<string, number>) {
  const done = MODEL_DEPRECATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MODEL_DEPRECATION_ROUNDS.length,
  };
}
