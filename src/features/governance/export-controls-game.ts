export type ExportControlsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EXPORT_CONTROLS_ROUNDS: ExportControlsRound[] = [
  {
    id: "reseller-screening",
    scenario:
      "A reseller in a higher-risk jurisdiction wants API access for 'general research' and says it will handle customer screening itself.",
    choices: [
      "Screen the end users yourself and apply end-use and end-user restrictions in the contract",
      "Accept the reseller's assurance and rely on the contract clause it offers",
      "Grant access but cap usage so the volume stays below reporting thresholds",
    ],
    best: 0,
    assurance: "Sanctions screening",
    feedback:
      "Screening cannot be delegated to the party you are selling to: screen the end users and enforce end-use and end-user restrictions yourself.",
  },
  {
    id: "open-weights",
    scenario:
      "A fine-tune with strong offensive-security capability is about to be published with open weights because the base model was open.",
    choices: [
      "Classify the capability against export control and dual-use lists before deciding how to release it",
      "Publish it because the base model's licence already allows redistribution",
      "Publish it with a responsible-use notice and a request not to misuse it",
    ],
    best: 0,
    assurance: "Capability classification",
    feedback:
      "A fine-tune can carry capability the base model did not: classify the capability before choosing whether weights can be released openly.",
  },
  {
    id: "no-end-use",
    scenario:
      "A customer asks for audit logging to be switched off 'for privacy' and declines to say what the model will be used for.",
    choices: [
      "Treat it as a red flag, refuse the change and escalate for review",
      "Disable logging for that tenant and keep the contract otherwise unchanged",
      "Keep logging but stop showing the customer the logs",
    ],
    best: 0,
    assurance: "Red flags",
    feedback:
      "Requests to remove visibility and avoid stating end use are red flags: refuse, escalate and record the decision.",
  },
  {
    id: "near-match",
    scenario:
      "Automated screening clears a customer whose name is a near-match for a listed party and whose owner is not checked.",
    choices: [
      "Test screening for near-matches and ownership, including resellers and beneficial owners",
      "Rely on the exact-match result because it is what the screening vendor returns",
      "Add a manual check only for customers above a spend threshold",
    ],
    best: 0,
    assurance: "Screening quality",
    feedback:
      "Exact-match screening misses near-matches and ownership links: test the screening against both, including resellers and beneficial owners.",
  },
  {
    id: "unrecorded-refusal",
    scenario:
      "A request was refused last quarter but nobody can show who refused it, on what basis, or what was declined.",
    choices: [
      "Record refusals and escalations with the reason and the decision maker",
      "Log the refusal in the sales pipeline as a lost opportunity",
      "Ask the account team to reconstruct the decision from their emails",
    ],
    best: 0,
    assurance: "Refusal records",
    feedback:
      "A regulator may ask what you declined and why: record refusals and escalations with the reason and the decision maker.",
  },
];

export function exportControlsScore(answers: Record<string, number>) {
  const done = EXPORT_CONTROLS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EXPORT_CONTROLS_ROUNDS.length,
  };
}
