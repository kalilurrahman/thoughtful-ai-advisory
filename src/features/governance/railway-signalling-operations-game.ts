export type RailwaySignallingOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RAILWAY_SIGNALLING_OPERATIONS_ROUNDS: RailwaySignallingOperationsRound[] = [
  {
    id: "human-authority",
    scenario:
      "An AI traffic-management tool recommends rerouting trains during disruption. Controllers feel pressure to accept it quickly, and the interface blurs whether the recommendation is advisory or can directly affect safety-critical movements.",
    choices: [
      "Keep human authority and override clear for safety-critical decisions, with explicit advisory-versus-control boundaries",
      "Allow the tool to apply changes automatically because it optimises flow faster than people can",
      "Treat every recommendation as advisory in policy but make rejection slow and difficult in practice",
    ],
    best: 0,
    assurance: "Human authority & control boundaries",
    feedback:
      "Safety-critical railway decisions need clear human accountability: advisory tools must not quietly take control, and controllers must be able to override quickly.",
  },
  {
    id: "degraded-validation",
    scenario:
      "The system was tested on routine timetables, but it has not been validated for signal faults, degraded sensors, severe weather or unusual traffic patterns.",
    choices: [
      "Validate performance in degraded conditions, edge cases and novel scenarios including sensor or signal faults before relying on it operationally",
      "Deploy now and monitor outcomes during normal service, expanding only if no incidents occur",
      "Rely on vendor simulations as sufficient proof for live operations",
    ],
    best: 0,
    assurance: "Validation in degraded conditions",
    feedback:
      "Railway operations face faults and rare conditions: validation must cover degraded signals, sensor issues and novel scenarios, not just routine service.",
  },
  {
    id: "traceability",
    scenario:
      "After an operational incident, investigators cannot determine what the AI recommended, which inputs it used or which model version was active.",
    choices: [
      "Log decisions, recommendations, inputs and model versions so events can be traced and investigated",
      "Reconstruct the incident from controller recollections and general system logs",
      "Keep detailed logs only when an incident is already suspected",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Incident learning depends on evidence: traceable records of recommendations, inputs and model versions let teams understand what happened and prevent recurrence.",
  },
  {
    id: "baseline-change-control",
    scenario:
      "A model update and configuration change are pushed to improve punctuality, but they are not reviewed against approved or certified operational and signalling baselines and lack a tested rollback path.",
    choices: [
      "Control changes, review them against approved or certified operational and signalling baselines, and keep a tested rollback path",
      "Roll out broadly because short trials showed punctuality gains",
      "Document the change after deployment if no immediate issues are reported",
    ],
    best: 0,
    assurance: "Change control & baseline separation",
    feedback:
      "Safety-relevant systems need disciplined change: updates must be reviewed against approved baselines and remain reversible if behaviour is not as expected.",
  },
  {
    id: "fallback-coordination",
    scenario:
      "The AI support system fails during a disruption, staff have not recently practised manual procedures, and coordination and required notifications are unclear.",
    choices: [
      "Maintain and rehearse degraded modes, manual procedures, coordination and required notifications so safe operations continue if AI fails or affects incidents",
      "Assume the system will recover quickly and handle issues informally until then",
      "Depend on a small group of specialists to improvise manual control without a practised plan",
    ],
    best: 0,
    assurance: "Manual fallback & coordination",
    feedback:
      "Fallback must be practised, not assumed: rehearsed manual procedures and clear coordination/notification paths keep operations safe when AI support is unavailable.",
  },
];

export function railwaySignallingOperationsScore(answers: Record<string, number>) {
  const done = RAILWAY_SIGNALLING_OPERATIONS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RAILWAY_SIGNALLING_OPERATIONS_ROUNDS.length,
  };
}
