export type BoardOversightRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const BOARD_OVERSIGHT_ROUNDS: BoardOversightRound[] = [
  {
    id: "no-agenda-slot",
    scenario:
      "AI appears in the annual strategy deck but never on a board agenda, and no executive is named as accountable for it.",
    choices: [
      "Put AI on the board agenda on a fixed cadence with a named executive owner and a standing risk report",
      "Wait until something goes wrong and then convene a special session",
      "Delegate all AI oversight to the engineering team and report only at year end",
    ],
    best: 0,
    assurance: "Scheduled board attention",
    feedback:
      "Oversight that only reacts to incidents is not oversight: put AI on the agenda on a fixed cadence, with a named executive owner and a standing risk report.",
  },
  {
    id: "good-news-pack",
    scenario:
      "The board pack shows adoption and value metrics, but the incident log, failed evaluations and open control gaps are left out.",
    choices: [
      "Report risk, incidents and failures alongside value, with the same rigour and the same cadence",
      "Keep the pack positive so the board stays supportive of the programme",
      "Include failures only when a regulator or journalist is likely to find them",
    ],
    best: 0,
    assurance: "Candid board reporting",
    feedback:
      "A board cannot govern what it is not told: report risk, incidents and failures alongside value, with the same rigour and cadence.",
  },
  {
    id: "silent-approval",
    scenario:
      "A director challenges an AI risk claim in the meeting, the executive answers, and the minutes record only that the paper was noted.",
    choices: [
      "Minute the challenge, the response and any dissent so the debate and its reasoning survive",
      "Keep minutes brief and record only decisions to avoid creating discoverable material",
      "Ask the director to raise concerns privately with the executive afterwards",
    ],
    best: 0,
    assurance: "Recorded challenge",
    feedback:
      "Minutes are the evidence of oversight: record the challenge, the response and any dissent so the debate and its reasoning survive.",
  },
  {
    id: "decision-drift",
    scenario:
      "The board asked for an independent review of a high-risk system and a pause on expansion; six months later nothing has been reported back.",
    choices: [
      "Track board decisions in a log with owners, due dates and a standing follow-up item at the next meeting",
      "Assume the executive team is handling it unless someone raises it again",
      "Re-take the same decision at the next meeting with a fresh paper",
    ],
    best: 0,
    assurance: "Decision follow-through",
    feedback:
      "A decision without follow-through is a suggestion: track board decisions with owners and due dates, and report back at the next meeting.",
  },
];

export function boardOversightScore(answers: Record<string, number>) {
  const done = BOARD_OVERSIGHT_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === BOARD_OVERSIGHT_ROUNDS.length,
  };
}
