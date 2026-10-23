"""Integration: full site builds (fixture pages and, when present, the real content/website_pages)."""
from __future__ import annotations

import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

from veritrail_common.content import controls, pillars
from veritrail_common.evidence import STANDARD_DISCLAIMER
from veritrail_website.builder import SiteBuilder, main
from veritrail_website.checks import analyze_html, check_site
from veritrail_website.errors import BuildError
from veritrail_website.ogimage import png_size
from veritrail_website.paths import DEFAULT_PAGES_DIR, FIXTURE_PAGES_DIR

SITE_URL = "https://www.veritrail-governance.example"


@pytest.fixture(scope="module")
def site(tmp_path_factory):
    out = tmp_path_factory.mktemp("fixture-site") / "dist"
    res = SiteBuilder(FIXTURE_PAGES_DIR, out, build_date="2026-10-21").build()
    return res


def read(res, rel):
    return (res.out_dir / rel).read_text(encoding="utf-8")


def jsonld(html):
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    return json.loads(m.group(1))


def test_build_outputs_and_checks_pass(site):
    assert site.check["errors"] == []
    out = site.out_dir
    for rel in ["index.html", "404.html", "sitemap.xml", "robots.txt", "static/css/veritrail.css", "static/css/print.css",
                "static/js/site.js", "static/js/analytics.js", "static/js/assessment-engine.js",
                "static/img/og-default.svg", "static/img/og-default.png", "static/img/veritrail-logo.png",
                "static/img/favicon.svg", ".veritrail-dist"]:
        assert (out / rel).is_file(), rel
    assert png_size((out / "static/img/og-default.png").read_bytes()) == (1200, 630)
    # every fixture page rendered
    for p in site.pages:
        assert (out / p.output_path).is_file(), p.slug


def test_control_library_generated_from_controls_yaml(site):
    all_controls = controls()
    assert len(all_controls) == 64
    html = read(site, "framework/controls/index.html")
    for pl in pillars():
        assert f'id="pillar-{pl["id"].lower()}"' in html and pl["name"].replace("&", "&amp;") in html
    for c in all_controls:
        assert f'href="/framework/controls/{c["id"].lower()}/"' in html
        detail = read(site, f'framework/controls/{c["id"].lower()}/index.html')
        assert c["id"] in detail
        for ref in c["mappings"].get("iso_42001") or []:
            assert str(ref) in detail
        assert "indicative" in detail.lower()
    is11 = read(site, "framework/controls/is-11/index.html")
    assert "SEC-Q2" in is11  # assessment questions that cite the control
    assert jsonld(html)["@graph"][0]["@type"] == "CollectionPage"


def test_every_page_has_header_nav_cta_breadcrumbs_footer(site):
    for p in site.pages:
        html = read(site, p.output_path)
        assert 'class="btn btn-primary header-cta" href="/contact/book-governance-baseline/"' in html, p.slug
        assert 'aria-label="Primary"' in html
        for label in ["Framework", "Solutions", "Tools", "Resources"]:
            assert f'<summary class="nav-summary">{label}</summary>' in html
        assert STANDARD_DISCLAIMER in html
        assert 'data-veritrail-form="newsletter"' in html  # footer signup
        assert '<a class="skip-link" href="#main">' in html
        if not p.is_home:
            assert 'aria-label="Breadcrumb"' in html, p.slug


def test_nav_sections_follow_site_config_and_skip_empty_sections(site):
    html = read(site, "index.html")
    labels = re.findall(r'<summary class="nav-summary">([^<]+)</summary>', html)
    assert labels == ["Framework", "Solutions", "Tools", "Resources"]  # fixtures have no compliance/industries pages
    assert '<a href="/framework/controls/">Control library</a>' in html


