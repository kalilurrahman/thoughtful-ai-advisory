"""Integration: the browser's API payloads against the real in-process API (veritrail_api.server.VeritrailApp).

Ensures what site.js / assessment-ui.js / analytics.js send is accepted by the API, that the
built site is served with the API's CSP, and that the responses contain what the browser renders.
"""
from __future__ import annotations

import json
import re

import pytest

from veritrail_website.builder import SiteBuilder
from veritrail_website.paths import FIXTURE_PAGES_DIR

server = pytest.importorskip("veritrail_api.server")


@pytest.fixture(scope="module")
def built(tmp_path_factory):
    out = tmp_path_factory.mktemp("site") / "dist"
    SiteBuilder(FIXTURE_PAGES_DIR, out).build()
    return out


@pytest.fixture()
def app(built, tmp_path, monkeypatch):
    monkeypatch.setenv("VERITRAIL_RATE_LIMIT", "1000")
    return server.VeritrailApp(var_dir=tmp_path / "var", site_dir=built)


def post(app, path, body, ctype="application/json"):
    status, headers, raw = app.handle("POST", path, {"Content-Type": ctype}, json.dumps(body).encode())
    data = json.loads(raw) if raw and "json" in headers.get("Content-Type", "") else None
    return status, headers, data


def answers(v=2):
    from veritrail_common.content import load_assessment_template
    return {q["id"]: v for q in load_assessment_template()["questions"]}


def gate_payload(**over):
    """Mirrors the payload built in assessment-ui.js."""
    p = {"email": "jane@examplebank.com", "name": "Jane Doe", "company": "Example Bank", "role": "CISO",
         "consent": True, "marketing_opt_in": False, "answers": answers(2),
         "profile": {"industry": "bfsi", "org_size": "1000-5000", "ai_systems": "25-99", "uses_agents": True,
                     "eu_operations": True},
         "source": "website:maturity-assessment", "website": ""}
    p.update(over)
    return p


def test_static_pages_served_from_dist(app):
    status, headers, body = app.handle("GET", "/tools/maturity-assessment/")
    assert status == 200 and b'id="veritrail-assessment-data"' in body
    status, _, body = app.handle("GET", "/no/such/page/")
    assert status == 404 and b"Page not found" in body
    status, headers, _ = app.handle("GET", "/static/js/assessment-engine.js")
    assert status == 200 and "javascript" in headers["Content-Type"]


def test_leads_contract_matches_browser_expectations(app):
    status, _, data = post(app, "/api/leads", gate_payload())
    assert status == 201, data
    assert set(data) >= {"lead_id", "result", "report_markdown", "report_pdf_url", "report_md_url", "email_status"}
    assert "lead" not in data["result"]  # internal qualification stays server-side
    assert re.match(r"^/api/reports/lead_[a-z0-9]+\.pdf\?t=", data["report_pdf_url"])  # passes safeUrl prefix
    # the JS renderer needs these keys
    for k in ["overall_score", "maturity_level", "domains", "strengths", "gaps", "critical_flags", "action_plan",
              "action_plan_labels", "recommended_controls", "readiness", "recommended_modules", "disclaimer",
              "standard_disclaimer", "cta", "evidence_status"]:
        assert k in data["result"], k
    status, headers, body = app.handle("GET", data["report_md_url"])
    assert status == 200 and body.startswith(b"# AI Governance Maturity Report")


def test_free_mail_rejected_with_field_for_inline_error(app):
    status, _, data = post(app, "/api/leads", gate_payload(email="jane@gmail.com"))
    assert status == 422 and data["field"] == "email" and data["code"] == "business_email_required"


