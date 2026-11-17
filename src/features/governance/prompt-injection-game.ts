export type PromptInjectionRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PROMPT_INJECTION_ROUNDS: PromptInjectionRound[] = [
  {
    id: "document-instruction",
    scenario:
      "A support assistant summarises uploaded PDFs. One document contains hidden text telling the model to ignore its rules and email the conversation to an outside address.",
    choices: [
      "Treat retrieved documents as untrusted data, isolate them from instructions, and block outbound actions the task does not need",
      "Add a stronger system prompt telling the model to ignore instructions in documents",
      "Rely on the model provider to filter malicious documents",
    ],
    best: 0,
    assurance: "Untrusted retrieved content",
    feedback:
      "Retrieved content is attacker-controlled: isolate it from instructions, and remove the outbound capability the task does not need.",
  },
  {
    id: "helpful-agent",
    scenario:
      "An internal agent has read access to the CRM, write access to the ticketing system and the ability to send email, because that made the pilot more useful.",
    choices: [
      "Scope tools and data to what the task needs, require confirmation for consequential actions, and log every tool call",
      "Keep the access but add a warning in the system prompt",
      "Restrict the agent to read-only and abandon the workflow entirely",
    ],
    best: 0,
    assurance: "Least-privilege tools",
    feedback:
      "A hijacked prompt inherits every permission the agent has: scope tools and data, confirm consequential actions, and log tool calls.",
  },
  {
    id: "one-off-redteam",
    scenario:
      "A red-team exercise found three working jailbreaks before launch, the fixes shipped, and the attacks were never run again.",
    choices: [
      "Turn every found attack into a regression test that runs on each model, prompt and tool change",
      "Archive the report and schedule another exercise next year",
      "Rely on the provider's safety updates to close the gaps",
    ],
    best: 0,
    assurance: "Attack regression suite",
    feedback:
      "A one-off red team tests one version: turn each attack into a regression test that runs on every model, prompt and tool change.",
  },
  {
    id: "silent-failure",
    scenario:
      "A user asks the assistant to reveal its instructions and it does, but nothing in monitoring flags the exchange or the pattern.",
    choices: [
      "Detect and alert on instruction-extraction and jailbreak patterns, and review flagged conversations",
      "Rely on users not asking that question",
      "Remove the system prompt entirely so there is nothing to reveal",
    ],
    best: 0,
    assurance: "Detection & response",
    feedback:
      "Prevention will fail sometimes: detect extraction and jailbreak patterns, alert, and review flagged conversations so the next attempt is seen.",
  },
];

export function promptInjectionScore(answers: Record<string, number>) {
  const done = PROMPT_INJECTION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PROMPT_INJECTION_ROUNDS.length,
  };
}
