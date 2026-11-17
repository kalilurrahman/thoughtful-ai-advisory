export type DataResidencyRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_RESIDENCY_ROUNDS: DataResidencyRound[] = [
  {
    id: "selector-not-evidence",
    scenario:
      "The console shows the EU region selected, but a nightly batch job uses a default endpoint that has never been checked.",
    choices: [
      "Record the actual processing region per system and feature, and test each call path rather than trusting the selector",
      "Screenshot the region selector as evidence of residency",
      "Ask the provider to confirm that all traffic stays in the region",
    ],
    best: 0,
    assurance: "Verified processing location",
    feedback:
      "A selected region is a setting, not a location: record and test where each system and batch actually processes.",
  },
  {
    id: "support-access",
    scenario:
      "Storage sits in the required region, but the provider's support engineers routinely access customer data from another continent.",
    choices: [
      "Document support-access locations and the transfer basis that covers them, not just where data is stored",
      "Rely on the storage region because that is what the contract describes",
      "Ask support to stop accessing the environment when investigating tickets",
    ],
    best: 0,
    assurance: "Complete location picture",
    feedback:
      "Support access crosses borders even when storage does not: document support locations and the basis that covers them.",
  },
  {
    id: "silent-subprocessor",
    scenario:
      "A provider update adds a new subprocessor in a region you have not assessed, and the change appears only in a changelog nobody reads.",
    choices: [
      "Track subprocessor and region changes with an owner, and assess each before the change takes effect",
      "Assume the provider's standard terms cover any new subprocessor",
      "Review the changelog once a year alongside contract renewal",
    ],
    best: 0,
    assurance: "Change notice",
    feedback:
      "Residency changes arrive as release notes: track subprocessor and region changes with an owner and assess them in advance.",
  },
  {
    id: "backups-elsewhere",
    scenario:
      "The provider confirms primary storage in region, but cannot say where backups and replicas are kept.",
    choices: [
      "Ask for evidence covering backups, replicas and disaster recovery before accepting the residency claim",
      "Accept the primary-storage answer because backups are an operational detail",
      "Move to a provider that does not mention backups at all",
    ],
    best: 0,
    assurance: "Evidenced residency",
    feedback:
      "Primary storage is part of the answer: ask for evidence covering backups, replicas and recovery before accepting the claim.",
  },
  {
    id: "unbased-transfer",
    scenario:
      "A new feature routes prompts through a region outside the one approved, and no transfer basis has ever been documented.",
    choices: [
      "Stop the routing, document the transfer basis or move the feature, and record the decision",
      "Continue while legal drafts a position, since the volume is small",
      "Anonymise the prompts informally and treat the transfer as out of scope",
    ],
    best: 0,
    assurance: "Bounded transfers",
    feedback:
      "An undocumented transfer is an unassessed one: stop the routing, document a basis or move the feature, and record the decision.",
  },
];

export function dataResidencyScore(answers: Record<string, number>) {
  const done = DATA_RESIDENCY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_RESIDENCY_ROUNDS.length,
  };
}
