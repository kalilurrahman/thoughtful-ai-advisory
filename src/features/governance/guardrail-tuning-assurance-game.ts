export type GuardrailTuningAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const GUARDRAIL_TUNING_ASSURANCE_ROUNDS: GuardrailTuningAssuranceRound[] = [
  {
    id: "noise-burden",
    scenario:
      "Guardrails block so many legitimate requests that teams work around them, and pressure is rising to switch the noisy checks off entirely.",
    choices: [
      "Measure false positives and false negatives against real traffic, tune thresholds, and route the residual cases to human review",
      "Disable the guardrail that produces the most blocks",
      "Leave it unchanged and absorb the support workload",
    ],
    best: 0,
    assurance: "False-positive tuning",
    feedback:
      "A guardrail nobody can use gets bypassed: tune against real traffic, keep detection of genuine risk, and give reviewers a proportionate path for the borderline cases.",
  },
  {
    id: "silent-threshold",
    scenario:
      "An engineer raises a content-filter threshold after a complaint, with no record of why, what it was before, or how it was tested.",
    choices: [
      "Change thresholds through review with before/after test results recorded as evidence",
      "Tune by feel whenever complaints arrive",
      "Freeze thresholds permanently so nothing can ever change",
    ],
    best: 0,
    assurance: "Reviewed tuning changes",
    feedback:
      "Tuning is a control change: record the reason, the before/after behaviour, and the test evidence, so the effect of each change is knowable later.",
  },
  {
    id: "no-effectiveness-data",
    scenario:
      "Guardrails are enabled and configured, but no one can say how often they catch real issues or how often they miss them.",
    choices: [
      "Measure effectiveness with test suites and red-team cases, and review the results on a cadence",
      "Assume the guardrails work because they are enabled",
      "Count configured controls as proof of protection",
    ],
    best: 0,
    assurance: "Measured effectiveness",
    feedback:
      "Enabled is not effective: measure catch and miss rates against test and red-team cases, and review them on cadence so tuning decisions rest on evidence.",
  },
  {
    id: "override-exceptions",
    scenario:
      "Operators override blocks dozens of times a week to finish urgent work, and nobody reviews what was let through or why.",
    choices: [
      "Record overrides and exceptions, review them for patterns, and feed the findings back into guardrail tuning",
      "Allow unlimited overrides to keep work moving",
      "Remove the override option so nothing can pass",
    ],
    best: 0,
    assurance: "Override & exception review",
    feedback:
      "Overrides are signals: recording and reviewing them shows where guardrails are too strict or too weak, and turns day-to-day exceptions into tuning evidence.",
  },
];

export function guardrailTuningAssuranceScore(answers: Record<string, number>) {
  const done = GUARDRAIL_TUNING_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === GUARDRAIL_TUNING_ASSURANCE_ROUNDS.length,
  };
}
