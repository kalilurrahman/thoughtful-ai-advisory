export type SummarisationRecordsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SUMMARISATION_RECORDS_ROUNDS: SummarisationRecordsRound[] = [
  {
    id: "auto-record",
    scenario:
      "An AI summary of a customer call is written straight into the case file as the official record, with no review.",
    choices: [
      "Require a human to confirm the summary before it becomes the record of the interaction",
      "Let the agent fix the summary later if the customer complains",
      "Label the summary as AI-generated and keep it as the official record",
    ],
    best: 0,
    assurance: "Human confirmation",
    feedback:
      "A summary becomes evidence the moment it is filed: a person who was part of the interaction should confirm it before it becomes the record.",
  },
  {
    id: "everything-summarised",
    scenario:
      "The same summariser is pointed at legal advice, grievance interviews and clinical notes because the tool is already licensed.",
    choices: [
      "Define what may be summarised and what must never be summarised, and block the rest",
      "Summarise everything but restrict access to the output by role",
      "Summarise everything and delete the summary after the meeting",
    ],
    best: 0,
    assurance: "Defined scope",
    feedback:
      "Some material should never be summarised at all: define the permitted scope up front and block excluded content rather than relying on access controls afterwards.",
  },
  {
    id: "stale-correction",
    scenario:
      "A summary wrongly records that a customer refused an offer; the case note is corrected but the CRM, the letter and the dashboard still carry the old text.",
    choices: [
      "Carry the correction into every downstream record that copied the summary",
      "Correct the case note and note the change in an internal log",
      "Ask the customer to confirm the corrected version in writing",
    ],
    best: 0,
    assurance: "Correction propagation",
    feedback:
      "A correction that stops at one screen is not a correction: trace where the summary was copied and update each downstream record.",
  },
  {
    id: "silent-summarising",
    scenario:
      "Calls are summarised by AI and the recording is deleted, but customers are never told and have no way to object.",
    choices: [
      "Tell people AI summarises their conversation, explain what is kept, and offer a way to object",
      "Add a line to the website privacy notice and continue",
      "Keep the recording so the customer can ask for it later",
    ],
    best: 0,
    assurance: "Transparency & objection",
    feedback:
      "People should know when AI summarises their conversation and be able to object, especially when the raw recording is not retained.",
  },
  {
    id: "transcripts-forever",
    scenario:
      "Summaries follow the retention schedule, but full transcripts are kept indefinitely in case the vendor needs them for quality.",
    choices: [
      "Apply the same retention and access rules to summaries and minimise raw transcripts",
      "Keep transcripts but move them to cheaper cold storage",
      "Keep transcripts for a fixed five years regardless of the record type",
    ],
    best: 0,
    assurance: "Retention & minimisation",
    feedback:
      "Retention rules apply to the underlying material too: minimise raw transcripts rather than keeping them forever for vague quality reasons.",
  },
];

export function summarisationRecordsScore(answers: Record<string, number>) {
  const done = SUMMARISATION_RECORDS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SUMMARISATION_RECORDS_ROUNDS.length,
  };
}
