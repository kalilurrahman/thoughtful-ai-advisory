"""Export parity fixtures for the TypeScript ports of assorted platform modules.

Runs the Python REFERENCE implementations and writes inputs + expected outputs to
src/test/fixtures/platform-misc-parity.json, which src/test/platform-misc.test.ts (and
src/test/platform-content-checks.test.ts) assert against:

* roi            — content/commercial/roi_calculator.py: calculate(), to_markdown(), to_csv(),
                   scenarios() and the CLI --scenarios table, plus rejected inputs;
* funnel         — app/admin/veritrail_admin/cli.py funnel() + `analytics funnel` output over a
                   synthetic events.jsonl written through VeritrailApp.event (server validation);
* events         — VeritrailApp.event() storage normalisation (allow-list, path, props);
* leads          — score_assessment()["lead"] tags/labels, is_business_email(), the HubSpot
                   payload, and the CLI `leads list` / `leads export` / `forms list` output;
* audit          — `audit verify` output lines for an intact and a tampered log;
* maturity       — veritrail_reports.maturity.render_maturity_markdown();
* content_checks — check_content.py steps over the files bundled into the website and
                   check_website_pages.py -v output.

Usage (from the repository root):  python3 platform/scripts/export_platform_misc_parity_fixtures.py
"""
from __future__ import annotations

import contextlib
import csv
import importlib.util
import io
import json
import os
import re
import subprocess
import sys
import tempfile
from dataclasses import asdict, replace
from pathlib import Path

PLATFORM = Path(__file__).resolve().parents[1]
REPO = PLATFORM.parent
for d in sorted((PLATFORM / "app").iterdir()):
    if d.is_dir() and str(d) not in sys.path:
        sys.path.insert(0, str(d))

import yaml  # noqa: E402

from veritrail_admin import cli as admin_cli  # noqa: E402
from veritrail_api import integrations as integ  # noqa: E402
from veritrail_api.server import VeritrailApp  # noqa: E402
from veritrail_assessment.engine import score_assessment  # noqa: E402
from veritrail_common.audit import AuditLog  # noqa: E402
from veritrail_common.content import controls_by_id, load_assessment_template  # noqa: E402
from veritrail_common.evidence import find_prohibited_claims  # noqa: E402
from veritrail_policy.schema import validate_policy  # noqa: E402
from veritrail_reports.maturity import render_maturity_markdown  # noqa: E402

OUT = REPO / "src" / "test" / "fixtures" / "platform-misc-parity.json"

sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location("veritrail_roi_calculator",
                                               PLATFORM / "content" / "commercial" / "roi_calculator.py")
roi = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = roi
_spec.loader.exec_module(roi)


def _stdout(fn, *a, **kw) -> tuple[object, str]:
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc = fn(*a, **kw)
    return rc, buf.getvalue()


