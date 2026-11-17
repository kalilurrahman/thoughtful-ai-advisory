export type CostAllocationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const COST_ALLOCATION_ROUNDS: CostAllocationRound[] = [
  {
    id: "one-bill",
    scenario:
      "The monthly model bill triples, and nobody can say which team, product or feature caused it because everything is billed to one central account.",
    choices: [
      "Meter usage per team, system and feature so the increase can be traced to the work that caused it",
      "Split the bill evenly by headcount as a fair approximation",
      "Ask teams to report their own estimate of what they use",
    ],
    best: 0,
    assurance: "Traceable consumption",
    feedback:
      "A single bill is a single answer: meter usage per team, system and feature so a change can be traced to the work that caused it.",
  },
  {
    id: "surprise-invoice",
    scenario:
      "A product team is told at quarter end that it owes a large chargeback it never saw coming and had no budget for.",
    choices: [
      "Agree the chargeback or showback basis with finance up front and publish it so owners can plan against it",
      "Apply the chargeback anyway because the consumption happened",
      "Absorb the cost centrally this once and decide next year",
    ],
    best: 0,
    assurance: "Agreed, published basis",
    feedback:
      "Allocation nobody agreed to is a tax: agree the chargeback or showback basis with finance up front and publish it before owners commit budget.",
  },
  {
    id: "invisible-spend",
    scenario:
      "Owners receive an invoice line with a total and no breakdown, so they cannot tell whether the spend is efficient or wasteful.",
    choices: [
      "Give each owner their own usage and spend against a budget or forecast they can act on",
      "Send the total only, because the finance team already reconciles the detail",
      "Publish a company-wide dashboard that aggregates all teams together",
    ],
    best: 0,
    assurance: "Owner-level visibility",
    feedback:
      "An owner who cannot see their own number cannot manage it: give each owner usage and spend against a budget they can act on.",
  },
  {
    id: "idle-and-runaway",
    scenario:
      "A retired experiment is still calling a premium model nightly, and a new feature has quietly become the largest consumer in the estate.",
    choices: [
      "Review usage for runaway, idle and untracked spend on a set cadence and act on what it shows",
      "Wait for the next budget cycle, when the numbers will be reviewed anyway",
      "Set a hard cap on the central account so nobody can overspend",
    ],
    best: 0,
    assurance: "Reviewed consumption",
    feedback:
      "Caps stop the bleeding but not the waste: review usage for runaway, idle and untracked spend on a cadence and act on it.",
  },
  {
    id: "shadow-card",
    scenario:
      "Two teams buy AI tools on departmental cards, so their usage never appears in the allocation at all.",
    choices: [
      "Bring untracked tools into the same metering and review, and treat their appearance as a signal about the sanctioned route",
      "Exclude them from allocation because they are outside the central agreement",
      "Ban departmental purchasing without looking at why teams went around the process",
    ],
    best: 0,
    assurance: "Complete cost picture",
    feedback:
      "Allocation that misses shadow spend rewards going around it: bring untracked tools into the same metering and review, and ask why they were bought.",
  },
];

export function costAllocationScore(answers: Record<string, number>) {
  const done = COST_ALLOCATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === COST_ALLOCATION_ROUNDS.length,
  };
}
