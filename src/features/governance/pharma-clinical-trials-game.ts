export type PharmaClinicalTrialsRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PHARMA_CLINICAL_TRIALS_ROUNDS: PharmaClinicalTrialsRound[] = [
  {
    id: "safety-oversight",
    scenario:
      "An AI tool recommends changes to participant eligibility and flags potential safety signals, but site staff are encouraged to accept its outputs quickly without qualified clinical review.",
    choices: [
      "Keep qualified human oversight in place so clinicians review AI outputs that affect participant safety and protocol adherence",
      "Rely on the AI recommendations to speed enrolment and signal detection",
      "Treat the AI as advisory but review only cases that later result in a reported issue",
    ],
    best: 0,
    assurance: "Human oversight & participant safety",
    feedback:
      "Participant safety and protocol adherence require accountable clinical judgement: AI can assist, but qualified humans must review outputs that affect eligibility, care or safety decisions.",
  },
  {
    id: "consent-transparency",
    scenario:
      "AI is used to screen candidates and prioritise outreach, but participants are not told that AI influenced who was contacted or how their information was assessed.",
    choices: [
      "Inform participants when AI is used, explain its role appropriately, and maintain consent and transparency",
      "Avoid mentioning AI because it is only a back-office efficiency tool",
      "Disclose AI use only if a participant specifically asks about technology",
    ],
    best: 0,
    assurance: "Consent & transparency",
    feedback:
      "Trust depends on clear communication: participants should be informed when AI materially affects screening or outreach, with consent and transparency maintained.",
  },
  {
    id: "bias-representativeness",
    scenario:
      "Recruitment and stratification outputs consistently favour certain groups, and the team has not tested whether eligibility criteria or model patterns reduce representativeness.",
    choices: [
      "Test recruitment, eligibility and stratification for bias and representativeness, and address unjustified disparities",
      "Proceed if overall enrolment targets are being met on schedule",
      "Adjust outreach messaging later without examining the model or criteria driving the pattern",
    ],
    best: 0,
    assurance: "Bias & representativeness",
    feedback:
      "Meeting targets does not guarantee fair or representative enrolment: test AI-influenced recruitment and stratification for bias and correct unjustified disparities.",
  },
  {
    id: "data-integrity",
    scenario:
      "AI-generated summaries and derived variables are added to the trial record, but their provenance, transformations and access controls are poorly documented and broadly available.",
    choices: [
      "Maintain data integrity, provenance and audit trails, and protect sensitive health data with privacy controls and least-privilege access",
      "Store the outputs in shared folders so teams can work faster",
      "Keep only the final values because intermediate steps are hard to track",
    ],
    best: 0,
    assurance: "Data integrity, provenance & privacy",
    feedback:
      "Trial evidence must be trustworthy and protected: preserve provenance and audit trails for AI-derived data, and limit access to sensitive health information.",
  },
  {
    id: "pause-revert",
    scenario:
      "A model update begins producing inconsistent eligibility recommendations, but there is no clear escalation path or a practised way to pause or revert AI use during the trial.",
    choices: [
      "Monitor performance, escalate errors promptly, and ensure teams can pause or revert AI use when concerns arise",
      "Continue using the model while collecting examples for a later review",
      "Disable the model informally in one site without a coordinated process or record",
    ],
    best: 0,
    assurance: "Monitoring, escalation & pause/revert",
    feedback:
      "When AI behaviour becomes unreliable, speed of response matters: monitor outputs, escalate concerns, and have a clear, practised way to pause or revert use safely.",
  },
];

export function pharmaClinicalTrialsScore(answers: Record<string, number>) {
  const done = PHARMA_CLINICAL_TRIALS_ROUNDS.filter((round) => answers[round.id] !== undefined);
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PHARMA_CLINICAL_TRIALS_ROUNDS.length,
  };
}
