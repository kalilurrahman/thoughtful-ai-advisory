export type BicycleMicromobilityRentalShareRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const BICYCLE_MICROMOBILITY_RENTAL_SHARE_ROUNDS: BicycleMicromobilityRentalShareRound[] = [
  {
    id: "identification-condition",
    scenario:
      "An AI system shows available bikes or scooters and records their condition, but it misidentifies vehicles, shows incorrect availability or misses pre-existing damage, leading to failed unlocks or disputes about condition.",
    choices: [
      "Capture vehicle identification, availability and condition accurately, with checks for uncertain or conflicting signals",
      "Rely on last-known status and automated scans to maximise availability, correcting records only when users report issues",
      "Ask users to accept the recorded condition and availability unless they can prove otherwise after the trip",
    ],
    best: 0,
    assurance: "Accurate identification, availability & condition",
    feedback:
      "Reliable rentals depend on accurate records: correct vehicle identification, availability and condition capture, with checks for uncertainty, help prevent failed access and condition disputes.",
  },
  {
    id: "incident-accountability",
    scenario:
      "After a trip a user is charged for damage or a vehicle is reported stolen, but incident detection, evidence and handling steps are unclear and accountability between the user, service and system is contested.",
    choices: [
      "Support damage, theft or incident detection, handling and accountability with clear checks, evidence practices and documented processes",
      "Handle incidents case by case without consistent detection or records of vehicle state and trip context",
      "Apply charges or penalties by default based on automated signals unless the user disputes quickly",
    ],
    best: 0,
    assurance: "Incident handling & accountability",
    feedback:
      "Fair outcomes require accountable processes: clear detection, evidence and documented handling support appropriate responsibility for damage, theft or incidents.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The app calculates pricing and enforces rules, but users are not clearly informed of fees, time limits, parking zones, penalties or other usage terms before starting or ending a trip.",
    choices: [
      "Communicate pricing, fees and usage terms transparently before and during use, including zones, limits and penalties that may apply",
      "Show a base rate up front and explain fees, zones or penalties only after charges are applied",
      "Rely on general terms that do not clearly explain trip-specific pricing or usage rules",
    ],
    best: 0,
    assurance: "Transparent pricing, fees & usage terms",
    feedback:
      "Users need clear expectations: transparent pricing, fees and usage terms help people make informed choices and reduce disputes about charges or rule enforcement.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service collects detailed location and usage data to operate trips, but data is retained more than necessary and trip, access and condition records are not consistently traceable for review.",
    choices: [
      "Apply privacy and minimisation to location and usage data, and log trip, access and condition records for traceability and dispute review",
      "Retain detailed location and usage histories indefinitely to support operations, analytics and future claims",
      "Collect minimal records to limit data, even when it prevents tracing trips or reviewing disputed incidents",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Mobility services must balance utility, privacy and accountability: minimised, safeguarded location/usage data with traceable trip and condition records supports review without unnecessary retention.",
  },
  {
    id: "review-fallback",
    scenario:
      "A user disputes a charge, reports a safety issue or the system is uncertain about trip end, parking compliance or vehicle condition, but there is no clear path for human review or fallback.",
    choices: [
      "Provide human review and fallback for disputes, safety exceptions or uncertain cases, with clear escalation paths",
      "Apply automated rules and charges by default to keep operations consistent, even when signals are uncertain",
      "Leave exception handling to generic support flows without timely review or clear escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Disputes and safety exceptions need careful handling: clear human review and fallback pathways help resolve uncertain cases fairly and respond appropriately to safety concerns.",
  },
];

export function bicycleMicromobilityRentalShareScore(answers: Record<string, number>) {
  const done = BICYCLE_MICROMOBILITY_RENTAL_SHARE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === BICYCLE_MICROMOBILITY_RENTAL_SHARE_ROUNDS.length,
  };
}
