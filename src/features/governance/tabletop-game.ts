export type TabletopRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TABLETOP_ROUNDS: TabletopRound[] = [
  {
    id: "outage-only",
    scenario:
      "The annual AI tabletop is another outage drill: nobody rehearses a biased hiring model, a harmful chatbot reply or a supplier silently changing model behaviour.",
    choices: [
      "Build scenarios from your real AI failure modes, including bias, harmful output, data exposure and supplier change",
      "Add one AI question to the existing outage drill",
      "Skip AI scenarios until a real AI incident gives you material",
    ],
    best: 0,
    assurance: "Relevant scenarios",
    feedback:
      "An outage drill does not rehearse AI harm: build scenarios from bias, harmful output, data exposure and supplier change.",
  },
  {
    id: "engineering-only",
    scenario:
      "The exercise is run by engineering for engineering; legal, communications and the business owner hear about the outcome afterwards.",
    choices: [
      "Include engineering, the business owner, legal and communications in the exercise so decisions are tested together",
      "Have engineering write a report and circulate it to the others",
      "Invite legal as an observer so they do not slow the exercise down",
    ],
    best: 0,
    assurance: "Cross-functional rehearsal",
    feedback:
      "AI failures are decided across functions: include the business owner, legal and communications so the decisions are tested together.",
  },
  {
    id: "one-off",
    scenario:
      "A tabletop ran once before launch, produced a long list of gaps, and has not run since; the last real incident has never been used as material.",
    choices: [
      "Run on a regular cadence and reuse the last real incident or near miss as the next scenario",
      "Schedule the next exercise for after the next major launch",
      "Repeat the original scenario to measure improvement over time",
    ],
    best: 0,
    assurance: "Sustained cadence",
    feedback:
      "A single exercise tests a moment in time: run on a cadence and reuse real incidents and near misses as the next scenario.",
  },
  {
    id: "notes-not-closed",
    scenario:
      "The exercise produced twelve actions, and nine months later there is no owner list, no due dates and no evidence any of them were done.",
    choices: [
      "Track findings to closure with owners, due dates and verification, and report progress at the next exercise",
      "Keep the action list in the workshop notes and review it annually",
      "Close the actions when the next exercise produces a new list",
    ],
    best: 0,
    assurance: "Findings to closure",
    feedback:
      "Findings without owners and verification are notes: track them to closure, and report progress at the next exercise.",
  },
];

export function tabletopScore(answers: Record<string, number>) {
  const done = TABLETOP_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TABLETOP_ROUNDS.length,
  };
}
