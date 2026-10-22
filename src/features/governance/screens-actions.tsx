import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle, ClipboardText, Plus, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  correctiveActionSchema,
  correctiveActionSources,
  correctiveActionPriorities,
  type CorrectiveAction,
} from "./actions-schema";
import { correctiveActionState } from "./actions-model";
import { useGovernance } from "./store";

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

export function ActionsScreen() {
  const { state, dispatch } = useGovernance();
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Open work");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    system: "",
    source: "Incident" as (typeof correctiveActionSources)[number],
    sourceReference: "",
    priority: "Moderate" as (typeof correctiveActionPriorities)[number],
    owner: "",
    dueDate: today(),
  });
  const open = state.correctiveActions.filter((a) => !["Closed", "Cancelled"].includes(a.status));
  const overdue = open.filter(
    (a) => a.dueDate < today() && a.status !== "Pending verification",
  ).length;
  const verify = open.filter((a) => a.status === "Pending verification").length;
  const visible = useMemo(
    () =>
      state.correctiveActions.filter((a) => {
        const matchStatus =
          filter === "All" ||
          (filter === "Open work"
            ? !["Closed", "Cancelled"].includes(a.status)
            : a.status === filter);
        return (
          matchStatus &&
          `${a.title} ${a.system} ${a.owner} ${a.source} ${a.description}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        );
      }),
    [filter, query, state.correctiveActions],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stamp = now();
    const result = correctiveActionSchema.safeParse({
      ...form,
      id: crypto.randomUUID(),
      status: "Open",
      createdAt: stamp,
      updatedAt: stamp,
      completionEvidence: "",
      verificationNote: "",
      verifiedBy: "",
      verifiedAt: null,
      history: [
        { status: "Open", changedAt: stamp, actor: "Action owner", note: "Action created" },
      ],
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the action fields.");
      return;
    }
    dispatch({ type: "corrective-action", action: result.data });
    setForm({ ...form, title: "", description: "", sourceReference: "", owner: "" });
    setError("");
  }

  return (
    <>
      <section className="decision-intro" aria-label="Corrective action workflow">
        <ClipboardText weight="duotone" />
        <div>
          <strong>Corrective and preventive action register</strong>
          <p>
            Turn incidents, monitoring signals, change reviews and assessment findings into owned
            work. Closure requires completion evidence and a separate effectiveness verification;
            this tracker does not determine regulatory reporting obligations.
          </p>
        </div>
      </section>
      <div className="decision-summary" aria-label="Action summary">
        <span>
          <strong>{state.correctiveActions.length}</strong> total actions
        </span>
        <span>
          <strong>{open.length}</strong> open
        </span>
        <span>
          <strong>{overdue}</strong> overdue
        </span>
        <span>
          <strong>{verify}</strong> need verification
        </span>
        <label>
          Show{" "}
          <select
            aria-label="Filter corrective actions"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>Open work</option>
            <option>All</option>
            <option>Open</option>
            <option>In progress</option>
            <option>Pending verification</option>
            <option>Closed</option>
            <option>Cancelled</option>
          </select>
        </label>
        <label className="decision-search">
          Search{" "}
          <input
            type="search"
            aria-label="Search corrective actions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Action, system, owner…"
          />
        </label>
      </div>
      <details className="decision-intake">
        <summary>
          <Plus /> Create corrective action
        </summary>
        <form onSubmit={submit}>
          <div className="decision-form-grid">
            <label>
              Action title
              <input
                required
                maxLength={160}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              AI system
              <select
                required
                value={form.system}
                onChange={(e) => setForm({ ...form, system: e.target.value })}
              >
                <option value="">Choose registered system</option>
                {state.systems.map((s, i) => (
                  <option key={`${s.name}-${i}`}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              Finding source
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as typeof form.source })}
              >
                {correctiveActionSources.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Source reference
              <input
                maxLength={200}
                value={form.sourceReference}
                onChange={(e) => setForm({ ...form, sourceReference: e.target.value })}
                placeholder="Incident ID, plan or finding"
              />
            </label>
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as typeof form.priority })
                }
              >
                {correctiveActionPriorities.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              Accountable owner
              <input
                required
                maxLength={120}
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </label>
          </div>
          <label>
            Required correction / prevention
            <textarea
              required
              maxLength={4000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the root cause or risk addressed, action, and intended outcome."
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <Button type="submit">
            <Plus /> Save action
          </Button>
        </form>
      </details>
      <div className="monitoring-list">
        {visible.map((action) => (
          <ActionCard key={action.id} action={action} dispatch={dispatch} />
        ))}
        {visible.length === 0 && (
          <p className="empty-state muted">No corrective actions match this view.</p>
        )}
      </div>
      <p className="footnote">
        For good separation of duties, the verifier should not be the person who performed the
        corrective work. Keep source evidence in your approved records system.
      </p>
    </>
  );
}

function ActionCard({
  action,
  dispatch,
}: {
  action: CorrectiveAction;
  dispatch: ReturnType<typeof useGovernance>["dispatch"];
}) {
  const [completionEvidence, setEvidence] = useState(action.completionEvidence);
  const [actor, setActor] = useState("");
  const [note, setNote] = useState("");
  const [failure, setFailure] = useState("");
  const stage = correctiveActionState(action, today());
  const transition = (status: CorrectiveAction["status"]) => {
    const stamp = now();
    dispatch({
      type: "transition-corrective-action",
      id: action.id,
      status,
      actor: actor.trim() || "Unspecified role",
      note,
      changedAt: stamp,
    });
    setFailure("");
  };
  return (
    <article className={`monitor-card monitor-${stage.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="monitor-card-head">
        <div>
          <span className="decision-outcome">{stage}</span>
          <h2>{action.title}</h2>
        </div>
        <span className="action-priority">{action.priority}</span>
      </div>
      <p className="muted">
        {action.system} · {action.source}
        {action.sourceReference && ` · Ref: ${action.sourceReference}`} · Owner: {action.owner} ·
        Due {action.dueDate}
      </p>
      <p>{action.description}</p>
      {action.completionEvidence && (
        <p>
          <strong>Completion evidence:</strong> {action.completionEvidence}
        </p>
      )}
      {action.status === "Pending verification" && (
        <div className="monitor-alert">
          <WarningCircle /> Independent effectiveness review is required before closure.
        </div>
      )}
      {action.status === "Closed" && (
        <p>
          <CheckCircle /> Verified by {action.verifiedBy} on {action.verifiedAt?.slice(0, 10)} ·{" "}
          {action.verificationNote}
        </p>
      )}
      <details className="decision-history">
        <summary>Action history · {action.history.length} events</summary>
        <ol>
          {action.history.map((h, i) => (
            <li key={`${h.changedAt}-${i}`}>
              <strong>{h.status}</strong> · {h.actor} · {h.changedAt.slice(0, 10)}
              {h.note && ` — ${h.note}`}
            </li>
          ))}
        </ol>
      </details>
      {!["Closed", "Cancelled"].includes(action.status) && (
        <div className="action-update">
          <label>
            {action.status === "Pending verification" ? "Verifier name / role" : "Your name / role"}
            <input value={actor} onChange={(e) => setActor(e.target.value)} maxLength={120} />
          </label>
          {action.status === "In progress" && (
            <label>
              Completion evidence reference
              <input
                value={completionEvidence}
                onChange={(e) => setEvidence(e.target.value)}
                maxLength={1000}
                placeholder="Records-system link or evidence ID"
              />
            </label>
          )}
          {action.status === "Pending verification" && (
            <label>
              Effectiveness finding
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                placeholder="What was reviewed and was the action effective?"
              />
            </label>
          )}
          {failure && (
            <p role="alert" className="danger">
              {failure}
            </p>
          )}
          <div className="filters">
            {action.status === "Open" && (
              <Button variant="outline" onClick={() => transition("In progress")}>
                Start work
              </Button>
            )}
            {action.status === "In progress" && (
              <Button
                variant="outline"
                onClick={() => {
                  dispatch({
                    type: "edit-corrective-evidence",
                    id: action.id,
                    evidence: completionEvidence,
                  });
                  transition("Pending verification");
                }}
              >
                Submit for verification
              </Button>
            )}
            {action.status === "Pending verification" && (
              <>
                <Button
                  onClick={() => {
                    if (!note.trim()) {
                      setFailure("Enter the verification finding before closing.");
                      return;
                    }
                    transition("Closed");
                  }}
                >
                  Verify effective and close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!note.trim()) {
                      setFailure("Record why the action was ineffective before reopening.");
                      return;
                    }
                    transition("In progress");
                  }}
                >
                  Ineffective — return to work
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
