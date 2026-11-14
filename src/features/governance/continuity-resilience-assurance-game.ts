export type ContinuityResilienceAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONTINUITY_RESILIENCE_ASSURANCE_ROUNDS: ContinuityResilienceAssuranceRound[] = [
  {
    id: "dependency-planning",
    scenario:
      "A business process relies on an AI service and key dependencies, but there is no analysis of what fails if the model, data, or provider becomes unavailable.",
    choices: [
      "Identify critical dependencies and failure modes, assess business impact, and define continuity plans and owners",
      "Assume the AI service and its dependencies will always be available",
      "Document dependencies only after a disruption occurs",
    ],
    best: 0,
    assurance: "Dependency and impact planning",
    feedback:
      "Resilience assurance starts with understanding critical dependencies, failure modes, and business impact so continuity planning is intentional and owned.",
  },
  {
    id: "fallback-procedures",
    scenario:
      "When the AI system degrades or is unavailable, staff have no clear fallback, manual procedure, or guidance to continue essential work safely.",
    choices: [
      "Provide tested fallback/manual procedures, degraded-mode guardrails, and clear guidance for when and how to use them",
      "Pause all work until the AI system is restored, regardless of impact",
      "Let teams improvise workarounds without guidance or safeguards",
    ],
    best: 0,
    assurance: "Fallback and degraded-mode operations",
    feedback:
      "Continuity assurance requires practical fallback and degraded-mode procedures with safeguards so essential services can continue safely during disruption.",
  },
  {
    id: "recovery-objectives",
    scenario:
      "The organization has not defined recovery objectives or validated how quickly and effectively the AI-enabled service can be restored after disruption.",
    choices: [
      "Define recovery objectives, test restoration/recovery steps, and address gaps based on results",
      "Assume recovery will be quick without defined objectives or tests",
      "Rely only on vendor promises without internal validation",
    ],
    best: 0,
    assurance: "Recovery objectives and testing",
    feedback:
      "Assurance depends on defined recovery expectations and tested restoration capability; untested assumptions can leave critical services exposed.",
  },
  {
    id: "readiness-evidence",
    scenario:
      "Continuity plans exist on paper, but roles, communications, and readiness evidence are outdated and not exercised.",
    choices: [
      "Maintain current plans with assigned roles/communications, exercise readiness, and update evidence and improvements over time",
      "Keep plans static and assume they remain valid",
      "Treat a documented plan as sufficient without exercises or updates",
    ],
    best: 0,
    assurance: "Readiness, communication, and evidence",
    feedback:
      "Resilience assurance is ongoing: exercised plans, clear roles/communications, and current evidence help ensure readiness works in practice.",
  },
];

export function continuityResilienceAssuranceScore(answers: Record<string, number>) {
  const done = CONTINUITY_RESILIENCE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONTINUITY_RESILIENCE_ASSURANCE_ROUNDS.length,
  };
}
