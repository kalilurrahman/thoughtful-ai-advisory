export type OfficialStatisticsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OFFICIAL_STATISTICS_ROUNDS: OfficialStatisticsRound[] = [
  {
    id: "opaque-model",
    scenario:
      "A team uses an AI model to impute missing census responses, but the method is not documented in enough detail for another analyst to reproduce the published figures or explain a revision.",
    choices: [
      "Document the method, inputs and quality checks so results can be reproduced and explained",
      "Keep the model as a proprietary black box because it was faster than the previous approach",
      "Publish the headline figures and explain the method only if someone challenges them",
    ],
    best: 0,
    assurance: "Method transparency & reproducibility",
    feedback:
      "Official figures need to be reproducible: document the method and checks so another analyst can explain the result and any later revision.",
  },
  {
    id: "coverage-bias",
    scenario:
      "AI-assisted estimates look stable nationally, but small-area outputs systematically undercount hard-to-reach groups and the team has not checked representativeness before release.",
    choices: [
      "Test outputs for bias, representativeness and small-area error before publication",
      "Release the figures because national totals match last year's benchmark",
      "Add a generic caveat that estimates may contain error without checking where",
    ],
    best: 0,
    assurance: "Representativeness & small-area quality",
    feedback:
      "Good national totals can hide local harm: check for bias and small-area error before publication, especially for hard-to-count groups.",
  },
  {
    id: "disclosure-risk",
    scenario:
      "A derived table generated from linked administrative data is so detailed that a reader could combine it with other sources to identify individuals in a small community.",
    choices: [
      "Apply statistical confidentiality and disclosure control before releasing the output",
      "Publish the table because the underlying records were already anonymised",
      "Remove names but leave the rest of the detail unchanged",
    ],
    best: 0,
    assurance: "Confidentiality & disclosure control",
    feedback:
      "Derived outputs can still identify people: apply disclosure control to the released tables, not just to the source records.",
  },
  {
    id: "silent-revision",
    scenario:
      "A model update changes published estimates, but the revision is issued without a versioned explanation of what changed in the method or data.",
    choices: [
      "Version revisions and model changes with an audit trail and explain what drove the change",
      "Replace the figures quietly so users see the corrected numbers",
      "Note that the series was updated without describing the method change",
    ],
    best: 0,
    assurance: "Versioning & audit trail",
    feedback:
      "Users need to trust the series over time: version method and model changes and explain revisions so differences are attributable, not mysterious.",
  },
  {
    id: "hidden-ai-role",
    scenario:
      "AI materially shapes how figures are produced, but the release does not tell the public that AI was involved or where its limitations affect interpretation.",
    choices: [
      "Tell the public when AI influenced published figures and state limitations plainly",
      "Mention AI only in a technical appendix that most readers will never see",
      "Avoid disclosure because it might reduce confidence in the statistics",
    ],
    best: 0,
    assurance: "Public transparency",
    feedback:
      "Public trust depends on clear disclosure: state when AI materially influenced the figures and explain the limitations that affect how to read them.",
  },
];

export function officialStatisticsScore(answers: Record<string, number>) {
  const done = OFFICIAL_STATISTICS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OFFICIAL_STATISTICS_ROUNDS.length,
  };
}
