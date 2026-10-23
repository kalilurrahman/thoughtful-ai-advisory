"""Export parity fixtures for the React port of the maturity self-assessment engine.

Runs the Python REFERENCE engine (app/assessment-engine/veritrail_assessment/engine.py) over a
deterministic set of answer/profile cases and writes inputs + expected outputs to
src/test/fixtures/assessment-parity.json, which src/test/site-assessment-engine.test.ts
asserts against. Also records:

* the bundle the static site builder embeds (SiteBuilder.assessment_context()["bundle"]),
  so the TS buildAssessmentBundle() can be checked field-for-field;
* validation-error messages for invalid inputs;
* the offline Markdown report produced by the original browser script
  (static/js/assessment-report.js toMarkdown, run with node) for a few cases.

Usage (from the repository root):  python3 platform/scripts/export_assessment_parity_fixtures.py
"""
from __future__ import annotations

import json
import random
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

PLATFORM = Path(__file__).resolve().parents[1]
REPO = PLATFORM.parent
for d in sorted((PLATFORM / "app").iterdir()):
    if d.is_dir() and str(d) not in sys.path:
        sys.path.insert(0, str(d))

from veritrail_assessment.engine import AssessmentInputError, preliminary_result, score_assessment  # noqa: E402
from veritrail_common.content import load_assessment_template  # noqa: E402
from veritrail_website.builder import SiteBuilder  # noqa: E402
from veritrail_website.paths import FIXTURE_PAGES_DIR, STATIC_DIR  # noqa: E402

OUT = REPO / "src" / "test" / "fixtures" / "assessment-parity.json"
GENERATED = "2026-10-21"

PROFILE_VALUES = {
    "industry": ["healthcare_pharma", "bfsi", "gcc_it_services", "saas_product", "public_sector", "other"],
    "org_size": ["<250", "250-1000", "1000-5000", "5000+"],
    "ai_systems": ["0-9", "10-24", "25-99", "100+", "unknown"],
    "uses_agents": [True, False, "yes", "no", "true", "Y", "0", 1, 0, None],
    "eu_operations": [True, False, "Yes", "false", "1", None],
}

NODE_RUNNER = r"""
const fs = require('fs');
const E = require(process.argv[1]);
const R = require(process.argv[2]);
const d = JSON.parse(fs.readFileSync(0, 'utf8'));
const out = d.cases.map((c) => {
  const full = E.scoreAssessment(c.answers, c.profile, d.bundle);
  return R.toMarkdown(full, { bundle: d.bundle, company: c.company, generated: d.generated });
});
process.stdout.write(JSON.stringify(out));
"""


def _canon(obj):
    return json.loads(json.dumps(obj, ensure_ascii=False))


def build_cases(qids: list[str]) -> list[dict]:
    rnd = random.Random(20261021)
    cases: list[dict] = []

    def profile(**over):
        p = {k: rnd.choice(v) for k, v in PROFILE_VALUES.items()}
        p.update(over)
        return p

    cases.append({"label": "all 1s", "answers": {q: 1 for q in qids},
                  "profile": profile(uses_agents=True, eu_operations=True)})
    cases.append({"label": "all 5s", "answers": {q: 5 for q in qids},
                  "profile": profile(uses_agents=False, eu_operations=False)})
    cases.append({"label": "all 3s, string booleans", "answers": {q: 3 for q in qids},
                  "profile": {"uses_agents": "yes", "eu_operations": "TRUE"}})
    cases.append({"label": "all 2s, empty profile", "answers": {q: 2 for q in qids}, "profile": {}})
    cases.append({"label": "string answers", "answers": {q: "4" for q in qids}, "profile": profile()})
    cases.append({"label": "alternating 1/5", "answers": {q: (1 if i % 2 else 5) for i, q in enumerate(qids)},
                  "profile": profile(ai_systems="100+")})
    # level boundaries: random answer sets whose overall lands exactly on a boundary
    targets = [39.9, 40.0, 59.9, 60.0, 74.9, 75.0, 89.9, 90.0]
    found: set[float] = set()
    for _ in range(50000):
        a = {q: rnd.randint(1, 5) for q in qids}
        s = preliminary_result(a)["overall_score"]
        if s in targets and s not in found:
            found.add(s)
            cases.append({"label": f"boundary {s}", "answers": a, "profile": profile()})
        if len(found) == len(targets):
            break
    # single-question dips that trigger each critical flag (with its profile condition)
    for f in load_assessment_template()["critical_flags"]:
        a = {q: 4 for q in qids}
        a[f["when"]["question"]] = f["when"]["max_score"]
        cases.append({"label": f"flag {f['id']}", "answers": a,
                      "profile": profile(**(f["when"].get("profile") or {}))})
    while len(cases) < 30:
        cases.append({"label": f"random {len(cases)}", "answers": {q: rnd.randint(1, 5) for q in qids},
                      "profile": profile()})
    return cases


