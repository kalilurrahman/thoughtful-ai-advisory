export type RegulatorInquiryRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const REGULATOR_INQUIRY_ROUNDS: RegulatorInquiryRound[] = [
  {
    id: "scramble",
    scenario:
      "A regulator asks which AI systems you operate in a given sector, and the team spends a week assembling a list from memory and old slides.",
    choices: [
      "Answer from a maintained inventory and evidence index that maps each system to its obligations, and record the gaps it reveals",
      "Send the best available list and correct it later if anything is missing",
      "Ask each business unit to send their own list and forward the replies",
    ],
    best: 0,
    assurance: "Answerable from evidence",
    feedback:
      "If the answer takes a week to assemble, it is not assurance: answer from a maintained inventory and evidence index, and record the gaps it reveals.",
  },
  {
    id: "everyone-answers",
    scenario:
      "Three teams reply separately to the same regulator questionnaire with slightly different descriptions of the same system.",
    choices: [
      "Route the inquiry through a named responder with a legal review path so one verified position goes out",
      "Let each team answer their own section because they know their work best",
      "Send all three replies and let the regulator reconcile them",
    ],
    best: 0,
    assurance: "Single verified response",
    feedback:
      "Inconsistent answers read as unreliable evidence: route the inquiry through a named responder with legal review so one verified position goes out.",
  },
  {
    id: "deadline-drift",
    scenario:
      "A statutory deadline is two weeks away, and the person who owns the response is on leave with no handover.",
    choices: [
      "Track statutory and contractual timelines with a deputy and an escalation path, so a deadline never depends on one person",
      "Ask for an extension and hope the regulator agrees",
      "Submit a partial answer on time and complete it afterwards",
    ],
    best: 0,
    assurance: "Owned timelines",
    feedback:
      "A deadline that depends on one calendar is a single point of failure: track timelines with a deputy and an escalation path.",
  },
  {
    id: "flattering-answer",
    scenario:
      "A draft answer says human review happens for every high-risk output, which is aspirational rather than how the system currently runs.",
    choices: [
      "Verify each answer against evidence before submission, and describe the current state with any gaps and remediation stated",
      "Keep the aspirational wording because it reflects the intended control",
      "Remove the sentence so nothing inaccurate is claimed",
    ],
    best: 0,
    assurance: "Evidence-verified answers",
    feedback:
      "An answer you cannot evidence is a misstatement: verify against evidence, describe the current state, and state gaps with remediation.",
  },
];

export function regulatorInquiryScore(answers: Record<string, number>) {
  const done = REGULATOR_INQUIRY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === REGULATOR_INQUIRY_ROUNDS.length,
  };
}
