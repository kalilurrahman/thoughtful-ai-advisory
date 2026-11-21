export type SelfServiceStorageLuggageLockerRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SELF_SERVICE_STORAGE_LUGGAGE_LOCKER_ROUNDS: SelfServiceStorageLuggageLockerRound[] = [
  {
    id: "identification-access",
    scenario:
      "An AI system assigns lockers and manages access codes or credentials, but it mismatches users and lockers, grants access to the wrong locker or denies access to a user with a valid reservation.",
    choices: [
      "Ensure locker assignment, access and user matching are accurate, with checks for uncertain or conflicting matches before granting access",
      "Rely on automated assignments and access rules to speed turnover, correcting mismatches only when users report them",
      "Ask users to try alternative lockers or share access details informally if their assigned locker does not open",
    ],
    best: 0,
    assurance: "Accurate assignment & access",
    feedback:
      "Locker services must get access right: accurate assignment, access and user matching, with checks for uncertainty, help prevent wrongful access and lockouts.",
  },
  {
    id: "pricing-terms",
    scenario:
      "The system sets locker rentals and charges, but users are not clearly informed of pricing, time limits, overstay fees or usage terms before storing items or when conditions change.",
    choices: [
      "Communicate pricing, time limits and usage terms transparently before and during use, including overstay fees and how to extend or retrieve items",
      "Show a base price and locker availability, explaining detailed time limits, fees or terms only after charges apply",
      "Rely on posted general terms that do not clearly explain rental-specific pricing, limits or overstay conditions",
    ],
    best: 0,
    assurance: "Transparent pricing, time limits & usage terms",
    feedback:
      "Users need clear expectations: transparent pricing, time limits and usage terms help people choose appropriately and reduce disputes about charges or access windows.",
  },
  {
    id: "issue-handling",
    scenario:
      "A user reports a jammed locker, damaged contents or suspected theft, but there is no consistent process to detect issues, record context or handle the report with clear accountability.",
    choices: [
      "Support damage, theft or issue detection, reporting and handling and accountability with clear processes and documented context",
      "Handle issues case by case without consistent records of access events, condition or responsibility",
      "Limit responsibility by default unless the user can provide immediate, detailed proof of loss or damage",
    ],
    best: 0,
    assurance: "Issue handling & accountability",
    feedback:
      "Trustworthy locker services need accountable issue handling: clear detection, reporting and documented context support fair resolution when lockers malfunction or contents are damaged or missing.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "The service stores user details, locker assignments and access or transaction logs, but records are hard to trace for disputes and personal or usage data is retained and shared more than necessary.",
    choices: [
      "Apply privacy and minimisation to user and access or usage data, and log access and transaction records for traceability and dispute review",
      "Retain all user, access and transaction data indefinitely to support operations, security and future investigations",
      "Keep minimal records to limit data, even when it prevents tracing access events or resolving disputes",
    ],
    best: 0,
    assurance: "Privacy, traceability & dispute review",
    feedback:
      "Locker services should balance privacy and accountability: minimised, safeguarded data with traceable access and transaction records supports dispute review without unnecessary exposure.",
  },
  {
    id: "support-fallback",
    scenario:
      "A locker will not open, a code fails, an overstay charge is disputed or the case is uncertain, but users have no clear human support or fallback path.",
    choices: [
      "Provide human support and fallback for access failures, disputes or uncertain cases, with clear ways to get timely help",
      "Direct users to automated help steps only, even when access, payment or custody issues remain unresolved",
      "Leave resolution to repeated attempts or on-site availability without a defined support or escalation path",
    ],
    best: 0,
    assurance: "Human support & fallback",
    feedback:
      "When automated access or charges fall short, people need help: clear human support and fallback pathways help resolve access failures and disputes promptly and fairly.",
  },
];

export function selfServiceStorageLuggageLockerScore(answers: Record<string, number>) {
  const done = SELF_SERVICE_STORAGE_LUGGAGE_LOCKER_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SELF_SERVICE_STORAGE_LUGGAGE_LOCKER_ROUNDS.length,
  };
}
