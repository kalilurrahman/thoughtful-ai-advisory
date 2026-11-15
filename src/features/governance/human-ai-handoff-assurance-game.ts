export type HumanAIHandoffAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const HUMAN_AI_HANDOFF_ASSURANCE_ROUNDS: HumanAIHandoffAssuranceRound[] = [
  {
    id: "task-division",
    scenario:
      "A team deploys an AI assistant for case triage but has not defined which decisions the AI may draft, which require human confirmation, or where accountability sits.",
    choices: [
      "Define clear task division and handoff points so humans retain decision rights for consequential outcomes and responsibilities are explicit",
      "Let the AI handle as much as possible and clarify roles only after issues arise",
      "Require humans to redo all AI work regardless of risk or context",
    ],
    best: 0,
    assurance: "Clear task division and handoff points",
    feedback:
      "Collaboration assurance requires explicit boundaries: what AI may assist with, where human review or approval is required, and who is accountable at each handoff.",
  },
  {
    id: "context-judgment",
    scenario:
      "Reviewers receive AI-generated recommendations without the underlying context, rationale cues, or space to apply human judgment and local knowledge.",
    choices: [
      "Preserve human context and judgment by surfacing relevant inputs, uncertainty, and rationale cues and enabling reviewers to question or override outputs",
      "Hide context to speed throughput and encourage trust in the model",
      "Treat human judgment as unnecessary when confidence scores look high",
    ],
    best: 0,
    assurance: "Preserving human context and judgment",
    feedback:
      "Effective human-AI collaboration keeps people able to interpret outputs in context, apply domain judgment, and exercise informed oversight rather than rubber-stamping.",
  },
  {
    id: "escalation-confidence",
    scenario:
      "The AI produces low-confidence or ambiguous outputs, but there is no defined escalation path or pause mechanism when uncertainty or risk is high.",
    choices: [
      "Escalate on low confidence, ambiguity, or elevated risk to qualified human reviewers with clear criteria, time expectations, and fallback options",
      "Always pick the model’s top suggestion to avoid delays",
      "Escalate every case to humans so confidence signals are irrelevant",
    ],
    best: 0,
    assurance: "Escalation on low confidence and risk",
    feedback:
      "Assurance depends on calibrated escalation: route uncertain, novel, or high-impact cases to people with authority and provide safe fallbacks when confidence is insufficient.",
  },
  {
    id: "overreliance-review",
    scenario:
      "After launch, teams show signs of automation complacency and overreliance, but no one reviews collaboration effectiveness or captures evidence of human oversight.",
    choices: [
      "Monitor for overreliance, review collaboration effectiveness with evidence (sampling, overrides, incidents), and adjust training, UX, and guardrails accordingly",
      "Assume collaboration is working if output volume increases",
      "Remove human review to eliminate friction once adoption grows",
    ],
    best: 0,
    assurance: "Avoiding overreliance with evidence-backed review",
    feedback:
      "Ongoing assurance means detecting automation bias, measuring whether handoffs and oversight work in practice, and improving controls based on observed evidence.",
  },
];

export function humanAIHandoffAssuranceScore(answers: Record<string, number>) {
  const done = HUMAN_AI_HANDOFF_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === HUMAN_AI_HANDOFF_ASSURANCE_ROUNDS.length,
  };
}
