import { useState, type FormEvent } from "react";
import { ClipboardText, PencilSimple, Plus, WarningCircle } from "@phosphor-icons/react";
import { EmptyDecisions } from "@/features/site/illustrations-empty";
import { Button } from "@/components/ui/button";
import {
  CORRECTION_REASON_MAX,
  decisionOutcomes,
  governanceDecisionSchema,
  type GovernanceDecision,
} from "./decision-schema";
import {
  closingEvent,
  lifecycleLabel,
  sameRecordedFields,
  withdrawDecision,
} from "./decision-model";
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
const formFrom = (decision: GovernanceDecision): DecisionForm => ({
  system: decision.system,
  outcome: decision.outcome,
  decidedAt: decision.decidedAt,
  reviewBy: decision.reviewBy ?? "",
  approver: decision.approver,
  rationale: decision.rationale,
  conditions: decision.conditions,
});
const requiresReviewDate = (outcome: GovernanceDecision["outcome"]) =>
  outcome === "Risk accepted" || outcome === "Conditional approval";

/** A new current record from the form, or the first reason it is refused. */
function parseDecision(form: DecisionForm, extra: Partial<GovernanceDecision> = {}) {
  const now = new Date().toISOString();
  const parsed = governanceDecisionSchema.safeParse({
    ...form,
    reviewBy: form.reviewBy || null,
    id: crypto.randomUUID(),
    lifecycle: "Current",
    history: [{ action: "Created", changedAt: now, note: extra.correctionReason }],
    ...extra,
  });
  return parsed.success
    ? { decision: parsed.data, at: now }
    : { error: parsed.error.issues[0]?.message ?? "Check the decision fields and retry." };
}

function reviewState(decision: GovernanceDecision, todayDate: string) {
  if (decision.lifecycle !== "Current") return lifecycleLabel(decision);
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
  const [notice, setNotice] = useState("");
  const todayDate = today();
  const current = state.decisions.filter((decision) => decision.lifecycle === "Current");
  const overdue = current.filter((decision) => decision.reviewBy && decision.reviewBy < todayDate);
  const byId = new Map(state.decisions.map((decision) => [decision.id, decision]));
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
        decision.correctionReason ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return statusMatches && queryMatches;
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseDecision(form);
    if (!result.decision) {
      setError(result.error);
      return;
    }
    dispatch({ type: "decision", decision: result.decision, supersededAt: result.at });
    setStatusFilter("Current");
    setSearch("");
    setForm(blankForm());
    setError("");
    setNotice("");
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
            <option>Withdrawn</option>
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
          To fix a record that was entered wrongly, use <em>Correct this record</em> on it instead.
        </p>
        <form onSubmit={submit}>
          <DecisionFields form={form} onChange={setForm} systems={state.systems} />
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
      <p role="status" className="decision-notice">
        {notice}
      </p>
      <div className="decision-list">
        {visible.map((decision) => (
          <DecisionCard
            key={decision.id}
            decision={decision}
            corrected={decision.corrects ? byId.get(decision.corrects) : undefined}
            todayDate={todayDate}
            onDone={setNotice}
          />
        ))}
        {visible.length === 0 && (
          <div className="empty-state muted">
            <EmptyDecisions />
            <p>No decisions match this view. Record a system-level disposition to begin.</p>
          </div>
        )}
      </div>
      <p className="footnote">
        A governance disposition is an internal accountable-use record. It is not a legal approval,
        regulatory classification, safety certification or substitute for required review.
      </p>
    </>
  );
}

