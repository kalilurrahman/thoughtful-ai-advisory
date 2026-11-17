import { describe, expect, it } from "vitest";
import { OBLIGATION_AREAS, checkActReadiness } from "@/features/site/engines/eu-ai-act-readiness";
import { getControl } from "@/features/site/content";

const allYes = Object.fromEntries(OBLIGATION_AREAS.map((o) => [o.key, "yes"])) as Record<
  string,
  "yes"
>;

const byKey = (r: ReturnType<typeof checkActReadiness>, key: string) =>
  r.obligations.find((o) => o.key === key)!;

describe("EU AI Act readiness checker engine", () => {
  it("cites only controls that exist in the library", () => {
    for (const o of OBLIGATION_AREAS)
      for (const id of o.controls) expect(getControl(id)).toBeDefined();
    for (const id of checkActReadiness({}).citation_ids) expect(getControl(id)).toBeDefined();
  });

  it("shows the Article 9–15 areas as applicable to a provider of a high-risk-like system", () => {
    const r = checkActReadiness({
      name: "Hiring screener",
      role: "provider",
      eu_exposure: "yes",
      domain_category: "employment",
      decision_impact: "material",
      ...allYes,
    });
    expect(r.screening.high_risk_like).toBe(true);
    expect(r.screening.high_risk_reasons[0]).toContain("Employment");
    expect(byKey(r, "risk_management").applicability).toBe("Applies");
    expect(byKey(r, "deployer_duties").applicability).toBe("Not triggered on these facts");
    expect(byKey(r, "transparency_people").applicability).toBe("Not triggered on these facts");
    expect(r.readiness_pct).toBe(100);
    expect(r.requires_legal_review).toBe(true);
    expect(r.evidence_status).toBe("Inferred");
  });

  it("routes provider obligations through the provider for a deployer", () => {
    const r = checkActReadiness({
      name: "Credit model from a vendor",
      role: "deployer",
      domain_category: "credit",
      deployer_duties: "partial",
      literacy: "no",
      documentation: "no",
    });
    expect(byKey(r, "documentation").applicability).toBe("Applies via your provider");
    expect(byKey(r, "documentation").status).toBe("Missing evidence");
    expect(byKey(r, "deployer_duties").applicability).toBe("Applies");
    expect(byKey(r, "deployer_duties").status).toBe("Inferred");
    expect(byKey(r, "literacy").status).toBe("Critical gap");
    expect(
      r.next_steps.some((s) =>
        s.includes("Ask your provider for evidence of Technical documentation"),
      ),
    ).toBe(true);
    expect(r.next_steps.some((s) => s.includes("Close the gap in AI literacy"))).toBe(true);
  });

  it("treats the high-risk areas as voluntary when no screen is triggered", () => {
    const r = checkActReadiness({
      name: "Internal summariser",
      role: "both",
      eu_exposure: "no",
      domain_category: "internal_productivity",
      decision_impact: "none",
      genai: "yes",
      literacy: "yes",
      incidents: "yes",
      transparency_people: "partial",
    });
    expect(r.screening.high_risk_like).toBe(false);
    expect(byKey(r, "risk_management").applicability).toBe("Voluntary on these facts");
    expect(byKey(r, "transparency_people").applicability).toBe("Applies");
    // Applicable: literacy, incidents, transparency to people -> 2 + 2 + 1 of 6 points.
    expect(r.applicable_count).toBe(3);
    expect(r.readiness_pct).toBe(83);
    expect(r.rationale).toContain("the Act may not apply");
    expect(r.requires_legal_review).toBe(false);
  });

  it("flags prohibited-practice terms in the purpose for legal review first", () => {
    const r = checkActReadiness({
      name: "Scorer",
      purpose: "Builds a social score for citizens from their online behaviour",
      role: "provider",
    });
    expect(r.screening.prohibited_flags).toEqual(["Social scoring"]);
    expect(r.requires_legal_review).toBe(true);
    expect(r.next_steps[0]).toContain("AO-10");
  });

  it("does not mutate the input and defaults the name", () => {
    const profile = { role: "provider", literacy: "yes" as const };
    const r = checkActReadiness(profile);
    expect(profile).toEqual({ role: "provider", literacy: "yes" });
    expect(r.name).toBe("Unnamed system");
    expect(r.rationale).toContain("not a legal classification");
  });
});