# --------------------------------------------------------------------------- ROI
def roi_cases() -> dict:
    ex = roi.EXAMPLE_INPUTS
    cases = [
        ("example", ex),
        ("minimal_defaults", roi.ROIInputs(ai_systems=10, assessment_hours_per_system=8, hourly_cost=80)),
        ("zero_benefit", roi.ROIInputs(ai_systems=0, assessment_hours_per_system=0, hourly_cost=0,
                                       veritrail_annual_cost=10_000)),
        ("fractional", replace(ex, assessment_hours_per_system=17.5, hourly_cost=112.25, approval_cycle_days=33,
                               annual_incident_probability=0.07, expected_incident_cost=1_234_567,
                               audit_prep_reduction=0.35, realization_rate=0.6)),
        ("no_time_to_value", replace(ex, delay_cost_per_day=0)),
        ("high_hypotheses", replace(ex, audit_prep_reduction=0.8, assessment_effort_reduction=0.7)),
        ("tiny_values", replace(ex, ai_systems=3, assessment_hours_per_system=1.25, hourly_cost=33.33,
                                audit_prep_hours_per_year=7, new_use_cases_per_year=1, delay_cost_per_day=12.5,
                                veritrail_annual_cost=999, implementation_cost=1)),
    ]
    out = []
    for cid, inp in cases:
        d = asdict(inp)
        res = roi.calculate(inp)
        sc = roi.scenarios(inp)
        out.append({
            "id": cid,
            "inputs": d,
            # integer-valued Python floats (printed as "24.0")
            "float_keys": [k for k, v in d.items() if isinstance(v, float) and v.is_integer()],
            "result": res,
            "markdown": roi.to_markdown(res),
            "csv": roi.to_csv(res),
            "scenarios": {k: v["summary"] for k, v in sc.items()},
            "scenario_inputs": {k: v["inputs"] for k, v in sc.items()},
        })
    _, scen_md = _stdout(roi.main, ["--example", "--scenarios"])
    invalid = []
    for field, value in [("ai_systems", -1), ("hourly_cost", -5), ("assessment_effort_reduction", 1.2),
                         ("annual_incident_probability", 1.5), ("realization_rate", -0.1)]:
        try:
            roi.calculate(replace(ex, **{field: value}))
            msg = None
        except ValueError as e:
            msg = str(e)
        invalid.append({"field": field, "value": value, "error": msg})
    return {"cases": out, "example_scenarios_markdown": scen_md, "invalid": invalid,
            "worked_example_csv": (PLATFORM / "content" / "commercial" / "roi_worked_example.csv").read_text("utf-8")}


# --------------------------------------------------------------------------- analytics
RAW_EVENTS = [
    {"name": "page_view", "path": "/", "props": {}},
    {"name": "page_view", "path": "/tools/maturity-assessment/?utm=x", "props": {}},
    {"name": "page_view", "path": "/framework/", "props": {"ref": "nav"}},
    {"name": "page_view", "path": "/pricing/", "props": {}},
    {"name": "assessment_start", "path": "/tools/maturity-assessment/", "props": {}},
    {"name": "assessment_start", "path": "/tools/maturity-assessment/", "props": {}},
    {"name": "assessment_step", "path": "/tools/maturity-assessment/", "props": {"step": 2}},
    {"name": "assessment_preliminary", "path": "/tools/maturity-assessment/", "props": {"level": "Developing"}},
    {"name": "assessment_gate_view", "path": "/tools/maturity-assessment/", "props": {}},
    {"name": "assessment_report_download", "path": "/tools/maturity-assessment/",
     "props": {"format": "md", "mode": "local", "ok": True, "ratio": 1.5}},
    {"name": "cta_click", "path": "/", "props": {"cta": "baseline"}},
    {"name": "cta_click", "path": "/", "props": {"cta": "assessment"}},
    {"name": "cta_click", "path": "/framework/", "props": {"cta": "baseline"}},
    {"name": "outbound_click", "path": "/", "props": {"host": "example.org", "user_email": "a@b.co",
                                                      "nested": {"x": 1}, "  padded  ": "  v  "}},
    {"name": "not_allowed", "path": "/", "props": {}},
    {"name": "tool_use", "path": "/tools/risk-triage/", "props": {f"k{i}": i for i in range(14)}},
    {"name": " page_view ", "path": "/x\x07y", "props": {"long": "z" * 300}},
]


def analytics_fixture() -> dict:
    with tempfile.TemporaryDirectory() as td:
        os.environ.pop("VERITRAIL_VAR_DIR", None)
        app = VeritrailApp(var_dir=td, site_dir=td)
        statuses = []
        for ev in RAW_EVENTS:
            st, _h, body = app.handle("POST", "/api/events", {"Content-Type": "text/plain"},
                                      json.dumps(ev).encode(), client="fixture")
            statuses.append({"status": st, "body": body.decode() or None})
        stored = [json.loads(x) for x in (Path(td) / "analytics" / "events.jsonl").read_text().splitlines()]
        for s in stored:
            s.pop("ts", None)
        f = admin_cli.funnel(Path(td))
        _, text = _stdout(admin_cli.cmd_analytics_funnel, type("A", (), {"var_dir": td})())
    empty = admin_cli.funnel(Path(tempfile.mkdtemp()))
    return {"raw": RAW_EVENTS, "responses": statuses, "stored": stored, "funnel": f, "funnel_text": text,
            "empty_funnel": empty}


