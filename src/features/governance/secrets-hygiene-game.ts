export type SecretsHygieneRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const SECRETS_HYGIENE_ROUNDS: SecretsHygieneRound[] = [
  {
    id: "key-in-browser",
    scenario:
      "A prototype chat widget calls the model provider directly from the browser, so the API key ships in the page bundle.",
    choices: [
      "Move the call behind a server endpoint, scope a server-side key, and revoke the exposed key",
      "Obfuscate the key in the bundle so it is harder to find",
      "Keep it for the prototype and fix it before the real launch",
    ],
    best: 0,
    assurance: "Server-side, scoped keys",
    feedback:
      "A key in a browser bundle is public the moment it ships: move the call server-side, scope a key for that service, and revoke the exposed one.",
  },
  {
    id: "shared-master-key",
    scenario:
      "Every team uses one long-lived provider key with full account permissions, because issuing separate keys would slow delivery down.",
    choices: [
      "Issue scoped keys per system and environment with owners, and keep the privileged key for admin tasks only",
      "Keep one key but store it in a shared password vault",
      "Rotate the shared key once a year to limit exposure",
    ],
    best: 0,
    assurance: "Least-privilege keys",
    feedback:
      "One shared master key means any leak is an account-wide incident: issue scoped keys per system and environment, each with an owner.",
  },
  {
    id: "never-rotated",
    scenario:
      "A key has not been rotated since the system launched, and no one has ever tested revoking a key to see what breaks.",
    choices: [
      "Rehearse revocation in a controlled window, record what depends on the key, then rotate on a schedule",
      "Rotate the key during a busy release week to prove it can be done quickly",
      "Leave it in place because rotating it might cause an outage",
    ],
    best: 0,
    assurance: "Rehearsed rotation",
    feedback:
      "Rotation you have never rehearsed is an outage waiting to happen: map dependencies, rehearse revocation, then rotate on a schedule.",
  },
  {
    id: "leak-in-logs",
    scenario:
      "A debugging log captures full request bodies, including a provider key a user pasted into a prompt, and the log is shipped to a third-party service.",
    choices: [
      "Redact secrets before logging, scan log and prompt output for key patterns, and treat the log store as a leak surface",
      "Rely on the log provider's access controls to keep it safe",
      "Delete the log index and hope the copy is gone",
    ],
    best: 0,
    assurance: "Leak detection",
    feedback:
      "Prompts and logs are leak surfaces: redact secrets before logging, scan output for key patterns, and assume anything shipped off-box may be read.",
  },
];

export function secretsHygieneScore(answers: Record<string, number>) {
  const done = SECRETS_HYGIENE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === SECRETS_HYGIENE_ROUNDS.length,
  };
}
