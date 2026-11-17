export type GuardrailConfigAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const GUARDRAIL_CONFIG_ASSURANCE_ROUNDS: GuardrailConfigAssuranceRound[] = [
  {
    id: "console-edit",
    scenario:
      "An engineer raises a block threshold directly in the production console during an incident, and the change is never captured in configuration history.",
    choices: [
      "Apply the change through the reviewed configuration path (or record it as an emergency change) so history, approval and rollback remain intact",
      "Leave it as a console edit because it fixed the incident quickly",
      "Revert immediately without recording what was changed or why",
    ],
    best: 0,
    assurance: "Configuration history and approval",
    feedback:
      "Guardrail behaviour should be reproducible: route changes through the reviewed configuration path or record an emergency change, so history, approval and rollback stay intact.",
  },
  {
    id: "env-drift",
    scenario:
      "The guardrail configuration in staging no longer matches production, and tests are being used to sign off production behaviour.",
    choices: [
      "Reconcile environments, treat the configuration as versioned code, and verify production parity before relying on test results",
      "Trust the tests because they passed in staging",
      "Copy production into staging and skip further comparison",
    ],
    best: 0,
    assurance: "Environment parity",
    feedback:
      "Test results only describe the configuration tested: reconcile environments, keep configuration versioned, and verify production parity before relying on staging evidence.",
  },
  {
    id: "happy-path-rule",
    scenario:
      "A new guardrail rule was tested only on typical traffic, and no one checked how it behaves on edge cases, multilingual input, or adversarial prompts.",
    choices: [
      "Test the rule against known edge, multilingual and adversarial cases, and record false-positive and false-negative behaviour before release",
      "Release it and watch dashboards for a week",
      "Disable the rule for non-English users to reduce risk",
    ],
    best: 0,
    assurance: "Pre-release rule testing",
    feedback:
      "Rules fail at the edges: test known edge, multilingual and adversarial cases and record false-positive and false-negative behaviour before the rule reaches production.",
  },
  {
    id: "no-rollback",
    scenario:
      "A guardrail change caused a spike in blocked legitimate requests, and the team discovers there is no tested way to restore the previous configuration.",
    choices: [
      "Restore the last known-good configuration from version control, confirm recovery, then review the change and add a tested rollback step",
      "Disable the guardrail while the team investigates",
      "Manually reverse the edit from memory and hope it matches",
    ],
    best: 0,
    assurance: "Tested rollback",
    feedback:
      "Rollback is a control, not an improvisation: restore the last known-good configuration from version control, confirm recovery, and make the rollback step a tested part of the change process.",
  },
];

export function guardrailConfigAssuranceScore(answers: Record<string, number>) {
  const done = GUARDRAIL_CONFIG_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === GUARDRAIL_CONFIG_ASSURANCE_ROUNDS.length,
  };
}
