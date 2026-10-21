import { Fragment, useMemo, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Marked, type Tokens } from "marked";
import { ControlCitations, CtaBlock, Disclaimer } from "./ui";

// Safe Markdown for trusted, repository-authored website pages — a port of the platform's
// markdown_render.py rules: raw HTML is escaped, link schemes are restricted, body h1s are
// demoted to h2 and tables are wrapped in a focusable scroll region.

const SAFE_SCHEME = /^(https?|mailto|tel):/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const cleaned = href.replace(/[\x00-\x20\x7f]+/g, "");
  if (ANY_SCHEME.test(cleaned) && !SAFE_SCHEME.test(cleaned)) return "#";
  if (cleaned.startsWith("/")) {
    const [path = "", hash] = cleaned.split("#");
    const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
    return hash !== undefined ? `${p}#${hash}` : p;
  }
  return cleaned;
}

const md = new Marked({
  gfm: true,
  renderer: {
    html(token: Tokens.HTML | Tokens.Tag) {
      return escapeHtml(token.text);
    },
    heading(
      this: { parser: { parseInline: (t: Tokens.Generic[]) => string } },
      token: Tokens.Heading,
    ) {
      const depth = Math.max(2, token.depth);
      const inner = this.parser.parseInline(token.tokens);
      return `<h${depth} id="${slugify(inner)}">${inner}</h${depth}>\n`;
    },
    link(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, token: Tokens.Link) {
      const href = safeHref(token.href);
      const text = this.parser.parseInline(token.tokens);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      const ext = /^https?:/i.test(href) ? ` rel="noopener noreferrer"` : "";
      const dl = href.startsWith("/downloads/") ? " download" : "";
      return `<a href="${escapeHtml(href)}"${title}${ext}${dl}>${text}</a>`;
    },
    image(token: Tokens.Image) {
      const src = safeHref(token.href);
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(token.text)}" loading="lazy" decoding="async">`;
    },
  },
});

export function renderMarkdownHtml(text: string): string {
  const html = md.parse(text, { async: false });
  return html
    .replace(
      /<table>/g,
      '<div class="table-wrap" role="region" tabindex="0" aria-label="Scrollable table"><table>',
    )
    .replace(/<\/table>/g, "</table></div>");
}

export function renderInlineMarkdown(text: string): string {
  return md.parseInline(text, { async: false });
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

/** Route same-site anchor clicks through the router instead of a full page load. */
export function useInternalLinkHandler() {
  const navigate = useNavigate();
  return (e: MouseEvent<HTMLElement>) => {
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
