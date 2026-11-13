export type PolicyAlignmentAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const POLICY_ALIGNMENT_ASSURANCE_ROUNDS: PolicyAlignmentAssuranceRound[] = [
  {
    id: "obligation-mapping",
    scenario:
      "A team deploys an AI system without identifying which internal policies, standards, or external obligations apply to its use and context.",
    choices: [
      "Map applicable policies, standards, and obligations to the system/context and assign owners to interpret and address them",
      "Assume general company policies cover every AI use case",
      "Wait until an external request or audit to determine what applies",
    ],
    best: 0,
    assurance: "Obligation and policy mapping",
    feedback:
      "Alignment assurance starts with understanding what applies to the specific system and context, with clear ownership for interpretation and follow-through.",
  },
  {
    id: "controls-translation",
    scenario:
      "Requirements are known in principle, but they are not translated into concrete controls, guardrails, responsibilities, or acceptance criteria.",
    choices: [
      "Translate requirements into specific controls/guardrails, roles, and criteria, and integrate them into design and operations",
      "Keep requirements as high-level statements without implementation",
      "Rely on individual judgment without defined controls or criteria",
    ],
    best: 0,
    assurance: "Controls and guardrail translation",
    feedback:
      "Policies and standards provide assurance only when translated into concrete, implementable controls and guardrails with clear responsibilities.",
  },
  {
    id: "evidence-alignment",
    scenario:
      "Controls exist, but there is little evidence showing how they meet requirements, where gaps remain, or how alignment is maintained.",
    choices: [
      "Maintain traceable evidence linking requirements to controls, outcomes, gaps, and remediation status",
      "Claim alignment without supporting evidence",
      "Collect evidence only once and never update it",
    ],
    best: 0,
    assurance: "Evidence of alignment",
    feedback:
      "Assurance requires traceable, current evidence that connects obligations to implemented controls, known gaps, and remediation—not assumptions or stale records.",
  },
  {
    id: "change-escalation",
    scenario:
      "Policies, standards, or the AI system itself change, but no process exists to reassess alignment or escalate emerging gaps.",
    choices: [
      "Monitor changes, reassess alignment, escalate gaps with owners/timelines, and update controls and evidence accordingly",
      "Assume past alignment remains valid after changes",
      "Handle gaps informally without escalation or tracking",
    ],
    best: 0,
    assurance: "Change management and gap escalation",
    feedback:
      "Alignment is dynamic: changes in requirements or systems require reassessment, timely escalation of gaps, and updates to controls and evidence.",
  },
];

export function policyAlignmentAssuranceScore(answers: Record<string, number>) {
  const done = POLICY_ALIGNMENT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === POLICY_ALIGNMENT_ASSURANCE_ROUNDS.length,
  };
}
