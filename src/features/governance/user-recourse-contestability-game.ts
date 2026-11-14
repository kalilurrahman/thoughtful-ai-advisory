export type UserRecourseContestabilityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const USER_RECOURSE_CONTESTABILITY_ROUNDS: UserRecourseContestabilityRound[] = [
  {
    id: "clear-recourse",
    scenario:
      "People affected by an AI-influenced decision do not know how to question the outcome, request an explanation, or seek review.",
    choices: [
      "Provide clear, accessible recourse paths so people can question outcomes, request information, and seek review",
      "Offer no recourse because the decision involved AI assistance",
      "Provide recourse information only after a formal complaint is escalated externally",
    ],
    best: 0,
    assurance: "Accessible recourse paths",
    feedback:
      "Contestability assurance requires clear, accessible ways for affected people to question outcomes and seek review, not hidden or after-the-fact options.",
  },
  {
    id: "human-review-correction",
    scenario:
      "A person challenges an AI-influenced outcome, but there is no timely human review process or way to correct errors and harmful impacts.",
    choices: [
      "Enable timely human review with authority to correct errors, adjust outcomes, and mitigate harm where appropriate",
      "Respond with automated messages and no meaningful review",
      "Treat all AI-influenced outcomes as final to avoid rework",
    ],
    best: 0,
    assurance: "Human review and correction",
    feedback:
      "Meaningful recourse includes timely human review and the ability to correct errors or mitigate harm, rather than automated or final-only responses.",
  },
  {
    id: "communication-guidance",
    scenario:
      "Recourse options exist, but instructions are hard to find, unclear, or not communicated in ways relevant users can understand and act on.",
    choices: [
      "Communicate recourse options clearly and accessibly, with guidance on steps, timelines, and what users can expect",
      "Bury recourse details in lengthy or technical documents",
      "Assume users will find the right channel without guidance",
    ],
    best: 0,
    assurance: "Clear communication of recourse",
    feedback:
      "Recourse is effective only when people can find and understand it; clear, accessible communication and expectations support fair contestability.",
  },
  {
    id: "tracking-remediation",
    scenario:
      "Recourse requests and challenges are handled case by case with no tracking, root-cause learning, or evidence of fair and responsive handling.",
    choices: [
      "Track requests and outcomes, address root causes, remediate issues, and maintain evidence of timely, fair handling",
      "Handle requests informally with no records or follow-up",
      "Close requests quickly without checking whether issues were resolved or recur",
    ],
    best: 0,
    assurance: "Tracking, remediation, and evidence",
    feedback:
      "Assurance includes tracking recourse cases, learning from patterns, remediating issues, and evidencing timely, fair, and responsive handling over time.",
  },
];

export function userRecourseContestabilityScore(answers: Record<string, number>) {
  const done = USER_RECOURSE_CONTESTABILITY_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === USER_RECOURSE_CONTESTABILITY_ROUNDS.length,
  };
}
