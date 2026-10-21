"""Sample deliverables and design doc: labelled, valid and free of compliance claims."""
from __future__ import annotations

import json

import yaml

from aegis_common.evidence import find_prohibited_claims
from aegis_common.paths import OUTPUT_DIR, REPO_ROOT
from aegis_policy.schema import validate_policy
from aegis_shield.__main__ import main as cli_main
from aegis_shield.samples import write_samples

SAMPLE_DIR = OUTPUT_DIR / "sample_reports" / "runtime_shield"
KEYS = ("customer_support_agent", "financial_operations_agent")


def test_write_samples_to_tmp(tmp_path):
    paths = write_samples(tmp_path)
    names = {p.name for p in paths}
    for k in KEYS:
        assert {f"{k}_advisor.md", f"{k}_advisor.json", f"{k}_policy.yaml", f"{k}_policy.json"} <= names
    for p in paths:
        text = p.read_text(encoding="utf-8")
        assert "Synthetic example" in text, p.name
        assert find_prohibited_claims(text) == [], p.name


def test_committed_samples_present_and_valid():
    for k in KEYS:
        y = yaml.safe_load((SAMPLE_DIR / f"{k}_policy.yaml").read_text(encoding="utf-8"))
        j = json.loads((SAMPLE_DIR / f"{k}_policy.json").read_text(encoding="utf-8"))
        assert validate_policy(y) == [] and validate_policy(j) == []
        assert y["status"] == j["status"] == "draft"
        adv = json.loads((SAMPLE_DIR / f"{k}_advisor.json").read_text(encoding="utf-8"))
        assert adv["label"] == "Synthetic example" and adv["advice"]["policy"]["policy_id"] == y["policy_id"]


def test_design_doc_present_and_clean():
    doc = (REPO_ROOT / "docs" / "RUNTIME_SHIELD_DESIGN.md").read_text(encoding="utf-8")
    for section in ("## 2. Architecture", "## 3. Policy schema reference", "## 4. Decision semantics",
                    "## 5. Rollout model", "## 7. Integration patterns", "## 8. KPIs", "## 9. Limitations"):
        assert section in doc
    assert find_prohibited_claims(doc) == []


def test_cli_validate_and_advise(tmp_path, capsys):
    packs = sorted(str(p) for p in (REPO_ROOT / "content" / "policy_packs").glob("*.yaml"))
    assert cli_main(["validate", *packs]) == 0
    prof = tmp_path / "p.yaml"
    prof.write_text(yaml.safe_dump({"app_name": "CLI Bot", "tools": ["kb.search:read"], "environment": "staging"}))
    assert cli_main(["advise", str(prof), "--out", str(tmp_path / "out")]) == 0
    assert (tmp_path / "out" / "cli-bot_policy.yaml").exists()
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps({"policy_id": "x"}))
    assert cli_main(["validate", str(bad)]) == 1
