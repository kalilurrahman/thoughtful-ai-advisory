export type VehicleValetParkingAttendantRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VEHICLE_VALET_PARKING_ATTENDANT_ROUNDS: VehicleValetParkingAttendantRound[] = [
  {
    id: "identification-condition",
    scenario:
      "An AI system records vehicle identity and condition at drop-off and retrieval, but it misidentifies a vehicle or misses pre-existing marks, leading to disputes about which car was serviced and what damage was already there.",
    choices: [
      "Capture vehicle identification and condition accurately at handoff and retrieval, with checks for uncertain or unclear cases",
      "Rely on quick scans and ticket matching to keep drop-off and pickup moving fast",
      "Ask customers to accept the recorded condition unless they can prove discrepancies later",
    ],
    best: 0,
    assurance: "Accurate identification & condition capture",
    feedback:
      "A reliable handoff baseline prevents disputes: accurate vehicle identification and condition records at drop-off and retrieval, with checks for uncertainty, clarify responsibility.",
  },
  {
    id: "custody-damage-accountability",
    scenario:
      "While a vehicle is in valet custody a key is mishandled or damage occurs, but there is no clear process to detect incidents, document custody steps or determine accountability.",
    choices: [
      "Support key/custody handling and damage or incident detection, handling and accountability with clear checks and documented processes",
      "Handle issues informally without consistent custody logs or defined responsibilities",
      "Limit responsibility by default unless the customer reports the issue immediately at pickup",
    ],
    best: 0,
    assurance: "Custody, keys & damage/incident accountability",
    feedback:
      "Custody services must be accountable: clear key/custody handling and documented incident detection and response support fair responsibility when something goes wrong.",
  },
  {
    id: "transparency-authorization",
    scenario:
      "The system manages pricing, fees and vehicle retrieval, but customers are not clearly informed of charges and terms, and a vehicle can be released without consistent access or authorization checks.",
    choices: [
      "Communicate pricing, fees and service terms transparently and require clear access and authorization checks before releasing a vehicle",
      "Present charges and terms at pickup only, while allowing flexible release to reduce wait times",
      "Rely on posted general terms and staff discretion for pricing explanations and release authorization",
    ],
    best: 0,
    assurance: "Transparent terms & release authorization",
    feedback:
      "Customers need clarity and control: transparent pricing and terms plus consistent authorization checks help prevent disputes and unauthorized vehicle release.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "Cameras and AI capture vehicle, customer and location data or images for operations and records, but retention is excessive and handoff, custody and condition records are not traceably linked to decisions or system versions.",
    choices: [
      "Apply privacy and minimisation to vehicle, customer and location data or images, and log handoff, custody and condition records and model or system versions for traceability and dispute review",
      "Capture and retain all available images and location data by default to support security and future claims",
      "Keep minimal records to limit data exposure, even when it prevents reviewing custody or disputed incidents",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Operational data should be necessary and accountable: minimised, safeguarded capture with traceable custody and condition records supports privacy and fair dispute review.",
  },
  {
    id: "review-fallback",
    scenario:
      "A retrieval request is disputed, a vehicle condition is contested or the system is uncertain about identity or authorization, but staff have no clear path for human review or fallback.",
    choices: [
      "Provide human review and fallback for exceptions, disputes or uncertain cases, with clear escalation paths",
      "Follow the system's match or recommendation by default to keep retrieval fast",
      "Leave exception handling to individual attendants' judgement without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Uncertain or contested situations require careful judgement: clear human review and fallback pathways help resolve disputes and prevent unsafe or unauthorized actions.",
  },
];

export function vehicleValetParkingAttendantScore(answers: Record<string, number>) {
  const done = VEHICLE_VALET_PARKING_ATTENDANT_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VEHICLE_VALET_PARKING_ATTENDANT_ROUNDS.length,
  };
}
