export type DataLabelingQualityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_LABELING_QUALITY_ASSURANCE_ROUNDS: DataLabelingQualityAssuranceRound[] = [
  {
    id: "guidelines-criteria",
    scenario:
      "A team collects labeled data for an AI system, but labeling guidelines and quality criteria are unclear or inconsistent across contributors.",
    choices: [
      "Define clear labeling/annotation guidelines and quality criteria aligned to the intended use, with examples and ownership for updates",
      "Let each annotator interpret labels however they see fit",
      "Rely on volume of labeled data without defining quality expectations",
    ],
    best: 0,
    assurance: "Clear guidelines and quality criteria",
    feedback:
      "Label quality assurance starts with clear, consistent guidelines and quality criteria so annotations are meaningful and fit for the intended AI use.",
  },
  {
    id: "training-consistency",
    scenario:
      "Annotators begin work with minimal preparation, and there are no checks for consistency or calibration across people and batches.",
    choices: [
      "Provide annotator training/guidance, run calibration, and check consistency (e.g., reviews or agreement checks where appropriate)",
      "Assume annotators will naturally converge on the same interpretations",
      "Measure only speed of labeling, not consistency or understanding",
    ],
    best: 0,
    assurance: "Training and consistency checks",
    feedback:
      "Training, calibration, and consistency checks help reduce ambiguity and drift, improving the reliability of labeled data for downstream AI systems.",
  },
  {
    id: "ambiguity-edge-cases",
    scenario:
      "Annotators encounter ambiguous cases and edge conditions, but there is no process to escalate questions, resolve disagreements, or update guidance.",
    choices: [
      "Provide an escalation and resolution process for ambiguity/edge cases, document decisions, and update guidelines accordingly",
      "Force a label choice without guidance or review",
      "Discard difficult cases without tracking their impact",
    ],
    best: 0,
    assurance: "Handling ambiguity and edge cases",
    feedback:
      "Assurance includes structured handling of ambiguity and edge cases, with documented resolutions that improve guidance and data quality over time.",
  },
  {
    id: "qa-feedback-evidence",
    scenario:
      "Labeled datasets are used in models without quality audits, feedback loops, or evidence of how labeling issues are detected and corrected.",
    choices: [
      "Conduct quality reviews/audits, provide feedback loops, correct issues, and maintain evidence of labeling quality and governance",
      "Assume labels are correct once collected",
      "Fix labeling issues only when model performance drops, without tracing causes",
    ],
    best: 0,
    assurance: "Quality audits, feedback, and evidence",
    feedback:
      "Ongoing QA, feedback loops, and traceable corrections provide evidence that labeled data is governed and improved, supporting more reliable AI outcomes.",
  },
];

export function dataLabelingQualityAssuranceScore(answers: Record<string, number>) {
  const done = DATA_LABELING_QUALITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_LABELING_QUALITY_ASSURANCE_ROUNDS.length,
  };
}
