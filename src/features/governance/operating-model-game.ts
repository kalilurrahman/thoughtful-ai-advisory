export type OperatingModelRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OPERATING_MODEL_ROUNDS: OperatingModelRound[] = [
  {
    id: "who-decides",
    scenario:
      "A high-risk use case is ready to launch, and three groups each believe someone else approves it, so it waits six weeks.",
    choices: [
      "Publish decision rights for this class of use case, name the deciding forum, and set a turnaround commitment",
      "Escalate to the most senior person available and let them decide",
      "Launch and formalise approval once the governance model is clearer",
    ],
    best: 0,
    assurance: "Decision rights",
    feedback:
      "Ambiguous authority creates delay: publish decision rights for the use case class, name the deciding forum, and commit to a turnaround so work does not stall.",
  },
  {
    id: "paper-forum",
    scenario:
      "The AI governance forum exists on an org chart, but it has not met in five months and has no quorum or decision log.",
    choices: [
      "Re-charter the forum with a cadence, quorum and decision log, or retire it and move decisions somewhere that meets",
      "Keep the forum listed so the organisation has a named body",
      "Replace it with ad hoc meetings between the same people",
    ],
    best: 0,
    assurance: "Forum operation",
    feedback:
      "A forum that never meets is a fiction: re-charter it with cadence, quorum and a decision log, or retire it and place decisions where they actually happen.",
  },
  {
    id: "escalation-black-hole",
    scenario:
      "Escalations are raised regularly but disappear into a queue with no owner, no response time, and no visibility for the requester.",
    choices: [
      "Assign escalation ownership, set response commitments, and give requesters visibility of status and outcome",
      "Tell teams to escalate less often so the queue shrinks",
      "Route all escalations to the governance lead's inbox",
    ],
    best: 0,
    assurance: "Escalation turnaround",
    feedback:
      "An escalation route without ownership is a dead end: assign owners, set response commitments, and give requesters visibility of status and outcome.",
  },
  {
    id: "model-not-fit",
    scenario:
      "The operating model was designed for a handful of pilots, and it is now expected to cover autonomous agents, vendors and hundreds of use cases.",
    choices: [
      "Review the operating model against the current estate, adjust tiers and delegations, and record the approved change",
      "Keep the original model so decisions stay consistent across the estate",
      "Add more members to the same forum to absorb the volume",
    ],
    best: 0,
    assurance: "Operating model fit",
    feedback:
      "Operating models scale or break: review against the current estate, adjust tiers and delegations, and record the approved change instead of stretching a pilot-era model.",
  },
];

export function operatingModelScore(answers: Record<string, number>) {
  const done = OPERATING_MODEL_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OPERATING_MODEL_ROUNDS.length,
  };
}
