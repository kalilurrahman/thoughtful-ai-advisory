export type EthicalValuesAlignmentAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ETHICAL_VALUES_ALIGNMENT_ASSURANCE_ROUNDS: EthicalValuesAlignmentAssuranceRound[] = [
  {
    id: "principles-defined",
    scenario:
      "A team adopts AI capabilities without clear organizational principles or values to guide acceptable use, boundaries, and decision-making.",
    choices: [
      "Define and communicate AI principles/values and acceptable-use boundaries, with ownership for applying them in decisions",
      "Assume everyone shares the same ethical expectations without stating them",
      "Rely only on technical performance goals to guide AI use",
    ],
    best: 0,
    assurance: "Defined principles and boundaries",
    feedback:
      "Values alignment assurance starts with clear, communicated principles and boundaries so teams have shared guidance for responsible AI decisions.",
  },
  {
    id: "use-case-assessment",
    scenario:
      "A proposed AI use case may create stakeholder harms or conflicts with stated values, but it is evaluated only for feasibility and business benefit.",
    choices: [
      "Assess use cases against principles/values and potential stakeholder impacts, and decide whether to proceed, modify, or decline",
      "Proceed if the use case is technically feasible and profitable",
      "Defer ethical considerations until after deployment",
    ],
    best: 0,
    assurance: "Values-aligned use-case assessment",
    feedback:
      "Assurance includes evaluating use cases against stated principles and stakeholder impacts, not just feasibility or benefit, before and during deployment.",
  },
  {
    id: "tradeoff-transparency",
    scenario:
      "Competing values or trade-offs arise (e.g., efficiency vs. care, automation vs. oversight), but decisions are made without transparent reasoning or consultation.",
    choices: [
      "Address trade-offs transparently with appropriate consultation, document reasoning and mitigations, and assign accountability",
      "Choose the fastest option without discussing trade-offs",
      "Avoid documenting trade-offs to reduce scrutiny",
    ],
    best: 0,
    assurance: "Transparent handling of trade-offs",
    feedback:
      "Responsible governance requires transparent consideration of value trade-offs, documented reasoning and mitigations, and clear accountability for decisions.",
  },
  {
    id: "concern-review-evidence",
    scenario:
      "Ethical concerns are raised about an AI system, but there is no clear process to review, respond, track outcomes, or evidence improvements.",
    choices: [
      "Provide channels to raise concerns, review and respond with accountable owners, track outcomes, and maintain evidence of actions and learning",
      "Dismiss concerns that do not map to a specific rule violation",
      "Handle concerns informally with no records or follow-up",
    ],
    best: 0,
    assurance: "Concern review and evidence-backed learning",
    feedback:
      "Ethical assurance includes accessible ways to raise concerns, accountable review and response, and evidence-backed follow-up and learning over time.",
  },
];

export function ethicalValuesAlignmentAssuranceScore(answers: Record<string, number>) {
  const done = ETHICAL_VALUES_ALIGNMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ETHICAL_VALUES_ALIGNMENT_ASSURANCE_ROUNDS.length,
  };
}
