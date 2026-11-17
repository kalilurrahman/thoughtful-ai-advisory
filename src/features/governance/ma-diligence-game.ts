export type MaDiligenceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MA_DILIGENCE_ROUNDS: MaDiligenceRound[] = [
  {
    id: "data-room-only",
    scenario:
      "The data room lists two AI vendors, while engineering confirms four more tools in active use that procurement never saw.",
    choices: [
      "Build the inventory from how the business actually operates, including team-level subscriptions",
      "Rely on the data room list and add a warranty about undisclosed tools",
      "Accept the difference because the extra tools are low cost",
    ],
    best: 0,
    assurance: "Inventory from real operations",
    feedback:
      "The data room records what someone remembered to disclose: walk the actual tooling and data flows before you price the deal.",
  },
  {
    id: "change-of-control",
    scenario:
      "The target's main model contract can be terminated on a change of control, and the clause is found after signing.",
    choices: [
      "Review contracts, licences and change-of-control rights before signing, with a plan if consent is refused",
      "Assume the vendor will behave reasonably once the deal closes",
      "Add the risk to the integration budget and continue",
    ],
    best: 0,
    assurance: "Contract transfer reviewed",
    feedback:
      "A model contract that ends at completion removes the capability you just paid for: check change-of-control and termination rights before signing.",
  },
  {
    id: "unrecorded-inquiry",
    scenario:
      "A regulator asked the target about its credit-scoring model last year, and the answer was given informally and never recorded.",
    choices: [
      "Check past incidents, complaints, regulator contact and open disputes, and record what is found",
      "Treat an informal conversation as not reportable and move on",
      "Ask the target's counsel for a verbal assurance of no issues",
    ],
    best: 0,
    assurance: "Liability checked",
    feedback:
      "Inherited regulator contact is inherited liability: check the record, including informal exchanges, before completion.",
  },
  {
    id: "training-rights",
    scenario:
      "The target trained a model on customer data under a licence that does not transfer to a buyer.",
    choices: [
      "Confirm data rights transfer with consents and residency respected, or plan to retrain",
      "Keep the model and assume the customers will not notice the change of owner",
      "Retrain later using the same data because it is already in the warehouse",
    ],
    best: 0,
    assurance: "Data rights transfer",
    feedback:
      "Data rights do not travel with the model: confirm transfer and consents, or plan and cost the retraining before signing.",
  },
  {
    id: "day-one-gap",
    scenario:
      "On completion the target's fraud model loses a data feed supplied by the seller's group, and detection drops for a week.",
    choices: [
      "Write an integration or separation plan naming owners, timelines and what must keep running on day one",
      "Let the integration team resolve dependencies once the deal is announced",
      "Switch the model off for a week to avoid bad decisions",
    ],
    best: 0,
    assurance: "Day-one continuity planned",
    feedback:
      "Completion is a change of dependencies, not just ownership: plan what must keep running on day one, with named owners.",
  },
];

export function maDiligenceScore(answers: Record<string, number>) {
  const done = MA_DILIGENCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MA_DILIGENCE_ROUNDS.length,
  };
}