def funnel_cases() -> list[dict]:
    """Funnel over synthetic stored-event lists (including zero steps and rounding ties)."""
    cases = []
    specs = {
        "drop_off": {"page_view": 400, "assessment_start": 1, "assessment_preliminary": 1,
                     "assessment_gate_view": 0, "assessment_lead_submitted": 3, "assessment_report_download": 2},
        "thirds": {"page_view": 3, "assessment_start": 1, "assessment_preliminary": 1,
                   "assessment_gate_view": 1, "assessment_lead_submitted": 0, "assessment_report_download": 0},
        "ties": {"page_view": 8, "assessment_start": 6, "assessment_preliminary": 5, "assessment_gate_view": 2,
                 "assessment_lead_submitted": 1, "assessment_report_download": 1},
        "no_page_views": {"assessment_start": 7, "assessment_preliminary": 3},
    }
    for cid, counts in specs.items():
        events = [{"name": n, "path": "/", "props": {}} for n, c in counts.items() for _ in range(c)]
        events.append({"name": "cta_click", "path": "/", "props": {"cta": "demo"}})
        with tempfile.TemporaryDirectory() as td:
            (Path(td) / "analytics").mkdir()
            (Path(td) / "analytics" / "events.jsonl").write_text("".join(json.dumps(e) + "\n" for e in events))
            f = admin_cli.funnel(Path(td))
            _, text = _stdout(admin_cli.cmd_analytics_funnel, type("A", (), {"var_dir": td})())
        cases.append({"id": cid, "events": events, "funnel": f, "text": text})
    return cases


