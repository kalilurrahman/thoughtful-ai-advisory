export type EducationIntegrityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EDUCATION_INTEGRITY_ROUNDS: EducationIntegrityRound[] = [
  {
    id: "retrospective-rule",
    scenario:
      "An essay was written largely with AI while the policy said nothing, and a penalty is applied after the marks are published.",
    choices: [
      "Set permitted and prohibited AI use per assessment and publish it before students start",
      "Apply the new policy to this cohort as a warning to others",
      "Waive the penalty this time and announce the policy next term",
    ],
    best: 0,
    assurance: "Rules in advance",
    feedback:
      "Students cannot comply with a rule they never saw: define permitted use per assessment and publish it before the work begins.",
  },
  {
    id: "detector-verdict",
    scenario:
      "An AI detector flags a student who writes in a second language, and the mark is reduced with no further evidence.",
    choices: [
      "Treat the detector result as one piece of evidence and investigate before any penalty",
      "Lower the mark but note that the detector is only indicative",
      "Ask the student to run their draft through the detector themselves",
    ],
    best: 0,
    assurance: "Due process",
    feedback:
      "Detectors produce false positives, especially for second-language writers: a flag is evidence to investigate, not a verdict.",
  },
  {
    id: "outsourceable-task",
    scenario:
      "The take-home essay has not changed in six years and a capable model can produce a strong answer in minutes.",
    choices: [
      "Redesign the assessment so it resists outsourcing rather than relying on detection",
      "Keep the essay and increase the word count so there is more to outsource",
      "Move the essay online and add a detector check before submission",
    ],
    best: 0,
    assurance: "Assessment design",
    feedback:
      "Detection cannot carry an assessment on its own: design tasks that require process, context or live defence of the work.",
  },
  {
    id: "no-disclosure",
    scenario:
      "AI use is allowed on a project, but there is no way for a student to declare what they used and how.",
    choices: [
      "Provide a simple disclosure step so AI contribution is visible in the submission",
      "Rely on staff judgement about how much of the work looks AI-assisted",
      "Ask students to keep a personal log they can show if challenged",
    ],
    best: 0,
    assurance: "Disclosure",
    feedback:
      "If AI use is permitted, the contribution should be declared as part of the work rather than inferred afterwards.",
  },
  {
    id: "inconsistent-staff",
    scenario:
      "Two markers treat the same AI use differently, and neither decision can be explained to the student or appealed.",
    choices: [
      "Train staff on the policy and record decisions with a clear appeal route",
      "Let each marker apply their own academic judgement without recording it",
      "Centralise all AI-related cases with a single senior marker",
    ],
    best: 0,
    assurance: "Consistency & appeal",
    feedback:
      "Consistency comes from training plus a recorded decision and an appeal route, not from leaving each marker to improvise.",
  },
];

export function educationIntegrityScore(answers: Record<string, number>) {
  const done = EDUCATION_INTEGRITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EDUCATION_INTEGRITY_ROUNDS.length,
  };
}
