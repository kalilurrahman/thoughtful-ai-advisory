export type WorkerMonitoringRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const WORKER_MONITORING_ROUNDS: WorkerMonitoringRound[] = [
  {
    id: "tool-without-purpose",
    scenario:
      "A productivity tool scores every employee daily, and nobody can say which business need the scoring serves or why the data is necessary.",
    choices: [
      "Define the purpose, record why the monitoring is necessary and proportionate, and drop what cannot be justified",
      "Keep the scoring because it is already built and managers find it useful",
      "Add a privacy notice paragraph and continue as before",
    ],
    best: 0,
    assurance: "Necessity and proportionality",
    feedback:
      "Monitoring that cannot state its purpose cannot be proportionate: define the need, record the test and remove what fails it.",
  },
  {
    id: "covert-capture",
    scenario:
      "Screen capture and keystroke logging run continuously, and staff learn about it from a colleague rather than from the organisation.",
    choices: [
      "Tell workers and their representatives what is captured, why and for how long, and remove capture that is not needed",
      "Keep it quiet because telling people would change the behaviour being measured",
      "Mention it in the IT acceptable-use policy and consider the matter closed",
    ],
    best: 0,
    assurance: "Transparent monitoring",
    feedback:
      "Monitoring people who do not know about it is a trust and legal problem: disclose what is captured, why and for how long.",
  },
  {
    id: "score-becomes-discipline",
    scenario:
      "An attrition-risk score is used in a performance meeting, and the employee is never told a model contributed to the decision.",
    choices: [
      "Have a human review any decision on work, pay or standing, record their reasoning, and tell the person a model was used",
      "Let the manager use the score as a prompt but not mention it in the meeting",
      "Remove the score from the meeting and keep using it to rank people for redundancy",
    ],
    best: 0,
    assurance: "Human review of decisions",
    feedback:
      "A score that reaches a decision affecting someone's job needs a human who can overrule it, a recorded reason, and disclosure.",
  },
  {
    id: "no-appeal",
    scenario:
      "An employee disputes an automated assessment, and there is no route to see the data behind it or to have it reconsidered.",
    choices: [
      "Give the worker access to the data, a way to challenge the assessment, and an appeal with a recorded outcome",
      "Let the worker raise it with their line manager in the next one-to-one",
      "Offer to delete the score and re-score them next quarter",
    ],
    best: 0,
    assurance: "Worker recourse",
    feedback:
      "A decision someone cannot see or challenge is not reviewable: provide access, a challenge route and a recorded appeal outcome.",
  },
  {
    id: "forever-retention",
    scenario:
      "Monitoring data from three years ago is still retained, and nobody can say what it is for or when it will be deleted.",
    choices: [
      "Set a retention period tied to the purpose, delete on schedule, and record that deletion happened",
      "Keep everything in case it is needed for a future investigation",
      "Move old data to cheaper storage and stop reporting on it",
    ],
    best: 0,
    assurance: "Bounded retention",
    feedback:
      "Keeping everything is a decision to carry the risk indefinitely: set a period tied to the purpose, delete on schedule and record it.",
  },
];

export function workerMonitoringScore(answers: Record<string, number>) {
  const done = WORKER_MONITORING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === WORKER_MONITORING_ROUNDS.length,
  };
}
