export type IncentiveRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INCENTIVE_ROUNDS: IncentiveRound[] = [
  {
    id: "target-vs-gate",
    scenario:
      "A sales team's AI proposal tool has a mandatory review gate, but the quarter ends Friday and the team has found a way to submit without the review.",
    choices: [
      "Map the incentive conflict, make the gate unbypassable for high-risk proposals, and report the pressure rather than the workaround",
      "Leave the gate as guidance and trust teams to use judgement under pressure",
      "Remove the gate so the process matches how work actually happens",
    ],
    best: 0,
    assurance: "Controls that survive pressure",
    feedback:
      "A gate that can be bypassed at quarter end is not a gate: map the conflict, make it unbypassable where risk is high, and report the pressure.",
  },
  {
    id: "volume-only",
    scenario:
      "An AI support assistant is measured only on tickets closed per hour, and the team has learned to accept the model's first answer to keep the number up.",
    choices: [
      "Pair the throughput measure with quality and safety indicators such as reopens, corrections and escalations",
      "Keep the throughput measure because it is the one leadership understands",
      "Add a second throughput target for resolution speed",
    ],
    best: 0,
    assurance: "Balanced measures",
    feedback:
      "What is measured is what gets optimised: pair throughput with reopens, corrections and escalations so speed cannot be won by cutting quality.",
  },
  {
    id: "flagged-pressure",
    scenario:
      "An analyst flags that a manager keeps asking for model outputs to be edited before they reach the risk committee, and the analyst is moved off the account.",
    choices: [
      "Treat the flag as protected, investigate the pressure to present edited outputs, and record the outcome",
      "Reassign the analyst again to keep the team stable",
      "Ask the manager to confirm in writing that no editing happened",
    ],
    best: 0,
    assurance: "Safe escalation",
    feedback:
      "If flagging pressure costs someone their role, nobody will flag it: protect the reporter, investigate the practice, and record the outcome.",
  },
  {
    id: "cost-per-call",
    scenario:
      "A cost-per-call target is driving teams to shorten prompts and skip the retrieval step that made answers accurate.",
    choices: [
      "Make the trade-off explicit: measure cost against quality, and set the efficiency target where accuracy still clears the bar",
      "Keep the cost target and let each team decide how much accuracy to trade away",
      "Remove cost targets so quality can never be traded",
    ],
    best: 0,
    assurance: "Explicit trade-offs",
    feedback:
      "Efficiency targets silently spend accuracy: measure cost against quality and set the target where accuracy still clears the bar.",
  },
];

export function incentiveAlignmentScore(answers: Record<string, number>) {
  const done = INCENTIVE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INCENTIVE_ROUNDS.length,
  };
}
