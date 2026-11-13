export type GuardrailAssuranceRound = {
  id: string;
  scenario: string;
  tier: "Low" | "Medium" | "High";
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const GUARDRAIL_ASSURANCE_ROUNDS: GuardrailAssuranceRound[] = [
  {
    id: "high-sensitive",
    scenario:
      "A high-risk AI system drafts decisions affecting customers using sensitive personal data. What guardrail/assurance step is most important before wider rollout?",
    tier: "High",
    choices: [
      "Require human review, documented approval, access controls, and evidence of testing for the intended use",
      "Rely only on the model provider's general safety claims",
      "Enable only optional logging to keep rollout fast",
    ],
    best: 0,
    assurance: "Human oversight + access control + evidence",
    feedback:
      "Higher-risk use needs enforceable controls and assurance evidence tied to the actual context, not general claims or optional-only safeguards.",
  },
  {
    id: "medium-logging",
    scenario:
      "A medium-risk internal assistant is deployed to several teams. What provides practical governance assurance during operation?",
    tier: "Medium",
    choices: [
      "Define required guardrails, assign an owner, log usage/incidents, and review issues on a schedule",
      "Skip monitoring because the tool is internal",
      "Treat all guardrails as optional until an incident occurs",
    ],
    best: 0,
    assurance: "Ownership + logging + review",
    feedback:
      "Assurance depends on ownership, required controls for the risk tier, and ongoing monitoring/review rather than waiting for failures.",
  },
  {
    id: "low-policy",
    scenario:
      "A low-risk AI writing helper is used for non-sensitive drafts. What is a proportionate guardrail baseline?",
    tier: "Low",
    choices: [
      "Set acceptable-use guidance, basic data-handling rules, and a way to report issues or escalate uncertain cases",
      "Apply the same approval gates as a high-risk decision system without assessing context",
      "Do nothing because low risk means no governance is needed",
    ],
    best: 0,
    assurance: "Proportionate baseline controls",
    feedback:
      "Low-risk systems still need proportionate guardrails and escalation paths; controls should match risk rather than be absent or uniformly maximal.",
  },
  {
    id: "assurance-evidence",
    scenario:
      "A team says guardrails are 'enabled' but cannot show configuration, owner, or test/review records. What is the assurance gap?",
    tier: "Medium",
    choices: [
      "Treat coverage as unproven until configuration and evidence show controls are operating for this system",
      "Accept the verbal statement as sufficient evidence",
      "Close the gap by adding more policy text only",
    ],
    best: 0,
    assurance: "Evidence-backed control operation",
    feedback:
      "Guardrail assurance requires evidence that controls exist and operate in context (configuration, ownership, testing/review), not intent alone.",
  },
];

export function guardrailAssuranceScore(answers: Record<string, number>) {
  const done = GUARDRAIL_ASSURANCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === GUARDRAIL_ASSURANCE_ROUNDS.length,
  };
}
