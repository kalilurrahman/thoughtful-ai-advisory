export type DecommissioningRetirementAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DECOMMISSIONING_RETIREMENT_ASSURANCE_ROUNDS: DecommissioningRetirementAssuranceRound[] = [
  {
    id: "planned-retirement",
    scenario:
      "An AI system is being retired, but there is no plan for timing, dependencies, ownership, or safe transition of affected workflows.",
    choices: [
      "Plan decommissioning with clear ownership, timelines, dependency mapping, and a safe transition/rollback approach for affected workflows",
      "Turn the system off immediately without assessing dependencies or impacts",
      "Leave the decision informal with no documented plan or owners",
    ],
    best: 0,
    assurance: "Planned and owned decommissioning",
    feedback:
      "Retirement assurance starts with a planned, owned approach that accounts for dependencies, impacts, and a safe transition for affected users and workflows.",
  },
  {
    id: "communication-alternatives",
    scenario:
      "Users and stakeholders are not informed that the AI system will be retired, and no alternatives or guidance are provided for ongoing needs.",
    choices: [
      "Communicate retirement clearly to affected audiences with timelines, impacts, alternatives/guidance, and support channels",
      "Retire the system silently and let users discover it on their own",
      "Announce retirement without explaining impacts or alternatives",
    ],
    best: 0,
    assurance: "Communication and continuity guidance",
    feedback:
      "Clear communication of retirement, impacts, timelines, and alternatives helps stakeholders adapt and reduces disruption and unmanaged workarounds.",
  },
  {
    id: "access-data-disposal",
    scenario:
      "After retirement, integrations, credentials, and access may remain active, and data/models/configurations are left without clear retention or disposal actions.",
    choices: [
      "Revoke access/integrations and credentials, and handle data/models/configurations per retention, disposal, and security requirements",
      "Leave access and artifacts in place to avoid extra work",
      "Delete everything immediately without considering retention, records, or dependencies",
    ],
    best: 0,
    assurance: "Access revocation and lifecycle disposal",
    feedback:
      "Safe retirement includes revoking access/integrations and managing data, models, and configurations according to retention, disposal, and security needs.",
  },
  {
    id: "closure-evidence",
    scenario:
      "The system is considered retired, but there is no evidence of completed steps, residual risks, or lessons learned to inform future governance.",
    choices: [
      "Document closure with evidence of completed steps, residual risk handling, and lessons learned for future assurance improvements",
      "Assume retirement is complete without verification or records",
      "Capture lessons informally without sharing or tracking follow-up",
    ],
    best: 0,
    assurance: "Closure evidence and lessons learned",
    feedback:
      "Decommissioning assurance is strengthened by verified closure evidence, addressed residual risks, and lessons learned that improve future governance.",
  },
];

export function decommissioningRetirementAssuranceScore(answers: Record<string, number>) {
  const done = DECOMMISSIONING_RETIREMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DECOMMISSIONING_RETIREMENT_ASSURANCE_ROUNDS.length,
  };
}
