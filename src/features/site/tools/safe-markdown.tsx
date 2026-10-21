import type { ReactNode } from "react";
import { EvidenceBadge, SiteLink, normalizeHref } from "../ui";

/*
 * Safe Markdown subset renderer (React port of tools-common.js `renderMarkdown`):
 * headings, paragraphs, ordered/unordered lists, **bold**, *italic* / _italic_, `code`, fenced code,
 * blockquotes, rules, pipe tables and [links](url). It builds React elements only — never
 * dangerouslySetInnerHTML — and allows only http(s), mailto, same-site (/...) and #fragment links;
 * any other link renders as plain text. *Evidence labels* (e.g. *Inferred*) render as badges.
 */

const EVIDENCE_LABELS = new Set([
  "Verified",
  "User-asserted",
  "Inferred",
  "Missing evidence",
  "Critical gap",
]);

const INLINE_RE =
  /(\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
const LIST_RE = /^\s*([-*]|\d+[.)])\s+/;
const ORDERED_RE = /^\s*\d+[.)]\s+/;

function safeHref(url: string): string | null {
  const u = url.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^\/(?!\/)/.test(u) || u.startsWith("#")) return u;
  return null;
}

function SafeLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("/")) return <SiteLink href={normalizeHref(href)}>{children}</SiteLink>;
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <a href={href}>{children}</a>;
}

function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const s = String(text ?? "");
  let last = 0;
  let n = 0;
  for (const m of s.matchAll(INLINE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(s.slice(last, idx));
    const key = `${keyPrefix}-${n++}`;
    if (m[2] !== undefined) {
      out.push(<strong key={key}>{inline(m[2], key)}</strong>);
    } else if (m[3] !== undefined || m[4] !== undefined) {
      const t = m[3] ?? m[4] ?? "";
      out.push(
        EVIDENCE_LABELS.has(t) ? <EvidenceBadge key={key} status={t} /> : <em key={key}>{t}</em>,
      );
    } else if (m[5] !== undefined) {
      out.push(<code key={key}>{m[5]}</code>);
    } else {
      const label = m[6] ?? "";
      const href = safeHref(m[7] ?? "");
      out.push(
        href ? (
          <SafeLink key={key} href={href}>
            {label}
          </SafeLink>
        ) : (
          label
        ),
      );
    }
    last = idx + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));
}

function Heading({ level, children }: { level: number; children: ReactNode }) {
  switch (Math.min(6, Math.max(1, level))) {
    case 1:
      return <h1>{children}</h1>;
    case 2:
      return <h2>{children}</h2>;
    case 3:
      return <h3>{children}</h3>;
    case 4:
      return <h4>{children}</h4>;
    case 5:
      return <h5>{children}</h5>;
    default:
      return <h6>{children}</h6>;
  }
}

function renderBlocks(md: string, headingBase: number): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = String(md ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  let para: string[] = [];
  let i = 0;
  const key = () => `b-${out.length}`;
  const flush = () => {
    if (para.length) {
      const k = key();
      out.push(<p key={k}>{inline(para.join(" "), k)}</p>);
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!line.trim()) {
      flush();
      i++;
      continue;
    }
    if (line.startsWith("```")) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) code.push(lines[i++] ?? "");
      i++;
      out.push(
        <pre key={key()} tabIndex={0}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    if (h) {
      flush();
      const k = key();
      out.push(
        <Heading key={k} level={headingBase + (h[1] ?? "#").length - 1}>
          {inline(h[2] ?? "", k)}
        </Heading>,
      );
      i++;
      continue;
    }
    if (LIST_RE.test(line)) {
      flush();
      const ordered = ORDERED_RE.test(line);
      const items: string[] = [];
      while (i < lines.length && LIST_RE.test(lines[i] ?? ""))
        items.push((lines[i++] ?? "").replace(LIST_RE, ""));
      const k = key();
      const lis = items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>);
      out.push(ordered ? <ol key={k}>{lis}</ol> : <ul key={k}>{lis}</ul>);
      continue;
    }
    if (
      /^\s*\|/.test(line) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")
    ) {
      flush();
      const head = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i] ?? ""))
        rows.push(splitRow(lines[i++] ?? ""));
      const k = key();
      out.push(
        <div key={k} className="table-wrap" role="region" tabIndex={0} aria-label="Table">
          <table>
            <thead>
              <tr>
                {head.map((c, j) => (
                  <th key={j} scope="col">
                    {inline(c, `${k}-h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c, `${k}-${ri}-${j}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      const k = key();
      out.push(<blockquote key={k}>{inline(line.replace(/^>\s?/, ""), k)}</blockquote>);
      i++;
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      flush();
      out.push(<hr key={key()} />);
      i++;
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flush();
  return out;
}

/**
 * Render untrusted Markdown (agent answers, generated text) with the safe subset above.
 * `headingBase` is the HTML level used for `#` (default 3, as in tools-common.js).
 */
export function SafeMarkdown({
  markdown,
  headingBase = 3,
}: {
  markdown: string;
  headingBase?: number;
}) {
  return <>{renderBlocks(markdown, headingBase)}</>;
}
