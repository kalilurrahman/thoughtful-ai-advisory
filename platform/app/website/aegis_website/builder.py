"""AEGIS static site builder.

    python3 app/website/build.py                      # content/website_pages -> app/website/dist
    python3 app/website/build.py --pages tests/fixtures/website_pages --out /tmp/site
    python3 app/website/build.py --site-url https://www.example.com

Pipeline: load site.yaml + controls.yaml + assessment template -> load & validate pages ->
add generated pages (control library, 404) -> shortcodes -> safe Markdown -> Jinja2 templates
-> static assets (content-hashed query strings) -> OG images -> sitemap/robots -> checks.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markupsafe import Markup

from . import paths
from .checks import check_site
from .errors import BuildError
from .forms import FORMS
from .markdown_render import render_inline, render_markdown
from .pages import CTA_KEYS, Page, duplicate_slug_problems, load_pages
from .seo import absolute, build_jsonld, robots_txt, safe_json, sitemap_xml
from .shortcodes import ShortcodeProcessor, parse_control_ids
from .tools import GUARDRAIL_FIELDS, RISK_TRIAGE_FIELDS

_common = paths.REPO_ROOT / "app" / "common"
if str(_common) not in sys.path:
    sys.path.insert(0, str(_common))
from aegis_common.evidence import STANDARD_DISCLAIMER, find_prohibited_claims  # noqa: E402

DIST_MARKER = ".aegis-dist"
FRAMEWORK_LABELS = {"nist_ai_rmf": "NIST AI RMF", "iso_42001": "ISO/IEC 42001", "eu_ai_act": "EU AI Act"}
APPLIES_LABELS = {"all": "All AI systems", "high_risk": "High-risk systems", "genai": "Generative AI systems",
                  "agentic": "Agents and agentic workflows", "third_party": "Third-party / vendor AI"}
TOOL_SCRIPTS = {
    "maturity-assessment": ["js/assessment-engine.js", "js/assessment-report.js", "js/assessment-ui.js"],
    "guardrail-generator": ["js/tools-common.js", "js/guardrail.js"],
    "ask-aegis": ["js/tools-common.js", "js/ask-aegis.js"],
    "risk-triage": ["js/tools-common.js", "js/risk-triage.js"],
    "waitlist": [],
}
PROFILE_OPTION_LABELS = {
    "industry": {"healthcare_pharma": "Healthcare & pharma", "bfsi": "Banking, financial services & insurance",
                 "gcc_it_services": "Global capability center / IT services", "saas_product": "SaaS / product company",
                 "public_sector": "Public sector", "other": "Other"},
    "org_size": {"<250": "Fewer than 250", "250-1000": "250–1,000", "1000-5000": "1,000–5,000", "5000+": "More than 5,000"},
    "ai_systems": {"0-9": "0–9", "10-24": "10–24", "25-99": "25–99", "100+": "100 or more", "unknown": "Not sure"},
}


@dataclass
class BuildResult:
    out_dir: Path
    pages: list[Page]
    warnings: list[str] = field(default_factory=list)
    check: dict = field(default_factory=dict)

    @property
    def page_count(self) -> int:
        return len(self.pages)


def load_site_config(path: Path | None = None, site_url: str | None = None) -> dict:
    cfg = yaml.safe_load(Path(path or paths.SITE_CONFIG).read_text(encoding="utf-8"))
    if site_url:
        cfg["site_url"] = site_url
    cfg["site_url"] = cfg["site_url"].rstrip("/")
    missing = sorted(CTA_KEYS - set(cfg.get("ctas", {})))
    if missing:
        raise BuildError(f"site.yaml: ctas missing keys: {', '.join(missing)}")
    return cfg


def _trim(text: str, limit: int = 158) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0].rstrip(",;:")
    return cut + "…"


class SiteBuilder:
    def __init__(self, pages_dir: Path | str | None = None, out_dir: Path | str | None = None,
                 site_url: str | None = None, config_path: Path | str | None = None,
                 controls_path: Path | str | None = None, template_path: Path | str | None = None,
                 run_checks: bool = True, build_date: str | None = None):
        self.pages_dir = Path(pages_dir or paths.DEFAULT_PAGES_DIR)
        self.out = Path(out_dir or paths.DIST_DIR)
        self.site = load_site_config(Path(config_path) if config_path else None, site_url)
        self.controls_lib = yaml.safe_load(Path(controls_path or paths.CONTROLS_FILE).read_text(encoding="utf-8"))
        self.controls = {c["id"]: c for c in self.controls_lib["controls"]}
        self.pillars = {p["id"]: p for p in self.controls_lib["pillars"]}
        self.assessment = yaml.safe_load(Path(template_path or paths.ASSESSMENT_TEMPLATE_FILE).read_text(encoding="utf-8"))
        self.run_checks = run_checks
        self.build_date = build_date or _dt.date.today().isoformat()
        self.warnings: list[str] = []
        self.asset_versions: dict[str, str] = {}
        self.env = Environment(
            loader=FileSystemLoader(str(paths.TEMPLATES_DIR)),
            autoescape=select_autoescape(["html", "xml"], default_for_string=True, default=True),
            undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True,
        )
        self.env.globals.update(asset=self.asset_url, absolute=lambda p: absolute(self.site["site_url"], p))
        self.env.filters["inline_md"] = lambda s: Markup(render_inline(str(s)))
        self.env.filters["json_script"] = lambda o: Markup(safe_json(o))
        self._cta_counter = 0

    # ------------------------------------------------------------------ helpers
    def asset_url(self, rel: str) -> str:
        v = self.asset_versions.get(rel)
        if v is None:
            src = paths.STATIC_DIR / rel
            v = hashlib.sha256(src.read_bytes()).hexdigest()[:10] if src.is_file() else "0"
            self.asset_versions[rel] = v
        return f"/static/{rel}?v={v}"

    def control_url(self, cid: str) -> str:
        return self.site["control_library"]["slug"] + cid.lower() + "/"

    def control_view(self, cid: str) -> dict:
        c = self.controls[cid]
        maps = [{"framework": FRAMEWORK_LABELS.get(k, k), "refs": [str(x) for x in (v or [])]}
                for k, v in (c.get("mappings") or {}).items()]
        return {"id": c["id"], "title": c["title"], "url": self.control_url(c["id"]), "pillar": c["pillar"],
                "pillar_name": self.pillars[c["pillar"]]["name"], "priority": c.get("priority", ""),
                "objective": c.get("objective", ""), "mappings": maps,
                "applies_to": APPLIES_LABELS.get(c.get("applies_to"), c.get("applies_to")),
                "owner_role": c.get("owner_role", ""), "evidence": c.get("evidence") or [],
                "modules": c.get("modules") or [], "domains": c.get("domains") or []}

    # ------------------------------------------------------------------ shortcodes
    def _shortcodes(self) -> ShortcodeProcessor:
        def cta(arg):
            if not arg or arg not in self.site["ctas"]:
                raise BuildError(f"unknown CTA key {arg!r} in {{{{cta:{arg}}}}} (known: {', '.join(sorted(self.site['ctas']))})")
            return self.render_cta(arg, "inline")

        def disclaimer(arg):
            if arg:
                raise BuildError("{{disclaimer}} takes no argument")
            return self.env.get_template("partials/disclaimer.html").render(disclaimer=STANDARD_DISCLAIMER)

        def controls(arg):
            ids = parse_control_ids(arg, self.controls)
            return self.env.get_template("partials/controls.html").render(
                controls=[self.control_view(c) for c in ids],
                mapping_note="Framework mappings are indicative AEGIS interpretations "
                             f"(Control Library v{self.controls_lib['library']['version']}); they are not legal advice "
                             "and do not establish conformity or compliance.")

        return ShortcodeProcessor({"cta": cta, "disclaimer": disclaimer, "controls": controls})

    def render_cta(self, key: str, variant: str) -> str:
        self._cta_counter += 1
        return self.env.get_template("partials/cta.html").render(
            cta=self.site["ctas"][key], key=key, variant=variant, uid=f"cta-{self._cta_counter}")

    def render_body(self, page: Page) -> str:
        text, blocks = self._shortcodes().extract(page.body, page.source)
        html, problems, warnings = render_markdown(text)
        if problems:
            raise BuildError([f"{page.source}: {p}" for p in problems])
        self.warnings.extend(f"{page.source}: {w}" for w in warnings)
        return ShortcodeProcessor.inject(html, blocks)

    # ------------------------------------------------------------------ structure
    def generated_pages(self, pages: list[Page]) -> list[Page]:
        by_slug = {p.slug: p for p in pages}
        cl = self.site["control_library"]
        out: list[Page] = []
        lib_ver = self.controls_lib["library"]["version"]
        n = len(self.controls)
        index_page = by_slug.get(cl["slug"])
        if index_page is not None:
            index_page.template = "controls_index"
            index_page.generated = True
        else:
            index_page = Page(
                source="<generated: control library>", slug=cl["slug"],
                title=f"AEGIS Control Library — {n} AI governance controls",
                h1="AEGIS Control Library",
                description=_trim(f"All {n} AEGIS AI governance controls by pillar, with objectives, owners, "
                                  "evidence and indicative NIST AI RMF, ISO/IEC 42001 and EU AI Act mappings."),
                section="framework", template="controls_index", nav_label=cl.get("nav_label", "Control library"),
                nav_order=cl.get("nav_order", 25), schema_type="CollectionPage", primary_cta="assessment",
                secondary_cta="baseline", updated=self.controls_lib["library"].get("effective_date"), generated=True)
            out.append(index_page)
        groups = []
        for pid, pillar in self.pillars.items():
            ctrls = [self.control_view(c["id"]) for c in self.controls_lib["controls"] if c["pillar"] == pid]
            groups.append({"id": pid, "anchor": f"pillar-{pid.lower()}", "name": pillar["name"],
                           "summary": pillar.get("summary", ""), "controls": ctrls})
        index_page.extra = {"pillar_groups": groups, "library": self.controls_lib["library"], "control_count": n}
        # questions/flags referencing each control
        q_by_ctrl: dict[str, list[dict]] = {}
        for q in self.assessment["questions"]:
            for c in q["controls"]:
                q_by_ctrl.setdefault(c, []).append(q)
        f_by_ctrl: dict[str, list[dict]] = {}
        for f in self.assessment["critical_flags"]:
            for c in f["controls"]:
                f_by_ctrl.setdefault(c, []).append(f)
        ids = [c["id"] for c in self.controls_lib["controls"]]
        for i, cid in enumerate(ids):
            v = self.control_view(cid)
            prev_v = self.control_view(ids[i - 1]) if i > 0 else None
            next_v = self.control_view(ids[i + 1]) if i + 1 < len(ids) else None
            out.append(Page(
                source=f"<generated: control {cid}>", slug=v["url"],
                title=f"{cid} {v['title']} — AEGIS control",
                h1=f"{cid}: {v['title']}",
                description=_trim(f"AEGIS control {cid} ({v['title']}): {v['objective']}"),
                section="framework", template="control", nav_label=cid, nav_exclude=True,
                schema_type="WebPage", primary_cta="assessment", secondary_cta="baseline",
                updated=self.controls_lib["library"].get("effective_date"), generated=True,
                extra={"control": v, "questions": q_by_ctrl.get(cid, []), "flags": f_by_ctrl.get(cid, []),
                       "prev": prev_v, "next": next_v, "library_version": lib_ver,
                       "mapping_disclaimer": self.controls_lib["library"].get("mapping_disclaimer", "")}))
        return out

    def not_found_page(self, pages: list[Page]) -> Page:
        for p in pages:
            if p.slug == "/404/":
                pages.remove(p)
                p.noindex = True
                p.template = "404"
                return p
        return Page(source="<generated: 404>", slug="/404/", title="Page not found | AEGIS", h1="Page not found",
                    description="The page you requested could not be found. Use the navigation or the links below to find AEGIS content.",
                    section="home", template="404", noindex=True, nav_exclude=True, generated=True)

    def build_nav(self, pages: list[Page]) -> list[dict]:
        nav = []
        for sec in self.site["nav_sections"]:
            sid = sec["id"]
            landing = next((p for p in pages if p.slug == f"/{sid}/"), None)
            items = [p for p in pages if p.section == sid and not p.nav_exclude and not p.noindex and p is not landing]
            items.sort(key=lambda p: (p.nav_order, p.nav_label.lower()))
            entries = []
            if landing:
                entries.append({"label": "Overview" if items else landing.nav_label, "url": landing.slug})
            entries += [{"label": p.nav_label, "url": p.slug} for p in items]
            if entries:
                nav.append({"id": sid, "label": sec["label"], "items": entries})
        return nav

    def footer_columns(self, nav: list[dict]) -> list[dict]:
        return [{"label": s["label"], "items": s["items"][:7]} for s in nav]

    def breadcrumbs(self, page: Page, by_slug: dict[str, Page]) -> list[dict]:
        if page.is_home:
            return []
        crumbs = [{"label": "Home", "url": "/", "current": False}]
        segs = page.slug.strip("/").split("/")
        for i in range(1, len(segs)):
            slug = "/" + "/".join(segs[:i]) + "/"
            p = by_slug.get(slug)
            label = (p.nav_label if p else None) or self.site.get("section_labels", {}).get(segs[i - 1]) \
                or segs[i - 1].replace("-", " ").capitalize()
            crumbs.append({"label": label, "url": slug if p and not p.noindex else None, "current": False})
        crumbs.append({"label": page.nav_label or page.h1, "url": page.slug, "current": True})
        return crumbs

    # ------------------------------------------------------------------ tools
    def assessment_context(self) -> dict:
        tpl = self.assessment
        domains = sorted(tpl["domains"], key=lambda d: d["order"])
        questions = sorted(tpl["questions"], key=lambda q: q["order"])
        steps = [{"domain": d, "questions": [q for q in questions if q["domain"] == d["id"]]} for d in domains]
        referenced = []
        for q in tpl["questions"]:
            referenced += q["controls"]
        for f in tpl["critical_flags"]:
            referenced += f["controls"]
        unknown = sorted({c for c in referenced if c not in self.controls})
        if unknown:
            raise BuildError(f"assessment template cites unknown control IDs: {', '.join(unknown)}")
        bundle = {
            "template": tpl,
            "controls": {c: {"title": self.controls[c]["title"], "pillar": self.controls[c]["pillar"],
                             "priority": self.controls[c]["priority"], "mappings": self.controls[c]["mappings"]}
                         for c in sorted(set(referenced))},
            "control_library_version": self.controls_lib["library"]["version"],
            "standard_disclaimer": STANDARD_DISCLAIMER,
            "control_url_base": self.site["control_library"]["slug"],
        }
        profile_fields = []
        for f in tpl["profile_fields"]:
            ff = dict(f)
            if f["type"] == "select":
                labels = PROFILE_OPTION_LABELS.get(f["id"], {})
                ff["choices"] = [(o, labels.get(o, o)) for o in f["options"]]
            profile_fields.append(ff)
        return {"steps": steps, "scale": tpl["scale"], "profile_fields": profile_fields, "bundle": bundle,
                "total_steps": len(steps) + 1, "estimated_minutes": tpl["template"].get("estimated_minutes", 8)}

    def page_scripts(self, page: Page) -> list[str]:
        scripts = ["js/site.js", "js/analytics.js"]
        if page.template == "tool":
            scripts += TOOL_SCRIPTS.get(page.tool or "", [])
        return [self.asset_url(s) for s in scripts]

    def client_config(self) -> dict:
        dl = self.site.get("downloads", {}).get("blueprint", {})
        return {"api_base": self.site.get("api_base", "/api"),
                "free_mail_domains": self.site.get("free_mail_domains", []),
                "contact_email": self.site["organization"].get("email", ""),
                "privacy_url": self.site.get("privacy_url", "/legal/privacy/"),
                "demo_url": self.site["ctas"]["demo"]["url"],
                "baseline_url": self.site["ctas"]["baseline"]["url"],
                "blueprint_download": dl.get("path", "") if self.blueprint_available() else ""}

    # ------------------------------------------------------------------ render
    def render_page(self, page: Page, ctx_common: dict, by_slug: dict[str, Page]) -> str:
        self._cta_counter = 0
        faq_problems = [f"{page.source}: faq answer {i + 1}: {pr}" for i, f in enumerate(page.faq)
                        for pr in render_markdown(f["a"])[1]]
        if faq_problems:
            raise BuildError(faq_problems)
        body = Markup(self.render_body(page)) if page.body.strip() else Markup("")
        crumbs = [] if page.template == "404" else self.breadcrumbs(page, by_slug)
        jsonld = build_jsonld(page, self.site, crumbs if not page.noindex else [])
        title = page.title if "AEGIS" in page.title else f"{page.title} | AEGIS"
        canonical = absolute(self.site["site_url"], page.slug) if not page.noindex else None
        ctx = dict(ctx_common)
        ctx.update(page=page, body=body, breadcrumbs=crumbs, jsonld=Markup(safe_json(jsonld)),
                   page_title=title, canonical=canonical, scripts=self.page_scripts(page),
                   og_image=absolute(self.site["site_url"], self.site["default_og_image"]["path"]),
                   section_nav=next((s for s in ctx_common["nav"] if s["id"] == page.section), None),
                   end_ctas=[self.render_cta_markup(k, "end") for k in (page.primary_cta, page.secondary_cta) if k],
                   extra=page.extra, faq=page.faq)
        if page.template == "form":
            ctx["form_def"] = FORMS[page.form]
            ctx["form_key"] = page.form
        if page.template == "tool":
            if page.tool == "maturity-assessment":
                ctx["assessment"] = self.assessment_context()
            elif page.tool == "risk-triage":
                ctx["tool_fields"] = RISK_TRIAGE_FIELDS
            elif page.tool == "guardrail-generator":
                ctx["tool_fields"] = GUARDRAIL_FIELDS
            elif page.tool == "waitlist":
                ctx["form_def"] = FORMS["waitlist"]
                ctx["form_key"] = "waitlist"
        template = {"home": "home.html", "page": "page.html", "tool": "tool.html", "form": "form.html",
                    "controls_index": "controls_index.html", "control": "control.html", "404": "404.html"}[page.template]
        return self.env.get_template(template).render(**ctx)

    def render_cta_markup(self, key: str, variant: str) -> Markup:
        return Markup(self.render_cta(key, variant))

    # ------------------------------------------------------------------ output
    def _prepare_out(self) -> None:
        out = self.out
        if out.exists():
            if not (out / DIST_MARKER).exists() and any(out.iterdir()):
                raise BuildError(f"refusing to overwrite non-empty directory without {DIST_MARKER} marker: {out}")
            shutil.rmtree(out)
        out.mkdir(parents=True)
        (out / DIST_MARKER).write_text("Generated by app/website/build.py — do not edit; rebuilt on every build.\n")

    def _copy_static(self) -> None:
        shutil.copytree(paths.STATIC_DIR, self.out / "static",
                        ignore=shutil.ignore_patterns(".*", "__pycache__", "*.map"))
        downloads_src = paths.WEBSITE_DIR / "downloads"
        if downloads_src.is_dir():
            shutil.copytree(downloads_src, self.out / "downloads", ignore=shutil.ignore_patterns(".*"))
        dl = self.site.get("downloads", {}).get("blueprint", {})
        if dl.get("path"):
            target = self.out / dl["path"].lstrip("/")
            if not target.exists():
                for cand in dl.get("sources", []):
                    src = paths.REPO_ROOT / cand
                    if src.is_file():
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(src, target)
                        break
            if not target.exists():
                self.warnings.append(f"blueprint download {dl['path']} not found; blueprint form will confirm "
                                     "the request without a download link")

    def blueprint_available(self) -> bool:
        path = self.site.get("downloads", {}).get("blueprint", {}).get("path")
        return bool(path) and (self.out / path.lstrip("/")).is_file()

    def build(self) -> BuildResult:
        pages = load_pages(self.pages_dir)
        self.warnings = [w for p in pages for w in p.warnings]
        not_found = self.not_found_page(pages)
        pages = pages + self.generated_pages(pages)
        problems = duplicate_slug_problems(pages)
        if problems:
            raise BuildError(problems)
        by_slug = {p.slug: p for p in pages}
        nav = self.build_nav(pages)
        self._prepare_out()
        self._copy_static()
        ctx_common = {
            "site": self.site, "nav": nav, "footer_columns": self.footer_columns(nav),
            "disclaimer": STANDARD_DISCLAIMER, "year": self.build_date[:4], "build_date": self.build_date,
            "client_config": Markup(safe_json(self.client_config())), "forms": FORMS,
            "newsletter": FORMS["newsletter"],
            "blueprint_available": self.blueprint_available(),
        }
        problems = []
        for page in pages + [not_found]:
            try:
                html = self.render_page(page, ctx_common, by_slug)
            except BuildError as exc:
                problems.extend(exc.problems)
                continue
            target = self.out / ("404.html" if page is not_found else page.output_path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding="utf-8")
        if problems:
            raise BuildError(problems)
        (self.out / "sitemap.xml").write_text(sitemap_xml(self.site["site_url"], pages), encoding="utf-8")
        (self.out / "robots.txt").write_text(robots_txt(self.site["site_url"]), encoding="utf-8")
        result = BuildResult(out_dir=self.out, pages=pages, warnings=self.warnings)
        if self.run_checks:
            result.check = check_site(self.out, claim_checker=find_prohibited_claims)
            if result.check["errors"]:
                raise BuildError(["site check failed:"] + result.check["errors"])
        return result


def main(argv: list[str] | None = None) -> int:
    import argparse
    ap = argparse.ArgumentParser(description="Build the AEGIS static website")
    ap.add_argument("--pages", default=None, help="pages directory (default content/website_pages)")
    ap.add_argument("--out", default=None, help="output directory (default app/website/dist)")
    ap.add_argument("--site-url", default=None, help="override site_url from site.yaml")
    ap.add_argument("--no-check", action="store_true", help="skip the post-build quality gate")
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    try:
        res = SiteBuilder(a.pages, a.out, a.site_url, run_checks=not a.no_check).build()
    except BuildError as exc:
        print("BUILD FAILED:", file=sys.stderr)
        for p in exc.problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    if not a.quiet:
        for w in res.warnings:
            print(f"warning: {w}", file=sys.stderr)
        checked = res.check.get("pages", 0)
        print(f"Built {res.page_count} pages (+404) into {res.out_dir}"
              + (f"; checks passed on {checked} HTML files" if checked else "; checks skipped"))
    return 0
