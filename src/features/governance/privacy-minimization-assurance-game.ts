export type PrivacyMinimizationAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PRIVACY_MINIMIZATION_ASSURANCE_ROUNDS: PrivacyMinimizationAssuranceRound[] = [
  {
    id: "collection-minimization",
    scenario:
      "A customer intake form for an AI support assistant asks for full address, date of birth, and account history even though the task only needs an account reference and the question text.",
    choices: [
      "Collect only the personal data the stated purpose needs, remove optional fields, and record the minimization decision before launch",
      "Keep every field in case a future feature needs it",
      "Rely on publishing a privacy notice to justify collecting extra data",
    ],
    best: 0,
    assurance: "Data minimization at collection",
    feedback:
      "Minimization is a design decision: collect the least personal data that achieves the stated purpose, and document why each retained field is necessary.",
  },
  {
    id: "prompt-redaction",
    scenario:
      "Staff copy complete customer records — names, contact details, and case notes — into an external AI assistant to draft replies, with no restriction, logging, or review.",
    choices: [
      "Minimize and redact or pseudonymize personal data before it leaves the organisation, limit what may be pasted, and log and monitor these transmissions",
      "Allow full records to be pasted because the provider is reputable",
      "Ask staff to be careful, with no controls, logging, or review",
    ],
    best: 0,
    assurance: "Minimization before third-party processing",
    feedback:
      "Sending personal data to an external model is processing: minimize and redact inputs, apply contractual and technical controls, and keep evidence of what was transmitted.",
  },
  {
    id: "purpose-creep",
    scenario:
      "Support transcripts collected to improve service quality are reused to train a new model that drives a different customer-facing decision, without any review.",
    choices: [
      "Run a purpose-limitation and minimization review first, confirm the reuse is compatible or re-establish a basis, notify affected users, and minimize what is reused",
      "Reuse the transcripts freely because the organisation already holds them",
      "Remove names only and treat the rest as free to use for any purpose",
    ],
    best: 0,
    assurance: "Purpose limitation on secondary use",
    feedback:
      "Holding data for one purpose does not licence any other use: secondary use needs a compatibility or new basis review, minimization, and a clear notice to affected people.",
  },
  {
    id: "minimization-evidence",
    scenario:
      "No one can show which personal data fields each AI feature actually uses, so minimization claims cannot be evidenced when a customer or auditor asks.",
    choices: [
      "Maintain a data inventory and field-level data-flow map for AI features, with periodic minimization reviews recorded as evidence",
      "Assume minimization is met because retention rules already exist",
      "Wait until an incident or audit request prompts a review",
    ],
    best: 0,
    assurance: "Evidence of minimization review",
    feedback:
      "Assurance needs evidence: a maintained inventory and data-flow map, plus recorded periodic reviews, show which fields are used, retained, and shared — and which are not needed.",
  },
];

export function privacyMinimizationAssuranceScore(answers: Record<string, number>) {
  const done = PRIVACY_MINIMIZATION_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PRIVACY_MINIMIZATION_ASSURANCE_ROUNDS.length,
  };
}
