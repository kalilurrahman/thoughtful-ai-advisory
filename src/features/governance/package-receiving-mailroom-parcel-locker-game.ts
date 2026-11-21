export type PackageReceivingMailroomParcelLockerRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PACKAGE_RECEIVING_MAILROOM_PARCEL_LOCKER_ROUNDS: PackageReceivingMailroomParcelLockerRound[] = [
  {
    id: "identification-assignment",
    scenario:
      "An AI system identifies packages and assigns them to recipients, mailroom slots or lockers, but it misreads labels or mismatches recipients, sending notifications to the wrong person or placing items in the wrong location.",
    choices: [
      "Ensure recipient or package identification and locker or mailroom assignment are accurate, with checks for uncertain or conflicting matches",
      "Rely on automated scans and default assignments to speed processing, correcting errors only when recipients report them",
      "Ask recipients to search for their packages or verify assignments themselves if something seems off",
    ],
    best: 0,
    assurance: "Accurate identification & assignment",
    feedback:
      "Reliable receiving depends on getting the match right: accurate recipient/package identification and assignment, with checks for uncertainty, help prevent misdelivery and access confusion.",
  },
  {
    id: "authorization-custody",
    scenario:
      "A package is released for pickup, but authorization checks are weak or handoff steps are not clearly recorded, making it unclear who collected the item and whether custody was properly transferred.",
    choices: [
      "Support pickup authorization and handoff or custody accountability with clear checks and documented transfer steps",
      "Allow flexible pickup to reduce friction, relying on informal confirmation rather than consistent authorization or custody records",
      "Treat notification delivery as sufficient proof of proper release without recording who collected the package",
    ],
    best: 0,
    assurance: "Pickup authorization & custody accountability",
    feedback:
      "Custody transitions must be accountable: clear authorization checks and documented handoff steps help ensure packages are released to the right person and responsibility is clear.",
  },
  {
    id: "issue-handling",
    scenario:
      "A recipient reports a damaged, missing or possibly stolen package, but there is no consistent process to detect issues, record condition and custody context or handle the report fairly.",
    choices: [
      "Support damage, loss or theft detection, reporting and handling with clear processes and documented context",
      "Handle issues case by case without consistent records of condition, custody or notifications",
      "Limit responsibility by default unless the recipient can provide immediate, detailed proof",
    ],
    best: 0,
    assurance: "Damage, loss or theft handling",
    feedback:
      "Trustworthy receiving services need accountable issue handling: clear detection, reporting and documented context support fair resolution when packages are damaged, lost or stolen.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service stores recipient details, package information and access logs, but notifications and custody records are hard to trace and personal or package data is retained and shared more than necessary.",
    choices: [
      "Apply privacy and minimisation to recipient and package data, and log custody, notification and access records for traceability and dispute review",
      "Retain all recipient, package and access data indefinitely to support operations and future investigations",
      "Keep minimal records to limit data, even when it prevents tracing custody or resolving disputes",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Receiving services should balance privacy and accountability: minimised, safeguarded data with traceable custody, notification and access records supports dispute review without unnecessary exposure.",
  },
  {
    id: "support-fallback",
    scenario:
      "A locker will not open, a pickup code fails or there is a dispute about whether a package was collected, but recipients have no clear human support or fallback path.",
    choices: [
      "Provide human support and fallback for access failures, disputes or uncertain cases, with clear ways to get timely help",
      "Direct recipients to automated help steps only, even when access or custody issues remain unresolved",
      "Leave resolution to repeated attempts or staff availability without a defined support or escalation path",
    ],
    best: 0,
    assurance: "Human support & fallback",
    feedback:
      "When automated access or records fall short, people need help: clear human support and fallback pathways help resolve access failures and disputes promptly and fairly.",
  },
];

export function packageReceivingMailroomParcelLockerScore(answers: Record<string, number>) {
  const done = PACKAGE_RECEIVING_MAILROOM_PARCEL_LOCKER_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PACKAGE_RECEIVING_MAILROOM_PARCEL_LOCKER_ROUNDS.length,
  };
}