# --------------------------------------------------------------------------- leads
def lead_fixture() -> dict:
    tpl = load_assessment_template()
    qids = [q["id"] for q in tpl["questions"]]
    profiles = [
        {"industry": "bfsi", "org_size": "5000+", "ai_systems": "25-99", "uses_agents": True, "eu_operations": True},
        {"industry": "saas_product", "org_size": "250-1000", "ai_systems": "0-9", "uses_agents": False,
         "eu_operations": False},
        {"industry": "other", "org_size": "<250", "ai_systems": "unknown", "uses_agents": True,
         "eu_operations": False},
        {"industry": "public_sector", "org_size": "1000-5000", "ai_systems": "100+", "uses_agents": False,
         "eu_operations": True},
    ]
    answer_sets = [
        {q: 2 for q in qids},
        {q: 4 for q in qids},
        {q: (i % 5) + 1 for i, q in enumerate(qids)},
        {**{q: 5 for q in qids}, "INV-Q1": 1, "ASR-Q1": 1},
    ]
    qualify = []
    for i, (p, a) in enumerate(zip(profiles, answer_sets)):
        r = score_assessment(a, p)
        qualify.append({
            "id": f"lead_{i}", "answers": a, "profile": p,
            "expected": {
                "profile": r["profile"], "overall_score": r["overall_score"], "maturity_level": r["maturity_level"],
                "domain_scores": {d["id"]: d["score"] for d in r["domains"]},
                "critical_flags": [f["id"] for f in r["critical_flags"]],
                "lead_tags": r["lead"]["tags"], "lead_labels": r["lead"]["labels"],
                "template_id": r["template_id"], "template_version": r["template_version"],
            },
        })
    emails = ["jane@acme-bank.example", "x@gmail.com", "Y@Mailinator.com", "no-at-sign", "a@b@outlook.com",
              "c@sub.yahoo.co.uk", "d@yahoo.co.uk", "e@example.co"]
    business = [{"email": e, "domain": integ.email_domain(e), "business": integ.is_business_email(e)} for e in emails]

    captured: list[dict] = []
    orig = integ.WebhookCRM.upsert_contact
    integ.WebhookCRM.upsert_contact = lambda self, payload: captured.append(payload) or {"ok": True}
    record = {"lead_id": "lead_abc", "email": "jane@acme-bank.example", "name": "Jane Doe", "company": "Acme Bank",
              "role": "", "overall_score": 56.4, "maturity_level": "Developing", "consent": True,
              "lead_tags": ["baseline_priority", "shield_candidate"], "source": "maturity-assessment"}
    form_record = {"id": "form_1", "email": "sam@acme.example", "name": "Sam", "company": "Acme", "role": "CTO",
                   "consent": True, "source": "form:demo"}
    try:
        integ.HubSpotFormsCRM("123", "guid-1").upsert_contact(record)
        integ.HubSpotFormsCRM("123", "guid-1").upsert_contact(form_record)
    finally:
        integ.WebhookCRM.upsert_contact = orig

    leads = [
        {"lead_id": "lead_x1", "created_at": "2026-10-21T10:00:00.123456+00:00", "email": "a@acme.example",
         "name": "Ann", "company": "Acme Corporation International Holdings", "role": "CISO",
         "overall_score": 56.4, "maturity_level": "Developing", "lead_tags": ["baseline_priority", "shield_candidate"],
         "critical_flags": ["FLAG-NO-INVENTORY"], "source": "maturity-assessment", "marketing_opt_in": False},
        {"lead_id": "lead_x2", "created_at": "2026-10-22T09:30:00+00:00", "email": "b@beta.example",
         "name": "=cmd", "company": "Beta, Inc.", "role": "", "overall_score": 70.0, "maturity_level": "Defined",
         "lead_tags": [], "critical_flags": [], "source": "maturity-assessment", "marketing_opt_in": True},
    ]
    forms = [
        {"id": "form_a1", "created_at": "2026-10-21T08:00:00+00:00", "form": "demo", "company": "Gamma Labs"},
        {"id": "form_a2", "created_at": "2026-10-21T08:05:00+00:00", "form": "newsletter", "company": ""},
    ]
    with tempfile.TemporaryDirectory() as td:
        (Path(td) / "leads").mkdir()
        (Path(td) / "forms").mkdir()
        (Path(td) / "leads" / "leads.jsonl").write_text("".join(json.dumps(x) + "\n" for x in leads))
        (Path(td) / "forms" / "submissions.jsonl").write_text("".join(json.dumps(x) + "\n" for x in forms))
        A = lambda **kw: type("A", (), {"var_dir": td, "actor": "fixture", **kw})()  # noqa: E731
        _, list_all = _stdout(admin_cli.cmd_leads_list, A(tag=None))
        _, list_tag = _stdout(admin_cli.cmd_leads_list, A(tag="shield_candidate"))
        out = Path(td) / "leads.csv"
        _stdout(admin_cli.cmd_leads_export, A(out=str(out)))
        export_csv = out.read_bytes().decode("utf-8")
        _, forms_text = _stdout(admin_cli.cmd_forms_list, A())
    return {"qualify": qualify, "business_email": business, "hubspot": [
        {"record": record, "payload": captured[0]}, {"record": form_record, "payload": captured[1]}],
        "cli": {"leads": leads, "forms": forms, "list_all": list_all, "list_tag": list_tag,
                "export_csv": export_csv, "forms_text": forms_text}}


# --------------------------------------------------------------------------- audit
def audit_fixture() -> dict:
    with tempfile.TemporaryDirectory() as td:
        good = AuditLog(Path(td) / "audit" / "api_audit.jsonl")
        good.append("lead.created", "public", {"lead_id": "lead_1", "score": 56.4}, resource="lead_1")
        good.append("report.download", "lead", {"format": "md"}, resource="lead_1")
        bad = AuditLog(Path(td) / "agent" / "agent_audit.jsonl")
        bad.append("approval.requested", "agent", {"n": 1})
        bad.append("approval.approved", "jane", {"n": 2})
        bad.append("export.created", "jane", {"n": 3})
        lines = bad.path.read_text().splitlines()
        rec = json.loads(lines[1])
        rec["details"]["n"] = 99
        lines[1] = json.dumps(rec)
        bad.path.write_text("\n".join(lines) + "\n")
        rc, text = _stdout(admin_cli.cmd_audit_verify, type("A", (), {"var_dir": td})())
        return {"logs": {"audit/api_audit.jsonl": good.path.read_text(), "agent/agent_audit.jsonl": bad.path.read_text()},
                "output": text, "exit_code": rc}


