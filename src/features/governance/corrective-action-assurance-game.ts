export type CorrectiveActionAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CORRECTIVE_ACTION_ASSURANCE_ROUNDS: CorrectiveActionAssuranceRound[] = [
  {
    id: "owned-action",
    scenario:
      "An incident review finds a recurring guardrail failure, but no corrective action is assigned, dated, or linked to the finding.",
    choices: [
      "Create an owned, time-bound corrective action linked to the finding with clear scope and expected outcome",
      "Note the issue in chat and hope it is fixed later",
      "Close the incident because the immediate disruption ended",
    ],
    best: 0,
    assurance: "Ownership and traceability",
    feedback:
      "Assurance requires corrective actions to be owned, traceable to findings, time-bound, and specific enough to address root causes or controls.",
  },
  {
    id: "evidence-before-verify",
    scenario:
      "A team says the fix is done and asks to close the action, but there is no completion evidence or record of what changed.",
    choices: [
      "Require completion evidence (what changed, where, when) before submitting for verification",
      "Close the action based on verbal confirmation",
      "Mark it verified because the due date passed",
    ],
    best: 0,
    assurance: "Completion evidence",
    feedback:
      "Closure readiness depends on evidence of what was implemented; verbal updates and deadlines alone do not demonstrate corrective action completion.",
  },
  {
    id: "effectiveness",
    scenario:
      "After implementation, the control seems improved, but no independent effectiveness check or follow-up monitoring was performed.",
    choices: [
      "Verify effectiveness with appropriate evidence/reviewer, monitor for recurrence, and document the finding before closure",
      "Close immediately and stop monitoring to reduce workload",
      "Assume effectiveness because no new complaints arrived this week",
    ],
    best: 0,
    assurance: "Effectiveness verification",
    feedback:
      "Corrective actions should be verified for effectiveness (with suitable separation of duties where possible) and monitored for recurrence before closure.",
  },
  {
    id: "ineffective",
    scenario:
      "Verification shows the corrective action did not address the root cause and similar monitoring signals continue.",
    choices: [
      "Reopen or create follow-up actions, reassess root cause/controls, and keep accountability and review dates clear",
      "Keep the action closed because work was attempted",
      "Remove the monitoring signal to avoid repeated findings",
    ],
    best: 0,
    assurance: "Learning and follow-up control",
    feedback:
      "Governance assurance depends on responding to ineffective actions: reassess causes, adjust controls, and maintain traceable follow-up until risk is addressed.",
  },
];

export function correctiveActionAssuranceScore(answers: Record<string, number>) {
  const done = CORRECTIVE_ACTION_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CORRECTIVE_ACTION_ASSURANCE_ROUNDS.length,
  };
}
