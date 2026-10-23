"""API integration tests (in-process, no sockets) plus one real-socket smoke test."""
import json
import threading
import urllib.request
from email import message_from_bytes, policy

import pytest

from veritrail_api.server import VeritrailApp, serve
from veritrail_common.content import load_assessment_template

QIDS = [q["id"] for q in load_assessment_template()["questions"]]
PROFILE = {"industry": "bfsi", "org_size": "1000-5000", "ai_systems": "25-99", "uses_agents": True, "eu_operations": True}


@pytest.fixture()
def app(tmp_path, monkeypatch):
    monkeypatch.delenv("VERITRAIL_CRM_BACKEND", raising=False)
    monkeypatch.delenv("VERITRAIL_MAIL_BACKEND", raising=False)
    site = tmp_path / "site"
    (site / "tools" / "x").mkdir(parents=True)
    (site / "index.html").write_text("<h1>home</h1>")
    (site / "404.html").write_text("nf")
    (site / "tools" / "x" / "index.html").write_text("tool")
    return VeritrailApp(var_dir=tmp_path / "var", site_dir=site, public_base_url="https://veritrail.test")


def post(app, path, obj, ctype="application/json"):
    s, h, b = app.handle("POST", path, {"Content-Type": ctype}, json.dumps(obj).encode())
    return s, (json.loads(b) if b and "json" in h.get("Content-Type", "") else b)


def lead_payload(**over):
    d = {"email": "cro@examplebank.com", "name": "Dana Risk", "company": "Example Bank", "role": "CRO",
         "consent": True, "answers": {q: 2 for q in QIDS}, "profile": PROFILE, "source": "maturity-assessment"}
    d.update(over)
    return d


def test_health(app):
    s, h, b = app.handle("GET", "/api/health")
    assert s == 200 and json.loads(b)["status"] == "ok"


def test_preliminary(app):
    s, r = post(app, "/api/assessment/preliminary", {"answers": {q: 3 for q in QIDS}, "profile": {}})
    assert s == 200 and r["overall_score"] == 60.0 and r["maturity_level"] == "Defined"
    assert "gaps" not in r


def test_preliminary_invalid(app):
    s, r = post(app, "/api/assessment/preliminary", {"answers": {"STR-Q1": 3}})
    assert s == 422 and "missing answers" in r["error"]


def test_lead_full_flow(app):
    s, r = post(app, "/api/leads", lead_payload())
    assert s == 201, r
    assert r["result"]["overall_score"] == 40.0 and r["result"]["maturity_level"] == "Developing"
    assert "lead" not in r["result"]  # internal qualification never returned to the respondent
    assert r["email_status"] == "sent"
    assert "Critical risk flags" in r["report_markdown"]
    # gated downloads
    path = r["report_pdf_url"].replace("https://veritrail.test", "")
    s2, h2, b2 = app.handle("GET", path)
    assert s2 == 200 and b2.startswith(b"%PDF") and h2["Content-Type"] == "application/pdf"
    s3, _, b3 = app.handle("GET", r["report_md_url"].replace("https://veritrail.test", ""))
    assert s3 == 200 and b"AI Governance Maturity Report" in b3
    # CRM record has qualification tags
    crm = [json.loads(x) for x in (app.var / "crm" / "contacts.jsonl").read_text().splitlines()]
    assert crm[-1]["lead_tags"] and "baseline_priority" in crm[-1]["lead_tags"]
    # email went to outbox with PDF attachment, using approved template
    eml = list((app.var / "outbox").glob("*.eml"))
    assert len(eml) == 1
    msg = message_from_bytes(eml[0].read_bytes(), policy=policy.default)
    assert msg["To"] == "cro@examplebank.com"
    assert any(p.get_filename() == "VERITRAIL_Maturity_Report.pdf" for p in msg.iter_attachments())
    # audit log has domain, not the full email
    audit = (app.var / "audit" / "api_audit.jsonl").read_text()
    assert "examplebank.com" in audit and "cro@examplebank.com" not in audit
    assert app.audit.verify()[0]


