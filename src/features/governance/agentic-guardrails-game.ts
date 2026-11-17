export type AgenticGuardrailsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AGENTIC_GUARDRAILS_ROUNDS: AgenticGuardrailsRound[] = [
  {
    id: "broad-credentials",
    scenario:
      "An agent is given a service account with full API access because it is quicker than scoping individual tools.",
    choices: [
      "Scope credentials to the specific tools and actions the agent needs, review the scope, and record the grant",
      "Keep full access but add a prompt instruction telling the agent to stay in scope",
      "Give it full access only in production, where time matters most",
    ],
    best: 0,
    assurance: "Least-privilege agent credentials",
    feedback:
      "Prompt instructions are not permissions: scope credentials to the tools and actions the agent needs, review the scope, and record the grant.",
  },
  {
    id: "irreversible-action",
    scenario:
      "An agent can issue refunds and delete records without confirmation, and it has already taken one irreversible action by mistake.",
    choices: [
      "Put human approval in front of irreversible and high-impact actions, and review what already happened",
      "Add a stronger instruction in the system prompt not to delete records",
      "Remove the refund tool and keep deletion automatic",
    ],
    best: 0,
    assurance: "Approval gates for irreversible actions",
    feedback:
      "Irreversible actions need a gate, not a suggestion: require human approval for high-impact steps and review what has already occurred.",
  },
  {
    id: "runaway-loop",
    scenario:
      "An agent enters a retry loop overnight and consumes a large amount of API spend before anyone notices.",
    choices: [
      "Enforce spend, rate and step limits with automatic stop, and alert the owner when a limit trips",
      "Review spend weekly and rely on the provider's billing alerts",
      "Reduce the agent's temperature so loops are less likely",
    ],
    best: 0,
    assurance: "Enforced agent limits",
    feedback:
      "Autonomy needs boundaries: enforce spend, rate and step limits with automatic stop, and alert the owner when a limit trips.",
  },
  {
    id: "opaque-actions",
    scenario:
      "An agent's actions cannot be reconstructed after an incident because only final messages were logged, not tool calls or inputs.",
    choices: [
      "Log tool calls, inputs, outputs and decisions so the run can be replayed, and keep the logs reviewable",
      "Log the final answer only, since that is what users see",
      "Rely on the vendor dashboard, which shows aggregate usage",
    ],
    best: 0,
    assurance: "Replayable agent action logs",
    feedback:
      "Agent incidents are investigated through their actions: log tool calls, inputs, outputs and decisions so a run can be replayed.",
  },
];

export function agenticGuardrailsScore(answers: Record<string, number>) {
  const done = AGENTIC_GUARDRAILS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AGENTIC_GUARDRAILS_ROUNDS.length,
  };
}
