export type OversightCapacityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OVERSIGHT_CAPACITY_ROUNDS: OversightCapacityRound[] = [
  {
    id: "rubber-stamp",
    scenario:
      "Reviewers approve 99.4% of AI recommendations, average four seconds per case, and say they trust the system.",
    choices: [
      "Measure override and dwell patterns, sample cases for independent review, and reset workload so real checking is possible",
      "Accept the high approval rate as evidence the model is accurate",
      "Replace human review with spot checks once a quarter",
    ],
    best: 0,
    assurance: "Automation bias detection",
    feedback:
      "Near-perfect approval at seconds per case suggests rubber-stamping: measure override and dwell patterns, sample cases independently, and reset workload so real checking is possible.",
  },
  {
    id: "no-authority",
    scenario:
      "Reviewers can see AI decisions but cannot change them; when they disagree they are told to log a comment for later.",
    choices: [
      "Give reviewers authority to override or hold decisions, with a route for recording why",
      "Keep the read-only view so the process stays consistent",
      "Remove human review from the workflow since it changes nothing",
    ],
    best: 0,
    assurance: "Reviewer authority",
    feedback:
      "Oversight without authority is theatre: give reviewers the power to override or hold decisions, with a route to record why.",
  },
  {
    id: "volume-mismatch",
    scenario:
      "The AI rollout triples decision volume, but the review team is unchanged and the queue now runs two days behind.",
    choices: [
      "Match review capacity to the new volume, tier what needs full review, and stop expanding use until coverage holds",
      "Ask reviewers to work through the backlog with overtime",
      "Auto-approve anything older than 24 hours to clear the queue",
    ],
    best: 0,
    assurance: "Capacity matched to volume",
    feedback:
      "Oversight needs staffing: match capacity to volume, tier what needs full review, and pause expansion until coverage holds rather than auto-approving a backlog.",
  },
  {
    id: "unqualified-review",
    scenario:
      "Reviews are assigned to whoever is available, with no domain knowledge and no access to the data the model used.",
    choices: [
      "Assign reviewers with domain competence and the context to judge, and record competence for the review type",
      "Keep rotating assignments so no one is overloaded",
      "Let the model's confidence score stand in for reviewer competence",
    ],
    best: 0,
    assurance: "Competent reviewers",
    feedback:
      "A reviewer without context cannot judge: assign people with domain competence and the data to assess, and record competence for each review type.",
  },
];

export function oversightCapacityScore(answers: Record<string, number>) {
  const done = OVERSIGHT_CAPACITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OVERSIGHT_CAPACITY_ROUNDS.length,
  };
}
