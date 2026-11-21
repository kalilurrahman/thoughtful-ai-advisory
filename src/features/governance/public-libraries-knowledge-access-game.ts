export type PublicLibrariesKnowledgeAccessRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const PUBLIC_LIBRARIES_KNOWLEDGE_ACCESS_ROUNDS: PublicLibrariesKnowledgeAccessRound[] = [
  {
    id: "quality-bias",
    scenario:
      "An AI search and recommendation tool suggests resources and answers questions for patrons, but results sometimes omit relevant materials, reflect biased framing or present inaccurate summaries without subject-matter or curatorial review.",
    choices: [
      "Monitor search, recommendation and knowledge-assistance quality and bias with subject-matter and curatorial review, and correct issues",
      "Rely on popularity and engagement signals to rank results because they reflect what patrons prefer",
      "Assume the model's outputs are reliable for general knowledge queries and review only formal complaints",
    ],
    best: 0,
    assurance: "Quality & bias with curatorial review",
    feedback:
      "Library assistance must be trustworthy and balanced: curatorial and subject-matter review helps identify bias, gaps and inaccuracies in AI-generated results and summaries.",
  },
  {
    id: "access-equity-safeguards",
    scenario:
      "The AI assistant is promoted as a primary way to find information, but it is difficult to use with assistive technologies, assumes advanced literacy, and does not provide age-appropriate safeguards for younger users.",
    choices: [
      "Support access, equity and age-appropriate safeguards so diverse users can benefit, with alternatives and protections where needed",
      "Optimise the assistant for the majority of adult users and treat accessibility or age safeguards as optional enhancements",
      "Require users to adapt to the assistant's interface and reading level to access services",
    ],
    best: 0,
    assurance: "Access, equity & age-appropriate safeguards",
    feedback:
      "Public libraries serve diverse communities: AI-assisted access should be equitable, accessible and age-appropriate, with alternatives when the tool is not suitable.",
  },
  {
    id: "rights-sensitive-content",
    scenario:
      "The system generates summaries and suggested readings using licensed and in-copyright materials, and it may surface sensitive content without clear handling of rights, licensing terms or content warnings.",
    choices: [
      "Respect rights, licensing and sensitive-content handling by applying appropriate limits, attribution/context and safeguards",
      "Provide full summaries and access to any available material to maximise usefulness, regardless of licensing or sensitivity",
      "Rely on users to determine whether materials are appropriate or permitted for their use",
    ],
    best: 0,
    assurance: "Rights, licensing & sensitive content",
    feedback:
      "Knowledge access must respect legal and community responsibilities: rights, licensing terms and sensitive-content considerations should shape how AI presents and uses materials.",
  },
  {
    id: "transparency-oversight",
    scenario:
      "Patrons receive AI-generated answers and collection guidance presented as authoritative, with no indication of AI involvement, limitations or when a librarian or curator should be consulted for consequential decisions.",
    choices: [
      "Disclose AI assistance and limitations transparently, and maintain human and curatorial oversight for consequential guidance and collections decisions",
      "Present AI outputs as definitive library guidance to build confidence and reduce follow-up questions",
      "Add a general disclaimer but do not indicate when AI was used or when human expertise is needed",
    ],
    best: 0,
    assurance: "Transparency & human/curatorial oversight",
    feedback:
      "Users need to understand how guidance was produced: transparent disclosure and human/curatorial oversight help patrons judge reliability and seek expert help for consequential needs.",
  },
  {
    id: "privacy-traceability",
    scenario:
      "To personalise recommendations, the system retains detailed reading and query histories linked to patrons, but privacy protections, retention limits and traceability of AI outputs and interactions are unclear.",
    choices: [
      "Maintain privacy and data protection with minimisation and clear limits, and keep traceability of outputs and interactions appropriate for accountability",
      "Retain detailed patron histories indefinitely to improve personalisation and service analytics",
      "Collect and share interaction data broadly with partners without clear purpose limits or traceable records",
    ],
    best: 0,
    assurance: "Privacy, data protection & traceability",
    feedback:
      "Patron trust depends on responsible data handling: privacy protections, minimisation and appropriate traceability support accountability without unnecessary collection or exposure.",
  },
];

export function publicLibrariesKnowledgeAccessScore(answers: Record<string, number>) {
  const done = PUBLIC_LIBRARIES_KNOWLEDGE_ACCESS_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === PUBLIC_LIBRARIES_KNOWLEDGE_ACCESS_ROUNDS.length,
  };
}
