export type CriticalInfrastructureRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CRITICAL_INFRASTRUCTURE_ROUNDS: CriticalInfrastructureRound[] = [
  {
    id: "auto-dispatch",
    scenario:
      "A forecasting model adjusts dispatch and switching automatically, and operators discover what it did only by reading the log afterwards.",
    choices: [
      "Keep operators in authority over consequential actions with documented escalation",
      "Let the model act first because it reacts faster than a person can",
      "Give operators the ability to pause the model only during business hours",
    ],
    best: 0,
    assurance: "Operator authority",
    feedback:
      "Speed does not replace authority: operators should hold decision rights over consequential actions, with escalation that is documented and exercised.",
  },
  {
    id: "direct-actuation",
    scenario:
      "A maintenance model's output is wired straight into control commands, with no limits or interlocks between the prediction and the physical system.",
    choices: [
      "Ensure model outputs cannot actuate physical systems without limits and interlocks",
      "Rely on the model's confidence score to decide when to send commands",
      "Add a warning banner to the operator screen about possible model error",
    ],
    best: 0,
    assurance: "Actuation limits & interlocks",
    feedback:
      "Predictions should not become physical actions unchecked: put limits and interlocks between model output and equipment.",
  },
  {
    id: "fair-weather-model",
    scenario:
      "The outage-prediction model performs well in normal weather, but was never tested on data gaps, storms or events unlike anything in its training history.",
    choices: [
      "Test and monitor performance under degraded data, extreme weather and novel events",
      "Trust the benchmark results because they were strong at launch",
      "Retrain once a year and rely on the vendor's published accuracy",
    ],
    best: 0,
    assurance: "Degraded & novel conditions",
    feedback:
      "Critical systems fail in abnormal conditions: test behaviour under degraded data, extreme weather and events outside the training distribution.",
  },
  {
    id: "open-ot-data",
    scenario:
      "A vendor's analytics tool receives broad, standing access to operational telemetry and control data with no minimisation or contractual limits.",
    choices: [
      "Govern and minimise third-party access to operational data",
      "Allow full access because the vendor needs it to improve the product",
      "Restrict access only after the next contract renewal",
    ],
    best: 0,
    assurance: "Operational data access",
    feedback:
      "Operational data is sensitive infrastructure data: minimise what third parties receive and govern it in the contract, not after renewal.",
  },
  {
    id: "silent-ai-service",
    scenario:
      "AI shapes maintenance priorities and restoration order, but customers, communities and the regulator are never told, and there is no manual fallback if the model is unavailable during an outage.",
    choices: [
      "Disclose AI influence on service decisions and keep a drilled manual fallback",
      "Publish a short note that the company uses AI in its operations",
      "Rely on the vendor's continuity arrangements if the model goes down",
    ],
    best: 0,
    assurance: "Disclosure & manual fallback",
    feedback:
      "Affected people and regulators should know AI influences service decisions, and operators need a drilled manual path when the model is unavailable.",
  },
];

export function criticalInfrastructureScore(answers: Record<string, number>) {
  const done = CRITICAL_INFRASTRUCTURE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CRITICAL_INFRASTRUCTURE_ROUNDS.length,
  };
}
