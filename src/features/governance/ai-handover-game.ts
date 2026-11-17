export type AiHandoverRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AI_HANDOVER_ROUNDS: AiHandoverRound[] = [
  {
    id: "single-owner",
    scenario:
      "A model that decides credit limits has one owner, who is the only person who understands the prompts and the evaluation suite.",
    choices: [
      "Name a second owner and give them the access, context and time to understand it",
      "Record the owner's name in the risk register so accountability is clear",
      "Ask the owner to write a short summary before their next holiday",
    ],
    best: 0,
    assurance: "Named owner and a second",
    feedback:
      "One owner is a single point of failure, not accountability: name a second and give them real access and context.",
  },
  {
    id: "undocumented-why",
    scenario:
      "The team can see what the model does, but nobody knows why the current prompt and thresholds were chosen.",
    choices: [
      "Document the design rationale, rejected options, known limits and open risks alongside the model",
      "Document the current configuration and treat the history as lost",
      "Ask the vendor to explain the model's behaviour in their own documentation",
    ],
    best: 0,
    assurance: "Design rationale documented",
    feedback:
      "Configuration without rationale invites a rewrite that reintroduces a known failure: record why it is built this way and what it cannot do.",
  },
  {
    id: "inbox-access",
    scenario:
      "Vendor notices, admin credentials and the runbook for re-indexing live in one engineer's mailbox and notes app.",
    choices: [
      "Move credentials, runbooks and vendor contacts into team-held, access-controlled locations",
      "Share the mailbox password with the deputy so both can see notices",
      "Export the notes to a personal drive as a backup",
    ],
    best: 0,
    assurance: "Team-held access and runbooks",
    feedback:
      "Shared passwords and personal drives are not handover: put access, runbooks and vendor contacts somewhere the team controls.",
  },
  {
    id: "unrehearsed",
    scenario:
      "A handover plan exists on paper, and the deputy has never actually run an evaluation or answered a vendor notice.",
    choices: [
      "Rehearse the handover with the deputy, record what broke and fix it before it is needed",
      "Review the handover plan in the next governance meeting",
      "Wait for the owner's notice period to run the handover properly",
    ],
    best: 0,
    assurance: "Handover rehearsed",
    feedback:
      "An untested handover plan is a hope: rehearse it, record the gaps and fix them while the owner is still there.",
  },
  {
    id: "departure-gap",
    scenario:
      "An AI lead resigns, their access is removed on the last day, and the model's evaluation suite stops running the following week.",
    choices: [
      "Run a departure checklist that confirms named handover of each AI asset before access is removed",
      "Rely on the exit interview to surface anything outstanding",
      "Reassign the asset to whoever is available in the team after they leave",
    ],
    best: 0,
    assurance: "Departure checklist",
    feedback:
      "Access removal is not handover: check each asset off with a named new owner before the leaver's accounts close.",
  },
];

export function aiHandoverScore(answers: Record<string, number>) {
  const done = AI_HANDOVER_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AI_HANDOVER_ROUNDS.length,
  };
}
