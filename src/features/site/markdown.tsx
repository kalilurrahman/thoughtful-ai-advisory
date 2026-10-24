import { Fragment, useMemo, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Marked, type Token, type Tokens } from "marked";
import { controlUrl, getControl } from "./content";
import { ControlCitations, CtaBlock, Disclaimer } from "./ui";

// Safe Markdown for trusted, repository-authored website pages — a port of the platform's
// markdown_render.py rules: raw HTML is escaped, link schemes are restricted, body h1s are
// demoted to h2 and tables are wrapped in a focusable scroll region.
//
// Reading aids for long pages are added here too, from the structure authors already write, so
// the governed Markdown stays unchanged: lists whose items open with **bold** become feature
// cards (or numbered steps), lists of links become link cards, "**Core message: …**" lines
// become callouts, "**A → B → C**" lines become a sequence, tables stack into cards on phones,
// code blocks gain copy / expand buttons and control IDs such as IS-11 link to their control.

const SAFE_SCHEME = /^(https?|mailto|tel):/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
}

/** Internal links lose the static site's trailing slash; unsafe schemes become "#". */
export function safeHref(href: string): string {
  // eslint-disable-next-line no-control-regex -- strip control characters like the platform url_is_safe()
  const cleaned = href.replace(/[\x00-\x20\x7f]+/g, "");
  if (ANY_SCHEME.test(cleaned) && !SAFE_SCHEME.test(cleaned)) return "#";
  if (cleaned.startsWith("/")) {
    const [path = "", hash] = cleaned.split("#");
    const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
    return hash !== undefined ? `${p}#${hash}` : p;
  }
  return cleaned;
}

const CONTROL_REF_RE = /\b(?:AO|EI|GL|IS|SE)-\d{2}\b/g;
/** Headings and link text must not gain nested control links. */
let suppressControlRefs = 0;

function withoutControlRefs<T>(fn: () => T): T {
  suppressControlRefs++;
  try {
    return fn();
  } finally {
    suppressControlRefs--;
  }
}

/** Link known control IDs (IS-11, GL-04 …) in already-escaped text to their control pages. */
function linkControlRefs(escaped: string): string {
  if (suppressControlRefs > 0) return escaped;
  return escaped.replace(CONTROL_REF_RE, (id) => {
    const c = getControl(id);
    return c
      ? `<a class="control-ref" href="${controlUrl(c.id)}" title="${escapeHtml(`${c.id} ${c.title}`)}">${id}</a>`
      : id;
  });
}

type InlineParser = { parseInline: (t: Token[]) => string; parse: (t: Token[]) => string };
type RendererThis = { parser: InlineParser; tablecell: (c: Tokens.TableCell) => string };

/** The first inline token of a list item ("**Lead.** …" → strong, "[Lead](…) — …" → link). */
function leadToken(item: Tokens.ListItem): Token | undefined {
  const first = item.tokens[0] as Token & { tokens?: Token[] };
  if (!first || (first.type !== "text" && first.type !== "paragraph")) return undefined;
  return first.tokens?.find((t) => !(t.type === "text" && t.raw.trim() === ""));
}

/** Presentation class for a list, from what every item opens with. */
export function listVariant(token: Tokens.List): string | undefined {
  if (token.items.length < 2 || token.items.some((i) => i.task)) return undefined;
  const leads = token.items.map((i) => leadToken(i)?.type);
  if (leads.every((t) => t === "strong")) {
    if (token.ordered) return "step-list";
    const avg = token.items.reduce((n, i) => n + i.text.length, 0) / token.items.length;
    return token.items.length >= 4 && avg <= 300
      ? "feature-list feature-list--grid"
      : "feature-list";
  }
  if (!token.ordered && leads.every((t) => t === "link")) return "link-list";
  return undefined;
}

const LANG_LABELS: Record<string, string> = {
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  py: "Python",
  python: "Python",
  ts: "TypeScript",
  js: "JavaScript",
  bash: "Shell",
  sh: "Shell",
  text: "Text",
  md: "Markdown",
};
/** Code blocks longer than this start collapsed behind a "Show all" button. */
const CODE_COLLAPSE_LINES = 18;

