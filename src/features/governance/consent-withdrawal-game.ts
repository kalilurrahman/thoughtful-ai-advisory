export type ConsentWithdrawalRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONSENT_WITHDRAWAL_ROUNDS: ConsentWithdrawalRound[] = [
  {
    id: "deleted-source-kept-embedding",
    scenario:
      "A customer withdraws consent, the source record is deleted, and the embedding generated from it stays in the vector index.",
    choices: [
      "Treat derived artifacts as in scope and remove the embedding, its cache entries and any evaluation copies",
      "Leave the embedding because it is not the original personal data",
      "Delete the whole index and rebuild it from remaining records",
    ],
    best: 0,
    assurance: "Derived artifacts in scope",
    feedback:
      "An embedding derived from withdrawn data is still derived from withdrawn data: inventory and remove the derived artifacts, not only the source row.",
  },
  {
    id: "no-window",
    scenario:
      "The privacy notice says withdrawals are honoured promptly, and nobody can say how long propagation to every store actually takes.",
    choices: [
      "State a removal window you can meet, measure propagation against it, and report exceptions",
      "Keep the wording vague so any delay is still compliant",
      "Remove from the primary store immediately and stop tracking the rest",
    ],
    best: 0,
    assurance: "Stated and measured window",
    feedback:
      "A withdrawal without a measured window is an intention: state the window, measure propagation against it, and report exceptions.",
  },
  {
    id: "processor-silent",
    scenario:
      "A withdrawal is sent to a model provider by email and no confirmation is ever received or followed up.",
    choices: [
      "Notify downstream processors, require confirmation, and record the response against the withdrawal",
      "Assume the provider acted because the email was delivered",
      "Stop using the provider for new data while leaving prior copies in place",
    ],
    best: 0,
    assurance: "Confirmed downstream removal",
    feedback:
      "A delivered email is not a removal: require confirmation from each processor and record it against the withdrawal.",
  },
  {
    id: "no-evidence",
    scenario:
      "A regulator asks for proof that a specific withdrawal was actioned six months ago, and only a ticket closure remains.",
    choices: [
      "Record per-withdrawal evidence: what was removed, from where, by whom and when",
      "Show the ticket as evidence that the request was handled",
      "Re-run the removal now and present it as the original action",
    ],
    best: 0,
    assurance: "Per-withdrawal evidence",
    feedback:
      "A closed ticket shows intent, not effect: record what was removed, from where, by whom and when for each withdrawal.",
  },
  {
    id: "reuse-after-withdrawal",
    scenario:
      "A quarterly dataset refresh pulls from an archive that still contains records whose consent was withdrawn last year.",
    choices: [
      "Check consent state at the point of reuse so withdrawn records cannot re-enter a dataset",
      "Rely on the archive owner to have removed withdrawn records",
      "Add the withdrawn records and remove them again at the next refresh",
    ],
    best: 0,
    assurance: "Consent checked before reuse",
    feedback:
      "Removal without a reuse check is undone by the next pipeline: verify consent state at the point data is reused.",
  },
];

export function consentWithdrawalScore(answers: Record<string, number>) {
  const done = CONSENT_WITHDRAWAL_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONSENT_WITHDRAWAL_ROUNDS.length,
  };
}
