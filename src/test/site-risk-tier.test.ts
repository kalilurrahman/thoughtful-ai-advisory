import { describe, expect, it } from "vitest";
import { calculateRiskTier } from "@/features/site/engines/risk-tier";
import fixtures from "./fixtures/risk-tier-parity.json";

interface RiskCase {
  id: string;
  profile: Record<string, unknown>;
  expected: unknown;
}

const cases = (fixtures as { cases: RiskCase[] }).cases;

describe("risk tier engine parity with aegis_assessment.risk_tier", () => {
  it("has fixtures", () => {
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });

  it.each(cases.map((c) => [c.id, c] as const))("%s matches the Python reference", (_id, c) => {
    expect(calculateRiskTier(c.profile)).toEqual(c.expected);
  });

  it("always labels the tier Inferred and requires human confirmation", () => {
    for (const c of cases) {
      const r = calculateRiskTier(c.profile);
      expect(r.evidence_status).toBe("Inferred");
      expect(r.requires_human_confirmation).toBe(true);
      expect(r.rationale).toContain("requires human confirmation");
    }
  });

  it("does not mutate the input profile", () => {
    const profile = { name: "x", tools: ["send_email"] };
    calculateRiskTier(profile);
    expect(profile).toEqual({ name: "x", tools: ["send_email"] });
  });
});
