export type FarmersMarketStallVendorBookingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const FARMERS_MARKET_STALL_VENDOR_BOOKING_ROUNDS: FarmersMarketStallVendorBookingRound[] = [
  {
    id: "identification-availability",
    scenario:
      "An AI system manages stall availability and matches vendors to spaces, but it double-books a stall, assigns a vendor to an unsuitable or unavailable space or shows an occupied stall as open.",
    choices: [
      "Ensure stall identification, availability and vendor matching are accurate, with checks for uncertain or conflicting availability and vendor-requirement data",
      "Rely on automated availability feeds and default assignments to keep bookings fast, correcting errors only when vendors arrive",
      "Ask vendors to sort out stall assignment on arrival or trade spaces informally if something seems off",
    ],
    best: 0,
    assurance: "Accurate stall identification, availability & vendor matching",
    feedback:
      "Market-day bookings must be dependable: accurate stall identification, availability and vendor matching, with checks for uncertainty, help prevent double-bookings and unsuitable or wasted placements.",
  },
  {
    id: "pricing-terms",
    scenario:
      "The market sets stall fees and booking terms, but vendors are not clearly informed of pricing, stall rules, pitch conditions or cancellation terms before they commit.",
    choices: [
      "Communicate pricing, stall rules and booking terms transparently before commitment, including fees, pitch conditions, stall rules and cancellation terms",
      "Show a headline fee and reveal stall rules, conditions or cancellation terms only after charges apply",
      "Rely on general market terms that do not clearly explain stall-specific charges, rules or conditions",
    ],
    best: 0,
    assurance: "Transparent pricing, stall rules & booking terms",
    feedback:
      "Vendors need clear expectations before they commit: transparent pricing, stall rules and booking terms reduce disputes about fees, pitch use and cancellations.",
  },
  {
    id: "safety-inspection-handling",
    scenario:
      "A fire-safety issue, a failed food inspection or an on-site incident affects stalls or visitors, but detection, notification and handling are inconsistent and it is unclear who is accountable for warnings and response.",
    choices: [
      "Support safety, inspection or incident detection, reporting and handling and accountability with clear processes, timely notifications and documented follow-up",
      "Handle warnings and incidents case by case as staff become aware of them, without consistent records or responsibility tracking",
      "Post general notices and leave vendors to monitor conditions themselves",
    ],
    best: 0,
    assurance: "Safety, inspection & incident handling",
    feedback:
      "Markets carry real safety exposure: clear detection, reporting and accountable handling of safety, inspection or incident situations — with timely notification — protects vendors, visitors and trust.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The market stores vendor details, stall assignments and transaction data, but records are hard to trace for disputes and personal, booth or transaction data is retained and shared more than necessary.",
    choices: [
      "Apply privacy and minimisation to vendor, booth and transaction data, and log booking, stall and incident records for traceability and dispute review",
      "Retain all vendor, booth and transaction data indefinitely for analytics, security and future investigations",
      "Keep minimal records to limit data, even when it prevents tracing a booking or resolving a dispute",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Market services should balance privacy and accountability: minimised, safeguarded data with traceable booking, stall and incident records supports dispute review without unnecessary exposure.",
  },
  {
    id: "review-fallback",
    scenario:
      "A stall booking fails, a fee is disputed, a safety concern is raised or the case is uncertain, but vendors have no clear path for human review or fallback.",
    choices: [
      "Provide human review and fallback for booking failures, safety concerns, disputes or uncertain cases, with clear escalation and timely support paths",
      "Enforce automated booking and assignment decisions by default to keep operations consistent, even when the case is unclear",
      "Leave resolution to ad hoc staff judgement without defined review or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Vendors depend on market day for their livelihood: clear human review and fallback pathways resolve booking failures, disputes and safety concerns promptly and fairly.",
  },
];

export function farmersMarketStallVendorBookingScore(answers: Record<string, number>) {
  const done = FARMERS_MARKET_STALL_VENDOR_BOOKING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === FARMERS_MARKET_STALL_VENDOR_BOOKING_ROUNDS.length,
  };
}
