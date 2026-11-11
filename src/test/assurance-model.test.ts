import { describe, expect, it } from "vitest";
import { buildAssurancePlan, type AssuranceInput } from "@/features/governance/assurance-model";

const baseline: AssuranceInput = { domain: "general", lifecycle: "production", handlesPersonalData: true, affectsPeople: true, autonomousActions: false, externalRegulation: true, hasNamedOwner: false, hasIncidentPlan: false, hasMonitoring: false, hasHumanOverride: false };

describe("standalone assurance planner", () => {
  it("returns sorted, explainable actions for production systems", () => {
    const tasks = buildAssurancePlan(baseline);
    expect(tasks.map((task) => task.id)).toEqual(["human", "owner", "regulation", "impact", "incident", "monitor", "privacy", "validate"]);
    expect(tasks.every((task) => task.rationale.length > 20)).toBe(true);
  });
  it("adds tailored healthcare, pharma, and GCC safeguards", () => {
    for (const [domain, task] of [["healthcare", "clinical"], ["pharma", "gxp"], ["gcc", "transfer"]] as const) {
      expect(buildAssurancePlan({ ...baseline, domain }).some((item) => item.id === task)).toBe(true);
    }
  });
  it("does not treat retired systems as needing a new incident plan", () => {
    expect(buildAssurancePlan({ ...baseline, lifecycle: "retired", hasIncidentPlan: false }).some((task) => task.id === "incident")).toBe(false);
  });
});