# --------------------------------------------------------------------------- maturity report
def maturity_fixture() -> list[dict]:
    tpl = load_assessment_template()
    qids = [q["id"] for q in tpl["questions"]]
    cases = [
        ("all_ones", {q: 1 for q in qids}, {"industry": "bfsi", "org_size": "5000+", "ai_systems": "25-99",
                                            "uses_agents": True, "eu_operations": True}, {"company": "Acme | Bank"}),
        ("all_fives", {q: 5 for q in qids}, {"industry": "saas_product", "org_size": "<250", "ai_systems": "0-9",
                                             "uses_agents": False, "eu_operations": False}, None),
        ("mixed", {q: (i * 7 % 5) + 1 for i, q in enumerate(qids)},
         {"industry": "healthcare_pharma", "org_size": "1000-5000", "ai_systems": "unknown", "uses_agents": True,
          "eu_operations": False}, {"company": "Example Health", "name": "X"}),
    ]
    out = []
    for cid, a, p, lead in cases:
        r = score_assessment(a, p)
        out.append({"id": cid, "answers": a, "profile": p, "lead": lead, "generated": "2026-10-21",
                    "markdown": render_maturity_markdown(r, lead, generated="2026-10-21")})
    return out


# --------------------------------------------------------------------------- content checks
CTRL_RE = re.compile(r"\b(AO|EI|GL|IS|SE)-(\d{2})\b")
_cc_spec = importlib.util.spec_from_file_location("check_content", PLATFORM / "scripts" / "check_content.py")
check_content = importlib.util.module_from_spec(_cc_spec)
_cc_spec.loader.exec_module(check_content)

BUNDLED_GLOBS = ["content/controls/*.yaml", "content/assessment_templates/*.yaml", "content/policy_packs/*.yaml",
                 "content/industry_packs/*.yaml", "content/website_pages/*.md", "content/email_templates.yaml"]


def bundled_files() -> list[Path]:
    out: set[Path] = set()
    for g in BUNDLED_GLOBS:
        out.update(PLATFORM.glob(g))
    return sorted(out)


