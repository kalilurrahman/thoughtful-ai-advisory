export type RegulatedAdviceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const REGULATED_ADVICE_ROUNDS: RegulatedAdviceRound[] = [
  {
    id: "disclaimer-shield",
    scenario:
      "A chatbot gives a specific investment recommendation and adds a footer saying it is not financial advice.",
    choices: [
      "Define what advice the tool may give against the permissions the firm holds and block the rest",
      "Keep the recommendation and make the disclaimer more prominent",
      "Add a second disclaimer asking the client to speak to an adviser",
    ],
    best: 0,
    assurance: "Defined scope",
    feedback:
      "A disclaimer does not convert regulated advice into general information: define the permitted scope against the firm's permissions and block advice outside it.",
  },
  {
    id: "rubber-stamp",
    scenario:
      "AI-drafted advice reaches the client after a team leader clicks approve without reading the file.",
    choices: [
      "Require review by a suitably qualified person who can see the facts and the advice",
      "Rename the approve button to reviewed and keep the flow",
      "Sample five per cent of advice after it has been sent",
    ],
    best: 0,
    assurance: "Qualified review",
    feedback:
      "Review is only meaningful if the reviewer is qualified, has the facts, and can change the advice before the client sees it.",
  },
  {
    id: "no-fact-find",
    scenario:
      "The tool recommends a product without collecting the client's circumstances, objectives or existing holdings.",
    choices: [
      "Gather the facts and suitability information the advice depends on before advising",
      "Ask two screening questions and rely on the client to correct anything wrong",
      "Pull the client's existing holdings from the CRM and assume the rest",
    ],
    best: 0,
    assurance: "Suitability information",
    feedback:
      "Advice without the facts it depends on is not suitable advice: gather the circumstances and suitability information first.",
  },
  {
    id: "out-of-scope-improvise",
    scenario:
      "A client asks about a pension transfer, which is outside the tool's scope, and the assistant improvises an answer.",
    choices: [
      "Route out-of-scope questions to a qualified professional with the context gathered so far",
      "Answer generally and suggest the client confirms with their adviser",
      "Ask the client to rephrase the question so the tool can answer it",
    ],
    best: 0,
    assurance: "Escalation route",
    feedback:
      "Out-of-scope questions need a route to a qualified professional, with the context handed over, rather than an improvised answer.",
  },
  {
    id: "no-record",
    scenario:
      "Advice is given in a chat window that is not retained, so nobody can show what was advised or by whom.",
    choices: [
      "Keep a record of what was advised, to whom and by whom, with the basis for it",
      "Rely on the client to keep their own copy of the conversation",
      "Export chats monthly to a shared drive for general reporting",
    ],
    best: 0,
    assurance: "Advice record",
    feedback:
      "If a client later challenges the advice, the firm needs a record of what was advised, to whom, by whom and on what basis.",
  },
];

export function regulatedAdviceScore(answers: Record<string, number>) {
  const done = REGULATED_ADVICE_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === REGULATED_ADVICE_ROUNDS.length,
  };
}
