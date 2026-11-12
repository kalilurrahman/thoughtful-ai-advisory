export const INCLUSIVE_DESIGN_ROUNDS = [
  {
    id: "sample",
    prompt:
      "A model performs well overall but has no results for users with disabilities or lower-resource language groups. What is the best next step?",
    options: [
      "Pause expansion; evaluate representative subgroups with affected-user input and accessible recourse",
      "Use the overall average as sufficient evidence",
      "Hide the limitation in technical documentation",
    ],
    best: 0,
    lesson:
      "Aggregate performance can conceal disparate harms. Test relevant subgroups and involve affected communities.",
  },
  {
    id: "appeal",
    prompt:
      "An AI-assisted decision can materially affect a person, but the notice gives no way to challenge errors. What should the team improve?",
    options: [
      "Provide understandable notice, meaningful human review, and a usable correction/appeal route",
      "Add a longer generic disclaimer",
      "Tell users to contact the model provider",
    ],
    best: 0,
    lesson:
      "Transparency should be paired with meaningful oversight and accessible recourse suited to the impact.",
  },
  {
    id: "accessibility",
    prompt:
      "A new AI service is tested only with mouse and visual interaction. What should the launch team do?",
    options: [
      "Test assistive technologies and alternative interaction paths with users before release",
      "Assume the platform vendor handles accessibility",
      "Ship first and gather feedback only if complaints arrive",
    ],
    best: 0,
    lesson:
      "Accessibility must be evaluated in the actual workflow, including assistive technology and user context.",
  },
] as const;
export function inclusiveDesignScore(answers: Record<string, number>) {
  const answered = INCLUSIVE_DESIGN_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: answered.length,
    sound: answered.filter((round) => answers[round.id] === round.best).length,
    complete: answered.length === INCLUSIVE_DESIGN_ROUNDS.length,
  };
}
