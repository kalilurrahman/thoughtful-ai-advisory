export type MovingRelocationHouseholdGoodsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MOVING_RELOCATION_HOUSEHOLD_GOODS_ROUNDS: MovingRelocationHouseholdGoodsRound[] = [
  {
    id: "inventory-condition",
    scenario:
      "An AI-assisted survey inventories belongings and records their condition before a move, but it miscounts items or misses pre-existing damage, leading to disputes about what was shipped and its condition.",
    choices: [
      "Capture inventory and condition accurately for items and belongings, with checks for uncertain, high-value or fragile cases",
      "Rely on automated scans and quick estimates to speed up booking and loading",
      "Ask customers to accept the recorded inventory unless they can prove discrepancies later",
    ],
    best: 0,
    assurance: "Accurate inventory & condition capture",
    feedback:
      "A reliable baseline prevents disputes: accurate inventory and condition records, with checks for uncertain or high-value items, clarify what was entrusted and its state before the move.",
  },
  {
    id: "damage-accountability",
    scenario:
      "After delivery or pickup from storage a customer reports damage or missing items, but handling steps and custody transitions are poorly documented and accountability is unclear.",
    choices: [
      "Support handling, damage or loss detection and accountability with clear checks and documented processes across packing, transport and storage",
      "Handle claims informally without consistent condition checks or defined responsibilities at each handoff",
      "Limit responsibility by default unless the customer can provide detailed proof of loss or damage",
    ],
    best: 0,
    assurance: "Damage/loss handling & accountability",
    feedback:
      "Accountable service needs evidence: clear handling checks and documented processes across each stage support fair detection, resolution and accountability for damage or loss.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The system generates quotes and schedules moves, but customers are not clearly informed of pricing, fees, timing, storage terms, exclusions or how estimates may change before agreeing.",
    choices: [
      "Communicate quotes, pricing and service terms transparently before service, including fees, timing, exclusions and how changes are handled",
      "Provide a quick estimate now and explain final charges and terms only after the move or storage period",
      "Rely on standard terms that do not explain case-specific pricing, timing or storage conditions",
    ],
    best: 0,
    assurance: "Transparent quotes, pricing & terms",
    feedback:
      "Customers need clear expectations: transparent quotes, pricing and service terms help people make informed decisions and reduce disputes about costs or conditions.",
  },
  {
    id: "custody-privacy-traceability",
    scenario:
      "AI tracks moves and storage using detailed inventories, images and location data of belongings and homes, but chain-of-custody records are incomplete and sensitive property data is retained and shared more than necessary.",
    choices: [
      "Maintain traceable scheduling and chain-of-custody records across handling and storage, and apply privacy and minimisation to customer and property data or images",
      "Collect and retain all available inventory, image and location data indefinitely to support operations and future claims",
      "Keep minimal records to limit data exposure, even when it prevents tracing custody or reviewing what happened",
    ],
    best: 0,
    assurance: "Chain-of-custody, privacy & traceability",
    feedback:
      "Moves involve custody and sensitive property details: traceable chain-of-custody records with minimised, safeguarded data support accountability and dispute review without unnecessary exposure.",
  },
  {
    id: "review-fallback",
    scenario:
      "An unusual item, access constraint, storage issue or a disputed outcome arises, but staff have no clear path for human review or fallback when the AI plan or assessment is uncertain.",
    choices: [
      "Provide human review and fallback for exceptions, disputes or uncertain cases, with clear escalation paths",
      "Follow the AI plan or assessment by default to keep the schedule on track",
      "Leave exception handling to individual crew or staff judgement without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Uncertain or contested situations need careful judgement: clear human review and fallback pathways help resolve exceptions and disputes safely and fairly.",
  },
];

export function movingRelocationHouseholdGoodsScore(answers: Record<string, number>) {
  const done = MOVING_RELOCATION_HOUSEHOLD_GOODS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MOVING_RELOCATION_HOUSEHOLD_GOODS_ROUNDS.length,
  };
}
