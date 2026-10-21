"""Accessibility static checks (WCAG 2.2 AA target) on CSS and the built fixture site."""
from __future__ import annotations

import re

import pytest

from aegis_website.builder import SiteBuilder
from aegis_website.paths import FIXTURE_PAGES_DIR, STATIC_DIR

CSS = (STATIC_DIR / "css" / "aegis.css").read_text(encoding="utf-8")


def _vars() -> dict[str, str]:
    root = re.search(r":root\s*\{(.*?)\}", CSS, re.S).group(1)
    return dict(re.findall(r"--([a-z0-9-]+):\s*([^;]+);", root))


def _rgb(hex_: str) -> tuple[float, float, float]:
    h = hex_.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _lum(rgb) -> float:
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((_lum(_rgb(a)), _lum(_rgb(b))), reverse=True)
    return (la + 0.05) / (lb + 0.05)


V = _vars()
# (foreground, background, minimum ratio) — 4.5:1 for text, 3:1 for focus indicators / UI boundaries
PAIRS = [
    ("c-text", "c-bg", 4.5), ("c-muted", "c-bg", 4.5), ("c-muted", "c-surface", 4.5), ("c-link", "c-bg", 4.5),
    ("c-link", "c-surface", 4.5), ("c-navy", "c-bg", 4.5), ("c-on-dark", "c-navy", 4.5), ("c-on-dark-muted", "c-navy", 4.5),
    ("c-on-dark", "c-primary", 4.5), ("c-on-dark", "c-primary-hover", 4.5), ("c-success", "c-success-bg", 4.5),
    ("c-danger", "c-danger-bg", 4.5), ("c-danger", "c-bg", 4.5), ("c-warning-text", "c-warning-bg", 4.5),
    ("c-primary", "c-info-bg", 4.5), ("c-text", "c-info-bg", 4.5),
    ("c-focus", "c-bg", 3.0), ("c-focus", "c-surface", 3.0), ("c-focus-dark", "c-navy", 3.0),
]


@pytest.mark.parametrize("fg,bg,minimum", PAIRS)
def test_color_contrast(fg, bg, minimum):
    ratio = contrast(V[fg], V[bg])
    assert ratio >= minimum, f"{fg} on {bg}: {ratio:.2f} < {minimum}"


def test_input_border_contrast_meets_non_text_minimum():
    border = re.search(r'input\[type="text"\][^{]*\{[^}]*border: 2px solid (#[0-9a-fA-F]{6})', CSS).group(1)
    assert contrast(border, V["c-bg"]) >= 3.0


def test_css_focus_motion_and_targets():
    assert ":focus-visible" in CSS and "outline: 3px solid" in CSS
    assert "@media (prefers-reduced-motion: reduce)" in CSS
    assert "forced-colors" in CSS
    assert re.search(r"\.btn \{[^}]*min-height: 44px", CSS)
    assert ".skip-link:focus" in CSS
    # outline removal only for the programmatically-focused <main>, never for interactive elements
    for m in re.finditer(r"([^{}]+)\{[^}]*outline:\s*(none|0)", CSS):
        assert m.group(1).strip() == "main:focus", m.group(1)
    assert "@import" not in CSS and "url(http" not in CSS and "font-face" not in CSS  # no external fonts


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    return SiteBuilder(FIXTURE_PAGES_DIR, tmp_path_factory.mktemp("a11y") / "dist").build()


def test_landmarks_lang_skip_link_on_every_page(site):
    for f in site.out_dir.rglob("*.html"):
        html = f.read_text()
        assert re.search(r'<html lang="en">', html), f
        assert html.count("<main") == 1 and 'id="main"' in html
        assert re.search(r'<body[^>]*>\s*<a class="skip-link" href="#main">', html), f
        assert '<meta name="viewport" content="width=device-width, initial-scale=1">' in html
        assert "user-scalable=no" not in html and "maximum-scale" not in html


def test_navigation_is_keyboard_operable_disclosure(site):
    html = (site.out_dir / "index.html").read_text()
    # native <details>/<summary> menus work with keyboard and without JS
    assert html.count('<details class="nav-disclosure') == 4
    assert 'aria-controls="site-nav"' in html and 'aria-expanded="false"' in html
    assert re.search(r'<button class="nav-toggle" type="button"[^>]*hidden>', html), "menu toggle only shown when JS runs"


def test_assessment_widgets_are_grouped_and_announced(site):
    html = (site.out_dir / "tools/maturity-assessment/index.html").read_text()
    assert html.count('<fieldset class="question"') == 24
    assert html.count("<legend>") >= 24 + 2  # questions + yes/no profile questions
    assert 'aria-labelledby="assessment-progress-label"' in html
    assert 'role="alert"' in html  # error summary
    assert html.count('aria-live="polite"') >= 1
    assert 'autocomplete="email"' in html and 'autocomplete="organization"' in html
    for qid in ("str-q1", "asr-q3"):
        for v in range(1, 6):
            assert f'<label for="q-{qid}-{v}">' in html


def test_tool_results_and_statuses_are_live_regions(site):
    for rel in ["tools/risk-triage/index.html", "tools/guardrail-generator/index.html", "tools/ask-aegis/index.html"]:
        html = (site.out_dir / rel).read_text()
        assert 'role="status" aria-live="polite"' in html, rel
        assert "<noscript>" in html
    chat = (site.out_dir / "tools/ask-aegis/index.html").read_text()
    assert 'role="log"' in chat


def test_tables_are_scrollable_focusable_regions(site):
    html = (site.out_dir / "framework/index.html").read_text()
    assert '<div aria-label="Scrollable table" class="table-wrap" role="region" tabindex="0"><table>' in html
    lib = (site.out_dir / "framework/controls/index.html").read_text()
    assert '<th scope="col">' in lib and '<th scope="row">' in lib


def test_required_fields_marked_in_text_not_only_color(site):
    html = (site.out_dir / "contact/book-governance-baseline/index.html").read_text()
    assert '<span class="req">(required)</span>' in html
    assert 'aria-describedby="lf-email-hint"' in html
