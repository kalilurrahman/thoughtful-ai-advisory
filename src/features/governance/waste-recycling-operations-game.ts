export type WasteRecyclingOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const WASTE_RECYCLING_OPERATIONS_ROUNDS: WasteRecyclingOperationsRound[] = [
  {
    id: "safety-oversight",
    scenario:
      "An AI vision system controls a sorting line and can divert items automatically, but workers cannot easily stop the line when it misclassifies hazardous materials and responsibility for safety-critical actions is unclear.",
    choices: [
      "Maintain human authority and oversight for safety-critical and compliance-relevant actions, with clear stop-work controls and accountability",
      "Let the system run autonomously to maximise throughput and review incidents after the shift",
      "Require workers to follow the system's actions even when they suspect a hazard to avoid slowing operations",
    ],
    best: 0,
    assurance: "Human oversight & safety authority",
    feedback:
      "Safety-critical actions need clear human authority: workers must be able to stop or override automated actions when hazards are suspected, with accountable procedures.",
  },
  {
    id: "stream-validation",
    scenario:
      "The model was tuned on clean, separated recyclables, but in live operations waste streams vary widely, materials are dirty or damaged, and sensors are affected by dust and glare.",
    choices: [
      "Validate performance across waste streams, materials and operating conditions including sensor faults, and limit reliance where performance degrades",
      "Assume accuracy will generalise to all incoming waste because the core materials are similar",
      "Deploy broadly and adjust only after contamination rates or safety incidents increase",
    ],
    best: 0,
    assurance: "Validation across streams & conditions",
    feedback:
      "Real-world waste streams are variable and harsh on sensors: validation must cover diverse materials and degraded conditions so limits are known before reliance.",
  },
  {
    id: "hazard-escalation",
    scenario:
      "The system detects possible batteries and chemical containers on the line, but alerts appear only on a shared screen and there is no defined escalation to remove hazards before they cause fires or exposures.",
    choices: [
      "Detect hazards and contamination with timely, actionable alarms and clear escalation to protect workers and operations",
      "Log suspected hazards for later analysis without interrupting the line",
      "Rely on downstream manual checks to catch hazardous items missed by the system",
    ],
    best: 0,
    assurance: "Hazard detection & escalation",
    feedback:
      "Hazard detection must drive timely action: clear alarms and escalation paths help remove dangerous items before they harm workers, equipment or the environment.",
  },
  {
    id: "traceability-evidence",
    scenario:
      "After a contamination incident and a safety near-miss, the facility cannot determine what the AI detected, which inputs or model version were used, or what actions were taken.",
    choices: [
      "Log decisions, alerts, inputs and model versions to support traceability, investigation and compliance evidence",
      "Reconstruct events from shift notes and equipment status without detailed system records",
      "Keep detailed logs only for incidents that trigger regulatory reporting",
    ],
    best: 0,
    assurance: "Traceability & compliance evidence",
    feedback:
      "Investigations and compliance depend on evidence: traceable records of detections, inputs, versions and actions help explain incidents and demonstrate due care.",
  },
  {
    id: "change-fallback-coordination",
    scenario:
      "A sorting-model update is rolled out during peak operations without tested rollback, manual procedures are not practised, and staff are unsure how to coordinate worker-safety actions or required notifications if the system fails.",
    choices: [
      "Control changes with tested fail-safe and manual procedures, and support coordination, worker-safety actions and required notifications when AI affects operations or incidents",
      "Deploy updates immediately to improve sorting rates and address issues reactively",
      "Leave fallback and notification steps to on-the-spot judgement without a practised plan",
    ],
    best: 0,
    assurance: "Change control, fallback & coordination",
    feedback:
      "Safe operations require prepared response: controlled changes, tested manual procedures and clear coordination/notification paths protect workers when AI fails or behaves unexpectedly.",
  },
];

export function wasteRecyclingOperationsScore(answers: Record<string, number>) {
  const done = WASTE_RECYCLING_OPERATIONS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === WASTE_RECYCLING_OPERATIONS_ROUNDS.length,
  };
}
