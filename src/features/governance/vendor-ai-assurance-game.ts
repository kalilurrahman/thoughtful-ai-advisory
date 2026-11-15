export type VendorAIAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VENDOR_AI_ASSURANCE_ROUNDS: VendorAIAssuranceRound[] = [
  {
    id: "due-diligence",
    scenario:
      "A team wants to adopt a third-party AI service quickly, but there is limited due diligence on the vendor's security, model practices, data handling, and reliability.",
    choices: [
      "Perform risk-based vendor due diligence covering security, privacy/data handling, model and service practices, reliability, and compliance posture before adoption",
      "Adopt immediately and review the vendor only if an issue occurs later",
      "Rely solely on marketing claims without evidence or assessment",
    ],
    best: 0,
    assurance: "Risk-based vendor due diligence",
    feedback:
      "Assurance starts with proportionate due diligence: understand vendor controls, data flows, and service risks with evidence before relying on third-party AI.",
  },
  {
    id: "contractual-guardrails",
    scenario:
      "Contracts and agreements do not clearly define data use, confidentiality, incident notification, support, audit rights, or responsibilities when things go wrong.",
    choices: [
      "Establish contractual guardrails (data use/retention, confidentiality, security, incident and breach notice, SLAs/support, audit/assurance rights, and responsibilities) aligned to risk",
      "Use generic terms and assume responsibilities can be sorted out later",
      "Avoid documenting obligations to speed procurement",
    ],
    best: 0,
    assurance: "Contractual guardrails and responsibilities",
    feedback:
      "Vendor assurance depends on clear contractual expectations and responsibilities, including data handling, security, incident obligations, and rights to obtain assurance.",
  },
  {
    id: "dependency-risk",
    scenario:
      "A critical workflow depends on a single external AI provider, but there is no view of dependency, concentration, or fallback options if the service changes or fails.",
    choices: [
      "Assess dependency and concentration risk, identify criticality, and plan contingencies/fallbacks or exit options proportionate to business impact",
      "Assume the vendor will always be available and unchanged",
      "Treat all third-party AI dependencies as low impact without analysis",
    ],
    best: 0,
    assurance: "Dependency and concentration risk management",
    feedback:
      "Governance should account for third-party dependency and concentration: understand criticality and maintain proportionate continuity, fallback, or exit plans.",
  },
  {
    id: "ongoing-monitoring",
    scenario:
      "After onboarding, no one monitors vendor performance, incidents, changes, or updated assurance evidence over time.",
    choices: [
      "Monitor vendor performance and risk on an ongoing basis, review incidents/changes, and refresh assurance evidence periodically or when risk changes",
      "Treat onboarding approval as permanent with no further review",
      "Collect reports but never act on issues or update risk decisions",
    ],
    best: 0,
    assurance: "Ongoing monitoring and evidence refresh",
    feedback:
      "Third-party assurance is continuous: track performance, incidents, and material changes, and revisit evidence and decisions as vendor risk evolves.",
  },
];

export function vendorAIAssuranceScore(answers: Record<string, number>) {
  const done = VENDOR_AI_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VENDOR_AI_ASSURANCE_ROUNDS.length,
  };
}
