import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  BookOpenText,
  Briefcase,
  CalendarCheck,
  ClipboardText,
  Code,
  Database,
  Gauge,
  GitBranch,
  LockKey,
  Robot,
  Rocket,
  Scales,
  SealCheck,
  ShieldCheck,
  TreeStructure,
  type IconProps,
} from "@phosphor-icons/react";
import type { Token, Tokens } from "marked";
import { controls, maturityTemplate, pillars, siteConfig } from "./content";
import { ControlMosaic, SectionArt } from "./illustrations";
import { HowItWorksArt } from "./illustrations-tools";
import {
  SiteMarkdown,
  renderInlineMarkdown,
  safeHref,
  splitSections,
  useInternalLinkHandler,
  type MarkdownSection,
} from "./markdown";
import { PageEnd } from "./page-end";
import type { SitePage } from "./pages";
import { SiteLink } from "./ui";
import { WorkspaceGateway } from "./workspace-gateway";
import { AiDiscussionBand } from "./ai-discussion-band";
import { ServicePathways } from "./service-pathways";

// The home page: the same platform/content/website_pages/index.md as before, laid out as a
// visual story. Each "## section" is read from the Markdown; sections with a known shape (the
// start options, the six layers, the five pillars, the stakeholder table) get a dedicated
// layout, and anything that no longer matches that shape falls back to the plain rendering.

type Icon = ComponentType<IconProps>;

function Inline({ md }: { md: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(md) }} />;
}

/** Markdown for every token except those the layout draws itself. */
function rawExcept(tokens: Token[], skip: (t: Token) => boolean): string {
  return tokens
    .filter((t) => !skip(t))
    .map((t) => t.raw)
    .join("");
}

function firstOf<T extends Token>(tokens: Token[], type: string): T | undefined {
  return tokens.find((t) => t.type === type) as T | undefined;
}

function linkIn(tokens: Token[] | undefined): Tokens.Link | undefined {
  for (const t of tokens ?? []) {
    if (t.type === "link") return t as Tokens.Link;
    const nested = linkIn((t as Token & { tokens?: Token[] }).tokens);
    if (nested) return nested;
  }
  return undefined;
}

// ------------------------------------------------------------------------------- hero

function HeroTitle({ text }: { text: string }) {
  const cut = text.lastIndexOf(" ");
  if (cut < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, cut + 1)}
      <span className="hero-em">{text.slice(cut + 1)}</span>
    </>
  );
}

/**
 * The evidence card beside the hero copy: the five pillars of the governed control library with
 * their control and critical counts, laid out like a register so the page shows, not tells,
 * what an evidence trail looks like. Every figure comes from platform/content/controls.
 */
