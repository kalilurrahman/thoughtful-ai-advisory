export type VeterinaryAnimalWelfareRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const VETERINARY_ANIMAL_WELFARE_ROUNDS: VeterinaryAnimalWelfareRound[] = [
  {
    id: "clinical-validation",
    scenario:
      "An AI tool suggests diagnoses and treatment options, but its recommendations have not been validated for the species, breeds or clinical context in which it is being used.",
    choices: [
      "Validate diagnostic and care-support recommendations for the relevant clinical context, species and breeds, and limit reliance where evidence is weak",
      "Assume the tool generalises well because it performs strongly on common cases in other settings",
      "Adopt recommendations broadly and review accuracy only after adverse outcomes are reported",
    ],
    best: 0,
    assurance: "Clinical validation across species & context",
    feedback:
      "Clinical AI must be fit for its use: validation across species, breeds and context helps ensure recommendations are reliable before they inform care.",
  },
  {
    id: "professional-oversight",
    scenario:
      "Staff begin following AI-generated treatment and welfare recommendations for consequential decisions without a veterinarian or qualified professional reviewing or taking responsibility for the outcome.",
    choices: [
      "Maintain veterinary and professional oversight for consequential clinical and welfare decisions, with clear accountability",
      "Treat the AI output as sufficient for routine consequential decisions to save time",
      "Require professional review only when an owner or caregiver explicitly requests it",
    ],
    best: 0,
    assurance: "Veterinary & professional oversight",
    feedback:
      "Consequential clinical and welfare decisions require accountable expertise: qualified professionals must review and remain responsible for AI-informed actions.",
  },
  {
    id: "welfare-risk",
    scenario:
      "A care plan optimises for efficiency or resource use, but potential pain, distress or other welfare impacts on the animal are not assessed or monitored over time.",
    choices: [
      "Assess and monitor welfare impacts and risks so AI-informed decisions protect animal wellbeing",
      "Prioritise efficiency targets and address welfare concerns only if a complaint is raised",
      "Assume welfare is protected because the plan follows standard protocols",
    ],
    best: 0,
    assurance: "Welfare impact & risk monitoring",
    feedback:
      "Animal welfare must be explicit: assessing and monitoring welfare impacts and risks helps ensure AI-informed care does not cause avoidable harm or distress.",
  },
  {
    id: "data-traceability",
    scenario:
      "Recommendations are based on incomplete records and images of uncertain quality, and there is no clear record of input provenance, limitations, outputs or the model version used.",
    choices: [
      "Understand and document data quality, provenance and limitations, and log decisions, outputs and model or system versions for traceability and review",
      "Proceed with available inputs without documenting gaps because delaying care is undesirable",
      "Keep records only of the final treatment chosen, without AI inputs or outputs",
    ],
    best: 0,
    assurance: "Data quality & traceability",
    feedback:
      "Trustworthy care depends on known inputs and evidence: documenting data quality/provenance and logging outputs and versions supports review, learning and accountability.",
  },
  {
    id: "escalation-fallback",
    scenario:
      "The system is uncertain, unavailable or suggests an action that may be contraindicated, but staff have no clear guidance on when to escalate or how to proceed safely without the AI.",
    choices: [
      "Provide clear escalation and safe fallback procedures when AI is uncertain, unavailable or contraindicated",
      "Encourage staff to follow the best available AI suggestion even when confidence is low",
      "Leave escalation and fallback to individual judgement without a defined procedure",
    ],
    best: 0,
    assurance: "Escalation & safe fallback",
    feedback:
      "Safe care requires prepared responses to uncertainty and failure: clear escalation and fallback procedures protect animals when AI cannot be relied on.",
  },
];

export function veterinaryAnimalWelfareScore(answers: Record<string, number>) {
  const done = VETERINARY_ANIMAL_WELFARE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === VETERINARY_ANIMAL_WELFARE_ROUNDS.length,
  };
}
