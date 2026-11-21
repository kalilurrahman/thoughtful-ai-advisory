export type SelfServiceLaundromatSmartLockerRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SELF_SERVICE_LAUNDROMAT_SMART_LOCKER_ROUNDS: SelfServiceLaundromatSmartLockerRound[] = [
  {
    id: "access-matching",
    scenario:
      "An AI system assigns machines or lockers and matches orders to users, but it grants access to the wrong locker or mismatches an order, leaving customers unable to retrieve items or accessing the wrong belongings.",
    choices: [
      "Ensure machine or locker access and order or user matching are accurate, with checks for uncertain or conflicting cases",
      "Rely on automated assignment and codes to keep turnover fast, correcting mismatches only when reported",
      "Ask customers to resolve access or matching issues themselves using general instructions",
    ],
    best: 0,
    assurance: "Accurate access & order/user matching",
    feedback:
      "Self-service access must be reliable: accurate machine/locker access and order or user matching, with checks for uncertainty, help prevent lockouts and misplaced belongings.",
  },
  {
    id: "issue-accountability",
    scenario:
      "A machine malfunctions, damages items or a locker fails, but there is no clear way to detect, report and document the issue or determine accountability and resolution steps.",
    choices: [
      "Support issue, damage or malfunction detection, reporting and accountability with clear processes and documented handling",
      "Handle problems informally when customers complain, without consistent detection or issue records",
      "Post general disclaimers that limit responsibility for malfunctions or damage by default",
    ],
    best: 0,
    assurance: "Issue/malfunction handling & accountability",
    feedback:
      "Accountable self-service operations need clear processes: consistent detection, reporting and documented handling support fair resolution when machines or lockers fail or cause issues.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The system manages payments and usage, but customers are not clearly informed of pricing, time limits, fees, refund conditions or usage terms before they pay or start a cycle.",
    choices: [
      "Communicate payment, pricing and usage terms transparently before use, including fees, time limits and refund or issue conditions",
      "Show a base price at payment and explain additional fees, limits or terms only after a problem occurs",
      "Rely on brief on-screen notices that do not explain case-specific pricing or usage conditions",
    ],
    best: 0,
    assurance: "Transparent payment, pricing & usage terms",
    feedback:
      "Customers need clear expectations: transparent payment, pricing and usage terms help people make informed choices and reduce disputes about charges or access.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service collects customer and usage data for access and operations, but access, transaction and usage records are hard to trace and data is retained or shared beyond what is needed.",
    choices: [
      "Apply privacy and minimisation to customer and usage data, and log access, transaction and usage records for traceability and dispute review",
      "Retain all access, transaction and usage data indefinitely to support analytics and future claims",
      "Keep minimal records to limit data, even when it prevents reviewing access or resolving disputes",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Self-service systems should be both private and accountable: minimised, safeguarded data with traceable access, transaction and usage records supports dispute review without unnecessary retention.",
  },
  {
    id: "support-fallback",
    scenario:
      "A customer is locked out, charged incorrectly or faces an uncertain access issue, but there is no clear human support or fallback path when the automated system cannot resolve it.",
    choices: [
      "Provide human support and fallback for access failures, disputes or uncertain cases, with clear ways to get timely help",
      "Direct customers to automated troubleshooting only, even when it does not resolve the access or payment issue",
      "Leave resolution to customer persistence without a defined support or escalation path",
    ],
    best: 0,
    assurance: "Human support & fallback",
    feedback:
      "When automation fails, people need help: clear human support and fallback pathways help resolve access failures, disputes and uncertain cases promptly and fairly.",
  },
];

export function selfServiceLaundromatSmartLockerScore(answers: Record<string, number>) {
  const done = SELF_SERVICE_LAUNDROMAT_SMART_LOCKER_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SELF_SERVICE_LAUNDROMAT_SMART_LOCKER_ROUNDS.length,
  };
}
