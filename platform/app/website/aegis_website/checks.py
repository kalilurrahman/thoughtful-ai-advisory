"""Build-time quality gate for the generated site.

Fails on: missing/empty <title> or meta description, missing or multiple h1, images without
alt, form controls without an accessible label, duplicate element IDs, broken internal links
(including #fragments), external scripts/styles/fonts, missing landmarks/skip link/lang,
unsafe inline script, and prohibited compliance claims in visible text.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
LABELABLE_INPUT_EXCLUDE = {"hidden", "submit", "button", "reset", "image"}
DATA_SCRIPT_TYPES = {"application/ld+json", "application/json"}
BLOCK_TAGS = {"p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th", "div", "section", "article", "aside",
              "dt", "dd", "blockquote", "pre", "figcaption", "summary", "legend", "label", "option", "button",
              "br", "tr", "header", "footer", "nav", "main", "ul", "ol", "dl", "table", "form", "fieldset"}


@dataclass
class PageReport:
    path: str
    url: str
    title: str = ""
    description: str | None = None
    canonical: str | None = None
    h1_count: int = 0
    lang: str | None = None
    ids: dict[str, int] = field(default_factory=dict)
    links: list[str] = field(default_factory=list)
    landmarks: set = field(default_factory=set)
    skip_link: bool = False
    problems: list[str] = field(default_factory=list)
    text: list[str] = field(default_factory=list)
    jsonld: list[str] = field(default_factory=list)
    scripts: list[dict] = field(default_factory=list)
    assets: list[str] = field(default_factory=list)


class _Parser(HTMLParser):
    def __init__(self, report: PageReport):
        super().__init__(convert_charrefs=True)
        self.r = report
        self.stack: list[tuple[str, dict]] = []
        self.in_title = False
        self.label_for: set[str] = set()
        self.controls: list[tuple[str, dict, bool]] = []  # (tag, attrs, wrapped_in_label)
        self.label_depth = 0
        self.script_type: str | None = None
        self.script_buf: list[str] = []
        self.skip_text = 0
        self.first_link_checked = False

    def handle_starttag(self, tag, attrs_list):
        a = {k: (v if v is not None else "") for k, v in attrs_list}
        r = self.r
        if "id" in a:
            r.ids[a["id"]] = r.ids.get(a["id"], 0) + 1
        if tag == "html":
            r.lang = a.get("lang")
        elif tag == "title":
            self.in_title = True
        elif tag == "meta" and a.get("name") == "description":
            r.description = a.get("content", "")
        elif tag == "link":
            rel = a.get("rel", "").lower()
            if rel in ("stylesheet", "icon") and a.get("href"):
                r.assets.append(a["href"])
            if rel == "canonical":
                r.canonical = a.get("href")
            if rel in ("stylesheet", "preload", "icon", "manifest") and _is_external(a.get("href", "")):
                r.problems.append(f"external resource not allowed: <link rel={rel} href={a.get('href')}>")
            if "fonts.googleapis" in a.get("href", "") or "fonts.gstatic" in a.get("href", ""):
                r.problems.append("external web fonts are not allowed")
        elif tag == "h1":
            r.h1_count += 1
        elif tag in ("header", "nav", "main", "footer"):
            r.landmarks.add(tag)
        elif tag == "a":
            href = a.get("href")
            if href is None:
                pass
            else:
                r.links.append(href)
                if not self.first_link_checked:
                    self.first_link_checked = True
                    if href.startswith("#") and "skip" in a.get("class", ""):
                        r.skip_link = True
        elif tag == "img":
            if a.get("src"):
                r.assets.append(a["src"])
            if "alt" not in a:
                r.problems.append(f"image without alt attribute: {a.get('src', '?')}")
            if _is_external(a.get("src", "")):
                r.problems.append(f"external image not allowed: {a.get('src')}")
        elif tag == "label":
            self.label_depth += 1
            if a.get("for"):
                self.label_for.add(a["for"])
        elif tag in ("input", "select", "textarea"):
            if not (tag == "input" and a.get("type", "text").lower() in LABELABLE_INPUT_EXCLUDE):
                self.controls.append((tag, a, self.label_depth > 0))
        elif tag == "script":
            stype = a.get("type", "").lower()
            self.script_type = stype
            self.script_buf = []
            r.scripts.append(a)
            if a.get("src"):
                r.assets.append(a["src"])
                if _is_external(a["src"]):
                    r.problems.append(f"external script not allowed: {a['src']}")
                if "defer" not in a and stype != "module":
                    r.problems.append(f"script {a['src']} must be loaded with defer")
            elif stype not in DATA_SCRIPT_TYPES:
                r.problems.append("inline executable <script> is not allowed (CSP script-src 'self')")
        elif tag == "style":
            r.problems.append("inline <style> is not allowed (CSP style-src 'self')")
        if tag in ("script", "style", "noscript", "title"):
            self.skip_text += 1
        if tag in BLOCK_TAGS:
            r.text.append("\n")
        if any(k.startswith("on") for k in a):
            r.problems.append(f"inline event handler on <{tag}> is not allowed")
        if tag not in VOID:
            self.stack.append((tag, a))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        elif tag == "label":
            self.label_depth = max(0, self.label_depth - 1)
        elif tag == "script":
            if self.script_type == "application/ld+json":
                self.r.jsonld.append("".join(self.script_buf))
            self.script_type = None
        if tag in ("script", "style", "noscript", "title"):
            self.skip_text = max(0, self.skip_text - 1)
        if tag in BLOCK_TAGS:
            self.r.text.append("\n")
        # pop to matching tag
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.in_title:
            self.r.title += data
        if self.script_type is not None:
            self.script_buf.append(data)
        elif not self.skip_text:
            self.r.text.append(data)

    def finish(self):
        for tag, a, wrapped in self.controls:
            cid = a.get("id")
            labelled = wrapped or (cid and cid in self.label_for) or a.get("aria-label", "").strip() \
                or a.get("aria-labelledby", "").strip()
            if not labelled:
                self.r.problems.append(f"form control without label: <{tag} name={a.get('name', '?')} id={cid or '?'}>")


def _is_external(url: str) -> bool:
    return bool(re.match(r"^(https?:)?//", url or "", re.I))


def page_url_for(rel_path: str) -> str:
    rel = rel_path.replace("\\", "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def analyze_html(html: str, rel_path: str = "index.html") -> PageReport:
    report = PageReport(path=rel_path, url=page_url_for(rel_path))
    p = _Parser(report)
    p.feed(html)
    p.close()
    p.finish()
    r = report
    if not r.title.strip():
        r.problems.append("missing or empty <title>")
    if r.description is None or not r.description.strip():
        r.problems.append("missing or empty meta description")
    if r.h1_count == 0:
        r.problems.append("missing <h1>")
    elif r.h1_count > 1:
        r.problems.append(f"{r.h1_count} <h1> elements (expected exactly one)")
    if not r.lang:
        r.problems.append("<html> has no lang attribute")
    for lm in ("header", "nav", "main", "footer"):
        if lm not in r.landmarks:
            r.problems.append(f"missing <{lm}> landmark")
    if not r.skip_link:
        r.problems.append("first link must be a skip link (class 'skip-link', href '#...')")
    for i, count in r.ids.items():
        if count > 1:
            r.problems.append(f"duplicate id {i!r} ({count}x)")
    for raw in r.jsonld:
        try:
            json.loads(raw)
        except ValueError as exc:
            r.problems.append(f"invalid JSON-LD: {exc}")
        if "</" in raw or "<!--" in raw:
            r.problems.append("JSON-LD contains unescaped '</' or '<!--'")
    return r


def _resolve_target(dist: Path, path: str) -> Path | None:
    p = unquote(path)
    if ".." in Path(p).parts:
        return None
    rel = p.lstrip("/")
    cand = dist / rel
    if p.endswith("/") or p == "":
        cand = cand / "index.html"
    if cand.is_file():
        return cand
    return None


def check_site(dist: Path, claim_checker=None, skip_link_prefixes: tuple[str, ...] = ("/api/",)) -> dict:
    """Analyse every HTML file under dist. Returns {"errors": [...], "pages": n, "reports": {...}}."""
    dist = Path(dist)
    reports: dict[str, PageReport] = {}
    for f in sorted(dist.rglob("*.html")):
        rel = f.relative_to(dist).as_posix()
        reports[rel] = analyze_html(f.read_text(encoding="utf-8"), rel)
    errors: list[str] = []
    ids_by_file = {rel: set(r.ids) for rel, r in reports.items()}
    for rel, r in reports.items():
        errors.extend(f"{rel}: {p}" for p in r.problems)
        for href in r.links:
            if not href or href.startswith(("mailto:", "tel:")) or _is_external(href):
                continue
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.\-]*:", href):
                errors.append(f"{rel}: unsupported link scheme {href!r}")
                continue
            absolute = urljoin(r.url, href)
            parts = urlsplit(absolute)
            if parts.path.startswith(skip_link_prefixes):
                continue
            target_rel = rel if parts.path == r.url else None
            if target_rel is None:
                target = _resolve_target(dist, parts.path)
                if target is None:
                    errors.append(f"{rel}: broken internal link {href!r}")
                    continue
                target_rel = target.relative_to(dist).as_posix()
            if parts.fragment and target_rel in ids_by_file and parts.fragment not in ids_by_file[target_rel]:
                errors.append(f"{rel}: broken fragment {href!r} (no id={parts.fragment!r})")
        for src in r.assets:
            if _is_external(src) or src.startswith("data:"):
                continue
            if _resolve_target(dist, urlsplit(urljoin(r.url, src)).path) is None:
                errors.append(f"{rel}: missing asset {src!r}")
        if claim_checker is not None:
            text = re.sub(r"[ \t\r\f\v]+", " ", "".join(r.text))
            for hit in claim_checker(text):
                errors.append(f"{rel}: prohibited compliance claim: {hit[:160]!r}")
    return {"errors": errors, "pages": len(reports), "reports": reports}
