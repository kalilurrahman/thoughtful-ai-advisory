#!/usr/bin/env python3
"""Build the deliverable bundle in /mnt/session/outputs (or --out DIR).

Produces:
  AEGIS_Platform_Repository.zip      full source repo (no var/, caches, .git)
  AEGIS_Website_Static_Site.zip      built static site (app/website/dist)
  AEGIS_Documentation_Pack.zip       docs/ + framework content + blueprint
  AEGIS_Architecture_Diagrams.zip    docs/diagrams (mmd/svg/png/pdf)
  AEGIS_Sample_Reports.zip           output/sample_reports (synthetic)
  AEGIS_Pilot_and_Commercial_Kit.zip content/pilots + content/commercial + industry packs + playbook/GTM docs
  plus top-level copies of the blueprint (md/pdf), STATUS report and the solution-architecture PNG.
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {"var", "__pycache__", ".pytest_cache", ".git", "node_modules"}
EXCLUDE_SUFFIX = {".pyc", ".tmp"}


def _iter(base: Path, include_dist: bool = True):
    for p in sorted(base.rglob("*")):
        rel = p.relative_to(ROOT)
        parts = set(rel.parts)
        if parts & EXCLUDE_DIRS or p.suffix in EXCLUDE_SUFFIX or not p.is_file():
            continue
        if not include_dist and "dist" in rel.parts:
            continue
        yield p


MASTER_README = """# AEGIS — master artefact bundle

- `repository/` — complete AEGIS repository: docs/ (13 required docs + diagrams), content/ (controls, templates,
  policy & industry packs, website pages, pilots, commercial kit), app/ (website incl. built dist/, agent,
  assessment-engine, policy-engine, runtime-shield, reports, admin, api), tests/, output/ (blueprint + synthetic samples).
  Start with repository/README.md and repository/STATUS.md.
- `deliverables/` — the individual zip bundles, Blueprint v3 (MD + PDF), status report and architecture diagrams.

Quick start: `cd repository && make install && make test && make serve` → http://127.0.0.1:8080

All sample outputs use fictional organizations and are labelled synthetic. AEGIS supports governance readiness and
evidence collection; it does not certify ISO/IEC 42001 conformity or guarantee EU AI Act compliance.
"""


def make_zip(out: Path, paths: list[Path], prefix: str, include_dist: bool = True) -> tuple[int, int]:
    n = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for base in paths:
            items = [base] if base.is_file() else list(_iter(base, include_dist))
            for p in items:
                z.write(p, f"{prefix}/{p.relative_to(ROOT)}")
                n += 1
    return n, out.stat().st_size


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="/mnt/session/outputs")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    bundles = {
        "AEGIS_Platform_Repository.zip": ([ROOT], "aegis"),
        "AEGIS_Website_Static_Site.zip": ([ROOT / "app" / "website" / "dist"], "aegis-site"),
        "AEGIS_Documentation_Pack.zip": ([ROOT / "docs", ROOT / "content" / "aegis_framework.md", ROOT / "content" / "pillars.md",
                                          ROOT / "content" / "maturity_model.md", ROOT / "content" / "controls",
                                          ROOT / "content" / "assessment_templates", ROOT / "README.md", ROOT / "STATUS.md",
                                          ROOT / "output" / "AEGIS_Launch_and_Enhancement_Blueprint_v3.md",
                                          ROOT / "output" / "AEGIS_Enterprise_Blueprint.pdf"], "aegis-docs"),
        "AEGIS_Architecture_Diagrams.zip": ([ROOT / "docs" / "diagrams"], "aegis-diagrams"),
        "AEGIS_Sample_Reports.zip": ([ROOT / "output" / "sample_reports"], "aegis-samples"),
        "AEGIS_Pilot_and_Commercial_Kit.zip": ([ROOT / "content" / "pilots", ROOT / "content" / "commercial",
                                                ROOT / "content" / "industry_packs", ROOT / "content" / "policy_packs",
                                                ROOT / "docs" / "PILOT_PLAYBOOK.md", ROOT / "docs" / "GTM_PLAN.md"], "aegis-gtm-kit"),
    }
    lines = ["# AEGIS deliverables manifest", "", "| File | Entries | Size (KB) | SHA-256 |", "|---|---|---|---|"]
    for name, (paths, prefix) in bundles.items():
        paths = [p for p in paths if p.exists()]
        n, size = make_zip(out / name, paths, prefix)
        lines.append(f"| {name} | {n} | {size // 1024} | `{sha256(out / name)[:16]}…` |")
        print(f"{name}: {n} files, {size // 1024} KB")

    for src in [ROOT / "output" / "AEGIS_Launch_and_Enhancement_Blueprint_v3.md", ROOT / "output" / "AEGIS_Enterprise_Blueprint.pdf",
                ROOT / "STATUS.md", ROOT / "docs" / "diagrams" / "01_solution_architecture.png",
                ROOT / "docs" / "diagrams" / "02_technical_architecture.png"]:
        if src.exists():
            dst = out / ("AEGIS_STATUS_REPORT.md" if src.name == "STATUS.md" else src.name)
            shutil.copy2(src, dst)
            lines.append(f"| {dst.name} | 1 | {dst.stat().st_size // 1024} | `{sha256(dst)[:16]}…` |")
    # Master bundle: the complete repository (source, docs, diagrams, content, tests, built site, samples)
    # plus the top-level deliverables and every individual bundle, in one archive.
    master = out / "AEGIS_MASTER_ALL_ARTEFACTS.zip"
    n_master = 0
    with zipfile.ZipFile(master, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in _iter(ROOT):
            z.write(p, f"AEGIS_MASTER/repository/{p.relative_to(ROOT)}")
            n_master += 1
        for f in sorted(out.iterdir()):
            if f.is_file() and f.name != master.name and f.name != "MANIFEST.md":
                z.write(f, f"AEGIS_MASTER/deliverables/{f.name}")
                n_master += 1
        z.writestr("AEGIS_MASTER/README.md", MASTER_README)
        n_master += 1
    lines.append(f"| {master.name} | {n_master} | {master.stat().st_size // 1024} | `{sha256(master)[:16]}…` |")
    print(f"{master.name}: {n_master} files, {master.stat().st_size // 1024} KB")
    (out / "MANIFEST.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("manifest:", out / "MANIFEST.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
