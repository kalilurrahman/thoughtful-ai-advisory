import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  ArrowSquareOut,
  CheckCircle,
  Circle,
  Paperclip,
  ShieldCheck,
  Calculator,
  Books,
  Files,
  CaretRight,
  WarningCircle,
  Stack as StackIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CONTROLS, EV, SCORE_LABELS, PILLARS, SOURCES, type Control } from "@/data/governance";
import { useGovernance } from "./store";
import { at, answerAt, scoreTone, gapPriority, gapPoints, gateFloor } from "./model";
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={"chip " + tone}>{children}</span>;
}
export function Dot({ tone }: { tone: string }) {
  return <span className={"status-dot " + tone} />;
}
export function HomeScreen() {
  const { state, dispatch, scores, index, band, gate, blocking, coverage, workspaceName } =
    useGovernance();
  const nav = useNavigate();
  const gaps = CONTROLS.map((c) => ({
    c,
    points: gapPoints(answerAt(state.answers, c.id)),
    priority: gapPriority(c, answerAt(state.answers, c.id), state.tier),
  }))
    .filter((g) => g.points > 0)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
  return (
    <>
      <div className="newspaper-rule" />
      <div className="dateline">
        <span>{workspaceName} · Workspace assessment</span>
        <span>Assessment tier · {state.tier}</span>
      </div>
      <div className="overview-metrics">
        <div className="overview-metric success">
          <StackIcon />
          <strong>{state.systems.length}</strong>
          <span>AI systems registered</span>
        </div>
        <div className="overview-metric danger">
          <WarningCircle weight="duotone" />
          <strong>
            {state.systems.filter((s) => s.tier === "High-risk" || s.tier === "Prohibited").length}
          </strong>
          <span>Elevated-risk systems</span>
        </div>
        <div className="overview-metric success">
          <ShieldCheck weight="duotone" />
          <strong>
            {coverage.percent}
            <small>%</small>
          </strong>
          <span>Guardrail coverage</span>
        </div>
        <div className="overview-metric warning">
          <CheckCircle weight="duotone" />
          <strong>
            {state.roadmap.filter((i) => i.done).length}
            <small>/{state.roadmap.length}</small>
          </strong>
          <span>Remediation complete</span>
        </div>
      </div>
      <div className="overview-assessment">
        <div className="overview-index">
          <div className="index-summary">
            <strong className="index-number">{index}</strong>
            <div>
              <Kicker>AEGIS Index</Kicker>
              <h2>{band}</h2>
              <p className="muted">Current workspace maturity</p>
            </div>
          </div>
          <p className="muted index-caption">
            {Object.values(state.answers).filter((a) => a.e === 3).length} of {CONTROLS.length}{" "}
            controls have verified evidence
          </p>
          <Button asChild className="overview-cta">
            <Link to="/assess">
              Continue assessment <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="overview-pillars">
          <Kicker>GOVERN pillars · mapped to NIST AI RMF</Kicker>
          <div className="pillar-list">
            {PILLARS.map((p, i) => (
              <Button
                variant="ghost"
                className="pillar-row"
                key={p.letter}
                onClick={() => {
                  dispatch({ type: "question", qi: CONTROLS.findIndex((c) => c.p === i) });
                  nav({ to: "/assess" });
                }}
              >
                <strong className="pillar-letter">{p.letter}</strong>
                <div className="pillar-body">
                  <div className="pillar-label">
                    <span>{p.name}</span>
                    <span className="nist">{p.nist}</span>
                  </div>
                  <div className="pillar-track">
                    <span
                      className={"pillar-fill " + scoreTone(scores[i] ?? 0)}
                      style={{ width: (scores[i] ?? 0) + "%" }}
                    />
                    <i style={{ left: [80, 75, 75, 85, 80, 80][i] + "%" }} />
                  </div>
                </div>
                <strong className={"pillar-score " + scoreTone(scores[i] ?? 0)}>
                  {scores[i] ?? 0}
                </strong>
              </Button>
            ))}
          </div>
        </div>
      </div>
      <Button variant="secondary" className="gate-card" asChild>
        <Link to="/gates">
          <Dot
            tone={gate === "Cleared" ? "success" : gate === "Conditional" ? "warning" : "danger"}
          />
          <div>
            <Kicker>Workspace release gate · {state.tier} tier</Kicker>
            <strong>
              {gate} · {blocking.length} blocking controls
            </strong>
          </div>
          <CaretRight weight="duotone" />
        </Link>
      </Button>
      <section className="portfolio-section">
        <div className="section-heading">
          <h2>AI portfolio</h2>
          <Button asChild variant="link">
            <Link to="/inventory">
              View inventory <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="portfolio-grid">
          {state.systems.slice(0, 4).map((s, i) => (
            <Button variant="secondary" asChild className="portfolio-item" key={s.name + i}>
              <Link to="/inventory">
                <div className="split">
                  <ShieldCheck weight="duotone" />
                  <Chip
                    tone={s.tier === "High-risk" || s.tier === "Prohibited" ? "danger" : "success"}
                  >
                    {s.tier}
                  </Chip>
                </div>
                <h3>{s.name}</h3>
                <p className="muted">
                  {s.owner} · {s.kind}
                </p>
                <span>
                  <Dot
                    tone={
                      s.status === "Approved"
                        ? "success"
                        : s.status === "Not approved"
                          ? "danger"
                          : "warning"
                    }
                  />
                  {s.status}
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h2>Top gaps</h2>
          <span className="muted">Priority by risk</span>
        </div>
        <div className="gap-list">
          {gaps.map(({ c, points }) => (
            <GapCard key={c.id} c={c} points={points} />
          ))}
        </div>
      </section>
      <div className="quick-links">
        {(
          [
            {
              to: "/guardrails",
              icon: ShieldCheck,
              title: "Guardrails",
              detail: coverage.percent + "% coverage",
            },
            {
              to: "/calculators",
              icon: Calculator,
              title: "Calculators",
              detail: "Six authored models",
            },
            {
              to: "/knowledge",
              icon: Books,
              title: "Knowledge hub",
              detail: SOURCES.length + " sources",
            },
            { to: "/export", icon: Files, title: "Audit pack", detail: "Reports & evidence" },
          ] as const
        ).map((x) => (
          <Button variant="ghost" asChild className="quick-link" key={x.to}>
            <Link to={x.to}>
              <x.icon weight="duotone" />
              <strong>{x.title}</strong>
              <span className="muted">{x.detail}</span>
            </Link>
          </Button>
        ))}
      </div>
    </>
  );
}
function GapCard({ c, points }: { c: Control; points: number }) {
  const { state, dispatch } = useGovernance();
  const added = state.roadmap.some((i) => i.key === "gap-" + c.id);
  return (
    <article className="gap-card">
      <div className="split">
        <Kicker>
          {at(PILLARS, c.p).letter} · {at(PILLARS, c.p).nist}
        </Kicker>
        <span className="danger">{points} gap pts</span>
      </div>
      <h3>{c.text.replace(/^(Is there|Are|Is|Does|Do) /, "").replace(/\?$/, "")}</h3>
      <p>
        <Chip tone={c.w === "Critical" ? "danger" : "warning"}>{c.w}</Chip>
      </p>
      <p className="muted">
        {c.owner} · {c.effort} effort
      </p>
      <Button
        variant="link"
        disabled={added}
        onClick={() => dispatch({ type: "roadmap", control: c })}
      >
        {added ? <CheckCircle weight="duotone" /> : <ArrowRight />}
        {added ? "On roadmap" : "Add to roadmap"}
      </Button>
    </article>
  );
}
export function AssessScreen() {
  const { state, dispatch } = useGovernance();
  const [drawer, setDrawer] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const c = at(CONTROLS, state.qi),
    a = answerAt(state.answers, c.id),
    p = at(PILLARS, c.p);
  const patch = (patch: Partial<typeof a>) => dispatch({ type: "answer", id: c.id, patch });
  const nav = useNavigate();
  return (
    <>
      <div className="split muted assessment-progress">
        <span>Control {state.qi + 1} of 12</span>
        <span>
          {Object.values(state.answers).filter((a) => a.s > 0).length} answered ·{" "}
          {Object.values(state.answers).filter((a) => a.e === 3).length} verified
        </span>
      </div>
      <progress max="12" value={state.qi + 1} />
      <div className="control-header">
        <strong className="pillar-letter">{p.letter}</strong>
        <Kicker>{p.name}</Kicker>
        <span className="nist">{p.nist}</span>
        <span className={c.w === "Critical" ? "danger" : "warning"}>{c.w}</span>
      </div>
      <h2 className="question">{c.text}</h2>
      <p className="muted question-hint">{c.hint}</p>
      <Kicker>Maturity score</Kicker>
      <div className="score-options">
        {SCORE_LABELS.map((label, n) => (
          <Button
            key={n}
            variant={a.s === n ? "default" : "secondary"}
            aria-pressed={a.s === n}
            aria-label={"Score " + n + " " + label}
            onClick={() => patch({ s: n })}
          >
            <strong>{n}</strong>
            <small>{label}</small>
          </Button>
        ))}
      </div>
      <Kicker>Evidence status</Kicker>
      <div className="segments">
        {EV.map((label, n) => (
          <Button
            key={label}
            variant={a.e === n ? "default" : "outline"}
            aria-pressed={a.e === n}
            onClick={() => patch({ e: n })}
          >
            {label}
          </Button>
        ))}
      </div>
      {a.s >= 3 && a.e !== 3 && (
        <p className="evidence-warning">
          <WarningCircle weight="duotone" /> Score capped at 2 until evidence is verified.
        </p>
      )}
      <Button className="guidance-row" variant="secondary" onClick={() => setDrawer(true)}>
        <Paperclip weight="duotone" />
        <span>Guidance, rubric & evidence</span>
        <small className="muted">{EV[a.e]}</small>
        <CaretRight />
      </Button>
      <div className="assessment-actions">
        <Button
          variant="outline"
          disabled={state.qi === 0}
          onClick={() => dispatch({ type: "question", qi: state.qi - 1 })}
        >
          <ArrowLeft />
          Previous
        </Button>
        <Button
          onClick={() =>
            state.qi === 11
              ? nav({ to: "/gates" })
              : dispatch({ type: "question", qi: state.qi + 1 })
          }
        >
          {state.qi === 11 ? "Finish · view gate" : "Next control"}
          <ArrowRight />
        </Button>
      </div>
      <section>
        <Kicker>All controls</Kicker>
        {CONTROLS.map((x, i) => (
          <Button
            variant="ghost"
            key={x.id}
            className={"control-list-row " + (state.qi === i ? "active" : "")}
            onClick={() => dispatch({ type: "question", qi: i })}
          >
            <span className="success">{x.id}</span>
            <div>
              <span>{x.text}</span>
              <Chip
                tone={
                  answerAt(state.answers, x.id).e === 3
                    ? "success"
                    : answerAt(state.answers, x.id).e === 0
                      ? "danger"
                      : "neutral"
                }
              >
                {EV[answerAt(state.answers, x.id).e]}
              </Chip>
            </div>
            <strong>{answerAt(state.answers, x.id).s}</strong>
          </Button>
        ))}
      </section>
      <Dialog open={drawer} onOpenChange={setDrawer}>
        <DialogContent className="aegis-sheet">
          <Kicker>
            {c.id} · {p.name} · {c.w} · Mandatory
          </Kicker>
          <DialogTitle>{c.text}</DialogTitle>
          <DialogDescription>{c.hint}</DialogDescription>
          <h3>What good looks like</h3>
          <ul className="bullets">
            {c.good.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <Kicker>Scoring rubric</Kicker>
          <p>0 None · 1 Ad hoc · 2 Defined · 3 Managed · 4 Optimized</p>
          <div className="ref-chips">
            {c.refs.map((r) => (
              <Chip key={r} tone="success">
                {r}
              </Chip>
            ))}
          </div>
          <div className="sheet-tools">
            <Button
              variant="outline"
              onClick={() =>
                patch({ attachment: c.id + "-evidence-2026-10.pdf", e: Math.max(a.e, 1) })
              }
            >
              <Paperclip />
              Upload demo
            </Button>
            <Button variant="outline" onClick={() => setUrlOpen(!urlOpen)}>
              <ArrowSquareOut />
              Add URL
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                patch({ attachment: c.id + "-test-result (demo)", e: Math.max(a.e, 1) })
              }
            >
              Link test
            </Button>
          </div>
          {urlOpen && (
            <label>
              Evidence URL
              <input
                type="url"
                placeholder="https://"
                value={a.url ?? ""}
                onChange={(e) => patch({ url: e.target.value, e: Math.max(a.e, 1) })}
              />
            </label>
          )}
          {a.attachment && (
            <p className="attachment success">
              <Paperclip />
              {a.attachment} · Pending review (demo)
            </p>
          )}
          <label>
            Reviewer notes
            <textarea
              value={a.notes ?? ""}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={3}
            />
          </label>
          <Button onClick={() => setDrawer(false)}>Save & close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function GatesScreen() {
  const { state, scores, gate, blocking, dispatch } = useGovernance();
  const nav = useNavigate();
  return (
    <>
      <div className="gate-status">
        <Dot
          tone={gate === "Cleared" ? "success" : gate === "Conditional" ? "warning" : "danger"}
        />
        <h2>{gate}</h2>
      </div>
      <p className="muted">
        {state.systems.length} registered systems · Workspace assessment · {state.tier}-risk tier ·
        Pillar floor {gateFloor(state.tier)} on E, R, N
      </p>
      <section>
        {PILLARS.slice(3).map((p, i) => (
          <div className="gate-row" key={p.letter}>
            <div>
              <h3>{p.name}</h3>
              <span className="muted">Floor {gateFloor(state.tier)}</span>
            </div>
            <strong className={scoreTone(scores[i + 3] ?? 0)}>{scores[i + 3] ?? 0}</strong>
            {(scores[i + 3] ?? 0) >= gateFloor(state.tier) ? (
              <CheckCircle className="success" weight="duotone" />
            ) : (
              <WarningCircle className="danger" weight="duotone" />
            )}
          </div>
        ))}
      </section>
      <h2>Blocking controls</h2>
      {blocking.length ? (
        blocking.map((c) => (
          <Button
            key={c.id}
            className="blocking-card"
            variant="secondary"
            onClick={() => {
              dispatch({ type: "question", qi: CONTROLS.indexOf(c) });
              nav({ to: "/assess" });
            }}
          >
            <span className="danger">{c.id}</span>
            <span>{c.text}</span>
            <CaretRight />
          </Button>
        ))
      ) : (
        <p className="success">No blocking controls.</p>
      )}
      <Button
        className="full-button"
        onClick={() => {
          blocking.forEach((control) => dispatch({ type: "roadmap", control }));
          nav({ to: "/roadmap" });
        }}
      >
        Create remediation plan
        <ArrowRight />
      </Button>
      <Button variant="outline" className="full-button" asChild>
        <Link to="/assess">Review assessment</Link>
      </Button>
    </>
  );
}
