export type AgriFoodRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const AGRI_FOOD_ROUNDS: AgriFoodRound[] = [
  {
    id: "imported-model",
    scenario:
      "An agronomy model trained on large farms in a different climate is deployed unchanged, and its irrigation and pesticide advice is followed across small holdings with different soil and rainfall.",
    choices: [
      "Validate recommendations for local soil, climate and practice before they drive action",
      "Follow the advice exactly because the model was trained on more data",
      "Apply the advice at half strength to reduce the risk of harm",
    ],
    best: 0,
    assurance: "Local validation",
    feedback:
      "Scale of training data is not local relevance: validate recommendations against local conditions before they change what growers do.",
  },
  {
    id: "locked-farm-data",
    scenario:
      "A precision-agriculture platform collects field, yield and equipment data, and growers find they cannot export their own history or take it to another provider.",
    choices: [
      "Ensure farmers own and can access and export the data their operation generates",
      "Let growers request a copy of their data by contacting support in writing",
      "Treat the data as the platform's asset because it also improves the model",
    ],
    best: 0,
    assurance: "Farm data rights",
    feedback:
      "Operational farm data belongs with the grower: they should be able to access and export it, not negotiate for it.",
  },
  {
    id: "thin-data-farms",
    scenario:
      "Recommendations are consistently worse for smallholders and regions with sparse data, and those growers receive the lowest-confidence advice with no alternative route.",
    choices: [
      "Check that advice does not systematically disadvantage smallholders or thin-data regions and provide an alternative",
      "Accept the difference because small farms generate less data by nature",
      "Exclude thin-data regions from the service so they are not misled",
    ],
    best: 0,
    assurance: "Equitable advice",
    feedback:
      "Worse advice for those with less data compounds disadvantage: test for it and give those growers a usable alternative rather than poorer output.",
  },
  {
    id: "score-only-safety",
    scenario:
      "A model flags produce batches for food-safety review, but the flag alone releases or holds shipments with no named sign-off and no traceability record.",
    choices: [
      "Keep human sign-off and audit trails on food safety and traceability decisions",
      "Accept the model's flag because it is faster and more consistent than staff",
      "Reserve human review for batches where the model flags high risk",
    ],
    best: 0,
    assurance: "Food safety accountability",
    feedback:
      "Food safety decisions need a person and a record: a score alone cannot release or hold a shipment.",
  },
  {
    id: "optimised-away",
    scenario:
      "A yield-optimisation model recommends higher stocking densities and inputs, and environmental and animal-welfare costs disappear because they were never in the objective.",
    choices: [
      "Make environmental and animal-welfare trade-offs explicit rather than optimised away",
      "Follow the model because yield and cost are what the business is measured on",
      "Add a footnote that the recommendation is optimised for yield only",
    ],
    best: 0,
    assurance: "Trade-off transparency",
    feedback:
      "What is not in the objective gets traded away silently: state environmental and welfare trade-offs explicitly before acting on an optimisation.",
  },
];

export function agriFoodScore(answers: Record<string, number>) {
  const done = AGRI_FOOD_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === AGRI_FOOD_ROUNDS.length,
  };
}
