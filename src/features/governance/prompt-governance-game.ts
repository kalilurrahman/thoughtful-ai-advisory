export type PromptGovernanceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PROMPT_GOVERNANCE_ROUNDS: PromptGovernanceRound[] = [
  {
    id: "edited-in-console",
    scenario:
      "At 2am an engineer edits the live system prompt directly in the vendor console to fix a complaint, and nobody can say what the prompt said before.",
    choices: [
      "Version prompts with a diffable history and change them through the same path as code, including hotfixes",
      "Screenshot the new prompt into the incident ticket for the record",
      "Trust the engineer to describe the change in the morning handover",
    ],
    best: 0,
    assurance: "Versioned instructions",
    feedback:
      "A prompt edited in place has no history: version it, diff it, and change it through the same path as code, hotfixes included.",
  },
  {
    id: "just-wording",
    scenario:
      "A prompt change is merged without review because it only adjusts wording and the reviewer queue is three days long.",
    choices: [
      "Require an owner and a review for instruction changes, with an expedited path that still records who approved it",
      "Allow unreviewed wording changes because tone is not a control",
      "Freeze all prompt changes until the queue clears",
    ],
    best: 0,
    assurance: "Reviewed changes",
    feedback:
      "Wording is behaviour: require an owner and a recorded approval, with an expedited path rather than no path.",
  },
  {
    id: "regression-never-grows",
    scenario:
      "The regression set for prompts was written at launch and has not changed, even though four incidents have since traced back to prompt wording.",
    choices: [
      "Add every incident's failing case to the regression set so the same behaviour cannot return unnoticed",
      "Rely on the launch tests because they cover the core behaviour",
      "Ask the model provider to run its own regression suite instead",
    ],
    best: 0,
    assurance: "Regression from incidents",
    feedback:
      "A frozen test set stops learning: add each incident's failing case so the same behaviour cannot return unnoticed.",
  },
  {
    id: "no-rollback",
    scenario:
      "A new instruction set is rolled out to all users at once, and it starts producing refusals on a core task with no way back.",
    choices: [
      "Release through a controlled path with a tested rollback, so a bad instruction set can be withdrawn quickly",
      "Write a follow-up prompt patch to loosen the refusals",
      "Wait for the next scheduled release to correct it",
    ],
    best: 0,
    assurance: "Reversible release",
    feedback:
      "An instruction set you cannot withdraw is a one-way change: release with a tested rollback.",
  },
  {
    id: "silent-drift",
    scenario:
      "The prompt has not changed for months, but answers have slowly become shorter and more generic after a provider update.",
    choices: [
      "Monitor behaviour after release so drift is detected against a baseline rather than noticed by users",
      "Re-read the prompt to confirm it is unchanged and close the report",
      "Increase the temperature setting to make answers feel richer",
    ],
    best: 0,
    assurance: "Post-release monitoring",
    feedback:
      "Behaviour can drift without a prompt change: monitor outputs against a baseline so a provider update is detected, not discovered.",
  },
];

export function promptGovernanceScore(answers: Record<string, number>) {
  const done = PROMPT_GOVERNANCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PROMPT_GOVERNANCE_ROUNDS.length,
  };
}
