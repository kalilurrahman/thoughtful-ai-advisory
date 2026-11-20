export type HumanitarianAidAllocationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const HUMANITARIAN_AID_ALLOCATION_ROUNDS: HumanitarianAidAllocationRound[] = [
  {
    id: "biased-targeting",
    scenario:
      "An AI model prioritises households for aid using incomplete registration data and mobile-phone signals, and teams notice that some vulnerable groups are consistently missed.",
    choices: [
      "Test targeting and prioritisation for fairness and non-discrimination, investigate gaps, and adjust criteria so vulnerable groups are not excluded",
      "Keep the model because it allocates resources quickly at scale",
      "Ask missed groups to re-register later when they have better connectivity or documents",
    ],
    best: 0,
    assurance: "Fairness & non-discrimination",
    feedback:
      "Speed does not justify exclusion: targeting must be tested for bias and data gaps so vulnerable people are not systematically left out of essential support.",
  },
  {
    id: "opaque-criteria",
    scenario:
      "Affected communities and local partners are told that aid decisions are AI-driven, but no one can explain the criteria, what data mattered or why some areas received less support.",
    choices: [
      "Explain allocation criteria and the AI's role clearly to affected people and partners where appropriate, in accessible terms",
      "Keep the criteria confidential to prevent people from gaming the system",
      "Provide a technical model description only to internal analysts",
    ],
    best: 0,
    assurance: "Transparency",
    feedback:
      "People affected by allocation decisions need understandable explanations: share criteria and the AI's role appropriately so communities and partners can engage meaningfully.",
  },
  {
    id: "no-recourse",
    scenario:
      "A family is denied urgent assistance based on an AI score, and there is no clear way for staff to review the case, correct errors or offer recourse.",
    choices: [
      "Provide human review, contestability and recourse for high-impact decisions, with a clear path to correct errors",
      "Treat the AI score as final to keep decisions consistent across sites",
      "Allow appeals only after the current distribution cycle is complete",
    ],
    best: 0,
    assurance: "Contestability & recourse",
    feedback:
      "High-impact allocation decisions must be challengeable: human review and timely recourse help correct errors before harm becomes irreversible.",
  },
  {
    id: "sensitive-data",
    scenario:
      "To improve targeting, teams collect detailed location and vulnerability data, but datasets are shared widely, retained longer than needed and not checked for accuracy in the crisis context.",
    choices: [
      "Handle sensitive crisis data with quality checks, minimisation and protection, limiting access and retention to what is necessary",
      "Collect and share as much data as possible because more detail improves the model",
      "Rely on partners to manage protections without agreed controls or checks",
    ],
    best: 0,
    assurance: "Data quality & protection",
    feedback:
      "Crisis data can expose people to harm if mishandled: apply quality checks, minimisation and protection so targeting improves without creating new risks.",
  },
  {
    id: "accountability-fallback",
    scenario:
      "Conditions change rapidly after a new shock, but teams cannot trace how allocations were made and have no practised manual process to reprioritise when the model's inputs become unreliable.",
    choices: [
      "Log decisions, criteria and outcomes with clear accountability, and maintain human oversight and manual fallback for rapidly changing conditions",
      "Continue using the last model outputs until a new data refresh is available",
      "Let each site improvise without records so they can move faster",
    ],
    best: 0,
    assurance: "Accountability & manual fallback",
    feedback:
      "Accountability and adaptability matter in crises: traceable decisions and rehearsed manual fallback let teams respond responsibly when conditions outpace the model.",
  },
];

export function humanitarianAidAllocationScore(answers: Record<string, number>) {
  const done = HUMANITARIAN_AID_ALLOCATION_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === HUMANITARIAN_AID_ALLOCATION_ROUNDS.length,
  };
}
