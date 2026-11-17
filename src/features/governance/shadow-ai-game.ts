export type ShadowAiRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SHADOW_AI_ROUNDS: ShadowAiRound[] = [
  {
    id: "survey-only",
    scenario:
      "The quarterly survey reports zero unsanctioned AI use, while the network logs show several consumer AI assistants in daily use.",
    choices: [
      "Find unsanctioned tools through network, spend and identity signals rather than relying on self-reporting",
      "Send a reminder that the survey must be answered accurately",
      "Block the assistants that appear in the logs and close the finding",
    ],
    best: 0,
    assurance: "Signal-based discovery",
    feedback:
      "Shadow AI is invisible by design: find it through network, spend and identity signals instead of asking people to report themselves.",
  },
  {
    id: "harder-sanctioned-route",
    scenario:
      "The approved assistant requires a ticket, a two-week approval and a restricted prompt window, so a team uses a free consumer tool to get the work done.",
    choices: [
      "Make the sanctioned route genuinely easier than the workaround, and remove the friction that caused the detour",
      "Enforce the policy with a warning to the team",
      "Allow the consumer tool temporarily and review the approval process next year",
    ],
    best: 0,
    assurance: "Viable sanctioned alternative",
    feedback:
      "People route around controls that cost them more than they save: make the sanctioned route easier than the workaround.",
  },
  {
    id: "data-egress",
    scenario:
      "An unsanctioned tool is pasting customer records into a free chat window, and nobody can say what leaves the network.",
    choices: [
      "Limit what tools can reach with egress and data controls, and check what already left",
      "Ask the team to stop pasting customer data into the tool",
      "Remove the tool from the allow-list and rely on people noticing",
    ],
    best: 0,
    assurance: "Bounded data exposure",
    feedback:
      "A policy cannot un-send data: limit egress and data reach, then establish what has already left.",
  },
  {
    id: "punish-disclosure",
    scenario:
      "A team discloses that it has been using an unapproved tool for months, and the first response is to escalate it as a disciplinary matter.",
    choices: [
      "Offer an amnesty route so disclosure is safe, then record a disposition for the tool",
      "Escalate the disclosure so it deters others from the same choice",
      "Accept the disclosure quietly and leave the tool in place",
    ],
    best: 0,
    assurance: "Safe disclosure",
    feedback:
      "Punishing disclosure teaches concealment: offer amnesty so people surface tools, and record a disposition for each one.",
  },
  {
    id: "no-disposition",
    scenario:
      "A shadow tool is discovered, discussed in a meeting and then forgotten, so nobody knows whether it is allowed, contained or retired.",
    choices: [
      "Record a disposition for every tool found — sanction, contain or retire — with an owner and a date",
      "Leave it in place as long as no incident is reported",
      "Add it to the inventory list and decide at the next review",
    ],
    best: 0,
    assurance: "Closed disposition",
    feedback:
      "Discovery without disposition is just a longer list: record sanction, contain or retire for each tool with an owner and a date.",
  },
];

export function shadowAiScore(answers: Record<string, number>) {
  const done = SHADOW_AI_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SHADOW_AI_ROUNDS.length,
  };
}
