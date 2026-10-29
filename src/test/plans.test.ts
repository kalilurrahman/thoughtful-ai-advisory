import { describe, expect, it } from "vitest";
import { PLANS, getPlan, type PlanLimits } from "@/data/plans";

// Plan catalogue (src/data/plans.ts): one source for the Plans screen and billing entitlements.

describe("plan catalogue", () => {
  it("lists Free, Team, Business and Enterprise in ascending order", () => {
    expect(PLANS.map((p) => p.id)).toEqual(["free", "team", "business", "enterprise"]);
  });

  it("never grants less on a higher plan", () => {
    const numeric: (keyof PlanLimits)[] = [
      "operatorSeats",
      "aiSystems",
      "workspaces",
      "advisorPerDay",
      "evidenceStorageMb",
    ];
    PLANS.slice(1).forEach((plan, i) => {
      for (const key of numeric)
        expect(plan.limits[key], `${plan.id}.${key}`).toBeGreaterThanOrEqual(
          PLANS[i]!.limits[key] as number,
        );
    });
  });

  it("publishes no price figures, which need commercial approval", () => {
    for (const p of PLANS) expect(p.priceLabel).not.toMatch(/[$€£₹]|\d/);
  });

  it("sells only Team and Business through self-serve checkout", () => {
    expect(PLANS.filter((p) => p.selfServe).map((p) => p.id)).toEqual(["team", "business"]);
    expect(() => getPlan("gold" as never)).toThrow(/Unknown plan/);
  });
});
