export type WaterWastewaterOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const WATER_WASTEWATER_OPERATIONS_ROUNDS: WaterWastewaterOperationsRound[] = [
  {
    id: "operator-authority",
    scenario:
      "An AI system recommends a chemical dosing and valve adjustment that could affect water quality. Operators are prompted to accept the change quickly, and overriding it in the control interface is difficult.",
    choices: [
      "Keep operator oversight and authority for safety- and quality-critical actions, with a clear and usable way to review, pause or override AI recommendations",
      "Apply the recommendation automatically because the model is usually accurate",
      "Allow overrides only after a supervisor approves them later in the shift",
    ],
    best: 0,
    assurance: "Operator oversight & authority",
    feedback:
      "Safety- and quality-critical actions need accountable human control: operators must be able to understand, question and override AI-driven changes before harm occurs.",
  },
  {
    id: "sensor-fault-validation",
    scenario:
      "A turbidity sensor drifts and weather conditions shift rapidly, but the AI model was not validated for sensor faults, degraded inputs or these novel operating conditions.",
    choices: [
      "Validate performance under sensor faults, adverse conditions and novel events, and limit reliance when inputs are unreliable",
      "Trust the model output because it has performed well during normal operations",
      "Recalibrate the sensor later and keep using the AI recommendations in the meantime",
    ],
    best: 0,
    assurance: "Validation under degraded conditions",
    feedback:
      "Utility environments are messy: AI must be tested for sensor faults and unusual conditions, and operators need safeguards when inputs cannot be trusted.",
  },
  {
    id: "threshold-escalation",
    scenario:
      "Quality indicators approach and briefly exceed safety thresholds, but alarms are muted, ownership for response is unclear and escalation is delayed.",
    choices: [
      "Monitor quality and safety thresholds with clear alarms, defined ownership and timely escalation when limits are approached or breached",
      "Log the readings for review at the end of the day if no complaints are received",
      "Rely on the AI to correct the issue automatically without notifying operators",
    ],
    best: 0,
    assurance: "Threshold monitoring & escalation",
    feedback:
      "Early warning only helps if people act on it: threshold monitoring needs actionable alarms, clear responsibility and timely escalation.",
  },
  {
    id: "traceability",
    scenario:
      "After a service-quality incident, the team cannot reconstruct which sensor inputs, model version or AI-influenced actions led to the outcome.",
    choices: [
      "Log decisions, actions, inputs and model versions so events can be traced and investigated",
      "Reconstruct the timeline from operator memory and scattered control-room notes",
      "Keep detailed records only for incidents that trigger regulatory reporting",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Traceability supports learning and accountability: recording inputs, model versions and actions makes it possible to investigate incidents and prevent repeats.",
  },
  {
    id: "fallback-notification",
    scenario:
      "A software change causes the AI support system to fail during peak demand, and staff have not rehearsed manual fallback or who must be notified if public health or service is affected.",
    choices: [
      "Control changes, maintain tested fail-safe and manual fallback procedures, and support coordination and required notifications for incidents affecting public health or service",
      "Roll back informally and decide later whether anyone needs to be notified",
      "Wait for the vendor to restore the system before taking broader operational steps",
    ],
    best: 0,
    assurance: "Fail-safe fallback & notification",
    feedback:
      "Safe service depends on preparation: controlled changes, rehearsed manual fallback and clear notification/coordination paths reduce harm when AI systems fail.",
  },
];

export function waterWastewaterOperationsScore(answers: Record<string, number>) {
  const done = WATER_WASTEWATER_OPERATIONS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === WATER_WASTEWATER_OPERATIONS_ROUNDS.length,
  };
}
