export type IncidentEvidenceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INCIDENT_EVIDENCE_ROUNDS: IncidentEvidenceRound[] = [
  {
    id: "rotated-logs",
    scenario:
      "Three weeks after a harmful-output incident, the team tries to reproduce it and finds the prompt, retrieved documents and model version are gone: logs rotated after seven days.",
    choices: [
      "Capture the prompt, retrieved context, model version and outputs at the time, and apply a hold before rotation",
      "Reconstruct the incident from user screenshots and support tickets",
      "Extend log retention to ninety days and hope the next incident is caught sooner",
    ],
    best: 0,
    assurance: "Capture at the time",
    feedback:
      "An incident you cannot reproduce cannot be fixed: capture the prompt, context, model version and output at the time, and hold them before rotation.",
  },
  {
    id: "model-moved-on",
    scenario:
      "The provider silently updates the model between the incident and the review, so the same prompt no longer produces the same output.",
    choices: [
      "Record the exact model version and snapshot the outputs, and note where a replay is no longer exact",
      "Re-run the prompt on the current model and treat the new output as the incident record",
      "Ask the provider to restore the old version before the review",
    ],
    best: 0,
    assurance: "Version-pinned evidence",
    feedback:
      "Providers move on: pin the model version, snapshot the outputs at the time, and state where a replay is no longer exact.",
  },
  {
    id: "evidence-tampering",
    scenario:
      "Screenshots and log extracts are pasted into a shared drive, where anyone can edit them and nobody can say who changed what.",
    choices: [
      "Record handling and access for the evidence, keep originals unaltered, and store copies with an audit trail",
      "Ask the team to confirm they did not edit anything",
      "Move everything into the incident ticket so it is at least in one place",
    ],
    best: 0,
    assurance: "Chain of custody",
    feedback:
      "Editable evidence is not evidence: keep originals unaltered, record handling and access, and store copies with an audit trail.",
  },
  {
    id: "no-replay",
    scenario:
      "The review concludes with 'we think retrieval returned an outdated policy document', but nothing allows anyone to confirm it.",
    choices: [
      "Keep a replayable trail of inputs, retrieved items and decisions so root cause is demonstrated rather than guessed",
      "Accept the most plausible explanation because the incident is closed",
      "Interview the team again and record their recollection as the finding",
    ],
    best: 0,
    assurance: "Demonstrated root cause",
    feedback:
      "A plausible story is not a root cause: keep a replayable trail of inputs, retrieved items and decisions so the finding is demonstrated.",
  },
];

export function incidentEvidenceScore(answers: Record<string, number>) {
  const done = INCIDENT_EVIDENCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INCIDENT_EVIDENCE_ROUNDS.length,
  };
}
