export type EquipmentToolRentalRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EQUIPMENT_TOOL_RENTAL_ROUNDS: EquipmentToolRentalRound[] = [
  {
    id: "identification-condition",
    scenario:
      "An AI system identifies equipment or tools, checks availability and records condition at checkout, but it misidentifies items or misses pre-existing wear, leading to disputes and incorrect rentals.",
    choices: [
      "Capture equipment or tool identification, condition and availability accurately, with checks for uncertain or high-value items",
      "Rely on quick scans and catalog defaults to speed up checkout and availability updates",
      "Ask renters to accept the recorded condition and item match unless they can prove issues later",
    ],
    best: 0,
    assurance: "Accurate identification, condition & availability",
    feedback:
      "Reliable rentals start with a clear baseline: accurate identification, condition and availability records, with checks for uncertainty, help prevent disputes and wrong allocations.",
  },
  {
    id: "damage-accountability",
    scenario:
      "After return a renter is charged for damage or a missing item, but condition checks at checkout and return are inconsistent and there is no clear process for detection, handling or accountability.",
    choices: [
      "Support damage or loss detection, handling and accountability with clear condition checks and documented processes at checkout and return",
      "Handle claims case by case without consistent condition records or defined responsibilities",
      "Apply charges by default based on the system's assessment unless the renter disputes immediately",
    ],
    best: 0,
    assurance: "Damage/loss handling & accountability",
    feedback:
      "Accountable rental processes need evidence: consistent condition checks and documented handling support fair detection, resolution and accountability for damage or loss.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The system sets pricing, deposits and rental terms, but renters are not clearly informed of rates, deposit holds, late fees, exclusions or return conditions before agreeing.",
    choices: [
      "Communicate pricing, deposits and service terms transparently before checkout, including fees, holds, exclusions and return conditions",
      "Provide a basic rate up front and explain deposits, fees and detailed terms only at return or on the invoice",
      "Rely on standard posted terms that do not explain case-specific pricing, deposits or conditions",
    ],
    best: 0,
    assurance: "Transparent pricing, deposits & terms",
    feedback:
      "Renters need clear expectations: transparent pricing, deposits and service terms help people make informed decisions and reduce disputes over charges or conditions.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service captures renter data and images of equipment for verification and records, but checkout, return and maintenance history is hard to trace and data or images are retained beyond what is needed.",
    choices: [
      "Log checkout, return and maintenance records for traceability and dispute review, and apply privacy and minimisation to renter and usage data or images",
      "Retain all renter data, images and logs indefinitely to support operations and future claims",
      "Keep minimal records to limit data, even when it prevents tracing equipment history or reviewing disputes",
    ],
    best: 0,
    assurance: "Traceability, privacy & dispute review",
    feedback:
      "Responsible rentals balance accountability and privacy: traceable checkout, return and maintenance records with minimised, safeguarded data support dispute review without unnecessary retention.",
  },
  {
    id: "review-fallback",
    scenario:
      "An item condition is contested, a reservation or availability issue arises or the system is uncertain about a return assessment, but staff have no clear path for human review or fallback.",
    choices: [
      "Provide human review and fallback for exceptions, disputes or uncertain cases, with clear escalation paths",
      "Follow the system's assessment or availability decision by default to keep operations consistent",
      "Leave exception handling to individual staff judgement without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Uncertain or contested cases need careful judgement: clear human review and fallback pathways help resolve disputes and exceptions fairly and safely.",
  },
];

export function equipmentToolRentalScore(answers: Record<string, number>) {
  const done = EQUIPMENT_TOOL_RENTAL_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EQUIPMENT_TOOL_RENTAL_ROUNDS.length,
  };
}
