export type TrainingAwarenessAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TRAINING_AWARENESS_ASSURANCE_ROUNDS: TrainingAwarenessAssuranceRound[] = [
  {
    id: "role-training",
    scenario:
      "Staff involved in building, deploying, or overseeing an AI system have not received role-relevant training on governance, guardrails, and their responsibilities.",
    choices: [
      "Provide role-appropriate training and guidance on governance, guardrails, limitations, and responsibilities, and keep it current",
      "Assume general onboarding is sufficient for AI-specific responsibilities",
      "Rely on a single policy document without training or support",
    ],
    best: 0,
    assurance: "Role-relevant training and guidance",
    feedback:
      "Assurance depends on people understanding their AI governance responsibilities; role-relevant training and practical guidance are more effective than assumptions or documents alone.",
  },
  {
    id: "acceptable-use",
    scenario:
      "Users are adopting AI tools but are unclear about acceptable use, system limitations, sensitive-data handling, and when to seek human review.",
    choices: [
      "Communicate clear acceptable-use guidance, limitations, escalation/review expectations, and safe handling practices",
      "Allow informal use and address issues only after misuse occurs",
      "Discourage questions to avoid slowing adoption",
    ],
    best: 0,
    assurance: "Awareness and acceptable use",
    feedback:
      "Awareness assurance requires clear, accessible guidance on acceptable use, limitations, and when to escalate or seek review—before issues arise.",
  },
  {
    id: "competence-verification",
    scenario:
      "Training has been delivered, but there is no way to confirm people can apply guardrails and governance practices in real scenarios.",
    choices: [
      "Verify competence through practical checks, exercises, or supervision, and provide refreshers or support where gaps appear",
      "Track training attendance as proof of competence",
      "Assume competence will improve over time without follow-up",
    ],
    best: 0,
    assurance: "Competence verification and refreshers",
    feedback:
      "Training assurance is stronger when competence is verified in practice and reinforced with refreshers/support, not measured by attendance alone.",
  },
  {
    id: "change-incident-learning",
    scenario:
      "After system changes or incidents, guidance is not updated and teams are not briefed, so people continue using outdated practices.",
    choices: [
      "Update guidance after changes/incidents, brief affected roles, and capture evidence that people can apply updated controls",
      "Share lessons informally without updating training or guidance",
      "Assume teams will discover changes on their own",
    ],
    best: 0,
    assurance: "Learning updates and applied practice",
    feedback:
      "Ongoing assurance includes timely updates to guidance and briefings after changes or incidents, with evidence that people can apply revised controls in practice.",
  },
];

export function trainingAwarenessAssuranceScore(answers: Record<string, number>) {
  const done = TRAINING_AWARENESS_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TRAINING_AWARENESS_ASSURANCE_ROUNDS.length,
  };
}
