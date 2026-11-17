export type TestIsolationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TEST_ISOLATION_ROUNDS: TestIsolationRound[] = [
  {
    id: "prod-copy",
    scenario:
      "A full production database is copied into a sandbox so the team can test with realistic data, and the copy is never de-identified.",
    choices: [
      "Keep production personal data out of test environments, or de-identify it before the copy is made",
      "Restrict the sandbox to the engineering team and rely on access control",
      "Copy only the customer table and leave the rest of the schema out",
    ],
    best: 0,
    assurance: "Minimised test data",
    feedback:
      "A production copy is a second copy of the same personal data: keep it out, or de-identify it before copying.",
  },
  {
    id: "prod-key",
    scenario:
      "A developer pastes the production model API key into a test notebook so the sandbox behaves exactly like live.",
    choices: [
      "Use isolated model endpoints and keys for test traffic, with spend caps and no access to live data",
      "Keep the production key but add a monthly budget alert on the account",
      "Rotate the production key after testing finishes",
    ],
    best: 0,
    assurance: "Isolated endpoints and keys",
    feedback:
      "A production key in a sandbox is production access with sandbox discipline: isolate endpoints and keys for test traffic.",
  },
  {
    id: "write-access",
    scenario:
      "The test service account can write to production tables because the integration tests needed it once.",
    choices: [
      "Give test credentials no production write access, and use a scoped exception if a test truly needs it",
      "Leave the permission in place and rely on code review to catch mistakes",
      "Add a naming convention so test records are recognisable in production",
    ],
    best: 0,
    assurance: "Least-privilege test access",
    feedback:
      "A test account with production write access is a production account: remove the permission and scope any exception.",
  },
  {
    id: "public-tool-egress",
    scenario:
      "A sandbox experiment sends real customer prompts to a public model playground because egress is unrestricted.",
    choices: [
      "Control egress so test environments cannot send data to public tools, and treat an attempt as a signal to review",
      "Add a note to the team wiki that public playgrounds should not be used with real data",
      "Block only the most popular playground domains",
    ],
    best: 0,
    assurance: "Controlled egress",
    feedback:
      "Test data leaves through whatever the network allows: control egress rather than relying on a wiki note.",
  },
  {
    id: "never-expires",
    scenario:
      "Sandboxes created for a two-week evaluation are still running a year later, holding copies of data nobody tracks.",
    choices: [
      "Make environments expire by default and clear their data on teardown, with a recorded owner for extensions",
      "Run a quarterly clean-up and delete anything that looks unused",
      "Leave them running so future teams can reuse the setup",
    ],
    best: 0,
    assurance: "Expiry and teardown",
    feedback:
      "A sandbox that never expires becomes an unowned data store: expire by default, clear on teardown, and record extensions.",
  },
];

export function testIsolationScore(answers: Record<string, number>) {
  const done = TEST_ISOLATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TEST_ISOLATION_ROUNDS.length,
  };
}
