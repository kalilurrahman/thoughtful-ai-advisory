#!/usr/bin/env python3
"""Content integrity checks + prohibited compliance-claim scan.

Checks
  1. Control library: unique IDs, valid pillars/domains, mapping keys.
  2. Self-assessment template: 24 questions, 8 domains, weights sum to 100, all control/question refs valid.
  3. Every VERITRAIL control ID referenced anywhere in content/, docs/ and app/ exists in the library.
  4. Website page front matter (if present): required keys, unique slugs.
  5. Policy packs validate against the policy schema (if veritrail_policy is present).
  6. Prohibited-claim scan of content/ and docs/ (negation- and instruction-aware).
Exit code 1 on any failure.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for d in sorted((ROOT / "app").iterdir()):
    if d.is_dir():
        sys.path.insert(0, str(d))

import yaml  # noqa: E402

from veritrail_common.content import controls_by_id, load_assessment_template  # noqa: E402
from veritrail_common.evidence import find_prohibited_claims  # noqa: E402

CTRL_RE = re.compile(r"\b(AO|EI|GL|IS|SE)-(\d{2})\b")
INSTRUCTIONAL = re.compile(r"never|must not|do not|don't|prohibit|avoid|banned|trap|refus|forbid|not allowed|"
                           r"no .{0,20}claim|claims? (like|such as)|e\.g\.|example of|should not|rather than|instead of|"
                           r"\"[^\"]*(compliant|certified|guarantee|regulator-approved)[^\"]*\"|"
                           r"'[^']*(compliant|certified|guarantee|regulator-approved)[^']*'|"
                           r"`[^`]*(compliant|certified|guarantee|regulator-approved)[^`]*`", re.IGNORECASE)
SKIP_DIRS = {"dist", "__pycache__", "node_modules", ".git", "fixtures"}


def files(base: Path, exts: tuple[str, ...]):
    for p in base.rglob("*"):
        if p.is_file() and p.suffix in exts and not (set(p.parts) & SKIP_DIRS):
            yield p


def main() -> int:
    errors: list[str] = []
    lib = controls_by_id()
    print(f"[1] control library: {len(lib)} controls")

    t = load_assessment_template()
    qids = {q["id"] for q in t["questions"]}
    if len(t["questions"]) != 24 or len(t["domains"]) != 8 or sum(d["weight"] for d in t["domains"]) != 100:
        errors.append("assessment template shape invalid")
    for g in (g for fw in t["readiness_groups"] for g in fw["groups"]):
        errors += [f"readiness group {g['id']} unknown question {q}" for q in g["questions"] if q not in qids]
    print(f"[2] self-assessment template: {len(t['questions'])} questions")

    n_refs = 0
    bad_refs: dict[str, set[str]] = {}
    for p in list(files(ROOT / "content", (".md", ".yaml", ".yml", ".csv", ".py"))) + \
            list(files(ROOT / "docs", (".md",))) + list(files(ROOT / "app", (".py", ".js", ".html", ".yaml"))):
        txt = p.read_text(encoding="utf-8", errors="ignore")
        for m in CTRL_RE.finditer(txt):
            n_refs += 1
            cid = m.group(0)
            if cid not in lib and not cid.endswith("-00") and not re.search(r"(XX|NN)-", cid):
                bad_refs.setdefault(cid, set()).add(str(p.relative_to(ROOT)))
    for cid, ps in sorted(bad_refs.items()):
        errors.append(f"unknown control ID {cid} in {', '.join(sorted(ps))}")
    print(f"[3] control references scanned: {n_refs}, unknown: {len(bad_refs)}")

    pages = sorted((ROOT / "content" / "website_pages").glob("*.md"))
    slugs: dict[str, str] = {}
    for p in pages:
        if p.name.lower() == "readme.md":
            continue
        txt = p.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", txt, re.DOTALL)
        if not m:
            errors.append(f"{p.name}: missing front matter")
            continue
        fm = yaml.safe_load(m.group(1)) or {}
        for k in ("title", "slug", "description", "section", "template"):
            if not fm.get(k):
                errors.append(f"{p.name}: front matter missing '{k}'")
        s = fm.get("slug")
        if s in slugs:
            errors.append(f"duplicate slug {s} in {p.name} and {slugs[s]}")
        slugs[s] = p.name
    print(f"[4] website pages: {len(slugs)}")

    packs = sorted((ROOT / "content" / "policy_packs").glob("*.y*ml"))
    try:
        from veritrail_policy.schema import validate_policy
        for p in packs:
            pol = yaml.safe_load(p.read_text(encoding="utf-8"))
            errs = validate_policy(pol)
            errors += [f"policy pack {p.name}: {e}" for e in errs]
        print(f"[5] policy packs validated: {len(packs)}")
    except ImportError:
        print("[5] policy packs: veritrail_policy not available — skipped")

    hits = []
    for p in list(files(ROOT / "content", (".md", ".yaml", ".yml"))) + list(files(ROOT / "docs", (".md",))) + \
            list(files(ROOT / "output", (".md",))):
        # scan paragraph blocks (wrapped lines joined) so multi-line disclaimers keep their negation context
        lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
        block, start = [], 1
        for i, line in enumerate(lines + [""], 1):
            if line.strip() and not line.strip().startswith(("|", "#", "- ", "* ")):
                if not block:
                    start = i
                block.append(line.strip().lstrip("> ").strip())
                continue
            chunks = [" ".join(block)] if block else []
            block = []
            if line.strip():
                chunks.append(line.strip())
            for chunk in chunks:
                for sent in re.split(r"(?<=[.!?])\s+", chunk):
                    if INSTRUCTIONAL.search(sent):
                        continue
                    for h in find_prohibited_claims(sent):
                        hits.append(f"{p.relative_to(ROOT)}:{start if chunk is not line.strip() else i}: {h[:140]}")
    errors += [f"prohibited claim: {h}" for h in hits]
    print(f"[6] prohibited-claim scan: {len(hits)} hit(s)")

    if errors:
        print("\nFAILURES:")
        for e in errors:
            print("  -", e)
        return 1
    print("\nAll content checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
