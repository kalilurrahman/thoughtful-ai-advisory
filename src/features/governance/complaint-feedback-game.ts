export type ComplaintFeedbackRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const COMPLAINT_FEEDBACK_ROUNDS: ComplaintFeedbackRound[] = [
  {
    id: "hidden-intake",
    scenario:
      "The only way to complain about an AI-assisted decision is an address buried in a legal page, and the people affected mostly use a phone.",
    choices: [
      "Put intake where the decision happens, in the channel and language the person already uses",
      "Keep the legal address and add a web form linked from the footer",
      "Route complaints through the sales team so they can triage first",
    ],
    best: 0,
    assurance: "Reachable intake",
    feedback:
      "An intake route nobody can find is not a route: place it where the decision happens, in the person's channel and language.",
  },
  {
    id: "ticket-closed",
    scenario:
      "Complaints are closed individually as resolved, and nobody notices that the same wrong answer has now been reported 40 times.",
    choices: [
      "Triage by theme and volume to separate one-off errors from a systemic pattern worth fixing",
      "Keep closing individually and rely on the monthly total as the trend",
      "Escalate only complaints that mention legal action",
    ],
    best: 0,
    assurance: "Pattern triage",
    feedback:
      "Forty individually closed tickets can be one unfixed defect: triage by theme so a pattern is visible before it is a crisis.",
  },
  {
    id: "no-response-time",
    scenario:
      "The complaint policy promises a response within five working days, and the median first reply is currently nineteen days.",
    choices: [
      "Measure the response time against the promise, publish it, and fix the queue or change the promise",
      "Leave the promise and add an automated acknowledgement so something is sent quickly",
      "Remove the stated timeline from the policy so no target is missed",
    ],
    best: 0,
    assurance: "Measured response",
    feedback:
      "A promise nobody measures is decoration: measure against it and either fix the queue or change the promise honestly.",
  },
  {
    id: "surface-fix",
    scenario:
      "A complaint about biased output is resolved by apologising to the person, and the prompt and evaluation set stay unchanged.",
    choices: [
      "Trace root cause to the model, data, prompt or process, then change the artefact that produced it",
      "Add the case to a training slide so staff recognise it next time",
      "Ask the model provider to improve the base model",
    ],
    best: 0,
    assurance: "Root cause to fix",
    feedback:
      "An apology closes the ticket, not the defect: trace the cause and change the model, data, prompt or process behind it.",
  },
  {
    id: "silent-fix",
    scenario:
      "A systemic issue is fixed after complaints, and none of the people who reported it are ever told what changed.",
    choices: [
      "Close the loop with the complainants and record the fix so the same report is not reopened",
      "Publish a general changelog entry and treat that as informing them",
      "Wait for them to ask before explaining what was fixed",
    ],
    best: 0,
    assurance: "Closed loop",
    feedback:
      "A fix nobody hears about costs the trust twice: tell the complainants what changed and record it against the theme.",
  },
];

export function complaintFeedbackScore(answers: Record<string, number>) {
  const done = COMPLAINT_FEEDBACK_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === COMPLAINT_FEEDBACK_ROUNDS.length,
  };
}
