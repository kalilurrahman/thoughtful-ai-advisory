"""Unit tests: front-matter parsing/validation and page loading (aegis_website.pages)."""
from __future__ import annotations

import textwrap

import pytest

from aegis_website.errors import BuildError
from aegis_website.pages import load_pages, parse_page


def page(meta: str, body: str = "Body text.") -> str:
    return "---\n" + textwrap.dedent(meta).strip() + "\n---\n" + body


VALID = """
title: "AEGIS Shield — Runtime guardrails"
slug: /solutions/shield/
description: "A description that is long enough to be a real meta description for search engines and social cards."
section: solutions
nav_label: "AEGIS Shield"
nav_order: 40
template: page
schema_type: Service
primary_cta: assessment
secondary_cta: guardrails
faq:
  - {q: "Question?", a: "Answer."}
updated: 2026-10-21
"""


def test_parse_valid_page_defaults_and_fields():
    p = parse_page(page(VALID, "Hello **world**"), "x.md")
    assert p.title.startswith("AEGIS Shield")
    assert p.h1 == p.title  # h1 defaults to title
    assert p.slug == "/solutions/shield/"
    assert p.schema_type == "Service"
    assert p.updated == "2026-10-21"  # YAML date normalized to ISO string
    assert p.faq == [{"q": "Question?", "a": "Answer."}]
    assert p.output_path == "solutions/shield/index.html"
    assert not p.is_home and p.body.strip() == "Hello **world**"


def test_home_slug_and_optional_extension_keys():
    p = parse_page(page("""
        title: Home
        slug: /
        description: "Home page description that is comfortably long enough for the length check to pass."
        section: home
        template: home
        lead: "A subheading for the hero."
        nav_exclude: true
    """), "index.md")
    assert p.is_home and p.output_path == "index.html"
    assert p.lead == "A subheading for the hero." and p.nav_exclude is True


@pytest.mark.parametrize("meta,needle", [
    ("slug: /a/\ndescription: d\nsection: framework", "missing required front matter 'title'"),
    ("title: T\ndescription: d\nsection: framework", "missing required front matter 'slug'"),
    ("title: T\nslug: /a/\nsection: framework", "missing required front matter 'description'"),
    ("title: T\nslug: /a/\ndescription: d", "missing required front matter 'section'"),
    ("title: T\nslug: no-slash\ndescription: d\nsection: framework", "must be lowercase"),
    ("title: T\nslug: /Upper/\ndescription: d\nsection: framework", "must be lowercase"),
    ("title: T\nslug: /a/\ndescription: d\nsection: nowhere", "unknown section"),
    ("title: T\nslug: /a/\ndescription: d\nsection: tools\ntemplate: tool", "requires tool"),
    ("title: T\nslug: /a/\ndescription: d\nsection: tools\ntemplate: tool\ntool: hack", "requires tool"),
    ("title: T\nslug: /a/\ndescription: d\nsection: contact\ntemplate: form\nform: other", "requires form"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\ntemplate: fancy", "unknown template"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\nprimary_cta: buy", "not a CTA key"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\nschema_type: Product", "unknown schema_type"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\nfaq: [{q: only}]", "faq[0]"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\nupdated: yesterday", "ISO date"),
    ("title: T\nslug: /a/\ndescription: d\nsection: framework\nnav_order: first", "nav_order"),
])
def test_invalid_front_matter_fails(meta, needle):
    with pytest.raises(BuildError) as exc:
        parse_page(page(meta), "bad.md")
    assert any(needle in p for p in exc.value.problems), exc.value.problems


def test_missing_front_matter_and_bad_yaml():
    with pytest.raises(BuildError, match="missing YAML front matter"):
        parse_page("# no front matter", "a.md")
    with pytest.raises(BuildError, match="invalid YAML"):
        parse_page("---\ntitle: [unclosed\n---\n", "b.md")


def test_warnings_for_unknown_keys_and_short_description():
    p = parse_page(page("title: T\nslug: /a/\ndescription: short\nsection: framework\ncolour: blue"), "w.md")
    assert any("unknown front matter keys" in w for w in p.warnings)
    assert any("description is" in w for w in p.warnings)


def test_load_pages_skips_readme_and_underscore_files(tmp_path):
    (tmp_path / "README.md").write_text("# Pages\nNo front matter here.")
    (tmp_path / "readme.MD").write_text("lowercase readme")
    (tmp_path / "_draft.md").write_text("draft without front matter")
    (tmp_path / "a.md").write_text(page(VALID))
    pages = load_pages(tmp_path)
    assert [p.slug for p in pages] == ["/solutions/shield/"]


def test_load_pages_reports_duplicate_slugs_and_all_problems_at_once(tmp_path):
    (tmp_path / "a.md").write_text(page(VALID))
    (tmp_path / "b.md").write_text(page(VALID))
    (tmp_path / "c.md").write_text(page("title: T\nslug: /x/\nsection: framework"))
    with pytest.raises(BuildError) as exc:
        load_pages(tmp_path)
    msgs = "\n".join(exc.value.problems)
    assert "duplicate slug '/solutions/shield/'" in msgs
    assert "missing required front matter 'description'" in msgs


def test_load_pages_empty_or_missing_dir(tmp_path):
    with pytest.raises(BuildError, match="no pages"):
        load_pages(tmp_path)
    with pytest.raises(BuildError, match="not found"):
        load_pages(tmp_path / "nope")
