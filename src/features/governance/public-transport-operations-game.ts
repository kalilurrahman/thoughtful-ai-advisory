export type PublicTransportOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PUBLIC_TRANSPORT_OPERATIONS_ROUNDS: PublicTransportOperationsRound[] = [
  {
    id: "oversight-comms",
    scenario:
      "An AI system recommends rerouting services during an incident and auto-publishes safety-relevant passenger messages, but staff cannot easily review or correct them before they go live.",
    choices: [
      "Maintain human oversight for service changes and safety-relevant communications, with the ability to review, correct or halt automated messages",
      "Allow the system to publish and implement changes automatically to maximise speed during incidents",
      "Require staff approval only for routine updates, not for disruption or safety messages",
    ],
    best: 0,
    assurance: "Human oversight & safety communications",
    feedback:
      "Service changes and safety-relevant communications need accountable oversight: people must be able to review and correct AI-driven messages before they affect passengers.",
  },
  {
    id: "validation-conditions",
    scenario:
      "Arrival and crowding predictions perform well on typical weekdays, but they have not been validated for severe weather, special events, service disruptions or low-ridership routes and times.",
    choices: [
      "Validate predictions and performance across routes, times, demand and disruption conditions, and communicate uncertainty where reliability is limited",
      "Assume typical performance generalises because the model uses live vehicle data",
      "Deploy broadly and adjust only after passengers complain about inaccurate information",
    ],
    best: 0,
    assurance: "Validation across conditions",
    feedback:
      "Transport conditions vary widely: validation must cover disruptions, demand shifts and diverse routes/times so passengers are not misled when conditions change.",
  },
  {
    id: "accessible-equitable-info",
    scenario:
      "During a disruption, the AI posts updates to a mobile app quickly, but the information is inconsistent across channels, not accessible to all users and misses key details for passengers with diverse needs.",
    choices: [
      "Ensure passenger information is accurate, timely, accessible and equitable across channels, including for disruptions and diverse needs",
      "Prioritise the fastest channel and let other channels catch up when possible",
      "Provide detailed updates only to registered app users who have opted into alerts",
    ],
    best: 0,
    assurance: "Accessible & equitable information",
    feedback:
      "Passenger information must reach people reliably: updates should be accurate, consistent, accessible and equitable so disruptions do not disproportionately affect some travellers.",
  },
  {
    id: "data-protection",
    scenario:
      "To improve predictions and personalised alerts, the system collects detailed location and travel histories, but retention and sharing limits are unclear and passengers have little visibility into how data is used.",
    choices: [
      "Minimise and protect personal and location data, with clear purpose limits, retention controls and safeguards for sharing",
      "Collect as much travel and location data as possible because it can improve service quality",
      "Share detailed movement data with partners by default and rely on general privacy notices",
    ],
    best: 0,
    assurance: "Data minimisation & protection",
    feedback:
      "Location and travel data can be sensitive: minimisation, protection and clear limits help deliver useful services without unnecessary privacy risk.",
  },
  {
    id: "traceability-fallback",
    scenario:
      "A system outage leaves digital channels showing stale or missing information, and staff cannot trace recent AI-generated outputs or switch smoothly to manual passenger communications and operations support.",
    choices: [
      "Log outputs, decisions, inputs and model versions for traceability and review, and maintain fallback manual communications and operations support when AI is degraded or unavailable",
      "Wait for automated systems to recover while posting occasional ad hoc updates",
      "Rely on a few experienced staff to improvise communications without a practised fallback process",
    ],
    best: 0,
    assurance: "Traceability & manual fallback",
    feedback:
      "Continuity matters during outages: traceable records support review, and practised manual communications/operations fallback keep passengers informed when AI systems degrade.",
  },
];

export function publicTransportOperationsScore(answers: Record<string, number>) {
  const done = PUBLIC_TRANSPORT_OPERATIONS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PUBLIC_TRANSPORT_OPERATIONS_ROUNDS.length,
  };
}
