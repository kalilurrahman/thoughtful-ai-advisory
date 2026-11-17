export type ClaimsSubstantiationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CLAIMS_SUBSTANTIATION_ROUNDS: ClaimsSubstantiationRound[] = [
  {
    id: "human-level",
    scenario:
      "The homepage says the assistant performs at \u201chuman level\u201d, a phrase nobody can point to evidence for.",
    choices: [
      "Replace it with a specific, testable claim and the evidence behind it, including what it does not do",
      "Keep it because customers respond well and no one has complained",
      "Add \u201cin our experience\u201d to make the claim defensible",
    ],
    best: 0,
    assurance: "Testable claim wording",
    feedback:
      "A claim nobody can evidence is a claim you cannot defend: state something specific and testable, with its limits.",
  },
  {
    id: "vendor-claim-copied",
    scenario:
      "A sales deck repeats the supplier's claim of 99.2% accuracy, and nobody checks what was measured or on which data.",
    choices: [
      "Put the vendor claim on the register with its source, test conditions and your own verification",
      "Use the number because the supplier published it in their documentation",
      "Round it to \u201cover 99%\u201d so the precise figure is not at issue",
    ],
    best: 0,
    assurance: "Sourced vendor claims",
    feedback:
      "A supplier's number describes their test, not your use: record the source and conditions, and verify before repeating it.",
  },
  {
    id: "stale-benchmark",
    scenario:
      "A published accuracy figure comes from a benchmark run before two model upgrades and a prompt change.",
    choices: [
      "Re-run the evaluation on the current system or withdraw the figure until it is re-run",
      "Keep the figure and note the date in a footnote",
      "Replace it with the supplier's latest published benchmark instead",
    ],
    best: 0,
    assurance: "Current evidence",
    feedback:
      "Evidence ages when the system changes: re-run the evaluation or withdraw the number until you can.",
  },
  {
    id: "compliance-assertion",
    scenario:
      "Marketing describes the product as \u201cfully compliant with the EU AI Act\u201d before the conformity work is finished.",
    choices: [
      "Describe what has actually been done and what is still in progress, with the basis for each statement",
      "Keep the wording but add \u201cdesigned to support compliance\u201d in small print",
      "Wait until a customer or regulator challenges it before changing anything",
    ],
    best: 0,
    assurance: "Accurate compliance wording",
    feedback:
      "Compliance is a position you can evidence, not a badge: say what is done, what is in progress and on what basis.",
  },
  {
    id: "no-withdrawal",
    scenario:
      "A claim is challenged and found unsupported, and the same wording stays live on the website, in paid ads and in a printed brochure.",
    choices: [
      "Withdraw or correct the claim everywhere it appears, and record who decided and when",
      "Update the website and leave the printed material to run out",
      "Add a correction note to the website footer and keep the campaign live",
    ],
    best: 0,
    assurance: "Claim withdrawal route",
    feedback:
      "A claim withdrawn in one channel is still live in the others: correct every placement and record the decision.",
  },
];

export function claimsSubstantiationScore(answers: Record<string, number>) {
  const done = CLAIMS_SUBSTANTIATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CLAIMS_SUBSTANTIATION_ROUNDS.length,
  };
}
