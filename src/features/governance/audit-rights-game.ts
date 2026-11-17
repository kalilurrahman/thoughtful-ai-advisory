export type AuditRightsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AUDIT_RIGHTS_ROUNDS: AuditRightsRound[] = [
  {
    id: "no-right",
    scenario:
      "The AI supplier's contract is silent on audit, and the team is told that industry certifications are enough.",
    choices: [
      "Negotiate a right to audit or to receive assurance evidence, and record what the provider will actually disclose",
      "Accept the certifications as a substitute for any contractual right",
      "Ask the supplier informally to share findings when convenient",
    ],
    best: 0,
    assurance: "Contractual assurance access",
    feedback:
      "A certification answers a fixed questionnaire, not your questions: secure a right to audit or receive assurance evidence.",
  },
  {
    id: "scope-gap",
    scenario:
      "The audit right exists, but its scope stops at the hosting environment and excludes the model, the data pipeline and subprocessors.",
    choices: [
      "Extend scope to models, data handling, subprocessors and controls, or document the residual risk of the gap",
      "Keep the narrow scope because the hosting audit is the most mature part",
      "Add the model to scope verbally during the next renewal call",
    ],
    best: 0,
    assurance: "Scope covers the service",
    feedback:
      "An audit that excludes the model and subprocessors examines the least AI-specific part: extend scope or record the residual risk.",
  },
  {
    id: "never-exercised",
    scenario:
      "The right to audit has existed for three years, and the organisation has never used it or requested assurance evidence.",
    choices: [
      "Exercise or rely on the right on a risk-based cadence, and record what was reviewed and what changed",
      "Keep the clause in the contract as protection if something goes wrong",
      "Wait until an incident makes an audit clearly necessary",
    ],
    best: 0,
    assurance: "Exercised assurance",
    feedback:
      "An unexercised right is a clause, not a control: use it on a risk-based cadence and record what was reviewed.",
  },
  {
    id: "report-as-substitute",
    scenario:
      "A SOC 2 report is filed as complete assurance, with no analysis of which controls map to the AI service actually being used.",
    choices: [
      "Read the report against your actual use and record the gaps and compensating controls",
      "Accept the report because it is independently audited",
      "Ask the supplier to confirm the report covers everything you need",
    ],
    best: 0,
    assurance: "Gap analysis",
    feedback:
      "A report covers the system it describes: map it to your use, and record the gaps rather than filing it as assurance.",
  },
  {
    id: "findings-drift",
    scenario:
      "A control weakness was raised with the supplier two quarters ago, marked resolved, and nobody has checked since.",
    choices: [
      "Track findings to closure with evidence and re-test at the next review rather than accepting the status field",
      "Close the finding once the supplier confirms remediation in writing",
      "Escalate every unresolved finding to the contract renewal discussion",
    ],
    best: 0,
    assurance: "Verified closure",
    feedback:
      "A status field is not closure: require evidence and re-test at the next review.",
  },
];

export function auditRightsScore(answers: Record<string, number>) {
  const done = AUDIT_RIGHTS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AUDIT_RIGHTS_ROUNDS.length,
  };
}
