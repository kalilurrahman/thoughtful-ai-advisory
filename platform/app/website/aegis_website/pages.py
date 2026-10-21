"""Load and validate website pages (Markdown with YAML front matter, CONTRIBUTING.md §4)."""
from __future__ import annotations

import datetime as _dt
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

from .errors import BuildError

SECTIONS = {"home", "framework", "solutions", "compliance", "industries", "tools", "resources",
            "contact", "legal", "company"}
TEMPLATES = {"page", "home", "tool", "form"}
TOOLS = {"maturity-assessment", "guardrail-generator", "ask-aegis", "risk-triage", "waitlist"}
FORMS = {"baseline", "demo", "contact", "newsletter", "blueprint", "design_partner"}  # design_partner: extension (API supports it)
SCHEMA_TYPES = {"WebPage", "Service", "Article", "FAQPage", "CollectionPage", "ContactPage"}
CTA_KEYS = {"assessment", "baseline", "agent", "blueprint", "demo", "guardrails"}

KNOWN_KEYS = {"title", "h1", "slug", "description", "section", "nav_label", "nav_order", "template",
              "tool", "form", "schema_type", "primary_cta", "secondary_cta", "faq", "updated",
              # generator extensions (optional)
              "noindex", "nav_exclude", "lead"}

SLUG_RE = re.compile(r"^/(?:[a-z0-9]+(?:-[a-z0-9]+)*/)*$")
FRONT_MATTER_RE = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.DOTALL)


@dataclass
class Page:
    source: str                      # file path (for messages)
    title: str
    slug: str
    description: str
    section: str
    template: str = "page"
    h1: str = ""
    nav_label: str = ""
    nav_order: int = 100
    tool: str | None = None
    form: str | None = None
    schema_type: str = "WebPage"
    primary_cta: str | None = None
    secondary_cta: str | None = None
    faq: list[dict] = field(default_factory=list)
    updated: str | None = None       # ISO date string
    noindex: bool = False
    nav_exclude: bool = False
    lead: str | None = None          # optional hero lead paragraph
    body: str = ""
    generated: bool = False          # produced by the generator (e.g. control library)
    extra: dict[str, Any] = field(default_factory=dict)  # template context for generated pages
    warnings: list[str] = field(default_factory=list)

    @property
    def output_path(self) -> str:
        """Path relative to dist/ — /a/b/ -> a/b/index.html."""
        return (self.slug.strip("/") + "/index.html").lstrip("/")

    @property
    def is_home(self) -> bool:
        return self.slug == "/"


def split_front_matter(text: str, source: str = "<string>") -> tuple[dict, str]:
    text = text.lstrip("\ufeff")
    m = FRONT_MATTER_RE.match(text)
    if not m:
        raise BuildError(f"{source}: missing YAML front matter (file must start with '---')")
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as exc:
        raise BuildError(f"{source}: invalid YAML front matter: {exc}") from None
    if not isinstance(meta, dict):
        raise BuildError(f"{source}: front matter must be a mapping")
    return meta, text[m.end():]


def _str(meta: dict, key: str) -> str:
    v = meta.get(key)
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        raise BuildError(f"front matter '{key}' must be a string")
    return str(v).strip()


