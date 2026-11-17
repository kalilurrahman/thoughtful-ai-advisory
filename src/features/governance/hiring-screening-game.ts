export type HiringScreeningRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const HIRING_SCREENING_ROUNDS: HiringScreeningRound[] = [
  {
    id: "vendor-fairness-claim",
    scenario:
      "A CV-ranking tool is approved because the supplier's brochure says the model is \u201cbias-free\u201d, and nobody measures outcomes for your own applicants.",
    choices: [
      "Measure adverse impact by group at every stage on your own pipeline, and set a threshold for action",
      "Accept the vendor claim because the model was audited before release",
      "Ask recruiting to keep an eye on diversity in the hiring report",
    ],
    best: 0,
    assurance: "Measured adverse impact",
    feedback:
      "A vendor's fairness claim describes their test, not your pipeline: measure adverse impact on your own stages and set a threshold.",
  },
  {
    id: "auto-reject",
    scenario:
      "Candidates below a model score threshold are rejected automatically, and no recruiter sees the application.",
    choices: [
      "Have a human review before any rejection, record the reasoning, and let them override the score",
      "Keep automatic rejection for high-volume roles only",
      "Tell candidates a human reviewed the decision because a recruiter can look it up on request",
    ],
    best: 0,
    assurance: "Human review before rejection",
    feedback:
      "A rejection nobody reviewed is a model decision: put a human in front of it, record their reasoning and allow override.",
  },
  {
    id: "undisclosed-ai",
    scenario:
      "Candidates complete a video interview scored by AI and are never told a model assessed them or how the recording is used.",
    choices: [
      "Tell candidates AI is used, how, what is retained, and offer an accessible alternative route",
      "Disclose it in the privacy policy linked in the application footer",
      "Mention it in the rejection email so unsuccessful candidates know",
    ],
    best: 0,
    assurance: "Candidate disclosure",
    feedback:
      "A candidate who does not know a model assessed them cannot question it: disclose before the assessment and offer an alternative.",
  },
  {
    id: "no-alternative",
    scenario:
      "A candidate with a disability asks for an alternative to the AI video assessment, and the only answer is to use the same tool with more time.",
    choices: [
      "Offer a genuinely different route that assesses the same job requirements, and record the accommodation",
      "Grant extra time and treat the request as handled",
      "Explain that the tool is the standard process for all candidates",
    ],
    best: 0,
    assurance: "Accessible alternative",
    feedback:
      "Extra time on the same tool is not an alternative: offer a different route that tests the same requirements and record it.",
  },
  {
    id: "no-records",
    scenario:
      "A rejected candidate asks why they were screened out, and the score, model version and criteria have already been deleted.",
    choices: [
      "Retain screening records, model versions and criteria for a defined period so a decision can be explained",
      "Explain that the process is confidential and the decision is final",
      "Re-run the screening now and share the new result",
    ],
    best: 0,
    assurance: "Explainable decisions",
    feedback:
      "A decision you cannot reconstruct cannot be explained: retain scores, versions and criteria for a defined period.",
  },
];

export function hiringScreeningScore(answers: Record<string, number>) {
  const done = HIRING_SCREENING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === HIRING_SCREENING_ROUNDS.length,
  };
}
