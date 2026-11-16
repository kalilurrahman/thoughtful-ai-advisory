export type ModelDocumentationTransparencyRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MODEL_DOCUMENTATION_TRANSPARENCY_ROUNDS: ModelDocumentationTransparencyRound[] = [
  {
    id: "no-model-card",
    scenario:
      "A production model has no model card or documentation; the team knows it works in tests but cannot state its intended use, limitations, or how performance was measured.",
    choices: [
      "Publish a model card covering purpose, scope, data, performance evidence, limitations, and monitoring approach, kept current with the model",
      "Rely on the team's shared understanding and a few internal notes",
      "Document only the technical architecture, without intended use or limitations",
    ],
    best: 0,
    assurance: "Model documentation and intended use",
    feedback:
      "Documentation is what others act on: state intended use, scope, data, performance evidence, and limitations so operators and reviewers can judge fitness.",
  },
  {
    id: "undisclosed-change",
    scenario:
      "A model was retrained and its behaviour changed, but no one updated the documentation or told operators, who still rely on the old description.",
    choices: [
      "Version model documentation, record changes and their effect on behaviour/limitations, and notify affected users and operators",
      "Update the model silently and let users discover differences",
      "Keep the original documentation to avoid confusion",
    ],
    best: 0,
    assurance: "Change transparency and versioning",
    feedback:
      "Changes change the facts: version documentation, record what changed and its effect on behaviour and limits, and tell the people who depend on the old description.",
  },
  {
    id: "no-limits",
    scenario:
      "The model card describes accuracy in aggregate but not where the model underperforms, so operators assume it is reliable for edge cases.",
    choices: [
      "Document known limitations, failure modes, and underperforming groups/conditions, and give operators guidance on when to verify or escalate",
      "Report only the headline accuracy figure",
      "Remove limitations text to keep the card concise",
    ],
    best: 0,
    assurance: "Known limitations and failure modes",
    feedback:
      "Limitations are operational information: where the model fails and when to verify or escalate is what prevents overreliance and harm.",
  },
  {
    id: "stale-doc-evidence",
    scenario:
      "Documentation exists but the performance figures are two years old and cannot be traced to a test set, dataset version, or reviewer.",
    choices: [
      "Keep performance evidence traceable to dataset/version and test runs, with review dates and owners, and refresh it on a cadence",
      "Archive the old figures and describe performance only qualitatively",
      "Ask teams to re-run tests informally when they have time",
    ],
    best: 0,
    assurance: "Traceable and current evidence",
    feedback:
      "Documentation is assurance only when its evidence is traceable and current: link figures to datasets, versions, and test runs, with review dates and owners.",
  },
];

export function modelDocumentationTransparencyScore(answers: Record<string, number>) {
  const done = MODEL_DOCUMENTATION_TRANSPARENCY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MODEL_DOCUMENTATION_TRANSPARENCY_ROUNDS.length,
  };
}
