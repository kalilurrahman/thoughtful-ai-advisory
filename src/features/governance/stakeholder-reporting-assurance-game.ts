export type StakeholderReportingAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const STAKEHOLDER_REPORTING_ASSURANCE_ROUNDS: StakeholderReportingAssuranceRound[] = [
  {
    id: "governance-reporting",
    scenario:
      "Leaders and stakeholders ask for the status of AI risks, controls, and guardrails, but reporting is ad hoc and lacks clear, evidence-backed information.",
    choices: [
      "Provide regular, evidence-backed governance reporting on risks, controls/guardrails, issues, and actions tailored to stakeholder needs",
      "Share optimistic summaries without supporting evidence or known gaps",
      "Report only when asked, with inconsistent details each time",
    ],
    best: 0,
    assurance: "Evidence-backed governance reporting",
    feedback:
      "Assurance reporting should be timely, consistent, and grounded in evidence so stakeholders understand risk posture, control status, and open actions.",
  },
  {
    id: "limitations-changes",
    scenario:
      "An AI system's capabilities, limitations, or behavior change materially, but affected users and stakeholders are not clearly informed.",
    choices: [
      "Communicate material changes, limitations, and impacts clearly to relevant audiences with guidance on what to do",
      "Assume users will notice and adapt without communication",
      "Announce changes in vague terms without explaining limitations or impacts",
    ],
    best: 0,
    assurance: "Communicating limitations and changes",
    feedback:
      "Transparent communication about limitations and material changes helps stakeholders and users make informed decisions and apply appropriate safeguards.",
  },
  {
    id: "incident-communication",
    scenario:
      "An AI-related incident or significant issue occurs, but communication is delayed, inconsistent, or omits key facts needed for response and trust.",
    choices: [
      "Communicate promptly and accurately to relevant stakeholders with known facts, impacts, actions, and next updates/escalation paths",
      "Delay communication until every detail is certain",
      "Provide partial or inconsistent messages without ownership or follow-up",
    ],
    best: 0,
    assurance: "Incident and issue communication",
    feedback:
      "Effective incident communication is timely, factual, and coordinated, providing relevant impacts, actions, and clear follow-up/escalation information.",
  },
  {
    id: "audience-channels",
    scenario:
      "Different audiences (executives, operators, users, reviewers) need different information, but there are no defined channels or responsibilities for updates and escalation.",
    choices: [
      "Define communication channels, responsibilities, and cadences for different audiences, including escalation/reporting paths and feedback loops",
      "Use a single generic message for all audiences regardless of needs",
      "Leave communication to whoever notices an issue first",
    ],
    best: 0,
    assurance: "Channels, audiences, and escalation",
    feedback:
      "Assurance improves when reporting is audience-appropriate with clear channels, owners, cadences, and escalation paths so information reaches the right people in time.",
  },
];

export function stakeholderReportingAssuranceScore(answers: Record<string, number>) {
  const done = STAKEHOLDER_REPORTING_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === STAKEHOLDER_REPORTING_ASSURANCE_ROUNDS.length,
  };
}
