export type AccountabilityRaciAssuranceRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const ACCOUNTABILITY_RACI_ASSURANCE_ROUNDS: AccountabilityRaciAssuranceRound[] = [
  {
    id: "ownership",
    scenario:
      "An AI system and its key controls have multiple contributors, but no one is clearly accountable for outcomes, approvals, or ongoing oversight.",
    choices: [
      "Assign clear accountable owners for the system and key controls, with documented responsibilities and decision rights",
      "Assume shared ownership means accountability is covered",
      "Leave ownership implicit and resolve it only when problems occur",
    ],
    best: 0,
    assurance: "Clear ownership and accountability",
    feedback:
      "Governance assurance requires named accountability for systems and controls; diffuse ownership creates gaps in decisions, oversight, and response.",
  },
  {
    id: "decision-rights",
    scenario:
      "Teams disagree on who can approve risk acceptance, guardrail exceptions, or go-live decisions, causing delays or inconsistent choices.",
    choices: [
      "Define decision rights and approval paths (who decides, consults, and is informed) for key governance actions",
      "Let each team decide ad hoc based on urgency",
      "Route every decision to the same person regardless of context or competence",
    ],
    best: 0,
    assurance: "Decision rights and approvals",
    feedback:
      "Clear decision rights and approval paths support consistent, timely governance actions and reduce ambiguity around exceptions and risk acceptance.",
  },
  {
    id: "competence-training",
    scenario:
      "People assigned governance, oversight, or operational roles have not been given the training or guidance needed to perform them effectively.",
    choices: [
      "Ensure role-appropriate competence through training, guidance, and support, and verify people can carry out assigned duties",
      "Assign roles without considering skills or training needs",
      "Assume experience in other areas automatically covers AI governance responsibilities",
    ],
    best: 0,
    assurance: "Competence and role readiness",
    feedback:
      "Accountability is meaningful only when people have the competence, guidance, and support to fulfill their roles and make informed decisions.",
  },
  {
    id: "oversight-evidence",
    scenario:
      "Oversight meetings and escalations happen, but there is little evidence of who was accountable, what was decided, and how issues were followed up.",
    choices: [
      "Record accountable oversight: decisions, rationale, escalations, owners, and follow-up actions with evidence",
      "Rely on informal discussions without records",
      "Document attendance only, without decisions or accountability",
    ],
    best: 0,
    assurance: "Accountable oversight and evidence",
    feedback:
      "Assurance depends on traceable oversight—documenting accountable decisions, escalations, and follow-up so responsibilities and outcomes are clear.",
  },
];

export function accountabilityRaciAssuranceScore(answers: Record<string, number>) {
  const done = ACCOUNTABILITY_RACI_ASSURANCE_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === ACCOUNTABILITY_RACI_ASSURANCE_ROUNDS.length,
  };
}