const md: Marked = new Marked({
  gfm: true,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    heading(this: RendererThis, token: Tokens.Heading) {
      const depth = Math.max(2, token.depth);
      const inner = withoutControlRefs(() => this.parser.parseInline(token.tokens));
      return `<h${depth} id="${slugify(inner)}">${inner}</h${depth}>\n`;
    },
    link(this: RendererThis, token: Tokens.Link) {
      const href = safeHref(token.href);
      const text = withoutControlRefs(() => this.parser.parseInline(token.tokens));
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      const ext = /^https?:/i.test(href) ? ` rel="noopener noreferrer"` : "";
      const dl = href.startsWith("/downloads/") ? " download" : "";
      return `<a href="${escapeHtml(href)}"${title}${ext}${dl}>${text}</a>`;
    },
    image(token: Tokens.Image) {
      const src = safeHref(token.href);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}" loading="lazy" decoding="async">`;
    },
    text(token: Tokens.Text | Tokens.Escape) {
      if ("tokens" in token && token.tokens) return false;
      const escaped = "escaped" in token && token.escaped ? token.text : escapeHtml(token.text);
      return linkControlRefs(escaped);
    },
    list(token: Tokens.List) {
      const variant = listVariant(token);
      if (!variant) return false;
      const tag = token.ordered ? "ol" : "ul";
      const start = token.ordered && token.start !== 1 ? ` start="${token.start}"` : "";
      const items = token.items
        .map((item) => `<li>${(this as unknown as RendererThis).parser.parse(item.tokens)}</li>\n`)
        .join("");
      return `<${tag} class="${variant}"${start}>\n${items}</${tag}>\n`;
    },
    paragraph(this: RendererThis, token: Tokens.Paragraph): string | false {
      const only = token.tokens.length === 1 ? token.tokens[0] : undefined;
      if (!only || only.type !== "strong") return false;
      const text = (only as Tokens.Strong).text;
      const steps = text.split(/\s+→\s+/);
      if (steps.length >= 3 && steps.every((x) => x.trim() && x.length <= 40)) {
        const items = steps.map((x) => `<li>${escapeHtml(x.trim())}</li>`).join("");
        return `<ol class="flow-steps" aria-label="Sequence">${items}</ol>\n`;
      }
      const key = /^(Core (?:message|question)):\s*(.+)$/.exec(text);
      if (key)
        return `<p class="key-message"><span class="key-message-label">${key[1]}</span> ${md.parseInline(key[2] ?? "", { async: false })}</p>\n`;
      if (text.trim().endsWith(":")) return false;
      return `<p class="lead-callout">${this.parser.parseInline(token.tokens)}</p>\n`;
    },
    table(this: RendererThis, token: Tokens.Table) {
      const labels = token.header.map((h) =>
        escapeHtml(stripTags(withoutControlRefs(() => this.parser.parseInline(h.tokens)))),
      );
      const head = token.header.map((h) => this.tablecell(h)).join("");
      const body = token.rows
        .map(
          (row) =>
            `<tr>\n${row
              .map((cell, i) =>
                this.tablecell(cell).replace(/^<td/, `<td data-label="${labels[i] ?? ""}"`),
              )
              .join("")}</tr>\n`,
        )
        .join("");
      const stack = token.header.length <= 5 ? ` class="stack-table"` : "";
      return `<table${stack}>\n<thead>\n<tr>\n${head}</tr>\n</thead>\n${body ? `<tbody>${body}</tbody>` : ""}</table>\n`;
    },
    code(token: Tokens.Code) {
      const lang = /^\S*/.exec(token.lang ?? "")?.[0] ?? "";
      const text = token.text.replace(/\n$/, "");
      const lines = text.split("\n").length;
      const label = LANG_LABELS[lang.toLowerCase()] ?? (lang ? lang.toUpperCase() : "Code");
      const long = lines > CODE_COLLAPSE_LINES;
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      const expand = long
        ? `<button type="button" class="code-expand" data-code-expand aria-expanded="false">Show all ${lines} lines</button>`
        : "";
      return (
        `<figure class="code-figure${long ? " is-collapsed" : ""}">` +
        `<figcaption class="code-head"><span class="code-lang">${escapeHtml(label)}</span>` +
        `<span class="code-meta">${lines} lines</span>` +
        `<button type="button" class="code-btn" data-code-copy>Copy</button></figcaption>` +
        `<pre><code${cls}>${escapeHtml(text)}</code></pre>${expand}</figure>\n`
      );
    },
  },
});

export function renderMarkdownHtml(text: string): string {
  const html = md.parse(text, { async: false });
  return (
    html
      .replace(
        /<table( class="stack-table")?>/g,
        '<div class="table-wrap" role="region" tabindex="0" aria-label="Scrollable table"><table$1>',
      )
      .replace(/<\/table>/g, "</table></div>")
      // Code blocks scroll sideways; keyboard users need to be able to focus them.
      .replace(/<pre>/g, '<pre tabindex="0">')
  );
}

export function renderInlineMarkdown(text: string): string {
  return md.parseInline(text, { async: false });
}

export interface TocEntry {
  id: string;
  text: string;
}

/** Section headings (rendered as h2) of a page body, for the "On this page" navigation. */
export function extractHeadings(body: string): TocEntry[] {
  const out: TocEntry[] = [];
  for (const seg of splitShortcodes(body)) {
    if (seg.kind !== "md") continue;
    for (const tok of md.lexer(seg.text)) {
      if (tok.type !== "heading" || (tok as Tokens.Heading).depth > 2) continue;
      const inner = withoutControlRefs(() =>
        md.parseInline((tok as Tokens.Heading).text, { async: false }),
      );
      out.push({ id: slugify(inner), text: stripTags(inner) });
    }
  }
  return out;
}

export interface MarkdownSection {
  /** Heading id ("" for text before the first heading). */
  id: string;
  title: string;
  /** Section Markdown without its heading. */
  body: string;
  /** Block tokens of `body`, for pages that lay a section out themselves. */
  tokens: Token[];
}

