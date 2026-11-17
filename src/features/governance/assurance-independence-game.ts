export type AssuranceIndependenceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ASSURANCE_INDEPENDENCE_ROUNDS: AssuranceIndependenceRound[] = [
  {
    id: "self-assurance",
    scenario:
      "The team that built the model performs the assurance review of the model and reports it as independent assurance.",
    choices: [
      "Have assurance performed by people who do not own or build the system, and say who reviewed what",
      "Keep the review with the build team because they know the system best",
      "Ask the model provider to confirm the system is safe instead",
    ],
    best: 0,
    assurance: "Independent reviewer",
    feedback:
      "A team reviewing its own work is a quality check, not assurance: have someone outside the build perform and sign it.",
  },
  {
    id: "coverage-by-convenience",
    scenario:
      "The assurance plan covers the systems that are easiest to test and leaves out the customer-facing decision tool.",
    choices: [
      "Set coverage from a risk-based rationale and record why anything is excluded",
      "Keep the plan as is because the excluded system is owned by another department",
      "Add the customer tool to the next plan without changing the current one",
    ],
    best: 0,
    assurance: "Risk-based coverage",
    feedback:
      "Assurance that follows convenience misses the risk: choose coverage by risk and record the reason for any exclusion.",
  },
  {
    id: "edited-findings",
    scenario:
      "A draft finding about an unapproved model change is softened by the system owner before it reaches the committee.",
    choices: [
      "Report findings to a level with authority to act, without owner editing, and record any management response separately",
      "Let the owner edit for accuracy because they know the context",
      "Delay the finding until the owner is comfortable with the wording",
    ],
    best: 0,
    assurance: "Unedited reporting",
    feedback:
      "A finding edited by the subject of the finding is not a finding: report it unedited and record the response alongside.",
  },
  {
    id: "supplier-evidence-reliance",
    scenario:
      "Assurance for a critical AI service consists entirely of the supplier's own questionnaire responses, with no declared reliance or caveat.",
    choices: [
      "Declare the reliance on supplier evidence, test a sample independently, and state the limitation",
      "Accept the questionnaire because the supplier has a strong brand",
      "Replace supplier evidence with a general statement that controls are in place",
    ],
    best: 0,
    assurance: "Declared reliance",
    feedback:
      "Supplier answers are evidence of what they say, not of what happens: declare the reliance, test a sample, state the limit.",
  },
  {
    id: "closure-by-status",
    scenario:
      "A high-severity finding is marked closed by the owner, and assurance never re-tests whether the fix works.",
    choices: [
      "Re-test findings independently before closure and reopen anything that does not hold",
      "Accept the owner's closure once evidence is attached to the ticket",
      "Close the finding and raise a new one if it recurs",
    ],
    best: 0,
    assurance: "Independently verified closure",
    feedback:
      "Closure is a claim until it is re-tested: verify independently and reopen what does not hold.",
  },
];

export function assuranceIndependenceScore(answers: Record<string, number>) {
  const done = ASSURANCE_INDEPENDENCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ASSURANCE_INDEPENDENCE_ROUNDS.length,
  };
}
