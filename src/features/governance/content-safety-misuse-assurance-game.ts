export type ContentSafetyMisuseAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CONTENT_SAFETY_MISUSE_ASSURANCE_ROUNDS: ContentSafetyMisuseAssuranceRound[] = [
  {
    id: "policy-boundaries",
    scenario:
      "An AI system is launched without clear policies defining unacceptable content, prohibited uses, and how to handle sensitive or harmful requests.",
    choices: [
      "Define and communicate clear unacceptable-content and misuse policies, aligned to use context and risks, with ownership for enforcement",
      "Rely on informal judgment without documented policies or boundaries",
      "Allow broad use and address harmful outcomes only after they occur",
    ],
    best: 0,
    assurance: "Safety policies and boundaries",
    feedback:
      "Content safety assurance starts with clear, context-appropriate policies for unacceptable content and misuse, with accountable ownership for enforcement.",
  },
  {
    id: "filtering-refusal",
    scenario:
      "The system receives requests that should be refused or constrained, but input/output safeguards and refusal behaviors are inconsistent or easy to bypass.",
    choices: [
      "Implement and validate proportionate input/output safeguards and consistent refusal/redirection behaviors for disallowed or risky requests",
      "Rely on a single keyword filter without testing or updates",
      "Avoid refusals to maximize responsiveness in all cases",
    ],
    best: 0,
    assurance: "Safeguards and refusal behaviors",
    feedback:
      "Effective safety guardrails include proportionate filtering and consistent, tested refusal or safe-redirection behaviors for disallowed or risky requests.",
  },
  {
    id: "dual-use-escalation",
    scenario:
      "Users submit dual-use or potentially harmful requests where intent is unclear, and staff lack guidance on safe handling, escalation, or reporting.",
    choices: [
      "Provide guidance for dual-use/ambiguous requests, apply safe handling and escalation/reporting paths, and document actions taken",
      "Fulfill requests whenever intent is not explicitly stated",
      "Block all borderline requests without guidance, review, or escalation options",
    ],
    best: 0,
    assurance: "Dual-use handling and escalation",
    feedback:
      "Misuse prevention includes careful handling of ambiguous or dual-use requests, with clear escalation/reporting paths and documented, proportionate responses.",
  },
  {
    id: "tuning-evidence",
    scenario:
      "Safety incidents, bypasses, or user reports occur, but there is no evidence-backed process to review, tune guardrails, or verify improvements.",
    choices: [
      "Review incidents and reports, tune guardrails based on evidence, test changes, and track effectiveness over time",
      "Make ad hoc adjustments without testing or records",
      "Assume initial safety settings will remain sufficient without review",
    ],
    best: 0,
    assurance: "Evidence-backed tuning and improvement",
    feedback:
      "Safety assurance is continuous: review signals and incidents, tune guardrails with evidence, validate changes, and track whether protections improve.",
  },
];

export function contentSafetyMisuseAssuranceScore(answers: Record<string, number>) {
  const done = CONTENT_SAFETY_MISUSE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CONTENT_SAFETY_MISUSE_ASSURANCE_ROUNDS.length,
  };
}
