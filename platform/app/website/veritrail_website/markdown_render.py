"""Safe Markdown rendering for website pages.

* Raw HTML in Markdown is NOT passed through: it is escaped and shown as text, so page
  bodies cannot inject <script>, event handlers or iframes.
* Link/image URLs are restricted to http(s), mailto, tel and relative URLs.
* Body ``#`` headings are demoted to ``h2`` (the template owns the single page h1).
* Tables are wrapped in a keyboard-focusable, labelled scroll region (WCAG 1.4.10 / 2.1.1).
* ``attr_list`` / ``md_in_html`` are deliberately NOT enabled (attribute injection).
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as etree

import markdown
from markdown.extensions import Extension
from markdown.extensions.toc import slugify_unicode
from markdown.treeprocessors import Treeprocessor

SAFE_SCHEMES = {"http", "https", "mailto", "tel"}
_SCHEME_RE = re.compile(r"^([a-zA-Z][a-zA-Z0-9+.\-]*):")
_CTRL_RE = re.compile(r"[\x00-\x20\x7f]+")


def url_is_safe(url: str) -> bool:
    cleaned = _CTRL_RE.sub("", url or "")
    m = _SCHEME_RE.match(cleaned)
    if not m:
        return True  # relative, fragment or path
    return m.group(1).lower() in SAFE_SCHEMES


class _SafetyTreeprocessor(Treeprocessor):
    def __init__(self, md, sink: dict):
        super().__init__(md)
        self.sink = sink

    def run(self, root: etree.Element):
        problems = self.sink.setdefault("problems", [])
        warnings = self.sink.setdefault("warnings", [])
        for el in root.iter():
            if el.tag == "a":
                href = el.get("href", "")
                if not url_is_safe(href):
                    problems.append(f"unsafe link URL {href!r} (allowed: http, https, mailto, tel, relative)")
                    el.set("href", "#")
                elif re.match(r"^https?://", href or "", re.I):
                    el.set("rel", "noopener noreferrer")
            elif el.tag == "img":
                src = el.get("src", "")
                if not url_is_safe(src) or src.lower().startswith(("mailto:", "tel:")):
                    problems.append(f"unsafe image URL {src!r}")
                    el.set("src", "")
                if not (el.get("alt") or "").strip():
                    warnings.append(f"image {src!r} has empty alt text")
                el.set("loading", "lazy")
                el.set("decoding", "async")
            elif el.tag == "h1":
                el.tag = "h2"
                warnings.append(f"body heading '# {''.join(el.itertext())[:60]}' demoted to h2 (template renders the h1)")
        # wrap tables in a focusable scroll region
        for parent in list(root.iter()):
            for idx, child in enumerate(list(parent)):
                if child.tag == "table":
                    wrap = etree.Element("div", {"class": "table-wrap", "role": "region",
                                                 "tabindex": "0", "aria-label": "Scrollable table"})
                    parent.remove(child)
                    wrap.append(child)
                    parent.insert(idx, wrap)
        return None


class _SafeExtension(Extension):
    def __init__(self, sink: dict, **kwargs):
        self.sink = sink
        super().__init__(**kwargs)

    def extendMarkdown(self, md):
        # Escape raw HTML instead of passing it through.
        md.preprocessors.deregister("html_block")
        md.inlinePatterns.deregister("html")
        md.treeprocessors.register(_SafetyTreeprocessor(md, self.sink), "veritrail_safety", 0)


def _slugify(value: str, separator: str) -> str:
    return slugify_unicode(value, separator)


def render_markdown(text: str) -> tuple[str, list[str], list[str]]:
    """Return (html, problems, warnings)."""
    sink: dict = {}
    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "sane_lists", "def_list", "abbr", "toc", _SafeExtension(sink)],
        extension_configs={"toc": {"slugify": _slugify, "permalink": False}},
        output_format="html",
    )
    html = md.convert(text or "")
    return html, sink.get("problems", []), sink.get("warnings", [])


def render_inline(text: str) -> str:
    """Render a short Markdown string (FAQ answer, etc.) safely; strips the outer <p>."""
    html, problems, _ = render_markdown(text)
    if problems:
        raise ValueError("; ".join(problems))
    m = re.fullmatch(r"\s*<p>(.*)</p>\s*", html, re.DOTALL)
    return m.group(1) if m and "<p>" not in m.group(1) else html
