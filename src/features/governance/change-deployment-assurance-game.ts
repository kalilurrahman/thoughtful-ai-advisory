export type ChangeDeploymentAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CHANGE_DEPLOYMENT_ASSURANCE_ROUNDS: ChangeDeploymentAssuranceRound[] = [
  {
    id: "pre-deployment-review",
    scenario:
      "A team plans to deploy a model or configuration change, but there is no pre-deployment review of impact, risks, guardrails, or readiness.",
    choices: [
      "Perform a pre-deployment impact/risk and readiness review covering changes, guardrails, dependencies, and approvals",
      "Deploy immediately to save time and review later if issues arise",
      "Rely on prior approvals even though the change is materially different",
    ],
    best: 0,
    assurance: "Pre-deployment impact and readiness review",
    feedback:
      "Deployment assurance starts before release: assess impact, risks, guardrails, and readiness so changes do not introduce unmanaged issues.",
  },
  {
    id: "controlled-rollout",
    scenario:
      "A significant update is released to all users at once with no staged rollout, rollback criteria, or monitoring plan for early signals.",
    choices: [
      "Use a controlled rollout with defined success/stop and rollback criteria, monitoring, and clear decision ownership",
      "Release to everyone and rely on users to report problems",
      "Prepare a rollback idea but define no criteria or triggers",
    ],
    best: 0,
    assurance: "Controlled rollout and rollback readiness",
    feedback:
      "Safe change management uses staged rollout where appropriate, explicit rollback criteria, and monitoring to detect and contain issues early.",
  },
  {
    id: "change-approval",
    scenario:
      "Model, prompt, data, or configuration changes are made informally with unclear approvals, ownership, or traceability.",
    choices: [
      "Apply controlled change approvals with documented rationale, accountable owners, versioning, and traceable records",
      "Allow informal changes as long as they seem minor",
      "Track only the final state without who approved or why",
    ],
    best: 0,
    assurance: "Change control and approvals",
    feedback:
      "Assurance requires controlled, traceable changes: clear approvals, rationale, ownership, and version history support accountability and investigation.",
  },
  {
    id: "post-deployment-validation",
    scenario:
      "After deployment, no one validates outcomes, confirms guardrails work as intended, or communicates the change and follow-up responsibilities.",
    choices: [
      "Run post-deployment validation, confirm guardrail/operational behavior, communicate changes, and assign follow-up ownership",
      "Assume success if the deployment completes without errors",
      "Communicate only if users complain after the change",
    ],
    best: 0,
    assurance: "Post-deployment validation and communication",
    feedback:
      "Deployment assurance continues after release: validate behavior and guardrails, communicate changes, and assign owners for monitoring and follow-up.",
  },
];

export function changeDeploymentAssuranceScore(answers: Record<string, number>) {
  const done = CHANGE_DEPLOYMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CHANGE_DEPLOYMENT_ASSURANCE_ROUNDS.length,
  };
}
