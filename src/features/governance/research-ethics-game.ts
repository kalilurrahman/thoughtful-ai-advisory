export type ResearchEthicsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RESEARCH_ETHICS_ROUNDS: ResearchEthicsRound[] = [
  {
    id: "study-starts-first",
    scenario:
      "A usability study with 40 external participants begins this week, and the ethics review is booked for after the first results.",
    choices: [
      "Hold the study until a proportionate review is done, and record what was reviewed",
      "Run the first sessions because the protocol is low risk and the review can follow",
      "Ask participants to sign a waiver so the review is not needed",
    ],
    best: 0,
    assurance: "Review before participants",
    feedback:
      "A review after the study is a ratification, not a safeguard: hold the sessions until the proportionate review is complete.",
  },
  {
    id: "vague-disclosure",
    scenario:
      "Participants are told they are \u201ctesting an AI assistant\u201d, without knowing that their prompts will be retained and used to fine-tune a model.",
    choices: [
      "Explain what the system does, what is retained, and how outputs and data will be used before they start",
      "Keep the description short so participants are not primed to behave differently",
      "Disclose the retention in the terms and conditions they accept at sign-up",
    ],
    best: 0,
    assurance: "Informed participants",
    feedback:
      "Participants who do not know their prompts train a model have not agreed to it: explain use and retention up front.",
  },
  {
    id: "consent-bundled",
    scenario:
      "Consent is a single checkbox covering the study, future research and marketing contact, and there is no way to withdraw.",
    choices: [
      "Take specific, recorded consent for the study, and provide a working way to withdraw later",
      "Keep the bundled consent because it reduces drop-off and legal has approved the wording",
      "Add a sentence saying participants may contact the team if they change their mind",
    ],
    best: 0,
    assurance: "Specific, revocable consent",
    feedback:
      "Bundled consent is not consent to any one thing: take specific recorded consent and make withdrawal real.",
  },
  {
    id: "no-stopping-rule",
    scenario:
      "During a red-team session a participant is shown distressing content, and the session continues because the schedule has six more scenarios.",
    choices: [
      "Stop on the participant's signal, check on them, and record the decision to end the session",
      "Complete the remaining scenarios quickly so the data set is consistent",
      "Offer a debrief afterwards and continue with the plan",
    ],
    best: 0,
    assurance: "Safeguards and stopping rules",
    feedback:
      "A stopping rule that is not used is decoration: stop when a participant signals distress and record the decision.",
  },
  {
    id: "buried-negative",
    scenario:
      "A pilot finds the assistant performs worse for one language group, and the finding is left out of the launch pack because it is not statistically significant.",
    choices: [
      "Report the finding with its limits and let the launch decision account for it",
      "Leave it out until a larger study can confirm it",
      "Note it in an appendix that the launch committee does not read",
    ],
    best: 0,
    assurance: "Honest reporting",
    feedback:
      "An inconvenient finding is still a finding: report it with its limits so the decision is made with it, not without it.",
  },
];

export function researchEthicsScore(answers: Record<string, number>) {
  const done = RESEARCH_ETHICS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RESEARCH_ETHICS_ROUNDS.length,
  };
}
