export type EDiscoveryRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EDISCOVERY_ROUNDS: EDiscoveryRound[] = [
  {
    id: "late-hold",
    scenario:
      "A dispute is notified, but the legal hold only covers shared drives. Team chat, personal devices and a departing employee's mailbox are wiped on normal retention schedules.",
    choices: [
      "Issue and monitor legal holds across every system and device where relevant data lives before it is lost",
      "Send a reminder asking staff to keep anything relevant in their own folders",
      "Rely on backups because the data can be restored if it is ever needed",
    ],
    best: 0,
    assurance: "Preservation",
    feedback:
      "Preservation has to reach the places data actually sits: holds should be issued and monitored across messaging, devices and departing staff before retention deletes the record.",
  },
  {
    id: "trusted-model",
    scenario:
      "An AI review tool codes a million documents as non-responsive, and the team produces the set without sampling the documents the model excluded.",
    choices: [
      "Validate and sample AI-assisted review, including documents the model excluded, before producing",
      "Accept the model output because the vendor advertises high accuracy",
      "Re-review only the documents flagged as highly relevant",
    ],
    best: 0,
    assurance: "Review validation",
    feedback:
      "Unsampled AI review cannot be defended: validate the review, including what the model left out, before producing a set.",
  },
  {
    id: "unexplained-coding",
    scenario:
      "Opposing counsel asks how documents were classified as irrelevant, and nobody can explain what the model did or which criteria drove the outcome.",
    choices: [
      "Be able to explain and defend how the model classified documents, including the criteria used",
      "Say the tool is proprietary and the vendor does not disclose its method",
      "Provide the final responsive set and let the set speak for itself",
    ],
    best: 0,
    assurance: "Explainability",
    feedback:
      "A black box is hard to defend: keep enough understanding of the model's criteria and behaviour to explain classification decisions under challenge.",
  },
  {
    id: "auto-privilege",
    scenario:
      "The AI tool automatically withholds documents it scores as privileged, and privileged material slips into the produced set with no lawyer having reviewed the call.",
    choices: [
      "Keep privilege and confidentiality decisions with qualified people and log who decided what",
      "Tighten the model's privilege threshold and re-run the export",
      "Withhold everything the model scores above a low threshold to be safe",
    ],
    best: 0,
    assurance: "Privilege decisions",
    feedback:
      "Privilege is a legal judgement: qualified people should make and log those calls rather than leaving them to a score threshold.",
  },
  {
    id: "unreproducible-set",
    scenario:
      "A production is challenged, but the team cannot reconstruct which documents were included, what changed between versions or how defects were handled.",
    choices: [
      "Keep what is needed to reconstruct produced sets, disclose defects and show how they were fixed",
      "Rebuild the production from scratch and hope it matches the earlier one",
      "Provide the current export and describe earlier versions as superseded",
    ],
    best: 0,
    assurance: "Reproducibility & defensibility",
    feedback:
      "Productions get challenged: preserve enough to reconstruct what was produced, disclose defects openly and show the correction.",
  },
];

export function eDiscoveryScore(answers: Record<string, number>) {
  const done = EDISCOVERY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EDISCOVERY_ROUNDS.length,
  };
}
