export type VulnerableCustomerRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VULNERABLE_CUSTOMER_ROUNDS: VulnerableCustomerRound[] = [
  {
    id: "automated-escalation",
    scenario:
      "The system sees three failed payments and sends an automated final notice, unaware the customer has just been hospitalised.",
    choices: [
      "Pause automated adverse action on hardship signals until a person reviews the account",
      "Send the notice but add a line inviting the customer to contact the team",
      "Delay the notice by seven days for every customer to be safe",
    ],
    best: 0,
    assurance: "Human review before adverse action",
    feedback:
      "Hardship signals should stop the automated escalation and route the account to a person who can act, not just soften the letter.",
  },
  {
    id: "bereavement-script",
    scenario:
      "A customer mentions a bereavement in chat and the assistant continues its scripted upgrade offer.",
    choices: [
      "Recognise the disclosure, pause the sales script and hand over to a trained person",
      "Continue the script but add a condolence line before the offer",
      "Offer the upgrade for free as a gesture and continue",
    ],
    best: 0,
    assurance: "Adapted interaction",
    feedback:
      "A disclosure of vulnerability should change the interaction: pause the script and hand over to someone trained to help.",
  },
  {
    id: "inferred-health",
    scenario:
      "A vulnerability model scores customers using inferred health conditions from their browsing and search history.",
    choices: [
      "Limit vulnerability signals to what the customer disclosed or what the service genuinely needs",
      "Keep the inferred data but stop showing the score to frontline staff",
      "Keep the inferred data and disclose its use in the privacy notice",
    ],
    best: 0,
    assurance: "Data minimisation",
    feedback:
      "Inferring health conditions to score vulnerability collects far more than the service needs: use disclosed or necessary signals only.",
  },
  {
    id: "no-override",
    scenario:
      "A support agent can see the decision is wrong for a customer in hardship, but the system offers no way to change it.",
    choices: [
      "Give trained staff the authority to override the automation, with the reason recorded",
      "Escalate to a team leader who can raise a ticket with the platform team",
      "Tell the customer to appeal through the standard complaints process",
    ],
    best: 0,
    assurance: "Staff override",
    feedback:
      "Oversight without authority is not oversight: trained staff need a way to change the outcome and a place to record why.",
  },
  {
    id: "no-outcome-data",
    scenario:
      "Vulnerable customers end up worse off, but nobody can show it because vulnerability is never recorded or reported.",
    choices: [
      "Record vulnerability support and referrals, and monitor outcomes for those groups",
      "Add a free-text notes field for agents to mention hardship when they notice it",
      "Survey vulnerable customers once a year about their experience",
    ],
    best: 0,
    assurance: "Outcome monitoring",
    feedback:
      "You cannot show fair outcomes for vulnerable customers without recording the support given and comparing what happened next.",
  },
];

export function vulnerableCustomerScore(answers: Record<string, number>) {
  const done = VULNERABLE_CUSTOMER_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VULNERABLE_CUSTOMER_ROUNDS.length,
  };
}
