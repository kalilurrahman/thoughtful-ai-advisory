export type ValueRealisationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VALUE_REALISATION_ROUNDS: ValueRealisationRound[] = [
  {
    id: "no-baseline",
    scenario:
      "A year after launch the team is asked to show the benefit, and nobody recorded how the process performed before the tool existed.",
    choices: [
      "Capture a baseline before deployment, and reconstruct a documented one where the tool is already live",
      "Compare current performance with the target that was promised in the business case",
      "Survey the team on how much time they think they save",
    ],
    best: 0,
    assurance: "Documented baseline",
    feedback:
      "Without a baseline there is no benefit to prove: capture it before deployment, and reconstruct one openly if it is already too late.",
  },
  {
    id: "activity-metrics",
    scenario:
      "The benefits report leads with prompts sent, hours of content generated and licences activated.",
    choices: [
      "Measure the outcome the investment was meant to change, and treat activity as a leading indicator only",
      "Keep the activity numbers and add a cost-per-prompt figure alongside them",
      "Report both and let the reader decide which one matters",
    ],
    best: 0,
    assurance: "Outcome measurement",
    feedback:
      "Activity measures effort, not value: report the outcome the investment was meant to change.",
  },
  {
    id: "everything-at-once",
    scenario:
      "Cost per case fell 18% in the same quarter that the process was redesigned and headcount reduced, and the whole fall is credited to the AI tool.",
    choices: [
      "State the attribution honestly, naming the other changes and what share can reasonably be attributed",
      "Credit the tool because it was the largest single change in the quarter",
      "Remove the other changes from the report to keep the story simple",
    ],
    best: 0,
    assurance: "Honest attribution",
    feedback:
      "A benefit claimed against several simultaneous changes is not attributable: name them and state what share is defensible.",
  },
  {
    id: "licences-bought",
    scenario:
      "A department reports 500 licences deployed, while usage data shows 60 people used the tool in the last month.",
    choices: [
      "Measure real usage and adoption, and treat idle licences as a cost and adoption question",
      "Report licences deployed because that is what the contract measures",
      "Ask managers to confirm their teams are using the tool",
    ],
    best: 0,
    assurance: "Measured adoption",
    feedback:
      "Licences measure procurement, not adoption: measure real usage and treat idle seats as a finding.",
  },
  {
    id: "review-cannot-stop",
    scenario:
      "The quarterly review has no authority to change anything, so a system that is not delivering keeps its budget and its owner.",
    choices: [
      "Give the review authority to scale, fix or stop, with a recorded decision and an owner for each outcome",
      "Keep the review as an information update and escalate separately when needed",
      "Extend the pilot for another year to gather more evidence",
    ],
    best: 0,
    assurance: "Decision authority",
    feedback:
      "A review that cannot stop anything is a status meeting: record the decision and who owns it.",
  },
];

export function valueRealisationScore(answers: Record<string, number>) {
  const done = VALUE_REALISATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VALUE_REALISATION_ROUNDS.length,
  };
}
