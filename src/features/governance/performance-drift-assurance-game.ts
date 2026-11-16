export type PerformanceDriftAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PERFORMANCE_DRIFT_ASSURANCE_ROUNDS: PerformanceDriftAssuranceRound[] = [
  {
    id: "no-baseline",
    scenario:
      "A model went live six months ago, but no one recorded baseline performance or expected operating conditions, so teams cannot tell if quality has changed.",
    choices: [
      "Establish a documented baseline (metrics, datasets, thresholds) from pre-deployment validation and compare ongoing results against it",
      "Compare only to informal recollections of how it used to behave",
      "Assume performance is stable unless users complain loudly",
    ],
    best: 0,
    assurance: "Baseline and comparable metrics",
    feedback:
      "Drift assurance needs a recorded baseline and comparable metrics; otherwise changes in inputs or quality are invisible until harm is obvious.",
  },
  {
    id: "data-drift-blind",
    scenario:
      "Input patterns have shifted (new customer types, new languages), but monitoring only tracks uptime and error rates.",
    choices: [
      "Monitor input/data distribution shifts and trigger reviews when they exceed agreed thresholds",
      "Track only technical uptime because accuracy is hard to measure",
      "Wait for support tickets to reveal quality problems",
    ],
    best: 0,
    assurance: "Data and input drift signals",
    feedback:
      "Operational drift often starts in inputs: watch distribution and context shifts, then investigate whether outputs, decisions, or harms are affected.",
  },
  {
    id: "no-triggered-review",
    scenario:
      "Performance metrics dip, but no one is assigned to review, decide whether to roll back, retrain, or tighten guardrails, and there is no deadline.",
    choices: [
      "Define drift triggers, owners, review SLAs, and response options (rollback, retrain, constrain scope, or retire) with evidence recorded",
      "Let each team decide informally when something feels wrong",
      "Only review after a regulatory inquiry",
    ],
    best: 0,
    assurance: "Drift response ownership and SLAs",
    feedback:
      "Drift needs a response path: triggers, owners, time-bound review, and agreed actions (rollback, retrain, constrain, retire) documented with evidence.",
  },
  {
    id: "drift-evidence-gap",
    scenario:
      "The team says they checked for drift, but cannot produce trend evidence, review notes, or decisions for auditors or operators.",
    choices: [
      "Keep trend evidence, review notes, decisions, and outcomes in an auditable record tied to the system and release",
      "Rely on memory and calendar invites as proof",
      "Collect data but never store it in a durable record",
    ],
    best: 0,
    assurance: "Auditable drift evidence",
    feedback:
      "Assurance requires durable evidence: trends, reviews, decisions, and outcomes should be traceable to the system so oversight is real, not verbal.",
  },
];

export function performanceDriftAssuranceScore(answers: Record<string, number>) {
  const done = PERFORMANCE_DRIFT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PERFORMANCE_DRIFT_ASSURANCE_ROUNDS.length,
  };
}
