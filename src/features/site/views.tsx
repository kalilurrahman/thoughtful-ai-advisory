import { Suspense, useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  APPLIES_LABELS,
  STANDARD_DISCLAIMER,
  controlLibrary,
  controlMappings,
  controlUrl,
  controls,
  getControl,
  getPillar,
  maturityTemplate,
  pillars,
  siteConfig,
  type VeritrailControl,
} from "./content";
import { FORMS, LeadForm, formSubmitLabel } from "./forms";
import type { LeadForm as LeadFormKey } from "./leads.functions";
import { Breadcrumbs } from "./layout";
import { InlineMarkdown, SiteMarkdown, extractHeadings, readingMinutes } from "./markdown";
import { CONTROL_LIBRARY_PATH, breadcrumbsFor, type FaqItem, type SitePage } from "./pages";
import { CtaBlock, SiteLink } from "./ui";
import { TOOL_COMPONENTS } from "./tools/registry";
import { ControlMosaic, SectionArt, artFor, type ArtKind } from "./illustrations";
import { OnThisPage, formatDate } from "./reading";
import { PageEnd } from "./page-end";
import { HomeTemplate } from "./home";

// Page templates — ported from platform/app/website/templates/{home,page,form,tool,
// controls_index,control,404}.html.

const TOOL_META: Record<string, { anchor: string; jump: string }> = {
  "maturity-assessment": { anchor: "assessment", jump: "Start the assessment" },
  "guardrail-generator": { anchor: "guardrail-generator", jump: "Go to the tool" },
  "ask-veritrail": { anchor: "ask-veritrail", jump: "Go to the tool" },
  "risk-triage": { anchor: "risk-triage", jump: "Go to the tool" },
};

export function PageHeader({
  h1,
  lead,
  eyebrow,
  meta,
  art,
}: {
  h1: string;
  lead?: string | undefined;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  art?: ReactNode;
}) {
  return (
    <div className={`page-header${art ? " page-header--art" : ""}`}>
      <div className="container page-header-grid">
        <div className="page-header-text">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{h1}</h1>
          {lead && <p className="lead">{lead}</p>}
          {meta && <p className="page-meta">{meta}</p>}
        </div>
        {art && <div className="page-header-art">{art}</div>}
      </div>
    </div>
  );
}

/** Section label, reading time and review date shown under a page title. */
function pageHeaderProps(page: SitePage, kind?: ArtKind) {
  const art = kind ?? artFor(page.path, page.section);
  const minutes = readingMinutes(page.body);
  const parts: string[] = [];
  // Blog posts already state their reading time in the byline.
  if (page.template === "page" && minutes >= 2 && !/minutes to read/.test(page.body))
    parts.push(`${minutes} min read`);
  if (page.updated) parts.push(`Reviewed ${formatDate(page.updated)}`);
  return {
    h1: page.h1,
    lead: page.lead,
    eyebrow: siteConfig.section_labels[page.section] ?? undefined,
    meta: parts.length ? parts.join(" · ") : undefined,
    art: art ? <SectionArt kind={art} /> : undefined,
  };
}

function EndCtas({ page }: { page: SitePage }) {
  const keys = [page.primaryCta, page.secondaryCta].filter(
    (k): k is string => !!k && !page.body.includes(`{{cta:${k}}}`),
  );
  if (!keys.length) return null;
  return (
    <div className="end-ctas">
      {keys.map((k) => (
        <CtaBlock key={k} ctaKey={k} variant="end" />
      ))}
    </div>
  );
}

function ArticleTemplate({ page }: { page: SitePage }) {
  const toc = useMemo(() => {
    const entries = extractHeadings(page.body);
    if (page.faq.length) entries.push({ id: "faq-heading", text: "Frequently asked questions" });
    return entries;
  }, [page.body, page.faq.length]);
  const withToc = toc.length >= 3;
  return (
    <>
      <PageHeader {...pageHeaderProps(page)} />
      <div className={`container page-body article-layout${withToc ? " has-toc" : ""}`}>
        {withToc && <OnThisPage key={page.path} entries={toc} />}
        <div className="article-main">
          <article>
            <SiteMarkdown className="prose" body={page.body} />
          </article>
          <PageEnd faq={page.faq} updated={page.updated} />
          <EndCtas page={page} />
        </div>
      </div>
    </>
  );
}

function FormTemplate({ page }: { page: SitePage }) {
  const form = (page.form ?? "contact") as LeadFormKey;
  return (
    <>
      <PageHeader {...pageHeaderProps(page, "contact")} />
      <div className="container page-body layout-split">
        <SiteMarkdown className="prose" body={page.body} />
        <section className="form-panel" aria-labelledby="form-heading">
          <h2 id="form-heading">{formSubmitLabel(form)}</h2>
          {FORMS[form] ? <LeadForm form={form} /> : null}
        </section>
      </div>
      <div className="container">
        <PageEnd faq={page.faq} updated={page.updated} />
      </div>
    </>
  );
}

