export type RagGroundingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const RAG_GROUNDING_ROUNDS: RagGroundingRound[] = [
  {
    id: "orphan-documents",
    scenario:
      "An assistant confidently quotes a policy that was replaced eight months ago, because nobody owns the document it retrieved.",
    choices: [
      "Give every retrieved source a named owner and a refresh date, and treat an unowned document as unfit for grounding",
      "Add a warning to the answer that policies may have changed",
      "Re-index the whole corpus more often so newer documents rank higher",
    ],
    best: 0,
    assurance: "Owned, dated sources",
    feedback:
      "Grounding is only as current as its sources: give every document an owner and a refresh date, and treat unowned documents as unfit.",
  },
  {
    id: "uncited-answer",
    scenario:
      "A support answer is plausible and specific, but a reviewer cannot tell which passage it came from or whether it came from a document at all.",
    choices: [
      "Require answers to cite the passages they rely on so a reader can check the claim",
      "Trust the answer because it matches the tone of the source material",
      "Ask the model to state its confidence alongside the answer",
    ],
    best: 0,
    assurance: "Verifiable citations",
    feedback:
      "An answer nobody can trace is a guess with good formatting: cite the passages relied on so a reader can check the claim.",
  },
  {
    id: "similarity-wins",
    scenario:
      "Two documents disagree about a limit, and the assistant picks whichever has the higher similarity score.",
    choices: [
      "Resolve conflicts and stale sources by a stated rule — precedence, version or explicit supersession — not by similarity",
      "Average the two values so the answer sits between them",
      "Return both answers and let the user decide which is right",
    ],
    best: 0,
    assurance: "Rule-based precedence",
    feedback:
      "Similarity is not authority: resolve conflicts with a stated precedence or supersession rule so the answer is defensible.",
  },
  {
    id: "always-answers",
    scenario:
      "A question falls outside the indexed corpus, and the assistant answers anyway from general knowledge.",
    choices: [
      "Make 'I do not know, and here is where to look' an acceptable outcome, with the refusal measured and reviewed",
      "Let it answer from general knowledge but label the answer as unverified",
      "Expand the corpus with general reference material so it can always answer",
    ],
    best: 0,
    assurance: "Honest abstention",
    feedback:
      "A system that always answers cannot be grounded: make abstention an acceptable, measured outcome.",
  },
  {
    id: "content-drift",
    scenario:
      "A shared drive that feeds retrieval is editable by many people, and one afternoon an instruction-like sentence appears inside a document.",
    choices: [
      "Monitor retrieved content for drift and poisoning, and treat unexpected instruction-like text as an incident",
      "Re-index nightly so changes are picked up quickly",
      "Restrict the assistant to documents older than a week so edits settle",
    ],
    best: 0,
    assurance: "Monitored corpus",
    feedback:
      "Retrieval is an input channel: monitor the corpus for drift and poisoning, and treat instruction-like text in documents as an incident.",
  },
];

export function ragGroundingScore(answers: Record<string, number>) {
  const done = RAG_GROUNDING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === RAG_GROUNDING_ROUNDS.length,
  };
}
