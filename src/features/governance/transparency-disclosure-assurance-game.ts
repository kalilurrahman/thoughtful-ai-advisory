export type TransparencyDisclosureAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const TRANSPARENCY_DISCLOSURE_ASSURANCE_ROUNDS: TransparencyDisclosureAssuranceRound[] = [
  {
    id: "disclosure-notice",
    scenario:
      "Users interact with an AI-assisted service but are not clearly told when AI is involved, what role it plays, or when outputs are AI-generated.",
    choices: [
      "Provide clear, timely disclosure that AI is in use, explain its role in the interaction/decision, and label AI-generated outputs where appropriate",
      "Disclose AI use only in fine print that most users will not notice",
      "Avoid disclosure to keep the experience seamless",
    ],
    best: 0,
    assurance: "Appropriate AI disclosure and notice",
    feedback:
      "Transparency assurance includes making AI involvement and its role understandable to affected users at relevant points in the experience.",
  },
  {
    id: "limitations-uncertainty",
    scenario:
      "The system presents outputs confidently without communicating limitations, known failure modes, uncertainty, or when users should verify or seek human help.",
    choices: [
      "Communicate limitations, uncertainty, and known constraints in practical terms and guide users on verification or escalation when appropriate",
      "Present all outputs as equally reliable to build confidence",
      "Share only technical caveats that typical users cannot interpret",
    ],
    best: 0,
    assurance: "Communicating limitations and uncertainty",
    feedback:
      "Users need usable information about what the system can and cannot do, including uncertainty and when to verify, so they can calibrate trust appropriately.",
  },
  {
    id: "contestability-feedback",
    scenario:
      "Users who disagree with or are harmed by an AI-assisted outcome have no clear way to question, contest, provide feedback, or reach a human.",
    choices: [
      "Provide accessible feedback, contestability, and recourse channels with clear paths to human review or support appropriate to the impact",
      "Offer no way to challenge or question AI-assisted outcomes",
      "Collect feedback but provide no response, review, or remedy path",
    ],
    best: 0,
    assurance: "Contestability, feedback, and recourse",
    feedback:
      "Assurance requires meaningful ways for users to report issues, contest outcomes, and obtain appropriate human review or recourse when AI affects them.",
  },
  {
    id: "understanding-evidence",
    scenario:
      "Disclosures and explanations exist, but there is no evidence that users actually understand them or that transparency measures are effective in practice.",
    choices: [
      "Evaluate transparency and disclosure effectiveness (e.g., comprehension checks, user feedback, support signals) and improve communications based on evidence",
      "Assume disclosures are effective because they were published",
      "Remove explanations to reduce interface complexity without assessing impact",
    ],
    best: 0,
    assurance: "Evidence of understanding and effectiveness",
    feedback:
      "Transparency is an outcome, not just a notice: review whether users understand disclosures and can act on them, and improve based on evidence.",
  },
];

export function transparencyDisclosureAssuranceScore(answers: Record<string, number>) {
  const done = TRANSPARENCY_DISCLOSURE_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === TRANSPARENCY_DISCLOSURE_ASSURANCE_ROUNDS.length,
  };
}
