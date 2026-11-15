export type LoggingTraceabilityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const LOGGING_TRACEABILITY_ASSURANCE_ROUNDS: LoggingTraceabilityAssuranceRound[] = [
  {
    id: "meaningful-logging",
    scenario:
      "An AI system makes or influences decisions and triggers guardrails, but logs do not capture key events, inputs/outputs context, or actions needed for review.",
    choices: [
      "Capture meaningful, proportionate logs/events for decisions, guardrail actions, and key system behavior to support oversight and investigation",
      "Log nothing to minimize effort and storage",
      "Log only high-level success/failure without context for decisions or controls",
    ],
    best: 0,
    assurance: "Meaningful and proportionate logging",
    feedback:
      "Traceability assurance needs logs that are meaningful for review and investigation—capturing key events and control actions while remaining proportionate.",
  },
  {
    id: "integrity-protection",
    scenario:
      "Logs exist but can be altered, deleted, or accessed broadly, and they may contain sensitive data without protection or minimization.",
    choices: [
      "Protect log integrity and confidentiality with access controls, minimization/masking where appropriate, and tamper-aware handling",
      "Allow broad access and editing to keep operations simple",
      "Store all sensitive details in logs indefinitely without controls",
    ],
    best: 0,
    assurance: "Log integrity, privacy, and access control",
    feedback:
      "Auditability depends on trustworthy, protected logs: control access, preserve integrity, and handle sensitive data proportionately and securely.",
  },
  {
    id: "traceability-investigation",
    scenario:
      "When an issue occurs, teams struggle to reconstruct what happened, which version/configuration was used, and why a guardrail or outcome occurred.",
    choices: [
      "Maintain traceability linking events, versions/configurations, decisions, and guardrail outcomes to enable timely investigation and review",
      "Investigate from memory and scattered notes",
      "Keep records but without links between events, changes, and outcomes",
    ],
    best: 0,
    assurance: "Traceability for investigation and review",
    feedback:
      "Effective assurance requires traceable records that connect events, changes, and outcomes so incidents and controls can be investigated and explained.",
  },
  {
    id: "retention-audit-readiness",
    scenario:
      "Log retention, access, and review practices are unclear, leaving gaps in audit readiness and the ability to evidence control operation over time.",
    choices: [
      "Define retention, access, and review practices and maintain evidence that logging and traceability support oversight and audit readiness",
      "Retain logs inconsistently with no defined practices",
      "Assume audit readiness without checking records or evidence over time",
    ],
    best: 0,
    assurance: "Retention and audit readiness",
    feedback:
      "Audit readiness is supported by defined retention/access/review practices and evidence that records remain available, usable, and governed over time.",
  },
];

export function loggingTraceabilityAssuranceScore(answers: Record<string, number>) {
  const done = LOGGING_TRACEABILITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === LOGGING_TRACEABILITY_ASSURANCE_ROUNDS.length,
  };
}