/** Shown while a lazily loaded tool's code arrives. */
export function ToolLoading() {
  return (
    <p className="tool-loading" role="status">
      Loading the tool…
    </p>
  );
}

function ToolTemplate({ page }: { page: SitePage }) {
  const meta = page.tool ? TOOL_META[page.tool] : undefined;
  const Component = page.tool ? TOOL_COMPONENTS[page.tool] : undefined;
  const tool = meta && Component ? { ...meta, Component } : undefined;
  const waitlist = page.tool === "waitlist";
  const anchor = tool?.anchor ?? "form-heading";
  return (
    <>
      <PageHeader {...pageHeaderProps(page, "tools")} />
      <div className="container page-body">
        {page.body.trim() && (
          <>
            <p className="tool-jump">
              <a className="btn btn-primary" href={`#${anchor}`}>
                {waitlist ? "Join the waitlist" : (tool?.jump ?? "Go to the tool")}
              </a>
            </p>
            <SiteMarkdown className="prose tool-intro" body={page.body} />
          </>
        )}
        {tool && (
          <Suspense fallback={<ToolLoading />}>
            <tool.Component />
          </Suspense>
        )}
        {waitlist && (
          <section className="form-panel" aria-labelledby="form-heading">
            <h2 id="form-heading">Join the waitlist</h2>
            <LeadForm form="waitlist" tool={page.path.split("/").pop() ?? ""} />
          </section>
        )}
        <PageEnd faq={page.faq} updated={page.updated} />
      </div>
    </>
  );
}

export function SitePageView({ page }: { page: SitePage }) {
  const crumbs = breadcrumbsFor(page.path, page.navLabel || page.h1);
  return (
    <div className={`tpl-${page.template}${page.tool ? ` tool-${page.tool}` : ""}`}>
      <Breadcrumbs crumbs={crumbs} />
      {page.template === "home" ? (
        <HomeTemplate page={page} />
      ) : page.template === "form" ? (
        <FormTemplate page={page} />
      ) : page.template === "tool" ? (
        <ToolTemplate page={page} />
      ) : (
        <ArticleTemplate page={page} />
      )}
    </div>
  );
}

const LIBRARY_FAQ: FaqItem[] = [];

