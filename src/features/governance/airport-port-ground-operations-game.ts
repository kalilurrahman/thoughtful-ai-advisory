export type AirportPortGroundOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AIRPORT_PORT_GROUND_OPERATIONS_ROUNDS: AirportPortGroundOperationsRound[] = [
  {
    id: "movement-oversight",
    scenario:
      "An AI system guides vehicle movements and equipment clearances on a busy apron/yard, but operators feel pressured to accept its routing and clearance suggestions even when local conditions make a movement unsafe.",
    choices: [
      "Maintain human authority and oversight for safety-critical vehicle and equipment movements and clearances, with clear stop and override controls",
      "Allow the system to direct movements automatically to maximise throughput in congested periods",
      "Require human confirmation only for movements that the system flags as high risk",
    ],
    best: 0,
    assurance: "Human oversight & movement authority",
    feedback:
      "Safety-critical movements need accountable human control: operators must be able to stop, question or override AI guidance when conditions on the ground make a clearance unsafe.",
  },
  {
    id: "degraded-validation",
    scenario:
      "The system was tested in good visibility and light traffic, but it has not been validated in fog, heavy rain, peak congestion, sensor dropouts or unusual layouts.",
    choices: [
      "Validate performance in degraded visibility, congestion, sensor faults and edge conditions, and limit reliance where reliability is uncertain",
      "Assume performance will hold because the system uses multiple sensors",
      "Deploy broadly and adjust only after near-misses or incidents occur",
    ],
    best: 0,
    assurance: "Validation in degraded conditions",
    feedback:
      "Ground operations face visibility, congestion and sensor challenges: validation must cover degraded and edge conditions so limits are known before reliance in safety-critical contexts.",
  },
  {
    id: "proximity-escalation",
    scenario:
      "Proximity sensors detect a potential conflict between equipment and an aircraft/vehicle, but alerts are easy to miss in the control interface and escalation steps are unclear during peak activity.",
    choices: [
      "Provide timely, actionable proximity and hazard alerts with clear escalation to responsible teams",
      "Log proximity events for later review without interrupting ongoing movements",
      "Rely on visual spotting by staff in the area without dependable system escalation",
    ],
    best: 0,
    assurance: "Proximity alerts & escalation",
    feedback:
      "Hazard detection must trigger timely action: clear, noticeable alerts and escalation paths help prevent collisions and protect people and assets in congested areas.",
  },
  {
    id: "traceability-investigation",
    scenario:
      "After a ground incident, investigators cannot determine which movements were recommended, what alerts were raised, which inputs or model version were used, or what actions operators took.",
    choices: [
      "Log movements, actions, alerts, inputs and model versions to support traceability and investigation",
      "Reconstruct events from radio traffic and operator recollections without detailed system records",
      "Keep detailed logs only for incidents that result in damage or injury",
    ],
    best: 0,
    assurance: "Traceability & investigation",
    feedback:
      "Incident learning and accountability depend on evidence: traceable records of guidance, alerts, inputs and actions help explain what happened and prevent recurrence.",
  },
  {
    id: "change-fallback-coordination",
    scenario:
      "A routing-model update is deployed during a busy shift without tested rollback, manual procedures are not practised, and teams are unsure how to coordinate or notify others if the system misroutes equipment or becomes unavailable.",
    choices: [
      "Control changes with tested fail-safe and manual procedures, and support coordination and required notifications across teams when AI affects operations or incidents",
      "Deploy updates quickly to improve efficiency and resolve issues reactively during operations",
      "Leave fallback and cross-team communication to ad hoc judgement without a practised plan",
    ],
    best: 0,
    assurance: "Change control, fallback & coordination",
    feedback:
      "Safe ground operations require prepared continuity: controlled changes, tested manual procedures and clear cross-team coordination/notification help manage failures without increasing risk.",
  },
];

export function airportPortGroundOperationsScore(answers: Record<string, number>) {
  const done = AIRPORT_PORT_GROUND_OPERATIONS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AIRPORT_PORT_GROUND_OPERATIONS_ROUNDS.length,
  };
}
