export type MultilingualRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const MULTILINGUAL_ROUNDS: MultilingualRound[] = [
  {
    id: "english-only-evidence",
    scenario:
      "A support assistant launches in eight languages, and the evaluation pack only contains English test cases.",
    choices: [
      "Evaluate quality and safety per language, and mark untested languages as unsupported",
      "Launch everywhere and monitor complaints per market for the first month",
      "Translate the English test cases and treat them as local evidence",
    ],
    best: 0,
    assurance: "Per-language evaluation",
    feedback:
      "English results say nothing about Portuguese or Tamil: evaluate each language and mark what is untested as unsupported.",
  },
  {
    id: "guardrail-bypass",
    scenario:
      "A refusal that works in English is bypassed by asking the same question in another language the product supports.",
    choices: [
      "Test guardrails, filters and refusals in every supported language and script, including mixed script",
      "Add the bypass phrase to the English blocklist and move on",
      "Disable the other language until the next model upgrade",
    ],
    best: 0,
    assurance: "Guardrails tested per language",
    feedback:
      "Guardrails degrade outside the language they were written in: test each supported language and script, including code-switching.",
  },
  {
    id: "translated-policy",
    scenario:
      "A market's disclosure notice is machine-translated, and the local legal team never sees it before launch.",
    choices: [
      "Have local law, cultural expectations and accessibility reviewed per market before launch",
      "Publish the translated notice and rely on the global privacy policy",
      "Add a line saying the English version prevails",
    ],
    best: 0,
    assurance: "Local review per market",
    feedback:
      "A translated notice is not a local review: check local law, culture and accessibility per market before launch.",
  },
  {
    id: "no-local-reviewers",
    scenario:
      "Escalations from non-English markets land in an English-only queue, and reviewers rely on automatic translation.",
    choices: [
      "Provide in-language reviewers or qualified translation for escalations, and monitor translation quality",
      "Keep the English queue and reply in English to every market",
      "Ask customers to resubmit their concern in English",
    ],
    best: 0,
    assurance: "In-language review",
    feedback:
      "Automatic translation in a complaint queue hides meaning: staff in-language review or qualified translation and monitor quality.",
  },
  {
    id: "volume-blindspot",
    scenario:
      "A language with 2% of traffic has no test coverage, and its share is growing 30% a quarter.",
    choices: [
      "Track language volumes against coverage and set a threshold that triggers testing",
      "Wait until the language reaches a material share of traffic",
      "Restrict the product to the largest three languages permanently",
    ],
    best: 0,
    assurance: "Coverage follows volume",
    feedback:
      "A small share today can be tomorrow's main market: tie language coverage to volume with a threshold that triggers testing.",
  },
];

export function multilingualScore(answers: Record<string, number>) {
  const done = MULTILINGUAL_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === MULTILINGUAL_ROUNDS.length,
  };
}
