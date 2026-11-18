export type InsuranceAiRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INSURANCE_AI_ROUNDS: InsuranceAiRound[] = [
  {
    id: "proxy-lifestyle",
    scenario:
      "The pricing model uses shopping and lifestyle data that turns out to correlate closely with ethnicity in several postcodes.",
    choices: [
      "Test for proxies and remove or justify the factor before it is used in pricing",
      "Keep the factor but stop reporting outcomes by ethnicity",
      "Keep the factor and add a fairness adjustment to the final premium",
    ],
    best: 0,
    assurance: "Proxy discrimination",
    feedback:
      "A factor can be discriminatory even when it never names a protected characteristic: test for proxies and remove or justify the factor.",
  },
  {
    id: "auto-decline",
    scenario:
      "Low-value claims are declined automatically by a triage model overnight, and no handler sees them before the customer is told.",
    choices: [
      "Require human review before an automated decline reaches the customer",
      "Review a sample of declines the following week",
      "Let the customer request a review after the decline is issued",
    ],
    best: 0,
    assurance: "Human review",
    feedback:
      "An adverse automated decision should be reviewed by a person before it reaches the customer, not sampled afterwards.",
  },
  {
    id: "model-score-letter",
    scenario:
      "A decline letter tells the customer their claim did not meet the model score and offers no further explanation.",
    choices: [
      "Explain the specific reasons for the decline and how to have it reviewed",
      "Add a link to the policy wording and the complaints page",
      "Explain that the decision was automated and that this is permitted",
    ],
    best: 0,
    assurance: "Reasons & review",
    feedback:
      "A customer needs the specific reasons for a decline and a real route to review, not a restatement of the policy.",
  },
  {
    id: "unjustified-factor",
    scenario:
      "An actuary cannot explain why a new rating factor is used beyond saying it improves predictive accuracy.",
    choices: [
      "Require actuarial justification and documentation before the factor is used",
      "Keep the factor while a justification is prepared for the next review",
      "Keep the factor and disclose its use in the policy summary",
    ],
    best: 0,
    assurance: "Actuarial justification",
    feedback:
      "Predictive accuracy is not a justification on its own: rating factors need actuarial support and documentation before use.",
  },
  {
    id: "complaints-noise",
    scenario:
      "Complaints about claim delays cluster in a few postcodes, and the pattern is dismissed as customers who complain more.",
    choices: [
      "Analyse complaints and outcomes by group, and investigate the cluster",
      "Add the postcodes to a list for extra quality checks on handling",
      "Wait for the next regulatory data return to see whether it persists",
    ],
    best: 0,
    assurance: "Outcome monitoring",
    feedback:
      "A cluster is a signal: analyse complaints and outcomes by group and investigate rather than explaining the pattern away.",
  },
];

export function insuranceAiScore(answers: Record<string, number>) {
  const done = INSURANCE_AI_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INSURANCE_AI_ROUNDS.length,
  };
}
