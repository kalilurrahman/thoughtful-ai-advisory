export type SafetyMisuseAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SAFETY_MISUSE_ASSURANCE_ROUNDS: SafetyMisuseAssuranceRound[] = [
  {
    id: "no-adversarial-test",
    scenario:
      "A model is being prepared for release, but it has only been tested on benign prompts; no one has probed harmful, dual-use, or high-risk requests.",
    choices: [
      "Run adversarial and misuse testing (including high-risk domains), record failure modes, and decide release scope, safeguards, or restrictions based on results",
      "Release broadly and address problems after users report them",
      "Rely on the model's general instruction-following as sufficient protection",
    ],
    best: 0,
    assurance: "Adversarial and misuse testing",
    feedback:
      "Benign tests miss the cases that matter: probe harmful and dual-use requests, record failures, and let results drive release scope, safeguards, or restrictions.",
  },
  {
    id: "capability-threshold",
    scenario:
      "A model shows markedly stronger capability than the version currently approved, and the team is unsure whether existing safeguards still hold.",
    choices: [
      "Re-evaluate safeguards against the new capability, gate or restrict deployment until controls are verified, and record the decision",
      "Deploy and watch for problems, assuming the previous controls still apply",
      "Suppress the capability finding to avoid delaying the release",
    ],
    best: 0,
    assurance: "Capability-gated safeguards",
    feedback:
      "Capability changes change risk: re-verify safeguards, gate deployment until controls hold, and record the decision rather than assuming prior controls remain adequate.",
  },
  {
    id: "misuse-blind",
    scenario:
      "The system is live, but there is no monitoring for repeated harmful requests, jailbreak patterns, or unusual usage that could indicate misuse.",
    choices: [
      "Monitor for misuse patterns and anomalies, set escalation thresholds, and define response options (throttle, block, review, suspend) with owners",
      "Assume misuse will be reported by users",
      "Disable logging of attempts to protect user privacy, losing visibility entirely",
    ],
    best: 0,
    assurance: "Misuse monitoring and response",
    feedback:
      "Misuse is rarely announced: monitor patterns and anomalies, set thresholds, and define proportionate responses with owners while preserving necessary evidence.",
  },
  {
    id: "incident-learning",
    scenario:
      "A harmful output reached users, but the incident was handled informally with no record of cause, affected users, or follow-up actions.",
    choices: [
      "Run a documented safety incident review: root cause, affected users, containment, corrective actions, and evidence of closure",
      "Patch the specific prompt and treat the incident as closed",
      "Avoid documenting the incident to limit liability exposure",
    ],
    best: 0,
    assurance: "Safety incident review and closure",
    feedback:
      "Safety incidents are learning events: document root cause, impact, containment, and corrective actions, and close them with evidence so the same failure is less likely again.",
  },
];

export function safetyMisuseAssuranceScore(answers: Record<string, number>) {
  const done = SAFETY_MISUSE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SAFETY_MISUSE_ASSURANCE_ROUNDS.length,
  };
}
