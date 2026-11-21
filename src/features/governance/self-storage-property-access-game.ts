export type SelfStoragePropertyAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SELF_STORAGE_PROPERTY_ACCESS_ROUNDS: SelfStoragePropertyAccessRound[] = [
  {
    id: "verification-safeguards",
    scenario:
      "An AI access system misreads credentials and either locks out legitimate customers or grants access incorrectly, but verification accuracy and safeguards are not routinely validated.",
    choices: [
      "Maintain identity, verification and access-control accuracy and safeguards, validating performance and correcting errors promptly",
      "Rely on automated access decisions because they reduce staffing needs at entry points",
      "Review verification accuracy only after repeated lockouts or security incidents",
    ],
    best: 0,
    assurance: "Verification & access-control safeguards",
    feedback:
      "Access systems must be reliable and secure: validated verification and safeguards help prevent wrongful lockouts and unintended access.",
  },
  {
    id: "fair-transparent-decisions",
    scenario:
      "Customers are denied access by automated rules without a clear explanation of the reason or how to resolve the issue, and similar cases appear to be handled inconsistently.",
    choices: [
      "Make access and denial decisions fair and transparent with reasons as appropriate, and apply rules consistently",
      "Provide generic denials to protect security procedures, without explaining reasons or next steps",
      "Treat automated denials as final even when customers cannot understand or contest them",
    ],
    best: 0,
    assurance: "Fair & transparent access decisions",
    feedback:
      "Customers need clarity and consistency: fair, transparent decisions with appropriate reasons help people resolve issues and support trust in access controls.",
  },
  {
    id: "privacy-minimisation",
    scenario:
      "The facility uses AI monitoring and access logs but collects and retains more customer and surveillance data than needed, with broad access and unclear purpose limits.",
    choices: [
      "Apply privacy and minimisation to monitoring and customer data, limiting collection, retention and access to what is necessary",
      "Retain all monitoring and access data indefinitely for potential future investigations",
      "Share access and monitoring data widely with partners without clear purpose limits or safeguards",
    ],
    best: 0,
    assurance: "Privacy & data minimisation",
    feedback:
      "Monitoring should be proportionate: minimisation and safeguards protect customer privacy while supporting legitimate security and access needs.",
  },
  {
    id: "human-review",
    scenario:
      "The system automatically applies consequential actions such as lockouts, holds or account restrictions based on risk scores, without a clear path to timely human review.",
    choices: [
      "Provide human review for consequential actions such as lockouts, holds or account restrictions, with a timely way to correct errors",
      "Allow automated consequential actions to stand to deter misuse, even without review",
      "Offer human review only after a prolonged waiting period or formal complaint",
    ],
    best: 0,
    assurance: "Human review for consequential actions",
    feedback:
      "Consequential restrictions need accountable oversight: timely human review helps correct mistaken automated actions and reduce undue harm to customers.",
  },
  {
    id: "traceability-fallback",
    scenario:
      "A customer disputes a denied entry or restriction, but staff cannot trace the access event, decision or system version, and when the system is uncertain or unavailable there is no tested fallback or support pathway.",
    choices: [
      "Log access events, decisions and model or system versions for traceability and dispute review, and maintain tested fallback and support pathways when AI is uncertain or unavailable",
      "Handle disputes based on staff recollection without system records or a defined fallback process",
      "Suspend access until the system is restored, without providing alternative support",
    ],
    best: 0,
    assurance: "Traceability & fallback/support",
    feedback:
      "Dispute resolution and continuity require evidence and preparation: traceable records and tested fallback/support pathways help resolve issues when AI is uncertain or unavailable.",
  },
];

export function selfStoragePropertyAccessScore(answers: Record<string, number>) {
  const done = SELF_STORAGE_PROPERTY_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SELF_STORAGE_PROPERTY_ACCESS_ROUNDS.length,
  };
}
