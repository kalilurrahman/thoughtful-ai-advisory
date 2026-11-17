export type OutputIpRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OUTPUT_IP_ROUNDS: OutputIpRound[] = [
  {
    id: "unclear-ownership",
    scenario:
      "A marketing team is publishing AI-generated copy, and no one can say whether the organisation owns it or whether the provider's terms restrict its use.",
    choices: [
      "Check the provider terms on output ownership and usage, record the position, and set guidance for teams",
      "Publish it and clarify ownership if a dispute arises",
      "Assume the organisation owns everything generated on a paid plan",
    ],
    best: 0,
    assurance: "Output ownership terms",
    feedback:
      "Ownership is a contractual fact, not an assumption: check provider terms on output ownership and usage, record the position, and give teams guidance.",
  },
  {
    id: "no-similarity-check",
    scenario:
      "A generated illustration closely resembles a well-known brand asset, and it was published without any similarity review.",
    choices: [
      "Run similarity and infringement checks before publishing generated assets, and document the review",
      "Publish first and remove it if the brand complains",
      "Add a disclaimer that the image was AI-generated",
    ],
    best: 0,
    assurance: "Similarity and infringement review",
    feedback:
      "Generation can reproduce protected material: run similarity and infringement checks before publishing generated assets, and document the review.",
  },
  {
    id: "licence-drift",
    scenario:
      "AI-assisted code was merged into a product, and no one checked whether the model reproduced open-source snippets with attribution or copyleft obligations.",
    choices: [
      "Scan AI-assisted code for licence obligations, resolve any matches, and record the outcome",
      "Treat generated code as original because a model wrote it",
      "Avoid all open-source dependencies in the product instead",
    ],
    best: 0,
    assurance: "Licence obligation checks",
    feedback:
      "Generated code can carry someone else's licence: scan AI-assisted code for obligations, resolve matches, and record the outcome rather than assuming originality.",
  },
  {
    id: "undisclosed-use",
    scenario:
      "A report sent to a regulator contains substantial AI-generated analysis, and there is no record that AI was used or who reviewed it.",
    choices: [
      "Disclose AI assistance where required, record the model, prompts and human review, and keep the evidence with the submission",
      "Leave it undisclosed because a human signed the report",
      "Remove all AI involvement from the process to avoid disclosure",
    ],
    best: 0,
    assurance: "Disclosure and records",
    feedback:
      "A human signature does not erase AI involvement: disclose where required, record the model, prompts and human review, and keep the evidence with the submission.",
  },
];

export function outputIpScore(answers: Record<string, number>) {
  const done = OUTPUT_IP_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OUTPUT_IP_ROUNDS.length,
  };
}
