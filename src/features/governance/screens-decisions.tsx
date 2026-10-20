import { useState, type FormEvent } from "react";
import { ClipboardText, Plus, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  decisionOutcomes,
  governanceDecisionSchema,
  type GovernanceDecision,
} from "./decision-schema";
import { useGovernance } from "./store";

type DecisionForm = {
  system: string;
  outcome: GovernanceDecision["outcome"];
  decidedAt: string;
  reviewBy: string;
  approver: string;
  rationale: string;
  conditions: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const blankForm = (): DecisionForm => ({
  system: "",
  outcome: "Approved",
  decidedAt: today(),
  reviewBy: "",
  approver: "",
  rationale: "",
  conditions: "",
});
const requiresReviewDate = (outcome: GovernanceDecision["outcome"]) =>
  outcome === "Risk accepted" || outcome === "Conditional approval";

function reviewState(decision: GovernanceDecision, todayDate: string) {
  if (decision.lifecycle === "Superseded") return "Superseded";
  if (!decision.reviewBy) return "No review date";
  if (decision.reviewBy < todayDate) return "Review overdue";
  return decision.reviewBy === todayDate ? "Review due today" : `Review by ${decision.reviewBy}`;
}

export function DecisionsScreen() {
  const { state, dispatch } = useGovernance();
  const [form, setForm] = useState(blankForm);
  const [statusFilter, setStatusFilter] = useState("Current");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const todayDate = today();
  const current = state.decisions.filter((decision) => decision.lifecycle === "Current");
  const overdue = current.filter((decision) => decision.reviewBy && decision.reviewBy < todayDate);
  const visible = state.decisions.filter((decision) => {
    const statusMatches = statusFilter === "All" || decision.lifecycle === statusFilter;
    const query = search.trim().toLowerCase();
    const queryMatches =
      !query ||
      [
        decision.system,
        decision.outcome,
        decision.approver,
        decision.rationale,
        decision.conditions,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return statusMatches && queryMatches;
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = governanceDecisionSchema.safeParse({
      ...form,
      reviewBy: form.reviewBy || null,
      id: crypto.randomUUID(),
      lifecycle: "Current",
      history: [{ action: "Created", changedAt: new Date().toISOString() }],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the decision fields and retry.");
      return;
    }
    dispatch({
      type: "decision",
      decision: parsed.data,
      supersededAt: new Date().toISOString(),
    });
    setStatusFilter("Current");
    setSearch("");
    setForm(blankForm());
    setError("");
  }

  return (
    <>
      <section className="decision-intro" aria-label="Governance decision guidance">
        <WarningCircle weight="duotone" />
        <div>
          <strong>Accountable use decisions</strong>
          <p>
            Record an internal disposition for each AI system, the accountable approver, the
            rationale, any conditions and the next review date. These records do not determine legal
            classification or replace qualified legal, safety, privacy or security review.
          </p>
        </div>
      </section>
      <div className="decision-summary" aria-label="Decision register summary">
        <span>
          <strong>{state.decisions.length}</strong> recorded decisions
        </span>
        <span>
          <strong>{current.length}</strong> current
        </span>
        <span>
          <strong>{overdue.length}</strong> review overdue
        </span>
        <label>
          Show
          <select
            aria-label="Filter decisions by lifecycle"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>Current</option>
            <option>Superseded</option>
            <option>All</option>
          </select>
        </label>
        <label className="decision-search">
          Search
          <input
            aria-label="Search decisions"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="System, approver, rationale…"
          />
        </label>
      </div>
      <details className="decision-intake">
        <summary>
          <Plus /> Record or replace a system decision
        </summary>
        <p className="muted">
          A new decision for a system supersedes its previous current decision and retains that
          earlier record in history. Risk acceptance and conditional approval require a review date.
        </p>
        <form onSubmit={submit}>
          <div className="decision-form-grid">
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
              Governance disposition
              <select
                value={form.outcome}
                onChange={(event) =>
                  setForm({ ...form, outcome: event.target.value as DecisionForm["outcome"] })
                }
              >
                {decisionOutcomes.map((outcome) => (
                  <option key={outcome}>{outcome}</option>
                ))}
              </select>
            </label>
            <label>
              Decision date
              <input
                required
                type="date"
                value={form.decidedAt}
                onChange={(event) => setForm({ ...form, decidedAt: event.target.value })}
              />
            </label>
            <label>
              Review by{requiresReviewDate(form.outcome) ? " (required)" : ""}
              <input
                type="date"
                required={requiresReviewDate(form.outcome)}
                value={form.reviewBy}
                onChange={(event) => setForm({ ...form, reviewBy: event.target.value })}
              />
            </label>
            <label>
              Accountable approver
              <input
                required
                maxLength={120}
                value={form.approver}
                onChange={(event) => setForm({ ...form, approver: event.target.value })}
                placeholder="Named role or accountable person"
              />
            </label>
          </div>
          <label>
            Decision rationale
            <textarea
              required
              maxLength={4000}
              value={form.rationale}
              onChange={(event) => setForm({ ...form, rationale: event.target.value })}
              placeholder="Summarize the evidence and factors considered; avoid sensitive personal data."
            />
          </label>
          <label>
            Conditions, controls or follow-up
            <textarea
              maxLength={4000}
              value={form.conditions}
              onChange={(event) => setForm({ ...form, conditions: event.target.value })}
              placeholder="Record restrictions, required controls, owner actions or review triggers."
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <Button type="submit">
            <ClipboardText /> Save governance decision
          </Button>
        </form>
      </details>
      <div className="decision-list">
        {visible.map((decision) => (
          <article
            className={`decision-card ${decision.lifecycle === "Superseded" ? "decision-superseded" : ""}`}
            key={decision.id}
          >
            <div className="decision-card-heading">
              <div>
                <span
                  className={`decision-outcome outcome-${decision.outcome.toLowerCase().replaceAll(" ", "-")}`}
                >
                  {decision.outcome}
                </span>
                <h2>{decision.system}</h2>
              </div>
              <span className="decision-lifecycle">{decision.lifecycle}</span>
            </div>
            <p className="muted">
              Decided {decision.decidedAt} · Approver: {decision.approver} ·{" "}
              {reviewState(decision, todayDate)}
            </p>
            <p>
              <strong>Rationale:</strong> {decision.rationale}
            </p>
            {decision.conditions && (
              <p>
                <strong>Conditions and follow-up:</strong> {decision.conditions}
              </p>
            )}
            <details className="decision-history">
              <summary>
                Record history · {decision.history.length} event
                {decision.history.length === 1 ? "" : "s"}
              </summary>
              <ol>
                {decision.history.map((entry, index) => (
                  <li key={`${entry.changedAt}-${index}`}>
                    <strong>{entry.action}</strong>
                    <time dateTime={entry.changedAt}>
                      {new Date(entry.changedAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
        {visible.length === 0 && (
          <p className="empty-state muted">
            No decisions match this view. Record a system-level disposition to begin.
          </p>
        )}
      </div>
      <p className="footnote">
        A governance disposition is an internal accountable-use record. It is not a legal approval,
        regulatory classification, safety certification or substitute for required review.
      </p>
    </>
  );
}
