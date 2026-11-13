export type RiskAcceptanceAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RISK_ACCEPTANCE_ASSURANCE_ROUNDS: RiskAcceptanceAssuranceRound[] = [
  {
    id: "accountable-approval",
    scenario:
      "A team wants to proceed with an AI use case that has residual risk, but no accountable approver, rationale, or recorded conditions are documented.",
    choices: [
      "Require an accountable approver, clear rationale/evidence considered, and documented conditions before acceptance",
      "Proceed if the team informally agrees in a meeting",
      "Record only the outcome without rationale or owner to save time",
    ],
    best: 0,
    assurance: "Accountability and rationale",
    feedback:
      "Governance decisions need an accountable approver and decision-grade rationale/conditions so residual risk acceptance is explicit and reviewable.",
  },
  {
    id: "time-bound",
    scenario:
      "Residual risk is accepted for a limited period while mitigations are implemented, but no review date or trigger is set.",
    choices: [
      "Make acceptance time-bound with a review date, triggers (e.g. incidents/changes), and follow-up owners",
      "Keep the acceptance open-ended until someone remembers to revisit it",
      "Set a reminder informally without recording it in the decision",
    ],
    best: 0,
    assurance: "Time-bound review and triggers",
    feedback:
      "Risk acceptance should be time-bound with explicit review dates/triggers and ownership; open-ended or informal acceptance weakens assurance.",
  },
  {
    id: "changed-context",
    scenario:
      "After a risk-accepted decision, the system’s data, model, or use context changes materially and new issues are reported.",
    choices: [
      "Reassess the decision and conditions, escalate as needed, and update/replace the record based on current evidence",
      "Keep the prior acceptance because it was approved once",
      "Wait until the next scheduled review even if risk has increased now",
    ],
    best: 0,
    assurance: "Reassessment on change/escalation",
    feedback:
      "Material changes or new signals can invalidate prior acceptance; assurance requires timely reassessment, escalation, and updated decisions/conditions.",
  },
  {
    id: "evidence-quality",
    scenario:
      "A risk acceptance is justified by a summary stating ‘controls are fine’ with no linked evidence, scope, or known limitations.",
    choices: [
      "Require scoped evidence, known limitations, and conditions/monitoring before relying on the acceptance",
      "Accept the summary because stakeholders want to move quickly",
      "Replace evidence with a generic policy reference only",
    ],
    best: 0,
    assurance: "Evidence quality and limitations",
    feedback:
      "Decision assurance depends on evidence quality: rationale should reference scoped evidence and limitations, with conditions/monitoring where residual risk remains.",
  },
];

export function riskAcceptanceAssuranceScore(answers: Record<string, number>) {
  const done = RISK_ACCEPTANCE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RISK_ACCEPTANCE_ASSURANCE_ROUNDS.length,
  };
}
