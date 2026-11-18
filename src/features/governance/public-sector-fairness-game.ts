export type PublicSectorFairnessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PUBLIC_SECTOR_FAIRNESS_ROUNDS: PublicSectorFairnessRound[] = [
  {
    id: "vendor-policy",
    scenario:
      "A vendor-configured risk score starts shaping which housing applications are inspected, and no published policy explains the automated element.",
    choices: [
      "Set out the legal basis and published policy for the automated element, with the version used recorded",
      "Add the scoring to the internal procedure manual and continue",
      "Ask the vendor to describe the model in a short appendix",
    ],
    best: 0,
    assurance: "Legal basis & policy",
    feedback:
      "People are entitled to know the basis on which an automated element shapes a public decision: publish the policy and record the version used so decisions can be reconstructed.",
  },
  {
    id: "no-human-review",
    scenario:
      "The score automatically deprioritises a benefit claim and no officer sees it before the delay takes effect.",
    choices: [
      "Have a human with the authority to change the outcome review before the decision takes effect",
      "Let the claimant request a manual review after the delay has already happened",
      "Have an officer audit a random sample of deprioritised claims each month",
    ],
    best: 0,
    assurance: "Human authority",
    feedback:
      "Review after the harm is not review: someone with the authority to change the outcome should look before the decision takes effect.",
  },
  {
    id: "no-reasons",
    scenario:
      "The decision letter says the application was unsuccessful and gives no reason a person could understand or challenge.",
    choices: [
      "Tell the person plainly what was decided and why, in language they can act on",
      "Add the case reference and a link to the full policy",
      "Explain the reasons only if the person asks for a statement of reasons",
    ],
    best: 0,
    assurance: "Reasons given",
    feedback:
      "A decision someone cannot understand is a decision they cannot challenge: give plain reasons at the point of decision.",
  },
  {
    id: "theoretical-appeal",
    scenario:
      "An appeal route exists on paper: a phone line open ten hours a week, no acknowledgement, and an eight-week wait.",
    choices: [
      "Provide notice of the appeal route and make it genuinely usable, with acknowledgement and timescales",
      "Keep the route and add an online form for people who cannot call",
      "Extend the phone line to twenty hours a week during peak periods",
    ],
    best: 0,
    assurance: "Effective appeal",
    feedback:
      "An appeal route that is hard to reach, unacknowledged or slow is not effective: notice and usability are part of the safeguard.",
  },
  {
    id: "objective-model",
    scenario:
      "Monitoring shows approvals lower for one group on the same facts, and the team replies that the model is objective because it does not use protected characteristics.",
    choices: [
      "Investigate disparate impact on the same facts and act on what the monitoring shows",
      "Remove the monitoring because it uses protected characteristics to compare groups",
      "Add a note to the model card saying the model is statistically neutral",
    ],
    best: 0,
    assurance: "Disparate impact monitoring",
    feedback:
      "Not using a characteristic does not prevent disparate impact: compare outcomes across groups on the same facts and act on the result.",
  },
];

export function publicSectorFairnessScore(answers: Record<string, number>) {
  const done = PUBLIC_SECTOR_FAIRNESS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PUBLIC_SECTOR_FAIRNESS_ROUNDS.length,
  };
}
