export type AnnotationWorkforceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ANNOTATION_WORKFORCE_ROUNDS: AnnotationWorkforceRound[] = [
  {
    id: "vague-guidelines",
    scenario:
      "Annotators are asked to label \u201ctoxic\u201d content with no written definition, and quality is judged against a reviewer's opinion.",
    choices: [
      "Publish guidelines with worked examples, edge cases and a quality bar before tasks go out",
      "Let the most experienced annotator decide and correct the others afterwards",
      "Accept disagreement because toxicity is subjective",
    ],
    best: 0,
    assurance: "Documented guidelines",
    feedback:
      "A label nobody defined cannot be measured: publish guidelines with worked examples, edge cases and a quality bar before work starts.",
  },
  {
    id: "unpaid-rework",
    scenario:
      "Annotators are paid per accepted task, so rework after a guideline change and time waiting for new batches are unpaid.",
    choices: [
      "Pay for actual effort, including rework, waiting and guideline change time",
      "Keep per-task pay but accept a lower throughput target",
      "Add a small bonus for the fastest annotators each week",
    ],
    best: 0,
    assurance: "Fair pay for real effort",
    feedback:
      "Paying only for accepted tasks pushes rework and waiting onto the worker: pay for actual effort and cost guideline changes properly.",
  },
  {
    id: "harmful-content",
    scenario:
      "A labelling queue contains violent and abusive content, and annotators are told to opt out only if it becomes \u201ctoo much\u201d.",
    choices: [
      "Warn before exposure, limit volume, rotate tasks, offer counselling and a penalty-free opt-out",
      "Issue a one-off wellbeing notice and continue the queue",
      "Move the queue to a supplier so your staff are not exposed",
    ],
    best: 0,
    assurance: "Harmful content controls",
    feedback:
      "\u201cOpt out if it becomes too much\u201d is not a control: warn, limit exposure, rotate, provide support and make opting out penalty-free.",
  },
  {
    id: "no-feedback-loop",
    scenario:
      "Annotators repeatedly flag that the guidelines do not fit real edge cases, and the model owner never hears about it.",
    choices: [
      "Sample quality, review disagreements and route systematic feedback to the model owner",
      "Tell annotators to follow the guideline exactly and log concerns locally",
      "Increase the number of tasks reviewed so errors are caught later",
    ],
    best: 0,
    assurance: "Feedback reaches model owners",
    feedback:
      "Annotators see the failure modes first: sample quality, review disagreements and route systematic feedback to the model owner.",
  },
  {
    id: "supplier-terms",
    scenario:
      "Labelling is outsourced, the contract is silent on pay and wellbeing, and nobody checks how the supplier actually works.",
    choices: [
      "Put pay, wellbeing, quality and escalation terms in the contract and verify them by sampling the work",
      "Trust the supplier's certification because it is a specialist vendor",
      "Send the supplier your guidelines and ask them to confirm compliance annually",
    ],
    best: 0,
    assurance: "Supplier terms verified",
    feedback:
      "Outsourcing moves the queue, not the responsibility: contract the terms and verify them by sampling real work.",
  },
];

export function annotationWorkforceScore(answers: Record<string, number>) {
  const done = ANNOTATION_WORKFORCE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ANNOTATION_WORKFORCE_ROUNDS.length,
  };
}
