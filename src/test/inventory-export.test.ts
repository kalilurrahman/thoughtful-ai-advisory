import { describe, expect, it } from "vitest";
import type { System } from "@/features/governance/store";
import { calculateRiskTier } from "@/features/site/engines/risk-tier";
import { filterInventory, inventoryCsv } from "@/features/governance/inventory-export";

describe("AI inventory CSV export", () => {
  it("exports headers and escapes commas, quotes and line breaks", () => {
    const system: System = {
      name: 'Assistant, "North"\nline 2',
      tier: "Limited",
      status: "Under review",
      kind: "Assistant",
      owner: "Product",
      vendor: "In-house",
      data: "Internal",
    };
    const csv = inventoryCsv([system]);
    expect(csv).toContain('"Preliminary tier"');
    expect(csv).toContain('"Triage evidence status"');
    expect(csv).toContain('"Assistant, ""North""\nline 2"');
    expect(csv).toContain('"Not triaged"');
  });

  it("neutralizes spreadsheet formula prefixes and supports an empty inventory", () => {
    const system: System = {
      name: '=HYPERLINK("https://example.com")',
      tier: "Minimal",
      status: "Approved",
      kind: "Assistant",
      owner: "+SUM(1,1)",
      vendor: "Vendor",
      data: "Internal",
    };
    expect(inventoryCsv([system])).toContain("'=HYPERLINK(");
    expect(inventoryCsv([system])).toContain("'+SUM(1,1)");
    expect(inventoryCsv([]).split("\r\n")).toHaveLength(1);
  });

  it("combines tier, status and case-insensitive search while retaining source indexes", () => {
    const systems: System[] = [
      {
        name: "Hiring assistant",
        tier: "High-risk",
        status: "Under review",
        kind: "Decision support",
        owner: "People",
        vendor: "North",
        data: "Personal",
      },
      {
        name: "Support bot",
        tier: "Limited",
        status: "Approved",
        kind: "Chat",
        owner: "Care",
        vendor: "In-house",
        data: "Public",
      },
      {
        name: "Credit model",
        tier: "High-risk",
        status: "Approved",
        kind: "Scoring",
        owner: "Finance",
        vendor: "South",
        data: "Personal",
      },
    ];
    expect(filterInventory(systems, "High-risk", "Approved", "FINANCE")).toEqual([
      { system: systems[2], index: 2 },
    ]);
    expect(
      filterInventory(systems, "All", "All statuses", "personal").map(({ index }) => index),
    ).toEqual([0, 2]);
  });

  it("filters and exports saved inferred triage details without treating them as approval", () => {
    const result = calculateRiskTier({
      name: "Patient prioritization",
      purpose: "Prioritize patient referrals",
      decision_impact: "material",
      affected_parties: "vulnerable",
      data_sensitivity: "special_category",
      autonomy: "suggests",
      domain_category: "healthcare",
      eu_exposure: "yes",
      vendor_model: "yes",
      genai: "no",
    });
    const system: System = {
      name: "Patient prioritization",
      tier: "High-risk",
      status: "Under review",
      kind: "Decision support",
      owner: "Clinical safety",
      vendor: "Vendor",
      data: "Health",
      riskTriage: {
        profile: { name: "Patient prioritization", purpose: "Prioritize patient referrals" },
        result,
        assessedAt: "2026-10-23T00:00:00.000Z",
      },
    };

    expect(filterInventory([system], "High-risk", "Under review", "vulnerable")).toHaveLength(1);
    expect(inventoryCsv([system])).toContain('"Inferred"');
    expect(inventoryCsv([system])).toContain('"Patient prioritization"');
  });
});
