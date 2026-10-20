import { useState, type FormEvent } from "react";
import { Plus, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { AIIncident } from "./store";
import { useGovernance } from "./store";
import { filterIncidents } from "./incident-filters";

const severities: AIIncident["severity"][] = ["Critical", "High", "Moderate", "Low"];
const statuses: AIIncident["status"][] = ["Open", "Triage", "Contained", "Resolved", "Closed"];
const categories = [
  "Safety or harmful output",
  "Privacy or data exposure",
  "Security or abuse",
  "Bias or affected-person harm",
  "Misuse or unauthorised action",
  "Availability or service disruption",
  "Misinformation or integrity",
  "Near miss",
  "Other",
];

const blankIncident = (): Omit<AIIncident, "id"> => ({
  title: "",
  system: "",
  severity: "Moderate",
  category: categories[0],
  status: "Open",
  detectedAt: new Date().toISOString().slice(0, 10),
  owner: "",
  summary: "",
  response: "",
  statusHistory: [],
});

export function IncidentsScreen() {
  const { state, dispatch } = useGovernance();
  const [form, setForm] = useState(blankIncident);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [severityFilter, setSeverityFilter] = useState("All severities");
  const [systemFilter, setSystemFilter] = useState("All systems");
  const [search, setSearch] = useState("");

  function submitIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({
      type: "incident",
      incident: {
        ...form,
        id: crypto.randomUUID(),
        statusHistory: [{ status: form.status, changedAt: new Date().toISOString() }],
      },
    });
    setForm(blankIncident());
  }

  const activeCount = state.incidents.filter(
    (incident) => incident.status !== "Resolved" && incident.status !== "Closed",
  ).length;
  const visibleIncidents = filterIncidents(state.incidents, {
    status: statusFilter,
    severity: severityFilter,
    system: systemFilter,
    search,
  });

  return (
    <>
      <section className="incident-intro" aria-label="Incident register context">
        <WarningCircle weight="duotone" />
        <div>
          <strong>Operational incident log</strong>
          <p>
            Record incidents and near misses, assign response ownership, and track containment
            through closure. Assess safety, privacy, security and external notification duties with
            qualified owners.
          </p>
        </div>
      </section>
      <div className="incident-summary">
        <span>
          <strong>{state.incidents.length}</strong> total records
        </span>
        <span>
          <strong>{activeCount}</strong> active
        </span>
        <span>
          <strong>
            {
              state.incidents.filter(
                (incident) =>
                  incident.severity === "Critical" &&
                  incident.status !== "Resolved" &&
                  incident.status !== "Closed",
              ).length
            }
          </strong>{" "}
          critical active
        </span>
        <label>
          Show
          <select
            aria-label="Filter incidents by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>Active</option>
            <option>All</option>
            {statuses
              .filter((status) => status === "Resolved" || status === "Closed")
              .map((status) => (
                <option key={status}>{status}</option>
              ))}
          </select>
        </label>
        <label>
          Severity
          <select
            aria-label="Filter incidents by severity"
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          >
            <option>All severities</option>
            {severities.map((severity) => (
              <option key={severity}>{severity}</option>
            ))}
          </select>
        </label>
        <label>
          System
          <select
            aria-label="Filter incidents by system"
            value={systemFilter}
            onChange={(event) => setSystemFilter(event.target.value)}
          >
            <option>All systems</option>
            {Array.from(
              new Set(state.incidents.map((incident) => incident.system).filter(Boolean)),
            ).map((system) => (
              <option key={system}>{system}</option>
            ))}
          </select>
        </label>
        <label className="incident-search">
          Search
          <input
            aria-label="Search incidents"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, category, owner…"
          />
        </label>
      </div>
      <details className="incident-intake">
        <summary>
          <Plus /> Log an incident or near miss
        </summary>
        <form onSubmit={submitIncident}>
          <label>
            Incident title
            <input
              required
              maxLength={160}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Brief, non-sensitive summary"
            />
          </label>
          <div className="incident-form-grid">
            <label>
              Affected AI system
              <select
                value={form.system}
                onChange={(event) => setForm({ ...form, system: event.target.value })}
              >
                <option value="">Unknown or not yet linked</option>
                {state.systems.map((system, index) => (
                  <option key={`${system.name}-${index}`} value={system.name}>
                    {system.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severity
              <select
                value={form.severity}
                onChange={(event) =>
                  setForm({ ...form, severity: event.target.value as AIIncident["severity"] })
                }
              >
                {severities.map((severity) => (
                  <option key={severity}>{severity}</option>
                ))}
              </select>
            </label>
            <label>
              Incident category
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Detected date
              <input
                required
                type="date"
                value={form.detectedAt}
                onChange={(event) => setForm({ ...form, detectedAt: event.target.value })}
              />
            </label>
            <label>
              Response owner
              <input
                maxLength={120}
                value={form.owner}
                onChange={(event) => setForm({ ...form, owner: event.target.value })}
                placeholder="Accountable role or team"
              />
            </label>
          </div>
          <label>
            Initial summary
            <textarea
              required
              maxLength={5000}
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              placeholder="Describe observed impact and scope. Avoid placing secrets or unnecessary personal data here."
            />
          </label>
          <label>
            Containment and response notes
            <textarea
              maxLength={5000}
              value={form.response}
              onChange={(event) => setForm({ ...form, response: event.target.value })}
              placeholder="Record immediate actions, evidence preservation and escalation owners."
            />
          </label>
          <Button type="submit">
            <Plus />
            Save incident
          </Button>
        </form>
      </details>
      <div className="incident-list">
        {visibleIncidents.map((incident) => (
          <article className="incident-card" key={incident.id}>
            <div className="incident-card-heading">
              <div>
                <span className={`incident-severity severity-${incident.severity.toLowerCase()}`}>
                  {incident.severity}
                </span>
                <h2>{incident.title}</h2>
              </div>
              <label>
                Status
                <select
                  aria-label={`Status for ${incident.title}`}
                  value={incident.status}
                  onChange={(event) =>
                    dispatch({
                      type: "update-incident",
                      incident: { ...incident, status: event.target.value as AIIncident["status"] },
                      changedAt: new Date().toISOString(),
                    })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted">
              {incident.category} · {incident.system || "System not yet identified"} · Detected{" "}
              {incident.detectedAt}
              {incident.owner ? ` · Owner: ${incident.owner}` : " · Owner unassigned"}
            </p>
            <p>{incident.summary}</p>
            {incident.response && (
              <p className="incident-response">
                <strong>Response notes:</strong> {incident.response}
              </p>
            )}
            <details className="incident-history">
              <summary>Update ownership and response notes</summary>
              <form
                className="incident-edit-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  dispatch({
                    type: "edit-incident",
                    incident: {
                      ...incident,
                      owner: String(data.get("owner") ?? "").trim(),
                      response: String(data.get("response") ?? "").trim(),
                    },
                  });
                }}
              >
                <label>
                  Response owner
                  <input
                    name="owner"
                    maxLength={120}
                    defaultValue={incident.owner}
                    placeholder="Accountable role or team"
                  />
                </label>
                <label>
                  Containment and response notes
                  <textarea name="response" maxLength={5000} defaultValue={incident.response} />
                </label>
                <Button type="submit">Save incident updates</Button>
              </form>
            </details>
            <details className="incident-history">
              <summary>
                Lifecycle history · {incident.statusHistory.length} event
                {incident.statusHistory.length === 1 ? "" : "s"}
              </summary>
              <ol>
                {incident.statusHistory.map((entry, index) => (
                  <li key={`${entry.changedAt}-${index}`}>
                    <strong>{entry.status}</strong>
                    <time dateTime={entry.changedAt}>
                      {new Date(entry.changedAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
        {visibleIncidents.length === 0 && (
          <p className="empty-state muted">
            No incidents in this view. Record incidents and near misses here to support response
            coordination and learning.
          </p>
        )}
      </div>
      <p className="footnote">
        This is an internal operational register, not an incident-reporting service or legal
        determination. Use established security, safety and privacy channels for urgent response.
      </p>
    </>
  );
}
