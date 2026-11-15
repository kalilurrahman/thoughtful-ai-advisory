export type TestingValidationAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TESTING_VALIDATION_ASSURANCE_ROUNDS: TestingValidationAssuranceRound[] = [
  {
    id: "evaluation-design",
    scenario:
      "Before deployment, the team has no clear evaluation plan or acceptance criteria for how the AI system and its guardrails should perform in intended use.",
    choices: [
      "Define evaluation objectives and acceptance criteria aligned to intended use, risks, and guardrails before release",
      "Rely on informal spot checks without defined criteria",
      "Assume vendor claims are sufficient without internal evaluation",
    ],
    best: 0,
    assurance: "Evaluation design and acceptance criteria",
    feedback:
      "Testing assurance starts with clear, risk-aligned evaluation objectives and acceptance criteria so performance and guardrails can be judged consistently.",
  },
  {
    id: "representative-tests",
    scenario:
      "Testing covers only a few ideal examples and misses realistic scenarios, edge cases, and conditions where guardrails or quality may fail.",
    choices: [
      "Use representative test cases including realistic scenarios, edge cases, and misuse/failure conditions relevant to the context",
      "Test only happy-path inputs that are easy to pass",
      "Expand testing only after users report problems in production",
    ],
    best: 0,
    assurance: "Representative and edge-case testing",
    feedback:
      "Assurance requires testing that reflects real use, edge cases, and potential failure modes so weaknesses are found before they cause harm.",
  },
  {
    id: "guardrail-validation",
    scenario:
      "Guardrails and controls are configured, but the team has not validated that they work effectively in realistic workflows and interactions.",
    choices: [
      "Validate guardrails and controls in realistic scenarios, verify expected behavior, and remediate gaps before relying on them",
      "Assume guardrails work because they are enabled",
      "Validate controls only on paper without exercising them",
    ],
    best: 0,
    assurance: "Guardrail and control validation",
    feedback:
      "Controls provide assurance only when exercised in realistic conditions; validation should confirm behavior and drive remediation of gaps.",
  },
  {
    id: "regression-evidence",
    scenario:
      "After changes to models, prompts, data, or configuration, there is no regression testing or evidence that prior risks and guardrails remain addressed.",
    choices: [
      "Run regression and post-change evaluations, compare results to criteria, and document evidence before and after release",
      "Skip regression checks if the change seems small",
      "Rely on production monitoring alone to catch regressions",
    ],
    best: 0,
    assurance: "Regression testing and evidence",
    feedback:
      "Change assurance includes regression evaluation and documented evidence that acceptance criteria and guardrails still hold after updates.",
  },
];

export function testingValidationAssuranceScore(answers: Record<string, number>) {
  const done = TESTING_VALIDATION_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TESTING_VALIDATION_ASSURANCE_ROUNDS.length,
  };
}
