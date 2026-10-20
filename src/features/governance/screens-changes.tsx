import { useMemo, useState, type FormEvent } from "react";
import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  changeCategories,
  changeReviewSchema,
  changeStatuses,
  impactAreas,
  impactLevels,
  type ChangeReview,
  type ChangeStatus,
} from "./change-schema";
import { evaluateChangeReview } from "./change-review-model";
import { useGovernance } from "./store";

type ImpactMap = ChangeReview["impacts"];
const blankImpacts = (): ImpactMap =>
  Object.fromEntries(impactAreas.map((area) => [area, "Not assessed"])) as ImpactMap;
const initialForm = () => ({
  system: "",
  categories: [] as (typeof changeCategories)[number][],
  summary: "",
  requestedBy: "",
  targetDate: "",
  impactRationale: "",
  impacts: blankImpacts(),
});
const newId = () => crypto.randomUUID();
const timeNow = () => new Date().toISOString();

export function ChangesScreen() {
  const { state, dispatch } = useGovernance();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Open");
  const open = state.changeReviews.filter(
    (review) => !["Rejected", "Implemented"].includes(review.status),
  );
  const overdue = open.filter(
    (review) => review.targetDate && review.targetDate < new Date().toISOString().slice(0, 10),
  );
  const visible = useMemo(
    () =>
      state.changeReviews.filter((review) => {
        const statusMatches =
          filter === "All" ||
          (filter === "Open"
            ? !["Rejected", "Implemented"].includes(review.status)
            : review.status === filter);
        const text =
          `${review.system} ${review.summary} ${review.requestedBy} ${review.reviewer}`.toLowerCase();
        return statusMatches && text.includes(search.trim().toLowerCase());
      }),
    [filter, search, state.changeReviews],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedAt = timeNow();
    const parsed = changeReviewSchema.safeParse({
      ...form,
      targetDate: form.targetDate || null,
      id: newId(),
      submittedAt,
      status: "Pending review",
      reviewer: "",
      decisionRationale: "",
      decidedAt: null,
      history: [
        {
          status: "Pending review",
          actor: form.requestedBy,
          note: "Change review submitted.",
          changedAt: submittedAt,
        },
      ],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the change review fields.");
      return;
    }
    dispatch({ type: "change-review", review: parsed.data });
    setForm(initialForm());
    setError("");
    setFilter("Open");
  }

  return (
    <>
      <section className="decision-intro" aria-label="Change review guidance">
        <WarningCircle weight="duotone" />
        <div>
          <strong>Review material changes before implementation</strong>
          <p>
            Changes to purpose, affected people, models or providers, data, autonomy, controls or
            operating context can make an existing decision or evidence stale. This workflow
            supports internal review; it does not determine legal classification or replace
            specialist assessment.
          </p>
        </div>
      </section>
      <div className="decision-summary" aria-label="Change review summary">
        <span>
          <strong>{state.changeReviews.length}</strong> total reviews
        </span>
        <span>
          <strong>{open.length}</strong> open
        </span>
        <span>
          <strong>{overdue.length}</strong> past target date
        </span>
        <label>
          Show{" "}
          <select
            aria-label="Filter change reviews"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>Open</option>
            {changeStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
            <option>All</option>
          </select>
        </label>
        <label className="decision-search">
          Search{" "}
          <input
            type="search"
            aria-label="Search change reviews"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="System, change, owner…"
          />
        </label>
      </div>
      <details className="decision-intake">
        <summary>
          <ArrowsClockwise /> Submit a material change for review
        </summary>
        <p className="muted">
          New requests begin as pending review. Record an impact level for every area before
          approval; high or critical impacts are flagged for escalation. Do not enter patient,
          customer, or other sensitive personal data.
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
              Requested by
              <input
                required
                maxLength={120}
                value={form.requestedBy}
                onChange={(event) => setForm({ ...form, requestedBy: event.target.value })}
                placeholder="Name or accountable role"
              />
            </label>
            <label>
              Target review date (optional)
              <input
                type="date"
                value={form.targetDate}
                onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
              />
            </label>
          </div>
          <fieldset className="change-categories">
            <legend>What is changing? Select all that apply</legend>
            {changeCategories.map((category) => (
              <label key={category}>
                <input
                  type="checkbox"
                  checked={form.categories.includes(category)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      categories: event.target.checked
                        ? [...form.categories, category]
                        : form.categories.filter((item) => item !== category),
                    })
                  }
                />
                {category}
              </label>
            ))}
          </fieldset>
          <label>
            Change summary
            <textarea
              required
              maxLength={4000}
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              placeholder="Describe the proposed change, why it is needed, and intended timing."
            />
          </label>
          <fieldset className="change-impacts">
            <legend>Preliminary impact screen</legend>
            <p className="muted">
              Rate the plausible impact of this change. “Not assessed” blocks approval until
              completed.
            </p>
            <div>
              {impactAreas.map((area) => (
                <label key={area}>
                  {area}
                  <select
                    aria-label={`${area} impact`}
                    value={form.impacts[area]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        impacts: {
                          ...form.impacts,
                          [area]: event.target.value as ImpactMap[typeof area],
                        },
                      })
                    }
                  >
                    {impactLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Impact rationale and evidence considered
            <textarea
              required
              maxLength={4000}
              value={form.impactRationale}
              onChange={(event) => setForm({ ...form, impactRationale: event.target.value })}
              placeholder="Summarize evidence, uncertainties, affected groups, mitigations and any analysis still needed."
            />
          </label>
          {error && (
            <p role="alert" className="danger">
              {error}
            </p>
          )}
          <Button type="submit">
            <ArrowsClockwise /> Submit change review
          </Button>
        </form>
      </details>
      <div className="decision-list">
        {visible.map((review) => (
          <ChangeReviewCard
            key={review.id}
            review={review}
            onTransition={(status, actor, note) =>
              dispatch({
                type: "transition-change-review",
                id: review.id,
                status,
                actor,
                note,
                changedAt: timeNow(),
              })
            }
          />
        ))}
        {visible.length === 0 && (
          <p className="empty-state muted">
            No change reviews match this view. Submit a material change before implementation.
          </p>
        )}
      </div>
      <p className="footnote">
        A recorded review is an internal governance control, not proof of regulatory approval, legal
        compliance, safety, or performance. Keep supporting evidence in the organization's approved
        records system.
      </p>
    </>
  );
}

function ChangeReviewCard({
  review,
  onTransition,
}: {
  review: ChangeReview;
  onTransition: (status: ChangeStatus, actor: string, note: string) => void;
}) {
  const [status, setStatus] = useState<ChangeStatus>(
    review.status === "Approved" ? "Implemented" : "Approved",
  );
  const [actor, setActor] = useState("");
  const [note, setNote] = useState("");
  const evaluation = evaluateChangeReview(review);
  const terminal = review.status === "Rejected" || review.status === "Implemented";
  const needsEscalation = evaluation.highImpactAreas.length > 0;
  const availableStatuses: ChangeStatus[] =
    review.status === "Approved"
      ? ["Implemented", "Changes requested", "Rejected"]
      : review.status === "Changes requested"
        ? ["Pending review", "Approved", "Rejected"]
        : ["Approved", "Changes requested", "Rejected"];
  return (
    <article className="decision-card">
      <div className="decision-card-heading">
        <div>
          <span className={`decision-outcome ${needsEscalation ? "outcome-risk-accepted" : ""}`}>
            {review.status}
          </span>
          <h2>{review.system}</h2>
        </div>
        <span className="decision-lifecycle">
          {review.targetDate ? `Target ${review.targetDate}` : "No target date"}
        </span>
      </div>
      <p className="muted">
        Submitted {new Date(review.submittedAt).toLocaleDateString()} · Requested by{" "}
        {review.requestedBy}
      </p>
      <p>
        <strong>Change:</strong> {review.summary}
      </p>
      <p>
        <strong>Change areas:</strong> {review.categories.join(" · ")}
      </p>
      <p>
        <strong>Impact screen:</strong>{" "}
        {impactAreas.map((area) => `${area}: ${review.impacts[area]}`).join(" · ")}
      </p>
      <p>
        <strong>Assessment:</strong> {evaluation.recommendation}
        {evaluation.highImpactAreas.length > 0 &&
          ` High/critical: ${evaluation.highImpactAreas.join(", ")}.`}
      </p>
      <p>
        <strong>Impact rationale:</strong> {review.impactRationale}
      </p>
      {review.decisionRationale && (
        <p>
          <strong>Latest review note ({review.reviewer}):</strong> {review.decisionRationale}
        </p>
      )}
      <details className="decision-history">
        <summary>
          Review history · {review.history.length} event{review.history.length === 1 ? "" : "s"}
        </summary>
        <ol>
          {review.history.map((event, index) => (
            <li key={`${event.changedAt}-${index}`}>
              <strong>{event.status}</strong> · {event.actor} — {event.note}
              <time dateTime={event.changedAt}>{new Date(event.changedAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      </details>
      {!terminal && (
        <details className="decision-intake">
          <summary>Record reviewer outcome</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onTransition(status, actor, note);
            }}
          >
            <div className="decision-form-grid">
              <label>
                Outcome
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ChangeStatus)}
                >
                  {availableStatuses.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                Reviewer / accountable role
                <input
                  required
                  maxLength={120}
                  value={actor}
                  onChange={(event) => setActor(event.target.value)}
                />
              </label>
            </div>
            <label>
              Decision rationale / conditions
              <textarea
                required
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <Button type="submit">Save review outcome</Button>
          </form>
        </details>
      )}
    </article>
  );
}
