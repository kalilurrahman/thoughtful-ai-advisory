export type JournalismIntegrityRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const JOURNALISM_INTEGRITY_ROUNDS: JournalismIntegrityRound[] = [
  {
    id: "fabricated-quote",
    scenario:
      "A reporter uses an AI assistant to draft a story and files it with a quote the assistant invented, presented as something a named source said.",
    choices: [
      "Verify every AI-assisted claim and quote against primary sources before publication",
      "Ask an editor to read the story for tone and leave the quote as drafted",
      "Publish and add a note crediting the AI assistant in the byline",
    ],
    best: 0,
    assurance: "Source verification",
    feedback:
      "Plausible text is not a source: AI-assisted drafts and quotes must be checked against primary sources before anything reaches the audience.",
  },
  {
    id: "no-signoff",
    scenario:
      "An AI tool rewrites headlines and summaries automatically and pushes them live, with no named editor reviewing what it produced.",
    choices: [
      "Require a named editor to review and sign off AI-influenced output before it publishes",
      "Let the tool publish and review anything that looks wrong after publication",
      "Rely on the tool's own confidence score instead of human review",
    ],
    best: 0,
    assurance: "Editorial accountability",
    feedback:
      "Accountability needs a person's name against the story: a named editor should review and sign off AI-influenced output before it publishes.",
  },
  {
    id: "unlabelled-image",
    scenario:
      "A realistic AI-generated photo illustrates a breaking story, but nothing on the page tells readers the image is synthetic.",
    choices: [
      "Label synthetic or AI-generated media and check its provenance before use",
      "Use the image because it is only illustrative and the caption implies as much",
      "Remove the caption so readers focus on the reporting",
    ],
    best: 0,
    assurance: "Synthetic media labelling",
    feedback:
      "Synthetic media needs to be labelled and traced: readers should know an image was generated and where it came from.",
  },
  {
    id: "silent-correction",
    scenario:
      "A story built on an AI summary turns out to be wrong, but the fix is a quiet edit to the online article with no correction note and no update to syndicated versions.",
    choices: [
      "Publish a clear correction or retraction with a trail that reaches every version of the story",
      "Edit the original article silently so readers are not confused",
      "Delete the story and rely on the archive to explain what happened",
    ],
    best: 0,
    assurance: "Corrections & retractions",
    feedback:
      "Silent edits hide the error: publish corrections and retractions with a clear trail and make sure syndicated and cached versions are updated too.",
  },
  {
    id: "hidden-ai-role",
    scenario:
      "An AI system selects which local stories get covered and how they are framed, but audiences are never told AI played that role.",
    choices: [
      "Tell audiences when AI played a material role in what they are reading",
      "Disclose the AI use only in an internal editorial policy document",
      "Mention AI tools generally in the site footer without specifics",
    ],
    best: 0,
    assurance: "Audience disclosure",
    feedback:
      "Material AI involvement should be visible to readers, not buried in policy: disclose it where the audience can see it.",
  },
];

export function journalismIntegrityScore(answers: Record<string, number>) {
  const done = JOURNALISM_INTEGRITY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === JOURNALISM_INTEGRITY_ROUNDS.length,
  };
}