BAD_INPUTS = [
    ("missing", lambda q: {k: 3 for k in q[:-1]}),
    ("unknown", lambda q: {**{k: 3 for k in q}, "XYZ-Q9": 3}),
    ("bool", lambda q: {**{k: 3 for k in q}, q[0]: True}),
    ("zero", lambda q: {**{k: 3 for k in q}, q[1]: 0}),
    ("six", lambda q: {**{k: 3 for k in q}, q[2]: 6}),
    ("fraction", lambda q: {**{k: 3 for k in q}, q[3]: 2.5}),
    ("leading-zero", lambda q: {**{k: 3 for k in q}, q[4]: "03"}),
    ("text", lambda q: {**{k: 3 for k in q}, q[5]: "three"}),
    ("null", lambda q: {**{k: 3 for k in q}, q[6]: None}),
    ("list", lambda q: {**{k: 3 for k in q}, q[7]: [3]}),
]


def main() -> int:
    tpl = load_assessment_template()
    qids = [q["id"] for q in tpl["questions"]]
    with tempfile.TemporaryDirectory() as tmp:
        bundle = SiteBuilder(FIXTURE_PAGES_DIR, Path(tmp), run_checks=False).assessment_context()["bundle"]

    cases = []
    for c in build_cases(qids):
        cases.append({
            **c,
            "expected_full": _canon(score_assessment(c["answers"], c["profile"])),
            "expected_preliminary": _canon(preliminary_result(c["answers"], c["profile"])),
        })

    errors = []
    for label, make in BAD_INPUTS:
        answers = make(qids)
        try:
            score_assessment(answers, {})
        except AssessmentInputError as exc:
            errors.append({"label": label, "answers": answers, "error": str(exc)})
        else:  # pragma: no cover - reference engine contract
            raise SystemExit(f"{label}: reference engine accepted invalid input")

    markdown = []
    node = shutil.which("node")
    if node:
        md_cases = [{"case": i, "company": f"Example Org {i}"} for i in (0, 1, 8, len(cases) - 1)]
        payload = {"generated": GENERATED, "bundle": bundle,
                   "cases": [{"answers": cases[m["case"]]["answers"], "profile": cases[m["case"]]["profile"],
                              "company": m["company"]} for m in md_cases]}
        # The repo root package.json is "type": "module", so copy the UMD scripts to .cjs files
        # before requiring them.
        with tempfile.TemporaryDirectory() as tmp:
            engine_js = Path(tmp) / "assessment-engine.cjs"
            report_js = Path(tmp) / "assessment-report.cjs"
            shutil.copyfile(STATIC_DIR / "js" / "assessment-engine.js", engine_js)
            shutil.copyfile(STATIC_DIR / "js" / "assessment-report.js", report_js)
            proc = subprocess.run([node, "-e", NODE_RUNNER, str(engine_js), str(report_js)],
                                  input=json.dumps(payload), capture_output=True, text=True,
                                  timeout=120, check=True)
        for m, md in zip(md_cases, json.loads(proc.stdout)):
            markdown.append({**m, "generated": GENERATED, "markdown": md})
    else:
        print("warning: node not found; Markdown fixtures skipped", file=sys.stderr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "_comment": "Generated by platform/scripts/export_assessment_parity_fixtures.py — do not edit.",
        "bundle": _canon(bundle),
        "cases": cases,
        "validation_errors": errors,
        "markdown": markdown,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)}: {len(cases)} cases, {len(errors)} error cases, "
          f"{len(markdown)} markdown cases")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
