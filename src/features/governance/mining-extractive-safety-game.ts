export type MiningExtractiveSafetyRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MINING_EXTRACTIVE_SAFETY_ROUNDS: MiningExtractiveSafetyRound[] = [
  {
    id: "alert-override",
    scenario:
      "An AI monitoring system flags rising gas levels and recommends evacuating a section, but the alert can be dismissed with one click and supervisors are encouraged to keep production moving unless alarms are unmistakable.",
    choices: [
      "Keep human authority and override accountable for safety-critical alerts and actions, with clear procedures to stop work and protect people when risk is indicated",
      "Treat the alert as low priority because the model has produced false positives before",
      "Require multiple automated confirmations before anyone is allowed to act on the alert",
    ],
    best: 0,
    assurance: "Human authority & safety-critical action",
    feedback:
      "Safety-critical alerts need clear authority to act: people must be able to pause or stop work based on credible risk signals, with accountable review rather than pressure to dismiss them.",
  },
  {
    id: "harsh-conditions",
    scenario:
      "The model was trained in controlled conditions, but dust, vibration, heat and intermittent sensor faults in the field cause it to miss hazards and generate unreliable readings.",
    choices: [
      "Validate performance in harsh environments, edge conditions and sensor faults, and limit reliance when inputs are degraded",
      "Assume the model will adapt over time as it sees more field data",
      "Use the outputs as-is and investigate only after an incident occurs",
    ],
    best: 0,
    assurance: "Validation in harsh conditions",
    feedback:
      "Mining environments stress sensors and models: validation must cover harsh and degraded conditions so unreliable outputs do not create a false sense of safety.",
  },
  {
    id: "threshold-escalation",
    scenario:
      "Hazard indicators cross defined thresholds, but alarms are routed to a dashboard no one is actively monitoring and escalation responsibilities are unclear.",
    choices: [
      "Monitor hazard thresholds with timely, actionable alarms and clear escalation paths to responsible people",
      "Record threshold breaches for the end-of-shift report without immediate notification",
      "Rely on workers nearby to notice the condition without system escalation",
    ],
    best: 0,
    assurance: "Alarms & escalation",
    feedback:
      "Threshold monitoring only protects people if it triggers timely action: alarms must reach the right roles quickly with clear escalation responsibilities.",
  },
  {
    id: "traceability",
    scenario:
      "After a near-miss, the team cannot determine which sensor inputs, alerts or model version informed the decisions made in the control room.",
    choices: [
      "Log decisions, alerts, inputs and model versions so events can be traced and investigated",
      "Reconstruct what happened from radio calls and individual recollections",
      "Keep detailed records only for incidents that result in injury or equipment damage",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Near-misses are critical learning opportunities: traceable records of alerts, inputs and model versions help teams understand causes and prevent recurrence.",
  },
  {
    id: "change-fallback",
    scenario:
      "A model update is deployed to improve detection, but there is no tested rollback, manual procedures are outdated, and site teams are unsure how to coordinate or notify others if the system fails.",
    choices: [
      "Control changes with tested fail-safe and manual procedures, and support coordination and required incident notifications when AI affects safety or operations",
      "Deploy the update quickly and rely on engineers to fix issues remotely if problems arise",
      "Keep the old procedures undocumented and let each site improvise during failures",
    ],
    best: 0,
    assurance: "Change control, fallback & notification",
    feedback:
      "Safety depends on prepared response: changes need rollback and tested manual procedures, and teams must know how to coordinate and notify others during failures.",
  },
];

export function miningExtractiveSafetyScore(answers: Record<string, number>) {
  const done = MINING_EXTRACTIVE_SAFETY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MINING_EXTRACTIVE_SAFETY_ROUNDS.length,
  };
}
