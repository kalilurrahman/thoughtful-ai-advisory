export type EvidencePackRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const EVIDENCE_PACK_ROUNDS: EvidencePackRound[] = [
  {
    id: "screenshot-pile",
    scenario:
      "An assurance review asks how human oversight works; the response is a folder of 40 screenshots with no labels, no dates and no link to the control they are meant to prove.",
    choices: [
      "Map each claim to the specific evidence that supports it, with a caption, date and owner",
      "Send the folder and offer to walk the reviewer through it on a call",
      "Add a one-page summary and leave the folder as backup",
    ],
    best: 0,
    assurance: "Claim-to-evidence mapping",
    feedback:
      "Evidence without a claim it supports is just material: map each claim to specific, captioned, dated evidence with an owner.",
  },
  {
    id: "stale-evidence",
    scenario:
      "The pack contains an evaluation report from 18 months ago, a guardrail screenshot from before the last release, and an approval email for a model version that has since been replaced.",
    choices: [
      "Re-date the pack, replace evidence that predates material changes, and state the review period explicitly",
      "Keep the old evidence because it shows the control once worked",
      "Add a note saying the evidence may be out of date",
    ],
    best: 0,
    assurance: "Current evidence",
    feedback:
      "Stale evidence weakens the whole pack: replace anything that predates a material change and state the review period explicitly.",
  },
  {
    id: "nobody-owns",
    scenario:
      "A reviewer asks who produced a control test and what system it ran against; the pack has no owner, no source and no way to check.",
    choices: [
      "Record an owner and a source for every claim, so the reviewer can trace and verify it",
      "Name the AI governance lead as owner for the whole pack",
      "Explain it verbally and promise to follow up by email",
    ],
    best: 0,
    assurance: "Traceable claims",
    feedback:
      "Untraceable claims cannot be verified: record an owner and a source per claim so the reviewer can check it without you.",
  },
  {
    id: "guided-tour",
    scenario:
      "The pack only makes sense when the person who built it narrates it; a reviewer trying it alone cannot find the guardrail settings or reproduce the test result.",
    choices: [
      "Run an unaided walkthrough with someone who did not build the pack, and fix what they cannot find or reproduce",
      "Record a video walkthrough and attach it to the pack",
      "Accept that the pack needs a guided tour and always provide one",
    ],
    best: 0,
    assurance: "Reproducible walkthrough",
    feedback:
      "If the pack needs a narrator it is not reproducible: test it with an unaided reviewer and fix what they cannot find or reproduce.",
  },
];

export function evidencePackScore(answers: Record<string, number>) {
  const done = EVIDENCE_PACK_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === EVIDENCE_PACK_ROUNDS.length,
  };
}
