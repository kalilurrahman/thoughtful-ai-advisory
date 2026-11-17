export type ProductionTestingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PRODUCTION_TESTING_ROUNDS: ProductionTestingRound[] = [
  {
    id: "big-bang",
    scenario:
      "A new model version is switched on for all users at once because staging tests passed and the release window is today.",
    choices: [
      "Run it in shadow or on a small canary cohort first, compare against the current version, and expand only if criteria hold",
      "Launch to everyone and watch the dashboards closely for the first hour",
      "Launch to everyone but keep the old model loaded in case of complaints",
    ],
    best: 0,
    assurance: "Staged exposure",
    feedback:
      "Passing staging is not evidence about live traffic: run shadow or canary first, compare against the current version, and expand only if criteria hold.",
  },
  {
    id: "no-stop-criteria",
    scenario:
      "A canary is running, and nobody agreed in advance what error rate, latency or complaint level would justify stopping it.",
    choices: [
      "Agree success and stop thresholds with owners before the canary starts, and record the decision at each checkpoint",
      "Decide in the moment based on how the team feels about the numbers",
      "Keep the canary running indefinitely so it never has to be judged",
    ],
    best: 0,
    assurance: "Pre-agreed canary criteria",
    feedback:
      "A canary without stop criteria cannot be judged: agree success and stop thresholds with owners beforehand, and record the decision at each checkpoint.",
  },
  {
    id: "untested-rollback",
    scenario:
      "The rollback plan exists in a runbook, but it has never been executed and the kill switch has never been tested outside a design document.",
    choices: [
      "Rehearse rollback and kill-switch activation in production-like conditions, record timings, and fix what fails",
      "Trust the runbook because it was reviewed by the platform team",
      "Skip the rehearsal to avoid disrupting live traffic",
    ],
    best: 0,
    assurance: "Tested rollback",
    feedback:
      "An untested rollback is a hope: rehearse rollback and kill-switch activation, record timings, and fix what fails before you need them.",
  },
  {
    id: "live-data-exposure",
    scenario:
      "Production testing uses real customer records, and affected customers are neither informed nor excluded from the experiment.",
    choices: [
      "Minimize or mask production test data, exclude or inform affected users as required, and record the safeguard",
      "Use real data because synthetic data does not reflect true behaviour",
      "Test on real data but delete the logs afterwards",
    ],
    best: 0,
    assurance: "Production test safeguards",
    feedback:
      "Live testing is still processing personal data: minimize or mask it, exclude or inform affected users as required, and record the safeguard.",
  },
];

export function productionTestingScore(answers: Record<string, number>) {
  const done = PRODUCTION_TESTING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PRODUCTION_TESTING_ROUNDS.length,
  };
}
