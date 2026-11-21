export type TicketingVenueAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TICKETING_VENUE_ACCESS_ROUNDS: TicketingVenueAccessRound[] = [
  {
    id: "fairness-barriers",
    scenario:
      "An AI system adjusts prices and flags suspected bots or fraud, but its decisions disproportionately block or surcharge certain groups and create unjust barriers to purchase or entry.",
    choices: [
      "Ensure pricing, fraud and bot-detection decisions are fair and do not create unjust barriers, and review outcomes for disproportionate impact",
      "Optimise solely to maximise revenue and reduce fraud losses, accepting uneven impacts on access",
      "Treat all automated flags and price changes as final because they are data-driven",
    ],
    best: 0,
    assurance: "Fair pricing & anti-fraud decisions",
    feedback:
      "Access decisions should be proportionate: pricing and anti-fraud controls must be monitored so they reduce abuse without creating unjust barriers for patrons.",
  },
  {
    id: "accessibility-equity",
    scenario:
      "Ticketing and access flows rely on AI-assisted interfaces and checks that are difficult to use with assistive technologies or for patrons with limited connectivity, language or documentation.",
    choices: [
      "Support accessibility and equitable access for diverse patrons, providing alternatives and assistance where needed",
      "Design for the fastest digital path and expect patrons to adapt to the required tools and checks",
      "Offer accommodations only when a patron can prove eligibility in advance",
    ],
    best: 0,
    assurance: "Accessibility & equitable access",
    feedback:
      "Venues serve diverse audiences: accessible, equitable ticketing and access paths with alternatives help ensure AI-assisted controls do not exclude patrons.",
  },
  {
    id: "verification-safeguards",
    scenario:
      "To speed entry, the system collects identity or biometric/verification data beyond what is needed and retains it without clear safeguards, purpose limits or minimisation.",
    choices: [
      "Handle identity, biometric or verification data with minimisation and safeguards where used, limiting collection, retention and access",
      "Collect and keep as much verification data as possible to improve future fraud detection",
      "Share verification data broadly with partners without clear purpose limits or protections",
    ],
    best: 0,
    assurance: "Verification data minimisation & safeguards",
    feedback:
      "Verification data can be sensitive: minimisation, purpose limits and safeguards reduce privacy risk while supporting legitimate access and fraud controls.",
  },
  {
    id: "transparency-review",
    scenario:
      "A patron is denied purchase or entry by an automated decision, but receives no clear explanation of the reason, terms or restrictions, and there is no human review or appeal for consequential outcomes.",
    choices: [
      "Communicate decisions, denials, restrictions and terms transparently as appropriate, and provide human review and appeals for consequential access or pricing decisions",
      "Provide a generic refusal without reasons to protect detection methods",
      "Treat automated denials as final to deter abuse, without an appeal route",
    ],
    best: 0,
    assurance: "Transparency, review & appeals",
    feedback:
      "Consequential denials need accountability: clear communication and access to human review or appeals help patrons understand and contest unfair or mistaken decisions.",
  },
  {
    id: "traceability-fallback",
    scenario:
      "At a busy entry point the access system fails or misreads credentials, staff cannot see what checks were performed or why, and there is no tested fallback to admit legitimate patrons safely.",
    choices: [
      "Log decisions, checks and model or system versions for traceability, and maintain tested fallback procedures for entry or access failures",
      "Rely on ad hoc judgement at the gate without records or a practised fallback process",
      "Deny entry whenever the automated check cannot confirm access to avoid risk",
    ],
    best: 0,
    assurance: "Traceability & fallback for access failures",
    feedback:
      "Reliable access needs continuity and evidence: traceable records and tested fallback procedures help resolve failures, correct errors and admit legitimate patrons safely.",
  },
];

export function ticketingVenueAccessScore(answers: Record<string, number>) {
  const done = TICKETING_VENUE_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TICKETING_VENUE_ACCESS_ROUNDS.length,
  };
}
