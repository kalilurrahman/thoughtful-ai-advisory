export type IncidentCommunicationTabletopRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INCIDENT_COMMUNICATION_TABLETOP_ROUNDS: IncidentCommunicationTabletopRound[] = [
  {
    id: "coordination",
    scenario:
      "An AI incident unfolds with incomplete information, and technical, legal, operations, and leadership teams are acting without coordination or a shared communication lead.",
    choices: [
      "Activate a coordinated response with clear roles, a communication lead/point of contact, and shared situational updates across functions",
      "Let each team communicate independently to move quickly",
      "Wait for full certainty before coordinating or communicating anything",
    ],
    best: 0,
    assurance: "Cross-functional coordination",
    feedback:
      "Effective incident communication starts with coordination: clear roles, a communication lead, and shared situational awareness reduce confusion and conflicting messages.",
  },
  {
    id: "timely-updates",
    scenario:
      "Stakeholders and affected users need to know what is happening, but updates are delayed or inconsistent as facts evolve.",
    choices: [
      "Provide timely, factual updates with what is known, impacts, actions taken, and when the next update will come, adjusting as facts change",
      "Delay all communication until the incident is fully resolved",
      "Send optimistic updates without confirming key facts or impacts",
    ],
    best: 0,
    assurance: "Timely and factual updates",
    feedback:
      "Assurance in incident response includes timely, factual communication that acknowledges uncertainty, shares impacts/actions, and sets expectations for follow-up.",
  },
  {
    id: "escalation-logging",
    scenario:
      "During the response, key decisions, approvals, and escalations are made quickly but not logged, making it hard to track accountability and actions later.",
    choices: [
      "Use defined escalation paths and log key decisions, approvals, communications, and rationale during the response",
      "Handle escalations informally without records to save time",
      "Rely on memory to reconstruct decisions after the incident",
    ],
    best: 0,
    assurance: "Escalation paths and decision logging",
    feedback:
      "Clear escalation paths and contemporaneous logging of decisions and communications support accountability, coordination, and later review under pressure.",
  },
  {
    id: "after-action-review",
    scenario:
      "After the incident, teams return to normal work without reviewing how communication performed or identifying improvements for future responses.",
    choices: [
      "Run an after-action review of communication effectiveness, capture lessons learned, update plans/playbooks, and track follow-up actions",
      "Consider the incident closed once systems are restored",
      "Discuss lessons informally without updating guidance or assigning follow-up",
    ],
    best: 0,
    assurance: "After-action learning and improvement",
    feedback:
      "Post-incident review of communication effectiveness and tracked improvements strengthens readiness and assurance for future AI incidents.",
  },
];

export function incidentCommunicationTabletopScore(answers: Record<string, number>) {
  const done = INCIDENT_COMMUNICATION_TABLETOP_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INCIDENT_COMMUNICATION_TABLETOP_ROUNDS.length,
  };
}
