"""Parity: the browser engine (assessment-engine.js) must equal the Python reference engine field-for-field.

Runs node once over ~70 random and edge-case answer/profile sets and compares the full
score_assessment() and preliminary_result() outputs (JSON round-tripped), plus validation errors.
Also checks the offline Markdown report (assessment-report.js toMarkdown) against
veritrail_reports.maturity.render_maturity_markdown.
"""
from __future__ import annotations

import json
import random
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from veritrail_assessment.engine import AssessmentInputError, preliminary_result, score_assessment
from veritrail_common.content import load_assessment_template
from veritrail_website.builder import SiteBuilder
from veritrail_website.paths import FIXTURE_PAGES_DIR, STATIC_DIR

NODE = shutil.which("node")
pytestmark = pytest.mark.skipif(NODE is None, reason="node is not installed")

ENGINE_JS = STATIC_DIR / "js" / "assessment-engine.js"
REPORT_JS = STATIC_DIR / "js" / "assessment-report.js"

RUNNER = r"""
const fs = require('fs');
const E = require(process.argv[1]);
const R = require(process.argv[2]);
const d = JSON.parse(fs.readFileSync(0, 'utf8'));
const out = d.cases.map((c) => {
  try {
    const full = E.scoreAssessment(c.answers, c.profile, d.bundle);
    const prelim = E.preliminaryResult(c.answers, c.profile, d.bundle);
    const md = c.markdown ? R.toMarkdown(full, { bundle: d.bundle, company: c.markdown, generated: '2026-10-21' }) : null;
    return { ok: true, full, prelim, md };
  } catch (e) {
    return { ok: false, error: e.message, name: e.name };
  }
});
process.stdout.write(JSON.stringify(out));
"""

PROFILE_VALUES = {
    "industry": ["healthcare_pharma", "bfsi", "gcc_it_services", "saas_product", "public_sector", "other"],
    "org_size": ["<250", "250-1000", "1000-5000", "5000+"],
    "ai_systems": ["0-9", "10-24", "25-99", "100+", "unknown"],
    "uses_agents": [True, False, "yes", "no", "true", "Y", "0", 1, 0, None],
    "eu_operations": [True, False, "Yes", "false", "1", None],
}


@pytest.fixture(scope="module")
def bundle(tmp_path_factory):
    return SiteBuilder(FIXTURE_PAGES_DIR, tmp_path_factory.mktemp("out"), run_checks=False).assessment_context()["bundle"]


def _qids():
    return [q["id"] for q in load_assessment_template()["questions"]]


def _cases() -> list[dict]:
    qids = _qids()
    rnd = random.Random(20261021)
    cases: list[dict] = []

    def profile(**over):
        p = {k: rnd.choice(v) for k, v in PROFILE_VALUES.items()}
        p.update(over)
        return p

    # edge cases: all same value, boundaries, flags with/without profile conditions
    for v in range(1, 6):
        cases.append({"answers": {q: v for q in qids}, "profile": profile(uses_agents=True, eu_operations=True)})
        cases.append({"answers": {q: v for q in qids}, "profile": profile(uses_agents=False, eu_operations=False)})
    cases.append({"answers": {q: 2 for q in qids}, "profile": {}})                       # empty profile
    cases.append({"answers": {q: 3 for q in qids}, "profile": {"uses_agents": "yes", "eu_operations": "TRUE"}})
    cases.append({"answers": {q: "4" for q in qids}, "profile": profile()})               # string answers
    cases.append({"answers": {q: float(1 + i % 5) for i, q in enumerate(qids)}, "profile": profile()})  # 3.0 floats
    alt = {q: (1 if i % 2 else 5) for i, q in enumerate(qids)}
    cases.append({"answers": alt, "profile": profile(ai_systems="100+")})
    # level boundaries: search random answer sets whose overall lands on/near a boundary
    boundary_targets = {39.9, 40.0, 59.9, 60.0, 74.9, 75.0, 89.9, 90.0}
    found = set()
    for _ in range(20000):
        a = {q: rnd.randint(1, 5) for q in qids}
        s = preliminary_result(a)["overall_score"]
        if s in boundary_targets and s not in found:
            found.add(s)
            cases.append({"answers": a, "profile": profile()})
        if found == boundary_targets:
            break
    # single-question dips that trigger each critical flag
    for f in load_assessment_template()["critical_flags"]:
        a = {q: 4 for q in qids}
        a[f["when"]["question"]] = f["when"]["max_score"]
        prof = profile(**(f["when"].get("profile") or {}))
        cases.append({"answers": a, "profile": prof})
    # random fill to ~70+
    while len(cases) < 72:
        cases.append({"answers": {q: rnd.randint(1, 5) for q in qids}, "profile": profile()})
    return cases


