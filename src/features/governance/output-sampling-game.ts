export type OutputSamplingRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const OUTPUT_SAMPLING_ROUNDS: OutputSamplingRound[] = [
  {
    id: "fixed-low-rate",
    scenario:
      "A fixed 1% of live output is reviewed each month, whatever the volume or the risk of the use case.",
    choices: [
      "Set the sampling rate from risk and volume, and record why each system sits at its rate",
      "Keep 1% because it is consistent and easy to explain",
      "Sample only the highest-risk system and rely on monitoring for the rest",
    ],
    best: 0,
    assurance: "Risk-weighted rate",
    feedback:
      "A fixed rate is either too much for low-risk work or too little for high-risk work: weight it by risk and volume.",
  },
  {
    id: "self-review",
    scenario:
      "The team that operates the AI queue reviews its own sample and reports a 99% quality score.",
    choices: [
      "Have reviewers separate from the producing queue, and record who reviewed what",
      "Keep the self-review but add a second reviewer for failures only",
      "Ask the model provider to review the sample instead",
    ],
    best: 0,
    assurance: "Independent reviewers",
    feedback:
      "The queue reviewing itself finds what it expects: separate the reviewer from the producer and record who reviewed what.",
  },
  {
    id: "no-rubric",
    scenario:
      "Reviewers mark output as good or bad, and two reviewers disagree on a third of the sample.",
    choices: [
      "Score against a rubric with defined failure categories and calibrate reviewers against it",
      "Let each reviewer apply their own judgement and average the results",
      "Reduce the sample to cases everyone agrees on",
    ],
    best: 0,
    assurance: "Calibrated rubric",
    feedback:
      "Good or bad without categories measures the reviewer: define failure categories and calibrate against them.",
  },
  {
    id: "english-only",
    scenario:
      "The sample is drawn from English web traffic, while a third of live use happens in two other languages and in a mobile app.",
    choices: [
      "Stratify the sample across channels, languages and edge cases so coverage matches real use",
      "Keep the English sample and add a note about coverage limits",
      "Translate a set of English cases and review those instead",
    ],
    best: 0,
    assurance: "Coverage matches use",
    feedback:
      "A sample that misses a third of real use misses a third of the risk: stratify by channel, language and edge case.",
  },
  {
    id: "no-trend",
    scenario:
      "Findings are logged and fixed individually, and nobody can say whether quality is improving or drifting.",
    choices: [
      "Route findings to a fix and trend them by category so drift is visible before it is a crisis",
      "Report the monthly defect count to the governance meeting",
      "Close findings faster so the backlog stops growing",
    ],
    best: 0,
    assurance: "Trended findings",
    feedback:
      "Individual fixes hide drift: trend findings by category so a slow decline is visible while it is still fixable.",
  },
];

export function outputSamplingScore(answers: Record<string, number>) {
  const done = OUTPUT_SAMPLING_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === OUTPUT_SAMPLING_ROUNDS.length,
  };
}
