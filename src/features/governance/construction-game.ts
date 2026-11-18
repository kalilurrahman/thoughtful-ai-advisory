export type ConstructionRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONSTRUCTION_ROUNDS: ConstructionRound[] = [
  {
    id: "unchecked-design",
    scenario:
      "A generative design tool produces structural layouts and load calculations that go into a tender pack without a qualified engineer checking them, because the model is faster than the design team.",
    choices: [
      "Have a qualified professional check generated designs and calculations and carry the liability",
      "Accept the output because the model is trained on compliant buildings",
      "Ask a junior engineer to skim the drawings for anything obviously wrong",
    ],
    best: 0,
    assurance: "Professional checking",
    feedback:
      "Speed is not competence: generated designs and calculations need review by a qualified professional who carries the liability.",
  },
  {
    id: "model-as-signoff",
    scenario:
      "A model's fire-safety prediction is used in place of the required sign-off, and the approval record simply cites the tool's output.",
    choices: [
      "Never let model output substitute for structural, fire or life-safety sign-off",
      "Use the model output as sign-off when its confidence is high",
      "Keep the model output as supporting evidence alongside a verbal approval",
    ],
    best: 0,
    assurance: "Life-safety sign-off",
    feedback:
      "Life-safety decisions require accountable sign-off: a model prediction supports a decision, it does not become the approval.",
  },
  {
    id: "flag-goes-nowhere",
    scenario:
      "A site-safety model flags an elevated risk zone every morning, but the alert lands in a dashboard nobody on site opens and crews never see it.",
    choices: [
      "Route safety predictions and risk flags to the people who can act on them",
      "Increase the alert threshold so only the most serious flags are generated",
      "Keep the dashboard for the safety team and review it in the weekly meeting",
    ],
    best: 0,
    assurance: "Safety-flag routing",
    feedback:
      "A flag that never reaches a crew changes nothing: route safety output to the people who can act on it, in time to act.",
  },
  {
    id: "hidden-authorship",
    scenario:
      "After a defect appears, nobody can tell which design elements were AI-generated, what the model proposed or what the engineer changed.",
    choices: [
      "Record which design and as-built elements were AI-assisted and what changed",
      "Rely on the engineer's memory and the file's version history",
      "Ask the vendor for logs of what their model generated on the project",
    ],
    best: 0,
    assurance: "AI-authorship records",
    feedback:
      "Defects get investigated later: keep records showing which elements were AI-assisted and how the final design differs.",
  },
  {
    id: "post-handover-defect",
    scenario:
      "Two years after handover, a defect traces back to an AI-assisted estimate and design assumption, but there is no route to correct it, notify the owner or disclose what happened.",
    choices: [
      "Have a clear route to correct the issue, notify affected parties and disclose what happened",
      "Handle it quietly as a maintenance item to avoid contractual exposure",
      "Blame the model vendor and let them manage the owner relationship",
    ],
    best: 0,
    assurance: "Post-handover correction",
    feedback:
      "Post-handover errors need an honest route: correct the issue, notify the people affected and disclose what happened rather than absorbing it silently.",
  },
];

export function constructionScore(answers: Record<string, number>) {
  const done = CONSTRUCTION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONSTRUCTION_ROUNDS.length,
  };
}
