export type CarWashVehicleDetailingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CAR_WASH_VEHICLE_DETAILING_ROUNDS: CarWashVehicleDetailingRound[] = [
  {
    id: "identification-condition",
    scenario:
      "An AI system identifies vehicles, selects services and records pre-existing condition, but it misidentifies a vehicle or misses prior marks, leading to disputes about what service was needed and what damage was pre-existing.",
    choices: [
      "Capture vehicle identification, service selection and pre-existing condition accurately, with checks for uncertain or unclear cases",
      "Rely on automated scans and default service matching to keep the line moving",
      "Ask customers to accept the system's record unless they can prove it is wrong later",
    ],
    best: 0,
    assurance: "Accurate identification & pre-existing condition capture",
    feedback:
      "Accurate intake records prevent disputes: reliable identification and pre-existing condition capture with checks for uncertainty help set a fair baseline for service.",
  },
  {
    id: "damage-accountability",
    scenario:
      "After service a customer reports new damage, but there is no clear process to detect incidents, document handling or determine accountability between automated and manual steps.",
    choices: [
      "Support damage or incident detection, handling and accountability with clear checks and documented processes",
      "Handle claims informally without consistent incident records or defined responsibilities",
      "Deny responsibility by default unless damage is immediately obvious at pickup",
    ],
    best: 0,
    assurance: "Damage/incident handling & accountability",
    feedback:
      "Accountable service needs evidence: clear detection, documentation and handling processes support fair resolution when damage or incidents are reported.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The system recommends packages or upsells and adjusts pricing, but customers are not clearly informed of what is included, optional add-ons, exclusions or final terms before agreeing.",
    choices: [
      "Communicate pricing, packages or upsells and service terms transparently before service, distinguishing required work from optional extras",
      "Present the recommended package as the standard option without clearly separating optional upsells or exclusions",
      "Explain pricing and terms only after the service is completed",
    ],
    best: 0,
    assurance: "Transparent pricing, upsells & terms",
    feedback:
      "Customers should understand what they are buying: transparent pricing, packages, upsells and terms enable informed consent and reduce disputes.",
  },
  {
    id: "consent-privacy-traceability",
    scenario:
      "Cameras and AI capture images and data about vehicles and customers for quality and records, but consent is unclear, retention is excessive and condition records are not traceably linked to decisions or system versions.",
    choices: [
      "Minimise and safeguard consented capture and use of vehicle and customer data or images, and log decisions, condition records and model or system versions for traceability and dispute review",
      "Capture and retain all available images and data by default to support future claims and analytics",
      "Avoid keeping condition records to limit data, even when it prevents reviewing disputed outcomes",
    ],
    best: 0,
    assurance: "Consent, privacy & traceability",
    feedback:
      "Data capture should be necessary and accountable: consented, minimised use with traceable condition and decision records supports privacy and fair dispute review.",
  },
  {
    id: "review-fallback",
    scenario:
      "An unusual vehicle condition, conflicting scan results or a customer dispute arises, but staff have no clear path for human review or fallback when the AI assessment is uncertain.",
    choices: [
      "Provide human review and fallback for exceptions, disputes or uncertain cases, with clear escalation paths",
      "Follow the AI assessment by default to keep service consistent and fast",
      "Leave exception handling to individual staff discretion without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Uncertain or contested cases need careful judgement: clear human review and fallback pathways help resolve exceptions and disputes fairly and safely.",
  },
];

export function carWashVehicleDetailingScore(answers: Record<string, number>) {
  const done = CAR_WASH_VEHICLE_DETAILING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CAR_WASH_VEHICLE_DETAILING_ROUNDS.length,
  };
}