/** Split a page body into its h2 sections (headings at depth 1 or 2). */
export function splitSections(body: string): MarkdownSection[] {
  const out: MarkdownSection[] = [];
  let current: MarkdownSection = { id: "", title: "", body: "", tokens: [] };
  for (const tok of md.lexer(body)) {
    if (tok.type === "heading" && (tok as Tokens.Heading).depth <= 2) {
      if (current.id || current.body.trim()) out.push(current);
      const inner = withoutControlRefs(() =>
        md.parseInline((tok as Tokens.Heading).text, { async: false }),
      );
      current = { id: slugify(inner), title: stripTags(inner), body: "", tokens: [] };
      continue;
    }
    current.body += tok.raw;
    current.tokens.push(tok);
  }
  if (current.id || current.body.trim()) out.push(current);
  return out;
}

/** Estimated reading time in minutes (about 220 words a minute). */
export function readingMinutes(body: string): number {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\{\{[^}]*\}\}/g, " ")
    .split(/\s+/)
    .filter((w) => /[A-Za-z0-9]/.test(w)).length;
  return Math.max(1, Math.round(words / 220));
}

type Segment =
  | { kind: "md"; text: string }
  | { kind: "cta"; key: string }
  | { kind: "disclaimer" }
  | { kind: "controls"; ids: string[] };

const SHORTCODE_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*(?::([^{}]*))?\}\}/g;

/** Split a page body on the block-level shortcodes {{cta:key}}, {{disclaimer}}, {{controls:IDs}}. */
export function splitShortcodes(body: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of body.matchAll(SHORTCODE_RE)) {
    const name = (m[1] ?? "").toLowerCase();
    const arg = m[2]?.trim();
    let seg: Segment | undefined;
    if (name === "cta" && arg) seg = { kind: "cta", key: arg };
    else if (name === "disclaimer") seg = { kind: "disclaimer" };
    else if (name === "controls" && arg) seg = { kind: "controls", ids: arg.split(",") };
    if (!seg) continue;
    out.push({ kind: "md", text: body.slice(last, m.index) });
    out.push(seg);
    last = (m.index ?? 0) + m[0].length;
  }
  out.push({ kind: "md", text: body.slice(last) });
  return out.filter((s) => s.kind !== "md" || s.text.trim() !== "");
}

/** Copy and expand buttons on rendered code blocks (plain HTML, so handled by delegation). */
function handleCodeButtons(target: HTMLElement): boolean {
  const copy = target.closest<HTMLButtonElement>("[data-code-copy]");
  if (copy) {
    const code = copy.closest("figure")?.querySelector("code")?.textContent ?? "";
    const done = (label: string) => {
      copy.textContent = label;
      window.setTimeout(() => (copy.textContent = "Copy"), 2000);
    };
    if (navigator.clipboard)
      navigator.clipboard.writeText(code).then(
        () => done("Copied"),
        () => done("Copy failed"),
      );
    else done("Copy failed");
    return true;
  }
  const expand = target.closest<HTMLButtonElement>("[data-code-expand]");
  if (expand) {
    const figure = expand.closest("figure");
    const collapsed = figure?.classList.toggle("is-collapsed") ?? false;
    const lines = figure?.querySelector("code")?.textContent?.split("\n").length ?? 0;
    expand.setAttribute("aria-expanded", String(!collapsed));
    expand.textContent = collapsed ? `Show all ${lines} lines` : "Show less";
    return true;
  }
  return false;
}

/** Route same-site anchor clicks through the router instead of a full page load. */
export function useInternalLinkHandler() {
  const navigate = useNavigate();
  return (e: MouseEvent<HTMLElement>) => {
    if (handleCodeButtons(e.target as HTMLElement)) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const a = (e.target as HTMLElement).closest("a");
    if (!a || a.target || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") ?? "";
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/downloads/")) return;
    e.preventDefault();
    const [path = "/", hash] = href.split("#");
    void navigate(hash ? { to: path, hash } : { to: path });
  };
}

export function SiteMarkdown({ body, className }: { body: string; className?: string }) {
  const segments = useMemo(
    () =>
      splitShortcodes(body).map((s) =>
        s.kind === "md" ? { ...s, html: renderMarkdownHtml(s.text) } : s,
      ),
    [body],
  );
  const onClick = useInternalLinkHandler();
  return (
    <div className={className} onClick={onClick}>
      {segments.map((s, i) => (
        <Fragment key={i}>
          {s.kind === "md" && "html" in s && <div dangerouslySetInnerHTML={{ __html: s.html }} />}
          {s.kind === "cta" && <CtaBlock ctaKey={s.key} />}
          {s.kind === "disclaimer" && <Disclaimer />}
          {s.kind === "controls" && <ControlCitations ids={s.ids} />}
        </Fragment>
      ))}
    </div>
  );
}

export function InlineMarkdown({ text }: { text: string }) {
  const onClick = useInternalLinkHandler();
  return (
    <span onClick={onClick} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />
  );
}
