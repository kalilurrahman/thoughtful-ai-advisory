"""Unit tests: shortcodes {{cta:key}}, {{disclaimer}}, {{controls:ID,ID}} rendered through the real builder."""
from __future__ import annotations

import pytest

from aegis_common.content import controls_by_id
from aegis_common.evidence import STANDARD_DISCLAIMER
from aegis_website.builder import SiteBuilder
from aegis_website.errors import BuildError
from aegis_website.pages import parse_page
from aegis_website.paths import FIXTURE_PAGES_DIR
from aegis_website.shortcodes import ShortcodeProcessor, parse_control_ids


@pytest.fixture(scope="module")
def builder(tmp_path_factory):
    return SiteBuilder(FIXTURE_PAGES_DIR, tmp_path_factory.mktemp("out"), run_checks=False)


def render(builder, body: str) -> str:
    p = parse_page("---\ntitle: T\nslug: /t/\ndescription: A test page description long enough for the checker.\n"
                   "section: framework\n---\n" + body, "t.md")
    return builder.render_body(p)


def test_controls_shortcode_pulls_titles_and_mappings(builder):
    html = render(builder, "Intro.\n\n{{controls:IS-11, AO-01}}\n\nOutro.")
    lib = controls_by_id()
    assert lib["IS-11"]["title"] in html and lib["AO-01"]["title"] in html
    assert 'href="/framework/controls/is-11/"' in html
    # framework mappings from controls.yaml
    for ref in lib["AO-01"]["mappings"]["nist_ai_rmf"]:
        assert ref in html
    assert "NIST AI RMF:" in html and "ISO/IEC 42001:" in html
    assert "indicative AEGIS interpretations" in html
    # order preserved, block not wrapped in <p>
    assert html.index("IS-11") < html.index("AO-01")
    assert "<p><div" not in html


def test_controls_shortcode_dedupes_and_normalizes_case(builder):
    html = render(builder, "{{controls:is-11,IS-11}}")
    assert html.count('href="/framework/controls/is-11/"') == 1


@pytest.mark.parametrize("body", ["{{controls:XX-01}}", "{{controls:IS-99}}", "{{controls:IS-11,AO-1}}", "{{controls:}}",
                                  "{{controls}}"])
def test_unknown_or_empty_control_ids_fail_the_build(builder, body):
    with pytest.raises(BuildError) as exc:
        render(builder, body)
    assert any("control" in p.lower() for p in exc.value.problems)


def test_cta_shortcode_and_unknown_key(builder):
    html = render(builder, "{{cta:baseline}}")
    assert 'href="/contact/book-governance-baseline/"' in html and 'data-cta="baseline"' in html
    assert 'class="cta-block cta-block--inline"' in html
    with pytest.raises(BuildError, match="unknown CTA key"):
        render(builder, "{{cta:nonsense}}")


def test_disclaimer_shortcode_uses_standard_disclaimer(builder):
    html = render(builder, "{{disclaimer}}")
    assert STANDARD_DISCLAIMER in html
    with pytest.raises(BuildError):
        render(builder, "{{disclaimer:extra}}")


def test_unknown_shortcode_fails(builder):
    with pytest.raises(BuildError, match="unknown shortcode"):
        render(builder, "{{video:abc}}")


def test_shortcodes_in_code_are_left_alone(builder):
    html = render(builder, "Use `{{controls:XX-99}}` inline.\n\n```\n{{cta:unknown}}\n```\n")
    assert "{{controls:XX-99}}" in html and "{{cta:unknown}}" in html


def test_all_problems_reported_together(builder):
    with pytest.raises(BuildError) as exc:
        render(builder, "{{controls:XX-01}}\n\n{{cta:nope}}\n\n{{bogus}}")
    assert len(exc.value.problems) == 3


def test_processor_inject_inline_fallback():
    proc = ShortcodeProcessor({"x": lambda arg: "<b>X</b>"})
    text, blocks = proc.extract("a {{x}} b")
    html = ShortcodeProcessor.inject(f"<p>{text}</p>", blocks)
    assert "<b>X</b>" in html


def test_parse_control_ids_against_library():
    lib = controls_by_id()
    assert parse_control_ids("ao-01, EI-01", lib) == ["AO-01", "EI-01"]
    with pytest.raises(BuildError):
        parse_control_ids("AO-00", lib)