def test_lead_rejects_free_mail(app):
    s, r = post(app, "/api/leads", lead_payload(email="someone@gmail.com"))
    assert s == 422 and r["code"] == "business_email_required"


def test_lead_requires_consent(app):
    s, r = post(app, "/api/leads", lead_payload(consent=False))
    assert s == 422 and r["field"] == "consent"


def test_lead_honeypot(app):
    s, _ = post(app, "/api/leads", lead_payload(website="http://spam"))
    assert s == 400


def test_report_token_required(app):
    s, r = post(app, "/api/leads", lead_payload())
    lead_id = r["lead_id"]
    assert app.handle("GET", f"/api/reports/{lead_id}.pdf")[0] == 403
    assert app.handle("GET", f"/api/reports/{lead_id}.pdf?t=deadbeef")[0] == 403


def test_contact_forms(app):
    s, r = post(app, "/api/contact", {"form": "baseline", "email": "ciso@corp.example", "name": "C", "consent": True,
                                       "company": "Corp", "ai_systems": "25-99"})
    assert s == 201 and r["status"] == "received"
    s, r = post(app, "/api/contact", {"form": "newsletter", "email": "me@gmail.com", "consent": True})
    assert s == 201  # newsletter allows personal email
    s, r = post(app, "/api/contact", {"form": "demo", "email": "me@gmail.com", "name": "x", "consent": True})
    assert s == 422
    s, r = post(app, "/api/contact", {"form": "blueprint", "email": "a@corp.example", "name": "A", "consent": True})
    assert s == 201 and r["download_url"].endswith(".pdf")
    s, r = post(app, "/api/contact", {"form": "nope", "email": "a@corp.example", "consent": True})
    assert s == 422


def test_unapproved_template_queues_for_human_approval(app):
    res = app._send_template("nurture_day3_followup", "x@corp.example", {"name": "X"}, ref="t")
    assert res["status"] == "pending_approval"
    assert list((app.var / "approvals").glob("*.json"))
    assert not list((app.var / "outbox").glob("*.eml"))


def test_events_cookieless(app):
    s, h, b = app.handle("POST", "/api/events", {"Content-Type": "text/plain"},
                         json.dumps({"name": "cta_click", "path": "/x?email=a@b.com", "props": {"cta": "baseline", "email": "a@b.com"}}).encode())
    assert s == 204
    rec = json.loads((app.var / "analytics" / "events.jsonl").read_text().splitlines()[-1])
    assert rec["path"] == "/x" and "email" not in rec["props"] and set(rec) == {"ts", "name", "path", "props"}
    assert post(app, "/api/events", {"name": "evil"})[0] == 422


def test_risk_tier_endpoint(app):
    s, r = post(app, "/api/risk-tier", {"profile": {"purpose": "x", "decision_impact": "material", "affected_parties": "public",
                                                    "data_sensitivity": "personal", "autonomy": "suggests", "domain_category": "credit",
                                                    "eu_exposure": True}})
    assert s == 200 and r["tier"] == "High" and r["requires_human_confirmation"]


def test_static_serving(app):
    assert app.handle("GET", "/")[0] == 200
    s, h, _ = app.handle("GET", "/tools/x")
    assert s == 301 and h["Location"] == "/tools/x/"
    assert app.handle("GET", "/tools/x/")[2] == b"tool"
    assert app.handle("GET", "/missing/")[0] == 404


def test_real_socket_smoke(tmp_path):
    httpd = serve("127.0.0.1", 0, var_dir=tmp_path / "v", site_dir=tmp_path)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    try:
        port = httpd.server_address[1]
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health") as r:
            assert r.status == 200
            assert r.headers["X-Content-Type-Options"] == "nosniff"
            assert "frame-ancestors 'none'" in r.headers["Content-Security-Policy"]
    finally:
        httpd.shutdown()