export function ControlLibraryView() {
  const groups = pillars.map((p) => ({
    ...p,
    anchor: `pillar-${p.id.toLowerCase()}`,
    controls: controls.filter((c) => c.pillar === p.id),
  }));
  return (
    <div className="tpl-controls_index">
      <Breadcrumbs
        crumbs={breadcrumbsFor(CONTROL_LIBRARY_PATH, siteConfig.control_library.nav_label)}
      />
      <PageHeader
        h1="VERITRAIL Control Library"
        eyebrow="Framework"
        lead={`${controls.length} controls across ${pillars.length} pillars — each with an objective, an accountable owner, the evidence that demonstrates it, and indicative framework mappings.`}
        meta={`Control Library v${controlLibrary.version} · Effective ${formatDate(controlLibrary.effective_date)}`}
        art={
          <figure className="mosaic-figure">
            <ControlMosaic />
            <figcaption className="mosaic-legend">
              <span className="legend-swatch legend-critical" /> Critical
              <span className="legend-swatch legend-high" /> High
              <span className="legend-swatch legend-medium" /> Medium priority
            </figcaption>
          </figure>
        }
      />
      <div className="container page-body">
        <div className="prose">
          <p>
            The VERITRAIL Control Library v{controlLibrary.version} contains {controls.length}{" "}
            controls across five pillars. Each control has an objective, an accountable owner role,
            examples of the evidence that demonstrates it, and indicative mappings to NIST AI RMF,
            ISO/IEC 42001 and the EU AI Act.
          </p>
        </div>
        <nav className="pillar-cards" aria-label="Pillars">
          <ul>
            {groups.map((g) => {
              const critical = g.controls.filter((c) => c.priority === "critical").length;
              return (
                <li key={g.id}>
                  <a href={`#${g.anchor}`} className="pillar-card">
                    <span className="pillar-code">{g.id}</span>
                    <span className="pillar-name">{g.name}</span>
                    <span className="pillar-stats">
                      {g.controls.length} controls · {critical} critical
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <aside className="disclaimer" aria-label="Mapping disclaimer">
          <p>
            <strong>About the mappings:</strong> {controlLibrary.mapping_disclaimer}
          </p>
        </aside>
        {groups.map((g) => (
          <section className="pillar-group" aria-labelledby={g.anchor} key={g.id}>
            <h2 id={g.anchor}>
              {g.id} — {g.name}
            </h2>
            <p>{g.summary}</p>
            <div
              className="table-wrap"
              role="region"
              tabIndex={0}
              aria-label={`${g.name} controls`}
            >
              <table className="controls-table stack-table">
                <thead>
                  <tr>
                    <th scope="col">Control</th>
                    <th scope="col">Objective</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Applies to</th>
                  </tr>
                </thead>
                <tbody>
                  {g.controls.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">
                        <Link to={controlUrl(c.id)}>
                          <span className="control-id">{c.id}</span> {c.title}
                        </Link>
                      </th>
                      <td data-label="Objective">{c.objective}</td>
                      <td data-label="Priority">
                        <span className={`priority priority-${c.priority}`}>{c.priority}</span>
                      </td>
                      <td data-label="Applies to">
                        {APPLIES_LABELS[c.applies_to] ?? c.applies_to}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <PageEnd faq={LIBRARY_FAQ} updated={controlLibrary.effective_date} />
        <div className="end-ctas">
          <CtaBlock ctaKey="assessment" variant="end" />
          <CtaBlock ctaKey="baseline" variant="end" />
        </div>
      </div>
    </div>
  );
}

interface TemplateQuestion {
  id: string;
  text: string;
  controls: string[];
}
interface TemplateFlag {
  title: string;
  rationale: string;
  controls: string[];
}

export function ControlView({ control }: { control: VeritrailControl }) {
  const c = control;
  const pillar = getPillar(c.pillar);
  const idx = controls.findIndex((x) => x.id === c.id);
  const prev = idx > 0 ? controls[idx - 1] : undefined;
  const next = idx >= 0 && idx < controls.length - 1 ? controls[idx + 1] : undefined;
  const questions = ((maturityTemplate.questions ?? []) as TemplateQuestion[]).filter((q) =>
    q.controls.includes(c.id),
  );
  const flags = ((maturityTemplate.critical_flags ?? []) as TemplateFlag[]).filter((f) =>
    f.controls.includes(c.id),
  );
  return (
    <div className="tpl-control">
      <Breadcrumbs crumbs={breadcrumbsFor(controlUrl(c.id), c.id)} />
      <PageHeader
        eyebrow={
          <Link to={CONTROL_LIBRARY_PATH} hash={`pillar-${c.pillar.toLowerCase()}`}>
            {c.pillar} — {pillar?.name}
          </Link>
        }
        h1={`${c.id}: ${c.title}`}
        lead={c.objective}
        meta={
          <>
            Priority <span className={`priority priority-${c.priority}`}>{c.priority}</span> ·
            Owner: {c.owner_role}
          </>
        }
        art={<ControlMosaic compact highlight={c.id} />}
      />
      <div className="container page-body">
        <div className="prose">
          <h2 id="at-a-glance">At a glance</h2>
          <dl className="facts">
            <dt>Pillar</dt>
            <dd>
              {c.pillar} — {pillar?.name}
            </dd>
            <dt>Priority</dt>
            <dd>{c.priority}</dd>
            <dt>Applies to</dt>
            <dd>{APPLIES_LABELS[c.applies_to] ?? c.applies_to}</dd>
            <dt>Typical owner</dt>
            <dd>{c.owner_role}</dd>
            {c.modules && c.modules.length > 0 && (
              <>
                <dt>VERITRAIL modules</dt>
                <dd>{c.modules.join(", ")}</dd>
              </>
            )}
            <dt>Control library</dt>
            <dd>v{controlLibrary.version}</dd>
          </dl>
          <h2 id="evidence">Evidence that demonstrates this control</h2>
          <p>
            Examples of records an assessor would expect to see. Until a named reviewer has examined
            them, evidence is labelled <em>User-asserted</em> or <em>Missing evidence</em> in
            VERITRAIL outputs, never <em>Verified</em>.
          </p>
          <ul>
            {(c.evidence ?? []).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <h2 id="mappings">Indicative framework mappings</h2>
          <div
            className="table-wrap"
            role="region"
            tabIndex={0}
            aria-label={`Framework mappings for ${c.id}`}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Framework</th>
                  <th scope="col">References</th>
                </tr>
              </thead>
              <tbody>
                {controlMappings(c).map((m) => (
                  <tr key={m.framework}>
                    <th scope="row">{m.framework}</th>
                    <td>{m.refs.length ? m.refs.join(", ") : "No direct mapping"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">{controlLibrary.mapping_disclaimer}</p>
          {questions.length > 0 && (
            <>
              <h2 id="assessment">Where the self-assessment asks about it</h2>
              <ul>
                {questions.map((q) => (
                  <li key={q.id}>
                    <strong>{q.id}</strong> — {q.text}
                  </li>
                ))}
              </ul>
            </>
          )}
          {flags.length > 0 && (
            <>
              <h2 id="flags">Related critical risk flags</h2>
              <ul>
                {flags.map((f) => (
                  <li key={f.title}>
                    <strong>{f.title}</strong> — {f.rationale}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <nav className="pager" aria-label="Adjacent controls">
          {prev && (
            <Link className="pager-prev" to={controlUrl(prev.id)}>
              <span className="small">Previous</span> {prev.id} {prev.title}
            </Link>
          )}
          {next && (
            <Link className="pager-next" to={controlUrl(next.id)}>
              <span className="small">Next</span> {next.id} {next.title}
            </Link>
          )}
        </nav>
        <PageEnd updated={controlLibrary.effective_date} />
        <div className="end-ctas">
          <CtaBlock ctaKey="assessment" variant="end" />
          <CtaBlock ctaKey="baseline" variant="end" />
        </div>
      </div>
    </div>
  );
}

export function SiteNotFound() {
  return (
    <div className="tpl-404">
      <PageHeader
        h1="Page not found"
        lead="This trail goes cold — the page does not exist or has moved."
        art={<SectionArt kind="company" />}
      />
      <div className="container page-body">
        <div className="prose">
          <p>The page you were looking for does not exist or has moved.</p>
          <h2>Popular destinations</h2>
          <ul>
            <li>
              <Link to="/">VERITRAIL home</Link>
            </li>
            {["assessment", "baseline", "agent", "blueprint"].map((key) => {
              const cta = siteConfig.ctas[key];
              return cta ? (
                <li key={key}>
                  <SiteLink href={cta.url}>{cta.label}</SiteLink>
                </li>
              ) : null;
            })}
            <li>
              <Link to={CONTROL_LIBRARY_PATH}>VERITRAIL Control Library</Link>
            </li>
            <li>
              <Link to="/workspace">Governance workspace</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ head / SEO

const SITE_NAME = siteConfig.site_name;
const OG_DEFAULT = "/og-default.png";
/**
 * Published origin for absolute share-image URLs (link previews ignore relative ones). Set
 * VITE_SITE_URL for a custom domain; the default matches scripts/generate-sitemap.mjs.
 */
export const SITE_ORIGIN = (
  (import.meta.env["VITE_SITE_URL"] as string | undefined) ??
  "https://thoughtful-ai-governance.lovable.app"
).replace(/\/+$/, "");
/** Sections with their own link-preview image in public/og/ (scripts/generate-social-images.mjs). */
export const OG_SECTIONS = new Set<string>([
  "framework",
  "solutions",
  "compliance",
  "industries",
  "tools",
  "resources",
  "blog",
  "contact",
  "legal",
  "company",
  "controls",
  "glossary",
]);

/** Share image for a section (an ArtKind, "controls" or "glossary"), else the default card. */
export function ogImageFor(kind: string | undefined): string {
  return kind && OG_SECTIONS.has(kind) ? `/og/${kind}.png` : OG_DEFAULT;
}

function faqJsonLd(faq: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function siteHead(opts: {
  title: string;
  description: string;
  faq?: FaqItem[];
  noindex?: boolean;
  /** Site path of the share image (defaults to the VERITRAIL card). */
  image?: string;
}) {
  const image = `${SITE_ORIGIN}${opts.image ?? OG_DEFAULT}`;
  const meta: Array<Record<string, string>> = [
    { title: opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}` },
    { name: "description", content: opts.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: "VERITRAIL — Govern every AI system, agent and decision with evidence",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: image },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ];
  if (opts.noindex) meta.push({ name: "robots", content: "noindex, follow" });
  const scripts =
    opts.faq && opts.faq.length
      ? [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(opts.faq)) }]
      : [];
  return { meta, scripts };
}

export function sitePageHead(page: SitePage) {
  return siteHead({
    title: page.title,
    description: page.description,
    faq: page.faq,
    noindex: page.noindex,
    image: ogImageFor(page.path === "/" ? undefined : artFor(page.path, page.section)),
  });
}

export function controlHead(id: string) {
  const c = getControl(id);
  if (!c)
    return siteHead({
      title: "Control not found",
      description: STANDARD_DISCLAIMER,
      noindex: true,
    });
  return siteHead({
    title: `${c.id} ${c.title} — VERITRAIL control`,
    description: `VERITRAIL control ${c.id} (${c.title}): ${c.objective}`.slice(0, 158),
    image: ogImageFor("controls"),
  });
}

export const controlLibraryHead = () =>
  siteHead({
    title: `VERITRAIL Control Library — ${controls.length} AI governance controls`,
    description: `All ${controls.length} VERITRAIL AI governance controls by pillar, with objectives, owners, evidence and indicative NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings.`,
    image: ogImageFor("controls"),
  });
