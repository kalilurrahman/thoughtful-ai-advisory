export type VendingAutomatedRetailSmartKioskRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VENDING_AUTOMATED_RETAIL_SMART_KIOSK_ROUNDS: VendingAutomatedRetailSmartKioskRound[] =
  [
    {
      id: "identification-availability",
      scenario:
        "An AI system identifies products, selections and availability on a kiosk or vending machine, but it lists sold-out items as available, misidentifies the selected product or shows the wrong price for a selection.",
      choices: [
        "Ensure product or selection identification and availability are accurate, with checks for uncertain or stale availability and price data",
        "Rely on automated stock counts and cached listings to keep the interface fast, updating only when staff notice mismatches",
        "Let customers discover wrong selections or prices at payment and resolve refunds later",
      ],
      best: 0,
      assurance: "Accurate identification & availability",
      feedback:
        "Unattended retail depends on trustworthy listings: accurate product or selection identification and availability, with checks for uncertainty, help prevent wrong purchases and refunds.",
    },
    {
      id: "pricing-terms",
      scenario:
        "The kiosk takes a payment, but the total, fees, refund terms or any subscription or loyalty conditions are not clearly communicated before the customer confirms the purchase.",
      choices: [
        "Communicate payment, pricing and terms transparently before confirmation, including fees, refund rules and any recurring or loyalty conditions",
        "Show the headline item price and reveal fees or refund conditions after payment is taken",
        "Rely on general posted terms near the machine that do not explain transaction-specific charges or refund rules",
      ],
      best: 0,
      assurance: "Transparent payment, pricing & terms",
      feedback:
        "Customers need clear expectations before they pay: transparent payment, pricing and terms reduce disputes and chargebacks at unattended machines.",
    },
    {
      id: "issue-handling",
      scenario:
        "A machine jams, dispenses the wrong item or fails to deliver after payment, but detection, reporting and refund handling are inconsistent and it is unclear who is accountable for resolution.",
      choices: [
        "Support dispense or fulfillment issue detection, reporting and handling and accountability with clear processes and documented follow-up",
        "Handle failures case by case when customers contact support, without consistent detection or records",
        "Point customers to a general support channel with no commitment to refunds or resolution timelines",
      ],
      best: 0,
      assurance: "Dispense/fulfillment issue handling",
      feedback:
        "Failures are inevitable in unattended retail: clear detection, reporting and accountable handling of dispense or fulfillment issues protect trust and reduce repeat complaints.",
    },
    {
      id: "privacy-traceability",
      scenario:
        "The service stores customer, payment and transaction data from kiosk interactions, but records are hard to trace for disputes and personal or transaction data is retained and shared more than necessary.",
      choices: [
        "Apply privacy and minimisation to customer and transaction data, and log transaction and fulfillment records for traceability and dispute review",
        "Retain all customer, payment and transaction data indefinitely for analytics, marketing and future investigations",
        "Keep minimal records to limit data, even when it prevents tracing a transaction or resolving a dispute",
      ],
      best: 0,
      assurance: "Privacy, traceability & dispute review",
      feedback:
        "Automated retail should balance privacy and accountability: minimised, safeguarded data with traceable transaction and fulfillment records supports dispute review without unnecessary exposure.",
    },
    {
      id: "support-fallback",
      scenario:
        "A payment is taken without a dispense, a refund request fails or the case is uncertain, but customers have no clear human support or fallback path.",
      choices: [
        "Provide human support and fallback for failures, disputes or uncertain cases, with clear ways to get timely help and refunds",
        "Direct customers to automated help steps only, even when payment or fulfillment issues remain unresolved",
        "Leave resolution to repeated attempts or generic contact forms without a defined support or escalation path",
      ],
      best: 0,
      assurance: "Human support & fallback",
      feedback:
        "When automated payments or fulfillment fall short, people need help: clear human support and fallback pathways resolve failures and disputes promptly and fairly.",
    },
  ];

export function vendingAutomatedRetailSmartKioskScore(answers: Record<string, number>) {
  const done = VENDING_AUTOMATED_RETAIL_SMART_KIOSK_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VENDING_AUTOMATED_RETAIL_SMART_KIOSK_ROUNDS.length,
  };
}