function DecisionFields({
  form,
  onChange,
  systems,
}: {
  form: DecisionForm;
  onChange: (form: DecisionForm) => void;
  systems: { name: string }[];
}) {
  // A correction may name a system that has since left the inventory; keep it choosable.
  const names = systems.map((system) => system.name);
  if (form.system && !names.includes(form.system)) names.push(form.system);
  return (
    <>
      <div className="decision-form-grid">
        <label>
          AI system
          <select
            required
            value={form.system}
            onChange={(event) => onChange({ ...form, system: event.target.value })}
          >
            <option value="">Choose a registered system</option>
            {names.map((name, index) => (
              <option key={`${name}-${index}`}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Governance disposition
          <select
            value={form.outcome}
            onChange={(event) =>
              onChange({ ...form, outcome: event.target.value as DecisionForm["outcome"] })
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
            onChange={(event) => onChange({ ...form, decidedAt: event.target.value })}
          />
        </label>
        <label>
          Review by{requiresReviewDate(form.outcome) ? " (required)" : ""}
          <input
            type="date"
            required={requiresReviewDate(form.outcome)}
            value={form.reviewBy}
            onChange={(event) => onChange({ ...form, reviewBy: event.target.value })}
          />
        </label>
        <label>
          Accountable approver
          <input
            required
            maxLength={120}
            value={form.approver}
            onChange={(event) => onChange({ ...form, approver: event.target.value })}
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
          onChange={(event) => onChange({ ...form, rationale: event.target.value })}
          placeholder="Summarize the evidence and factors considered; avoid sensitive personal data."
        />
      </label>
      <label>
        Conditions, controls or follow-up
        <textarea
          maxLength={4000}
          value={form.conditions}
          onChange={(event) => onChange({ ...form, conditions: event.target.value })}
          placeholder="Record restrictions, required controls, owner actions or review triggers."
        />
      </label>
    </>
  );
}

function DecisionCard({
  decision,
  corrected,
  todayDate,
  onDone,
}: {
  decision: GovernanceDecision;
  corrected: GovernanceDecision | undefined;
  todayDate: string;
  onDone: (notice: string) => void;
}) {
  const { state, dispatch } = useGovernance();
  const [mode, setMode] = useState<"view" | "correct" | "withdraw">("view");
  const [form, setForm] = useState(() => formFrom(decision));
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState("");
  const closed = closingEvent(decision);

  function close() {
    setMode("view");
    setForm(formFrom(decision));
    setReason("");
    setFailure("");
  }

  function saveCorrection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseDecision(form, {
      corrects: decision.id,
      correctionReason: reason.trim(),
    });
    if (!result.decision) {
      setFailure(result.error);
      return;
    }
    if (sameRecordedFields(result.decision, decision)) {
      setFailure("Nothing has changed. Edit the fields that were recorded wrongly.");
      return;
    }
    dispatch({ type: "decision", decision: result.decision, supersededAt: result.at });
    close();
    onDone(
      `Correction saved for ${result.decision.system}. The earlier record is kept as Corrected.`,
    );
  }

  function withdraw() {
    const at = new Date().toISOString();
    const result = withdrawDecision(decision, reason, at);
    if (result.error) {
      setFailure(result.error);
      return;
    }
    dispatch({ type: "decision-withdraw", id: decision.id, reason, at });
    close();
    onDone(`Decision for ${decision.system} withdrawn. It stays in the register as Withdrawn.`);
  }

  return (
    <article
      className={`decision-card ${decision.lifecycle !== "Current" ? "decision-superseded" : ""}`}
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
        <span className="decision-lifecycle">{lifecycleLabel(decision)}</span>
      </div>
      <p className="muted">
        Decided {decision.decidedAt} · Approver: {decision.approver} ·{" "}
        {reviewState(decision, todayDate)}
      </p>
      {decision.corrects && (
        <p className="decision-note">
          <strong>Corrects</strong>{" "}
          {corrected
            ? `the ${corrected.outcome} record for ${corrected.system} decided ${corrected.decidedAt}`
            : "an earlier record"}
          : {decision.correctionReason}
        </p>
      )}
      {closed && closed.action !== "Superseded" && closed.note && (
        <p className="decision-note">
          <strong>{closed.action === "Corrected" ? "Corrected" : "Withdrawn"}:</strong>{" "}
          {closed.note}
        </p>
      )}
      <p>
        <strong>Rationale:</strong> {decision.rationale}
      </p>
      {decision.conditions && (
        <p>
          <strong>Conditions and follow-up:</strong> {decision.conditions}
        </p>
      )}
      {decision.lifecycle === "Current" && mode === "view" && (
        <div className="decision-actions">
          <Button variant="outline" onClick={() => setMode("correct")}>
            <PencilSimple /> Correct this record…
          </Button>
          <Button variant="ghost" className="danger" onClick={() => setMode("withdraw")}>
            Withdraw…
          </Button>
        </div>
      )}
      {mode === "correct" && (
        <form
          className="decision-correction"
          onSubmit={saveCorrection}
          aria-label={`Correct the ${decision.system} decision`}
        >
          <p className="muted">
            For a record entered wrongly. Saving adds a corrected record that replaces this one;
            this record stays in the register, marked Corrected. If the decision itself has changed,
            record a new decision instead.
          </p>
          <label>
            What was wrong, and why it is being corrected
            <textarea
              required
              autoFocus
              maxLength={CORRECTION_REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example: approver recorded wrongly; review date mistyped"
            />
          </label>
          <DecisionFields form={form} onChange={setForm} systems={state.systems} />
          {failure && (
            <p role="alert" className="danger">
              {failure}
            </p>
          )}
          <div className="filters">
            <Button type="submit">
              <ClipboardText /> Save correction
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {mode === "withdraw" && (
        <div className="action-cancel">
          <p className="muted">
            Only for a record made in error, such as one entered twice. The record stays in the
            register, marked Withdrawn, and the system no longer has a current decision.
          </p>
          <label>
            Reason for withdrawing
            <textarea
              autoFocus
              maxLength={CORRECTION_REASON_MAX}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example: recorded against the wrong system, or entered twice"
            />
          </label>
          {failure && (
            <p role="alert" className="danger">
              {failure}
            </p>
          )}
          <div className="filters">
            <Button variant="destructive" onClick={withdraw}>
              Confirm withdrawal
            </Button>
            <Button variant="outline" onClick={close}>
              Keep it
            </Button>
          </div>
        </div>
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
              <time dateTime={entry.changedAt}>{new Date(entry.changedAt).toLocaleString()}</time>
              {entry.note && <span className="decision-history-note">{entry.note}</span>}
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}
