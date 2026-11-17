export type AssuranceCadenceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ASSURANCE_CADENCE_ROUNDS: AssuranceCadenceRound[] = [
  {
    id: "slipped-review",
    scenario:
      "A scheduled model review passed its due date three months ago, and nobody noticed because the review calendar lives in a spreadsheet nobody owns.",
    choices: [
      "Give the calendar an owner, surface overdue reviews to a named group, and record the review once completed",
      "Reschedule the review to next quarter and move on",
      "Drop the review because the model has been running without incident",
    ],
    best: 0,
    assurance: "Owned review calendar",
    feedback:
      "A calendar without an owner slips silently: assign ownership, surface overdue reviews to a named group, and record completion so assurance stays visible.",
  },
  {
    id: "stale-test",
    scenario:
      "A control test passed last year, but the model, its prompts and its integrations have changed substantially since then, and the result is still cited as current evidence.",
    choices: [
      "Re-test the control against the current system, mark the old result as superseded, and date the new evidence",
      "Keep citing the old result since the control design has not changed",
      "Delete the old result so no one relies on it",
    ],
    best: 0,
    assurance: "Evidence freshness",
    feedback:
      "Evidence describes a moment: re-test against the current system, mark older results as superseded, and date new evidence so assurance reflects what exists now.",
  },
  {
    id: "no-owner-evidence",
    scenario:
      "Assurance evidence exists in several folders, but no one can say which version is authoritative or when each item was last confirmed.",
    choices: [
      "Define an authoritative evidence location with owners, dates and version markers, and retire duplicates",
      "Keep every copy so nothing is lost",
      "Consolidate into one file without recording who confirmed it or when",
    ],
    best: 0,
    assurance: "Authoritative evidence register",
    feedback:
      "Duplicated evidence creates doubt: define an authoritative location with owners, dates and versions, and retire duplicates so reviewers know what is current.",
  },
  {
    id: "overdue-silent",
    scenario:
      "Several assurance actions are overdue, and the oversight group only hears about them at the annual audit.",
    choices: [
      "Report overdue assurance items on a fixed cadence with owners and escalation thresholds before they reach audit",
      "Wait for audit to raise them so the report stays clean",
      "Close the items administratively so the list looks current",
    ],
    best: 0,
    assurance: "Overdue escalation",
    feedback:
      "Overdue assurance is a governance signal: report it on a fixed cadence with owners and escalation thresholds so issues are addressed before an audit finds them.",
  },
];

export function assuranceCadenceScore(answers: Record<string, number>) {
  const done = ASSURANCE_CADENCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ASSURANCE_CADENCE_ROUNDS.length,
  };
}
