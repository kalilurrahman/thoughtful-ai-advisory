export const CHANGE_IMPACT_ROUNDS = [
  {
    id: "prompt",
    change: "A prompt update expands an assistant from drafting to making recommendations.",
    expected: ["Purpose or intended use", "Controls or operating procedure"],
    feedback: "Reassess intended use, affected people, oversight, and relevant impacts.",
  },
  {
    id: "data",
    change: "A new external dataset is added to a production AI system.",
    expected: ["Data source or processing"],
    feedback: "Review provenance, permissions, privacy, quality, representativeness, and security.",
  },
  {
    id: "provider",
    change: "The underlying model provider changes, but the interface stays identical.",
    expected: ["Model or AI provider", "Integration or deployment context"],
    feedback:
      "Revalidate performance, limitations, data handling, and whether existing approvals still apply.",
  },
] as const;
export function scoreChangeImpact(id: string, selected: string[]) {
  const round = CHANGE_IMPACT_ROUNDS.find((item) => item.id === id);
  if (!round) return { correct: false, feedback: "Unknown scenario." };
  return {
    correct:
      round.expected.length === selected.length &&
      round.expected.every((item) => selected.includes(item)),
    feedback: round.feedback,
  };
}
