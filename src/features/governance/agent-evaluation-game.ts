export type AgentEvaluationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AGENT_EVALUATION_ROUNDS: AgentEvaluationRound[] = [
  {
    id: "lucky-answer",
    scenario:
      "An agent completes a task with the correct final answer, but only after calling an unapproved tool and retrying four times.",
    choices: [
      "Review the tool-use trace, not just the final answer, and treat the run as a failure to fix",
      "Record it as a pass because the outcome the user saw was correct",
      "Add the tool it called to the approved list so the run counts as compliant",
    ],
    best: 0,
    assurance: "Trace-based evaluation",
    feedback:
      "A right answer through wrong steps is a lucky run: review the trace and fix the path, not the score.",
  },
  {
    id: "accepted-output",
    scenario:
      "The only success measure is whether the user accepted the output, so an agent that produces plausible but unchecked work scores well.",
    choices: [
      "Define success criteria per task type, including what must be true before the output is usable",
      "Keep the acceptance rate and add a satisfaction score alongside it",
      "Ask reviewers to mark each output good or bad without written criteria",
    ],
    best: 0,
    assurance: "Defined success criteria",
    feedback:
      "Acceptance measures persuasion, not correctness: define what must be true per task type before output is usable.",
  },
  {
    id: "same-failure",
    scenario:
      "The same failure keeps appearing in production: the agent stops before confirming a booking, and each occurrence is logged as a separate ticket.",
    choices: [
      "Route each miss through a failure taxonomy so repeats are counted as one defect with an owner",
      "Close the tickets as they occur and watch the overall error rate",
      "Add a prompt reminder to double-check bookings before finishing",
    ],
    best: 0,
    assurance: "Failure taxonomy",
    feedback:
      "Uncategorised failures look like noise: a taxonomy turns repeats into one defect with an owner and a fix.",
  },
  {
    id: "no-sandbox",
    scenario:
      "The agent is evaluated only in a sandbox that has stub tools, so nobody knows how it behaves with real tool latency and errors.",
    choices: [
      "Evaluate in a sandbox with representative tasks and tool behaviour, including errors and timeouts",
      "Move evaluation to production and watch for incidents",
      "Keep the stub sandbox and add a note that production may differ",
    ],
    best: 0,
    assurance: "Representative environment",
    feedback:
      "Stubbed tools hide the hard part: evaluate with representative tasks, latency and failure behaviour.",
  },
  {
    id: "changed-tool",
    scenario:
      "A tool schema changed its required fields, and the agent started failing on tasks that passed evaluation last month.",
    choices: [
      "Re-run regression whenever tools, prompts or models change, and treat schema changes as evaluation triggers",
      "Rely on monitoring to catch failures after release",
      "Pin the tool schema and never change it again",
    ],
    best: 0,
    assurance: "Change-triggered regression",
    feedback:
      "An agent is its tools: re-run regression when a schema, prompt or model changes, not after users report it.",
  },
];

export function agentEvaluationScore(answers: Record<string, number>) {
  const done = AGENT_EVALUATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AGENT_EVALUATION_ROUNDS.length,
  };
}
