import { jsPDF } from "jspdf";

// Markdown -> PDF, a port of platform/app/reports/aegis_reports/pdf.py using jsPDF.
// Supports #/##/### headings, paragraphs, **bold** (rendered as plain text weight),
// bullet and numbered lists, pipe tables, fenced code, blockquotes and rules, with the
// AEGIS header band and footer on every page. Unsupported syntax degrades to text.

const NAVY: [number, number, number] = [11, 37, 69];
const TEAL: [number, number, number] = [19, 99, 107];
const GREY: [number, number, number] = [90, 100, 114];
const LIGHT: [number, number, number] = [238, 242, 246];
export const DEFAULT_FOOTER = "AEGIS — governance readiness & evidence. Not a certification or legal advice.";

const MM = 72 / 25.4;
const PAGE_W = 210 * MM;
const PAGE_H = 297 * MM;
const MARGIN = 16 * MM;
const TOP = 16 * MM;
const BOTTOM = PAGE_H - 18 * MM;
const WIDTH = PAGE_W - 2 * MARGIN;

/** Strip inline Markdown to plain text; links keep their label. */
export function plainInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, "$1$2")
    .replace(/[‐-―]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[←-⇿]/g, "->")
    .replace(/[^\x00-\xff]/g, "?");
}

interface Ctx {
  doc: jsPDF;
  y: number;
}

function ensure(ctx: Ctx, h: number) {
  if (ctx.y + h > BOTTOM) {
    ctx.doc.addPage();
    ctx.y = TOP + 6 * MM;
  }
}

function text(ctx: Ctx, s: string, opts: { size: number; font?: string; style?: string; color?: [number, number, number]; indent?: number; leading?: number; after?: number }) {
  const { doc } = ctx;
  doc.setFont(opts.font ?? "helvetica", opts.style ?? "normal");
  doc.setFontSize(opts.size);
  doc.setTextColor(...(opts.color ?? ([27, 36, 48] as [number, number, number])));
  const indent = opts.indent ?? 0;
  const lines = doc.splitTextToSize(plainInline(s), WIDTH - indent) as string[];
  const leading = opts.leading ?? opts.size * 1.35;
  for (const line of lines) {
    ensure(ctx, leading);
    doc.text(line, MARGIN + indent, ctx.y + opts.size);
    ctx.y += leading;
  }
  ctx.y += opts.after ?? 4;
}

function table(ctx: Ctx, rows: string[][]) {
  const { doc } = ctx;
  const cols = Math.max(...rows.map((r) => r.length));
  const colW = WIDTH / cols;
  doc.setFontSize(8);
  rows.forEach((row, ri) => {
    const header = ri === 0;
    doc.setFont("helvetica", header ? "bold" : "normal");
    const cells = Array.from({ length: cols }, (_, ci) => doc.splitTextToSize(plainInline(row[ci] ?? ""), colW - 6) as string[]);
    const h = Math.max(...cells.map((c) => c.length)) * 10 + 6;
    ensure(ctx, h);
    if (header) {
      doc.setFillColor(...NAVY);
      doc.rect(MARGIN, ctx.y, WIDTH, h, "F");
    } else if (ri % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(MARGIN, ctx.y, WIDTH, h, "F");
    }
    doc.setTextColor(...(header ? ([255, 255, 255] as [number, number, number]) : ([27, 36, 48] as [number, number, number])));
    cells.forEach((lines, ci) => lines.forEach((l, li) => doc.text(l, MARGIN + ci * colW + 3, ctx.y + 11 + li * 10)));
    ctx.y += h;
  });
  ctx.y += 6;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));
}

export function markdownToPdf(md: string, opts: { title?: string; footer?: string; generated?: string } = {}): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const ctx: Ctx = { doc, y: TOP + 6 * MM };
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  const flush = () => {
    if (para.length) text(ctx, para.join(" "), { size: 9.5, leading: 13, after: 4 });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const t = line.trim();
    if (t.startsWith("```")) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !(lines[i] ?? "").trim().startsWith("```"); i++) code.push(lines[i] ?? "");
      for (const c of code) text(ctx, c || " ", { size: 7.5, font: "courier", leading: 9.5, after: 0 });
      ctx.y += 4;
      continue;
    }
    if (!t) {
      flush();
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(t);
    if (h) {
      flush();
      const level = (h[1] ?? "#").length;
      const s = h[2] ?? "";
      if (level === 1) text(ctx, s, { size: 18, style: "bold", color: NAVY, leading: 22, after: 8 });
      else if (level === 2) {
        ctx.y += 6;
        text(ctx, s, { size: 13.5, style: "bold", color: NAVY, leading: 17, after: 5 });
      } else text(ctx, s, { size: 11, style: "bold", color: TEAL, leading: 14, after: 3 });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      flush();
      ensure(ctx, 10);
      doc.setDrawColor(...GREY);
      doc.line(MARGIN, ctx.y + 4, MARGIN + WIDTH, ctx.y + 4);
      ctx.y += 10;
      continue;
    }
    if (t.startsWith("|")) {
      flush();
      const rows: string[][] = [];
      for (; i < lines.length && (lines[i] ?? "").trim().startsWith("|"); i++) {
        const r = lines[i] ?? "";
        if (!/^\s*\|?\s*:?-{2,}/.test(r)) rows.push(splitRow(r));
      }
      i--;
      table(ctx, rows);
      continue;
    }
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      flush();
      const depth = (li[1] ?? "").length >= 2 ? 1 : 0;
      const marker = /\d/.test(li[2] ?? "") ? `${li[2]}` : "•";
      text(ctx, `${marker === "•" ? "-" : marker} ${li[3] ?? ""}`, { size: 9.5, indent: 10 + depth * 12, leading: 13, after: 1 });
      continue;
    }
    if (t.startsWith(">")) {
      flush();
      text(ctx, t.replace(/^>\s?/, ""), { size: 9.5, style: "italic", color: GREY, indent: 10, leading: 13 });
      continue;
    }
    para.push(t);
  }
  flush();
  const pages = doc.getNumberOfPages();
  const generated = opts.generated ?? new Date().toISOString().slice(0, 10);
  const footer = opts.footer ?? DEFAULT_FOOTER;
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PAGE_W, 8 * MM, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("AEGIS", MARGIN, 5.5 * MM);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(plainInline(opts.title ?? "").slice(0, 110), PAGE_W - MARGIN, 5.5 * MM, { align: "right" });
    doc.setTextColor(...GREY);
    doc.setFontSize(7);
    doc.text(plainInline(footer).slice(0, 150), MARGIN, PAGE_H - 10 * MM);
    doc.text(`Page ${p} · generated ${generated}`, PAGE_W - MARGIN, PAGE_H - 10 * MM, { align: "right" });
  }
  return doc;
}

export function markdownToPdfBlob(md: string, opts: { title?: string; footer?: string; generated?: string } = {}): Blob {
  return markdownToPdf(md, opts).output("blob");
}
