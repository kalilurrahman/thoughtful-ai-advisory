export type DataGovernanceAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_GOVERNANCE_ASSURANCE_ROUNDS: DataGovernanceAssuranceRound[] = [
  {
    id: "provenance",
    scenario:
      "A team wants to use a new dataset for an AI system but cannot confirm its source, permissions, quality, or whether sensitive data is included.",
    choices: [
      "Assess provenance, permissions/rights, quality, and sensitivity before use; document limitations and approvals",
      "Use the dataset immediately because it is easy to access",
      "Assume the dataset is acceptable if model outputs look reasonable in a quick test",
    ],
    best: 0,
    assurance: "Provenance, permissions, and quality",
    feedback:
      "Data governance assurance starts with known provenance, lawful permissions, quality/fitness checks, and documented limitations before use.",
  },
  {
    id: "minimization",
    scenario:
      "An AI workflow collects full customer records and retains prompts/outputs indefinitely, even though only a small subset is needed.",
    choices: [
      "Apply minimization and purpose limitation: collect/use only necessary data, set retention/deletion controls, and restrict access",
      "Keep all data by default in case it becomes useful later",
      "Rely on a privacy notice alone without changing collection or retention",
    ],
    best: 0,
    assurance: "Minimization and retention controls",
    feedback:
      "Privacy and governance assurance require proportionate data use, clear purpose/retention limits, and enforceable access controls—not collection by default.",
  },
  {
    id: "sensitive-handling",
    scenario:
      "Staff paste sensitive personal or confidential information into external AI tools without guidance, logging, or approved controls.",
    choices: [
      "Provide clear handling rules, approved tools/guardrails, access controls, and monitoring/escalation for sensitive data use",
      "Ban all AI use without addressing business needs or safe alternatives",
      "Trust users to judge sensitivity case by case with no safeguards",
    ],
    best: 0,
    assurance: "Sensitive-data guardrails and guidance",
    feedback:
      "Assurance needs practical guardrails for sensitive data: approved channels, access controls, guidance, and monitoring/escalation for misuse or exposure.",
  },
  {
    id: "data-issue-response",
    scenario:
      "A data-quality or privacy issue is discovered in an AI workflow, but there is no evidence of impact assessment, containment, or follow-up actions.",
    choices: [
      "Contain the issue, assess impact/scope, notify accountable owners, document corrective actions, and verify remediation",
      "Fix the immediate symptom quietly and keep no records",
      "Wait for affected individuals or customers to report harm before acting",
    ],
    best: 0,
    assurance: "Issue response and remediation evidence",
    feedback:
      "Data-related assurance includes timely containment, impact assessment, accountable response, and documented remediation/verification—not silent fixes or inaction.",
  },
];

export function dataGovernanceAssuranceScore(answers: Record<string, number>) {
  const done = DATA_GOVERNANCE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_GOVERNANCE_ASSURANCE_ROUNDS.length,
  };
}
