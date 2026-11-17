export type SpeakUpRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SPEAK_UP_ROUNDS: SpeakUpRound[] = [
  {
    id: "single-route",
    scenario:
      "The only way to raise an AI concern is through your line manager, and the concern is about your line manager's project.",
    choices: [
      "Provide more than one route, including one outside the line, and tell people where it goes",
      "Ask the person to raise it with their manager's manager instead",
      "Suggest they wait until the next employee survey",
    ],
    best: 0,
    assurance: "Multiple reporting routes",
    feedback:
      "A single route fails exactly when it matters: offer a route outside the line and say where it leads.",
  },
  {
    id: "retaliation",
    scenario:
      "Someone raises a concern about a model being approved without testing, and is moved off the project the following month.",
    choices: [
      "Treat the move as a retaliation risk, review it independently, and record what was found",
      "Explain that resourcing decisions are unrelated and leave it there",
      "Offer the person a different role to smooth things over",
    ],
    best: 0,
    assurance: "Non-retaliation upheld",
    feedback:
      "Non-retaliation is proven by what happens after a concern, not by the policy text: review adverse moves independently.",
  },
  {
    id: "no-triage",
    scenario:
      "A concern about discriminatory output sits in a shared inbox for three weeks with no owner and no severity.",
    choices: [
      "Triage on arrival with an owner, a severity and a timeframe, and record the decision",
      "Let the team pick it up when the sprint allows",
      "Close it once the person who raised it leaves the organisation",
    ],
    best: 0,
    assurance: "Triaged with an owner",
    feedback:
      "A concern without an owner and a clock is a suggestion: triage it on arrival and record the decision.",
  },
  {
    id: "silent-outcome",
    scenario:
      "A concern is investigated and closed, and the person who raised it never learns whether anything happened.",
    choices: [
      "Tell the reporter what happened within stated limits, and record that they were told",
      "Keep the outcome confidential to protect the investigation",
      "Thank them at the next all-hands without specifics",
    ],
    best: 0,
    assurance: "Feedback to the reporter",
    feedback:
      "Silence teaches people not to bother: give the reporter an outcome within stated limits and record it.",
  },
  {
    id: "repeat-concerns",
    scenario:
      "Three separate concerns about the same model are closed individually, and nobody notices they describe the same failure.",
    choices: [
      "Review themes across concerns and escalate repeat patterns into governance",
      "Close each one as it arrives so the queue stays clear",
      "Add a note to the model's risk entry and wait for a fourth",
    ],
    best: 0,
    assurance: "Trends reach governance",
    feedback:
      "Concerns closed one at a time hide a pattern: review themes and escalate repeats into governance.",
  },
];

export function speakUpScore(answers: Record<string, number>) {
  const done = SPEAK_UP_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SPEAK_UP_ROUNDS.length,
  };
}
