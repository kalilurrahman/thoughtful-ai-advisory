export type SupplyChainAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SUPPLY_CHAIN_ASSURANCE_ROUNDS: SupplyChainAssuranceRound[] = [
  {
    id: "vendor-terms",
    scenario:
      "A team adopts a third-party AI model/service but has not reviewed data-use terms, subprocessors, retention/deletion, or security responsibilities.",
    choices: [
      "Review contracts and terms for data use, subprocessors, retention/deletion, security/support duties, and document risks/approvals",
      "Proceed based on vendor marketing claims alone",
      "Assume cloud hosting removes the need to review supplier responsibilities",
    ],
    best: 0,
    assurance: "Contract and data-use clarity",
    feedback:
      "Third-party assurance requires understanding data handling, subprocessors, retention/deletion, and shared responsibilities—not relying on assumptions or marketing.",
  },
  {
    id: "fitness-evidence",
    scenario:
      "A vendor provides general benchmark results, but there is little evidence of performance, limitations, or safety for your specific use case and users.",
    choices: [
      "Require context-specific evaluation and limitation evidence for the intended use, and record conditions/controls before reliance",
      "Accept general benchmarks as proof of fitness for any workflow",
      "Skip evaluation because the vendor is well known",
    ],
    best: 0,
    assurance: "Fitness-for-use evidence",
    feedback:
      "Assurance depends on evidence aligned to intended use and affected users; general claims do not establish suitability, limitations, or required controls.",
  },
  {
    id: "integration-guardrails",
    scenario:
      "An AI component is integrated with internal tools and data, but access scopes, logging, and guardrails for the integration are not clearly defined.",
    choices: [
      "Apply least-privilege access, integration guardrails, logging/monitoring, and accountable ownership for the connected workflow",
      "Grant broad access to simplify integration",
      "Rely on the model to avoid unsafe tool or data actions on its own",
    ],
    best: 0,
    assurance: "Integration and access guardrails",
    feedback:
      "Supply-chain assurance includes secure integration: least privilege, guardrails, logging, and ownership reduce risk from connected tools and data flows.",
  },
  {
    id: "ongoing-exit",
    scenario:
      "After onboarding a supplier, there is no plan for ongoing monitoring, incident/change notification, or exit/contingency if service or risk changes.",
    choices: [
      "Establish ongoing monitoring, notification/escalation expectations, and exit/contingency plans (including data return/deletion) with owners",
      "Review the supplier only at initial procurement",
      "Assume continuity and safe data handling will resolve automatically at contract end",
    ],
    best: 0,
    assurance: "Ongoing monitoring and exit readiness",
    feedback:
      "Third-party assurance is continuous: monitor performance/risk changes, define notification paths, and maintain exit/contingency and data disposition readiness.",
  },
];

export function supplyChainAssuranceScore(answers: Record<string, number>) {
  const done = SUPPLY_CHAIN_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SUPPLY_CHAIN_ASSURANCE_ROUNDS.length,
  };
}
