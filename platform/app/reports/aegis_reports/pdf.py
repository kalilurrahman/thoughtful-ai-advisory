"""Minimal, dependency-light Markdown -> PDF renderer built on reportlab.

Supports: #/##/### headings, paragraphs, **bold**, *italic*, `code`, bullet and
numbered lists (one level of nesting), pipe tables, fenced code blocks,
blockquotes and horizontal rules (---). Unsupported syntax degrades to text.
All text is XML-escaped before reportlab Paragraph markup is applied.
"""
from __future__ import annotations

import re
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, KeepTogether, ListFlowable, ListItem, Paragraph, Preformatted,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

NAVY = colors.HexColor("#0B2545")
TEAL = colors.HexColor("#13636B")
GREY = colors.HexColor("#5A6472")
LIGHT = colors.HexColor("#EEF2F6")


def _styles():
    ss = getSampleStyleSheet()
    base = ParagraphStyle("AegisBody", parent=ss["BodyText"], fontName="Helvetica", fontSize=9.5,
                          leading=13, alignment=TA_LEFT, spaceAfter=4)
    return {
        "body": base,
        "h1": ParagraphStyle("AegisH1", parent=base, fontName="Helvetica-Bold", fontSize=18, leading=22,
                             textColor=NAVY, spaceBefore=6, spaceAfter=8),
        "h2": ParagraphStyle("AegisH2", parent=base, fontName="Helvetica-Bold", fontSize=13.5, leading=17,
                             textColor=NAVY, spaceBefore=10, spaceAfter=5),
        "h3": ParagraphStyle("AegisH3", parent=base, fontName="Helvetica-Bold", fontSize=11, leading=14,
                             textColor=TEAL, spaceBefore=8, spaceAfter=3),
        "cell": ParagraphStyle("AegisCell", parent=base, fontSize=8, leading=10, spaceAfter=0),
        "cellh": ParagraphStyle("AegisCellH", parent=base, fontName="Helvetica-Bold", fontSize=8, leading=10,
                                textColor=colors.white, spaceAfter=0),
        "code": ParagraphStyle("AegisCode", parent=base, fontName="Courier", fontSize=7.5, leading=9.5),
        "quote": ParagraphStyle("AegisQuote", parent=base, textColor=GREY, leftIndent=10, fontName="Helvetica-Oblique"),
    }


def _inline(text: str) -> str:
    t = escape(text)
    t = re.sub(r"`([^`]+)`", r'<font face="Courier">\1</font>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<i>\1</i>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<link href="\2" color="#13636B">\1</link>', t)
    return t


def _table(lines: list[str], st: dict, width: float):
    rows = []
    for ln in lines:
        cells = [c.strip() for c in ln.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
            continue
        rows.append(cells)
    if not rows:
        return None
    ncol = max(len(r) for r in rows)
    rows = [r + [""] * (ncol - len(r)) for r in rows]
    data = [[Paragraph(_inline(c), st["cellh"] if i == 0 else st["cell"]) for c in r] for i, r in enumerate(rows)]
    # proportional column widths from content length (bounded), so long text columns get more room
    lens = [max(len(rows[0][c]) + 2, 8, min(60, max(len(r[c]) for r in rows))) for c in range(ncol)]
    total = sum(lens)
    col_w = [width * n / total for n in lens]
    t = Table(data, colWidths=col_w, repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#C9D2DC")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    t.setStyle(TableStyle(style))
    return t


def markdown_to_flowables(md: str, width: float) -> list:
    st = _styles()
    out: list = []
    lines = md.replace("\r\n", "\n").split("\n")
    i = 0
    para: list[str] = []

    def flush_para():
        if para:
            parts = []
            for k, raw in enumerate(para):
                parts.append(_inline(raw.strip()))
                if k < len(para) - 1:
                    parts.append("<br/>" if raw.endswith("  ") else " ")
            out.append(Paragraph("".join(parts), st["body"]))
            para.clear()

    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if s.startswith("```"):
            flush_para()
            j = i + 1
            buf = []
            while j < len(lines) and not lines[j].strip().startswith("```"):
                buf.append(lines[j])
                j += 1
            out.append(Preformatted("\n".join(buf), st["code"]))
            out.append(Spacer(1, 4))
            i = j + 1
            continue
        if not s:
            flush_para()
            i += 1
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            flush_para()
            lvl = min(len(m.group(1)), 3)
            out.append(Paragraph(_inline(m.group(2)), st[f"h{lvl}"]))
            i += 1
            continue
        if re.fullmatch(r"(-{3,}|\*{3,}|_{3,})", s):
            flush_para()
            out.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#C9D2DC"), spaceBefore=4, spaceAfter=6))
            i += 1
            continue
        if s.startswith("|"):
            flush_para()
            j = i
            buf = []
            while j < len(lines) and lines[j].strip().startswith("|"):
                buf.append(lines[j])
                j += 1
            t = _table(buf, st, width)
            if t is not None:
                out.append(t)
                out.append(Spacer(1, 6))
            i = j
            continue
        if s.startswith(">"):
            flush_para()
            out.append(Paragraph(_inline(s.lstrip("> ")), st["quote"]))
            i += 1
            continue
        lm = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", ln)
        if lm:
            flush_para()
            ordered = lm.group(2)[0].isdigit()
            items = []
            j = i
            while j < len(lines):
                m2 = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", lines[j])
                if not m2:
                    if lines[j].strip() and lines[j].startswith("  ") and items:
                        items[-1][1] += " " + lines[j].strip()
                        j += 1
                        continue
                    break
                indent = len(m2.group(1))
                items.append([indent, m2.group(3)])
                j += 1
            flow = []
            for indent, txt in items:
                p = Paragraph(_inline(txt), st["body"])
                flow.append(ListItem(p, leftIndent=12 + (12 if indent >= 2 else 0)))
            out.append(ListFlowable(flow, bulletType="1" if ordered else "bullet", start=1 if ordered else None,
                                    bulletFontSize=7 if not ordered else 9, leftIndent=12))
            i = j
            continue
        para.append(ln.lstrip())
        i += 1
    flush_para()
    return out


def markdown_to_pdf(md: str, out_path: str | Path, title: str | None = None,
                    footer: str = "AEGIS — governance readiness & evidence. Not a certification or legal advice.") -> Path:
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(out_path), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm,
                            topMargin=18 * mm, bottomMargin=18 * mm, title=title or "AEGIS Report",
                            author="AEGIS", subject="AI governance report")
    width = A4[0] - 32 * mm

    def on_page(canvas, d):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, A4[1] - 8 * mm, A4[0], 8 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(16 * mm, A4[1] - 5.5 * mm, "AEGIS")
        canvas.setFont("Helvetica", 7.5)
        canvas.drawRightString(A4[0] - 16 * mm, A4[1] - 5.5 * mm, (title or "")[:110])
        canvas.setFillColor(GREY)
        canvas.setFont("Helvetica", 7)
        canvas.drawString(16 * mm, 10 * mm, footer[:150])
        canvas.drawRightString(A4[0] - 16 * mm, 10 * mm, f"Page {d.page} · generated {date.today().isoformat()}")
        canvas.restoreState()

    doc.build(markdown_to_flowables(md, width), onFirstPage=on_page, onLaterPages=on_page)
    return out_path
