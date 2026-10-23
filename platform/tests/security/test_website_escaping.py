"""Security: HTML escaping and safe serialization in the website generator.

Front matter and Markdown containing <script> (or attribute-breaking quotes) must not inject
executable markup into <title>, meta tags, headings, breadcrumbs, nav, FAQ or JSON-LD, and
JSON-LD / embedded JSON must be safely serialized. Unsafe link schemes fail the build.
"""
from __future__ import annotations

import json
import re
import shutil
from html.parser import HTMLParser

import pytest

from veritrail_website.builder import SiteBuilder
from veritrail_website.errors import BuildError
from veritrail_website.markdown_render import render_markdown, url_is_safe
from veritrail_website.paths import FIXTURE_PAGES_DIR, STATIC_DIR
from veritrail_website.seo import safe_json

PAYLOAD = '</title><script>alert("x")</script>"\' onmouseover="alert(1)'
EVIL_PAGE = f"""---
title: '{PAYLOAD.replace("'", "''")} Title'
h1: '<img src=x onerror=alert(1)> Heading'
slug: /resources/evil/
description: '"><script>alert(2)</script> description long enough to satisfy the description length warning'
section: resources
nav_label: '<script>alert(3)</script>Nav'
schema_type: Article
faq:
  - q: '</script><script>alert(4)</script>?'
    a: 'Answer with <script>alert(5)</script> and [bad](javascript:alert(6)) text'
updated: 2026-10-21
---

# Body heading <script>alert(7)</script>

<script>alert(8)</script>

<div onclick="alert(9)">raw html block</div>

Inline <b onmouseover="alert(10)">html</b> and an <iframe src="https://evil.example"></iframe>.

![<script>alt</script>](/static/img/og-default.png)

```html
<script>alert("code sample")</script>
```
"""


class ScriptCollector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.exec_scripts = []
        self.handlers = []
        self.jsonld = []
        self._cur = None
        self.tags = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append(tag)
        for k, _ in attrs:
            if k.startswith("on"):
                self.handlers.append((tag, k))
        if tag == "script":
            t = (a.get("type") or "").lower()
            self._cur = t
            if t not in ("application/ld+json", "application/json"):
                self.exec_scripts.append(a.get("src"))
        if tag in ("iframe", "object", "embed"):
            self.handlers.append((tag, "element"))

    def handle_endtag(self, tag):
        if tag == "script":
            self._cur = None

    def handle_data(self, data):
        if self._cur == "application/ld+json":
            self.jsonld.append(data)


@pytest.fixture(scope="module")
def evil_site(tmp_path_factory):
    root = tmp_path_factory.mktemp("evil")
    pages = root / "pages"
    shutil.copytree(FIXTURE_PAGES_DIR, pages)
    (pages / "evil.md").write_text(EVIL_PAGE.replace("[bad](javascript:alert(6))", "bad link"), encoding="utf-8")
    res = SiteBuilder(pages, root / "dist").build()
    return res


def parse(html):
    p = ScriptCollector()
    p.feed(html)
    return p


def test_no_injected_script_or_handlers_anywhere(evil_site):
    for f in evil_site.out_dir.rglob("*.html"):
        p = parse(f.read_text(encoding="utf-8"))
        assert p.handlers == [], (f, p.handlers)
        for src in p.exec_scripts:
            assert src and src.startswith("/static/js/"), (f, src)


def test_title_meta_and_headings_are_escaped(evil_site):
    html = (evil_site.out_dir / "resources/evil/index.html").read_text(encoding="utf-8")
    title = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    assert "<script" not in title and "&lt;/title&gt;&lt;script&gt;" in title
    desc = re.search(r'<meta name="description" content="([^"]*)">', html).group(1)
    assert "<" not in desc and desc.startswith("&#34;&gt;&lt;script&gt;alert(2)")
    og = re.search(r'<meta property="og:title" content="([^"]*)">', html).group(1)
    assert '"' not in og and "<" not in og
    assert "&lt;img src=x onerror=alert(1)&gt; Heading</h1>" in html
    assert "&lt;script&gt;alert(3)&lt;/script&gt;Nav" in html  # breadcrumb / nav label


