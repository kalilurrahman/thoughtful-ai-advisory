export type CodingAssistantsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CODING_ASSISTANTS_ROUNDS: CodingAssistantsRound[] = [
  {
    id: "unreviewed-merge",
    scenario:
      "An engineer merges 400 lines of assistant-suggested code because the assistant wrote it and the existing tests pass.",
    choices: [
      "Review and test it exactly as human code, including security checks and edge cases",
      "Merge it because the tests pass and tests are the control",
      "Ask the assistant to review its own change before merging",
    ],
    best: 0,
    assurance: "Same review as human code",
    feedback:
      "Generated code has the same failure modes plus confident wrong paths: give it the same review, tests and security checks.",
  },
  {
    id: "licence-snippet",
    scenario:
      "A suggestion reproduces a function that looks copied from a copyleft project, and licence scanning only covers dependency files.",
    choices: [
      "Check licence and provenance of generated snippets before merge, and extend scanning to them",
      "Rename the variables and functions so the origin is no longer obvious",
      "Trust the assistant's claim that the code is original",
    ],
    best: 0,
    assurance: "Licence and provenance checked",
    feedback:
      "Assistants reproduce what they were trained on: check licence and provenance of generated snippets and scan for them.",
  },
  {
    id: "secret-paste",
    scenario:
      "An engineer pastes a production configuration containing API keys and customer records into a public assistant to debug an error.",
    choices: [
      "Treat the keys as exposed, rotate them, and block secret and personal data in prompts",
      "Delete the conversation and continue with the same keys",
      "Ask the assistant to forget the previous message",
    ],
    best: 0,
    assurance: "Prohibited inputs enforced",
    feedback:
      "Once pasted, the data is disclosed: rotate the keys, log the incident and enforce the prohibited-input rule technically, not by memo.",
  },
  {
    id: "shadow-assistant",
    scenario:
      "A team subscribes to a new assistant, connects it to the main repository and starts accepting suggestions, with no security or governance review.",
    choices: [
      "Publish approved tools and permitted repositories, and review new assistants before they touch code",
      "Allow it because it is the same vendor as the existing tool",
      "Disable it after the next audit finding",
    ],
    best: 0,
    assurance: "Approved tools and scope",
    feedback:
      "An unapproved assistant connected to a repository is shadow AI with write access: approve the tool and its scope before use.",
  },
  {
    id: "accountability",
    scenario:
      "A defect reaches production, the code was largely assistant-generated, and nobody can say who reviewed it or that an assistant was involved.",
    choices: [
      "Keep the author accountable and record assistant involvement where it affects assurance",
      "Attribute the defect to the assistant and update the vendor contract",
      "Require engineers to disclose assistant use only in incident reviews",
    ],
    best: 0,
    assurance: "Author accountability",
    feedback:
      "Accountability does not transfer to a tool: the author owns the change, and assistant involvement is recorded where it matters.",
  },
];

export function codingAssistantsScore(answers: Record<string, number>) {
  const done = CODING_ASSISTANTS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CODING_ASSISTANTS_ROUNDS.length,
  };
}
