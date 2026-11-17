export type ModelSelectionRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MODEL_SELECTION_ROUNDS: ModelSelectionRound[] = [
  {
    id: "biggest-model",
    scenario:
      "A team picks the largest, newest model available for a classification task, because it tops a public leaderboard.",
    choices: [
      "Define the quality bar the task needs, then test the smallest candidates that could clear it on your own data",
      "Use the largest model now and downsize later if costs become a problem",
      "Pick the second-largest model to hedge against cost and quality",
    ],
    best: 0,
    assurance: "Requirements before selection",
    feedback:
      "A leaderboard is not your task: set the quality bar first, then test the smallest candidates that could clear it on your own data.",
  },
  {
    id: "vendor-benchmarks",
    scenario:
      "The selection paper cites vendor benchmark scores for three providers, with no evaluation on the documents or languages the system will actually handle.",
    choices: [
      "Evaluate each candidate on your own representative data, with the same prompts and scoring, and record the results",
      "Combine the vendor scores into a weighted average and pick the winner",
      "Ask each vendor for a custom benchmark and trust the highest",
    ],
    best: 0,
    assurance: "Own-data evaluation",
    feedback:
      "Vendor benchmarks measure vendor datasets: evaluate candidates on your own representative data with the same prompts and scoring.",
  },
  {
    id: "no-tradeoffs",
    scenario:
      "The chosen model is ten times more expensive and slower than a smaller one that scored almost identically, and no one recorded why the larger model won.",
    choices: [
      "Record the cost, latency, quality and risk trade-offs behind the choice, and revisit them as usage grows",
      "Keep the larger model to avoid re-opening the decision",
      "Switch to the smaller model quietly to save money",
    ],
    best: 0,
    assurance: "Recorded trade-offs",
    feedback:
      "A choice without recorded trade-offs cannot be revisited: write down cost, latency, quality and risk, and revisit them as usage grows.",
  },
  {
    id: "hard-lock-in",
    scenario:
      "The system is built directly against one provider's proprietary features, and no one has tested whether the prompts and evaluations would work on another provider.",
    choices: [
      "Keep a provider-agnostic interface where practical and test a switch path before lock-in becomes expensive",
      "Accept lock-in because the provider is unlikely to change terms",
      "Rewrite the system on a second provider in parallel as insurance",
    ],
    best: 0,
    assurance: "Credible exit path",
    feedback:
      "Lock-in is a risk decision, not a default: keep a provider-agnostic interface where practical and test the switch path before it is expensive.",
  },
];

export function modelSelectionScore(answers: Record<string, number>) {
  const done = MODEL_SELECTION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MODEL_SELECTION_ROUNDS.length,
  };
}
