import type { AIIncident } from "./store";

export type IncidentFilters = {
  status: string;
  severity: string;
  system: string;
  search: string;
};

export function filterIncidents(incidents: AIIncident[], filters: IncidentFilters) {
  const query = filters.search.trim().toLowerCase();
  return incidents.filter((incident) => {
    const active = incident.status !== "Resolved" && incident.status !== "Closed";
    const statusMatches =
      filters.status === "All"
        ? true
        : filters.status === "Active"
          ? active
          : incident.status === filters.status;
    const severityMatches =
      filters.severity === "All severities" || incident.severity === filters.severity;
    const systemMatches = filters.system === "All systems" || incident.system === filters.system;
    const searchMatches =
      !query ||
      [incident.title, incident.system, incident.category, incident.owner, incident.summary]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return statusMatches && severityMatches && systemMatches && searchMatches;
  });
}
