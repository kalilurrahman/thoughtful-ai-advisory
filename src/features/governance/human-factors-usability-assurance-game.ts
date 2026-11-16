export type HumanFactorsUsabilityAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const HUMAN_FACTORS_USABILITY_ASSURANCE_ROUNDS: HumanFactorsUsabilityAssuranceRound[] = [
  {
    id: "no-user-testing",
    scenario:
      "An AI support tool launches with no testing by the people who will actually use it under time pressure, and early feedback is only anecdotal.",
    choices: [
      "Test with representative users in realistic workflows, record observed issues, and iterate the design and guidance before wider rollout",
      "Rely on a small internal pilot and assume representative users will adapt",
      "Launch and fix problems only when users complain",
    ],
    best: 0,
    assurance: "Representative user testing",
    feedback:
      "Usability is proven by observed use: test with representative users in real workflows, record issues, and improve the design, guidance, and handoff points.",
  },
  {
    id: "error-recovery",
    scenario:
      "When the AI produces a wrong or unusable output, users cannot tell what went wrong, how to correct it, or how to safely undo a consequential action.",
    choices: [
      "Support clear error and correction paths, explanations users can act on, and undo/override where outcomes are consequential",
      "Let users work around failures on their own",
      "Hide uncertainty so users trust the tool more",
    ],
    best: 0,
    assurance: "Error handling and correction paths",
    feedback:
      "Assurance includes recovery: users need to notice failures, understand them enough to act, and correct or undo consequential actions without blame or silent harm.",
  },
  {
    id: "overload",
    scenario:
      "A monitoring console surfaces many AI alerts at once, with no prioritisation or explanation, so operators miss important signals and override everything.",
    choices: [
      "Prioritise and explain alerts, group related signals, and provide workload controls and escalation paths",
      "Show every alert with equal urgency",
      "Require operators to check every alert manually",
    ],
    best: 0,
    assurance: "Workload and comprehension safeguards",
    feedback:
      "Human oversight fails under overload: prioritise and explain signals, manage cognitive load, and give operators escalation paths so attention goes where it matters.",
  },
  {
    id: "stale-usability",
    scenario:
      "The tool has changed substantially, but usability reviews were never repeated, and no one can evidence that operators still understand the new behaviour.",
    choices: [
      "Repeat usability and workload reviews on a cadence and after material changes, with findings and fixes recorded",
      "Assume the original usability assessment remains valid",
      "Review usability only after a serious incident",
    ],
    best: 0,
    assurance: "Usability review cadence and evidence",
    feedback:
      "Usability decays with change: schedule reviews after material updates, test with operators, and keep evidence that workload, comprehension, and error handling remain fit.",
  },
];

export function humanFactorsUsabilityAssuranceScore(answers: Record<string, number>) {
  const done = HUMAN_FACTORS_USABILITY_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === HUMAN_FACTORS_USABILITY_ASSURANCE_ROUNDS.length,
  };
}
