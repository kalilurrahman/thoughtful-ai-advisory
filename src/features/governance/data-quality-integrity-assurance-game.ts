export type DataQualityIntegrityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_QUALITY_INTEGRITY_ASSURANCE_ROUNDS: DataQualityIntegrityAssuranceRound[] = [
  {
    id: "unknown-provenance",
    scenario:
      "Training and evaluation data has no clear source, version, or collection date, and no one can say whether it still represents current conditions.",
    choices: [
      "Establish data lineage and metadata (source, version, collection date, permissions) and validate that datasets still represent current conditions before use",
      "Use the data because it exists and was once useful",
      "Delete the data and hope a replacement appears",
    ],
    best: 0,
    assurance: "Data lineage and metadata",
    feedback:
      "Quality starts with knowing the data: lineage, version, collection date, and permissions let you judge whether a dataset fits the task and remains current.",
  },
  {
    id: "label-noise",
    scenario:
      "Ground-truth labels contain conflicting or outdated values, and errors are concentrated in the groups the model is meant to serve.",
    choices: [
      "Audit labels with representative sampling and adjudication, measure error rates by group, and correct or quarantine unreliable labels before training",
      "Train on all labels and treat disagreements as model error",
      "Drop the affected records without checking what is lost",
    ],
    best: 0,
    assurance: "Ground-truth quality",
    feedback:
      "Labels are part of the system: sample and adjudicate them, measure errors by group, and fix or quarantine unreliable ground truth rather than passing noise into the model.",
  },
  {
    id: "data-health",
    scenario:
      "Missing values, duplicates, and schema changes appear in production inputs, and no one watches how these affect model behaviour.",
    choices: [
      "Monitor data health (completeness, duplication, schema, distribution) with thresholds and route changes into review before they degrade decisions",
      "Handle each problem manually when someone notices",
      "Assume the model will detect bad inputs on its own",
    ],
    best: 0,
    assurance: "Data health monitoring",
    feedback:
      "Production data changes: monitor completeness, duplication, schema, and distribution, with thresholds that trigger review before quality issues become decision failures.",
  },
  {
    id: "remediation-evidence",
    scenario:
      "A bad dataset was identified and replaced, but no record shows what was wrong, who approved the replacement, or whether affected outputs were reviewed.",
    choices: [
      "Record the issue, root cause, approved replacement, and review of affected outputs, and keep the remediation evidence with the dataset version",
      "Keep the fix informal so it can be adjusted later without paperwork",
      "Retrain silently and treat the earlier version as if it never existed",
    ],
    best: 0,
    assurance: "Remediation evidence",
    feedback:
      "Data fixes are control actions: document the issue, root cause, approved replacement, and review of affected outputs so quality decisions are traceable and repeatable.",
  },
];

export function dataQualityIntegrityAssuranceScore(answers: Record<string, number>) {
  const done = DATA_QUALITY_INTEGRITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_QUALITY_INTEGRITY_ASSURANCE_ROUNDS.length,
  };
}
