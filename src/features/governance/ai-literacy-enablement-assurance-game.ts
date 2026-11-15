export type AILiteracyEnablementAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AI_LITERACY_ENABLEMENT_ASSURANCE_ROUNDS: AILiteracyEnablementAssuranceRound[] = [
  {
    id: "role-appropriate-literacy",
    scenario:
      "Different users and roles interact with an AI system, but there is no role-appropriate guidance to help them understand how to use it responsibly and effectively.",
    choices: [
      "Provide role-appropriate AI literacy and enablement tailored to how different users interact with the system and their responsibilities",
      "Offer the same generic guidance to everyone regardless of role or use",
      "Assume users will learn through trial and error without support",
    ],
    best: 0,
    assurance: "Role-appropriate literacy and enablement",
    feedback:
      "Enablement assurance includes tailored guidance for different roles and users so people understand how to use AI appropriately in their context.",
  },
  {
    id: "capabilities-limitations",
    scenario:
      "Users over-rely on AI outputs because capabilities, limitations, and uncertainty are not clearly communicated in practical terms.",
    choices: [
      "Set clear expectations about capabilities, limitations, and uncertainty, with practical guidance on when to verify or seek human review",
      "Emphasize capabilities while downplaying limitations to encourage adoption",
      "Provide only technical documentation that most users cannot apply",
    ],
    best: 0,
    assurance: "Clear expectations of capabilities and limitations",
    feedback:
      "Effective AI literacy includes practical understanding of what the system can and cannot do, helping users calibrate trust and know when to verify.",
  },
  {
    id: "safe-effective-use",
    scenario:
      "Users want to benefit from AI but lack examples, workflows, or guardrails for safe and effective use in their tasks.",
    choices: [
      "Provide safe-use guidance, examples, and workflows aligned to guardrails and intended use, and update them as the system changes",
      "Leave users to invent their own practices without guidance",
      "Restrict guidance to policy language without practical examples",
    ],
    best: 0,
    assurance: "Safe and effective use guidance",
    feedback:
      "Assurance is supported by practical, up-to-date guidance and examples that help users work effectively within guardrails and intended use boundaries.",
  },
  {
    id: "feedback-improvement",
    scenario:
      "Users encounter confusion, errors, or risky patterns, but there are no feedback channels or evidence-backed improvements to enablement materials.",
    choices: [
      "Provide feedback channels, monitor confusion/misuse signals, and improve enablement materials and guidance based on evidence",
      "Treat user confusion as an individual problem with no systemic response",
      "Collect feedback but never act on it or update guidance",
    ],
    best: 0,
    assurance: "Feedback loops and evidence-backed improvement",
    feedback:
      "Ongoing enablement assurance uses feedback and observed issues to improve guidance and literacy resources, reducing confusion and misuse over time.",
  },
];

export function aiLiteracyEnablementAssuranceScore(answers: Record<string, number>) {
  const done = AI_LITERACY_ENABLEMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AI_LITERACY_ENABLEMENT_ASSURANCE_ROUNDS.length,
  };
}
