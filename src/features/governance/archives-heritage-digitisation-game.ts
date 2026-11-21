export type ArchivesHeritageDigitisationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ARCHIVES_HERITAGE_DIGITISATION_ROUNDS: ArchivesHeritageDigitisationRound[] = [
  {
    id: "provenance-integrity",
    scenario:
      "An AI pipeline transcribes and enhances digitised manuscripts, but outputs are published without links to the original scans and there is no record of automated alterations to images or text.",
    choices: [
      "Preserve provenance and integrity by linking outputs to originals and recording any AI-assisted transformations",
      "Publish the enhanced outputs as the authoritative versions to improve readability and access",
      "Keep original scans in a separate archive without connecting them to the public records",
    ],
    best: 0,
    assurance: "Provenance & integrity",
    feedback:
      "Trustworthy access depends on provenance: users need clear links to originals and visibility into AI-assisted changes so records are not silently altered.",
  },
  {
    id: "metadata-bias-review",
    scenario:
      "AI generates descriptions and subject tags for a cultural collection, but some labels misattribute items, use stereotyped language or omit community context, and no subject-matter experts review them before publication.",
    choices: [
      "Review AI-generated metadata and descriptions for quality and bias with subject-matter and community expertise before release",
      "Publish the generated metadata quickly to improve discoverability and correct issues only if users complain",
      "Rely on the model's general knowledge because it can process collections faster than curators",
    ],
    best: 0,
    assurance: "Metadata quality & bias review",
    feedback:
      "Descriptions shape understanding: expert and community-informed review helps catch misattribution, bias and missing context that automated tagging can introduce.",
  },
  {
    id: "rights-sensitive-content",
    scenario:
      "A digitisation project includes materials with donor restrictions, culturally sensitive content and unclear reuse rights, but the AI workflow makes all items searchable and downloadable by default.",
    choices: [
      "Handle access, use rights and sensitive or restricted content appropriately, applying controls and context before making materials available",
      "Open all materials broadly to maximise public access and address restrictions case by case later",
      "Rely on takedown requests to manage rights and sensitivity issues after publication",
    ],
    best: 0,
    assurance: "Rights & sensitive content handling",
    feedback:
      "Access must respect obligations and communities: rights, restrictions and sensitivity need to be assessed and applied before broad release, not only after harm occurs.",
  },
  {
    id: "transparency-limitations",
    scenario:
      "Transcriptions and summaries are presented to researchers as definitive, with no indication that they were AI-generated or that uncertain readings and gaps may exist.",
    choices: [
      "Disclose AI assistance and limitations clearly so users can interpret outputs and verify important details against sources",
      "Avoid mentioning AI involvement to keep the interface simple and authoritative",
      "Add a general site-wide notice but do not label AI-generated outputs or uncertainties in context",
    ],
    best: 0,
    assurance: "Transparency of AI assistance",
    feedback:
      "Users need context to judge reliability: clear disclosure of AI assistance and limitations supports informed use and encourages verification where it matters.",
  },
  {
    id: "review-traceability",
    scenario:
      "Curators cannot see which descriptions were AI-generated, what sources or prompts informed them, or who approved consequential changes to access or interpretation.",
    choices: [
      "Maintain human review and curatorial authority for consequential decisions, and log AI-generated outputs, sources and changes for traceability and audit",
      "Allow the system to update descriptions and access settings continuously without review records",
      "Keep change notes informally in personal documents rather than in an auditable record",
    ],
    best: 0,
    assurance: "Curatorial authority & traceability",
    feedback:
      "Curatorial oversight and traceability protect the record: consequential descriptions and access decisions need accountable review and auditable histories of AI outputs and changes.",
  },
];

export function archivesHeritageDigitisationScore(answers: Record<string, number>) {
  const done = ARCHIVES_HERITAGE_DIGITISATION_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ARCHIVES_HERITAGE_DIGITISATION_ROUNDS.length,
  };
}
