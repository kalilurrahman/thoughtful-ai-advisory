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
import {
  CONTROLS,
  EV,
  PHASES,
  SCORE_LABELS,
  PILLARS,
  SOURCES,
  type Control,
} from "@/data/governance";
import {
  ControlRow,
  FilterTabs,
  GateBanner,
  KpiTile,
  PageHeader,
  PillarScore,
  RiskTierTag,
  STATUS_WORDS,
  StatusBadge,
  gateState,
  type StatusTone,
} from "@/components/assurance";
import { useGovernance } from "./store";
import {
  at,
  answerAt,
  controlStatus,
  isCapped,
  scoreTone,
  gapPriority,
  gapPoints,
  gateFloor,
} from "./model";
import { recordTrail, trailActor } from "./trail-store";
import { ContentChangelog, ContentUpdateDate } from "./content-changelog";
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}
export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  return <span className={"chip " + tone}>{children}</span>;
}
export function Dot({ tone }: { tone: string }) {
  return <span className={"status-dot " + tone} />;
}
/** Status tone of an inventory disposition (Approved, Approved with limits, Under review, Not approved). */
export function dispositionTone(status: string): StatusTone {
  return status === "Approved"
    ? "effective"
    : status === "Not approved"
      ? "gap"
      : status === "Approved with limits"
        ? "partial"
        : "info";
}
export function HomeScreen() {
  const { state, dispatch, scores, index, band, gate, blocking, coverage, workspaceName, userId } =
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
  const unverified = CONTROLS.map((c) => ({ c, a: answerAt(state.answers, c.id) }))
    .filter(({ a }) => a.e !== 3)
    .sort((x, y) => {
      const w = { Critical: 0, High: 1, Medium: 2 } as Record<string, number>;
      return (w[x.c.w] ?? 3) - (w[y.c.w] ?? 3) || y.a.s - x.a.s;
    });
  const evidenceQueue = unverified.slice(0, 3);
  const attached = Object.values(state.answers).filter((a) => a.e === 3).length;
  const elevated = state.systems.filter(
    (s) => s.tier === "High-risk" || s.tier === "Prohibited",
  ).length;
  const done = state.roadmap.filter((i) => i.done).length;
  const floor = gateFloor(state.tier);
  // Pillar targets: the gate floor for the gated pillars (E · R · N), the standing targets for the rest.
  const targets = [80, 75, 75, floor, floor, floor];
  const openPillar = (i: number) => {
    dispatch({ type: "question", qi: CONTROLS.findIndex((c) => c.p === i) });
    nav({ to: "/assess" });
  };
  return (
    <>
      <PageHeader
        eyebrow={`${workspaceName} · Workspace assessment`}
        title="Governance overview"
        meta={[
          userId ? "Personal workspace" : "Demo workspace",
          `Assessment tier · ${state.tier}`,
          `${attached} of ${CONTROLS.length} controls evidenced`,
        ]}
      />
      <ContentUpdateDate />
      <GateBanner
        to="/gates"
        state={gateState(gate)}
        context={`Workspace release gate · ${state.tier} tier`}
        title={`${gate} · ${blocking.length} blocking control${blocking.length === 1 ? "" : "s"}`}
        detail={
          blocking.length
            ? `Blocking: ${blocking.map((c) => c.code).join(", ")} · pillar floor ${floor} on ${PILLARS.slice(
                3,
              )
                .map((p) => p.letter)
                .join(" · ")}`
            : `Every critical control is scored 2 or more with evidence where claimed · pillar floor ${floor}`
        }
        action={<CaretRight weight="bold" aria-hidden="true" className="size-4 shrink-0" />}
      />
      <div className="kpi-grid">
        <KpiTile
          value={state.systems.length}
          label="AI systems registered"
          tone="brand"
          icon={<StackIcon weight="duotone" />}
          delta={`${state.systems.filter((s) => !s.riskTriage).length} untriaged`}
        />
        <KpiTile
          value={elevated}
          label="Elevated-risk systems"
          tone={elevated ? "danger" : "success"}
          icon={<WarningCircle weight="duotone" />}
          delta="High-risk or prohibited tier"
        />
        <KpiTile
          value={coverage.percent}
          unit="%"
          label="Guardrail coverage"
          tone={coverage.percent >= 100 ? "success" : coverage.percent >= 70 ? "warning" : "danger"}
          icon={<ShieldCheck weight="duotone" />}
          delta={`${coverage.enabled} of ${coverage.required} required controls`}
        />
        <KpiTile
          value={done}
          unit={`/${state.roadmap.length}`}
          label="Remediation complete"
          tone={state.roadmap.length && done === state.roadmap.length ? "success" : "warning"}
          icon={<CheckCircle weight="duotone" />}
          delta={`${state.roadmap.length - done} open roadmap items`}
        />
      </div>
      <div className="overview-panels">
        <section className="assurance-panel overview-index-panel">
          <Kicker>VERITRAIL Index</Kicker>
          <div className="index-summary">
            <strong className={"index-number " + scoreTone(index)}>{index}</strong>
            <div>
              <h2>{band}</h2>
              <p className="muted">Current workspace maturity</p>
            </div>
          </div>
          <ol className="band-meter" aria-label={`Maturity band ${band}`}>
            {["Initial", "Developing", "Defined", "Managed", "Optimized"].map((b, i) => {
              const reached =
                ["Initial", "Developing", "Defined", "Managed", "Optimized"].indexOf(band) >= i;
              return (
                <li key={b} className={reached ? "reached" : ""} aria-current={b === band}>
                  <span>{b}</span>
                </li>
              );
            })}
          </ol>
          <p className="muted index-caption">
            {attached} of {CONTROLS.length} controls have evidence attached
          </p>
          <Button asChild className="overview-cta">
            <Link to="/assess">
              Continue assessment <ArrowRight />
            </Link>
          </Button>
        </section>
        <section className="assurance-panel overview-pillars">
          <Kicker>TILLER lenses · mapped to NIST AI RMF</Kicker>
          <div className="pillar-list">
            {PILLARS.map((p, i) => (
              <PillarScore
                key={p.name}
                letter={p.letter}
                name={p.name}
                fn={p.nist}
                score={scores[i] ?? 0}
                target={targets[i] ?? 75}
                onClick={() => openPillar(i)}
              />
            ))}
          </div>
        </section>
      </div>
      <section>
        <div className="section-heading">
          <h2>Remediation roadmap</h2>
          <Button asChild variant="link">
            <Link to="/roadmap">
              Open roadmap <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="phase-grid">
          {PHASES.map((phase, i) => {
            const items = state.roadmap.filter((it) => it.phase === i);
            const complete = items.filter((it) => it.done).length;
            return (
              <article className="phase-card" key={phase.num}>
                <header>
                  <span className="phase-num">{phase.num}</span>
                  <h3>{phase.name}</h3>
                  <span className="muted phase-count">
                    {complete}/{items.length}
                  </span>
                </header>
                <ul>
                  {items.slice(0, 4).map((it) => (
                    <li key={it.key} className={it.done ? "done" : ""}>
                      {it.done ? (
                        <CheckCircle weight="fill" aria-hidden="true" />
                      ) : (
                        <Circle aria-hidden="true" />
                      )}
                      <span>
                        {it.title}
                        {it.done && <span className="sr-only"> (done)</span>}
                      </span>
                    </li>
                  ))}
                  {items.length > 4 && <li className="muted more">+{items.length - 4} more</li>}
                  {items.length === 0 && <li className="muted more">Nothing planned yet</li>}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
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
                  <RiskTierTag tier={s.tier} />
                </div>
                <h3>{s.name}</h3>
                <p className="muted">
                  {s.owner} · {s.kind}
                </p>
                <StatusBadge tone={dispositionTone(s.status)}>{s.status}</StatusBadge>
              </Link>
            </Button>
          ))}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h2>Evidence readiness</h2>
          <Button asChild variant="link">
            <Link to="/assess">
              Open assessment <ArrowRight />
            </Link>
          </Button>
        </div>
        <p className="muted evidence-readiness-summary">
          <strong>{unverified.length}</strong> of {CONTROLS.length} controls do not yet have
          evidence attached. Scores of 3–4 are capped until evidence is attached; treat unattached
          claims as provisional for release and assurance decisions.
        </p>
        <div className="gap-list">
          {evidenceQueue.map(({ c, a }) => (
            <article className="gap-card evidence-card" key={c.id}>
              <div className="split">
                <Kicker>
                  {at(PILLARS, c.p).letter} · {c.code}
                </Kicker>
                <Chip tone={a.e === 0 ? "danger" : "warning"}>{EV[a.e]}</Chip>
              </div>
              <h3>{c.text}</h3>
              <p className="muted">
                {c.owner} · {c.w} control · self-score {a.s}/4
              </p>
              <Button
                variant="link"
                onClick={() => {
                  dispatch({ type: "question", qi: CONTROLS.indexOf(c) });
                  nav({ to: "/assess" });
                }}
              >
                <ArrowRight />
                Review and attach evidence
              </Button>
            </article>
          ))}
        </div>
        {unverified.length === 0 && <p className="success">All controls have evidence attached.</p>}
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
      <ContentChangelog />
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
/** Status tone and label of a control row from the real scoring rules (model.ts). */
function controlRowStatus(a: ReturnType<typeof answerAt>): {
  status: StatusTone;
  label: string;
} {
  const status = controlStatus(a);
  if (isCapped(a)) return { status, label: "Capped · " + (EV[a.e] ?? "") };
  if (status === "attested") return { status, label: "Attested" };
  if (status === "untested") return { status, label: "Not tested" };
  return { status, label: a.e === 3 ? STATUS_WORDS[status] + " · evidenced" : (EV[a.e] ?? "") };
}
export function AssessScreen() {
  const { state, dispatch, userId, workspaceName } = useGovernance();
  const [drawer, setDrawer] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [pillar, setPillar] = useState("all");
  // Phones show the list or the detail, never both; a row opens the detail, the link returns.
  const [detailOpen, setDetailOpen] = useState(false);
  const c = at(CONTROLS, state.qi),
    a = answerAt(state.answers, c.id),
    p = at(PILLARS, c.p);
  const who = trailActor(userId);
  const patch = (patch: Partial<typeof a>) => {
    dispatch({ type: "answer", id: c.id, patch });
    const next = { ...a, ...patch };
    const { status } = controlRowStatus(next);
    if (patch.s !== undefined && patch.s !== a.s)
      recordTrail({
        title: `${c.code} scored ${patch.s} · ${SCORE_LABELS[patch.s] ?? ""}`,
        who,
        ref: c.code,
        outcome: status,
      });
    if (patch.e !== undefined && patch.e !== a.e)
      recordTrail({
        title: `${c.code} evidence · ${EV[patch.e] ?? ""}`,
        who,
        ref: c.code,
        outcome: status,
      });
    if (patch.attachment && patch.attachment !== a.attachment)
      recordTrail({
        title: `${c.code} reference added · ${patch.attachment}`,
        who,
        ref: c.code,
        outcome: "info",
      });
  };
  const nav = useNavigate();
  const answered = Object.values(state.answers).filter((x) => x.s > 0).length;
  const attached = Object.values(state.answers).filter((x) => x.e === 3).length;
  const need = Object.values(state.answers).filter((x) => x.e !== 3).length;
  const visible = CONTROLS.filter((x) => pillar === "all" || String(x.p) === pillar);
  const current = controlRowStatus(a);
  const goTo = (qi: number) => {
    dispatch({ type: "question", qi });
    setDetailOpen(true);
  };
  return (
    <>
      <PageHeader
        eyebrow={`${workspaceName} · TILLER assessment`}
        title="TILLER assessment"
        meta={[
          `Control ${state.qi + 1} of ${CONTROLS.length}`,
          `${answered} answered · ${attached} evidence attached · ${need} need evidence`,
        ]}
      />
      <progress max="12" value={state.qi + 1} aria-label="Assessment progress" />
      <FilterTabs
        label="Filter controls by pillar"
        value={pillar}
        onChange={setPillar}
        className="assess-filter"
        items={[
          { id: "all", label: "All", count: CONTROLS.length },
          ...PILLARS.map((x, i) => ({
            id: String(i),
            label: `${x.letter} · ${x.name}`,
            count: CONTROLS.filter((y) => y.p === i).length,
          })),
        ]}
      />
      <div className="assess-layout" data-detail={detailOpen ? "true" : "false"}>
        <section className="assess-list" aria-label="All controls">
          <Kicker>All controls</Kicker>
          <div className="assurance-list">
            {visible.map((x) => {
              const xa = answerAt(state.answers, x.id);
              const i = CONTROLS.indexOf(x);
              const row = controlRowStatus(xa);
              return (
                <ControlRow
                  key={x.id}
                  code={x.code}
                  text={x.text}
                  weight={x.w}
                  owner={x.owner}
                  evidence={EV[xa.e] ?? ""}
                  status={row.status}
                  statusLabel={row.label}
                  selected={state.qi === i}
                  onClick={() => goTo(i)}
                />
              );
            })}
          </div>
        </section>
        <section className="assess-detail" aria-label="Selected control">
          <Button variant="link" className="assess-back" onClick={() => setDetailOpen(false)}>
            <ArrowLeft /> All controls
          </Button>
          <div className="control-header">
            <span className="code-chip">{c.code}</span>
            <strong className="pillar-letter">{p.letter}</strong>
            <Kicker>{p.name}</Kicker>
            <span className="nist">{p.nist}</span>
            <span className={c.w === "Critical" ? "danger" : "warning"}>{c.w}</span>
            <StatusBadge tone={current.status}>{current.label}</StatusBadge>
          </div>
          <h2 className="question">{c.text}</h2>
          <p className="muted question-hint">{c.hint}</p>
          <Kicker>Maturity score</Kicker>
          <div className="score-options" role="group" aria-label="Maturity score">
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
          <div className="segments" role="group" aria-label="Evidence status">
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
            <div className="evidence-warning evidence-warning-action">
              <WarningCircle weight="duotone" />
              <span>Score capped at 2 until evidence is attached.</span>
              <Button variant="link" onClick={() => setDrawer(true)}>
                Attach evidence
              </Button>
            </div>
          )}
          <Kicker>What good looks like</Kicker>
          <ul className="good-list">
            {c.good.map((x) => (
              <li key={x}>
                <CheckCircle weight="duotone" aria-hidden="true" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
          <Kicker>Framework references</Kicker>
          <div className="ref-chips">
            {c.refs.map((r) => (
              <span key={r} className="ref-chip">
                {r}
              </span>
            ))}
          </div>
          <Button className="guidance-row" variant="secondary" onClick={() => setDrawer(true)}>
            <Paperclip weight="duotone" />
            <span>Guidance, rubric &amp; evidence</span>
            <small className="muted">
              {EV[a.e]}
              {a.attachment || a.url ? " · reference added" : ""}
            </small>
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
        </section>
      </div>
      <Dialog open={drawer} onOpenChange={setDrawer}>
        <DialogContent className="veritrail-sheet">
          <Kicker>
            {c.code} · {p.name} · {c.w} · Mandatory
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
          <p className="muted">
            Add a reference (demo upload, URL, or test result) and set evidence status to{" "}
            <strong>Evidence attached</strong> when you have support for the score.
          </p>
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
                patch({ attachment: c.code + "-evidence-2026-10.pdf", e: Math.max(a.e, 1) })
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
                patch({ attachment: c.code + "-test-result (demo)", e: Math.max(a.e, 1) })
              }
            >
              Link test
            </Button>
          </div>
          {a.e !== 3 && (
            <Button variant="outline" onClick={() => patch({ e: 3 })}>
              <CheckCircle />
              Mark evidence attached
            </Button>
          )}
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
          <Button onClick={() => setDrawer(false)}>Save &amp; close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function GatesScreen() {
  const { state, scores, gate, blocking, dispatch } = useGovernance();
  const nav = useNavigate();
  const unverifiedCritical = CONTROLS.filter((c) => {
    const a = answerAt(state.answers, c.id);
    return c.w === "Critical" && a.e !== 3;
  });
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
        Pillar floor {gateFloor(state.tier)} on{" "}
        {PILLARS.slice(3)
          .map((p) => p.name)
          .join(", ")}
      </p>
      <p className="muted gate-evidence-note">
        <strong>{unverifiedCritical.length}</strong> critical controls do not yet have evidence
        attached. Review and attach evidence before any release recommendation.
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
            <span className="danger">{c.code}</span>
            <span>{c.text}</span>
            <CaretRight />
          </Button>
        ))
      ) : (
        <p className="success">No blocking controls.</p>
      )}
      {unverifiedCritical.length > 0 && (
        <section>
          <h2>Attach evidence to critical controls</h2>
          <p className="muted">Open each control to attach and record evidence status.</p>
          <div className="gap-list">
            {unverifiedCritical.slice(0, 4).map((c) => (
              <Button
                key={"ev-" + c.id}
                className="blocking-card evidence-card"
                variant="secondary"
                onClick={() => {
                  dispatch({ type: "question", qi: CONTROLS.indexOf(c) });
                  nav({ to: "/assess" });
                }}
              >
                <span className="warning">{c.code}</span>
                <span>
                  {c.text} <span className="muted">· {EV[answerAt(state.answers, c.id).e]}</span>
                </span>
                <CaretRight />
              </Button>
            ))}
          </div>
        </section>
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
