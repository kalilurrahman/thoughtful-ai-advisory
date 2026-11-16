export type InventoryRiskClassificationRound = {
  id: string;
  scenario: string;
  choices: [string, string, string];
  best: number;
  assurance: string;
  feedback: string;
};

export const INVENTORY_RISK_CLASSIFICATION_ROUNDS: InventoryRiskClassificationRound[] = [
  {
    id: "undiscovered-system",
    scenario:
      "A team quietly enables an AI assistant that drafts decisions for customers. Nothing is registered, so no owner, purpose, data use, or risk tier exists for it.",
    choices: [
      "Register the system in the AI inventory with owner, purpose, data, vendor, and risk tier before it handles real work",
      "Wait until an audit or incident forces disclosure",
      "Assume departmental tools are too small to register",
    ],
    best: 0,
    assurance: "Complete inventory coverage",
    feedback:
      "Assurance starts with knowing what exists: every AI use needs an inventory record with an owner and a risk tier, including shadow and departmental tools.",
  },
  {
    id: "risk-tier-calibration",
    scenario:
      "Every registered system is labelled low risk regardless of how strongly it affects people, decisions, or sensitive data.",
    choices: [
      "Classify against documented criteria — impact on people, data sensitivity, autonomy, reversibility — and set review depth proportionate to the tier",
      "Keep everything at the lowest tier to avoid review overhead",
      "Let each team self-declare a tier with no calibration",
    ],
    best: 0,
    assurance: "Proportionate risk classification",
    feedback:
      "Risk tiers only work when criteria are documented and applied consistently, so evidence, review, and approvals follow the real impact on people and decisions.",
  },
  {
    id: "stale-inventory",
    scenario:
      "The inventory was accurate when first created, but systems have changed, been re-scoped, or retired over the last two years with no updates.",
    choices: [
      "Keep the inventory current through change, procurement, and decommissioning triggers, with periodic reconciliation recorded as evidence",
      "Refresh the inventory once a year regardless of change",
      "Treat the initial registration as permanently accurate",
    ],
    best: 0,
    assurance: "Inventory currency & reconciliation",
    feedback:
      "An inventory decays: tie updates to change, procurement, and decommissioning events, and reconcile periodically so risk tiers reflect the system actually in production.",
  },
  {
    id: "tier-actions",
    scenario:
      "A high-impact system has an accurate high-risk tier, but it passes through the same checks, evidence, and monitoring as a low-risk internal tool.",
    choices: [
      "Apply tier-differentiated assurance — deeper assessment, evidence, approval, and monitoring for higher tiers — and record any accepted exceptions",
      "Treat classification as labelling with no downstream effect",
      "Apply the heaviest review to everything regardless of tier",
    ],
    best: 0,
    assurance: "Tier-differentiated assurance actions",
    feedback:
      "Classification must drive action: higher tiers need stronger assessment, evidence, approval, and monitoring, while lower tiers stay proportionate so the process remains workable.",
  },
];

export function inventoryRiskClassificationScore(answers: Record<string, number>) {
  const done = INVENTORY_RISK_CLASSIFICATION_ROUNDS.filter(
    (round) => answers[round.id] !== undefined,
  );
  return {
    attempted: done.length,
    correct: done.filter((round) => answers[round.id] === round.best).length,
    complete: done.length === INVENTORY_RISK_CLASSIFICATION_ROUNDS.length,
  };
}
