export type EnvImpactRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ENV_IMPACT_ROUNDS: EnvImpactRound[] = [
  {
    id: "invisible-footprint",
    scenario:
      "A generative feature is rolled out to every customer, and nobody can say how much compute it uses or which region it runs in.",
    choices: [
      "Measure energy and compute per workload with a stated method, and record the region and provider",
      "Estimate from the monthly cloud bill and split it evenly across features",
      "Wait for the provider to publish a per-request footprint",
    ],
    best: 0,
    assurance: "Measured footprint",
    feedback:
      "An unmeasured footprint cannot be managed: measure energy and compute per workload with a stated method, and record region and provider.",
  },
  {
    id: "biggest-model-habit",
    scenario:
      "Every feature calls the largest model with a long context, because that is the template the team started from, and no one has tested a smaller model or caching.",
    choices: [
      "Right-size the model and context per task, add caching and batching, and schedule flexible work in lower-carbon windows",
      "Keep the template and buy offsets to cover the footprint",
      "Ask users to use the feature less often",
    ],
    best: 0,
    assurance: "Efficiency by design",
    feedback:
      "Efficiency is cheaper than offsets: right-size model and context, add caching and batching, and schedule flexible work in lower-carbon windows.",
  },
  {
    id: "reporting-gap",
    scenario:
      "The annual sustainability report covers offices and business travel but says nothing about AI compute, even though it is now a material part of the estate.",
    choices: [
      "Include AI compute in sustainability reporting with scope, method and assumptions stated",
      "Leave it out until the measurement is perfect",
      "Report a single headline figure without method or scope",
    ],
    best: 0,
    assurance: "Reported with assumptions",
    feedback:
      "Excluding a material footprint is a reporting gap: include AI compute with scope, method and assumptions stated, even while measurement matures.",
  },
  {
    id: "no-owner",
    scenario:
      "A reduction commitment was announced publicly, but no team owns it and no review date exists.",
    choices: [
      "Assign an owner, set a review cadence, and track reduction against the measured baseline",
      "Leave it with the sustainability team, who do not control the AI systems",
      "Withdraw the commitment until measurement improves",
    ],
    best: 0,
    assurance: "Owned reduction targets",
    feedback:
      "A target without an owner and a review date is a slogan: assign ownership, set a cadence, and track against the measured baseline.",
  },
];

export function envImpactScore(answers: Record<string, number>) {
  const done = ENV_IMPACT_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ENV_IMPACT_ROUNDS.length,
  };
}
