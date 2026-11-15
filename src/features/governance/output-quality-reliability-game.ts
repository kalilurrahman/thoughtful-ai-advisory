export type OutputQualityReliabilityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OUTPUT_QUALITY_RELIABILITY_ROUNDS: OutputQualityReliabilityRound[] = [
  {
    id: "quality-expectations",
    scenario:
      "An AI system is used in important workflows, but there are no defined quality or reliability expectations, error tolerances, or criteria for acceptable outputs.",
    choices: [
      "Define quality/reliability expectations and acceptance/error-tolerance criteria aligned to the use case and risks",
      "Assume outputs are acceptable if they are usually fluent or plausible",
      "Set expectations only after users complain about poor results",
    ],
    best: 0,
    assurance: "Quality and reliability expectations",
    feedback:
      "Output assurance starts with clear, risk-aligned quality and reliability expectations so teams can judge performance and respond to issues consistently.",
  },
  {
    id: "hallucination-handling",
    scenario:
      "The system can produce errors, hallucinations, or uncertain outputs, but there are no controls to detect, flag, or handle them safely.",
    choices: [
      "Use safeguards to detect/handle errors and uncertainty (e.g., checks, citations/verification where appropriate, escalation, or safe fallbacks)",
      "Present all outputs with equal confidence regardless of uncertainty",
      "Rely on users to always catch errors without support",
    ],
    best: 0,
    assurance: "Error, hallucination, and uncertainty handling",
    feedback:
      "Reliable AI use requires safeguards for errors and uncertainty—detection, appropriate checks, clear handling, and escalation/fallbacks rather than blind trust.",
  },
  {
    id: "confidence-communication",
    scenario:
      "Outputs are delivered without communicating limitations, uncertainty, or when human verification is needed for consequential decisions.",
    choices: [
      "Communicate limitations and uncertainty appropriately and guide users on when to verify or seek human review",
      "Imply certainty to build user confidence",
      "Provide long disclaimers that do not give practical guidance",
    ],
    best: 0,
    assurance: "Limitations and confidence communication",
    feedback:
      "Assurance includes clear, practical communication of limitations and uncertainty so users know when outputs need verification or human judgment.",
  },
  {
    id: "monitoring-improvement",
    scenario:
      "Quality issues recur in production, but there is no monitoring, feedback loop, or evidence-backed process to improve output reliability over time.",
    choices: [
      "Monitor output quality signals, investigate recurring issues, implement improvements, and track evidence of effectiveness",
      "Fix issues ad hoc without tracking patterns or outcomes",
      "Assume quality will improve automatically with future model updates",
    ],
    best: 0,
    assurance: "Monitoring and continuous improvement",
    feedback:
      "Sustained reliability depends on monitoring quality signals, learning from recurring issues, and evidencing improvements rather than one-off fixes or assumptions.",
  },
];

export function outputQualityReliabilityScore(answers: Record<string, number>) {
  const done = OUTPUT_QUALITY_RELIABILITY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OUTPUT_QUALITY_RELIABILITY_ROUNDS.length,
  };
}
