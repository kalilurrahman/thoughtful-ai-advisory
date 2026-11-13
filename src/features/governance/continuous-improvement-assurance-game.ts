export type ContinuousImprovementAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONTINUOUS_IMPROVEMENT_ASSURANCE_ROUNDS: ContinuousImprovementAssuranceRound[] = [
  {
    id: "periodic-review",
    scenario:
      "An AI system has been running for months, but there is no scheduled review of governance controls, guardrails, risk posture, or changing context.",
    choices: [
      "Run periodic governance and assurance reviews covering controls, guardrails, risks, and context changes with accountable owners",
      "Treat initial approval as sufficient and avoid further review",
      "Review only when a major incident occurs",
    ],
    best: 0,
    assurance: "Periodic governance review",
    feedback:
      "Assurance is ongoing: scheduled reviews keep controls, guardrails, and risk posture aligned with current use, performance, and context.",
  },
  {
    id: "effectiveness-metrics",
    scenario:
      "The team tracks some operational metrics, but does not assess whether controls and guardrails are effective or meeting defined objectives.",
    choices: [
      "Review control/guardrail effectiveness with relevant KPIs, signals, and evidence, and act on gaps or drift",
      "Assume controls work because they are documented",
      "Track metrics without linking them to control effectiveness or decisions",
    ],
    best: 0,
    assurance: "Control effectiveness and metrics",
    feedback:
      "Continuous assurance uses evidence and meaningful metrics to evaluate whether controls/guardrails work in practice and to trigger improvement when they do not.",
  },
  {
    id: "lessons-learned",
    scenario:
      "Incidents, monitoring alerts, and user feedback reveal recurring issues, but lessons learned are not captured or fed back into controls and processes.",
    choices: [
      "Capture lessons learned, update controls/guardrails and guidance, and verify improvements address root causes",
      "Resolve each case individually without learning or systemic changes",
      "Record lessons informally with no owners or follow-up actions",
    ],
    best: 0,
    assurance: "Lessons learned and feedback loops",
    feedback:
      "Improvement depends on learning loops: capture insights from incidents and signals, address root causes, and verify that changes are effective.",
  },
  {
    id: "follow-up-accountability",
    scenario:
      "Review findings and improvement actions are identified, but ownership, deadlines, evidence updates, and risk posture changes are not tracked.",
    choices: [
      "Assign owners and timelines, track actions to completion, update evidence/risk posture, and report status",
      "List actions without accountability or due dates",
      "Close findings once discussed, even if actions are incomplete",
    ],
    best: 0,
    assurance: "Accountability and evidence updates",
    feedback:
      "Assurance reviews create value when actions are owned, tracked, evidenced, and reflected in updated risk posture—not when findings are left open or undocumented.",
  },
];

export function continuousImprovementAssuranceScore(answers: Record<string, number>) {
  const done = CONTINUOUS_IMPROVEMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONTINUOUS_IMPROVEMENT_ASSURANCE_ROUNDS.length,
  };
}
