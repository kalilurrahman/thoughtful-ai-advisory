export type AssuranceCaseRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ASSURANCE_CASE_ROUNDS: AssuranceCaseRound[] = [
  {
    id: "claim-without-evidence",
    scenario:
      "The assurance case states that outputs are reviewed by a human before release, and the only support is a link to the team's process wiki.",
    choices: [
      "Tie each claim to evidence that shows the control operating — records, samples, test results — not a description of it",
      "Keep the wiki link because it is the authoritative process document",
      "Reword the claim so it says the process exists rather than that it operates",
    ],
    best: 0,
    assurance: "Claim-evidence traceability",
    feedback:
      "A process description evidences intent, not operation: tie each claim to records that show the control working.",
  },
  {
    id: "stale-dashboard",
    scenario:
      "The argument cites a monitoring dashboard screenshot from eleven months ago, taken before two major model changes.",
    choices: [
      "Date the evidence and require it to be refreshed when the system or its data changes",
      "Keep the screenshot because it still shows the control was designed correctly",
      "Replace it with a screenshot of the current dashboard and no date",
    ],
    best: 0,
    assurance: "Current evidence",
    feedback:
      "Evidence has a shelf life: date it and refresh it when the system or its data changes.",
  },
  {
    id: "ignored-defeater",
    scenario:
      "The team knows retrieval sometimes returns documents outside the approved set, but the assurance case reads as if grounding is complete.",
    choices: [
      "Record the known gap as a defeater with its mitigation and residual risk, so the argument is honest",
      "Leave it out because it is being worked on and the case is about the target state",
      "Add a general statement that some limitations may exist",
    ],
    best: 0,
    assurance: "Stated defeaters",
    feedback:
      "An argument that hides what it cannot show is marketing: record known gaps as defeaters with mitigation and residual risk.",
  },
  {
    id: "frozen-argument",
    scenario:
      "The assurance case was signed off at launch, and the product has since added a new user group and a new data source.",
    choices: [
      "Re-assess the case whenever scope, data or model changes, and record who re-approved it",
      "Re-sign the same document annually to keep it current",
      "Note the new features in a changelog and leave the argument unchanged",
    ],
    best: 0,
    assurance: "Change-triggered review",
    feedback:
      "A case describes a system that no longer exists once scope or data moves: re-assess on change and record the re-approval.",
  },
  {
    id: "summary-reader",
    scenario:
      "An approver signs off after reading a two-page summary, without seeing the evidence behind the claims or the open defeaters.",
    choices: [
      "Route approvers to the claims, evidence and open defeaters so sign-off is on the argument, not the summary",
      "Keep the summary route because approvers are short of time",
      "Add the defeaters to the summary but leave the evidence out",
    ],
    best: 0,
    assurance: "Informed approval",
    feedback:
      "Sign-off on a summary is sign-off on a different document: approvers must see the claims, evidence and open defeaters.",
  },
];

export function assuranceCaseScore(answers: Record<string, number>) {
  const done = ASSURANCE_CASE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ASSURANCE_CASE_ROUNDS.length,
  };
}
