export type AgentMemoryRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AGENT_MEMORY_ROUNDS: AgentMemoryRound[] = [
  {
    id: "unregistered-memory",
    scenario:
      "An agent started saving facts about users to improve continuity, and nobody can list what it stores, where it lives or which team owns it.",
    choices: [
      "Keep a register of what the agent stores, where, why and who owns it, and review it as memory types are added",
      "Leave it to the agent's framework defaults because they are documented upstream",
      "Disable memory entirely and lose continuity for every user",
    ],
    best: 0,
    assurance: "Registered memory",
    feedback:
      "Memory written at runtime is still data you govern: keep a register of what is stored, where, why and who owns it, and review it as memory types are added.",
  },
  {
    id: "delete-that-keeps",
    scenario:
      "A user asks for their data to be deleted; the profile is removed, but the agent's remembered preferences and summaries remain in a vector store.",
    choices: [
      "Trace deletion across every memory store, remove the derived summaries and embeddings, and verify the removal",
      "Delete the profile and consider the request complete",
      "Let the memory expire on its normal retention schedule instead",
    ],
    best: 0,
    assurance: "Deletion that reaches memory",
    feedback:
      "Derived memories are copies: trace deletion across every store, remove summaries and embeddings, and verify rather than assume.",
  },
  {
    id: "crossed-memories",
    scenario:
      "A shared assistant recalls a detail one customer told it last week and repeats it to a different customer in the same tenant.",
    choices: [
      "Treat it as a memory isolation incident: scope memories per user and tenant, test recall boundaries, and record the exposure",
      "Add a prompt instruction telling the agent not to mention other customers",
      "Clear all memories for the tenant to make the problem disappear",
    ],
    best: 0,
    assurance: "Memory isolation",
    feedback:
      "Recall across users is a data exposure, not a tone problem: scope memories per user and tenant, test recall boundaries, and record the exposure.",
  },
  {
    id: "poisoned-memory",
    scenario:
      "A user gets the agent to store an instruction as a 'preference', and later sessions follow it even though it conflicts with policy.",
    choices: [
      "Separate user preferences from instructions, validate what can be written to memory, and test memory poisoning before release",
      "Trust the agent to judge which stored preferences are safe to follow",
      "Stop letting users influence what the agent remembers at all",
    ],
    best: 0,
    assurance: "Memory write validation",
    feedback:
      "Stored text can become an instruction: separate preferences from instructions, validate memory writes, and test poisoning before release.",
  },
];

export function agentMemoryScore(answers: Record<string, number>) {
  const done = AGENT_MEMORY_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AGENT_MEMORY_ROUNDS.length,
  };
}
