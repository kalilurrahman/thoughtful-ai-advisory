export type RiskTransferRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RISK_TRANSFER_ROUNDS: RiskTransferRound[] = [
  {
    id: "assumed-cover",
    scenario:
      "The organisation assumes its professional indemnity policy covers an AI advice tool, but the policy was written before the tool existed.",
    choices: [
      "Map the AI risk to the actual policy wording, record exclusions, and raise gaps with the broker",
      "Treat existing cover as sufficient because the tool supports staff rather than deciding",
      "Buy a new cyber policy and treat it as covering the AI exposure",
    ],
    best: 0,
    assurance: "Coverage mapped to risk",
    feedback:
      "Cover written before the use existed is an assumption: map the risk to the wording, record exclusions and raise the gaps.",
  },
  {
    id: "undisclosed",
    scenario:
      "A material AI incident caused customer harm and the insurer only learns about it when the claim is filed.",
    choices: [
      "Disclose AI use and material incidents within the policy's notice terms, and record what was notified",
      "Wait for the claim to be filed so the insurer receives one complete account",
      "Mention the incident in the annual report and assume the insurer reads it",
    ],
    best: 0,
    assurance: "Timely disclosure",
    feedback:
      "Non-disclosure is the quiet way cover disappears: notify within the policy terms and record what was disclosed.",
  },
  {
    id: "uncapped-vendor",
    scenario:
      "The AI supplier's contract caps liability at one month of fees, while a single wrong decision could cost more than a year of the contract.",
    choices: [
      "Match indemnities and liability caps to the exposure you actually carry, and price the residual",
      "Accept the cap because the supplier says it is standard across the market",
      "Ask for a mutual cap so both sides carry the same risk",
    ],
    best: 0,
    assurance: "Exposure-matched terms",
    feedback:
      "A standard cap transfers almost nothing: match the terms to your exposure and decide consciously who carries the rest.",
  },
  {
    id: "untested-limits",
    scenario:
      "Nobody has checked whether the policy limit covers a plausible loss scenario such as a region-wide wrong decision.",
    choices: [
      "Test limits and deductibles against realistic loss scenarios and record the shortfall",
      "Assume the limit is adequate because it was set by the broker last year",
      "Increase the deductible to reduce the premium and close the question",
    ],
    best: 0,
    assurance: "Tested limits",
    feedback:
      "A limit that was never tested against a scenario is a number: model a plausible loss and record the shortfall.",
  },
  {
    id: "no-claim-evidence",
    scenario:
      "A claim is denied because the organisation cannot show what the model did, what it was approved for, or when the issue was known.",
    choices: [
      "Assemble claim evidence before an incident: approvals, logs, model versions and decision records",
      "Reconstruct the evidence after the claim is filed from whatever can be found",
      "Rely on the supplier to provide the logs the insurer asks for",
    ],
    best: 0,
    assurance: "Claim-ready evidence",
    feedback:
      "A claim is argued with records, not memory: assemble approvals, logs, versions and decision records before the incident.",
  },
];

export function riskTransferScore(answers: Record<string, number>) {
  const done = RISK_TRANSFER_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RISK_TRANSFER_ROUNDS.length,
  };
}
