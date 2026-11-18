export type ChildrenAgeRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CHILDREN_AGE_ROUNDS: ChildrenAgeRound[] = [
  {
    id: "id-documents",
    scenario:
      "To confirm age, the assistant asks every user, including adults, to upload a passport or driving licence.",
    choices: [
      "Use age assurance proportionate to the risk, and keep identity documents only where genuinely needed",
      "Keep passport checks because they are the most accurate method available",
      "Ask users to self-declare their age and trust the answer",
    ],
    best: 0,
    assurance: "Proportionate age assurance",
    feedback:
      "Collecting identity documents from everyone creates a new risk to solve the old one: choose assurance proportionate to the risk.",
  },
  {
    id: "engagement-defaults",
    scenario:
      "A companion assistant for teenagers ships with the same persuasive prompts, streaks and infinite scroll defaults as the adult app.",
    choices: [
      "Set age-appropriate defaults, plain explanations and content limits for younger users",
      "Add a parental controls page and leave the defaults unchanged",
      "Rename the feature so it reads as educational rather than social",
    ],
    best: 0,
    assurance: "Age-appropriate design",
    feedback:
      "Defaults, not settings, decide how a child experiences the product: change the defaults and explain them plainly.",
  },
  {
    id: "bundled-consent",
    scenario:
      "A parent consents once at signup, cannot see what was shared, and has no way to withdraw.",
    choices: [
      "Record parental consent, show what it covers and make withdrawal straightforward",
      "Keep the single consent because the parent agreed at the start",
      "Move consent into the general terms so it is accepted at each login",
    ],
    best: 0,
    assurance: "Parental consent",
    feedback:
      "Consent that cannot be seen or withdrawn is not meaningful: record it, show its scope and make withdrawal easy.",
  },
  {
    id: "stranger-contact",
    scenario:
      "The assistant lets unknown adults start private conversations with a child user, and no one assessed the risk.",
    choices: [
      "Assess child-specific risks such as stranger contact, manipulation and self-harm, and mitigate them",
      "Rely on the general community guidelines and a report button",
      "Add a warning message when an adult starts a chat",
    ],
    best: 0,
    assurance: "Child-specific risk assessment",
    feedback:
      "General guidelines do not cover child-specific harm: assess stranger contact, manipulation, self-harm and commercial pressure explicitly.",
  },
  {
    id: "no-escalation",
    scenario:
      "A child discloses self-harm to the assistant, and the reply links to a generic help page with no escalation.",
    choices: [
      "Route child-safety disclosures to trained responders with a clear path to the authorities",
      "Improve the help page wording and keep the same flow",
      "Ask the child to speak to a trusted adult and close the conversation",
    ],
    best: 0,
    assurance: "Child-safety escalation",
    feedback:
      "A generic link is not an escalation route: send child-safety disclosures to trained responders with a defined path to the authorities.",
  },
];

export function childrenAgeScore(answers: Record<string, number>) {
  const done = CHILDREN_AGE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CHILDREN_AGE_ROUNDS.length,
  };
}
