export type RegulatoryHorizonRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const REGULATORY_HORIZON_ROUNDS: RegulatoryHorizonRound[] = [
  {
    id: "ad-hoc-reading",
    scenario:
      "The team learns about AI rule changes from conference slides and news alerts, whenever someone happens to see them.",
    choices: [
      "Define the sources you monitor and a scanning cadence, with a named owner for each source",
      "Rely on the legal team to forward anything important",
      "Subscribe to more newsletters so coverage improves",
    ],
    best: 0,
    assurance: "Defined sources and cadence",
    feedback:
      "Ad hoc reading is not scanning: name the sources, set the cadence and give each one an owner.",
  },
  {
    id: "not-triaged",
    scenario:
      "A new transparency obligation is circulated internally, and nobody checks whether any system in the inventory is in scope.",
    choices: [
      "Triage each change against the system inventory and record which systems are affected or excluded",
      "Assume the obligation applies to the largest vendor and wait for their guidance",
      "Forward it to all system owners and let each decide independently",
    ],
    best: 0,
    assurance: "Triaged against inventory",
    feedback:
      "A change that is never triaged against the inventory becomes everyone's or no-one's: record affected and excluded systems.",
  },
  {
    id: "deadline-missed",
    scenario:
      "A dated obligation is tracked in a spreadsheet, and the first control update starts the week the deadline passes.",
    choices: [
      "Assign owners and internal deadlines ahead of the external date, and track progress to them",
      "Add the external deadline to the risk register and monitor it",
      "Ask the supplier to confirm they will be compliant on time",
    ],
    best: 0,
    assurance: "Dated internal owners",
    feedback:
      "Tracking an external deadline is not planning for it: set internal dates ahead of it and track owners against those.",
  },
  {
    id: "policy-only",
    scenario:
      "The policy is updated for a new requirement, while prompts, contracts and evaluation tests stay unchanged.",
    choices: [
      "Update the controls, contracts and tests the obligation actually touches, not only the policy text",
      "Publish the updated policy and brief staff in the monthly newsletter",
      "Add the requirement to onboarding material for new joiners",
    ],
    best: 0,
    assurance: "Controls updated, not just text",
    feedback:
      "A policy change that never reaches prompts, contracts or tests changes nothing in practice: update the artefacts.",
  },
  {
    id: "silent-no-action",
    scenario:
      "A change is judged not applicable, and no record explains who decided or on what basis.",
    choices: [
      "Record the decision and its rationale so a later reviewer can see why no action was taken",
      "Leave it out of the log to avoid clutter from items that did not apply",
      "Mention it verbally at the next governance meeting",
    ],
    best: 0,
    assurance: "Recorded decisions",
    feedback:
      "A no-action decision without a rationale is indistinguishable from a miss: record the call and the reasoning.",
  },
];

export function regulatoryHorizonScore(answers: Record<string, number>) {
  const done = REGULATORY_HORIZON_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === REGULATORY_HORIZON_ROUNDS.length,
  };
}
