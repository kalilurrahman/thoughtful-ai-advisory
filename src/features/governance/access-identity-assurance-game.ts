export type AccessIdentityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ACCESS_IDENTITY_ASSURANCE_ROUNDS: AccessIdentityAssuranceRound[] = [
  {
    id: "least-privilege",
    scenario:
      "Users and services have broad access to AI systems, tools, and data beyond what their roles require.",
    choices: [
      "Apply role-based, least-privilege access scoped to tasks, with approvals for elevated or sensitive permissions",
      "Grant broad access by default to reduce friction",
      "Share accounts so teams can move faster",
    ],
    best: 0,
    assurance: "Least-privilege and role-based access",
    feedback:
      "Access assurance relies on least-privilege, role-appropriate permissions to limit blast radius, misuse, and unintended actions.",
  },
  {
    id: "identity-auth",
    scenario:
      "Authentication is weak or inconsistent, and service accounts/API keys are unmanaged, shared, or long-lived without oversight.",
    choices: [
      "Enforce strong identity and authentication, manage service credentials/keys securely, and use auditable identities",
      "Use shared or long-lived credentials for convenience",
      "Rely on network location alone instead of identity controls",
    ],
    best: 0,
    assurance: "Identity, authentication, and credential control",
    feedback:
      "Strong, auditable identities and well-managed credentials are foundational to controlling who or what can access AI systems and data.",
  },
  {
    id: "reviews-revocation",
    scenario:
      "People change roles or leave, and integrations change, but access is rarely reviewed and not promptly revoked.",
    choices: [
      "Conduct periodic access reviews and promptly revoke or adjust access when roles, needs, or integrations change",
      "Review access only after a security incident",
      "Keep access in place to avoid disrupting work",
    ],
    best: 0,
    assurance: "Access reviews and timely revocation",
    feedback:
      "Ongoing access reviews and prompt revocation prevent privilege creep and reduce risk from stale or unnecessary access.",
  },
  {
    id: "segregation-evidence",
    scenario:
      "Sensitive actions (such as deploying changes, approving exceptions, or accessing protected data) can be performed without segregation of duties or clear evidence.",
    choices: [
      "Apply segregation of duties for sensitive actions, require appropriate approvals, and maintain evidence of access governance",
      "Allow a single person to perform and approve all sensitive actions for speed",
      "Assume access is appropriate without records or checks",
    ],
    best: 0,
    assurance: "Segregation of duties and access evidence",
    feedback:
      "Assurance for sensitive actions is strengthened by segregation of duties, approvals where needed, and evidence that access is governed and reviewed.",
  },
];

export function accessIdentityAssuranceScore(answers: Record<string, number>) {
  const done = ACCESS_IDENTITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ACCESS_IDENTITY_ASSURANCE_ROUNDS.length,
  };
}
