export type SecurityRobustnessAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SECURITY_ROBUSTNESS_ASSURANCE_ROUNDS: SecurityRobustnessAssuranceRound[] = [
  {
    id: "prompt-injection",
    scenario:
      "An AI assistant connected to tools receives untrusted user or external content that tries to override instructions or trigger unsafe actions.",
    choices: [
      "Apply prompt-injection/jailbreak defenses: input/output handling, tool-use constraints, least privilege, and human approval for high-impact actions",
      "Rely on the system prompt alone to prevent misuse",
      "Disable all safeguards to avoid interrupting user workflows",
    ],
    best: 0,
    assurance: "Abuse and prompt-injection defenses",
    feedback:
      "Robustness against abuse requires layered defenses—instruction/data separation where possible, constrained tool use, least privilege, and approvals for risky actions—not prompt text alone.",
  },
  {
    id: "access-controls",
    scenario:
      "An AI workflow can access sensitive systems and data, but accounts are shared, permissions are broad, and authentication controls are weak.",
    choices: [
      "Enforce strong authentication, least-privilege scoped access, secrets hygiene, and auditable identities for users and services",
      "Use shared credentials to simplify operations",
      "Grant broad access because the model is trusted to stay in scope",
    ],
    best: 0,
    assurance: "Authentication and least privilege",
    feedback:
      "Security assurance depends on strong identity, least-privilege access, and secret management; shared or broad access increases blast radius and weakens accountability.",
  },
  {
    id: "robustness-testing",
    scenario:
      "Before release, the team has not tested how the AI system behaves under misuse, adversarial inputs, edge cases, or unexpected tool failures.",
    choices: [
      "Test for misuse/adversarial and edge-case scenarios, validate failure handling and guardrails, and address gaps before and after release",
      "Test only happy-path examples and ship",
      "Assume monitoring after launch replaces pre-release robustness testing",
    ],
    best: 0,
    assurance: "Robustness and misuse testing",
    feedback:
      "Assurance includes proactive testing for misuse, adversarial inputs, and failure modes; monitoring complements but does not replace pre-release robustness validation.",
  },
  {
    id: "incident-response",
    scenario:
      "Security-relevant signals (abuse attempts, anomalous tool use, or suspected compromise) appear, but logging is limited and response roles are unclear.",
    choices: [
      "Maintain secure logging/monitoring, triage and contain incidents with clear owners/escalation, and document lessons and corrective actions",
      "Ignore signals unless a confirmed breach is reported externally",
      "Delete logs quickly to reduce storage and privacy concerns without review",
    ],
    best: 0,
    assurance: "Monitoring, logging, and incident response",
    feedback:
      "Security and abuse-resilience assurance needs actionable logging/monitoring, clear response ownership and escalation, and documented containment/learning—not silence or log loss.",
  },
];

export function securityRobustnessAssuranceScore(answers: Record<string, number>) {
  const done = SECURITY_ROBUSTNESS_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SECURITY_ROBUSTNESS_ASSURANCE_ROUNDS.length,
  };
}
