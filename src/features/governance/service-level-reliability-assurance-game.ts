export type ServiceLevelReliabilityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SERVICE_LEVEL_RELIABILITY_ASSURANCE_ROUNDS: ServiceLevelReliabilityAssuranceRound[] = [
  {
    id: "expectations",
    scenario:
      "A business-critical AI feature has no defined expectations for availability, latency, throughput, or acceptable degradation during peak or failure conditions.",
    choices: [
      "Define service/reliability expectations (e.g., availability, latency, capacity, degradation modes) aligned to user and business needs",
      "Assume best-effort performance is sufficient for all use cases",
      "Set expectations only after repeated user complaints",
    ],
    best: 0,
    assurance: "Service and reliability expectations",
    feedback:
      "Reliability assurance starts with clear, context-appropriate expectations for performance and availability so teams can design, monitor, and respond effectively.",
  },
  {
    id: "capacity-degradation",
    scenario:
      "Traffic spikes or dependency issues can overwhelm the AI service, but there are no capacity controls, rate limits, or safe degradation behaviors.",
    choices: [
      "Plan capacity and implement safeguards such as limits, backpressure, and safe degraded modes/fallbacks to protect users and systems",
      "Allow unlimited load and hope dependencies scale automatically",
      "Shut the service down completely for any sign of strain without a planned degraded mode",
    ],
    best: 0,
    assurance: "Capacity and degraded-mode safeguards",
    feedback:
      "Assurance includes capacity planning and safeguards (limits, backpressure, graceful degradation/fallbacks) to maintain safe, predictable behavior under stress.",
  },
  {
    id: "monitoring-alerts",
    scenario:
      "Latency, errors, and availability issues occur, but monitoring and alerting do not provide timely, actionable signals tied to service objectives.",
    choices: [
      "Monitor relevant service signals (latency, errors, availability, saturation) with actionable alerts and clear ownership/response paths",
      "Rely on users to report outages or slowness",
      "Collect metrics without thresholds, alerts, or owners",
    ],
    best: 0,
    assurance: "Monitoring and actionable alerting",
    feedback:
      "Actionable monitoring and alerting tied to service objectives enable timely detection and response before reliability issues cause broader impact.",
  },
  {
    id: "review-improvement",
    scenario:
      "Service incidents and performance trends are handled case by case, with no review of reliability evidence or follow-up improvements.",
    choices: [
      "Review incidents and reliability trends, address root causes, test improvements, and track evidence of service-level performance over time",
      "Restore service minimally and move on without learning or evidence",
      "Assume reliability will stabilize without targeted follow-up",
    ],
    best: 0,
    assurance: "Reliability review and evidence-backed improvement",
    feedback:
      "Ongoing assurance depends on reviewing reliability evidence, addressing root causes, and verifying improvements against service expectations over time.",
  },
];

export function serviceLevelReliabilityAssuranceScore(answers: Record<string, number>) {
  const done = SERVICE_LEVEL_RELIABILITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SERVICE_LEVEL_RELIABILITY_ASSURANCE_ROUNDS.length,
  };
}
