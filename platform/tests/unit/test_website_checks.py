"""Unit tests: the build-time quality checker (aegis_website.checks)."""
from __future__ import annotations

from pathlib import Path

from aegis_common.evidence import find_prohibited_claims
from aegis_website.checks import analyze_html, check_site

GOOD = """<!DOCTYPE html><html lang="en"><head><title>T | AEGIS</title>
<meta name="description" content="A description."><link rel="stylesheet" href="/static/a.css"></head>
<body><a class="skip-link" href="#main">Skip</a><header><nav aria-label="Primary"><a href="/">Home</a></nav></header>
<main id="main"><h1>Heading</h1>{body}</main><footer>f</footer></body></html>"""


def problems(body="", html=None):
    return analyze_html(html or GOOD.format(body=body)).problems


def test_good_page_has_no_problems():
    assert problems("<p>Hi</p><img src='/x.png' alt=''>"
                    "<label for='e'>Email</label><input id='e' name='email'>"
                    "<label>Wrapped <input name='w'></label><input type='hidden' name='h'>"
                    "<input aria-label='Search' name='q'><button type='submit'>Go</button>") == []


def test_missing_title_description_h1_and_lang():
    html = ('<html><head></head><body><a class="skip-link" href="#m">s</a><header></header><nav></nav>'
            '<main id="m"></main><footer></footer></body></html>')
    p = problems(html=html)
    assert "missing or empty <title>" in p
    assert "missing or empty meta description" in p
    assert "missing <h1>" in p
    assert "<html> has no lang attribute" in p


def test_multiple_h1_and_duplicate_ids():
    p = problems("<h1>Second</h1><div id='a'></div><div id='a'></div>")
    assert any("2 <h1>" in x for x in p)
    assert any("duplicate id 'a'" in x for x in p)


def test_image_without_alt_and_unlabelled_controls():
    p = problems("<img src='/x.png'><input name='email' id='e'><select name='s'></select><textarea name='t'></textarea>")
    assert any("image without alt" in x for x in p)
    assert sum("form control without label" in x for x in p) == 3


def test_external_resources_inline_script_style_and_handlers_rejected():
    p = problems("<script src='https://cdn.example/x.js' defer></script><script>alert(1)</script>"
                 "<style>p{}</style><a href='/x' onclick='x()'>x</a>"
                 "<link rel='stylesheet' href='https://fonts.googleapis.com/css'><script src='/local.js'></script>")
    joined = "\n".join(p)
    assert "external script not allowed" in joined
    assert "inline executable <script>" in joined
    assert "inline <style>" in joined
    assert "inline event handler" in joined
    assert "external web fonts" in joined
    assert "must be loaded with defer" in joined


def test_data_scripts_allowed_but_jsonld_must_be_valid():
    assert problems('<script type="application/json">{"a":1}</script>') == []
    p = problems('<script type="application/ld+json">{not json}</script>')
    assert any("invalid JSON-LD" in x for x in p)


def test_skip_link_and_landmarks_required():
    html = GOOD.format(body="").replace('<a class="skip-link" href="#main">Skip</a>', "").replace("<footer>f</footer>", "")
    p = problems(html=html)
    assert any("skip link" in x for x in p)
    assert "missing <footer> landmark" in p


def write(dist: Path, rel: str, body: str):
    f = dist / rel
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(GOOD.format(body=body), encoding="utf-8")


def test_check_site_links_fragments_and_assets(tmp_path):
    (tmp_path / "static").mkdir()
    (tmp_path / "static" / "a.css").write_text("")
    write(tmp_path, "index.html", "<a href='/about/'>a</a><a href='/about/#team'>t</a><a href='#main'>m</a>"
                                  "<a href='/missing/'>x</a><a href='/about/#nope'>y</a><a href='/api/leads'>api</a>"
                                  "<a href='https://example.com'>ext</a><a href='mailto:a@b.c'>m</a>"
                                  "<a href='javascript:alert(1)'>js</a><img src='/static/none.png' alt='x'>")
    write(tmp_path, "about/index.html", "<h2 id='team'>Team</h2><a href='../'>up</a>")
    res = check_site(tmp_path)
    errs = "\n".join(res["errors"])
    assert res["pages"] == 2
    assert "broken internal link '/missing/'" in errs
    assert "broken fragment '/about/#nope'" in errs
    assert "unsupported link scheme 'javascript:alert(1)'" in errs
    assert "missing asset '/static/none.png'" in errs
    assert "/about/#team" not in errs and "'#main'" not in errs and "api/leads" not in errs
    assert "about/index.html" not in errs  # relative '../' resolves


def test_check_site_flags_prohibited_claims(tmp_path):
    (tmp_path / "static").mkdir()
    (tmp_path / "static" / "a.css").write_text("")
    write(tmp_path, "index.html", "<p>With AEGIS your organization is fully compliant with the EU AI Act.</p>"
                                  "<p>AEGIS does not certify compliance.</p>")
    errs = check_site(tmp_path, claim_checker=find_prohibited_claims)["errors"]
    assert len([e for e in errs if "prohibited compliance claim" in e]) == 1
