export type TransparencyRecordkeepingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TRANSPARENCY_RECORDKEEPING_ROUNDS: TransparencyRecordkeepingRound[] = [
  {
    id: "system-documentation",
    scenario:
      "A deployed AI system has no clear documentation of its intended use, limitations, owners, data sources, or current version.",
    choices: [
      "Create and maintain system documentation (purpose, limits, owners, data/model details, version) so decisions and oversight are traceable",
      "Rely on team memory and informal chats for context",
      "Document only the marketing description of the system",
    ],
    best: 0,
    assurance: "System documentation and traceability",
    feedback:
      "Assurance depends on current, traceable documentation of intended use, limitations, ownership, and system/version details—not informal knowledge.",
  },
  {
    id: "user-transparency",
    scenario:
      "Users interact with an AI feature but are not told it is AI, what it can/cannot do, or when/how to seek human help for important outcomes.",
    choices: [
      "Provide clear user-facing transparency about AI use, limitations/uncertainty, and escalation or human review paths where relevant",
      "Avoid disclosure to keep the experience simple",
      "Add a vague disclaimer that does not explain limits or recourse",
    ],
    best: 0,
    assurance: "User-facing transparency and recourse",
    feedback:
      "Meaningful transparency includes clear notice, limitations, and practical recourse/escalation for consequential or uncertain outcomes.",
  },
  {
    id: "recordkeeping",
    scenario:
      "Key governance decisions, guardrail settings, and approvals are made, but records are scattered with no consistent evidence trail.",
    choices: [
      "Maintain organized records linking decisions, approvals, controls/guardrails, evidence, owners, and dates for review and handoff",
      "Keep records only when an audit is expected",
      "Store screenshots without context, ownership, or version information",
    ],
    best: 0,
    assurance: "Evidence trail and handoff readiness",
    feedback:
      "Recordkeeping assurance requires consistent, contextual evidence trails (who/what/when/why and versions) to support review, accountability, and handoff.",
  },
  {
    id: "version-history",
    scenario:
      "The model, prompts, or configuration change over time, but there is no version history linking changes to reviews and outcomes.",
    choices: [
      "Version changes and maintain history linking what changed, why, who approved/reviewed it, and resulting impacts or follow-up",
      "Overwrite prior configurations without keeping history",
      "Track only release dates without change details or approvals",
    ],
    best: 0,
    assurance: "Versioning and change history",
    feedback:
      "Traceable version/change history supports assurance by connecting changes to reviews, approvals, and outcomes, enabling investigation and learning.",
  },
];

export function transparencyRecordkeepingScore(answers: Record<string, number>) {
  const done = TRANSPARENCY_RECORDKEEPING_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TRANSPARENCY_RECORDKEEPING_ROUNDS.length,
  };
}
