export type DataSubjectRequestRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_SUBJECT_REQUEST_ROUNDS: DataSubjectRequestRound[] = [
  {
    id: "identity-and-clock",
    scenario:
      "A requester asks what an AI assistant knows about them, and the team starts searching immediately without confirming who they are or when the statutory clock started.",
    choices: [
      "Verify identity first, log the request date, and track the statutory deadline from the day it was received",
      "Start the search now and confirm identity when the results are ready to send",
      "Reply asking them to resubmit through a form so the clock restarts",
    ],
    best: 0,
    assurance: "Verified requester, tracked deadline",
    feedback:
      "Identity and the clock decide the whole response: verify the requester, record receipt, and track the deadline from the day it arrived.",
  },
  {
    id: "primary-database-only",
    scenario:
      "The search covers the customer database, but the same person's text also sits in prompt logs, an agent's saved memory and a model-generated summary used by support.",
    choices: [
      "Search prompts, logs, agent memory and derived summaries as well, and record which stores were checked",
      "Search the customer database only, because that is the system of record",
      "Search whatever is quickest to query and describe the answer as complete",
    ],
    best: 0,
    assurance: "Complete discovery",
    feedback:
      "An AI system writes in more places than the system of record: search prompts, logs, memory and derived summaries, and record what was checked.",
  },
  {
    id: "third-party-bleed",
    scenario:
      "The extracted records include another customer's details and a colleague's performance notes that happened to be in the retrieved context.",
    choices: [
      "Redact third-party data before disclosure and note the redactions on the response",
      "Send the records unredacted because they are a faithful extract",
      "Send everything but ask the requester to keep it confidential",
    ],
    best: 0,
    assurance: "Disclosure without collateral exposure",
    feedback:
      "Answering one request must not become a breach of another person's data: redact third-party data before disclosure and record the redactions.",
  },
  {
    id: "correction-not-erasure",
    scenario:
      "The requester asks for a wrong preference to be corrected, and the team deletes the record instead because deletion is easier to run.",
    choices: [
      "Correct the record where it is held, propagate the correction to derived summaries and memory, and keep the evidence",
      "Delete the record and tell the requester it has been resolved",
      "Correct the primary record only and leave derived copies unchanged",
    ],
    best: 0,
    assurance: "Correction propagated",
    feedback:
      "Correction is not erasure: fix the source, propagate to derived copies and memory, and keep the record of what changed.",
  },
  {
    id: "no-record",
    scenario:
      "A regulator later asks how a request was handled, and nobody can show what was searched, what was redacted or who approved the response.",
    choices: [
      "Record the search scope, redactions, approver and outcome as evidence for each request",
      "Reconstruct the handling from the requester's follow-up emails",
      "Report that the request was completed within the deadline",
    ],
    best: 0,
    assurance: "Evidence of handling",
    feedback:
      "A completed request with no record is an assertion: log the search scope, redactions, approver and outcome as evidence.",
  },
];

export function dataSubjectRequestScore(answers: Record<string, number>) {
  const done = DATA_SUBJECT_REQUEST_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_SUBJECT_REQUEST_ROUNDS.length,
  };
}
