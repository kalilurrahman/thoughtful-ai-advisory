export type CampingGlampingRecreationSiteBookingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CAMPING_GLAMPING_RECREATION_SITE_BOOKING_ROUNDS: CampingGlampingRecreationSiteBookingRound[] =
  [
    {
      id: "identification-availability",
      scenario:
        "An AI system shows campsite or amenity availability and matches guests to reserved sites, but it double-books a site, lists an unavailable or closed site as bookable or assigns guests to the wrong site type or amenity.",
      choices: [
        "Ensure site or amenity identification, availability and reservation matching are accurate, with checks for uncertain or conflicting availability and site data",
        "Rely on automated availability feeds and default assignments to keep bookings fast, correcting errors only when guests arrive",
        "Ask guests to work out site assignment on arrival or share bookings informally if something seems off",
      ],
      best: 0,
      assurance: "Accurate identification, availability & reservation matching",
      feedback:
        "Outdoor bookings must be dependable: accurate site/amenity identification, availability and reservation matching, with checks for uncertainty, help prevent double-bookings and wasted trips.",
    },
    {
      id: "pricing-rules-terms",
      scenario:
        "The booking flow sets rates and site rules, but guests are not clearly informed of pricing, cancellation or refund rules, quiet hours, occupancy limits or other conditions before they reserve.",
      choices: [
        "Communicate pricing, rules and reservation terms transparently before reservation, including cancellation/refund rules, quiet hours, occupancy limits and site conditions",
        "Show a headline nightly rate and reveal cancellation rules, fees or site conditions only after the booking is confirmed",
        "Rely on general park terms that do not clearly explain booking-specific charges, rules or refund conditions",
      ],
      best: 0,
      assurance: "Transparent pricing, rules & reservation terms",
      feedback:
        "Guests need clear expectations before they reserve: transparent pricing, rules and reservation terms help people choose the right site and reduce disputes about charges, limits or refunds.",
    },
    {
      id: "safety-incident-handling",
      scenario:
        "Severe weather, a fire risk, a maintenance hazard or an on-site incident affects guests, but detection, notification and handling are inconsistent and it is unclear who is accountable for warnings and response.",
      choices: [
        "Support safety, weather, maintenance or incident detection, reporting and handling and accountability with clear processes, timely notifications and documented follow-up",
        "Handle warnings and incidents case by case when staff become aware of them, without consistent records or responsibility tracking",
        "Post general notices and leave guests to monitor conditions themselves",
      ],
      best: 0,
      assurance: "Safety, weather & incident handling",
      feedback:
        "Outdoor sites carry real safety exposure: clear detection, reporting and accountable handling of safety, weather, maintenance or incident situations — with timely guest notification — protects people and trust.",
    },
    {
      id: "privacy-traceability",
      scenario:
        "The service stores guest details, bookings and location data, but records are hard to trace for disputes and personal, booking or location data is retained and shared more than necessary.",
      choices: [
        "Apply privacy and minimisation to guest, booking and location data, and log booking, check-in and incident records for traceability and dispute review",
        "Retain all guest, booking and location data indefinitely for analytics, marketing and future investigations",
        "Keep minimal records to limit data, even when it prevents tracing a booking or resolving a dispute",
      ],
      best: 0,
      assurance: "Privacy, traceability & dispute review",
      feedback:
        "Booking services should balance privacy and accountability: minimised, safeguarded data with traceable booking, check-in and incident records supports dispute review without unnecessary exposure.",
    },
    {
      id: "support-fallback",
      scenario:
        "A booking fails at confirmation, a refund is disputed, a safety concern is raised or the case is uncertain, but guests have no clear human support or fallback path.",
      choices: [
        "Provide human support and fallback for booking failures, safety concerns, disputes or uncertain cases, with clear ways to get timely help",
        "Direct guests to automated help steps only, even when booking, refund or safety issues remain unresolved",
        "Leave resolution to repeated attempts or on-site staff availability without a defined support or escalation path",
      ],
      best: 0,
      assurance: "Human support & fallback",
      feedback:
        "Guests often book from afar and arrive to surprises: clear human support and fallback pathways resolve booking failures, refund disputes and safety concerns promptly and fairly.",
    },
  ];

export function campingGlampingRecreationSiteBookingScore(answers: Record<string, number>) {
  const done = CAMPING_GLAMPING_RECREATION_SITE_BOOKING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CAMPING_GLAMPING_RECREATION_SITE_BOOKING_ROUNDS.length,
  };
}