def page_from_meta(meta: dict, body: str, source: str) -> Page:
    problems: list[str] = []
    warnings: list[str] = []

    def req(key: str) -> str:
        try:
            v = _str(meta, key)
        except BuildError as exc:
            problems.append(f"{source}: {exc}")
            return ""
        if not v:
            problems.append(f"{source}: missing required front matter '{key}'")
        return v

    title = req("title")
    slug = req("slug")
    description = req("description")
    section = req("section")
    if slug and not SLUG_RE.match(slug):
        problems.append(f"{source}: slug {slug!r} must be lowercase, start and end with '/', "
                        "and contain only a-z, 0-9 and single hyphens")
    if section and section not in SECTIONS:
        problems.append(f"{source}: unknown section {section!r} (allowed: {', '.join(sorted(SECTIONS))})")
    template = _str(meta, "template") or "page"
    if template not in TEMPLATES:
        problems.append(f"{source}: unknown template {template!r} (allowed: {', '.join(sorted(TEMPLATES))})")
    tool = _str(meta, "tool") or None
    form = _str(meta, "form") or None
    if template == "tool":
        if tool not in TOOLS:
            problems.append(f"{source}: template 'tool' requires tool: one of {', '.join(sorted(TOOLS))}")
    elif tool:
        warnings.append(f"{source}: 'tool' is ignored unless template is 'tool'")
    if template == "form":
        if form not in FORMS:
            problems.append(f"{source}: template 'form' requires form: one of {', '.join(sorted(FORMS))}")
    elif form:
        warnings.append(f"{source}: 'form' is ignored unless template is 'form'")
    schema_type = _str(meta, "schema_type") or ("ContactPage" if template == "form" else "WebPage")
    if schema_type not in SCHEMA_TYPES:
        problems.append(f"{source}: unknown schema_type {schema_type!r}")
    ctas = {}
    for key in ("primary_cta", "secondary_cta"):
        v = _str(meta, key) or None
        if v and v not in CTA_KEYS:
            problems.append(f"{source}: {key} {v!r} is not a CTA key ({', '.join(sorted(CTA_KEYS))})")
        ctas[key] = v
    faq_raw = meta.get("faq") or []
    faq: list[dict] = []
    if not isinstance(faq_raw, list):
        problems.append(f"{source}: faq must be a list of {{q, a}}")
    else:
        for i, item in enumerate(faq_raw):
            if not isinstance(item, dict) or not str(item.get("q") or "").strip() or not str(item.get("a") or "").strip():
                problems.append(f"{source}: faq[{i}] must have non-empty 'q' and 'a'")
                continue
            faq.append({"q": str(item["q"]).strip(), "a": str(item["a"]).strip()})
    if schema_type == "FAQPage" and not faq:
        warnings.append(f"{source}: schema_type FAQPage without faq entries; FAQPage JSON-LD not emitted")
    nav_order = meta.get("nav_order", 100)
    if isinstance(nav_order, bool) or not isinstance(nav_order, (int, float)):
        problems.append(f"{source}: nav_order must be a number")
        nav_order = 100
    updated = meta.get("updated")
    if isinstance(updated, (_dt.date, _dt.datetime)):
        updated = updated.isoformat()[:10]
    elif updated is not None:
        updated = str(updated).strip()
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", updated):
            problems.append(f"{source}: updated must be an ISO date (YYYY-MM-DD)")
            updated = None
    unknown = sorted(set(meta) - KNOWN_KEYS)
    if unknown:
        warnings.append(f"{source}: unknown front matter keys ignored: {', '.join(unknown)}")
    if description and not (50 <= len(description) <= 170):
        warnings.append(f"{source}: description is {len(description)} chars (aim for 120–160)")
    if problems:
        raise BuildError(problems)
    return Page(
        source=source, title=title, slug=slug, description=description, section=section,
        template=template, h1=_str(meta, "h1") or title, nav_label=_str(meta, "nav_label") or title,
        nav_order=nav_order, tool=tool if template == "tool" else None,
        form=form if template == "form" else None, schema_type=schema_type,
        primary_cta=ctas["primary_cta"], secondary_cta=ctas["secondary_cta"], faq=faq,
        updated=updated, noindex=bool(meta.get("noindex")), nav_exclude=bool(meta.get("nav_exclude")),
        lead=_str(meta, "lead") or None, body=body, warnings=warnings,
    )


def parse_page(text: str, source: str = "<string>") -> Page:
    meta, body = split_front_matter(text, source)
    return page_from_meta(meta, body, source)


def load_pages(pages_dir: Path) -> list[Page]:
    """Load every *.md page; collect all problems (including duplicate slugs) before failing."""
    pages_dir = Path(pages_dir)
    if not pages_dir.is_dir():
        raise BuildError(f"pages directory not found: {pages_dir}")
    pages: list[Page] = []
    problems: list[str] = []
    for path in sorted(pages_dir.glob("*.md")):
        if path.name.lower() == "readme.md" or path.name.startswith("_"):
            continue  # documentation / drafts, not pages
        try:
            pages.append(parse_page(path.read_text(encoding="utf-8"), str(path)))
        except BuildError as exc:
            problems.extend(exc.problems)
    problems.extend(duplicate_slug_problems(pages))
    if problems:
        raise BuildError(problems)
    if not pages:
        raise BuildError(f"no pages found in {pages_dir}")
    return pages


def duplicate_slug_problems(pages: list[Page]) -> list[str]:
    seen: dict[str, str] = {}
    out = []
    for p in pages:
        if p.slug in seen:
            out.append(f"duplicate slug {p.slug!r}: {seen[p.slug]} and {p.source}")
        else:
            seen[p.slug] = p.source
    return out
