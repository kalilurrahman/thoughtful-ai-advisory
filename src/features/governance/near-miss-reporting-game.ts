export type NearMissReportingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const NEAR_MISS_REPORTING_ROUNDS: NearMissReportingRound[] = [
  {
    id: "blame-first",
    scenario:
      "A staff member reports that an AI assistant nearly sent a wrong answer to a customer, and the first response is to ask who approved their use of the tool.",
    choices: [
      "Thank the reporter, separate the learning review from any performance action, and fix the condition that allowed the near miss",
      "Investigate the reporter's compliance with process before looking at the system",
      "Close the report because no harm occurred",
    ],
    best: 0,
    assurance: "Blame-free reporting",
    feedback:
      "Punishing reporters closes the channel: thank them, keep learning review separate from performance action, and fix the condition that allowed the near miss.",
  },
  {
    id: "no-near-miss-category",
    scenario:
      "The incident process only accepts events with customer harm, so teams quietly handle near misses and they never reach governance.",
    choices: [
      "Add a near-miss category with a low-friction form, triage route and feedback to the reporter",
      "Tell teams to report near misses through the existing harm-only form",
      "Keep the harm-only process so the incident numbers stay clean",
    ],
    best: 0,
    assurance: "Reportable near misses",
    feedback:
      "What cannot be reported cannot be learned: add a near-miss category with a low-friction route, triage and feedback to the reporter.",
  },
  {
    id: "black-hole",
    scenario:
      "Near misses are logged, but reporters never hear what happened next and the same failure recurs across three teams.",
    choices: [
      "Triage near misses for patterns, act on shared causes, and close the loop with reporters and the wider community",
      "Keep logging so there is a record if an auditor asks",
      "Stop logging near misses that do not lead to an incident",
    ],
    best: 0,
    assurance: "Closed-loop learning",
    feedback:
      "Reporting without feedback is a black hole: triage for patterns, act on shared causes, and close the loop with reporters so the same failure stops recurring.",
  },
  {
    id: "no-threshold",
    scenario:
      "A near miss in a clinical-triage assistant is treated the same as a cosmetic wording glitch, and neither gets escalated.",
    choices: [
      "Set near-miss thresholds by potential impact, escalate high-potential ones, and record the triage decision",
      "Treat all near misses identically to keep the process simple",
      "Escalate every near miss to the board to be safe",
    ],
    best: 0,
    assurance: "Impact-based near-miss triage",
    feedback:
      "Near misses differ in potential harm: set thresholds by potential impact, escalate the high-potential ones, and record the triage decision.",
  },
];

export function nearMissReportingScore(answers: Record<string, number>) {
  const done = NEAR_MISS_REPORTING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === NEAR_MISS_REPORTING_ROUNDS.length,
  };
}
