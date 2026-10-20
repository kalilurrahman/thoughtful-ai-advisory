import type { System } from "@/data/governance";

export function filterInventory(systems: System[], tier: string, status: string, search: string) {
  const query = search.trim().toLowerCase();
  return systems
    .map((system, index) => ({ system, index }))
    .filter(({ system }) => tier === "All" || system.tier === tier)
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
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
}

const columns: Array<[string, keyof System]> = [
  ["System", "name"],
  ["Risk tier", "tier"],
  ["Governance status", "status"],
  ["System type", "kind"],
  ["Owner", "owner"],
  ["Vendor", "vendor"],
  ["Data classification", "data"],
];

function csvCell(value: string): string {
  const safe = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function inventoryCsv(systems: System[]): string {
  return [
    columns.map(([label]) => csvCell(label)).join(","),
    ...systems.map((system) => columns.map(([, key]) => csvCell(system[key])).join(",")),
  ].join("\r\n");
}
