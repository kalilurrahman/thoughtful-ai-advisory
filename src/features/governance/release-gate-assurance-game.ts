export type ReleaseGateAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RELEASE_GATE_ASSURANCE_ROUNDS: ReleaseGateAssuranceRound[] = [
  {
    id: "missing-evidence",
    scenario:
      "A high-impact AI feature is ready for launch, but required guardrails are only partially enabled and key test/evidence records are missing.",
    choices: [
      "Hold the release, complete required controls and evidence, and obtain accountable approval before go-live",
      "Approve launch now and collect evidence later",
      "Treat missing evidence as acceptable because the demo performed well",
    ],
    best: 0,
    assurance: "Evidence and guardrail readiness",
    feedback:
      "Release gates should verify required guardrail coverage and decision-grade evidence before deployment, especially for higher-impact use.",
  },
  {
    id: "conditional-approval",
    scenario:
      "Reviewers identify residual risks that can be managed, but only with specific limits, monitoring, and a review date.",
    choices: [
      "Issue a conditional approval with documented controls, owners, monitoring, and time-bound review/risk acceptance",
      "Give unconditional approval to avoid delays",
      "Reject without documenting conditions or follow-up owners",
    ],
    best: 0,
    assurance: "Conditional approval and accountability",
    feedback:
      "When residual risk remains, assurance comes from explicit conditions, accountable owners, monitoring, and time-bound review—not informal or unconditional approval.",
  },
  {
    id: "monitoring-readiness",
    scenario:
      "Controls are configured, but there is no plan for production monitoring, alert ownership, or incident escalation after release.",
    choices: [
      "Require monitoring, alert thresholds, named owners, and escalation paths as part of release readiness",
      "Assume issues will be found during normal user feedback",
      "Rely only on pre-release testing as ongoing assurance",
    ],
    best: 0,
    assurance: "Post-release monitoring readiness",
    feedback:
      "Go-live assurance includes operational readiness: monitoring signals, accountable owners, and escalation/response paths must be in place before release.",
  },
  {
    id: "change-after-approval",
    scenario:
      "After approval, the team swaps the model provider and changes data inputs but wants to keep the same release decision.",
    choices: [
      "Re-run impact/change review and update evidence and approvals before release because material conditions changed",
      "Proceed because the user interface looks the same",
      "Record the change after launch without reassessing risks or controls",
    ],
    best: 0,
    assurance: "Change-triggered reassessment",
    feedback:
      "Material changes can invalidate prior assurance; release decisions should be reassessed when model, data, context, or controls change.",
  },
];

export function releaseGateAssuranceScore(answers: Record<string, number>) {
  const done = RELEASE_GATE_ASSURANCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RELEASE_GATE_ASSURANCE_ROUNDS.length,
  };
}
