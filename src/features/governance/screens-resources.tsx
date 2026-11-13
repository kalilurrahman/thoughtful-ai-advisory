import { supabase } from "@/integrations/supabase/client";
import { WorkspaceControls } from "./workspace-controls";
import { TeamPanel } from "./team-panel";
import { PendingInviteBanner } from "./invite-screen";
import { useState } from "react";
import { EmptyResources } from "@/features/site/illustrations-empty";
import { Link } from "@tanstack/react-router";
import {
  Sparkle,
  ArrowSquareOut,
  ArrowRight,
  CheckCircle,
  Circle,
  DownloadSimple,
  Newspaper,
  Table,
  SealCheck,
  Moon,
  Palette,
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
import { CALCS, SOURCES, PACKS, CONTROLS } from "@/data/governance";
import { useDarkTheme } from "@/lib/theme";
import { openAppearance, useAppearanceSummary } from "@/features/appearance/appearance-panel";
import { useGovernance } from "./store";
import { at, answerAt, calculate } from "./model";
import { Chip, Dot, Kicker } from "./screens-core";
import { EvidenceTimeline, PageHeader, RouteLink, formatUtc } from "@/components/assurance";
import { recordTrail, trailActor, useTrail } from "./trail-store";
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
function sourceMatchesType(source: (typeof SOURCES)[number], filter: string) {
  return (
    filter === "All" ||
    source.type.startsWith(filter) ||
    (filter === "Guidance" && source.type.toLowerCase().includes("guidance"))
  );
}

function citationFor(source: (typeof SOURCES)[number]) {
  const link = source.url && source.url !== "#" ? source.url : "No external link";
  return `${source.title}. ${source.publisher} (${source.type}, ${source.jurisdiction}). Validation: ${source.status}, ${source.verified}. ${link}`;
}

export function KnowledgeScreen() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All regions");
  const [validation, setValidation] = useState("All");
  const [copied, setCopied] = useState("");
  const categories = ["All", "Law", "Standard", "Framework", "Guidance", "Vendor", "Advisory"];
  const categoryCounts = Object.fromEntries(
    categories.map((x) => [x, SOURCES.filter((s) => sourceMatchesType(s, x)).length]),
  ) as Record<string, number>;
  const sources = SOURCES.filter(
    (s) =>
      sourceMatchesType(s, filter) &&
      (region === "All regions" || s.jurisdiction.includes(region)) &&
      (validation === "All" || s.status === validation) &&
      Object.values(s).join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );
  const needsReview = SOURCES.filter((s) => s.status === "Needs review").length;
  async function copyCitation(source: (typeof SOURCES)[number]) {
    const text = citationFor(source);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(source.title);
    window.setTimeout(() => setCopied((c) => (c === source.title ? "" : c)), 1500);
  }
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
        {categories.map((x) => (
          <Button
            key={x}
            variant={filter === x ? "default" : "outline"}
            aria-pressed={filter === x}
            onClick={() => setFilter(x)}
          >
            {x} <span>{categoryCounts[x]}</span>
          </Button>
        ))}
      </div>
      <div className="resource-result-bar">
        <p className="muted" aria-live="polite">
          Showing <strong>{sources.length}</strong> of {SOURCES.length} resources
          {needsReview ? ` · ${needsReview} flagged for review` : ""}
        </p>
        <label>
          Validation
          <select
            aria-label="Validation status"
            value={validation}
            onChange={(e) => setValidation(e.target.value)}
          >
            {["All", "Page checked", "Search checked", "Dated", "Needs review"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
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
            <h3>
              {s.url !== "#" ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
            </h3>
            <span className="resource-publisher">{s.publisher}</span>
            <p className="muted">{s.summary}</p>
            <ul className="resource-highlights">
              <li>{s.highlight1}</li>
              <li>{s.highlight2}</li>
            </ul>
            <p className="resource-access">
              <strong>Access:</strong> {s.access}
            </p>
            <p className={s.status === "Needs review" ? "danger" : ""}>
              <Dot
                tone={
                  s.status === "Page checked"
                    ? "success"
                    : s.status === "Needs review"
                      ? "danger"
                      : "warning"
                }
              />
              <strong>Validation:</strong> {s.status} · <strong>Validated:</strong> {s.verified}
            </p>
            <p className="muted resource-check">
              <strong>Method:</strong> {s.checkMethod}
            </p>
            <div className="resource-actions" aria-label="Resource actions">
              {s.url !== "#" ? (
                <Button variant="link" asChild>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    Open source <ArrowSquareOut />
                  </a>
                </Button>
              ) : (
                <span className="muted">Authored model · no external link</span>
              )}
              <Button variant="outline" size="sm" onClick={() => void copyCitation(s)}>
                {copied === s.title ? "Citation copied" : "Copy citation"}
              </Button>
            </div>
          </article>
        ))}
      </div>
      {sources.length === 0 && (
        <div className="empty-state">
          <EmptyResources />
          <h3>No matching resources</h3>
          <p className="muted">
            Try clearing filters or searching by publisher, topic, or jurisdiction.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setQuery("");
              setFilter("All");
              setRegion("All regions");
              setValidation("All");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
      <p className="footnote">
        Checked 20 Oct 2026. Checks cover publisher identity and resource relevance; each entry
        records its check method. They do not certify compliance or guarantee future availability.
        Tier A: public institutions, standards bodies and independent research/security
        organisations; Tier B: vendor documentation; Tier C: VERITRAIL-authored advice. Standards
        and frameworks are not laws. No live regulatory feed. Next review 2027-01-15; confirm
        current legal text and implementation guidance before relying on obligations or dates.
      </p>
    </>
  );
}
/** Short, stable fingerprint of a pack for the preview sign-off (not a cryptographic hash). */
function packHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
export function ExportScreen() {
  const { workspaceName, state, scores, gate, blocking, userId } = useGovernance();
  const trail = useTrail();
  const [signed, setSigned] = useState<{ who: string; at: string; hash: string } | null>(null);
  const [packId, setPack] = useState("exec"),
    [format, setFormat] = useState("PDF"),
    [status, setStatus] = useState("idle"),
    [generated, setGenerated] = useState<{ blob: Blob; filename: string } | null>(null),
    [error, setError] = useState("");
  const pack = PACKS.find((p) => p.id === packId) ?? at(PACKS, 0);
  const icons = [Newspaper, Table, SealCheck];
  const attached = Object.values(state.answers).filter((a) => a.e === 3).length;
  const unattachedCritical = CONTROLS.filter(
    (c) => c.w === "Critical" && answerAt(state.answers, c.id).e !== 3,
  ).length;
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
  const canSign = blocking.length === 0 && unattachedCritical === 0;
  function signOff() {
    const at = new Date().toISOString();
    const who = trailActor(userId);
    const hash = packHash(
      JSON.stringify([pack.id, workspaceName, scores, gate, state.answers, at.slice(0, 16)]),
    );
    setSigned({ who, at, hash });
    recordTrail({
      title: `${pack.name} signed off (preview) · ${hash}`,
      who,
      ref: pack.name,
      outcome: "attested",
    });
  }
  return (
    <>
      <PageHeader
        eyebrow={`${workspaceName} · Evidence`}
        title="Reports & audit pack"
        meta={[
          "Client-ready governance deliverables · previews",
          `${attached} of ${CONTROLS.length} controls evidenced · gate ${gate}`,
        ]}
      />
      <p className="muted">Client-ready governance deliverables</p>
      <div className="export-evidence-note" role="status">
        <Kicker>Preview context</Kicker>
        <p>
          <strong>{attached}</strong> of {CONTROLS.length} controls have evidence attached
          {unattachedCritical ? (
            <>
              {" "}
              · <strong>{unattachedCritical}</strong> critical control
              {unattachedCritical === 1 ? "" : "s"} without attached evidence
            </>
          ) : (
            " · all critical controls have evidence attached"
          )}
          . Exports are demo previews of the current workspace state, not signed or certified
          deliverables.
        </p>
      </div>
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
              VERITRAIL_{pack.name.replace(/ /g, "-")}_
              {workspaceName.replace(/[^a-zA-Z0-9]+/g, "-")}.{format.toLowerCase()}
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
      <section className="signoff-panel" aria-labelledby="signoff-heading">
        <div className="section-heading">
          <h2 id="signoff-heading">Sign-off</h2>
          <Chip tone="warning">Preview</Chip>
        </div>
        {signed ? (
          <div className="signoff-signed">
            <SealCheck weight="fill" aria-hidden="true" />
            <div>
              <strong>{pack.name} signed off (preview)</strong>
              <p className="muted mono">
                {signed.who} · {formatUtc(signed.at)} · pack {signed.hash}
              </p>
              <p className="muted">
                A preview attestation for this session only: nothing is certified and no signed
                export is produced.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="muted">
              {canSign
                ? "No blocking controls and every critical control has evidence attached: the pack can be signed off as a preview."
                : `Sign-off is disabled while ${blocking.length} blocking control${blocking.length === 1 ? "" : "s"} remain${blocking.length === 1 ? "s" : ""}${unattachedCritical ? ` and ${unattachedCritical} critical control${unattachedCritical === 1 ? "" : "s"} lack${unattachedCritical === 1 ? "s" : ""} attached evidence` : ""}.`}
            </p>
            <Button
              variant="seal"
              disabled={!canSign}
              onClick={signOff}
              title={canSign ? undefined : "Resolve blocking controls and attach evidence first"}
            >
              <SealCheck weight="fill" />
              Sign off {pack.name} (preview)
            </Button>
            {!canSign && (
              <Button variant="link" asChild>
                <RouteLink to="/gates">Review blocking controls</RouteLink>
              </Button>
            )}
          </>
        )}
      </section>
      <section className="trail-panel" aria-labelledby="trail-heading">
        <div className="section-heading">
          <h2 id="trail-heading">Evidence trail</h2>
          <Chip tone="warning">Preview · this session</Chip>
        </div>
        <p className="muted">
          Every score, evidence status, disposition and sign-off recorded in this tab, newest first.
          The trail is a preview held in memory until an append-only record exists; it is not part
          of the saved workspace.
        </p>
        <EvidenceTimeline
          entries={trail}
          empty="Nothing recorded yet in this session. Changes in the assessment and inventory will appear here."
        />
      </section>
    </>
  );
}
export function MoreScreen() {
  const { userId } = useGovernance();
  const [dark, toggleDark] = useDarkTheme();
  const appearance = useAppearanceSummary();
  const items = [
    {
      to: "/",
      name: "VERITRAIL website",
      desc: "Framework, solutions and public tools",
      icon: ArrowSquareOut,
    },
    {
      to: "/assess",
      name: "TILLER assessment",
      desc: "Six pillars mapped to NIST AI RMF",
      icon: CheckCircle,
    },
    {
      to: "/gates",
      name: "Release readiness",
      desc: "Readiness by risk tier",
      icon: TrafficSignal,
    },
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
      name: "Templates",
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
      to: "/actions",
      name: "Corrective actions",
      desc: "Owned remediation, evidence and effectiveness verification",
      icon: CheckCircle,
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
      to: "/advisor",
      name: "AI governance advisor",
      desc: "Describe a concern; get mapped controls and suggested actions",
      icon: Sparkle,
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
    { to: "/plans", name: "Plans", desc: "Free · Team · Business · Enterprise", icon: Tag },
  ] as const;
  return (
    <>
      <PendingInviteBanner />
      <WorkspaceControls />
      <TeamPanel />
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
      <button type="button" className="toggle-row appearance-row" onClick={openAppearance}>
        <span>
          <Palette weight="duotone" />
          <span>
            Appearance
            <small>{appearance}</small>
          </span>
        </span>
        <CaretRight />
      </button>
      <label className="toggle-row dark-toggle">
        <span>
          <Moon weight="duotone" />
          Dark mode
        </span>
        <Switch aria-label="Dark mode" checked={dark} onCheckedChange={toggleDark} />
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
      <p className="footnote">VERITRAIL · AI Governance, Guardrails & Assurance Studio</p>
    </>
  );
}
export function OnboardingScreen() {
  const [email, setEmail] = useState("");
  return (
    <div className="onboarding">
      <p className="onboarding-wordmark">VERITRAIL</p>
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
        <Link to="/auth" search={email.trim() ? { email: email.trim() } : {}}>
          Continue with email
          <ArrowRight />
        </Link>
      </Button>
      <Button variant="outline" className="full-button" asChild>
        <Link to="/workspace">Explore the demo workspace</Link>
      </Button>
      <Button variant="outline" className="full-button" asChild>
        <Link to="/assess">Start free Governance Snapshot</Link>
      </Button>
      <p className="footnote">
        All scoring runs on-device. The demo workspace does not create an account; sign in to keep
        private workspaces.
      </p>
    </div>
  );
}
