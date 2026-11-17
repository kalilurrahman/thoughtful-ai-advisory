export type RiskAppetiteAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RISK_APPETITE_ASSURANCE_ROUNDS: RiskAppetiteAssuranceRound[] = [
  {
    id: "no-appetite",
    scenario:
      "A new AI use case is approved because nobody has said it is out of bounds, and no one can point to an appetite statement for its risk tier.",
    choices: [
      "Define appetite for the use case and tier, record the decision against it, and set limits before deployment",
      "Approve it and define appetite once the portfolio is larger",
      "Reject it because no appetite exists yet",
    ],
    best: 0,
    assurance: "Appetite before approval",
    feedback:
      "Absence of a boundary is not permission: define appetite for the use case and tier, record the decision against it, and set limits before deployment.",
  },
  {
    id: "breach-ignored",
    scenario:
      "Monitoring shows a system exceeding its tolerance threshold for weeks, but no one acts because the alert is not mapped to an owner or a response.",
    choices: [
      "Route the breach to a named owner with defined responses (reduce, suspend, escalate, or formally accept) and record the outcome",
      "Adjust the threshold upward so the system is compliant again",
      "Wait for the next quarterly review to discuss it",
    ],
    best: 0,
    assurance: "Breach response ownership",
    feedback:
      "A tolerance without a response is decoration: route breaches to a named owner, choose reduce/suspend/escalate/accept, and record the outcome.",
  },
  {
    id: "appetite-stale",
    scenario:
      "The appetite statement was written when the portfolio had two low-risk pilots, and it is still being applied to agentic systems handling customer decisions.",
    choices: [
      "Review appetite against the current portfolio and risk tiers, update it with approval, and communicate the change",
      "Keep the original statement so decisions stay consistent",
      "Apply the new expectations only to future systems",
    ],
    best: 0,
    assurance: "Appetite review against portfolio",
    feedback:
      "Appetite is relative to what you run: review it against the current portfolio and tiers, update it with approval, and communicate the change rather than applying stale limits.",
  },
  {
    id: "silent-acceptance",
    scenario:
      "A team decides to live with a known residual risk, but the acceptance is verbal, unnamed, and unrecorded.",
    choices: [
      "Record the acceptance with the risk, rationale, owner, scope and review date, and surface it to the accountable group",
      "Keep it verbal so it can be revisited informally",
      "Document it as fully mitigated to avoid follow-up questions",
    ],
    best: 0,
    assurance: "Recorded risk acceptance",
    feedback:
      "Acceptance is a decision with an owner: record the risk, rationale, scope and review date, and surface it so the organisation knows what it is carrying.",
  },
];

export function riskAppetiteAssuranceScore(answers: Record<string, number>) {
  const done = RISK_APPETITE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RISK_APPETITE_ASSURANCE_ROUNDS.length,
  };
}
