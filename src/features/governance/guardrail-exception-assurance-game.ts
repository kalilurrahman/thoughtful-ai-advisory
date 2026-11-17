export type GuardrailExceptionAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const GUARDRAIL_EXCEPTION_ASSURANCE_ROUNDS: GuardrailExceptionAssuranceRound[] = [
  {
    id: "silent-bypass",
    scenario:
      "An operator disables a guardrail to unblock an urgent request, and the workaround is never recorded or reverted.",
    choices: [
      "Require an exception record with reason, scope, approver, and expiry, and revert automatically when it lapses",
      "Let the operator keep the workaround since the request was urgent",
      "Remove the guardrail entirely to avoid future friction",
    ],
    best: 0,
    assurance: "Time-boxed exceptions",
    feedback:
      "Overrides are risk decisions: record reason, scope, approver and expiry, and revert when the exception lapses so temporary relief does not become permanent exposure.",
  },
  {
    id: "exception-creep",
    scenario:
      "Exceptions are requested every week for the same workflow, and each is approved individually without anyone reviewing the pattern.",
    choices: [
      "Review the exception pattern, decide whether the guardrail is mis-tuned or the workflow should change, and act on the root cause",
      "Keep approving each request so delivery is not blocked",
      "Deny all future exceptions without addressing the workflow",
    ],
    best: 0,
    assurance: "Exception trend review",
    feedback:
      "Repeated exceptions are a signal: review the trend, fix mis-tuned guardrails or the workflow behind them, and stop treating a systemic issue as one-off requests.",
  },
  {
    id: "no-owner",
    scenario:
      "An approved exception has no named owner and no review date, and the person who approved it has since left the team.",
    choices: [
      "Assign a current owner, set a review date, and re-confirm or close the exception against current risk",
      "Leave it in place because it was approved once",
      "Close it without checking what depends on the override",
    ],
    best: 0,
    assurance: "Exception ownership and review",
    feedback:
      "Exceptions decay without owners: assign a current owner, set review dates, and re-confirm or close against current risk rather than relying on a past approval.",
  },
  {
    id: "unlogged-effect",
    scenario:
      "An exception allowed outputs that bypassed a required check, but no one assessed what reached users while the override was active.",
    choices: [
      "Assess affected outputs and users, document impact and corrective action, and add the case to assurance evidence",
      "Assume the short window means nothing was affected",
      "Delete the logs so the override cannot be questioned later",
    ],
    best: 0,
    assurance: "Override impact evidence",
    feedback:
      "Every override has a blast radius: assess affected outputs and users, document impact and corrective action, and keep the evidence so the exception can be defended or learned from.",
  },
];

export function guardrailExceptionAssuranceScore(answers: Record<string, number>) {
  const done = GUARDRAIL_EXCEPTION_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === GUARDRAIL_EXCEPTION_ASSURANCE_ROUNDS.length,
  };
}
