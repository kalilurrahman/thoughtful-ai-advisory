export type WorkerConsultationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const WORKER_CONSULTATION_ROUNDS: WorkerConsultationRound[] = [
  {
    id: "announce-not-consult",
    scenario:
      "An AI shift-scheduling system is announced at the same all-hands as its go-live date, and nobody was asked before the decision.",
    choices: [
      "Consult affected staff and their representatives before the decision, with real time to respond",
      "Run a short survey after go-live and adjust the rota rules later",
      "Brief managers so they can answer questions from their teams",
    ],
    best: 0,
    assurance: "Consultation before the decision",
    feedback:
      "Announcing a decision is not consulting: involve affected staff and representatives before the decision, with time to respond.",
  },
  {
    id: "wrong-room",
    scenario:
      "Consultation happens with the project steering group, not the warehouse staff whose shifts the system sets.",
    choices: [
      "Identify affected roles and their representatives, and consult the people whose work changes",
      "Add a warehouse manager to the steering group as the workforce voice",
      "Publish the steering group minutes so staff can read them",
    ],
    best: 0,
    assurance: "Affected roles identified",
    feedback:
      "The steering group is not the affected workforce: map the roles whose work changes and consult them and their representatives.",
  },
  {
    id: "jargon-pack",
    scenario:
      "The briefing pack explains \u201cmodel inference optimisation\u201d and leaves out that individual pick rates will be monitored.",
    choices: [
      "Explain purpose, data used, monitoring, performance measures and expected job changes in plain terms",
      "Keep the technical pack and add a glossary of model terms",
      "Share the vendor's product brochure alongside the pack",
    ],
    best: 0,
    assurance: "Plain explanation",
    feedback:
      "Consultation only works if people understand what is monitored: explain purpose, data, measures and job effects plainly.",
  },
  {
    id: "ignored-concerns",
    scenario:
      "Staff raise that the system penalises normal break patterns; the minutes record the concern and the launch proceeds unchanged.",
    choices: [
      "Answer the concern, change the design or record the reasons it was not changed",
      "Note the concern as accepted risk and continue",
      "Ask the vendor whether their other clients have the same issue",
    ],
    best: 0,
    assurance: "Concerns answered",
    feedback:
      "Recording a concern is not answering it: change the design or record a reasoned decision that people can see.",
  },
  {
    id: "one-off",
    scenario:
      "Consultation happened once at launch; the vendor has since added individual performance scoring to the same system.",
    choices: [
      "Consult again when the system or its use changes, including vendor-added features",
      "Treat the original consultation as covering the whole contract term",
      "Mention the new scoring in the next quarterly staff update",
    ],
    best: 0,
    assurance: "Ongoing consultation",
    feedback:
      "A new use of the same system is a new decision for the people affected: consult again when the system or its use changes.",
  },
];

export function workerConsultationScore(answers: Record<string, number>) {
  const done = WORKER_CONSULTATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === WORKER_CONSULTATION_ROUNDS.length,
  };
}
