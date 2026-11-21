export type SportsOfficiatingCompetitionIntegrityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SPORTS_OFFICIATING_COMPETITION_INTEGRITY_ROUNDS: SportsOfficiatingCompetitionIntegrityRound[] = [
  {
    id: "human-authority-appeals",
    scenario:
      "An AI system recommends overturning a close call in real time, and officials are pressured to accept it immediately with no clear process for human review or appeal by participants.",
    choices: [
      "Maintain human authority, review and appeals for officiating decisions so officials can confirm, contest or override AI assistance",
      "Accept the AI recommendation automatically to keep play moving and avoid disputes",
      "Allow review only when broadcasters or spectators raise objections after the event",
    ],
    best: 0,
    assurance: "Human authority, review & appeals",
    feedback:
      "Officiating decisions must remain accountable: human officials should retain authority with clear review and appeal paths rather than deferring automatically to AI recommendations.",
  },
  {
    id: "venue-condition-validation",
    scenario:
      "The system was calibrated in ideal conditions, but it is now used across different venues, lighting, weather, equipment setups and sport-specific edge cases without revalidation.",
    choices: [
      "Validate performance across venues, conditions, equipment and sport-specific edge cases, and limit reliance where reliability is uncertain",
      "Assume the model will generalise because it performed well in prior matches",
      "Deploy everywhere and adjust only after controversial calls occur",
    ],
    best: 0,
    assurance: "Validation across venues & conditions",
    feedback:
      "Reliability can vary by context: validation across venues, conditions, equipment and edge cases helps set safe limits before AI assistance influences calls.",
  },
  {
    id: "fairness-bias",
    scenario:
      "Post-event analysis suggests the assistance is less accurate for certain participants or playing styles, but no routine fairness checks are in place to detect or address systematic disadvantage.",
    choices: [
      "Monitor fairness and bias so assistance does not systematically disadvantage participants, and act on findings",
      "Treat occasional errors as random as long as overall accuracy looks acceptable",
      "Rely on participants to raise concerns individually without systematic monitoring",
    ],
    best: 0,
    assurance: "Fairness & bias monitoring",
    feedback:
      "Competition integrity requires equitable treatment: routine fairness monitoring helps detect and address assistance that systematically disadvantages participants.",
  },
  {
    id: "transparency-traceability",
    scenario:
      "An AI-assisted decision is contested, but officials and stakeholders cannot see what assistance was used, its limitations or rationale, and there are no traceable records of the evidence, inputs or system version.",
    choices: [
      "Provide transparency of AI assistance, limitations and decision rationale as appropriate, and log decisions, evidence, inputs and model or system versions for traceability, review and integrity investigations",
      "Explain only that technology was used without details of inputs, rationale or version history",
      "Keep records minimal to protect competitive secrecy even when decisions are formally contested",
    ],
    best: 0,
    assurance: "Transparency & traceability",
    feedback:
      "Contestable decisions need evidence: transparent, appropriate explanations and traceable records support review, appeals and integrity investigations.",
  },
  {
    id: "change-fallback",
    scenario:
      "A mid-season update changes detection behaviour, but it is rolled out without controlled testing, and there is no practised fallback if the assistance becomes unavailable or is disputed during competition.",
    choices: [
      "Control changes with testing and approvals, and maintain tested fallback and continuity procedures when AI assistance is unavailable or contested",
      "Deploy updates quickly to improve accuracy and resolve issues during live events if needed",
      "Rely on ad hoc manual judgement without prepared fallback procedures or change controls",
    ],
    best: 0,
    assurance: "Change control & fallback continuity",
    feedback:
      "Continuity and trust depend on controlled change: tested updates and practised fallback procedures help officials respond safely when assistance fails or is contested.",
  },
];

export function sportsOfficiatingCompetitionIntegrityScore(answers: Record<string, number>) {
  const done = SPORTS_OFFICIATING_COMPETITION_INTEGRITY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SPORTS_OFFICIATING_COMPETITION_INTEGRITY_ROUNDS.length,
  };
}
