export type DataRightsLicensingAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const DATA_RIGHTS_LICENSING_ASSURANCE_ROUNDS: DataRightsLicensingAssuranceRound[] = [
  {
    id: "no-basis",
    scenario:
      "A team wants to fine-tune a model on customer support transcripts, and nobody has confirmed whether the original consent or contract permits model training.",
    choices: [
      "Confirm the lawful basis and permitted uses for training, record the decision, and exclude data that is not covered",
      "Use the transcripts because they are already stored and the team has access",
      "Anonymise by removing names and treat that as sufficient consent",
    ],
    best: 0,
    assurance: "Lawful basis for training data",
    feedback:
      "Access is not permission: confirm the lawful basis and permitted training uses, record the decision, and exclude data whose consent or contract does not cover model training.",
  },
  {
    id: "licence-drift",
    scenario:
      "A third-party dataset was licensed for research evaluation only, and it has since been pulled into a production training pipeline.",
    choices: [
      "Check the licence terms against the current use, remove the data or renegotiate where terms do not permit it, and record the outcome",
      "Keep it in production since the licence was accepted at download",
      "Attribute the source in documentation and assume that covers the licence",
    ],
    best: 0,
    assurance: "Licence-to-use alignment",
    feedback:
      "Licences are scoped: check terms against the actual use, remove or renegotiate where they do not permit it, and record the outcome so scope does not drift silently.",
  },
  {
    id: "optout-ignored",
    scenario:
      "People have opted out of having their content used for AI training, but the current model still reflects their data and no process handles future opt-outs.",
    choices: [
      "Honour opt-outs with a repeatable process: suppress future use, assess whether retraining or removal is needed, and record how the request was resolved",
      "Add opt-outs to a queue and revisit them at the next annual retrain",
      "Stop advertising the opt-out to avoid expectations the team cannot meet",
    ],
    best: 0,
    assurance: "Opt-out and withdrawal handling",
    feedback:
      "Opt-outs need a working mechanism: suppress future use, assess retraining or removal, and record resolution so the commitment is real rather than a published promise.",
  },
  {
    id: "scrape-unreviewed",
    scenario:
      "A large web-scraped corpus is about to be used, and no one has reviewed robots directives, terms of use, personal data, or copyrighted material in it.",
    choices: [
      "Run a documented pre-use review (source terms, personal data, copyright risk, exclusions) and keep the evidence with the dataset version",
      "Use the corpus first and review only if a complaint arrives",
      "Remove the corpus entirely without recording why, losing the reasoning",
    ],
    best: 0,
    assurance: "Scraped data review evidence",
    feedback:
      "Scraped data carries accumulated obligations: review source terms, personal data and copyright risk before use, and keep the evidence tied to the dataset version.",
  },
];

export function dataRightsLicensingAssuranceScore(answers: Record<string, number>) {
  const done = DATA_RIGHTS_LICENSING_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === DATA_RIGHTS_LICENSING_ASSURANCE_ROUNDS.length,
  };
}
