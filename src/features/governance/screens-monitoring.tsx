import { useMemo, useState, type FormEvent } from "react";
import { ArrowSquareOut, BellRinging, Gauge, Pause, Play } from "@phosphor-icons/react";
import { EmptyMonitoring } from "@/features/site/illustrations-empty";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  breachDirections,
  monitoringCadences,
  monitoringDomains,
  monitoringPlanSchema,
  monitoringObservationSchema,
  type MonitoringPlan,
} from "./monitoring-schema";
import { isThresholdBreach, monitoringState, nextMonitoringDate } from "./monitoring-model";
import { useGovernance } from "./store";

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const emptyForm = () => ({
  system: "",
  metric: "",
  domain: "Quality" as (typeof monitoringDomains)[number],
  unit: "%",
  threshold: "",
  breachDirection: breachDirections[0],
  cadence: "Monthly" as (typeof monitoringCadences)[number],
  nextDue: today(),
  owner: "",
  notes: "",
});
const safeHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

export function MonitoringScreen() {
  const { state, dispatch } = useGovernance();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const due = state.monitoringPlans.filter(
    (plan) => monitoringState(plan, today()) === "Overdue",
  ).length;
  const breaches = state.monitoringPlans.filter(
    (plan) => monitoringState(plan, today()) === "Breach",
  ).length;
  const active = state.monitoringPlans.filter((plan) => plan.status === "Active").length;
  const visible = useMemo(
    () =>
      state.monitoringPlans.filter((plan) => {
        const statusMatches = filter === "All" || plan.status === filter;
        const terms = `${plan.system} ${plan.metric} ${plan.owner} ${plan.domain}`.toLowerCase();
        return statusMatches && terms.includes(search.trim().toLowerCase());
      }),
    [filter, search, state.monitoringPlans],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const createdAt = now();
    const parsed = monitoringPlanSchema.safeParse({
      ...form,
      threshold: Number(form.threshold),
      id: crypto.randomUUID(),
      createdAt,
      status: "Active",
      observations: [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the monitoring plan fields.");
      return;
    }
    dispatch({ type: "monitor-plan", plan: parsed.data });
    setForm(emptyForm());
    setError("");
    setFilter("Active");
  }

  return (
    <>
      <section className="decision-intro" aria-label="Monitoring register scope">
        <Gauge weight="duotone" />
        <div>
          <strong>Operational monitoring records — manual observations</strong>
          <p>
            This register records human-entered checks against thresholds your organization defines.
            It does not connect to model telemetry, evaluate outcomes automatically, or establish
            that a system is safe or compliant. Use approved monitoring infrastructure for live
            alerts and retain source evidence in your records system.
          </p>
        </div>
      </section>
      <div className="decision-summary" aria-label="Monitoring summary">
        <span>
          <strong>{state.monitoringPlans.length}</strong> plans
        </span>
        <span>
          <strong>{active}</strong> active
        </span>
        <span>
          <strong>{due}</strong> overdue
        </span>
        <span>
          <strong>{breaches}</strong> latest checks in breach
        </span>
        <label>
          Show{" "}
          <select
            aria-label="Filter monitoring plans"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>Active</option>
            <option>Paused</option>
            <option>All</option>
          </select>
        </label>
        <label className="decision-search">
          Search{" "}
          <input
            aria-label="Search monitoring plans"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="System, metric, owner…"
          />
        </label>
      </div>
      <details className="decision-intake">
        <summary>
          <Gauge /> Define a monitoring plan
        </summary>
        <p className="muted">
          Use one plan per measurable signal and threshold. For each plan, document a metric your
          team can actually observe, the unit, breach direction, owner, cadence, and next review
          date. To change an approved threshold later, pause this plan and create a new one so the
          prior configuration remains visible.
        </p>
        <form onSubmit={submit}>
          <div className="decision-form-grid monitoring-form-grid">
            <label>
              AI system
              <select
                required
                value={form.system}
                onChange={(event) => setForm({ ...form, system: event.target.value })}
              >
                <option value="">Choose a registered system</option>
                {state.systems.map((system, index) => (
                  <option key={`${system.name}-${index}`}>{system.name}</option>
                ))}
              </select>
            </label>
            <label>
              Signal / metric
              <input
                required
                maxLength={160}
                value={form.metric}
                onChange={(event) => setForm({ ...form, metric: event.target.value })}
                placeholder="e.g., human override rate"
              />
            </label>
            <label>
              Monitoring domain
              <select
                value={form.domain}
                onChange={(event) =>
                  setForm({ ...form, domain: event.target.value as typeof form.domain })
                }
              >
                {monitoringDomains.map((domain) => (
                  <option key={domain}>{domain}</option>
                ))}
              </select>
            </label>
            <label>
              Unit
              <input
                required
                maxLength={40}
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
                placeholder="%, count, seconds…"
              />
            </label>
            <label>
              Breach threshold
              <input
                required
                type="number"
                step="any"
                value={form.threshold}
                onChange={(event) => setForm({ ...form, threshold: event.target.value })}
              />
            </label>
            <label>
              Breach when
              <select
                value={form.breachDirection}
                onChange={(event) =>
                  setForm({
                    ...form,
                    breachDirection: event.target.value as typeof form.breachDirection,
                  })
                }
              >
                {breachDirections.map((direction) => (
                  <option key={direction}>{direction}</option>
                ))}
              </select>
            </label>
            <label>
              Review cadence
              <select
                value={form.cadence}
                onChange={(event) =>
                  setForm({ ...form, cadence: event.target.value as typeof form.cadence })
                }
              >
                {monitoringCadences.map((cadence) => (
                  <option key={cadence}>{cadence}</option>
                ))}
              </select>
            </label>
            <label>
              Next due date
              <input
                required
                type="date"
                min={today()}
                value={form.nextDue}
                onChange={(event) => setForm({ ...form, nextDue: event.target.value })}
              />
            </label>
            <label>
              Accountable monitoring owner
              <input
                required
                maxLength={120}
                value={form.owner}
                onChange={(event) => setForm({ ...form, owner: event.target.value })}
                placeholder="Named role or person"
              />
            </label>
          </div>
          <label>
            Method, source, or escalation notes
            <textarea
              maxLength={2000}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="How is the signal measured? What evidence is retained and who is notified if it breaches?"
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <Button type="submit">
            <Gauge /> Save monitoring plan
          </Button>
        </form>
      </details>
      <div className="monitoring-list">
        {visible.map((plan) => (
          <MonitoringPlanCard
            key={plan.id}
            plan={plan}
            onObservation={(observation) =>
              dispatch({
                type: "monitor-observation",
                id: plan.id,
                observation,
                nextDue: nextMonitoringDate(observation.measuredAt, plan.cadence),
              })
            }
            onStatus={(status) => dispatch({ type: "monitor-status", id: plan.id, status })}
          />
        ))}
        {visible.length === 0 && (
          <div className="empty-state muted">
            <EmptyMonitoring />
            <p>
              No monitoring plans match this view. Define a measurable signal and accountable review
              cadence.
            </p>
          </div>
        )}
      </div>
      <p className="footnote">
        A threshold breach is a prompt for human investigation, not an automatic incident
        classification. Assess severity and any notification obligations through the appropriate
        governance and incident process.
      </p>
    </>
  );
}

function MonitoringPlanCard({
  plan,
  onObservation,
  onStatus,
}: {
  plan: MonitoringPlan;
  onObservation: (observation: MonitoringPlan["observations"][number]) => void;
  onStatus: (status: "Active" | "Paused") => void;
}) {
  const [value, setValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState(today());
  const [recordedBy, setRecordedBy] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [notes, setNotes] = useState("");
  const [observationError, setObservationError] = useState("");
  const currentState = monitoringState(plan, today());
  const latest = [...plan.observations].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0];
  const isBreach = latest ? isThresholdBreach(plan, latest.value) : false;
  const evidenceUrl = latest?.evidenceReference ? safeHttpUrl(latest.evidenceReference) : null;
  return (
    <article className={`monitor-card monitor-${currentState.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="monitor-card-head">
        <div>
          <span className={`decision-outcome ${isBreach ? "outcome-risk-accepted" : ""}`}>
            {currentState}
          </span>
          <h2>
            {plan.metric} · {plan.system}
          </h2>
        </div>
        <Button
          variant="outline"
          onClick={() => onStatus(plan.status === "Active" ? "Paused" : "Active")}
        >
          {plan.status === "Active" ? (
            <>
              <Pause /> Pause
            </>
          ) : (
            <>
              <Play /> Resume
            </>
          )}
        </Button>
      </div>
      <p className="muted">
        {plan.domain} · Owner: {plan.owner} · {plan.cadence.toLowerCase()} · Next due {plan.nextDue}
      </p>
      <p>
        <strong>Threshold:</strong> breach{" "}
        {plan.breachDirection === "At or above threshold" ? "at/above" : "at/below"}{" "}
        {plan.threshold} {plan.unit}
      </p>
      {plan.notes && (
        <p>
          <strong>Method / escalation:</strong> {plan.notes}
        </p>
      )}
      {latest && (
        <p>
          <strong>Latest manual observation:</strong> {latest.value} {plan.unit} on{" "}
          {latest.measuredAt} by {latest.recordedBy}
          {latest.evidenceReference && (
            <>
              {" "}
              ·{" "}
              {evidenceUrl ? (
                <a href={evidenceUrl} target="_blank" rel="noreferrer">
                  Evidence reference <ArrowSquareOut />
                </a>
              ) : (
                <span>Evidence reference: {latest.evidenceReference}</span>
              )}
            </>
          )}
          {latest.notes && <> · {latest.notes}</>}
        </p>
      )}
      {isBreach && (
        <div className="monitor-alert">
          <BellRinging /> Threshold breached. Investigate the result, assess affected people and
          controls, and decide whether incident response or change review is needed.{" "}
          <Link to="/incidents">Open incident register</Link>
        </div>
      )}
      <details className="decision-history">
        <summary>
          Observation history · {plan.observations.length} record
          {plan.observations.length === 1 ? "" : "s"}
        </summary>
        <ol>
          {[...plan.observations]
            .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
            .map((observation) => (
              <li key={observation.id}>
                <strong>
                  {observation.value} {plan.unit}
                </strong>{" "}
                · {observation.recordedBy}
                <time dateTime={observation.measuredAt}>{observation.measuredAt}</time>
                {observation.notes && <p>{observation.notes}</p>}
              </li>
            ))}
        </ol>
      </details>
      {plan.status === "Active" && (
        <details className="decision-intake">
          <summary>Record manual observation</summary>
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const parsed = monitoringObservationSchema.safeParse({
                id: crypto.randomUUID(),
                measuredAt,
                value: Number(value),
                recordedBy,
                evidenceReference,
                notes,
              });
              if (!parsed.success) {
                setObservationError(
                  parsed.error.issues[0]?.message ?? "Check the observation fields.",
                );
                return;
              }
              onObservation(parsed.data);
              setValue("");
              setRecordedBy("");
              setEvidenceReference("");
              setNotes("");
              setObservationError("");
            }}
          >
            <div className="decision-form-grid monitoring-form-grid">
              <label>
                Observed value ({plan.unit})
                <input
                  required
                  type="number"
                  step="any"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </label>
              <label>
                Measurement date
                <input
                  required
                  type="date"
                  max={today()}
                  value={measuredAt}
                  onChange={(event) => setMeasuredAt(event.target.value)}
                />
              </label>
              <label>
                Recorded by
                <input
                  required
                  maxLength={120}
                  value={recordedBy}
                  onChange={(event) => setRecordedBy(event.target.value)}
                />
              </label>
              <label>
                Evidence reference (optional)
                <input
                  maxLength={500}
                  value={evidenceReference}
                  onChange={(event) => setEvidenceReference(event.target.value)}
                  placeholder="Approved repository URL or record ID"
                />
              </label>
            </div>
            <label>
              Observation notes
              <textarea
                maxLength={2000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Context, sample size, limitations, follow-up or investigation record."
              />
            </label>
            {observationError && (
              <p role="alert" className="danger">
                {observationError}
              </p>
            )}
            <Button type="submit">Save observation</Button>
          </form>
        </details>
      )}
    </article>
  );
}
