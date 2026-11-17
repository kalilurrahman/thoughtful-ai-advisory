export type IntakeOnboardingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INTAKE_ONBOARDING_ROUNDS: IntakeOnboardingRound[] = [
  {
    id: "shadow-ai",
    scenario:
      "A team is using a consumer AI tool with customer data, and governance only finds out when an invoice appears.",
    choices: [
      "Bring the tool into intake: assess data handling and risk, decide approved use with conditions, and record the decision",
      "Ban the tool without offering an assessed alternative",
      "Leave it running but ask the team to be careful",
    ],
    best: 0,
    assurance: "Shadow AI intake",
    feedback:
      "Shadow AI is a symptom of a slow front door: bring the tool into intake, assess data handling and risk, and record an approved use with conditions.",
  },
  {
    id: "pilot-bypass",
    scenario:
      "A pilot is described as experimental, so it skips AI review, and it starts serving real users before anyone assesses it.",
    choices: [
      "Apply proportionate intake to pilots based on exposure to real users and data, and re-assess when the pilot becomes production",
      "Keep pilots exempt because they are temporary",
      "Stop all pilots until a full review process exists",
    ],
    best: 0,
    assurance: "Proportionate intake for pilots",
    feedback:
      "Pilots with real users carry real risk: apply proportionate intake based on exposure and data, and re-assess when the pilot becomes production.",
  },
  {
    id: "checklist-theatre",
    scenario:
      "An onboarding checklist was completed, but key items were self-attested with no evidence and no one checked them before go-live.",
    choices: [
      "Require evidence for material onboarding items, verify it before go-live, and record who confirmed each item",
      "Accept self-attestation to keep onboarding fast",
      "Add more checklist items to cover the gaps",
    ],
    best: 0,
    assurance: "Verified onboarding evidence",
    feedback:
      "A completed checklist is not assurance: require evidence for material items, verify before go-live, and record who confirmed each item.",
  },
  {
    id: "no-handover",
    scenario:
      "A system was onboarded with owners and monitoring agreed, but no one recorded those obligations, so they vanished after the project team moved on.",
    choices: [
      "Record onboarding obligations (owner, monitoring, review dates) in the system register and confirm them with the receiving team",
      "Rely on the project team to remember and hand over informally",
      "Assign the obligations to governance until someone else claims them",
    ],
    best: 0,
    assurance: "Onboarding handover",
    feedback:
      "Onboarding ends with a handover, not a launch: record obligations in the system register and confirm them with the receiving team so they survive the project.",
  },
];

export function intakeOnboardingScore(answers: Record<string, number>) {
  const done = INTAKE_ONBOARDING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INTAKE_ONBOARDING_ROUNDS.length,
  };
}
