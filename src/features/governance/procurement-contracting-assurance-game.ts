export type ProcurementContractingAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PROCUREMENT_CONTRACTING_ASSURANCE_ROUNDS: ProcurementContractingAssuranceRound[] = [
  {
    id: "requirements-definition",
    scenario:
      "A team procures an AI product without defining requirements for the intended use, data handling, security, guardrails, or support and accountability.",
    choices: [
      "Define AI-specific procurement requirements (use case fit, data handling, security, guardrails, support, accountability) before selection",
      "Select the tool based mainly on demos and marketing claims",
      "Assume standard software requirements are sufficient for AI-specific risks",
    ],
    best: 0,
    assurance: "AI-specific procurement requirements",
    feedback:
      "Procurement assurance starts with clear, AI-specific requirements tied to intended use and risks so selection and evaluation are meaningful.",
  },
  {
    id: "vendor-evaluation",
    scenario:
      "A vendor claims strong safety and compliance, but the team does not evaluate evidence, limitations, controls, or suitability for its context.",
    choices: [
      "Evaluate vendor claims with evidence (controls, limitations, testing, certifications/attestations where relevant) and assess context fit",
      "Accept vendor claims at face value to speed up adoption",
      "Rely on brand reputation without reviewing evidence or limitations",
    ],
    best: 0,
    assurance: "Evidence-based vendor evaluation",
    feedback:
      "Assurance requires evaluating vendor claims against evidence and limitations, and confirming suitability and controls for your specific context.",
  },
  {
    id: "contract-terms",
    scenario:
      "Contracts lack clear terms on data use/retention, security responsibilities, SLAs, incident notification, audit/support, and change/subprocessor transparency.",
    choices: [
      "Negotiate and document terms covering data use/retention, security/shared responsibilities, SLAs/support, incident/change notification, and transparency",
      "Proceed with generic terms and resolve issues later if needed",
      "Assume verbal assurances are enough without contractual clarity",
    ],
    best: 0,
    assurance: "Contractual clarity and protections",
    feedback:
      "Clear contractual terms help assure responsibilities, protections, and transparency—reducing ambiguity around data, security, incidents, and service commitments.",
  },
  {
    id: "onboarding-review",
    scenario:
      "After procurement, the vendor/service is onboarded without due diligence checks, integration controls, or a plan for ongoing assurance reviews.",
    choices: [
      "Conduct onboarding due diligence and integration controls, assign ownership, and plan ongoing evidence-backed vendor assurance reviews",
      "Onboard immediately and review the vendor only at renewal",
      "Assume initial procurement checks remain valid without ongoing review",
    ],
    best: 0,
    assurance: "Onboarding and ongoing assurance",
    feedback:
      "Vendor assurance continues after contracting: due diligence at onboarding, controlled integration, and periodic reviews keep risks and commitments managed over time.",
  },
];

export function procurementContractingAssuranceScore(answers: Record<string, number>) {
  const done = PROCUREMENT_CONTRACTING_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PROCUREMENT_CONTRACTING_ASSURANCE_ROUNDS.length,
  };
}
