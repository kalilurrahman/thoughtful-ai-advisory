export type SyntheticDataRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SYNTHETIC_DATA_ROUNDS: SyntheticDataRound[] = [
  {
    id: "no-provenance",
    scenario:
      "A synthetic customer dataset is being reused across three projects, and no one can say which model generated it, with what settings, or from which source data.",
    choices: [
      "Record generation method, model, parameters and source data with the dataset, and keep that record with every copy",
      "Ask the data scientist who built it to remember the details if challenged",
      "Regenerate the dataset so provenance starts from today",
    ],
    best: 0,
    assurance: "Generation provenance",
    feedback:
      "A synthetic dataset without provenance cannot be defended or reproduced: record method, model, parameters and source, and keep it with every copy.",
  },
  {
    id: "looks-real",
    scenario:
      "The synthetic data looks plausible in dashboards, but nobody has compared its statistical properties or model utility with the real data it replaces.",
    choices: [
      "Validate fidelity and utility against the real data, and state where the synthetic data is not representative",
      "Ship it because the dashboards look believable",
      "Use it only for demos and skip validation",
    ],
    best: 0,
    assurance: "Validated fidelity",
    feedback:
      "Plausible is not representative: validate fidelity and utility against real data, and state where the synthetic data does not hold.",
  },
  {
    id: "memorised-records",
    scenario:
      "A generative model was trained on real customer records, and a reviewer finds that some synthetic rows match real individuals almost exactly.",
    choices: [
      "Test for memorisation and near-duplicates, remove affected rows, and treat the generator as a leakage risk",
      "Keep the rows because they are labelled synthetic",
      "Add noise to the rows and publish the dataset",
    ],
    best: 0,
    assurance: "Leakage testing",
    feedback:
      "Synthetic does not mean anonymous: test for memorisation and near-duplicates, remove affected rows, and treat the generator as a leakage risk.",
  },
  {
    id: "invented-labels",
    scenario:
      "Labels in the synthetic dataset were produced by the same model that generated the examples, and known gaps in minority cases are not documented anywhere.",
    choices: [
      "Review synthetic labels, document known gaps and limitations, and avoid treating synthetic labels as ground truth",
      "Use the labels as ground truth because they are consistent",
      "Remove the minority cases so the label noise disappears",
    ],
    best: 0,
    assurance: "Label review & limits",
    feedback:
      "Model-generated labels are not ground truth: review them, document known gaps, and state the limits wherever the dataset is used.",
  },
];

export function syntheticDataScore(answers: Record<string, number>) {
  const done = SYNTHETIC_DATA_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SYNTHETIC_DATA_ROUNDS.length,
  };
}
