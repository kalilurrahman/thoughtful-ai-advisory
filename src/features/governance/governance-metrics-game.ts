export type GovernanceMetricsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const GOVERNANCE_METRICS_ROUNDS: GovernanceMetricsRound[] = [
  {
    id: "vanity-metric",
    scenario:
      "The AI governance report shows 412 use cases registered and 96% policy attestation, and the board asks whether anything is actually safer.",
    choices: [
      "Add outcome and control-effectiveness metrics with thresholds, and explain what changed because of them",
      "Add more counts so the report looks more complete",
      "Keep the counts and note that effectiveness is hard to measure",
    ],
    best: 0,
    assurance: "Decision-grade metrics",
    feedback:
      "Counts describe activity, not safety: add outcome and control-effectiveness metrics with thresholds, and explain what changed because of them.",
  },
  {
    id: "manual-deck",
    scenario:
      "Governance numbers are assembled by hand each quarter from screenshots, and two teams report different figures for the same system.",
    choices: [
      "Trace each metric to a defined system source with one owner, and reconcile definitions before reporting",
      "Average the two figures so both teams are represented",
      "Report the higher figure so performance looks stronger",
    ],
    best: 0,
    assurance: "Traceable metric sources",
    feedback:
      "Hand-assembled numbers cannot be defended: trace each metric to a defined system source with one owner, and reconcile definitions before reporting.",
  },
  {
    id: "good-news-only",
    scenario:
      "The quarterly pack shows only improving trends; a serious near miss and two failed guardrail tests are left out.",
    choices: [
      "Include failures and near misses with causes and actions, and state what is not yet known",
      "Keep the pack positive and handle failures in a separate operational forum",
      "Remove the failed tests from measurement until they pass",
    ],
    best: 0,
    assurance: "Honest reporting",
    feedback:
      "Selective reporting misleads the people who fund and rely on the programme: include failures and near misses with causes and actions, and state what is not yet known.",
  },
  {
    id: "no-decision",
    scenario:
      "The same three metrics have been reported for six quarters, and no decision, owner or action has changed as a result.",
    choices: [
      "Attach a decision and owner to each reported metric, or retire it and replace it with one that informs a choice",
      "Keep reporting for consistency and trend visibility",
      "Reduce reporting to once a year to save effort",
    ],
    best: 0,
    assurance: "Metrics tied to decisions",
    feedback:
      "A metric that never changes a decision is overhead: attach a decision and owner to it, or retire it in favour of one that informs a choice.",
  },
];

export function governanceMetricsScore(answers: Record<string, number>) {
  const done = GOVERNANCE_METRICS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === GOVERNANCE_METRICS_ROUNDS.length,
  };
}
