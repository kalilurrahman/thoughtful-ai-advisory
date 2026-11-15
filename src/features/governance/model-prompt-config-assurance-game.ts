export type ModelPromptConfigAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MODEL_PROMPT_CONFIG_ASSURANCE_ROUNDS: ModelPromptConfigAssuranceRound[] = [
  {
    id: "controlled-management",
    scenario:
      "Models, prompts, and system configurations are edited directly in production by different people with no controlled process or clear ownership.",
    choices: [
      "Manage models, prompts, and configurations through a controlled process with defined ownership, reviews, and authorized changes",
      "Allow anyone to make quick edits in production to move faster",
      "Keep configurations informal as long as outputs seem fine",
    ],
    best: 0,
    assurance: "Controlled configuration management",
    feedback:
      "Configuration assurance requires controlled, owned changes to models, prompts, and settings so behavior remains intentional, reviewable, and accountable.",
  },
  {
    id: "versioning-approvals",
    scenario:
      "Prompts and configuration values change over time, but there is no versioning, rationale, or approval trail linking changes to decisions.",
    choices: [
      "Version prompts/configurations, document rationale and risk considerations, and require appropriate approvals for material changes",
      "Overwrite previous prompts/settings without history",
      "Track only who made the latest change, not what or why",
    ],
    best: 0,
    assurance: "Versioning, rationale, and approvals",
    feedback:
      "Traceable versioning, rationale, and approvals support governance by showing what changed, why, and who authorized it for review and investigation.",
  },
  {
    id: "safe-settings-guardrails",
    scenario:
      "Parameter settings and guardrail configurations are tuned for convenience without assessing how they affect safety, reliability, or scope boundaries.",
    choices: [
      "Assess and set parameters and guardrail configurations to align with intended use, risks, and safety/reliability needs, then validate behavior",
      "Use permissive settings to reduce refusals without review",
      "Assume default settings are always appropriate for every context",
    ],
    best: 0,
    assurance: "Safe settings and guardrail alignment",
    feedback:
      "Configuration choices influence behavior and risk; settings and guardrails should be aligned to use context, reviewed, and validated for safe operation.",
  },
  {
    id: "rollback-traceability",
    scenario:
      "A misconfiguration or problematic prompt change degrades behavior, but there is no clear rollback path or evidence linking the issue to specific configuration states.",
    choices: [
      "Maintain rollback readiness and traceability across configuration states, and use evidence to diagnose issues and restore safe behavior",
      "Fix issues ad hoc in place without recording what changed",
      "Disable safeguards temporarily without documenting or restoring them",
    ],
    best: 0,
    assurance: "Rollback readiness and traceability",
    feedback:
      "Assurance includes the ability to trace issues to configuration states and roll back safely, supported by evidence and controlled restoration of safeguards.",
  },
];

export function modelPromptConfigAssuranceScore(answers: Record<string, number>) {
  const done = MODEL_PROMPT_CONFIG_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MODEL_PROMPT_CONFIG_ASSURANCE_ROUNDS.length,
  };
}
