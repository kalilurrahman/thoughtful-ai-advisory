export type HumanOversightAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const HUMAN_OVERSIGHT_ASSURANCE_ROUNDS: HumanOversightAssuranceRound[] = [
  {
    id: "meaningful-review",
    scenario:
      "An AI system recommends actions that affect customers, but reviewers are expected to approve outputs quickly without context, authority, or time to challenge them.",
    choices: [
      "Design meaningful oversight: clear reviewer authority, sufficient context/time, ability to override, and criteria for when escalation is required",
      "Keep a human ‘in the loop’ in name only to satisfy process expectations",
      "Remove review entirely because the model is usually accurate",
    ],
    best: 0,
    assurance: "Meaningful human oversight",
    feedback:
      "Oversight assurance requires more than a checkbox: reviewers need authority, context, competence, and practical ability to challenge or override outputs.",
  },
  {
    id: "escalation-path",
    scenario:
      "During operation, staff encounter uncertain or high-impact AI outputs but there is no defined escalation or override path.",
    choices: [
      "Define escalation triggers, accountable contacts, override/pause procedures, and handoff steps for uncertain or harmful cases",
      "Ask staff to use personal judgment without documented guidance",
      "Route all cases back to the model for another answer",
    ],
    best: 0,
    assurance: "Escalation and override readiness",
    feedback:
      "Effective guardrails include clear escalation/override paths and handoffs so uncertain or high-impact cases reach accountable humans promptly.",
  },
  {
    id: "competence",
    scenario:
      "Oversight roles are assigned, but people have not received role-appropriate training on system limits, failure modes, or when to escalate.",
    choices: [
      "Provide role-based training/guidance, confirm understanding, and ensure reviewers know limitations, signals, and escalation duties",
      "Assume oversight competence because staff are experienced in other areas",
      "Rely on generic policy text without operational guidance",
    ],
    best: 0,
    assurance: "Role clarity and competence",
    feedback:
      "Assurance depends on competent, prepared reviewers: role clarity and training on limitations, signals, and escalation are part of operating guardrails.",
  },
  {
    id: "evidence-of-practice",
    scenario:
      "A team claims oversight controls are in place, but there are no records showing reviews, overrides, escalations, or outcomes.",
    choices: [
      "Collect and review evidence that oversight operates in practice (reviews/overrides/escalations, outcomes, issues) and improve gaps",
      "Treat documented procedure alone as proof the control works",
      "Sample only successful cases and ignore exceptions",
    ],
    best: 0,
    assurance: "Evidence of operating oversight",
    feedback:
      "Oversight controls need evidence of operation in practice—not just procedures—including how exceptions, overrides, and escalations are handled.",
  },
];

export function humanOversightAssuranceScore(answers: Record<string, number>) {
  const done = HUMAN_OVERSIGHT_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === HUMAN_OVERSIGHT_ASSURANCE_ROUNDS.length,
  };
}
