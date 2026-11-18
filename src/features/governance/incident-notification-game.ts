export type IncidentNotificationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INCIDENT_NOTIFICATION_ROUNDS: IncidentNotificationRound[] = [
  {
    id: "news-first",
    scenario:
      "A faulty AI decision wrongly denies services to thousands of people, but there is no threshold for when individuals must be told and customers first hear about it from the news.",
    choices: [
      "Define clear criteria and thresholds for notifying affected individuals and act on them",
      "Issue a general public statement and answer questions as they arrive",
      "Wait until a regulator asks for a list of affected customers before contacting them",
    ],
    best: 0,
    assurance: "Notification criteria",
    feedback:
      "People should not learn about harm from the news: define criteria and thresholds in advance so you know when notification is required and can act quickly.",
  },
  {
    id: "unknown-affected",
    scenario:
      "After an AI error, the team can confirm something went wrong but cannot identify which customers were affected or how to reach them.",
    choices: [
      "Keep records that let you identify and reach affected individuals, and reconstruct who was impacted",
      "Notify all customers in case some of them were affected",
      "Post a notice in the app and ask anyone affected to contact support",
    ],
    best: 0,
    assurance: "Identification & reach",
    feedback:
      "Notification depends on knowing who was affected: keep the records needed to identify and reach those individuals rather than guessing or shifting the burden onto them.",
  },
  {
    id: "vague-notice",
    scenario:
      "Affected people receive a short email saying 'we experienced an issue' with no explanation of the impact or what they should do next.",
    choices: [
      "Send a timely, clear notice explaining what happened, the impact, and concrete steps to take",
      "Add an apology and link to the privacy policy for more detail",
      "Tell people to contact support if they think they were affected",
    ],
    best: 0,
    assurance: "Clear communication",
    feedback:
      "A vague message leaves people unable to protect themselves: explain the impact in plain language and tell them what to do now.",
  },
  {
    id: "no-remedy",
    scenario:
      "People are told their decisions were wrong but the notice offers no way to get the decision reviewed, corrected or supported.",
    choices: [
      "Offer a staffed remedy, support and recourse route and make it easy to use",
      "Invite people to submit a complaint through the standard form",
      "Promise that the issue will be fixed in a future update",
    ],
    best: 0,
    assurance: "Remedy & recourse",
    feedback:
      "Notification without remedy is not enough: give people a real, staffed route to have the harm reviewed, corrected and supported.",
  },
  {
    id: "inconsistent-messages",
    scenario:
      "The team tells the regulator one story, clients another and affected people something else, and nobody records what was sent or whether issues were fixed.",
    choices: [
      "Keep regulator, client and individual notices consistent, and log notifications and outcomes for follow-up",
      "Let each team draft its own message so it fits its audience",
      "Record only the regulator notice because that is the formal requirement",
    ],
    best: 0,
    assurance: "Consistency & learning",
    feedback:
      "Inconsistent messages undermine trust and accountability: coordinate notices across audiences and log what was sent and what was resolved so fixes follow.",
  },
];

export function incidentNotificationScore(answers: Record<string, number>) {
  const done = INCIDENT_NOTIFICATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INCIDENT_NOTIFICATION_ROUNDS.length,
  };
}
