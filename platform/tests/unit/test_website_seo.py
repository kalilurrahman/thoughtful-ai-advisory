"""Unit tests: SEO helpers (JSON-LD, sitemap, robots, safe JSON) and the OG image writer."""
from __future__ import annotations

import json
import xml.etree.ElementTree as ET

from veritrail_website.ogimage import png_size, render_logo, render_og
from veritrail_website.pages import parse_page
from veritrail_website.seo import absolute, build_jsonld, robots_txt, safe_json, sitemap_xml

SITE = {"site_url": "https://www.veritrail-governance.example", "site_name": "VERITRAIL", "site_tagline": "Tagline",
        "lang": "en", "organization": {"name": "VERITRAIL", "logo": "/static/img/veritrail-logo.png"}}


def mk(meta: str):
    return parse_page("---\n" + meta + "\n---\nBody", "t.md")


BASE = "description: A meta description that is long enough to pass the length warning check.\n"


def types(ld):
    return [n["@type"] for n in ld["@graph"]]


def test_home_has_organization_and_website():
    p = mk("title: Home\nslug: /\nsection: home\ntemplate: home\n" + BASE)
    ld = build_jsonld(p, SITE, [])
    assert types(ld)[:3] == ["Organization", "WebSite", "WebPage"]
    assert ld["@context"] == "https://schema.org"
    org = ld["@graph"][0]
    assert org["logo"] == "https://www.veritrail-governance.example/static/img/veritrail-logo.png"


def test_service_faq_and_breadcrumbs():
    p = mk("title: Shield\nslug: /solutions/shield/\nsection: solutions\nschema_type: Service\n" + BASE +
           "faq:\n  - {q: 'Q1?', a: 'A **bold** [link](/x/) answer.'}")
    crumbs = [{"label": "Home", "url": "/"}, {"label": "Solutions", "url": None}, {"label": "Shield", "url": "/solutions/shield/"}]
    ld = build_jsonld(p, SITE, crumbs)
    t = types(ld)
    assert "Service" in t and "FAQPage" in t and "BreadcrumbList" in t and "Organization" not in t
    faq = next(n for n in ld["@graph"] if n["@type"] == "FAQPage")
    assert faq["mainEntity"][0]["acceptedAnswer"]["text"] == "A bold link answer."
    bc = next(n for n in ld["@graph"] if n["@type"] == "BreadcrumbList")
    assert [i["position"] for i in bc["itemListElement"]] == [1, 2]  # unlinked crumb skipped
    assert bc["itemListElement"][1]["item"] == "https://www.veritrail-governance.example/solutions/shield/"


def test_faqpage_schema_type_puts_questions_on_the_page_node():
    p = mk("title: FAQ\nslug: /faq/\nsection: resources\nschema_type: FAQPage\n" + BASE + "faq:\n  - {q: 'Q?', a: 'A.'}")
    ld = build_jsonld(p, SITE, [])
    page_node = ld["@graph"][0]
    assert page_node["@type"] == "FAQPage" and page_node["mainEntity"][0]["name"] == "Q?"


def test_article_has_dates():
    p = mk("title: Post\nslug: /resources/blog/x/\nsection: resources\nschema_type: Article\nupdated: 2026-10-21\n" + BASE)
    art = next(n for n in build_jsonld(p, SITE, [])["@graph"] if n["@type"] == "Article")
    assert art["datePublished"] == "2026-10-21"


def test_safe_json_escapes_html_breaking_sequences_but_stays_valid_json():
    obj = {"x": "</script><script>alert(1)</script> & <!-- \u2028"}
    s = safe_json(obj)
    assert "</" not in s and "<!--" not in s and "<" not in s and "&" not in s and "\u2028" not in s
    assert json.loads(s) == obj


def test_sitemap_and_robots():
    pages = [mk("title: A\nslug: /\nsection: home\nupdated: 2026-10-21\n" + BASE),
             mk("title: B\nslug: /b/\nsection: framework\n" + BASE),
             mk("title: Hidden\nslug: /h/\nsection: legal\nnoindex: true\n" + BASE)]
    xml = sitemap_xml(SITE["site_url"], pages)
    root = ET.fromstring(xml)
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [e.text for e in root.findall("s:url/s:loc", ns)]
    assert locs == ["https://www.veritrail-governance.example/", "https://www.veritrail-governance.example/b/"]
    assert root.find("s:url/s:lastmod", ns).text == "2026-10-21"
    robots = robots_txt(SITE["site_url"])
    assert "Sitemap: https://www.veritrail-governance.example/sitemap.xml" in robots
    assert "Disallow: /api/" in robots


def test_absolute():
    assert absolute("https://a.example/", "/x/") == "https://a.example/x/"
    assert absolute("https://a.example", "https://b.example/y") == "https://b.example/y"


def test_og_png_and_logo_are_valid_pngs():
    og = render_og(240, 126, ss=1)
    assert png_size(og) == (240, 126)
    logo = render_logo(32, ss=1)
    assert png_size(logo) == (32, 32)