def test_seo_meta_canonical_og_twitter(site):
    html = read(site, "solutions/agent/index.html")
    assert f'<link rel="canonical" href="{SITE_URL}/solutions/agent/">' in html
    assert '<meta property="og:title" content="Fixture VERITRAIL Agent service page">' in html
    assert f'<meta property="og:image" content="{SITE_URL}/static/img/og-default.png">' in html
    assert '<meta name="twitter:card" content="summary_large_image">' in html
    types = [n["@type"] for n in jsonld(html)["@graph"]]
    assert types == ["WebPage", "Service", "FAQPage", "BreadcrumbList"]
    home_types = [n["@type"] for n in jsonld(read(site, "index.html"))["@graph"]]
    assert home_types[:2] == ["Organization", "WebSite"]


def test_404_is_noindex_and_excluded_from_sitemap(site):
    html = read(site, "404.html")
    assert '<meta name="robots" content="noindex, follow">' in html
    assert 'rel="canonical"' not in html
    sm = read(site, "sitemap.xml")
    locs = [e.text for e in ET.fromstring(sm).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    assert f"{SITE_URL}/" in locs and f"{SITE_URL}/framework/controls/ao-01/" in locs
    assert not any("404" in u for u in locs)
    assert len(locs) == len(site.pages)
    assert read(site, "robots.txt").endswith(f"Sitemap: {SITE_URL}/sitemap.xml\n")


def test_js_only_loaded_where_needed_and_deferred(site):
    def scripts(rel):
        return re.findall(r'<script src="([^"]+)"( defer)?></script>', read(site, rel))
    page_scripts = scripts("framework/index.html")
    assert [s.split("?")[0] for s, _ in page_scripts] == ["/static/js/site.js", "/static/js/analytics.js"]
    assert all(d for _, d in page_scripts)
    tool = [s.split("?")[0] for s, _ in scripts("tools/maturity-assessment/index.html")]
    assert "/static/js/assessment-engine.js" in tool and "/static/js/assessment-ui.js" in tool
    assert "/static/js/assessment-engine.js" not in [s.split("?")[0] for s, _ in scripts("tools/risk-triage/index.html")]
    assert "?v=" in page_scripts[0][0]  # cache-busting content hash


def test_assessment_page_embeds_template_bundle_and_structure(site):
    html = read(site, "tools/maturity-assessment/index.html")
    m = re.search(r'<script type="application/json" id="veritrail-assessment-data">(.*?)</script>', html, re.S)
    bundle = json.loads(m.group(1))
    assert bundle["template"]["template"]["id"] == "VERITRAIL-SA-MATURITY"
    assert len(bundle["template"]["questions"]) == 24
    assert set(bundle["controls"]) >= {c for q in bundle["template"]["questions"] for c in q["controls"]}
    assert html.count('class="assessment-step"') == 9  # profile + 8 domains
    assert html.count('class="question"') == 24
    assert 'id="assessment-progress"' in html
    for f in ["gate-name", "gate-email", "gate-company", "gate-role", "gate-consent", "gate-website"]:
        assert f'id="{f}"' in html
    assert 'href="/legal/privacy/"' in html


def test_forms_have_labels_consent_privacy_and_honeypot(site):
    for rel, form in [("contact/index.html", "contact"), ("contact/book-governance-baseline/index.html", "baseline"),
                      ("contact/request-demo/index.html", "demo"), ("resources/blueprint/index.html", "blueprint"),
                      ("resources/newsletter/index.html", "newsletter"), ("tools/evidence-planner/index.html", "waitlist")]:
        html = read(site, rel)
        assert f'data-veritrail-form="{form}"' in html, rel
        assert 'name="website"' in html and 'tabindex="-1"' in html
        assert re.search(r'id="lf-consent"|id="wl-consent"', html)
        assert 'privacy notice</a>' in html
        assert analyze_html(html, rel).problems == []
    assert 'data-business-email="true"' in read(site, "contact/book-governance-baseline/index.html")
    assert 'data-tool="evidence-planner"' in read(site, "tools/evidence-planner/index.html")


def test_blueprint_download_copied_when_available(tmp_path, monkeypatch):
    src = tmp_path / "VERITRAIL_Enterprise_Blueprint.pdf"
    src.write_bytes(b"%PDF-1.4 test")
    b = SiteBuilder(FIXTURE_PAGES_DIR, tmp_path / "dist", run_checks=False)
    b.site["downloads"]["blueprint"]["sources"] = [str(src)]
    b.build()
    assert (tmp_path / "dist/downloads/VERITRAIL_Enterprise_Blueprint.pdf").read_bytes() == b"%PDF-1.4 test"
    html = (tmp_path / "dist/resources/blueprint/index.html").read_text()
    assert 'data-download="/downloads/VERITRAIL_Enterprise_Blueprint.pdf"' in html


def test_missing_blueprint_warns_not_fails(tmp_path):
    b = SiteBuilder(FIXTURE_PAGES_DIR, tmp_path / "dist", run_checks=False)
    b.site["downloads"]["blueprint"]["sources"] = ["does/not/exist.pdf"]
    res = b.build()
    assert any("blueprint download" in w for w in res.warnings)
    assert "data-download=" not in (tmp_path / "dist/resources/blueprint/index.html").read_text()


def test_site_url_override(tmp_path):
    res = SiteBuilder(FIXTURE_PAGES_DIR, tmp_path / "d", site_url="https://www.example.com/", run_checks=False).build()
    html = (res.out_dir / "index.html").read_text()
    assert '<link rel="canonical" href="https://www.example.com/">' in html
    assert "veritrail-governance.example/sitemap" not in (res.out_dir / "robots.txt").read_text()


def test_broken_internal_link_fails_build(tmp_path):
    pages = tmp_path / "pages"
    shutil.copytree(FIXTURE_PAGES_DIR, pages)
    (pages / "broken.md").write_text("---\ntitle: Broken\nslug: /broken/\ndescription: A page with a broken internal "
                                     "link used to verify that the build fails.\nsection: resources\n---\n"
                                     "See [missing](/does-not-exist/).\n")
    with pytest.raises(BuildError) as exc:
        SiteBuilder(pages, tmp_path / "dist").build()
    assert any("broken internal link '/does-not-exist/'" in p for p in exc.value.problems)


def test_refuses_to_wipe_unmarked_directory(tmp_path):
    (tmp_path / "keep.txt").write_text("important")
    with pytest.raises(BuildError, match="refusing to overwrite"):
        SiteBuilder(FIXTURE_PAGES_DIR, tmp_path, run_checks=False).build()
    assert (tmp_path / "keep.txt").exists()


def test_cli_entry_point(tmp_path, capsys):
    assert main(["--pages", str(FIXTURE_PAGES_DIR), "--out", str(tmp_path / "o")]) == 0
    assert "checks passed" in capsys.readouterr().out
    bad = tmp_path / "bad"
    bad.mkdir()
    (bad / "x.md").write_text("no front matter")
    assert main(["--pages", str(bad), "--out", str(tmp_path / "o2")]) == 1
    assert "BUILD FAILED" in capsys.readouterr().err


@pytest.mark.skipif(not any(DEFAULT_PAGES_DIR.glob("*.md")), reason="content/website_pages not populated")
def test_real_content_builds_and_passes_checks(tmp_path):
    res = SiteBuilder(DEFAULT_PAGES_DIR, tmp_path / "dist").build()
    assert res.check["errors"] == []
    slugs = {p.slug for p in res.pages}
    for required in ["/", "/tools/maturity-assessment/", "/contact/book-governance-baseline/", "/framework/controls/"]:
        assert required in slugs
    assert sum(1 for p in res.pages if p.slug.startswith("/framework/controls/")) == 65
    # every page has an h1, title and description (checked) and the checker saw every page + 404
    assert res.check["pages"] == len(res.pages) + 1
    # re-run the checker on the output independently
    assert check_site(res.out_dir)["errors"] == []
