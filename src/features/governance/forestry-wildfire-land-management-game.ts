export type ForestryWildfireLandManagementRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const FORESTRY_WILDFIRE_LAND_MANAGEMENT_ROUNDS: ForestryWildfireLandManagementRound[] = [
  {
    id: "validation-conditions",
    scenario:
      "A wildfire detection model performs well in clear summer imagery, but it has not been validated for smoke, cloud cover, night conditions, steep terrain or seasonal fuel changes that affect visibility and risk.",
    choices: [
      "Validate detection and prediction performance across terrain, weather, seasonality and sensor or satellite limitations, and qualify use where reliability drops",
      "Assume strong summer performance means the model is dependable year-round",
      "Deploy broadly and treat missed detections as unavoidable given environmental complexity",
    ],
    best: 0,
    assurance: "Validation across conditions & sensor limits",
    feedback:
      "Wildfire conditions and sensing vary widely: validation must cover terrain, weather, seasonality and sensor limits so responders understand when the system can and cannot be relied on.",
  },
  {
    id: "human-authority",
    scenario:
      "An AI system recommends prioritising certain response actions and issuing evacuation guidance, but field commanders feel pressured to follow its outputs without clear authority to apply local judgement.",
    choices: [
      "Maintain human authority for response prioritization and safety-critical actions, using AI as decision support rather than automatic command",
      "Follow AI recommendations by default to speed response, even when local conditions differ",
      "Leave decisions entirely to automated workflows during high-tempo incidents",
    ],
    best: 0,
    assurance: "Human authority for response actions",
    feedback:
      "Safety-critical response decisions require accountable human judgement: AI can inform priorities, but responders must retain authority to adapt actions to conditions on the ground.",
  },
  {
    id: "alarm-quality",
    scenario:
      "The system generates frequent false alarms in some regions while missing small ignitions in others, but there is no consistent process to verify alerts, learn from misses or escalate uncertain detections.",
    choices: [
      "Monitor false alarms and missed detections with verification, feedback and clear escalation for uncertain or high-risk signals",
      "Tune the system only to reduce false alarms, accepting more missed detections to avoid fatigue",
      "Treat alert quality issues as acceptable noise and respond only when confidence scores are very high",
    ],
    best: 0,
    assurance: "False alarms, misses & escalation",
    feedback:
      "Both false alarms and missed detections carry risk: verification, feedback and escalation help balance response effort while reducing the chance of overlooked threats.",
  },
  {
    id: "uncertainty-transparency",
    scenario:
      "During active conditions, the system presents fire spread predictions as precise, without communicating uncertainty, data gaps or model limitations to responders and affected communities.",
    choices: [
      "Communicate uncertainty and model limitations transparently so responders and affected communities can interpret predictions appropriately",
      "Present single-value predictions to avoid confusion, even when inputs are sparse or unreliable",
      "Share detailed technical caveats only in internal documentation, not in operational communications",
    ],
    best: 0,
    assurance: "Uncertainty & limitation transparency",
    feedback:
      "Clear communication of uncertainty and limitations supports safer decisions: people need to know when predictions are less reliable due to data gaps or changing conditions.",
  },
  {
    id: "traceability-coordination-fallback",
    scenario:
      "After a rapidly evolving incident, teams cannot trace which detections, inputs or model versions informed actions, notifications to agencies and communities were inconsistent, and there is no practised manual fallback when systems degrade.",
    choices: [
      "Log detections, inputs, model versions and decisions for traceability and review, and maintain coordination, notifications and manual fallback when AI is degraded or unavailable",
      "Rely on informal coordination and reconstruct events later from available messages",
      "Pause information sharing during degradation until automated systems are fully restored",
    ],
    best: 0,
    assurance: "Traceability, coordination & fallback",
    feedback:
      "Effective response depends on shared, traceable information and continuity: logging, clear notifications and practised manual fallback help sustain coordination when AI systems are limited or unavailable.",
  },
];

export function forestryWildfireLandManagementScore(answers: Record<string, number>) {
  const done = FORESTRY_WILDFIRE_LAND_MANAGEMENT_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === FORESTRY_WILDFIRE_LAND_MANAGEMENT_ROUNDS.length,
  };
}
