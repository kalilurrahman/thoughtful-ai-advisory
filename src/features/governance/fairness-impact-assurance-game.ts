export type FairnessImpactAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const FAIRNESS_IMPACT_ASSURANCE_ROUNDS: FairnessImpactAssuranceRound[] = [
  {
    id: "impact-assessment",
    scenario:
      "Before deploying an AI system that affects access to opportunities or services, the team has not assessed potential harms or impacts on different groups.",
    choices: [
      "Conduct an impact/harms assessment for affected groups and contexts, identify risks, and define mitigations and review points",
      "Proceed without assessment because the system is efficient",
      "Assess only technical performance and ignore people or group impacts",
    ],
    best: 0,
    assurance: "Impact and harms assessment",
    feedback:
      "Fairness and impact assurance starts with understanding who may be affected, plausible harms, and context-specific risks, then planning mitigations and reviews.",
  },
  {
    id: "bias-testing",
    scenario:
      "Evaluation uses a narrow dataset and aggregate metrics, so performance differences across groups or relevant contexts are unknown.",
    choices: [
      "Test with representative scenarios/data where appropriate, examine subgroup/context performance and error patterns, and document limitations",
      "Rely on a single overall accuracy score for all users",
      "Assume fairness if no complaints have been received yet",
    ],
    best: 0,
    assurance: "Representative evaluation and bias checks",
    feedback:
      "Assurance requires evaluation that can reveal disparate performance or error patterns across relevant groups/contexts, with documented limitations and follow-up.",
  },
  {
    id: "mitigation-guardrails",
    scenario:
      "Testing indicates some groups may receive poorer or harmful outcomes, but there are no mitigations, guardrails, or conditions for use.",
    choices: [
      "Apply mitigations and guardrails (design/data/process/oversight), set conditions of use, and re-evaluate before and after changes",
      "Ship as-is and treat disparate outcomes as acceptable edge cases",
      "Hide the issue to avoid delaying release",
    ],
    best: 0,
    assurance: "Mitigation and guardrails",
    feedback:
      "When risks or disparities are identified, assurance means acting: mitigate, add guardrails/conditions and oversight, and verify effectiveness rather than ignoring issues.",
  },
  {
    id: "recourse-review",
    scenario:
      "People affected by AI-assisted outcomes do not know how to question results, seek review, or report harm, and equity issues are not tracked as evidence.",
    choices: [
      "Provide clear recourse/review channels, track and investigate equity-related issues, and document corrective actions and learning",
      "Offer no recourse because decisions are automated",
      "Handle concerns informally with no records or follow-up",
    ],
    best: 0,
    assurance: "Recourse, monitoring, and corrective review",
    feedback:
      "Impact assurance includes accessible recourse and review, monitored equity-related signals, and evidence-backed investigation and corrective action over time.",
  },
];

export function fairnessImpactAssuranceScore(answers: Record<string, number>) {
  const done = FAIRNESS_IMPACT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === FAIRNESS_IMPACT_ASSURANCE_ROUNDS.length,
  };
}
