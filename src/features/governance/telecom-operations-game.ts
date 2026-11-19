export type TelecomOperationsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TELECOM_OPERATIONS_ROUNDS: TelecomOperationsRound[] = [
  {
    id: "auto-reconfig",
    scenario:
      "An AI optimisation pushes a wide network reconfiguration during peak hours. It degrades service in several areas, but operators cannot roll it back quickly because limits and rollback steps were never defined.",
    choices: [
      "Require operator oversight, defined limits and a tested rollback for automated actions that affect service",
      "Let the model keep optimising because it usually improves performance over time",
      "Disable the optimisation after the incident and re-enable it later without changes",
    ],
    best: 0,
    assurance: "Oversight & rollback",
    feedback:
      "Automated changes that affect service need guardrails: set limits, keep operator control and make rollback fast and rehearsed before a bad change spreads.",
  },
  {
    id: "congestion-priority",
    scenario:
      "Under congestion, the model's traffic prioritisation consistently slows some customer segments and services, but the team has not tested whether the policy is fair or discriminatory.",
    choices: [
      "Test traffic management and prioritisation for fairness and non-discrimination, especially under congestion",
      "Accept the behaviour because it maximises overall throughput",
      "Document the prioritisation logic without testing its real-world impact on different users",
    ],
    best: 0,
    assurance: "Fair traffic management",
    feedback:
      "Efficiency is not fairness: traffic management and prioritisation should be tested under stress so the model does not quietly disadvantage some users or services.",
  },
  {
    id: "untraceable-change",
    scenario:
      "After an outage, engineers cannot tell which automated change caused the problem because configuration changes, model versions and triggers were not logged in a traceable way.",
    choices: [
      "Control and log automated changes, triggers and model versions so incidents can be traced",
      "Rebuild the timeline from memory and scattered dashboard screenshots",
      "Treat the outage as unavoidable because complex networks fail sometimes",
    ],
    best: 0,
    assurance: "Change control & traceability",
    feedback:
      "Incidents are hard to fix if you cannot trace the cause: log automated changes and the model context so teams can understand and correct failures.",
  },
  {
    id: "silent-outage",
    scenario:
      "A material outage partly driven by an AI fault-prediction decision leaves customers without service for hours, but notifications to affected customers and regulators are delayed and unclear.",
    choices: [
      "Notify customers and regulators of material AI-influenced outages or impacts clearly and as required",
      "Post a generic status update without explaining the scale or likely impact",
      "Wait until the root cause is fully confirmed before telling anyone what happened",
    ],
    best: 0,
    assurance: "Material-impact notification",
    feedback:
      "People need timely, clear information during a service impact: notify affected customers and regulators about material AI-influenced outages without waiting for perfect certainty.",
  },
  {
    id: "no-manual-fallback",
    scenario:
      "The network operations model becomes unavailable during a major failure, and staff do not have a rehearsed manual process to sustain essential service.",
    choices: [
      "Maintain and rehearse manual operations that can sustain essential service if the model fails",
      "Rely on the vendor's support team to restore the model quickly",
      "Pause non-essential work and hope the automated system recovers before essential service is affected",
    ],
    best: 0,
    assurance: "Manual fallback",
    feedback:
      "Essential service cannot depend on a single model staying healthy: keep a drilled manual fallback so operations continue during model failure or outage.",
  },
];

export function telecomOperationsScore(answers: Record<string, number>) {
  const done = TELECOM_OPERATIONS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TELECOM_OPERATIONS_ROUNDS.length,
  };
}
