export type MonitoringAssuranceRound = {
  id: string;
  signal: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MONITORING_ASSURANCE_ROUNDS: MonitoringAssuranceRound[] = [
  {
    id: "drift",
    signal:
      "A production model’s output quality drops after a data/source change, but no alert threshold or owner was defined.",
    choices: [
      "Treat as a monitoring/assurance gap: define metrics and thresholds, assign an owner, investigate impact, and record corrective actions",
      "Ignore it until users formally complain",
      "Assume the original evaluation remains valid because the model version is unchanged",
    ],
    best: 0,
    assurance: "Metrics, ownership, and response",
    feedback:
      "Post-deployment assurance needs defined signals, accountable owners, and documented response when performance or context drifts.",
  },
  {
    id: "guardrail-breach",
    signal:
      "Logs show repeated guardrail bypass attempts and a few successful unsafe outputs in one workflow.",
    choices: [
      "Contain the affected workflow as needed, review evidence, strengthen guardrails/testing, and escalate according to incident/change processes",
      "Disable logging to reduce noise",
      "Mark the guardrail as effective because most requests were blocked",
    ],
    best: 0,
    assurance: "Detection, containment, and improvement",
    feedback:
      "Guardrail breaches are assurance signals: preserve evidence, assess impact, improve controls, and escalate through defined governance processes.",
  },
  {
    id: "weak-evidence",
    signal:
      "A dashboard shows ‘all controls healthy’ but provides no timestamps, system scope, thresholds, or reviewer notes.",
    choices: [
      "Request decision-grade evidence (scope, time, metric/threshold, owner, findings) before relying on it for assurance",
      "Accept the green status as sufficient assurance",
      "Replace monitoring with a one-time policy statement",
    ],
    best: 0,
    assurance: "Decision-grade monitoring evidence",
    feedback:
      "Assurance depends on evidence quality: monitoring outputs should be scoped, current, attributable, and actionable—not just status labels.",
  },
  {
    id: "verification",
    signal:
      "After a corrective action, the issue appears resolved but no independent effectiveness check was recorded.",
    choices: [
      "Verify effectiveness with appropriate evidence/reviewer, monitor for recurrence, and only then close with documented findings",
      "Close immediately to improve metrics",
      "Assume recurrence risk is zero because one fix was applied",
    ],
    best: 0,
    assurance: "Verification and closure discipline",
    feedback:
      "Corrective actions need effectiveness verification and follow-up monitoring; closure without evidence weakens governance assurance.",
  },
];

export function monitoringAssuranceScore(answers: Record<string, number>) {
  const done = MONITORING_ASSURANCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MONITORING_ASSURANCE_ROUNDS.length,
  };
}
