import { supabase } from "@/integrations/supabase/client";
import { WorkspaceControls } from "./workspace-controls";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowSquareOut,
  ArrowRight,
  CheckCircle,
  Circle,
  DownloadSimple,
  Newspaper,
  Table,
  SealCheck,
  Moon,
  SignOut,
  TrafficSignal,
  ShieldCheck,
  Calculator,
  Books,
  Path,
  Files,
  Tag,
  CaretRight,
  MagnifyingGlass,
  ClipboardText,
  ArrowsClockwise,
  Gauge,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CALCS, SOURCES, PACKS } from "@/data/governance";
import { useGovernance } from "./store";
import { at, calculate } from "./model";
import { Chip, Dot, Kicker } from "./screens-core";
import { buildEvidenceReport, reportFilename } from "./evidence-report";
import { generateEvidenceFile, type ExportFormat } from "./evidence-files";
export function CalculatorsScreen() {
  const { scores, coverage, state } = useGovernance();
  const [selected, setSelected] = useState("cost");
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(CALCS.flatMap((c) => c.inputs.map((i) => [c.id + "." + i.k, i.v]))),
  );
  const calc = CALCS.find((c) => c.id === selected) ?? at(CALCS, 0);
  const v = Object.fromEntries(calc.inputs.map((i) => [i.k, values[calc.id + "." + i.k] ?? i.v]));
  const out = calculate(calc.id, v, scores, coverage.percent);
  return (
    <>
      <div className="filters calculator-tabs">
        {CALCS.map((c) => (
          <Button
            key={c.id}
            variant={selected === c.id ? "default" : "outline"}
            onClick={() => setSelected(c.id)}
          >
            {c.name}
          </Button>
        ))}
      </div>
      <section className="calculator-body">
        <h2>{calc.name}</h2>
        <p className="muted">{calc.desc}</p>
        <div className="calculator-inputs">
          {calc.inputs.map((i) => (
            <label className="range-field" key={i.k}>
              <div className="split">
                <span>{i.label}</span>
                <strong>{i.fmt(v[i.k] ?? i.v)}</strong>
              </div>
              <input
                aria-label={i.label}
                type="range"
                min={i.min}
                max={i.max}
                step={i.step}
                value={v[i.k]}
                onChange={(e) =>
                  setValues({ ...values, [calc.id + "." + i.k]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <div className="calculator-result">
          <Kicker>
            {out.headline}
            {selected === "coverage" ? " · " + state.tier + " tier" : ""}
          </Kicker>
          <strong className="result-value">{out.value}</strong>
          {out.rows.map(([k, v]) => (
            <div className="result-row" key={k}>
              <span>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <p className="calc-action">{out.action}</p>
      </section>
      <p className="footnote">
        Tier B authored model · assumptions dated 2026-Q3 · verify before relying.
      </p>
    </>
  );
}
export function KnowledgeScreen() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const sources = SOURCES.filter(
    (s) =>
      (filter === "All" ||
        s.type.startsWith(filter) ||
        (filter === "Guidance" && s.type.toLowerCase().includes("guidance"))) &&
      (region === "All regions" || s.jurisdiction.includes(region)) &&
      Object.values(s).join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="resource-intro">
        <Books weight="duotone" />
        <div>
          <Kicker>Governance reference library</Kicker>
          <p>
            Law, management standards, responsible AI frameworks and technical safeguards — with
            practical takeaways for your governance programme.
          </p>
        </div>
      </div>
      <label className="inventory-search resource-search">
        <MagnifyingGlass />
        <input
          aria-label="Search governance resources"
          placeholder="Search topics, publishers or resources…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="filters resource-filters" aria-label="Resource categories">
        {["All", "Law", "Standard", "Framework", "Guidance", "Vendor", "Advisory"].map((x) => (
          <Button
            key={x}
            variant={filter === x ? "default" : "outline"}
            aria-pressed={filter === x}
            onClick={() => setFilter(x)}
          >
            {x}
          </Button>
        ))}
      </div>
      <div className="resource-result-bar">
        <p className="muted" aria-live="polite">
          {sources.length} of {SOURCES.length} resources
        </p>
        <label>
          Jurisdiction
          <select
            aria-label="Resource jurisdiction"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {[
              "All regions",
              "Global",
              "EU",
              "US",
              "UK",
              "Singapore",
              "India",
              "Canada",
              "Australia",
            ].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="source-grid">
        {sources.map((s) => (
          <article className="source-row" key={s.title}>
            <div className="source-meta">
              <Chip tone={s.tier === "A" ? "success" : s.tier === "C" ? "danger" : "neutral"}>
                Tier {s.tier}
              </Chip>
              <span className="muted">
                {s.type} · {s.jurisdiction}
              </span>
            </div>
            <h3>{s.title}</h3>
            <span className="resource-publisher">{s.publisher}</span>
            <p className="muted">{s.summary}</p>
            <ul className="resource-highlights">
              <li>{s.highlight1}</li>
              <li>{s.highlight2}</li>
            </ul>
            <p className="resource-access">
              <strong>Access:</strong> {s.access}
            </p>
            <p>
              <Dot
                tone={
                  s.status === "Page checked"
                    ? "success"
                    : s.status === "Needs review"
                      ? "danger"
                      : "warning"
                }
              />
              {s.status} · {s.verified}
            </p>
            <p className="muted resource-check">{s.checkMethod}</p>
            {s.url !== "#" ? (
              <Button variant="link" asChild>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.host}
                  <ArrowSquareOut />
                </a>
              </Button>
            ) : (
              <span className="muted">Authored model · no external link</span>
            )}
          </article>
        ))}
      </div>
      {sources.length === 0 && (
        <div className="empty-state">
          <h3>No matching resources</h3>
          <Button
            variant="link"
            onClick={() => {
              setQuery("");
              setFilter("All");
              setRegion("All regions");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <p className="footnote">
        Checked 20 Oct 2026. Checks cover publisher identity and resource relevance; each entry
        records its check method. They do not certify compliance or guarantee future availability.
        Tier A: public institutions, standards bodies and independent research/security
        organisations; Tier B: vendor documentation; Tier C: AEGIS-authored advice. Standards and
        frameworks are not laws. No live regulatory feed. Next review 2027-01-15; confirm current
        legal text and implementation guidance before relying on obligations or dates.
      </p>
    </>
  );
}
export function ExportScreen() {
  const { workspaceName, state, scores, gate } = useGovernance();
  const [packId, setPack] = useState("exec"),
    [format, setFormat] = useState("PDF"),
    [status, setStatus] = useState("idle"),
    [generated, setGenerated] = useState<{ blob: Blob; filename: string } | null>(null),
    [error, setError] = useState("");
  const pack = PACKS.find((p) => p.id === packId) ?? at(PACKS, 0);
  const icons = [Newspaper, Table, SealCheck];
  function download(file: { blob: Blob; filename: string }) {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function generate() {
    setStatus("busy");
    setError("");
    try {
      const generatedAt = new Date().toISOString();
      const report = buildEvidenceReport(
        state,
        workspaceName,
        pack.name,
        generatedAt,
        scores,
        gate,
      );
      const blob = await generateEvidenceFile(report, format as ExportFormat);
      const file = {
        blob,
        filename: reportFilename(pack.name, workspaceName, format.toLowerCase()),
      };
      setGenerated(file);
      setStatus("ready");
      download(file);
    } catch (cause) {
      setStatus("idle");
      setError(
        cause instanceof Error
          ? cause.message
          : "The preview could not be generated. Please try again.",
      );
    }
  }
  return (
    <>
      <p className="muted">Client-ready governance deliverables</p>
      <div className="pack-list">
        {PACKS.map((p, i) => {
          const Icon = at(icons, i);
          return (
            <Button
              variant="secondary"
              className={"pack-card " + (packId === p.id ? "selected" : "")}
              key={p.id}
              aria-pressed={packId === p.id}
              onClick={() => {
                setPack(p.id);
                setStatus("idle");
                setGenerated(null);
                setError("");
              }}
            >
              <Icon weight="duotone" />
              <div>
                <h3>{p.name}</h3>
                <p className="muted">{p.desc}</p>
              </div>
              {packId === p.id ? (
                <CheckCircle className="success" weight="duotone" />
              ) : (
                <Circle weight="duotone" />
              )}
            </Button>
          );
        })}
      </div>
      <Kicker>Format</Kicker>
      <div className="segments">
        {["PDF", "DOCX", "XLSX", "PPTX"].map((x) => (
          <Button
            variant={format === x ? "default" : "outline"}
            key={x}
            onClick={() => {
              setFormat(x);
              setStatus("idle");
              setGenerated(null);
              setError("");
            }}
          >
            {x}
          </Button>
        ))}
      </div>
      <section>
        <h2>Included</h2>
        <ul className="included">
          {pack.contents.map((x) => (
            <li key={x}>
              <CheckCircle className="success" weight="duotone" />
              {x}
            </li>
          ))}
        </ul>
      </section>
      <Button className="full-button" disabled={status === "busy"} onClick={generate}>
        <DownloadSimple />
        {status === "busy"
          ? "Generating…"
          : status === "ready"
            ? "Regenerate preview"
            : "Generate " + format}
      </Button>
      {error && (
        <p role="alert" className="danger">
          {error}
        </p>
      )}
      {status === "ready" && (
        <div className="export-file">
          <Files weight="duotone" />
          <div>
            <strong>
              AEGIS_{pack.name.replace(/ /g, "-")}_{workspaceName.replace(/[^a-zA-Z0-9]+/g, "-")}.
              {format.toLowerCase()}
            </strong>
            <p>Preview ready · v1.3 · generated {new Date().toLocaleString()}</p>
          </div>
          <Button variant="outline" onClick={() => generated && download(generated)}>
            <DownloadSimple /> Download again
          </Button>
        </div>
      )}
      <p className="footnote">
        Downloads contain a generated demo preview of the current workspace. Evidence attachments
        are references only; files are not embedded, and no reviewer sign-off or certification is
        created.
      </p>
    </>
  );
}
export function PlansScreen() {
  return (
    <>
      <p className="muted">From a focused diagnostic to continuous assurance.</p>
      <div className="plans-grid">
        {[
          {
            name: "Assess",
            buyer: "Mid-market",
            includes: "Maturity assessment, inventory, risk register, gap report and roadmap.",
            price: "Fixed-price diagnostic · from $499 / organisation",
            cta: "Start diagnostic",
            tone: "neutral",
          },
          {
            name: "Govern",
            buyer: "Scaling AI",
            includes:
              "Full GOVERN modules, policy generator, guardrails designer, calculators and evidence pack.",
            price: "Annual subscription + implementation",
            cta: "Explore governance",
            tone: "success",
          },
          {
            name: "Assure",
            buyer: "Regulated",
            includes:
              "Continuous control testing, red-team library, audit exports, advisory workflows, multi-entity governance.",
            price: "Enterprise subscription + retainer",
            cta: "Explore assurance",
            tone: "danger",
          },
        ].map((p) => (
          <article className={"plan-card " + p.tone} key={p.name}>
            <Kicker>{p.buyer}</Kicker>
            <h2>{p.name}</h2>
            <p>{p.includes}</p>
            <strong className="price-line">{p.price}</strong>
            <Button
              asChild
              variant={p.name === "Govern" ? "default" : "outline"}
              className="full-button"
            >
              <Link
                to={
                  p.name === "Assess" ? "/assess" : p.name === "Govern" ? "/guardrails" : "/gates"
                }
              >
                {p.cta}
                <ArrowRight />
              </Link>
            </Button>
          </article>
        ))}
      </div>
      <section>
        <h2>Governance Snapshot</h2>
        <p className="muted">Free assessment and executive one-page brief.</p>
        <Button variant="link" asChild>
          <Link to="/assess">
            Start free snapshot
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}
export function MoreScreen() {
  const { state, dispatch, userId } = useGovernance();
  const items = [
    { to: "/gates", name: "Release gates", desc: "Readiness by risk tier", icon: TrafficSignal },
    {
      to: "/guardrails",
      name: "Guardrails designer",
      desc: "Controls by tier, coverage index",
      icon: ShieldCheck,
    },
    { to: "/calculators", name: "Calculators", desc: "Six client-ready models", icon: Calculator },
    { to: "/knowledge", name: "Knowledge hub", desc: "Source register", icon: Books },
    {
      to: "/playbook",
      name: "AI Governance Playbook",
      desc: "12 chapters · full lifecycle",
      icon: Newspaper,
    },
    {
      to: "/templates",
      name: "Governance templates",
      desc: "Eight adaptable working documents",
      icon: Files,
    },
    {
      to: "/incidents",
      name: "AI incidents & near misses",
      desc: "Triage, assign response ownership and track closure",
      icon: TrafficSignal,
    },
    {
      to: "/decisions",
      name: "Governance decisions",
      desc: "Approvals, time-bound risk acceptance and review history",
      icon: ClipboardText,
    },
    {
      to: "/changes",
      name: "AI change reviews",
      desc: "Screen material changes, document impacts and record review outcomes",
      icon: ArrowsClockwise,
    },
    {
      to: "/monitoring",
      name: "Operational monitoring",
      desc: "Manual threshold checks, review cadence and breach follow-up",
      icon: Gauge,
    },
    {
      to: "/checklist",
      name: "Governance lifecycle checklist",
      desc: "Live readiness checks across inventory, controls, gates and operations",
      icon: CheckCircle,
    },
    { to: "/start", name: "Start here", desc: "A guided path for your role and goal", icon: Path },
    {
      to: "/export",
      name: "Reports & audit pack",
      desc: "PDF · DOCX · XLSX · PPTX previews",
      icon: Files,
    },
    { to: "/plans", name: "Plans", desc: "Assess · Govern · Assure", icon: Tag },
  ] as const;
  return (
    <>
      <WorkspaceControls />
      <div className="more-grid">
        {items.map((x) => (
          <Button variant="ghost" className="more-row" asChild key={x.to}>
            <Link to={x.to}>
              <x.icon weight="duotone" />
              <div>
                <h3>{x.name}</h3>
                <p className="muted">{x.desc}</p>
              </div>
              <CaretRight />
            </Link>
          </Button>
        ))}
      </div>
      <label className="toggle-row dark-toggle">
        <span>
          <Moon weight="duotone" />
          Dark mode
        </span>
        <Switch
          aria-label="Dark mode"
          checked={state.dark}
          onCheckedChange={() => dispatch({ type: "dark" })}
        />
      </label>
      <Button variant="ghost" asChild className="signout">
        <Link
          to="/onboarding"
          onClick={() => {
            if (userId) void supabase.auth.signOut();
          }}
        >
          <SignOut weight="duotone" />
          {userId ? "Sign out" : "Sign out of demo"}
        </Link>
      </Button>
      <p className="footnote">AEGIS · AI Governance, Guardrails & Assurance Studio</p>
    </>
  );
}
export function OnboardingScreen() {
  const [email, setEmail] = useState("");
  return (
    <div className="onboarding">
      <p className="onboarding-wordmark">AEGIS</p>
      <p className="muted">AI Governance, Guardrails & Assurance Studio</p>
      <div className="newspaper-rule" />
      <Kicker>Govern · Map · Measure · Manage</Kicker>
      <h1>From AI ambition to governed, auditable deployment.</h1>
      <p>
        One studio for your AI inventory, governance maturity, guardrails and release assurance.
        Grounded in NIST AI RMF, ISO/IEC 42001 and the EU AI Act.
      </p>
      <label>
        Work email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@organisation.com"
        />
      </label>
      <Button className="full-button" asChild>
        <Link to="/workspace">
          Sign in with SSO · demo
          <ArrowRight />
        </Link>
      </Button>
      <Button variant="outline" className="full-button" asChild>
        <Link to="/assess">Start free Governance Snapshot</Link>
      </Button>
      <p className="footnote">
        All scoring runs on-device. Demo sign-in does not create an account.
      </p>
    </div>
  );
}
