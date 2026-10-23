import csv
import json

from veritrail_assessment.engine import score_assessment
from veritrail_common.content import load_assessment_template
from veritrail_common.evidence import find_prohibited_claims
from veritrail_reports.exporters import write_csv, write_json, write_markdown
from veritrail_reports.maturity import render_maturity_markdown
from veritrail_reports.pdf import markdown_to_pdf

T = load_assessment_template()


def _result(v=2, **profile):
    return score_assessment({q["id"]: v for q in T["questions"]}, profile)


def test_maturity_report_has_all_required_sections():
    md = render_maturity_markdown(_result(2, uses_agents=True, eu_operations=True), {"company": "Acme"})
    for heading in ["Overall maturity", "Domain scores", "Top strengths", "Top gaps", "Critical risk flags",
                    "30/60/90-day action plan", "Recommended VERITRAIL controls", "Framework readiness indicators",
                    "Recommended VERITRAIL modules", "VERITRAIL Governance Baseline"]:
        assert heading in md, heading
    for fw in ["NIST AI RMF", "ISO/IEC 42001", "EU AI Act"]:
        assert fw in md
    assert "User-asserted" in md
    assert "not a compliance determination" in md
    assert find_prohibited_claims(md) == []


def test_report_escapes_and_pdf(tmp_path):
    md = render_maturity_markdown(_result(4), {"company": "<script>alert(1)</script> & Co"})
    pdf = markdown_to_pdf(md, tmp_path / "r.pdf", title="Report")
    data = pdf.read_bytes()
    assert data.startswith(b"%PDF") and len(data) > 3000


def test_pdf_handles_markdown_features(tmp_path):
    md = "# T\n\nPara **bold** *it* `code` [link](https://x.example)\nline2  \nline3\n\n- a\n- b\n  cont\n1. one\n2. two\n\n" \
         "| a | b |\n|---|---|\n| 1 | 2 |\n\n```\ncode block <tag>\n```\n\n> quote\n\n---\n"
    p = markdown_to_pdf(md, tmp_path / "f.pdf")
    assert p.stat().st_size > 1000


def test_csv_injection_neutralised(tmp_path):
    p = write_csv([{"a": "=HYPERLINK(\"http://evil\")", "b": "+1", "c": "safe", "d": ["x", "y"]}], tmp_path / "x.csv")
    rows = list(csv.reader(open(p)))
    assert rows[1][0].startswith("'=") and rows[1][1] == "'+1" and rows[1][2] == "safe" and rows[1][3] == "x; y"


def test_json_and_markdown_writers(tmp_path):
    r = _result(3)
    p = write_json(r, tmp_path / "r.json")
    assert json.loads(p.read_text())["overall_score"] == 60.0
    m = write_markdown("# hi", tmp_path / "a" / "b.md")
    assert m.read_text() == "# hi"
