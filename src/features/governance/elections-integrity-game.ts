export type ElectionsIntegrityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ELECTIONS_INTEGRITY_ROUNDS: ElectionsIntegrityRound[] = [
  {
    id: "unlabeled-synthetic",
    scenario:
      "A campaign publishes a realistic AI-generated video of a public figure making statements they never made, without any label or provenance information.",
    choices: [
      "Clearly label AI-generated or materially altered political content and provide provenance where feasible",
      "Add a small note in the caption after the video has already circulated widely",
      "Remove the video only if a platform flags it as manipulated",
    ],
    best: 0,
    assurance: "Labeling & provenance",
    feedback:
      "Synthetic political content should be clearly labeled at publication, with provenance where feasible, so audiences are not misled before correction is possible.",
  },
  {
    id: "manipulative-targeting",
    scenario:
      "An ad system is configured to microtarget emotionally charged messages to vulnerable audience segments in ways that may discourage participation.",
    choices: [
      "Review and constrain targeting to follow legal limits and avoid prohibited manipulation",
      "Keep the targeting because it improves engagement metrics",
      "Rely on the platform's default settings without reviewing the audience criteria",
    ],
    best: 0,
    assurance: "Lawful targeting",
    feedback:
      "Targeting choices need governance: review audience criteria against legal limits and avoid manipulative segmentation, especially of vulnerable groups.",
  },
  {
    id: "unverified-claim",
    scenario:
      "A generative tool drafts ads with confident claims about opponents and voting procedures, and the campaign schedules them without fact-checking.",
    choices: [
      "Review claims and ads for accuracy and misleading content before publication",
      "Publish quickly and correct only if someone challenges the claims",
      "Add a general disclaimer that the content was AI-assisted",
    ],
    best: 0,
    assurance: "Pre-publication review",
    feedback:
      "Speed is not a substitute for review: claims in political communications should be checked for accuracy and misleading content before they go live.",
  },
  {
    id: "opaque-sponsor",
    scenario:
      "A series of AI-generated political ads runs across channels, but records of who sponsored, funded and approved them are incomplete.",
    choices: [
      "Record sponsors, funding and accountable owners clearly for each message",
      "Keep approval records only for the largest ad buys",
      "Rely on the ad platform to maintain accountability information",
    ],
    best: 0,
    assurance: "Accountability records",
    feedback:
      "Accountability requires clear records: sponsors, funding and the people responsible for approving messages should be documented and retrievable.",
  },
  {
    id: "slow-response",
    scenario:
      "A misleading AI-altered clip spreads rapidly, but there is no process to pause distribution, issue a correction or preserve records for review.",
    choices: [
      "Activate a rapid process to correct, pause or remove harmful or misleading content and keep records",
      "Monitor the spread and decide later whether a response is necessary",
      "Delete the original post quietly without documenting what happened",
    ],
    best: 0,
    assurance: "Rapid response",
    feedback:
      "When misleading AI content spreads quickly, response must be fast and documented: pause or correct it, communicate clearly and preserve records for review.",
  },
];

export function electionsIntegrityScore(answers: Record<string, number>) {
  const done = ELECTIONS_INTEGRITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ELECTIONS_INTEGRITY_ROUNDS.length,
  };
}