def test_client_free_mail_list_matches_the_api(app, built):
    cfg_html = (built / "index.html").read_text()
    cfg = json.loads(re.search(r'<script type="application/json" id="veritrail-config">(.*?)</script>', cfg_html, re.S).group(1))
    assert len(cfg["free_mail_domains"]) >= 30
    from veritrail_api import integrations
    client = set(cfg["free_mail_domains"])
    accepted_by_server = sorted(d for d in client if integrations.is_business_email(f"x@{d}"))
    assert accepted_by_server == [], "client blocks domains the API would accept"
    server_only = sorted((integrations.FREE_MAIL_DOMAINS | integrations.DISPOSABLE_DOMAINS) - client)
    assert server_only == [], f"add to app/website/site.yaml free_mail_domains: {server_only}"


@pytest.mark.parametrize("form,extra", [
    ("baseline", {"company": "Example Bank", "role": "CRO", "industry": "bfsi", "ai_systems": "25-99", "message": "Scope"}),
    ("demo", {"company": "Example Bank", "tool": "shield"}),
    ("contact", {"message": "Hello"}),
    ("newsletter", {}),
    ("blueprint", {"company": "Example Bank"}),
    ("waitlist", {"tool": "evidence-planner"}),
])
def test_contact_forms_payloads_accepted(app, form, extra):
    body = {"form": form, "consent": True, "website": "", "email": "jane@examplebank.com", "source": "/x/"}
    if form != "newsletter":
        body["name"] = "Jane Doe"
    body.update(extra)
    status, _, data = post(app, "/api/contact", body)
    assert status == 201, data
    if form == "blueprint":
        assert data["download_url"].startswith("/downloads/")


def test_contact_validation_errors_carry_field(app):
    status, _, data = post(app, "/api/contact", {"form": "baseline", "email": "j@gmail.com", "name": "J", "consent": True})
    assert status == 422 and data["field"] == "email"
    status, _, data = post(app, "/api/contact", {"form": "contact", "email": "j@corp.com", "name": "J", "consent": False})
    assert status == 422 and data["field"] == "consent"


def test_analytics_beacon_text_plain_accepted_and_names_match(app, tmp_path):
    from pathlib import Path
    js = (Path(server.__file__).resolve().parents[2] / "website/static/js/analytics.js").read_text()
    names = re.findall(r"'([a-z_]+)'", js[js.index("var EVENTS"):js.index("];")])
    assert set(names) == server.EVENT_NAMES
    status, _, _ = post(app, "/api/events", {"name": "cta_click", "path": "/", "props": {"cta": "header_baseline"}},
                        ctype="text/plain;charset=UTF-8")
    assert status == 204


def test_risk_tier_and_shield_payload_shapes(app):
    status, _, data = post(app, "/api/risk-tier", {"profile": {"name": "Credit model", "decision_impact": "automated_decision",
                                                               "domain_category": "credit", "eu_exposure": True,
                                                               "tools": ["crm_read"]}})
    assert status == 200 and data["tier"] == "High" and data["evidence_status"] == "Inferred"
    assert data["requires_human_confirmation"] is True and data["citation_ids"]
    status, _, data = post(app, "/api/shield/advise", {"profile": {
        "app_name": "Refund agent", "tools": [{"name": "crm_lookup", "operation": "read"},
                                              {"name": "issue_refund", "operation": "payment"}],
        "users": ["support agents"], "autonomy": "acts_with_approval"}})
    if status == 503:
        pytest.skip("Runtime Shield Advisor not installed")
    assert status == 200
    for k in ["risk_profile", "tool_matrix", "policy_yaml", "citations", "activation"]:
        assert k in data
    assert data["risk_profile"]["overall"]["rating"]


def test_served_pages_have_no_inline_code_under_csp(app, built):
    """The API's CSP forbids inline scripts/styles; the build output must not rely on them."""
    for f in built.rglob("*.html"):
        html = f.read_text()
        for m in re.finditer(r"<script(?![^>]*\bsrc=)([^>]*)>", html):
            assert re.search(r'type="application/(ld\+)?json"', m.group(1)), f
        assert "<style" not in html and not re.search(r'\sstyle="', html), f
        assert not re.search(r"\son[a-z]+=", html), f
