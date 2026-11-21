export type ParkingCurbManagementRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PARKING_CURB_MANAGEMENT_ROUNDS: ParkingCurbManagementRound[] = [
  {
    id: "accuracy-evidence",
    scenario:
      "An AI camera system detects parking violations and issues penalties, but evidence images are unclear or misread and there is limited validation of detection and enforcement accuracy.",
    choices: [
      "Validate detection and enforcement accuracy and evidence quality before and during use, and correct errors promptly",
      "Rely on automated detections as sufficient proof because manual checks are costly",
      "Issue penalties broadly and review accuracy only when a high number of complaints arise",
    ],
    best: 0,
    assurance: "Detection accuracy & evidence quality",
    feedback:
      "Enforcement must be reliable: validated detection and clear evidence help prevent wrongful penalties and support fair outcomes.",
  },
  {
    id: "rules-conditions",
    scenario:
      "The system enforces restrictions based on outdated maps while signage has changed or temporary conditions (roadworks, events) apply, leading to actions that do not reflect current rules.",
    choices: [
      "Check signage, restrictions and conditions so actions reflect current rules, and update inputs when conditions change",
      "Enforce based on the last configured ruleset to maintain consistency across areas",
      "Assume drivers are responsible for knowing rules even when system information is outdated",
    ],
    best: 0,
    assurance: "Current rules & conditions",
    feedback:
      "Actions must match reality: enforcement should reflect current signage, restrictions and temporary conditions to be fair and defensible.",
  },
  {
    id: "fairness-appeals",
    scenario:
      "Analysis shows enforcement is concentrated in certain neighbourhoods or affects some groups more than others, but there is little monitoring for fairness and contest or appeals pathways are hard to access.",
    choices: [
      "Monitor fairness and equity so enforcement does not systematically disadvantage groups or areas, and provide transparent contest or appeals pathways",
      "Focus enforcement where it is easiest to detect violations, regardless of distributional impact",
      "Provide limited information about penalties and make appeals difficult to discourage challenges",
    ],
    best: 0,
    assurance: "Fairness, transparency & appeals",
    feedback:
      "Enforcement should be equitable and contestable: monitoring impacts and providing clear, accessible appeals help address bias and correct mistakes.",
  },
  {
    id: "privacy-minimisation",
    scenario:
      "To support enforcement and analytics, the system continuously captures and retains vehicle and location data beyond what is needed, without clear minimisation or privacy safeguards.",
    choices: [
      "Apply privacy and minimisation in monitoring and data use, limiting collection, retention and access to what is necessary",
      "Retain all captured data indefinitely to support future analysis and investigations",
      "Share monitoring data widely with other services without clear purpose limits or protections",
    ],
    best: 0,
    assurance: "Privacy & data minimisation",
    feedback:
      "Monitoring can be intrusive: minimisation and safeguards help protect privacy while enabling proportionate parking and curb management.",
  },
  {
    id: "traceability-fallback",
    scenario:
      "A penalty is disputed, but staff cannot trace the decision, evidence or system version used, and when the AI is uncertain or unavailable there is no clear manual fallback for handling cases.",
    choices: [
      "Log decisions, evidence and model or system versions for traceability, and use manual fallback when AI is uncertain or unavailable",
      "Rely on the system's output without retaining supporting records or a fallback process",
      "Suspend enforcement only after repeated failures, without defined manual procedures",
    ],
    best: 0,
    assurance: "Traceability & manual fallback",
    feedback:
      "Accountability and continuity matter: traceable records support review and appeals, and manual fallback helps manage cases safely when AI is uncertain or unavailable.",
  },
];

export function parkingCurbManagementScore(answers: Record<string, number>) {
  const done = PARKING_CURB_MANAGEMENT_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PARKING_CURB_MANAGEMENT_ROUNDS.length,
  };
}
