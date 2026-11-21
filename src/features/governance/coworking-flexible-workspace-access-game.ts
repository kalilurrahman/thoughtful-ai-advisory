export type CoworkingFlexibleWorkspaceAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const COWORKING_FLEXIBLE_WORKSPACE_ACCESS_ROUNDS: CoworkingFlexibleWorkspaceAccessRound[] = [
  {
    id: "access-authorization",
    scenario:
      "An AI system manages member and guest access, bookings and space assignments, but it grants access to the wrong person or space, denies an entitled booking or mismatches guest permissions.",
    choices: [
      "Ensure member or guest identification, access authorization and booking access are accurate, with checks for uncertain or conflicting permissions",
      "Rely on automated access rules and fast approvals to reduce friction, correcting mistakes only when reported",
      "Ask users to work around access issues or share credentials temporarily to keep work moving",
    ],
    best: 0,
    assurance: "Accurate authorization & booking access",
    feedback:
      "Workspace access must be both usable and controlled: accurate identification, authorization and booking access, with checks for uncertainty, help prevent wrongful access and lockouts.",
  },
  {
    id: "incident-accountability",
    scenario:
      "A member reports an access failure, amenity issue or incident in a shared space, but detection, reporting and handling are inconsistent and it is unclear who is responsible for follow-up and resolution.",
    choices: [
      "Support incident, amenity or access issue detection, handling and accountability with clear processes and documented follow-up",
      "Handle issues informally as staff become aware of them without consistent reporting or responsibility tracking",
      "Provide self-service reporting only, with limited visibility into whether issues are addressed or by whom",
    ],
    best: 0,
    assurance: "Issue handling & accountability",
    feedback:
      "Shared spaces need dependable responses: clear detection, handling and accountability for incidents, amenity or access issues support timely resolution and trust.",
  },
  {
    id: "transparency-terms",
    scenario:
      "The system presents plans, bookings and usage-based charges, but members and guests are not clearly informed of pricing, plan limits, guest policies or usage terms before committing or using spaces.",
    choices: [
      "Communicate pricing, plans and usage terms transparently before and during use, including limits, guest policies and applicable charges",
      "Show headline plan prices and booking options, explaining detailed limits, fees or policies only after charges or restrictions apply",
      "Rely on general membership terms that do not clearly explain booking- or usage-specific conditions",
    ],
    best: 0,
    assurance: "Transparent pricing, plans & usage terms",
    feedback:
      "Members and guests need clear expectations: transparent pricing, plans and usage terms help people choose appropriately and reduce disputes about access, limits or charges.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The workspace collects access, booking and usage data about members and guests, but records are hard to trace for reviews and data is retained or shared more broadly than necessary.",
    choices: [
      "Apply privacy and minimisation to member, guest and access or usage data, and log access, booking and incident records for traceability and dispute review",
      "Retain detailed access and usage histories indefinitely to support operations, analytics and security reviews",
      "Keep minimal records to limit data, even when it prevents reviewing access events or resolving disputes",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Workspace systems should balance safety, privacy and accountability: minimised, safeguarded data with traceable access, booking and incident records supports review without unnecessary exposure.",
  },
  {
    id: "review-fallback",
    scenario:
      "A member or guest faces a denied entry, booking conflict or disputed incident and the automated system is uncertain, but there is no clear path for human review or fallback.",
    choices: [
      "Provide human review and fallback for access issues, disputes or uncertain cases, with clear escalation and timely support paths",
      "Enforce automated access and booking decisions by default to keep operations consistent, even when the case is unclear",
      "Leave resolution to ad hoc staff judgement without defined review or escalation routes",
    ],
    best: 0,
    assurance: "Human review & fallback for exceptions",
    feedback:
      "Uncertain or contested access situations need careful handling: clear human review and fallback pathways help resolve issues fairly while maintaining appropriate controls.",
  },
];

export function coworkingFlexibleWorkspaceAccessScore(answers: Record<string, number>) {
  const done = COWORKING_FLEXIBLE_WORKSPACE_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === COWORKING_FLEXIBLE_WORKSPACE_ACCESS_ROUNDS.length,
  };
}
