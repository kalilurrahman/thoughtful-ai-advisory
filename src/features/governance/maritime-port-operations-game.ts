export type MaritimePortOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MARITIME_PORT_OPERATIONS_ROUNDS: MaritimePortOperationsRound[] = [
  {
    id: "human-override",
    scenario:
      "An AI system recommends a berth assignment and flags a vessel for secondary screening during a busy arrival window. Operators feel pressure to accept the recommendations quickly, and overriding them requires several extra steps.",
    choices: [
      "Keep human oversight and an easy override for safety- and security-critical actions, with time and authority to review recommendations",
      "Accept the recommendations by default to keep the queue moving",
      "Require staff to document a full justification before they can override any AI recommendation",
    ],
    best: 0,
    assurance: "Human oversight & override",
    feedback:
      "Safety- and security-critical actions need accountable human control: operators must be able to review, question and override AI recommendations without unsafe friction.",
  },
  {
    id: "adverse-conditions",
    scenario:
      "The model was tuned on clear-weather traffic patterns, but it has not been validated in heavy fog, rough seas, sensor dropouts or unusual port congestion.",
    choices: [
      "Validate performance in adverse conditions, degraded inputs and novel scenarios before relying on it operationally",
      "Deploy it for routine conditions and expand use later if no incidents occur",
      "Treat vendor test results from different ports as sufficient evidence",
    ],
    best: 0,
    assurance: "Validation in adverse conditions",
    feedback:
      "Maritime and port environments change quickly: test AI behaviour under adverse and degraded conditions so failures are found before they affect live operations.",
  },
  {
    id: "traceability",
    scenario:
      "After a near-miss in the channel, teams cannot determine which AI recommendation was shown, what data it used or which model version produced it.",
    choices: [
      "Log recommendations, decisions, inputs and model versions so events can be traced and investigated",
      "Reconstruct the event from radio calls and operator memory after the fact",
      "Keep logs only for actions that resulted in a confirmed incident",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Near-misses are learning opportunities: traceable records of recommendations, inputs and model versions let teams understand what happened and prevent recurrence.",
  },
  {
    id: "fairness",
    scenario:
      "Screening and scheduling outputs consistently delay vessels or cargo linked to certain operators and routes, but the team has not checked whether the patterns are fair or justified.",
    choices: [
      "Test screening, prioritisation and scheduling for fairness and non-discrimination where they affect access or treatment",
      "Keep the rules because they optimise throughput and security scores overall",
      "Review only cases where an operator files a formal complaint",
    ],
    best: 0,
    assurance: "Fairness & non-discrimination",
    feedback:
      "Operational efficiency does not guarantee fair treatment: check screening and scheduling impacts for unjustified or discriminatory patterns, especially where access is affected.",
  },
  {
    id: "manual-fallback",
    scenario:
      "A system outage removes AI support during peak port traffic, and staff have not recently practised manual coordination, notification and degraded-mode procedures.",
    choices: [
      "Maintain and rehearse manual procedures, coordination and incident notification so safe operations continue if AI fails",
      "Wait for the system to recover while limiting operations informally",
      "Rely on a single on-call specialist to direct all manual handling",
    ],
    best: 0,
    assurance: "Manual fallback & coordination",
    feedback:
      "Safe operations depend on prepared people and processes: rehearse degraded modes, coordination and notification so an AI outage does not create uncontrolled risk.",
  },
];

export function maritimePortOperationsScore(answers: Record<string, number>) {
  const done = MARITIME_PORT_OPERATIONS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MARITIME_PORT_OPERATIONS_ROUNDS.length,
  };
}
