export type AlgorithmicPricingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ALGORITHMIC_PRICING_ROUNDS: AlgorithmicPricingRound[] = [
  {
    id: "competitor-scraping",
    scenario:
      "A repricing model is fed a nightly scrape of competitor prices so it can stay 'market aligned'.",
    choices: [
      "Keep competitor data out of price setting and document the logic and inputs the model uses",
      "Keep the scrape but round competitor prices so the model cannot react precisely",
      "Use competitor prices only as a sanity check outside the pricing model",
    ],
    best: 0,
    assurance: "Documented inputs",
    feedback:
      "Feeding competitor prices into your own price setting is the classic competition risk: keep it out and document what the model actually uses.",
  },
  {
    id: "auto-reprice",
    scenario:
      "The repricing engine raises prices by fifteen per cent overnight with no human involved because the model found headroom.",
    choices: [
      "Require human review and approval for material pricing changes",
      "Cap automatic moves at ten per cent and let the rest run",
      "Send a report to the pricing team the following morning",
    ],
    best: 0,
    assurance: "Human approval",
    feedback:
      "Material price moves need a person who can say no before customers see them, not a report afterwards.",
  },
  {
    id: "public-signal",
    scenario:
      "A public statement promises that the company will always match any competitor's price increase within a day.",
    choices: [
      "Assess the signalling risk of public price statements before publishing them",
      "Publish it as a customer promise and rely on the legal team's review of the wording",
      "Keep the promise but remove the reference to competitor increases",
    ],
    best: 0,
    assurance: "Signalling risk",
    feedback:
      "Public commitments to follow competitor increases can coordinate the market: assess signalling risk before publishing, not just the wording.",
  },
  {
    id: "shared-optimiser",
    scenario:
      "Most competitors use the same vendor's pricing optimiser, and prices across the market have started moving in step.",
    choices: [
      "Treat it as a collusion indicator, monitor it and escalate to legal for review",
      "Conclude it is a coincidence because each firm sets its own parameters",
      "Switch vendors quietly and keep the current pricing unchanged",
    ],
    best: 0,
    assurance: "Collusion monitoring",
    feedback:
      "A shared algorithm can create hub-and-spoke coordination: treat parallel movement as an indicator, monitor it and give legal an escalation route.",
  },
  {
    id: "no-audit-trail",
    scenario:
      "Prices change daily and the model is retrained weekly, but nobody can reconstruct why a specific price was set three months ago.",
    choices: [
      "Keep an audit trail of pricing decisions and the model version behind each one",
      "Rely on the current model to explain how it would price the same case today",
      "Store the weekly training datasets so the history can be rebuilt later",
    ],
    best: 0,
    assurance: "Decision audit trail",
    feedback:
      "If a regulator asks why a price was set, the current model is not an answer: record the decision and the version that produced it.",
  },
];

export function algorithmicPricingScore(answers: Record<string, number>) {
  const done = ALGORITHMIC_PRICING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ALGORITHMIC_PRICING_ROUNDS.length,
  };
}
