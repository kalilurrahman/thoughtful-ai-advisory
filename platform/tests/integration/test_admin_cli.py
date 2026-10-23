import json

from veritrail_admin.cli import funnel, main
from veritrail_api.server import VeritrailApp
from veritrail_common.content import load_assessment_template

QIDS = [q["id"] for q in load_assessment_template()["questions"]]


def _seed(tmp_path):
    app = VeritrailApp(var_dir=tmp_path, site_dir=tmp_path / "nosite")
    body = {"email": "a@corp.example", "name": "A", "company": "Corp", "consent": True,
            "answers": {q: 2 for q in QIDS}, "profile": {"uses_agents": True}}
    app.handle("POST", "/api/leads", {"Content-Type": "application/json"}, json.dumps(body).encode())
    for n in ["page_view", "page_view", "assessment_start", "assessment_preliminary", "assessment_gate_view",
              "assessment_lead_submitted"]:
        app.handle("POST", "/api/events", {"Content-Type": "application/json"}, json.dumps({"name": n, "path": "/"}).encode())
    app._send_template("nurture_day3_followup", "a@corp.example", {"name": "A"}, ref="x")
    return app


def test_audit_verify_and_tamper(tmp_path, capsys):
    _seed(tmp_path)
    assert main(["--var-dir", str(tmp_path), "audit", "verify"]) == 0
    p = tmp_path / "audit" / "api_audit.jsonl"
    p.write_text(p.read_text().replace('"lead.created"', '"lead.deleted"'))
    assert main(["--var-dir", str(tmp_path), "audit", "verify"]) == 1


def test_leads_list_and_export(tmp_path, capsys):
    _seed(tmp_path)
    assert main(["--var-dir", str(tmp_path), "leads", "list", "--tag", "shield_candidate"]) == 0
    assert "Corp" in capsys.readouterr().out
    out = tmp_path / "leads.csv"
    assert main(["--var-dir", str(tmp_path), "leads", "export", "--out", str(out)]) == 0
    assert "a@corp.example" in out.read_text()


def test_approval_separation_of_duties(tmp_path, capsys):
    _seed(tmp_path)
    appr = json.loads(next((tmp_path / "approvals").glob("*.json")).read_text())
    aid = appr["approval_id"]
    assert main(["--var-dir", str(tmp_path), "approvals", "resolve", aid, "--decision", "approve",
                 "--approver", "bob", "--role", "viewer"]) == 2
    assert main(["--var-dir", str(tmp_path), "approvals", "resolve", aid, "--decision", "approve",
                 "--approver", "Jane Approver", "--role", "approver", "--note", "ok"]) == 0
    assert json.loads(next((tmp_path / "approvals").glob("*.json")).read_text())["status"] == "approved"
    assert main(["--var-dir", str(tmp_path), "approvals", "resolve", aid, "--decision", "reject",
                 "--approver", "Jane Approver", "--role", "approver"]) == 2  # already resolved


def test_funnel(tmp_path):
    _seed(tmp_path)
    f = funnel(tmp_path)
    steps = {s["step"]: s for s in f["funnel"]}
    assert steps["page_view"]["count"] == 2
    assert steps["assessment_start"]["conversion_from_previous"] == 50.0
