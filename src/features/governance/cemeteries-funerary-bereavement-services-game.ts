export type CemeteriesFuneraryBereavementServicesRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const CEMETERIES_FUNERARY_BEREAVEMENT_SERVICES_ROUNDS: CemeteriesFuneraryBereavementServicesRound[] = [
  {
    id: "sensitive-consent",
    scenario:
      "An AI system drafts messages and manages records using personal, bereavement and memorial information, but it collects and reuses details beyond what families consented to or what is needed for the service.",
    choices: [
      "Maintain sensitive and consentful handling of personal, bereavement and memorial information, limiting collection and use to what is needed and agreed",
      "Collect and retain all available details to personalise communications and improve future services",
      "Reuse information shared in one context for other purposes without checking consent or necessity",
    ],
    best: 0,
    assurance: "Sensitive & consentful information handling",
    feedback:
      "Bereavement contexts demand care: personal and memorial information should be handled sensitively, with clear consent and only as much as is needed for the service.",
  },
  {
    id: "accuracy-dignity-review",
    scenario:
      "AI-generated records, notices and memorial content sometimes contain errors or phrasing that could be distressing, but outputs are sent or published without human review for consequential communications.",
    choices: [
      "Support accuracy, dignity and respectful presentation in records, communications and memorial content with human review for consequential outputs",
      "Publish AI-generated communications quickly to save time and correct issues only if families object",
      "Assume the system's language is appropriate because it follows standard templates",
    ],
    best: 0,
    assurance: "Accuracy, dignity & human review",
    feedback:
      "Errors or insensitive phrasing can cause real harm: consequential records and communications should be reviewed by people for accuracy, dignity and respectful presentation.",
  },
  {
    id: "access-controls-oversight",
    scenario:
      "Staff can use AI tools to locate graves, access records and propose arrangements, but access to sensitive locations and information is broad and consequential actions can be taken without clear human oversight.",
    choices: [
      "Protect sensitive locations, records and information with access controls, and maintain human oversight for consequential actions and arrangements",
      "Give all staff broad access to speed up assistance and rely on trust rather than controls",
      "Allow the system to carry out consequential actions automatically when requests appear straightforward",
    ],
    best: 0,
    assurance: "Access controls & human oversight",
    feedback:
      "Sensitive information and consequential actions require safeguards: appropriate access controls and human oversight help prevent misuse and unintended outcomes.",
  },
  {
    id: "transparency-traceability",
    scenario:
      "Families receive AI-assisted guidance and documents, but they are not told when AI is involved or what its limitations are, and there is little traceability of what was generated or relied upon if questions arise later.",
    choices: [
      "Disclose AI assistance and limitations transparently to families and service users as appropriate, and maintain traceability and audit trails for outputs and actions",
      "Avoid mentioning AI involvement to keep interactions simple and reassure families",
      "Keep only minimal records of AI-assisted outputs because the situation is sensitive",
    ],
    best: 0,
    assurance: "Transparency & traceability",
    feedback:
      "Clarity and accountability matter: appropriate transparency about AI assistance and traceable records help answer questions, correct mistakes and maintain trust.",
  },
  {
    id: "fallback-support",
    scenario:
      "The system becomes uncertain or unavailable while helping with arrangements or records, and staff have no clear fallback or support pathway to assist families without delay or confusion.",
    choices: [
      "Provide safe fallback and support pathways so people can get timely, compassionate help when AI is uncertain or unavailable",
      "Ask families to wait until the system is working again before proceeding",
      "Encourage staff to improvise responses without guidance or escalation routes",
    ],
    best: 0,
    assurance: "Fallback & support pathways",
    feedback:
      "Services must remain dependable in sensitive moments: clear fallback and support pathways ensure families receive timely, compassionate assistance when AI cannot be relied on.",
  },
];

export function cemeteriesFuneraryBereavementServicesScore(answers: Record<string, number>) {
  const done = CEMETERIES_FUNERARY_BEREAVEMENT_SERVICES_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === CEMETERIES_FUNERARY_BEREAVEMENT_SERVICES_ROUNDS.length,
  };
}