def content_checks_fixture() -> dict:
    """check_content.py steps over exactly the files the website bundles (same logic, same order)."""
    files = bundled_files()
    lines: list[str] = []
    errors: list[str] = []
    lib = controls_by_id()
    lines.append(f"[1] control library: {len(lib)} controls")
    t = load_assessment_template()
    qids = {q["id"] for q in t["questions"]}
    if len(t["questions"]) != 24 or len(t["domains"]) != 8 or sum(d["weight"] for d in t["domains"]) != 100:
        errors.append("assessment template shape invalid")
    for g in (g for fw in t["readiness_groups"] for g in fw["groups"]):
        errors += [f"readiness group {g['id']} unknown question {q}" for q in g["questions"] if q not in qids]
    lines.append(f"[2] self-assessment template: {len(t['questions'])} questions")
    n_refs, bad_refs = 0, {}
    for p in files:
        for m in CTRL_RE.finditer(p.read_text(encoding="utf-8", errors="ignore")):
            n_refs += 1
            cid = m.group(0)
            if cid not in lib and not cid.endswith("-00"):
                bad_refs.setdefault(cid, set()).add(str(p.relative_to(PLATFORM)))
    for cid, ps in sorted(bad_refs.items()):
        errors.append(f"unknown control ID {cid} in {', '.join(sorted(ps))}")
    lines.append(f"[3] control references scanned: {n_refs}, unknown: {len(bad_refs)}")
    slugs = {}
    for p in sorted((PLATFORM / "content" / "website_pages").glob("*.md")):
        if p.name.lower() == "readme.md":
            continue
        m = re.match(r"^---\n(.*?)\n---\n", p.read_text(encoding="utf-8"), re.DOTALL)
        fm = yaml.safe_load(m.group(1)) or {}
        slugs[fm.get("slug")] = p.name
    lines.append(f"[4] website pages: {len(slugs)}")
    packs = sorted((PLATFORM / "content" / "policy_packs").glob("*.y*ml"))
    for p in packs:
        errors += [f"policy pack {p.name}: {e}" for e in validate_policy(yaml.safe_load(p.read_text("utf-8")))]
    lines.append(f"[5] policy packs validated: {len(packs)}")
    hits = []
    for p in files:
        if p.suffix not in (".md", ".yaml", ".yml"):
            continue
        txt_lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
        block, start = [], 1
        for i, line in enumerate(txt_lines + [""], 1):
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
                    if check_content.INSTRUCTIONAL.search(sent):
                        continue
                    for h in find_prohibited_claims(sent):
                        hits.append(f"{p.relative_to(PLATFORM)}:{start if chunk is not line.strip() else i}: {h[:140]}")
    errors += [f"prohibited claim: {h}" for h in hits]
    lines.append(f"[6] prohibited-claim scan: {len(hits)} hit(s)")

    # Synthetic scan cases for the paragraph/negation logic of step 6.
    samples = {
        "plain.md": "Our platform is fully compliant with the EU AI Act.\n",
        "negated.md": "VERITRAIL does not certify that you are compliant.\n",
        "instructional.md": "Never say the system is compliant.\n",
        "wrapped.md": "First line of a paragraph\nthat continues and is now compliant.\n\n| table | is compliant |\n",
        "quoted.md": "Avoid claims like \"fully certified\".\n> The product is regulator-approved.\n",
        "indented.md": "  Indented line is fully compliant.  \n- bullet is fully compliant\n",
    }
    scan = {}
    for name, text in samples.items():
        found = []
        lines_ = text.splitlines()
        block, start = [], 1
        for i, line in enumerate(lines_ + [""], 1):
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
                    if check_content.INSTRUCTIONAL.search(sent):
                        continue
                    for h in find_prohibited_claims(sent):
                        found.append(f"content/{name}:{start if chunk is not line.strip() else i}: {h[:140]}")
        scan[name] = {"text": text, "hits": found}

    wp = subprocess.run([sys.executable, str(PLATFORM / "scripts" / "check_website_pages.py"), "-v"],
                        capture_output=True, text=True, cwd=str(REPO))
    rows = []
    for ln in wp.stdout.splitlines():
        m = re.match(r"^(\S+\.md)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+) faq=(\d+)$", ln)
        if m:
            rows.append({"name": m.group(1), "slug": m.group(2), "section": m.group(3), "template": m.group(4),
                         "words": int(m.group(5)), "faq": int(m.group(6))})
    summary = next(ln for ln in wp.stdout.splitlines() if ln.startswith("pages="))
    wp_errors = [ln[len("ERROR "):] for ln in wp.stdout.splitlines() if ln.startswith("ERROR ")]
    wp_warnings = [ln[len("WARN "):] for ln in wp.stdout.splitlines() if ln.startswith("WARN ")]
    return {
        "files": [str(p.relative_to(PLATFORM)) for p in files],
        "content": {"lines": lines, "errors": errors, "ok": not errors},
        "scan_samples": scan,
        "website": {"summary": summary, "rows": rows, "errors": wp_errors, "warnings": wp_warnings,
                    "exit_code": wp.returncode},
    }


def main() -> int:
    data = {
        "roi": roi_cases(),
        "analytics": analytics_fixture(),
        "funnel_cases": funnel_cases(),
        "leads": lead_fixture(),
        "audit": audit_fixture(),
        "maturity": maturity_fixture(),
        "content_checks": content_checks_fixture(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
