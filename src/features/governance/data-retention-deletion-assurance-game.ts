export type DataRetentionDeletionAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_RETENTION_DELETION_ASSURANCE_ROUNDS: DataRetentionDeletionAssuranceRound[] = [
  {
    id: "retention-limits",
    scenario:
      "An AI workflow stores prompts, outputs, logs, and related data indefinitely without defined retention periods or justification.",
    choices: [
      "Define and apply proportionate retention periods and purposes for AI data/logs/outputs, keeping only what is needed",
      "Retain everything by default in case it is useful later",
      "Set retention based only on storage convenience, not purpose or risk",
    ],
    best: 0,
    assurance: "Defined and proportionate retention",
    feedback:
      "Retention assurance requires clear, purpose-based retention periods and minimization so data is not kept longer or more broadly than necessary.",
  },
  {
    id: "deletion-lifecycle",
    scenario:
      "When data is no longer needed or a deletion request is received, there is no reliable process to locate and dispose of data across systems and backups as appropriate.",
    choices: [
      "Implement lifecycle processes to locate, delete/dispose of data reliably (including relevant systems) and handle requests appropriately",
      "Delete data ad hoc when someone remembers to do it",
      "Assume data disappears automatically without verification",
    ],
    best: 0,
    assurance: "Deletion and lifecycle disposal",
    feedback:
      "Assurance depends on reliable deletion/lifecycle processes and verification so data is disposed of appropriately when no longer needed or when requests apply.",
  },
  {
    id: "access-during-retention",
    scenario:
      "Retained AI data includes sensitive information, but access controls, monitoring, and minimization are weak during the retention period.",
    choices: [
      "Protect retained data with least-privilege access, safeguards, and minimization/masking where appropriate throughout retention",
      "Allow broad access to retained data for convenience",
      "Focus only on collection controls and ignore protection during retention",
    ],
    best: 0,
    assurance: "Protection during retention",
    feedback:
      "Data kept for legitimate purposes still needs protection: apply access controls, safeguards, and minimization during the full retention period.",
  },
  {
    id: "evidence-compliance",
    scenario:
      "The organization cannot readily evidence what is retained, where it resides, when it is deleted, or whether retention/deletion practices are followed.",
    choices: [
      "Maintain evidence of retention/deletion practices, inventories/records where appropriate, and reviews to confirm they are followed",
      "Rely on policy statements without operational evidence",
      "Check retention and deletion only after a complaint or audit request",
    ],
    best: 0,
    assurance: "Evidence and operational compliance",
    feedback:
      "Retention and deletion assurance is strengthened by operational evidence and periodic checks showing that defined practices are followed in practice.",
  },
];

export function dataRetentionDeletionAssuranceScore(answers: Record<string, number>) {
  const done = DATA_RETENTION_DELETION_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_RETENTION_DELETION_ASSURANCE_ROUNDS.length,
  };
}
