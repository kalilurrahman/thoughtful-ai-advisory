/** Portable, deterministic assurance planner. No React, database, or vendor dependencies. */
export type AssuranceDomain = "healthcare" | "pharma" | "gcc" | "general";
export type AssuranceInput = {
  domain: AssuranceDomain;
  lifecycle: "design" | "pilot" | "production" | "retired";
  handlesPersonalData: boolean;
  affectsPeople: boolean;
  autonomousActions: boolean;
  externalRegulation: boolean;
  hasNamedOwner: boolean;
  hasIncidentPlan: boolean;
  hasMonitoring: boolean;
  hasHumanOverride: boolean;
};
export type AssuranceTask = { id: string; priority: "critical" | "high" | "standard"; rationale: string };

const TASKS: Record<string, Omit<AssuranceTask, "id">> = {
  owner: { priority: "critical", rationale: "Assign one accountable business owner and a technical operator." },
  impact: { priority: "high", rationale: "Document affected people, foreseeable harms, and accessible recourse." },
  privacy: { priority: "high", rationale: "Record data purpose, lawful basis, minimization, retention, and access." },
  human: { priority: "critical", rationale: "Define meaningful human review, override authority, and escalation." },
  monitor: { priority: "high", rationale: "Set measurable performance, safety, drift, and incident thresholds." },
  incident: { priority: "high", rationale: "Prepare containment, notification, evidence preservation, and recovery steps." },
  regulation: { priority: "critical", rationale: "Have qualified counsel or compliance owners confirm applicable obligations." },
  validate: { priority: "high", rationale: "Validate intended use, subgroup performance, limitations, and failure modes before release." },
  clinical: { priority: "critical", rationale: "For healthcare use, verify clinical safety, qualified oversight, and applicable device / care pathways." },
  gxp: { priority: "critical", rationale: "For pharma use, determine GxP impact, validation evidence, change control, and data integrity requirements." },
  transfer: { priority: "high", rationale: "For GCC/shared services, map cross-border data flows, controller/processor roles, and service accountability." },
};

/** Produces explainable next actions, not a legal classification or approval decision. */
export function buildAssurancePlan(input: AssuranceInput): AssuranceTask[] {
  const ids = new Set<string>();
  if (!input.hasNamedOwner) ids.add("owner");
  if (input.affectsPeople) ids.add("impact");
  if (input.handlesPersonalData) ids.add("privacy");
  if (input.autonomousActions || input.affectsPeople) ids.add("human");
  if (input.lifecycle === "pilot" || input.lifecycle === "production") ids.add("validate");
  if (!input.hasMonitoring && input.lifecycle === "production") ids.add("monitor");
  if (!input.hasIncidentPlan && input.lifecycle !== "retired") ids.add("incident");
  if (input.externalRegulation) ids.add("regulation");
  if (input.domain === "healthcare") ids.add("clinical");
  if (input.domain === "pharma") ids.add("gxp");
  if (input.domain === "gcc") ids.add("transfer");
  return [...ids].map((id) => ({ id, ...TASKS[id]! })).sort((a, b) => ({ critical: 0, high: 1, standard: 2 }[a.priority] - { critical: 0, high: 1, standard: 2 }[b.priority] || a.id.localeCompare(b.id)));
}
