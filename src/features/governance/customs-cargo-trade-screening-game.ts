export type CustomsCargoTradeScreeningRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CUSTOMS_CARGO_TRADE_SCREENING_ROUNDS: CustomsCargoTradeScreeningRound[] = [
  {
    id: "holds-review",
    scenario:
      "An AI risk score flags a shipment for hold and intensive inspection, but officers are expected to follow the score automatically and there is no clear path for timely human review before enforcement actions.",
    choices: [
      "Maintain human authority and documented review for holds, inspections and enforcement actions, especially when impacts on trade are significant",
      "Automatically apply holds and penalties whenever the risk score exceeds a threshold to maximise enforcement consistency",
      "Let officers override holds informally without recording rationale or evidence",
    ],
    best: 0,
    assurance: "Human authority & review",
    feedback:
      "Holds and enforcement actions affect legitimate trade: accountable human review and documented decisions help ensure actions are justified and proportionate.",
  },
  {
    id: "targeting-fairness-impacts",
    scenario:
      "Targeting performance is reported as accurate overall, but false positives cluster on certain routes and commodities, causing repeated delays and costs for compliant traders.",
    choices: [
      "Validate risk targeting for fairness, false positives and trade impacts across routes and commodities, and adjust when burdens are disproportionate",
      "Rely on the overall accuracy metric because it reflects system performance at scale",
      "Treat delays for repeatedly flagged traders as an acceptable cost of stronger enforcement",
    ],
    best: 0,
    assurance: "Targeting validation & trade impacts",
    feedback:
      "Aggregate accuracy can hide concentrated harm: validating across routes and commodities helps manage false positives and avoid undue disruption to legitimate trade.",
  },
  {
    id: "trade-data-protection",
    scenario:
      "The screening model ingests trade declarations and partner-shared data from multiple sources, but data quality issues and unclear provenance make it hard to know what can be relied on or how sensitive data is protected.",
    choices: [
      "Maintain data quality, provenance and protection controls for trade and partner data, with limits on use and sharing",
      "Combine all available data sources to improve detection, even if provenance and protections are uncertain",
      "Rely on partner assurances alone without checks on data quality or handling",
    ],
    best: 0,
    assurance: "Data quality, provenance & protection",
    feedback:
      "Screening decisions are only as sound as their inputs: clear provenance, quality checks and protection of trade and partner data support trustworthy and responsible use.",
  },
  {
    id: "traceability-audit",
    scenario:
      "A trader challenges a hold decision, but the agency cannot show which inputs, risk score or model version led to the action or who reviewed it.",
    choices: [
      "Log decisions, risk scores, inputs and model versions with reviewer actions to support traceability and audit",
      "Provide a general explanation of the screening program without case-level records",
      "Keep detailed records only for cases that proceed to penalties or seizure",
    ],
    best: 0,
    assurance: "Traceability & audit",
    feedback:
      "Traceable records enable accountability and review: case-level evidence of inputs, scores, versions and human actions supports audits and reasoned responses to challenges.",
  },
  {
    id: "change-fallback",
    scenario:
      "A new targeting rule is pushed to live screening to address an emerging risk, but it was not tested for side effects and there is no expedited manual review path if legitimate shipments are wrongly delayed or the system becomes unavailable.",
    choices: [
      "Control and test models and rules before live use, and maintain manual fallback and expedited review to preserve legitimate trade facilitation",
      "Deploy the rule immediately across all ports and refine it after observing impacts",
      "Suspend screening entirely during uncertainty, even if no manual review process exists",
    ],
    best: 0,
    assurance: "Change control & expedited fallback",
    feedback:
      "Live screening changes need testing and safe fallback: controlled rollout plus expedited manual review helps manage emerging risks without unduly blocking legitimate trade.",
  },
];

export function customsCargoTradeScreeningScore(answers: Record<string, number>) {
  const done = CUSTOMS_CARGO_TRADE_SCREENING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CUSTOMS_CARGO_TRADE_SCREENING_ROUNDS.length,
  };
}
