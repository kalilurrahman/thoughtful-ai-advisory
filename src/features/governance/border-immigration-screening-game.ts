export type BorderImmigrationScreeningRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const BORDER_IMMIGRATION_SCREENING_ROUNDS: BorderImmigrationScreeningRound[] = [
  {
    id: "human-review",
    scenario:
      "An AI system flags a traveller for additional checks that could delay or block their journey. Frontline staff are encouraged to treat the flag as definitive and rarely override it.",
    choices: [
      "Require qualified human review and a clear override path for high-impact screening decisions before action is taken",
      "Accept the flag as final because the model is designed for security screening",
      "Allow overrides only when a traveller files a formal complaint after the decision",
    ],
    best: 0,
    assurance: "Human review & override",
    feedback:
      "High-impact screening decisions need accountable human judgement: qualified reviewers must be able to assess context and override AI flags before they cause harm.",
  },
  {
    id: "fairness",
    scenario:
      "Outcome reviews show that travellers from certain nationalities and language groups are flagged or referred at much higher rates, but the team has not tested for bias or disproportionate impact.",
    choices: [
      "Test screening outcomes for fairness, bias and disproportionate impact, then investigate and address unjustified disparities",
      "Treat the differences as expected because risk profiles vary across groups",
      "Adjust thresholds informally without measuring impacts across groups",
    ],
    best: 0,
    assurance: "Fairness & disproportionate impact",
    feedback:
      "Screening systems must be checked for unjustified disparities: fairness testing helps identify bias and disproportionate impacts that require correction.",
  },
  {
    id: "false-matches",
    scenario:
      "A matching model performs well on common cases but has not been validated for edge cases, poor-quality images or similar names, leading to avoidable false matches.",
    choices: [
      "Validate accuracy and error rates, including edge cases and false matches, and set safeguards for uncertain results",
      "Rely on average accuracy scores reported by the vendor",
      "Resolve false matches only when the affected person can prove an error on the spot",
    ],
    best: 0,
    assurance: "Accuracy & false-match validation",
    feedback:
      "Average performance can hide harmful errors: validate edge cases and false-match rates, and ensure uncertain results trigger safeguards rather than automatic adverse action.",
  },
  {
    id: "contestability-data",
    scenario:
      "A person is given no meaningful explanation of why they were flagged and no clear way to challenge the decision, while their sensitive biometric data is retained longer than needed without clear controls.",
    choices: [
      "Provide clear routes to explanation, contestability and recourse where appropriate, and handle sensitive personal and biometric data with minimisation, protection and retention controls",
      "Keep explanations minimal and retain data broadly in case it is useful later",
      "Offer a review only after the data retention period has ended",
    ],
    best: 0,
    assurance: "Contestability & data protection",
    feedback:
      "People need a fair way to understand and challenge high-impact decisions, and sensitive biometric data must be minimised, protected and retained only as necessary.",
  },
  {
    id: "audit-fallback",
    scenario:
      "The screening system becomes unavailable and staff cannot see which model version or inputs led to recent flags, leaving no clear audit trail or manual fallback process.",
    choices: [
      "Log decisions and model versions for auditability and maintain a workable manual fallback for screening operations",
      "Pause screening decisions until the system is restored, without documenting recent cases",
      "Rebuild records later from whatever notes and screenshots staff can find",
    ],
    best: 0,
    assurance: "Auditability & manual fallback",
    feedback:
      "Audit trails and fallback procedures are essential: teams must be able to trace decisions and continue operations safely when AI systems are unavailable.",
  },
];

export function borderImmigrationScreeningScore(answers: Record<string, number>) {
  const done = BORDER_IMMIGRATION_SCREENING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === BORDER_IMMIGRATION_SCREENING_ROUNDS.length,
  };
}
