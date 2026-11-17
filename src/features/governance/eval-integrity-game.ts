export type EvalIntegrityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EVAL_INTEGRITY_ROUNDS: EvalIntegrityRound[] = [
  {
    id: "contaminated-holdout",
    scenario:
      "An evaluation set was assembled from the same source as the training corpus, and scores improved sharply after the latest training run.",
    choices: [
      "Check for overlap and contamination, rebuild or quarantine the affected cases, and re-run the evaluation on a clean holdout",
      "Report the improved scores because the evaluation set was fixed before training",
      "Remove the highest-scoring cases to make the result look more realistic",
    ],
    best: 0,
    assurance: "Holdout integrity",
    feedback:
      "Scores are only meaningful if the yardstick is clean: check for overlap, rebuild or quarantine contaminated cases, and re-run on a clean holdout.",
  },
  {
    id: "cherry-picked",
    scenario:
      "Results are shared with leadership using the best-performing subset of prompts, while the failures are kept in a separate internal file.",
    choices: [
      "Report the full result set with failures and limitations, and note any subset analysis as such",
      "Keep reporting the best subset because leadership prefers a clear message",
      "Stop measuring the failing cases to avoid confusion",
    ],
    best: 0,
    assurance: "Complete and honest reporting",
    feedback:
      "Selective reporting is a misstatement: share the full result set with failures and limitations, and label subset analysis so readers know what they are seeing.",
  },
  {
    id: "stale-benchmark",
    scenario:
      "A benchmark chosen two years ago is still the headline measure, although the product now handles tasks and languages the benchmark never covered.",
    choices: [
      "Refresh the evaluation to reflect current tasks and languages, keep the old benchmark for trend only, and record the change",
      "Keep the old benchmark so results stay comparable",
      "Switch to a new benchmark without noting the discontinuity",
    ],
    best: 0,
    assurance: "Evaluation relevance",
    feedback:
      "Benchmarks age: refresh evaluation to match current tasks and languages, keep legacy measures for trend only, and record the change so comparisons stay honest.",
  },
  {
    id: "no-signoff",
    scenario:
      "A model was retrained and evaluation numbers were regenerated, but no one confirmed the run used the approved eval set or that thresholds still pass.",
    choices: [
      "Require sign-off on the eval set version and threshold results before the model is released",
      "Trust the automated pipeline because it ran without errors",
      "Release and check the numbers in the next reporting cycle",
    ],
    best: 0,
    assurance: "Evaluation sign-off",
    feedback:
      "Automation is not assurance: confirm the eval set version and threshold results with sign-off before release so numbers cannot drift unexamined.",
  },
];

export function evalIntegrityScore(answers: Record<string, number>) {
  const done = EVAL_INTEGRITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EVAL_INTEGRITY_ROUNDS.length,
  };
}
