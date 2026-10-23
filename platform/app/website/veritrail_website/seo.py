"""SEO artefacts: JSON-LD, sitemap.xml, robots.txt and safe JSON embedding."""
from __future__ import annotations

import json
from typing import Any
from xml.sax.saxutils import escape as xml_escape

from .markdown_render import render_inline


def safe_json(obj: Any, indent: int | None = None) -> str:
    """Serialize JSON for embedding inside an HTML <script> element.

    Escapes ``<``, ``>`` and ``&`` (so ``</script>`` / ``<!--`` cannot terminate or confuse
    the element) and U+2028/U+2029. The result is still valid JSON.
    """
    s = json.dumps(obj, ensure_ascii=False, indent=indent, separators=None if indent else (",", ":"),
                   sort_keys=False, default=str)
    return (s.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


def absolute(site_url: str, path: str) -> str:
    if path.startswith(("http://", "https://")):
        return path
    return site_url.rstrip("/") + "/" + path.lstrip("/")


def _plain(md_text: str) -> str:
    """FAQ answers in JSON-LD: plain text (strip tags from the safe inline rendering)."""
    import html
    import re
    return html.unescape(re.sub(r"<[^>]+>", "", render_inline(md_text))).strip()


def build_jsonld(page, site: dict, breadcrumbs: list[dict]) -> dict:
    site_url = site["site_url"].rstrip("/")
    org_id = site_url + "/#organization"
    web_id = site_url + "/#website"
    url = absolute(site_url, page.slug)
    graph: list[dict] = []
    if page.is_home:
        graph.append({
            "@type": "Organization", "@id": org_id, "name": site["organization"]["name"],
            "url": site_url + "/", "logo": absolute(site_url, site["organization"]["logo"]),
        })
        graph.append({
            "@type": "WebSite", "@id": web_id, "name": site["site_name"], "url": site_url + "/",
            "description": site.get("site_tagline", ""), "publisher": {"@id": org_id}, "inLanguage": site.get("lang", "en"),
        })
    page_type = page.schema_type if page.schema_type in {"WebPage", "CollectionPage", "ContactPage", "FAQPage"} else "WebPage"
    if page_type == "FAQPage" and not page.faq:
        page_type = "WebPage"
    webpage: dict[str, Any] = {
        "@type": page_type, "@id": url + "#webpage", "url": url, "name": page.title,
        "description": page.description, "isPartOf": {"@id": web_id}, "inLanguage": site.get("lang", "en"),
    }
    if page.updated:
        webpage["dateModified"] = page.updated
    if breadcrumbs:
        webpage["breadcrumb"] = {"@id": url + "#breadcrumb"}
    graph.append(webpage)
    if page.schema_type == "Service":
        graph.append({
            "@type": "Service", "@id": url + "#service", "name": page.h1 or page.title,
            "description": page.description, "url": url, "provider": {"@id": org_id},
            "areaServed": "Worldwide", "serviceType": "AI governance",
        })
    if page.schema_type == "Article":
        art = {"@type": "Article", "@id": url + "#article", "headline": page.h1 or page.title,
               "description": page.description, "mainEntityOfPage": {"@id": url + "#webpage"},
               "publisher": {"@id": org_id}, "author": {"@id": org_id}}
        if page.updated:
            art["dateModified"] = page.updated
            art["datePublished"] = page.updated
        graph.append(art)
    if page.faq:
        entities = [{"@type": "Question", "name": f["q"],
                     "acceptedAnswer": {"@type": "Answer", "text": _plain(f["a"])}} for f in page.faq]
        if page_type == "FAQPage":
            webpage["mainEntity"] = entities
        else:
            graph.append({"@type": "FAQPage", "@id": url + "#faq", "url": url, "name": f"{page.title} — FAQ",
                          "mainEntity": entities, "isPartOf": {"@id": web_id}})
    if breadcrumbs:
        items = []
        pos = 1
        for crumb in breadcrumbs:
            if not crumb.get("url"):
                continue
            items.append({"@type": "ListItem", "position": pos, "name": crumb["label"],
                          "item": absolute(site_url, crumb["url"])})
            pos += 1
        graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": items})
    return {"@context": "https://schema.org", "@graph": graph}


def sitemap_xml(site_url: str, pages: list) -> str:
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in sorted(pages, key=lambda p: p.slug):
        if p.noindex:
            continue
        lines.append("  <url>")
        lines.append(f"    <loc>{xml_escape(absolute(site_url, p.slug))}</loc>")
        if p.updated:
            lines.append(f"    <lastmod>{xml_escape(p.updated)}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def robots_txt(site_url: str) -> str:
    return ("User-agent: *\n"
            "Allow: /\n"
            "Disallow: /api/\n\n"
            f"Sitemap: {absolute(site_url, '/sitemap.xml')}\n")
