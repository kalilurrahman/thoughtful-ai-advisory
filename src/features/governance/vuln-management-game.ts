export type VulnManagementRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VULN_MANAGEMENT_ROUNDS: VulnManagementRound[] = [
  {
    id: "app-only-inventory",
    scenario:
      "The vulnerability programme covers the application but not the model SDKs, serving runtimes and inference containers the AI feature depends on.",
    choices: [
      "Extend the inventory and scanning to model SDKs, serving runtimes, containers and agent tooling",
      "Rely on the vendor to keep its SDK secure because it is their code",
      "Scan the application more often to compensate for the gap",
    ],
    best: 0,
    assurance: "Complete component inventory",
    feedback:
      "The AI surface is mostly dependencies: extend inventory and scanning to SDKs, runtimes, containers and tooling.",
  },
  {
    id: "cannot-patch-now",
    scenario:
      "A critical vulnerability sits in a serving library, and the product team refuses the downtime needed to patch before launch.",
    choices: [
      "Apply a compensating control with a time-bound exception, an owner and an expiry date that is enforced",
      "Accept the risk verbally and revisit after launch",
      "Patch it silently during the launch window and hope nobody notices the restart",
    ],
    best: 0,
    assurance: "Bounded exceptions",
    feedback:
      "A patch you cannot apply needs a compensating control and a dated exception, not a conversation: record owner and expiry.",
  },
  {
    id: "scanner-noise",
    scenario:
      "The scanner reports hundreds of findings per week, the team has stopped triaging, and a genuinely exploitable issue sat unread for a month.",
    choices: [
      "Triage by exploitability and exposure with a named owner, so real findings surface above the noise",
      "Suppress everything rated low and work only from the vendor's advisories",
      "Ask the scanner vendor to reduce the number of findings it reports",
    ],
    best: 0,
    assurance: "Prioritised triage",
    feedback:
      "Untriaged findings are the same as no findings: triage by exploitability and exposure with a named owner.",
  },
  {
    id: "patched-but-running-old",
    scenario:
      "The ticket says the library was upgraded, but the running inference container is still on the previous image.",
    choices: [
      "Verify the deployed version rather than the change record, and keep the evidence with the finding",
      "Close the finding once the merge is approved, since deployment follows",
      "Re-deploy everything weekly so drift cannot accumulate",
    ],
    best: 0,
    assurance: "Verified remediation",
    feedback:
      "A merged patch is not a running patch: verify the deployed version and keep that evidence with the finding.",
  },
  {
    id: "provider-notices",
    scenario:
      "The model provider publishes a security notice about the hosted endpoint, and nobody is watching the channel it appears on.",
    choices: [
      "Track provider notice channels with an owner, and assess each notice against your use and data",
      "Assume the provider has already fixed anything that affects hosted inference",
      "Subscribe the security team's shared inbox and rely on someone reading it",
    ],
    best: 0,
    assurance: "Provider notice tracking",
    feedback:
      "Hosted inference moves vulnerability management into someone else's release notes: track notice channels with an owner and assess each one.",
  },
];

export function vulnManagementScore(answers: Record<string, number>) {
  const done = VULN_MANAGEMENT_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VULN_MANAGEMENT_ROUNDS.length,
  };
}
