export type TenantScreeningRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TENANT_SCREENING_ROUNDS: TenantScreeningRound[] = [
  {
    id: "proxy-criteria",
    scenario:
      "A rental scoring model weighs factors that never name a protected trait but correlate with one: source of income type, tenancy history in a specific postcode, and a credit pattern that tracks disability-related medical debt.",
    choices: [
      "Keep criteria lawful and housing-related and test for proxies of protected traits",
      "Keep the factors because none of them explicitly mention a protected characteristic",
      "Remove the postcode variable and treat the rest as cleared",
    ],
    best: 0,
    assurance: "Lawful criteria & proxies",
    feedback:
      "A factor does not need to name a protected trait to act as one: test whether apparently neutral criteria function as proxies, including source of income and medical debt.",
  },
  {
    id: "hidden-scoring",
    scenario:
      "Applications are ranked by a vendor score, but applicants are never told a model is used, what data feeds it or which organisation produced the score.",
    choices: [
      "Tell applicants a scoring model is used and what data drives it",
      "Mention automated screening only in the general terms and conditions",
      "Disclose the vendor name but not the data used",
    ],
    best: 0,
    assurance: "Applicant disclosure",
    feedback:
      "Applicants should know a model is influencing their housing access and what data it weighs, not discover it in boilerplate terms.",
  },
  {
    id: "auto-reject",
    scenario:
      "Any application scoring below the cut-off is rejected automatically overnight, and no person ever sees the file before the rejection goes out.",
    choices: [
      "Have a person review adverse decisions before rejection",
      "Set the cut-off higher so fewer borderline applicants are auto-rejected",
      "Allow appeals after the rejection has been issued and the unit re-let",
    ],
    best: 0,
    assurance: "Human review of adverse decisions",
    feedback:
      "Rejection is a consequential decision: a person should review the file before an automated score denies someone housing.",
  },
  {
    id: "no-reason",
    scenario:
      "A rejected applicant asks why and receives 'your application did not meet our criteria', with no specific reason and no way to correct an error in the underlying report.",
    choices: [
      "Give a specific reason and a route to challenge the decision and correct errors",
      "Repeat that the decision was based on a proprietary scoring model",
      "Offer a new application after six months with no route to contest the record",
    ],
    best: 0,
    assurance: "Reason & correction route",
    feedback:
      "People need a specific reason and a real route to challenge and correct the record, not a restatement of criteria or a waiting period.",
  },
  {
    id: "stale-records",
    scenario:
      "The screening report repeatedly surfaces an outdated eviction filing that was dismissed, and no one verifies sources before the score is used.",
    choices: [
      "Verify screening data sources and fix stale or dismissed records before scoring",
      "Let applicants discover errors through the challenge process after rejection",
      "Ignore the issue because the vendor is responsible for data quality",
    ],
    best: 0,
    assurance: "Data accuracy",
    feedback:
      "A wrong record closes doors: verify sources, fix stale or dismissed entries and keep audit evidence, rather than pushing the burden onto applicants.",
  },
];

export function tenantScreeningScore(answers: Record<string, number>) {
  const done = TENANT_SCREENING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TENANT_SCREENING_ROUNDS.length,
  };
}
