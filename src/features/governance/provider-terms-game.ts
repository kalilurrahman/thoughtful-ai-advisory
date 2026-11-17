export type ProviderTermsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PROVIDER_TERMS_ROUNDS: ProviderTermsRound[] = [
  {
    id: "silent-subprocessor",
    scenario:
      "A provider adds a new subprocessor in another region, announced only in a changelog nobody on the team reads.",
    choices: [
      "Register subprocessors, route provider notices to a named owner, and assess the change against your data commitments",
      "Rely on the provider's account team to email anything important",
      "Assume subprocessors are covered because the contract allows them",
    ],
    best: 0,
    assurance: "Notices with an owner",
    feedback:
      "Contract permission is not assurance: register subprocessors, route notices to a named owner, and assess each change against your data commitments.",
  },
  {
    id: "model-card-shift",
    scenario:
      "The model behind a hosted endpoint is updated, and the published model card now lists a different evaluation set and new limitations.",
    choices: [
      "Re-read the model card, re-run your evaluations, and record whether the assurance case still holds",
      "Keep the previous model card on file because the endpoint name is unchanged",
      "Accept the update because the API version did not change",
    ],
    best: 0,
    assurance: "Re-validated assumptions",
    feedback:
      "An unchanged endpoint name can hide a changed model: re-read the card, re-run your evaluations, and record whether the assurance case still holds.",
  },
  {
    id: "terms-vs-use",
    scenario:
      "New provider terms restrict using outputs to train competing models, and the team has been feeding outputs into an internal training pipeline.",
    choices: [
      "Treat the term change as a compliance event: stop the conflicting use, assess exposure, and update the assurance case",
      "Continue until legal confirms the restriction applies to you",
      "Anonymise the outputs and keep training",
    ],
    best: 0,
    assurance: "Terms against actual use",
    feedback:
      "Terms bind the use you actually have, not the use you assumed: stop the conflict, assess exposure, and update the assurance case.",
  },
  {
    id: "no-exit",
    scenario:
      "A provider raises prices and tightens data-retention terms, and the team discovers the integration cannot move without a rewrite nobody has scoped.",
    choices: [
      "Test a fallback before it is needed, and keep the exit path and its cost recorded alongside the dependency",
      "Accept the terms because switching is too expensive to consider",
      "Start an emergency rewrite once the new terms take effect",
    ],
    best: 0,
    assurance: "Tested exit path",
    feedback:
      "A fallback you have never tested is a hope: test it before it is needed and keep the exit cost recorded alongside the dependency.",
  },
];

export function providerTermsScore(answers: Record<string, number>) {
  const done = PROVIDER_TERMS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PROVIDER_TERMS_ROUNDS.length,
  };
}