def test_markdown_raw_html_is_escaped_not_rendered(evil_site):
    html = (evil_site.out_dir / "resources/evil/index.html").read_text(encoding="utf-8")
    body = html[html.index('<article class="prose">'):html.index("</article>")]
    p = parse(body)
    assert "script" not in p.tags and "iframe" not in p.tags and "h1" not in p.tags
    assert "&lt;script&gt;alert(8)&lt;/script&gt;" in body
    assert "&lt;iframe" in body
    assert "&lt;script&gt;alert(&quot;code sample&quot;)&lt;/script&gt;" in body
    assert 'alt="&lt;script&gt;alt&lt;/script&gt;"' in body


def test_jsonld_is_valid_and_cannot_break_out_of_script(evil_site):
    html = (evil_site.out_dir / "resources/evil/index.html").read_text(encoding="utf-8")
    p = parse(html)
    assert len(p.jsonld) == 1
    raw = p.jsonld[0]
    assert "</" not in raw and "<!--" not in raw and "<" not in raw
    data = json.loads(raw)
    names = [n.get("name") or n.get("headline") for n in data["@graph"]]
    assert any(PAYLOAD in (n or "") for n in names), "values preserved (escaped only at the serialization layer)"
    faq = next(n for n in data["@graph"] if n["@type"] == "FAQPage")
    assert faq["mainEntity"][0]["name"].startswith("</script><script>")
    # FAQ answers are rendered through the safe Markdown pipeline and reduced to plain text
    assert faq["mainEntity"][0]["acceptedAnswer"]["text"].startswith("Answer with <script>alert(5)</script>")


def test_embedded_json_blocks_are_safely_serialized(evil_site):
    html = (evil_site.out_dir / "tools/maturity-assessment/index.html").read_text(encoding="utf-8")
    for m in re.finditer(r'<script type="application/json" id="([^"]+)">(.*?)</script>', html, re.S):
        assert "<" not in m.group(2), m.group(1)
        json.loads(m.group(2))


def test_javascript_links_fail_the_build(tmp_path):
    pages = tmp_path / "pages"
    shutil.copytree(FIXTURE_PAGES_DIR, pages)
    (pages / "evil.md").write_text(EVIL_PAGE, encoding="utf-8")
    with pytest.raises(BuildError) as exc:
        SiteBuilder(pages, tmp_path / "dist").build()
    assert any("faq answer 1: unsafe link URL 'javascript:alert(6)'" in p for p in exc.value.problems), exc.value.problems


@pytest.mark.parametrize("url,ok", [
    ("/x/", True), ("#a", True), ("https://e.com", True), ("mailto:a@b.c", True), ("tel:+1", True),
    ("javascript:alert(1)", False), ("JaVaScRiPt:alert(1)", False), (" java\tscript:alert(1)", False),
    ("data:text/html;base64,PHNjcmlwdD4=", False), ("vbscript:x", False),
])
def test_url_is_safe(url, ok):
    assert url_is_safe(url) is ok


def test_render_markdown_reports_unsafe_images_and_links():
    _, problems, _ = render_markdown("[x](javascript:alert(1)) ![y](data:image/svg+xml;base64,AAAA)")
    assert len(problems) == 2


def test_safe_json_roundtrip_with_hostile_strings():
    s = "</script><!--<script>\u2028\u2029&"
    out = safe_json({"k": s})
    assert json.loads(out)["k"] == s
    assert not re.search(r"[<>&\u2028\u2029]", out)


def test_browser_code_never_uses_innerhtml_or_eval():
    for f in (STATIC_DIR / "js").glob("*.js"):
        src = re.sub(r"/\*.*?\*/", "", f.read_text(encoding="utf-8"), flags=re.S)
        src = re.sub(r"(?m)^\s*//.*$", "", src)
        for bad in ("innerHTML", "outerHTML", "insertAdjacentHTML", "document.write", "eval(", "new Function"):
            assert bad not in src, f"{f.name} uses {bad}"