function EvidenceCard() {
  return (
    <aside className="evidence-card" aria-label="Control library at a glance">
      <div className="evidence-card-head">
        <span className="evidence-card-title">Evidence register</span>
        <span className="evidence-card-meta">
          {controls.length} controls · {pillars.length} pillars
        </span>
      </div>
      <ol className="evidence-rows">
        {pillars.map((p) => {
          const items = controls.filter((c) => c.pillar === p.id);
          const critical = items.filter((c) => c.priority === "critical").length;
          const high = items.filter((c) => c.priority === "high").length;
          return (
            <li key={p.id} className="evidence-row">
              <span className="evidence-code">{p.id}</span>
              <span className="evidence-name">{p.name}</span>
              <span className="evidence-bar" aria-hidden="true">
                <span className="seg seg-critical" style={{ flex: critical }} />
                <span className="seg seg-high" style={{ flex: high }} />
                <span className="seg seg-medium" style={{ flex: items.length - critical - high }} />
              </span>
              <span className="evidence-count">
                {items.length}
                <small> · {critical} critical</small>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="evidence-card-foot">
        <span className="legend-swatch legend-critical" /> Critical
        <span className="legend-swatch legend-high" /> High
        <span className="legend-swatch legend-medium" /> Medium priority
      </p>
    </aside>
  );
}

function HomeHero({ page, layers }: { page: SitePage; layers: number }) {
  const primary = page.primaryCta ? siteConfig.ctas[page.primaryCta] : undefined;
  const secondary = page.secondaryCta ? siteConfig.ctas[page.secondaryCta] : undefined;
  const questions = (maturityTemplate.questions ?? []).length as number;
  const stats: Array<[string, string]> = [
    [String(controls.length), "governance controls"],
    [String(pillars.length), "framework pillars"],
    [String(layers), "layers, one system"],
    [String(questions), "question self-assessment"],
  ];
  return (
    <>
      {/* The hero is a navy band: `dark` scopes the dark tokens to it in both modes. */}
      <section className="hero hero--home hero--navy dark" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Evidence-first · Human-led · Enterprise-focused</p>
            <h1 id="hero-title">
              <HeroTitle text={page.h1} />
            </h1>
            <p className="lead">{page.lead ?? page.description}</p>
            <p className="hero-actions">
              {primary && (
                <SiteLink
                  className="btn btn-primary btn-lg"
                  href={primary.url}
                  cta={`hero-${page.primaryCta}`}
                >
                  {primary.label}
                  <ArrowRight weight="bold" aria-hidden="true" className="btn-icon" />
                </SiteLink>
              )}
              {secondary && (
                <SiteLink
                  className="btn btn-secondary btn-lg"
                  href={secondary.url}
                  cta={`hero-${page.secondaryCta}`}
                >
                  {secondary.label}
                </SiteLink>
              )}
            </p>
            <p className="hero-note">
              <ShieldCheck weight="duotone" aria-hidden="true" />
              <span>
                VERITRAIL supports readiness and evidence. It does not certify compliance.{" "}
                <Link to="/workspace">Open the governance workspace</Link>.
              </span>
            </p>
          </div>
          <EvidenceCard />
        </div>
      </section>
      <section className="proof-strip" aria-label="VERITRAIL at a glance">
        <div className="container proof-inner">
          <ul className="stat-list">
            {stats.map(([n, label]) => (
              <li key={label}>
                <strong>{n}</strong>
                <span>{label}</span>
              </li>
            ))}
          </ul>
          <p className="framework-strip">
            <span>Indicative mappings to</span>
            <SiteLink href="/compliance/nist-ai-rmf">NIST AI RMF</SiteLink>
            <SiteLink href="/compliance/eu-ai-act">EU AI Act</SiteLink>
            <SiteLink href="/compliance/iso-42001">ISO/IEC 42001</SiteLink>
          </p>
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------------- section layouts

const START_ICONS: Array<[RegExp, Icon]> = [
  [/maturity-assessment/, Gauge],
  [/governance-baseline/, CalendarCheck],
  [/agent/, Robot],
  [/blueprint/, BookOpenText],
];

interface StartCard {
  href: string;
  title: string;
  text: string;
}

function parseStartCards(section: MarkdownSection): StartCard[] | null {
  const list = firstOf<Tokens.List>(section.tokens, "list");
  const cards: StartCard[] = [];
  for (const item of list?.items ?? []) {
    const link = linkIn(item.tokens);
    if (!link) return null;
    const rest = item.text.slice(item.text.indexOf(link.raw) + link.raw.length);
    cards.push({
      href: safeHref(link.href),
      title: link.text,
      text: rest.replace(/^\s*[—–-]\s*/, ""),
    });
  }
  return cards.length ? cards : null;
}

function StartCards({ cards }: { cards: StartCard[] }) {
  return (
    <ul className="start-cards">
      {cards.map((c, i) => {
        const Icon = START_ICONS.find(([re]) => re.test(c.href))?.[1] ?? ArrowRight;
        return (
          <li key={c.href} className="start-card">
            <span className="start-icon">
              <Icon weight="duotone" aria-hidden="true" />
            </span>
            {i === 0 && <span className="start-badge">Free · start here</span>}
            <h3>
              <SiteLink href={c.href} className="stretched-link">
                {c.title}
              </SiteLink>
            </h3>
            <p>
              <Inline md={c.text.charAt(0).toUpperCase() + c.text.slice(1)} />
            </p>
            <ArrowRight className="start-arrow" weight="bold" aria-hidden="true" />
          </li>
        );
      })}
    </ul>
  );
}

const LAYER_ICONS: Icon[] = [ClipboardText, Database, GitBranch, ShieldCheck, SealCheck, Robot];

function LayerStack({ section, table }: { section: MarkdownSection; table: Tokens.Table }) {
  const onClick = useInternalLinkHandler();
  return (
    <>
      <SiteMarkdown className="prose" body={rawExcept(section.tokens, (t) => t === table)} />
      <div className="layer-layout">
        <div className="layer-art">
          <SectionArt kind="solutions" />
        </div>
        <ol className="layer-list" onClick={onClick}>
          {table.rows.map((row, i) => {
            const [layer, what, capability] = row.map((c) => c.text);
            const name = (layer ?? "").replace(/^\d+\.\s*/, "");
            const Icon = LAYER_ICONS[i] ?? ShieldCheck;
            return (
              <li key={name} className="layer-row">
                <span className="layer-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="layer-body">
                  <h3>
                    <Icon weight="duotone" aria-hidden="true" /> {name}
                  </h3>
                  <p>
                    <Inline md={what ?? ""} />
                  </p>
                  <p className="layer-capability">
                    <Inline md={capability ?? ""} />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}

interface PillarCard {
  href: string;
  pillar: (typeof pillars)[number];
  question: string;
}

function parsePillarCards(table: Tokens.Table): PillarCard[] | null {
  const cards: PillarCard[] = [];
  for (const row of table.rows) {
    const link = linkIn(row[0]?.tokens);
    const code = /\(([A-Z]{2})\)\s*$/.exec(link?.text ?? "")?.[1];
    const pillar = pillars.find((p) => p.id === code);
    if (!link || !pillar) return null;
    cards.push({ href: safeHref(link.href), pillar, question: row[1]?.text ?? "" });
  }
  return cards.length ? cards : null;
}

function PillarSection({
  section,
  table,
  cards,
}: {
  section: MarkdownSection;
  table: Tokens.Table;
  cards: PillarCard[];
}) {
  const [intro = "", outro = ""] = section.body.split(table.raw);
  return (
    <>
      <div className="pillar-intro">
        <SiteMarkdown className="prose" body={intro} />
        <figure className="mosaic-figure">
          <ControlMosaic />
          <figcaption className="mosaic-legend">
            <span className="legend-swatch legend-critical" /> Critical
            <span className="legend-swatch legend-high" /> High
            <span className="legend-swatch legend-medium" /> Medium priority
          </figcaption>
        </figure>
      </div>
      <ul className="pillar-grid">
        {cards.map((c) => {
          const items = controls.filter((x) => x.pillar === c.pillar.id);
          const critical = items.filter((x) => x.priority === "critical").length;
          return (
            <li key={c.pillar.id} className="pillar-tile">
              <span className="pillar-code">{c.pillar.id}</span>
              <h3>
                <SiteLink href={c.href} className="stretched-link">
                  {c.pillar.name}
                </SiteLink>
              </h3>
              <p className="pillar-question">
                <Inline md={c.question} />
              </p>
              <p className="pillar-stats">
                <strong>{items.length}</strong> controls · <strong>{critical}</strong> critical
              </p>
            </li>
          );
        })}
      </ul>
      <SiteMarkdown className="prose prose--after" body={outro} />
    </>
  );
}

const STAKEHOLDER_ICONS: Array<[RegExp, Icon]> = [
  [/CISO/i, LockKey],
  [/CIO|CTO/i, Rocket],
  [/Risk|Compliance/i, Scales],
  [/CoE/i, TreeStructure],
  [/Engineer/i, Code],
  [/Consult|advis/i, Briefcase],
];

interface Step {
  name: string;
  text: string;
}

/** "1. **Baseline.** text" items of the How-it-works list; null when the list has another shape. */
function parseSteps(section: MarkdownSection): Step[] | null {
  const list = firstOf<Tokens.List>(section.tokens, "list");
  if (!list?.ordered) return null;
  const steps: Step[] = [];
  for (const item of list.items) {
    const m = /^\s*\*\*([^*]+?)\.?\*\*\s*(.*)$/s.exec(item.text);
    if (!m) return null;
    steps.push({ name: (m[1] ?? "").trim(), text: (m[2] ?? "").trim() });
  }
  return steps.length >= 2 ? steps : null;
}

function StepTabs({ section, steps }: { section: MarkdownSection; steps: Step[] }) {
  const list = firstOf<Tokens.List>(section.tokens, "list");
  const onClick = useInternalLinkHandler();
  return (
    <>
      <SiteMarkdown className="prose" body={rawExcept(section.tokens, (t) => t === list)} />
      <Tabs defaultValue={steps[0]?.name} className="step-tabs" onClick={onClick}>
        <TabsList className="step-tablist" aria-label="How it works, step by step">
          {steps.map((st, i) => (
            <TabsTrigger key={st.name} value={st.name} className="step-tab">
              <span className="step-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {st.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {steps.map((st, i) => (
          <TabsContent key={st.name} value={st.name} className="step-panel" forceMount>
            <p className="step-eyebrow">
              Step {i + 1} of {steps.length}
            </p>
            <h3>{st.name}</h3>
            <p>
              <Inline md={st.text} />
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

/** The stakeholder table as a chip selector: pick who you are, read the need and what VERITRAIL provides. */
function StakeholderSelector({
  section,
  table,
}: {
  section: MarkdownSection;
  table: Tokens.Table;
}) {
  const [, needLabel, providesLabel] = table.header.map((h) => h.text);
  const rows = table.rows.map((row) => {
    const [who = "", need = "", provides = ""] = row.map((c) => c.text);
    return { who, need, provides, plain: who.replace(/\*\*/g, "") };
  });
  const [current, setCurrent] = useState(rows[0]?.plain ?? "");
  return (
    <>
      <SiteMarkdown className="prose" body={rawExcept(section.tokens, (t) => t === table)} />
      <Tabs value={current} onValueChange={setCurrent} className="stakeholder-tabs">
        <TabsList className="stakeholder-chips" aria-label="Choose a stakeholder">
          {rows.map((r) => {
            const Icon = STAKEHOLDER_ICONS.find(([re]) => re.test(r.plain))?.[1] ?? Briefcase;
            return (
              <TabsTrigger key={r.plain} value={r.plain} className="stakeholder-chip">
                <Icon weight="duotone" aria-hidden="true" />
                <Inline md={r.who} />
              </TabsTrigger>
            );
          })}
        </TabsList>
        {rows.map((r) => (
          <TabsContent key={r.plain} value={r.plain} className="stakeholder-panel" forceMount>
            <dl>
              <div>
                <dt>{needLabel}</dt>
                <dd>
                  <Inline md={r.need} />
                </dd>
              </div>
              <div>
                <dt>{providesLabel}</dt>
                <dd>
                  <Inline md={r.provides} />
                </dd>
              </div>
            </dl>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function tableWithColumns(section: MarkdownSection, columns: number): Tokens.Table | undefined {
  const table = firstOf<Tokens.Table>(section.tokens, "table");
  return table && table.header.length === columns && table.rows.length ? table : undefined;
}

/**
 * Dedicated layouts by section id. Each returns null when the Markdown no longer has the shape
 * it expects, and the section is then rendered as plain Markdown.
 */
const LAYOUTS: Record<string, (section: MarkdownSection) => ReactNode | null> = {
  "four-ways-to-start": (section) => {
    const cards = parseStartCards(section);
    return cards ? <StartCards cards={cards} /> : null;
  },
  "six-layers-one-governance-system": (section) => {
    const table = tableWithColumns(section, 3);
    return table ? <LayerStack section={section} table={table} /> : null;
  },
  "five-pillars-64-controls": (section) => {
    const table = tableWithColumns(section, 2);
    const cards = table && parsePillarCards(table);
    return table && cards ? <PillarSection section={section} table={table} cards={cards} /> : null;
  },
  "value-by-stakeholder": (section) => {
    const table = tableWithColumns(section, 3);
    return table ? <StakeholderSelector section={section} table={table} /> : null;
  },
  "how-it-works": (section) => {
    const steps = parseSteps(section);
    return steps ? <StepTabs section={section} steps={steps} /> : null;
  },
};

const EYEBROWS: Record<string, string> = {
  "four-ways-to-start": "Get started",
  "the-problem-five-questions-most-enterprises-cannot-answer-with-evidence": "Why it matters",
  "six-layers-one-governance-system": "The system",
  "five-pillars-64-controls": "The framework",
  "how-it-works": "The method",
  "what-veritrail-does-and-does-not-claim": "Our position",
  "value-by-stakeholder": "Who it serves",
  "start-with-an-honest-baseline": "Next step",
};

/** The phrase a section quotes ("we think so"), for a pull-quote beside it. */
function quotedPhrase(section: MarkdownSection): string | undefined {
  return /["“]([^"”]{4,40})["”]/.exec(section.body)?.[1];
}

/** Visual companions for text-only sections, so wide screens are not half empty. */
const ASIDES: Record<string, (section: MarkdownSection) => ReactNode | null> = {
  "the-problem-five-questions-most-enterprises-cannot-answer-with-evidence": (section) => {
    const phrase = quotedPhrase(section);
    if (!phrase) return null;
    return (
      <figure className="pull-quote">
        <blockquote>{phrase.charAt(0).toUpperCase() + phrase.slice(1)}.</blockquote>
        <figcaption>
          Too often the honest answer when a board member, auditor, customer or regulator asks about
          AI.
        </figcaption>
      </figure>
    );
  },
  "how-it-works": () => <HowItWorksArt />,
  "what-veritrail-does-and-does-not-claim": () => <SectionArt kind="compliance" />,
};

/** Sections drawn on a contrasting band, for rhythm down a long page. */
const BANDED = new Set([
  "the-problem-five-questions-most-enterprises-cannot-answer-with-evidence",
  "five-pillars-64-controls",
  "value-by-stakeholder",
]);
/** The closing call to action sits on a navy band (the dark tokens scoped to it). */
const NAVY = new Set(["start-with-an-honest-baseline"]);

function HomeSection({ section }: { section: MarkdownSection }) {
  const main = LAYOUTS[section.id]?.(section) ?? (
    <SiteMarkdown className="prose" body={section.body} />
  );
  const aside = ASIDES[section.id]?.(section);
  const content = aside ? (
    <div className="home-split">
      <div>{main}</div>
      <aside className="home-aside">{aside}</aside>
    </div>
  ) : (
    main
  );
  if (!section.id) return <div className="container">{content}</div>;
  return (
    <section
      className={`home-section home-section--${section.id}${BANDED.has(section.id) ? " home-band" : ""}${NAVY.has(section.id) ? " home-band--navy dark" : ""}`}
      aria-labelledby={section.id}
    >
      <div className="container">
        <header className="home-section-head">
          {EYEBROWS[section.id] && <p className="eyebrow">{EYEBROWS[section.id]}</p>}
          <h2 id={section.id}>{section.title}</h2>
        </header>
        {content}
      </div>
    </section>
  );
}

export function HomeTemplate({ page }: { page: SitePage }) {
  const sections = useMemo(() => splitSections(page.body), [page.body]);
  const layers =
    firstOf<Tokens.Table>(
      sections.find((s) => s.id === "six-layers-one-governance-system")?.tokens ?? [],
      "table",
    )?.rows.length ?? 6;
  return (
    <>
      <HomeHero page={page} layers={layers} />
      <ServicePathways />
      <nav className="home-directory container" aria-label="Explore this page">
        <a href="#four-ways-to-start">Get started</a>
        <a href="#five-pillars-64-controls">Governance framework</a>
        <a href="#workspace-heading">Practitioner workspace</a>
        <a href="#ai-discussion-title">AI guidance</a>
      </nav>
      <div className="home-sections">
        {sections.map((s) => (
          <HomeSection key={s.id || "intro"} section={s} />
        ))}
      </div>
      <WorkspaceGateway />
      <AiDiscussionBand />
      <div className="container page-body home-end">
        <PageEnd faq={page.faq} updated={page.updated} />
      </div>
    </>
  );
}
