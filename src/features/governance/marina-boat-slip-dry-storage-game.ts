export type MarinaBoatSlipDryStorageRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MARINA_BOAT_SLIP_DRY_STORAGE_ROUNDS: MarinaBoatSlipDryStorageRound[] = [
  {
    id: "identification-availability",
    scenario:
      "An AI system shows slip, berth or dry-storage availability and matches vessels to spaces, but it double-books a slip, assigns a vessel to an undersized or unavailable space or shows an occupied berth as open.",
    choices: [
      "Ensure slip, berth or storage identification, availability and vessel matching are accurate, with checks for uncertain or conflicting availability and vessel-dimension data",
      "Rely on automated availability feeds and default assignments to keep bookings fast, correcting errors only when members arrive",
      "Ask members to sort out slip assignment on arrival or share space informally if something seems off",
    ],
    best: 0,
    assurance: "Accurate identification, availability & vessel matching",
    feedback:
      "Waterfront bookings must be dependable: accurate slip/berth/storage identification, availability and vessel matching, with checks for uncertainty, help prevent double-bookings and unsafe or wasted placements.",
  },
  {
    id: "pricing-terms",
    scenario:
      "The service sets seasonal rates and slip or storage charges, but members are not clearly informed of pricing, seasonal terms, usage rules or cancellation conditions before they commit.",
    choices: [
      "Communicate pricing, seasonal terms and usage rules transparently before commitment, including rates, seasonal conditions, usage rules and cancellation terms",
      "Show a headline rate and reveal seasonal conditions, fees or usage rules only after charges apply",
      "Rely on general marina terms that do not clearly explain slip-specific charges, seasonal conditions or rules",
    ],
    best: 0,
    assurance: "Transparent pricing, seasonal terms & usage rules",
    feedback:
      "Members need clear expectations before they commit: transparent pricing, seasonal terms and usage rules reduce disputes about charges, seasons and space use.",
  },
  {
    id: "safety-incident-handling",
    scenario:
      "A storm, a mooring failure, a fuel or electrical hazard or an on-site incident affects vessels or people, but detection, notification and handling are inconsistent and it is unclear who is accountable for warnings and response.",
    choices: [
      "Support safety, maintenance or incident detection, reporting and handling and accountability with clear processes, timely notifications and documented follow-up",
      "Handle warnings and incidents case by case as staff become aware of them, without consistent records or responsibility tracking",
      "Post general notices and leave members to monitor conditions themselves",
    ],
    best: 0,
    assurance: "Safety, maintenance & incident handling",
    feedback:
      "Marinas carry real safety exposure: clear detection, reporting and accountable handling of safety, maintenance or incident situations — with timely notification — protects people, vessels and trust.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service stores member details, vessel information, location and usage data, but records are hard to trace for disputes and personal, vessel or usage data is retained and shared more than necessary.",
    choices: [
      "Apply privacy and minimisation to member, vessel and location or usage data, and log access, booking and incident records for traceability and dispute review",
      "Retain all member, vessel, location and usage data indefinitely for analytics, security and future investigations",
      "Keep minimal records to limit data, even when it prevents tracing a booking or resolving a dispute",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Marina services should balance privacy and accountability: minimised, safeguarded data with traceable access, booking and incident records supports dispute review without unnecessary exposure.",
  },
  {
    id: "support-fallback",
    scenario:
      "A slip booking fails, a seasonal charge is disputed, a safety concern is raised or the case is uncertain, but members have no clear human support or fallback path.",
    choices: [
      "Provide human support and fallback for access failures, safety concerns, disputes or uncertain cases, with clear ways to get timely help",
      "Direct members to automated help steps only, even when booking, billing or safety issues remain unresolved",
      "Leave resolution to repeated attempts or on-site availability without a defined support or escalation path",
    ],
    best: 0,
    assurance: "Human support & fallback",
    feedback:
      "Members often reach the marina from afar: clear human support and fallback pathways resolve booking failures, disputes and safety concerns promptly and fairly.",
  },
];

export function marinaBoatSlipDryStorageScore(answers: Record<string, number>) {
  const done = MARINA_BOAT_SLIP_DRY_STORAGE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MARINA_BOAT_SLIP_DRY_STORAGE_ROUNDS.length,
  };
}
