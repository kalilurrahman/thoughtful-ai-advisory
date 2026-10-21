# AEGIS website (`app/website/`)

Static site generator, templates, CSS and browser JavaScript for the public AEGIS site. Pages come
from `content/website_pages/*.md` (front matter: CONTRIBUTING.md §4). This directory only contains
engineering; page copy is owned by the web-content workstream.

## Build

```bash
python3 app/website/build.py                       # content/website_pages -> app/website/dist (runs checks)
python3 app/website/build.py --site-url https://www.example.com
python3 app/website/build.py --pages tests/fixtures/website_pages --out /tmp/site
python3 -m aegis_api.server --port 8080            # serves dist/ + /api (PYTHONPATH=$(ls -d app/*/ | tr '\n' ':'))
```

`site_url` in `site.yaml` is a **placeholder** (`https://www.aegis-governance.example`, a reserved
domain). Set the production origin before deploying: canonical URLs, Open Graph, JSON-LD, sitemap and
robots are all derived from it.

The build fails (exit 1, all problems listed) on: invalid front matter, duplicate slugs, unknown
shortcodes, unknown CTA keys, unknown control IDs in `{{controls:…}}`, `javascript:`/`data:` links,
and any site-check error (below). Warnings (unknown keys, short descriptions, missing blueprint PDF)
don't fail the build.

## Layout

| Path | Purpose |
|---|---|
| `build.py` | CLI entry point (`make site`) |
| `site.yaml` | site URL, nav sections, CTAs, footer, free-mail list, downloads |
| `aegis_website/builder.py` | pipeline: pages → shortcodes → safe Markdown → Jinja2 → assets → SEO → checks |
| `aegis_website/pages.py` | front-matter parsing/validation (skips `README.md` and `_*.md`) |
| `aegis_website/shortcodes.py` | `{{cta:key}}`, `{{disclaimer}}`, `{{controls:ID,ID}}` |
| `aegis_website/markdown_render.py` | Markdown with raw HTML **escaped**, URL scheme allow-list, h1 demotion, table regions |
| `aegis_website/seo.py` | JSON-LD (`@graph`), `safe_json`, sitemap.xml, robots.txt |
| `aegis_website/checks.py` | post-build quality gate |
| `aegis_website/ogimage.py` | pure-Python PNG rasterizer for `og-default.png` / `aegis-logo.png` (`python3 -m aegis_website.ogimage`) |
| `aegis_website/forms.py`, `tools.py` | lead-form and tool field definitions (API field names) |
| `templates/` | `base`, `home`, `page`, `tool`, `form`, `controls_index`, `control`, `404` + partials |
| `static/css/` | `aegis.css` (mobile-first, system fonts), `print.css` (report "Save as PDF") |
| `static/js/` | see below; every file is plain ES5, no dependencies, deferred, Node-exportable where testable |

Generated pages: `/framework/controls/` (all 64 controls by pillar) and one page per control
(`/framework/controls/is-11/` …) from `content/controls/controls.yaml`, plus `404.html`.

## Browser JavaScript

| File | Loaded on | Role |
|---|---|---|
| `site.js` | all pages | nav disclosure/mobile toggle, lead forms → `POST /api/contact`, shared helpers (`AEGIS`) |
| `analytics.js` | all pages | cookieless `{name, path, props}` → `/api/events` via `sendBeacon`; off under DNT/GPC |
| `assessment-engine.js` | maturity tool | scoring — field-for-field parity with `aegis_assessment.engine` |
| `assessment-report.js` | maturity tool | DOM report renderer + Markdown export (mirrors `aegis_reports.maturity`) |
| `assessment-ui.js` | maturity tool | profile → 8 steps → preliminary → email gate → `/api/leads` → report or offline fallback |
| `tools-common.js` | other tools | safe DOM/Markdown helpers |
| `guardrail.js`, `risk-triage.js`, `ask-aegis.js` | their tool pages | `/api/shield/advise`, `/api/risk-tier`, `/api/agent/message` |

The assessment template, cited controls and standard disclaimer are embedded at build time as
`<script type="application/json" id="aegis-assessment-data">`. All untrusted text is inserted with
`textContent`; no `innerHTML`, `eval`, inline scripts, inline styles or event-handler attributes,
so pages work under the API's CSP (`script-src 'self'; style-src 'self'`).

**API absent (pure static hosting):** the maturity tool renders the detailed report in the browser,
offers Markdown download and print-to-PDF, and says that nothing was saved or emailed. Forms and the
other tools say the service could not be reached, that nothing was sent or stored, and link to the
demo request page. Free-mail domains are rejected client-side (the API enforces its own list; a test
keeps both lists equal).

## Site checks (`checks.py`)

Missing/empty `<title>` or meta description, missing or multiple `h1`, images without `alt`, form
controls without labels, duplicate IDs, broken internal links and `#fragments`, missing local assets,
external scripts/styles/fonts, non-deferred scripts, inline executable scripts/styles/handlers,
invalid JSON-LD, missing `lang`/landmarks/skip link, and prohibited compliance claims
(`aegis_common.evidence.find_prohibited_claims`).

## Tests

```bash
python3 -m pytest tests/unit/test_website_*.py tests/integration/test_website_*.py tests/security/test_website_*.py -q
node --test tests/unit/js/*.test.js   # also run (with the template bundle) via tests/unit/test_website_js.py
```

## Known limitations

- Accessibility is checked statically (contrast of the palette, labels, landmarks, focus styles,
  reduced motion); it has not had a screen-reader or a manual WCAG audit.
- The interactive flows were exercised in headless Chromium during development. Browser automation
  isn't an allowed test dependency, so the UI scripts (`assessment-ui.js`, tool scripts) have no
  automated tests. Their logic modules (engine, report, site helpers, analytics, tools-common) do.
- Newsletter signup records consent but has no double opt-in. That belongs in the ESP integration.
- Client-side free-mail filtering is a convenience, not a control. The API decides.
