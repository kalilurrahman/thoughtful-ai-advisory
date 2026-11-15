export type ExplainabilityInterpretabilityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EXPLAINABILITY_INTERPRETABILITY_ROUNDS: ExplainabilityInterpretabilityRound[] = [
  {
    id: "appropriate-explanations",
    scenario:
      "An AI system influences important decisions, but there is no approach for providing explanations or interpretability appropriate to the use case and audience.",
    choices: [
      "Provide explanations/interpretability appropriate to the context, risk, and audience needs to support understanding and oversight",
      "Assume the model is too complex to explain, so provide nothing",
      "Offer the same technical details to every audience regardless of usefulness",
    ],
    best: 0,
    assurance: "Appropriate explanations for context and audience",
    feedback:
      "Explainability assurance means providing information that is appropriate and useful for the context and audience, supporting understanding and accountable decisions.",
  },
  {
    id: "limitations-communication",
    scenario:
      "Explanations are presented in a way that may imply certainty or completeness, even though they have limitations or do not fully reflect how outputs were produced.",
    choices: [
      "Communicate limitations of explanations clearly, including uncertainty and what they can and cannot support",
      "Present explanations as definitive proof of correctness",
      "Avoid mentioning limitations to keep explanations simple",
    ],
    best: 0,
    assurance: "Communicating explanation limitations",
    feedback:
      "Explanations can be helpful but imperfect; assurance requires communicating their limits and avoiding overconfidence or misleading certainty.",
  },
  {
    id: "reviewer-understanding",
    scenario:
      "Reviewers or affected users need to understand and act on AI-influenced outcomes, but information provided does not support meaningful review or informed decisions.",
    choices: [
      "Provide actionable information that supports reviewer/user understanding, questions, and appropriate human judgment or review",
      "Share raw model internals without context or guidance",
      "Provide minimal information that prevents meaningful review",
    ],
    best: 0,
    assurance: "Actionable understanding and review support",
    feedback:
      "Interpretability should enable meaningful review and informed action—giving relevant, understandable information rather than opaque or unusable detail.",
  },
  {
    id: "validation-evidence",
    scenario:
      "Explanations are generated, but no one evaluates whether they are useful, accurate enough for purpose, or introduce risks such as misunderstanding or misuse.",
    choices: [
      "Validate explanation usefulness and risks, gather feedback, and maintain evidence-backed documentation and improvements",
      "Assume explanations are helpful because they are available",
      "Remove all explanations after launch without assessing impact",
    ],
    best: 0,
    assurance: "Validation, documentation, and improvement evidence",
    feedback:
      "Assurance includes assessing whether explanations are useful and safe for purpose, documenting approaches and limits, and improving based on evidence.",
  },
];

export function explainabilityInterpretabilityScore(answers: Record<string, number>) {
  const done = EXPLAINABILITY_INTERPRETABILITY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EXPLAINABILITY_INTERPRETABILITY_ROUNDS.length,
  };
}
