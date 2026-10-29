"""Self-check for content/website_pages/*.md (web-content workstream)."""
from __future__ import annotations

import datetime
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "app/common"), str(ROOT / "app/website")]
from veritrail_common.evidence import find_prohibited_claims  # noqa: E402

PAGES = ROOT / "content/website_pages"
controls = {c["id"] for c in yaml.safe_load((ROOT / "content/controls/controls.yaml").read_text())["controls"]}
FM = re.compile(r"\A---[ \t]*\n(.*?)\n---[ \t]*\n", re.S)
REQ = ["title", "slug", "description", "section", "nav_label", "nav_order", "template", "schema_type", "updated"]
CTA = {"assessment", "baseline", "agent", "blueprint", "demo", "guardrails"}
GENERATED = {"/framework/controls/"}
LAUNCH = datetime.date(2026, 10, 21)

errors, warnings, rows = [], [], []
pages = {}
for f in sorted(PAGES.glob("*.md")):
    if f.name == "README.md":
        continue
    text = f.read_text()
    m = FM.match(text)
    if not m:
        errors.append(f"{f.name}: no front matter"); continue
    meta = yaml.safe_load(m.group(1)); body = text[m.end():]
    pages[f.name] = (meta, body)
    for k in REQ:
        if k not in meta:
            errors.append(f"{f.name}: missing {k}")
    # A real revision date: no earlier than the launch build, never in the future.
    try:
        updated = datetime.date.fromisoformat(str(meta.get("updated")))
    except ValueError:
        updated = None
    if updated is None or not LAUNCH <= updated <= datetime.date.today():
        errors.append(f"{f.name}: updated={meta.get('updated')}")
    slug = meta["slug"]
    expected = "index.md" if slug == "/" else slug.strip("/").replace("/", "-") + ".md"
    if f.name != expected:
        errors.append(f"{f.name}: filename should be {expected}")
    d = meta["description"]
    if not 120 <= len(d) <= 160:
        errors.append(f"{f.name}: description {len(d)} chars")
    for k in ("primary_cta", "secondary_cta"):
        if meta.get(k) and meta[k] not in CTA:
            errors.append(f"{f.name}: bad {k}")
    if meta["template"] == "tool" and not meta.get("tool"):
        errors.append(f"{f.name}: tool missing")
    if meta["template"] == "form" and not meta.get("form"):
        errors.append(f"{f.name}: form missing")
    for key in re.findall(r"\{\{cta:([a-z]+)\}\}", body):
        if key not in CTA:
            errors.append(f"{f.name}: bad cta shortcode {key}")
    for sc in re.findall(r"\{\{([^}]*)\}\}", body):
        if not (sc == "disclaimer" or sc.startswith("cta:") or sc.startswith("controls:")):
            errors.append(f"{f.name}: unknown shortcode {sc}")
    for grp in re.findall(r"\{\{controls:([^}]*)\}\}", body):
        for cid in grp.split(","):
            if cid.strip() not in controls:
                errors.append(f"{f.name}: unknown control in shortcode {cid}")
    all_text = m.group(1) + body
    for cid in re.findall(r"\b(?:AO|EI|GL|IS|SE)-\d{2}\b", all_text):
        if cid not in controls:
            errors.append(f"{f.name}: unknown control ID {cid}")
    for claim in find_prohibited_claims(body) + [c for faq in meta.get("faq") or [] for c in find_prohibited_claims(faq["a"] + " " + faq["q"])]:
        errors.append(f"{f.name}: prohibited claim: {claim[:140]}")
    words = len(re.findall(r"[A-Za-z0-9][\w'’/-]*", re.sub(r"\{\{[^}]*\}\}", "", body)))
    rows.append((f.name, slug, meta["section"], meta["template"], words, len(meta.get("faq") or [])))

slugs = [p[0]["slug"] for p in pages.values()]
dups = {s for s in slugs if slugs.count(s) > 1}
if dups:
    errors.append(f"duplicate slugs: {dups}")
valid = set(slugs) | GENERATED
for name, (meta, body) in pages.items():
    for link in re.findall(r"\]\((/[^)\s#]*)(?:#[^)]*)?\)", body):
        if link not in valid:
            errors.append(f"{name}: broken internal link {link}")
    for link in re.findall(r"\]\((https?://[^)]*)\)", body):
        warnings.append(f"{name}: external link {link}")
    if meta["template"] in ("page", "home") and "{{cta:" not in body and meta["section"] != "legal":
        warnings.append(f"{name}: no CTA shortcode in body")

# generator loader (if present)
try:
    from veritrail_website.pages import load_pages
    import tempfile, shutil
    with tempfile.TemporaryDirectory() as td:
        for f in PAGES.glob("*.md"):
            if f.name != "README.md":
                shutil.copy(f, td)
        loaded = load_pages(Path(td))
        for p in loaded:
            warnings.extend(p.warnings)
        print(f"generator load_pages OK: {len(loaded)} pages")
except ImportError as exc:
    print("generator loader not importable:", exc)

if "-v" in sys.argv:
    for r in rows:
        print("%-62s %-58s %-11s %-5s %5d faq=%d" % r)
w = [r[4] for r in rows]
print(f"pages={len(rows)} total_words={sum(w)} min={min(w)} max={max(w)}")
for x in warnings:
    print("WARN", x)
for e in errors:
    print("ERROR", e)
print("errors:", len(errors))
sys.exit(1 if errors else 0)
