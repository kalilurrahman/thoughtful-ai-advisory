import { describe, expect, it } from "vitest";
import type { System } from "@/data/governance";
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
    expect(inventoryCsv([system])).toBe(
      '"System","Risk tier","Governance status","System type","Owner","Vendor","Data classification"\r\n"Assistant, ""North""\nline 2","Limited","Under review","Assistant","Product","In-house","Internal"',
    );
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
});
