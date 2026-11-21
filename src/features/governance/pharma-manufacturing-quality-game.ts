export type PharmaManufacturingQualityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PHARMA_MANUFACTURING_QUALITY_ROUNDS: PharmaManufacturingQualityRound[] = [
  {
    id: "qualified-review-release",
    scenario:
      "An AI system recommends releasing a batch based on in-process data, but quality staff are pressured to accept the recommendation without an independent qualified review of critical quality attributes and deviations.",
    choices: [
      "Require qualified human review and maintain clear authority for quality-critical and release decisions before accepting AI recommendations",
      "Auto-release batches when the model's confidence score is high to reduce cycle time",
      "Have quality staff sign off quickly and review details only if a complaint is received later",
    ],
    best: 0,
    assurance: "Qualified human review & release authority",
    feedback:
      "Quality-critical and release decisions need accountable qualified review: AI can inform decisions, but people must retain authority and verify critical evidence before release.",
  },
  {
    id: "data-integrity-audit-trail",
    scenario:
      "Manufacturing and quality records used by the AI are edited across systems, but provenance is unclear and audit trails do not show who changed data, when, or why.",
    choices: [
      "Preserve data integrity, provenance and complete audit trails for manufacturing and quality records used by AI",
      "Allow data corrections without traceable records as long as final values look reasonable",
      "Keep audit trails only for records directly tied to final batch release",
    ],
    best: 0,
    assurance: "Data integrity & audit trails",
    feedback:
      "Reliable quality decisions depend on trustworthy records: preserving integrity, provenance and audit trails supports investigation, accountability and confidence in AI-informed outcomes.",
  },
  {
    id: "deviation-escalation",
    scenario:
      "The AI flags unusual process signals that may indicate a deviation, but alerts are routed to a low-priority queue and there is no defined timeline for investigation or escalation.",
    choices: [
      "Detect and escalate deviations and anomalies promptly with clear ownership and timely investigation",
      "Log the anomaly for trend analysis and wait to see if it recurs in future batches",
      "Suppress alerts that might slow production unless a batch clearly fails specifications",
    ],
    best: 0,
    assurance: "Deviation detection & escalation",
    feedback:
      "Potential deviations need timely attention: clear escalation and investigation help contain risk to product quality before issues propagate across batches.",
  },
  {
    id: "validation-across-conditions",
    scenario:
      "A model validated on one product line is rolled out to other products, equipment and operating conditions without confirming performance or known limitations in those contexts.",
    choices: [
      "Validate performance across relevant products, lines and operating conditions and document limitations before broader use",
      "Assume similar manufacturing processes mean the model will perform equivalently everywhere",
      "Expand use broadly and tune the model only after quality issues are reported",
    ],
    best: 0,
    assurance: "Validation across products & conditions",
    feedback:
      "Manufacturing contexts vary: validation must cover relevant products, lines and conditions so the model's behaviour and limits are understood before reliance.",
  },
  {
    id: "change-control-fallback",
    scenario:
      "A model parameter update is pushed to improve yield predictions, but the change is not formally controlled or traceable, and there is no practised manual fallback if the AI becomes unavailable during production.",
    choices: [
      "Control, validate and trace model and configuration changes, and maintain safe manual procedures to sustain quality decisions if AI fails",
      "Apply parameter changes quickly in production and document them later if results improve",
      "Rely on vendor support to restore the system during an outage without site-level manual procedures",
    ],
    best: 0,
    assurance: "Change control & safe fallback",
    feedback:
      "Controlled, traceable changes and practised manual procedures protect continuity: teams must be able to maintain product quality decisions even when AI outputs are unavailable or unreliable.",
  },
];

export function pharmaManufacturingQualityScore(answers: Record<string, number>) {
  const done = PHARMA_MANUFACTURING_QUALITY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PHARMA_MANUFACTURING_QUALITY_ROUNDS.length,
  };
}
