import type { System } from "./store";

export function filterInventory(systems: System[], tier: string, status: string, search: string) {
  const query = search.trim().toLowerCase();
  return systems
    .map((system, index) => ({ system, index }))
    .filter(
      ({ system }) =>
        tier === "All" ||
        (system.riskTriage
          ? (
              {
                Low: "Minimal",
                Medium: "Limited",
                High: "High-risk",
                "Prohibited-review": "Prohibited",
              } as const
            )[system.riskTriage.result.tier]
          : system.tier) === tier,
    )
    .filter(({ system }) => status === "All statuses" || system.status === status)
    .filter(({ system }) =>
      [
        system.name,
        system.owner,
        system.vendor,
        system.kind,
        system.data,
        system.status,
        system.tier,
        system.riskTriage?.result.tier ?? "",
        system.riskTriage?.result.rationale ?? "",
        system.riskTriage?.result.triggers.join(" ") ?? "",
        system.riskTriage?.result.missing_fields.join(" ") ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
}

const columns: Array<[string, (system: System) => string]> = [
  ["System", (system) => system.name],
  ["Preliminary tier", (system) => system.riskTriage?.result.tier ?? system.tier],
  [
    "Risk rule score (not a percentage)",
    (system) => (system.riskTriage ? String(system.riskTriage.result.score) : ""),
  ],
  [
    "Triage evidence status",
    (system) => system.riskTriage?.result.evidence_status ?? "Not triaged",
  ],
  ["Intended purpose", (system) => String(system.riskTriage?.profile["purpose"] ?? "")],
  ["Decision impact", (system) => String(system.riskTriage?.profile["decision_impact"] ?? "")],
  ["Affected people", (system) => String(system.riskTriage?.profile["affected_parties"] ?? "")],
  ["Data sensitivity", (system) => String(system.riskTriage?.profile["data_sensitivity"] ?? "")],
  ["Autonomy", (system) => String(system.riskTriage?.profile["autonomy"] ?? "")],
  ["Use-case domain", (system) => String(system.riskTriage?.profile["domain_category"] ?? "")],
  [
    "Tools",
    (system) =>
      Array.isArray(system.riskTriage?.profile["tools"])
        ? system.riskTriage.profile["tools"].join("; ")
        : String(system.riskTriage?.profile["tools"] ?? ""),
  ],
  [
    "Risk drivers",
    (system) =>
      system.riskTriage?.result.factors
        .filter((factor) => factor.points > 0)
        .map((factor) => `${factor.factor}: ${factor.value} (+${factor.points})`)
        .join("; ") ?? "",
  ],
  ["Review triggers", (system) => system.riskTriage?.result.triggers.join("; ") ?? ""],
  ["Suggested review modules", (system) => system.riskTriage?.result.required_modules.join("; ") ?? ""],
  ["Suggested approval authority", (system) => system.riskTriage?.result.approval_authority ?? ""],
  ["Suggested review cadence (months)", (system) => system.riskTriage ? String(system.riskTriage.result.review_cadence_months) : ""],
  ["Risk method", (system) => system.riskTriage?.result.method ?? ""],
  ["Source citation IDs", (system) => system.riskTriage?.result.citation_ids.join("; ") ?? ""],
  ["Governance status", (system) => system.status],
  ["System type", (system) => system.kind],
  ["Owner", (system) => system.owner],
  ["Vendor", (system) => system.vendor],
  ["Data classification", (system) => system.data],
];

function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function inventoryCsv(systems: System[]): string {
  return [
    columns.map(([label]) => csvCell(label)).join(","),
    ...systems.map((system) => columns.map(([, getValue]) => csvCell(getValue(system))).join(",")),
  ].join("\r\n");
}
