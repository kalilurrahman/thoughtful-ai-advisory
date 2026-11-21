export type LargeEventCrowdSafetyRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const LARGE_EVENT_CROWD_SAFETY_ROUNDS: LargeEventCrowdSafetyRound[] = [
  {
    id: "validation-alerts",
    scenario:
      "An AI system monitors crowd density and flags safety risks, but it has not been validated for this venue's layout, lighting, weather or peak crowd conditions and produces unreliable alerts.",
    choices: [
      "Validate crowd-density, risk detection and alerts for the venue and conditions, and limit reliance where reliability is uncertain",
      "Trust the alerts broadly because the system performed well at other events",
      "Deploy at full scale and tune thresholds only after false alarms or missed risks occur",
    ],
    best: 0,
    assurance: "Validation for venues & conditions",
    feedback:
      "Crowd safety support must be dependable in context: validation across venue layouts and conditions helps ensure alerts are meaningful before staff rely on them.",
  },
  {
    id: "proportionality-fairness",
    scenario:
      "The system directs staff attention and access restrictions in ways that disproportionately target certain groups of attendees, going beyond what is necessary for safety.",
    choices: [
      "Use AI proportionately and non-discriminatorily, avoiding unnecessary profiling or exclusion while focusing on safety needs",
      "Apply heightened scrutiny to groups the system flags more often, even without specific safety evidence",
      "Prioritise speed of intervention over checking whether actions are proportionate or fair",
    ],
    best: 0,
    assurance: "Proportional & non-discriminatory use",
    feedback:
      "Safety measures should be necessary and fair: proportional, non-discriminatory use helps protect attendees from unnecessary profiling or exclusion.",
  },
  {
    id: "command-escalation",
    scenario:
      "During a developing crowd issue, staff receive conflicting AI alerts and are unsure who has authority to decide, escalate or intervene, causing delayed response.",
    choices: [
      "Maintain clear human command, escalation and intervention authority so AI alerts inform but do not replace accountable decisions",
      "Let the system automatically trigger interventions to reduce response time without human confirmation",
      "Leave escalation decisions to whoever notices the alert first, without defined roles",
    ],
    best: 0,
    assurance: "Human command & escalation",
    feedback:
      "Effective response needs clear accountability: defined human command and escalation authority ensure AI alerts lead to timely, coordinated intervention.",
  },
  {
    id: "privacy-communications",
    scenario:
      "To manage the crowd, the system collects and shares attendee data and sends targeted messages, but privacy safeguards and communications practices are unclear or excessive.",
    choices: [
      "Protect attendees with privacy and communications safeguards, limiting data use and ensuring messages are appropriate and necessary",
      "Collect and share attendee data broadly to maximise situational awareness",
      "Send automated messages widely without clear safeguards or consideration of necessity",
    ],
    best: 0,
    assurance: "Privacy & communications safeguards",
    feedback:
      "Safety operations must respect attendees: privacy and communications safeguards help balance situational awareness with necessary and proportionate data use and messaging.",
  },
  {
    id: "traceability-fallback",
    scenario:
      "After a safety incident, organisers cannot trace which alerts were raised, what inputs or model version were used, and when the system became unavailable there was no tested fallback or continuity procedure.",
    choices: [
      "Log decisions, alerts, inputs and model or system versions for traceability and review, and maintain tested fallback and continuity or support procedures",
      "Reconstruct events from staff recollections without system records or practised fallback plans",
      "Treat the incident as resolved once the crowd disperses, without retaining traceable records",
    ],
    best: 0,
    assurance: "Traceability & fallback continuity",
    feedback:
      "Learning and resilience require evidence and preparation: traceable records and tested fallback/continuity procedures support review and safe operations when AI is uncertain or unavailable.",
  },
];

export function largeEventCrowdSafetyScore(answers: Record<string, number>) {
  const done = LARGE_EVENT_CROWD_SAFETY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === LARGE_EVENT_CROWD_SAFETY_ROUNDS.length,
  };
}
