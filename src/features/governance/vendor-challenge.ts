export type VendorChallenge = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  preferred: number;
  rationale: string;
};
export const VENDOR_CHALLENGES: VendorChallenge[] = [
  {
    id: "subprocessor",
    scenario:
      "A model provider says it does not train on your prompts, but relies on multiple subprocessors. What should procurement verify?",
    choices: [
      "Data flow, subprocessor list/change notice, retention/deletion, access controls, and contractual restrictions",
      "Only the provider’s marketing claim",
      "Nothing if the model is hosted in the cloud",
    ],
    preferred: 0,
    rationale:
      "Assess the service chain and actual data handling in contracts and technical evidence; marketing language alone is insufficient.",
  },
  {
    id: "evaluation",
    scenario:
      "A vendor reports high benchmark accuracy but provides no evaluation for your intended workflow. What is the best next step?",
    choices: [
      "Run a context-specific evaluation with representative cases, limitations, and human review",
      "Accept the benchmark as proof of fitness",
      "Skip testing if a human can theoretically override",
    ],
    preferred: 0,
    rationale:
      "Evidence should match the intended use and affected users; general benchmarks do not establish fitness for a specific deployment.",
  },
  {
    id: "exit",
    scenario:
      "The contract ends while the service processes sensitive data. What should the exit plan include?",
    choices: [
      "Data return/deletion evidence, access revocation, transition, continuity, and unresolved incident handling",
      "Assume data disappears when billing stops",
      "Keep the integration running without review",
    ],
    preferred: 0,
    rationale:
      "Lifecycle governance includes supplier exit, data disposition, access removal, and continuity controls.",
  },
];
export function vendorChallengeScore(answers: Record<string, number>) {
  const answered = VENDOR_CHALLENGES.filter((q) => answers[q.id] !== undefined);
  return {
    answered: answered.length,
    preferred: answered.filter((q) => answers[q.id] === q.preferred).length,
    complete: answered.length === VENDOR_CHALLENGES.length,
  };
}
