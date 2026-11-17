export type IncidentSeverityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INCIDENT_SEVERITY_ROUNDS: IncidentSeverityRound[] = [
  {
    id: "not-an-outage",
    scenario:
      "A hiring model starts rejecting a group of candidates at a much higher rate, but every service is up and latency is normal, so the incident queue has no category for it.",
    choices: [
      "Classify it with severity tiers that cover AI-specific harms, not only outages, and assign a severity with an owner",
      "Log it as a quality bug and leave it in the backlog",
      "Wait for a complaint or a regulator enquiry before treating it as an incident",
    ],
    best: 0,
    assurance: "AI-specific severity tiers",
    feedback:
      "AI harms often ship without downtime: severity tiers must cover discrimination, unsafe output and data exposure, not only outages.",
  },
  {
    id: "who-decides",
    scenario:
      "An assistant leaks another customer's order details in a reply, and nobody is sure who declares the severity or how fast.",
    choices: [
      "Have a named triage owner declare severity within a fixed window, using pre-agreed criteria and a documented decision",
      "Let the on-call engineer decide whenever they get to it",
      "Escalate to the whole leadership team and wait for consensus",
    ],
    best: 0,
    assurance: "Owned triage with a window",
    feedback:
      "Severity calls stall without an owner: name a triage owner, give them a decision window, and record the decision against pre-agreed criteria.",
  },
  {
    id: "notify-later",
    scenario:
      "Legal, communications and the account team each learn about a serious AI incident at different times, and the customer notification goes out a week later.",
    choices: [
      "Agree notification triggers and timelines with legal, communications and account owners before incidents happen, and rehearse them",
      "Notify whoever asks first and keep the rest internal",
      "Notify customers only if they can prove they were affected",
    ],
    best: 0,
    assurance: "Pre-agreed notification",
    feedback:
      "Notification decided during an incident is always late: agree triggers, timelines and owners beforehand, and rehearse the call.",
  },
  {
    id: "blame-and-forget",
    scenario:
      "The post-incident review names the engineer who shipped the prompt change, and the corrective actions are never tracked to closure.",
    choices: [
      "Run a blameless review that fixes the system, record corrective actions with owners and dates, and verify them closed",
      "Discipline the engineer so the team takes incidents seriously",
      "Close the review once the immediate fix is deployed",
    ],
    best: 0,
    assurance: "Blameless corrective action",
    feedback:
      "Blame hides the next incident: review the system rather than the person, and track corrective actions to verified closure.",
  },
];

export function incidentSeverityScore(answers: Record<string, number>) {
  const done = INCIDENT_SEVERITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INCIDENT_SEVERITY_ROUNDS.length,
  };
}
