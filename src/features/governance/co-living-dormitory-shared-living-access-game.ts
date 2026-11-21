export type CoLivingDormitorySharedLivingAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CO_LIVING_DORMITORY_SHARED_LIVING_ACCESS_ROUNDS: CoLivingDormitorySharedLivingAccessRound[] =
  [
    {
      id: "identification-authorization",
      scenario:
        "An AI system manages resident and guest access, room or amenity assignments, but it grants entry to the wrong person, assigns a resident to the wrong room or amenity or fails an authorized guest access.",
      choices: [
        "Ensure resident or guest identification, room or amenity assignment and access authorization are accurate, with checks for uncertain or conflicting identity and permission data",
        "Rely on automated assignments and access rules to reduce friction, correcting errors only when residents report them",
        "Ask residents to work around access issues or share credentials temporarily to keep things moving",
      ],
      best: 0,
      assurance: "Accurate identification, assignment & authorization",
      feedback:
        "Shared living needs controlled, dependable access: accurate resident/guest identification, room or amenity assignment and access authorization, with checks for uncertainty, help prevent wrongful access and lockouts.",
    },
    {
      id: "rules-fees-terms",
      scenario:
        "The system sets house rules, fees and amenity terms, but residents and guests are not clearly informed of quiet hours, guest policies, shared-space rules, fees or booking terms before they commit or use amenities.",
      choices: [
        "Communicate house rules, fees and amenity terms transparently before and during use, including quiet hours, guest policies, fees and amenity booking conditions",
        "Show headline rules and prices, explaining detailed conditions, fees or policies only after they apply",
        "Rely on general lease or community terms that do not clearly explain amenity-specific rules or charges",
      ],
      best: 0,
      assurance: "Transparent house rules, fees & amenity terms",
      feedback:
        "Residents need clear expectations: transparent house rules, fees and amenity terms help people live together well and reduce disputes about charges, limits or shared-space use.",
    },
    {
      id: "issue-handling",
      scenario:
        "A resident reports a noise problem, a maintenance fault or an incident with another resident or guest, but detection, reporting and handling are inconsistent and it is unclear who is accountable for follow-up.",
      choices: [
        "Support incident, maintenance or noise issue detection, reporting and handling and accountability with clear processes and documented follow-up",
        "Handle issues case by case as they are noticed, without consistent records or responsibility tracking",
        "Provide a report channel with no commitment to response times or resolution",
      ],
      best: 0,
      assurance: "Incident, maintenance & noise issue handling",
      feedback:
        "Shared spaces need dependable responses: clear detection, reporting and accountability for incident, maintenance or noise issues support timely resolution and community trust.",
    },
    {
      id: "privacy-traceability",
      scenario:
        "The service records resident, guest, access and occupancy data for shared living, but records are hard to trace for disputes and personal, access or occupancy data is retained and shared more than necessary.",
      choices: [
        "Apply privacy and minimisation to resident, guest and access or occupancy data, and log access, amenity and incident records for traceability and dispute review",
        "Retain all resident, guest, access and occupancy data indefinitely for security, analytics and future investigations",
        "Keep minimal records to limit data, even when it prevents tracing an access event or resolving a dispute",
      ],
      best: 0,
      assurance: "Privacy, traceability & dispute review",
      feedback:
        "Shared-living services should balance safety and privacy: minimised, safeguarded data with traceable access, amenity and incident records supports dispute review without unnecessary exposure — living-space data is especially sensitive.",
    },
    {
      id: "review-fallback",
      scenario:
        "A resident or guest faces a denied entry, an amenity booking conflict or a disputed incident, and the automated system is uncertain, but there is no clear path for human review or fallback.",
      choices: [
        "Provide human review and fallback for access issues, disputes or uncertain cases, with clear escalation and timely support paths",
        "Enforce automated access and assignment decisions by default to keep operations consistent, even when the case is unclear",
        "Leave resolution to ad hoc staff judgement without defined review or escalation routes",
      ],
      best: 0,
      assurance: "Human review & fallback for exceptions",
      feedback:
        "Uncertain or contested shared-living situations need careful handling: clear human review and fallback pathways help resolve access issues and disputes fairly while maintaining appropriate controls.",
    },
  ];

export function coLivingDormitorySharedLivingAccessScore(answers: Record<string, number>) {
  const done = CO_LIVING_DORMITORY_SHARED_LIVING_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CO_LIVING_DORMITORY_SHARED_LIVING_ACCESS_ROUNDS.length,
  };
}
