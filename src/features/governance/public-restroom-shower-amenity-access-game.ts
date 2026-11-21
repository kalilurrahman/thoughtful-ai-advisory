export type PublicRestroomShowerAmenityAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PUBLIC_RESTROOM_SHOWER_AMENITY_ACCESS_ROUNDS: PublicRestroomShowerAmenityAccessRound[] =
  [
    {
      id: "identification-availability",
      scenario:
        "An AI system manages access, occupancy and amenity availability for restrooms, showers or shared amenities, but it shows an occupied or out-of-service facility as available, grants access to the wrong user or mismatches a booking to the wrong facility.",
      choices: [
        "Ensure access, occupancy or amenity-availability and user matching are accurate, with checks for uncertain or stale status and identity data",
        "Rely on last-known occupancy status and automated matching to keep access fast, updating only when users report problems",
        "Ask users to try another facility or retry access themselves if the shown status is wrong",
      ],
      best: 0,
      assurance: "Accurate access, availability & user matching",
      feedback:
        "Amenity access must be dependable: accurate access/occupancy/availability and user matching, with checks for uncertainty, help prevent wrongful access, failed entries and wasted visits.",
    },
    {
      id: "pricing-terms",
      scenario:
        "The service charges fees or sets usage conditions for facilities, but users are not clearly informed of fees, time limits, booking rules or access terms before they pay or enter.",
      choices: [
        "Communicate usage conditions, fees or access terms transparently before payment or entry, including time limits and booking or cancellation rules",
        "Show a headline price or free-entry message and reveal fees, time limits or conditions only after the user commits",
        "Rely on general posted notices that do not clearly explain facility-specific charges, limits or terms",
      ],
      best: 0,
      assurance: "Transparent usage conditions, fees & access terms",
      feedback:
        "People need clear expectations: transparent usage conditions, fees and access terms help users choose appropriately and reduce disputes about charges or limits.",
    },
    {
      id: "issue-handling",
      scenario:
        "A user reports a safety hazard, maintenance fault or cleanliness problem in a facility, but detection, reporting and handling are inconsistent and it is unclear who is accountable for resolution.",
      choices: [
        "Support safety, maintenance or cleanliness issue detection, reporting and handling and accountability with clear processes and documented follow-up",
        "Handle issues case by case when reported informally, without consistent detection, records or responsibility tracking",
        "Provide a suggestion box style channel with no commitment to response times or resolution",
      ],
      best: 0,
      assurance: "Safety, maintenance & cleanliness issue handling",
      feedback:
        "Public amenities carry real safety and hygiene risks: clear detection, reporting and accountable handling of safety, maintenance or cleanliness issues protect users and trust.",
    },
    {
      id: "privacy-traceability",
      scenario:
        "The service records user access, occupancy and sensor data for facilities, but records are hard to trace for disputes and personal, access or sensor data is retained and shared more than necessary.",
      choices: [
        "Apply privacy and minimisation to user, access and sensor or usage data, and log access, occupancy and incident records for traceability and dispute review",
        "Retain all access, occupancy and sensor data indefinitely for analytics, security and future investigations",
        "Keep minimal records to limit data, even when it prevents tracing an access event or resolving a dispute",
      ],
      best: 0,
      assurance: "Privacy, traceability & dispute review",
      feedback:
        "Facility services should balance privacy and accountability: minimised, safeguarded data with traceable access, occupancy and incident records supports review without unnecessary exposure — sensor data about people deserves particular care.",
    },
    {
      id: "support-fallback",
      scenario:
        "Access fails, a safety concern is raised, a fee is disputed or the case is uncertain, but users have no clear human support or fallback path.",
      choices: [
        "Provide human support and fallback for access failures, safety concerns, disputes or uncertain cases, with clear ways to get timely help",
        "Direct users to automated help steps only, even when access, safety or billing issues remain unresolved",
        "Leave resolution to repeated attempts or on-site staff availability without a defined support or escalation path",
      ],
      best: 0,
      assurance: "Human support & fallback",
      feedback:
        "When automated access or records fall short, people need help: clear human support and fallback pathways resolve access failures, safety concerns and disputes promptly and fairly.",
    },
  ];

export function publicRestroomShowerAmenityAccessScore(answers: Record<string, number>) {
  const done = PUBLIC_RESTROOM_SHOWER_AMENITY_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PUBLIC_RESTROOM_SHOWER_AMENITY_ACCESS_ROUNDS.length,
  };
}