def _run_node(cases, bundle):
    proc = subprocess.run([NODE, "-e", RUNNER, str(ENGINE_JS), str(REPORT_JS)],
                          input=json.dumps({"cases": cases, "bundle": bundle}),
                          capture_output=True, text=True, timeout=120)
    assert proc.returncode == 0, proc.stderr[-4000:]
    return json.loads(proc.stdout)


def _canon(obj):
    return json.loads(json.dumps(obj, ensure_ascii=False))


def test_engine_parity_full_result(bundle):
    cases = _cases()
    assert len(cases) >= 50
    results = _run_node(cases, bundle)
    mismatches = []
    for i, (case, js) in enumerate(zip(cases, results)):
        assert js["ok"], f"case {i} raised in JS: {js}"
        py_full = _canon(score_assessment(case["answers"], case["profile"]))
        py_pre = _canon(preliminary_result(case["answers"], case["profile"]))
        if py_full != js["full"]:
            diff = sorted(k for k in set(py_full) | set(js["full"]) if py_full.get(k) != js["full"].get(k))
            mismatches.append((i, "full", diff))
        if py_pre != js["prelim"]:
            mismatches.append((i, "preliminary", sorted(k for k in py_pre if py_pre[k] != js["prelim"].get(k))))
    assert not mismatches, mismatches[:5]


def test_engine_parity_covers_levels_flags_and_modules(bundle):
    """Sanity: the case set actually exercises every maturity level, every flag and every module."""
    cases = _cases()
    levels, flags, modules, tags = set(), set(), set(), set()
    for c in cases:
        r = score_assessment(c["answers"], c["profile"])
        levels.add(r["maturity_level"])
        flags |= {f["id"] for f in r["critical_flags"]}
        modules |= {m["module"] for m in r["recommended_modules"]}
        tags |= set(r["lead"]["tags"])
    tpl = load_assessment_template()
    assert levels == {lvl["name"] for lvl in tpl["scoring"]["levels"]}
    assert flags == {f["id"] for f in tpl["critical_flags"]}
    assert modules == {m["module"] for m in tpl["module_rules"]}
    assert tags == {t["tag"] for t in tpl["lead_rules"]}


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


def test_engine_parity_validation_errors(bundle):
    qids = _qids()
    cases = [{"answers": make(qids), "profile": {}} for _, make in BAD_INPUTS]
    results = _run_node(cases, bundle)
    for (label, _), case, js in zip(BAD_INPUTS, cases, results):
        with pytest.raises(AssessmentInputError) as exc:
            score_assessment(case["answers"], case["profile"])
        assert not js["ok"], f"{label}: JS accepted invalid input"
        assert js["name"] == "AssessmentInputError", label
        assert js["error"] == str(exc.value), label


def test_offline_markdown_matches_server_report(bundle):
    """The client-side Markdown download mirrors the server report section-for-section."""
    from veritrail_reports.maturity import render_maturity_markdown

    qids = _qids()
    rnd = random.Random(7)
    cases = []
    for i in range(6):
        cases.append({"answers": {q: rnd.randint(1, 5) for q in qids},
                      "profile": {"uses_agents": bool(i % 2), "eu_operations": True, "ai_systems": "25-99"},
                      "markdown": f"Example Org {i}"})
    results = _run_node(cases, bundle)
    for case, js in zip(cases, results):
        result = score_assessment(case["answers"], case["profile"])
        py_md = render_maturity_markdown(result, {"company": case["markdown"]}, generated="2026-10-21")
        js_md = js["md"]
        # the browser version states it was generated locally; otherwise identical
        js_md = js_md.replace(" (in your browser; not stored by VERITRAIL)", "")
        assert js_md == py_md
