export type LaundryGarmentCareRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const LAUNDRY_GARMENT_CARE_ROUNDS: LaundryGarmentCareRound[] = [
  {
    id: "identification-instructions",
    scenario:
      "An AI system tags items and recommends cleaning processes, but it misidentifies garments or misses special-care instructions, risking damage to delicate items.",
    choices: [
      "Capture item and order identification and special-care instructions accurately, with checks for uncertain or high-risk cases",
      "Rely on automated tagging and default processes to keep throughput high",
      "Ask customers to accept responsibility for any misidentified items or missed instructions",
    ],
    best: 0,
    assurance: "Accurate identification & special-care handling",
    feedback:
      "Correct identification and care instructions are essential: accurate capture and checks for uncertain cases help prevent avoidable damage to garments.",
  },
  {
    id: "damage-accountability",
    scenario:
      "A customer reports damage or a missing item, but intake and return condition are poorly documented and it is unclear how the issue was detected, handled or who is accountable.",
    choices: [
      "Support damage or loss detection, handling and accountability with clear condition checks and documented processes",
      "Resolve claims case by case without consistent condition records or handling steps",
      "Limit responsibility by default unless the customer can provide detailed proof",
    ],
    best: 0,
    assurance: "Damage/loss handling & accountability",
    feedback:
      "Trust depends on accountable handling: clear condition checks and documented processes support fair detection, resolution and accountability for damage or loss.",
  },
  {
    id: "transparency-terms",
    scenario:
      "Pricing, turnaround times and service terms vary based on AI estimates, but customers are not clearly informed of costs, exclusions or expected completion before agreeing.",
    choices: [
      "Communicate pricing, turnaround and service terms transparently before service, including relevant changes or exclusions",
      "Provide estimates only after processing so charges reflect actual work performed",
      "Rely on general terms that do not explain case-specific pricing or timing",
    ],
    best: 0,
    assurance: "Transparent pricing & service terms",
    feedback:
      "Customers need clear expectations: transparent pricing, turnaround and terms help people make informed decisions and reduce disputes.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service captures images and detailed data about customers and items for tracking and quality checks, but retention is excessive and there are limited records linking decisions and condition to specific orders.",
    choices: [
      "Apply privacy and minimisation to customer and item data or images, and log decisions, condition records and model or system versions for traceability and dispute review",
      "Retain all images and data indefinitely to support analytics and future claims",
      "Keep minimal records to protect privacy, even when it prevents reviewing what happened to an order",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Responsible service balances privacy and accountability: minimised data with traceable condition and decision records supports dispute review without unnecessary retention.",
  },
  {
    id: "review-fallback",
    scenario:
      "An order involves unusual fabrics, conflicting instructions or a disputed outcome, but staff have no clear path for human review or fallback when the AI recommendation is uncertain.",
    choices: [
      "Provide human review and fallback for exceptions, disputes or uncertain cases, with clear escalation paths",
      "Follow the AI recommendation by default to maintain consistent processing",
      "Leave exception handling to individual staff judgement without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Exceptions and disputes need careful handling: clear human review and fallback pathways help resolve uncertain or contested cases safely and fairly.",
  },
];

export function laundryGarmentCareScore(answers: Record<string, number>) {
  const done = LAUNDRY_GARMENT_CARE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === LAUNDRY_GARMENT_CARE_ROUNDS.length,
  };
}
