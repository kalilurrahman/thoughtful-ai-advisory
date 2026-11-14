export type ResourceEfficiencyAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RESOURCE_EFFICIENCY_ASSURANCE_ROUNDS: ResourceEfficiencyAssuranceRound[] = [
  {
    id: "impact-assessment",
    scenario:
      "A team selects and scales an AI solution without considering compute, energy, cost, or operational resource impacts for the intended use.",
    choices: [
      "Assess resource and operational impacts for the use case and consider proportionate, fit-for-purpose options before scaling",
      "Choose the largest available model by default without assessing need or impact",
      "Ignore resource impacts because they seem unrelated to governance",
    ],
    best: 0,
    assurance: "Impact and proportionality assessment",
    feedback:
      "Resource efficiency assurance includes considering compute, cost, and operational impacts so solutions are proportionate to the intended use and risks.",
  },
  {
    id: "right-sizing",
    scenario:
      "Workloads run with oversized models, redundant calls, or unbounded usage patterns even when simpler or more efficient approaches would meet requirements.",
    choices: [
      "Right-size models and workflows (e.g., appropriate model choice, caching/batching where suitable, limits) while meeting quality and safety needs",
      "Maximize resource use to be safe, regardless of necessity",
      "Optimize only after costs become unsustainable, with no guardrails",
    ],
    best: 0,
    assurance: "Right-sizing and efficient design",
    feedback:
      "Efficient, proportionate design can reduce unnecessary resource use and cost while maintaining required quality, safety, and governance controls.",
  },
  {
    id: "monitoring-signals",
    scenario:
      "There is limited visibility into usage, performance, and resource/cost signals, making it hard to detect waste, drift, or inefficient behavior.",
    choices: [
      "Monitor relevant usage, performance, and resource/cost signals to identify waste, anomalies, and improvement opportunities",
      "Track only outputs and ignore operational/resource signals",
      "Review efficiency signals only during annual budgeting",
    ],
    best: 0,
    assurance: "Monitoring and efficiency signals",
    feedback:
      "Ongoing monitoring of usage and resource signals supports assurance by revealing inefficiencies, anomalies, and opportunities to optimize responsibly.",
  },
  {
    id: "lifecycle-optimization",
    scenario:
      "Models, prompts, and deployments accumulate over time without lifecycle review, retirement, or evidence-backed optimization decisions.",
    choices: [
      "Apply lifecycle management: review, optimize, retire unused assets, and document evidence-based decisions and trade-offs",
      "Keep all deployments running indefinitely to avoid change",
      "Retire or change assets ad hoc without documenting rationale or impact",
    ],
    best: 0,
    assurance: "Lifecycle management and optimization evidence",
    feedback:
      "Sustainable operations benefit from lifecycle reviews and documented, evidence-backed optimization decisions, including retiring unused or inefficient assets.",
  },
];

export function resourceEfficiencyAssuranceScore(answers: Record<string, number>) {
  const done = RESOURCE_EFFICIENCY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RESOURCE_EFFICIENCY_ASSURANCE_ROUNDS.length,
  };
}
