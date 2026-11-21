export type LaboratoryResearchSafetyRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const LABORATORY_RESEARCH_SAFETY_ROUNDS: LaboratoryResearchSafetyRound[] = [
  {
    id: "oversight-protocol",
    scenario:
      "An AI system recommends adjusting experimental parameters and handling steps, but junior staff are encouraged to follow its guidance directly for safety-critical procedures without qualified review or clear authority to pause.",
    choices: [
      "Maintain qualified human oversight and authority for safety-critical and protocol decisions, with clear ability to pause or override AI guidance",
      "Treat the AI recommendation as authoritative for efficiency when it aligns with recent successful runs",
      "Require review only after an experiment is complete, even for safety-critical steps",
    ],
    best: 0,
    assurance: "Qualified oversight & protocol authority",
    feedback:
      "Safety-critical and protocol decisions need accountable qualified judgement: AI can assist, but people must retain authority to review, pause or override actions that affect safety and compliance.",
  },
  {
    id: "hazard-escalation",
    scenario:
      "Sensors and models indicate a possible chemical exposure risk and abnormal equipment condition, but alerts are muted during busy periods and escalation responsibilities are not clearly assigned.",
    choices: [
      "Detect hazards and unsafe conditions with timely, actionable alarms and clear escalation to responsible personnel",
      "Log warnings for later review while allowing work to continue unless a visible incident occurs",
      "Rely on nearby staff to notice issues without dependable automated alerting or escalation",
    ],
    best: 0,
    assurance: "Hazard detection & escalation",
    feedback:
      "Early hazard signals must lead to timely action: clear alarms and escalation paths help protect people and contain risks before they become incidents.",
  },
  {
    id: "validation-variability",
    scenario:
      "The AI was validated in controlled setups, but it is now used across different experiments, materials, instruments and sensor conditions where performance and failure modes are not well understood.",
    choices: [
      "Validate performance across relevant experiments, materials, equipment and sensor or condition variability, and limit reliance where behaviour is uncertain",
      "Assume the system will generalise because core lab processes are similar",
      "Expand use broadly and investigate reliability only after unsafe results or failed runs",
    ],
    best: 0,
    assurance: "Validation across lab variability",
    feedback:
      "Laboratory contexts and sensors vary: validation must cover relevant conditions and equipment so limitations are known before the system is relied on for safety or compliance.",
  },
  {
    id: "integrity-deviation",
    scenario:
      "An AI flags anomalous readings and possible protocol nonconformance, but experimental and safety records can be edited without provenance and there is no consistent process to investigate deviations.",
    choices: [
      "Preserve data integrity, provenance and audit trails for experimental and safety records, and detect and investigate deviations and protocol nonconformance",
      "Correct records directly to reflect expected results and review deviations only if an audit occurs",
      "Track anomalies informally without linking them to traceable records or investigations",
    ],
    best: 0,
    assurance: "Data integrity & deviation investigation",
    feedback:
      "Trustworthy research and compliance depend on traceable records: preserving integrity and investigating deviations supports learning, accountability and safe practice.",
  },
  {
    id: "change-fallback-notify",
    scenario:
      "A monitoring-model update is deployed before a critical run, but changes are not controlled or tested, manual safety procedures are not rehearsed, and teams are unsure what notifications are required if the system fails.",
    choices: [
      "Control and test changes, and maintain safe fallback, manual procedures and required notifications to protect people and compliance if AI fails",
      "Deploy updates quickly and rely on remote support to resolve issues during active work",
      "Leave fallback and notification steps to individual judgement without a practised plan",
    ],
    best: 0,
    assurance: "Change control, fallback & notification",
    feedback:
      "Safe lab operations require prepared response: controlled changes, practised manual procedures and clear notification paths help protect people and compliance when AI behaves unexpectedly or becomes unavailable.",
  },
];

export function laboratoryResearchSafetyScore(answers: Record<string, number>) {
  const done = LABORATORY_RESEARCH_SAFETY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === LABORATORY_RESEARCH_SAFETY_ROUNDS.length,
  };
}
