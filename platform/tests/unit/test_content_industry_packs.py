"""Structure and citation checks for VERITRAIL industry packs (content/industry_packs/*.yaml)."""
from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

from veritrail_common.content import controls_by_id, load_assessment_template
from veritrail_common.evidence import find_prohibited_claims

ROOT = Path(__file__).resolve().parents[2]
PACK_DIR = ROOT / "content" / "industry_packs"
POLICY_PACK_DIR = ROOT / "content" / "policy_packs"
EXPECTED = {"healthcare_pharma", "bfsi", "gcc_it_services", "saas_product", "public_sector"}

TIERS = {"Prohibited-review", "High", "Medium", "Low"}
PROFILE_ENUMS = {
    "decision_impact": {"none", "advisory", "material", "automated_decision"},
    "affected_parties": {"internal", "customers", "public", "vulnerable"},
    "data_sensitivity": {"public", "internal", "confidential", "personal", "special_category"},
    "autonomy": {"none", "suggests", "acts_with_approval", "acts_autonomously"},
    "domain_category": {
        "credit", "employment", "healthcare", "biometric", "education", "critical_infrastructure",
        "law_enforcement", "migration", "justice", "essential_services", "customer_service",
        "internal_productivity", "other", "insurance", "financial_services", "public_sector",
    },
}
BOOL_FIELDS = {"genai", "external_actions", "eu_exposure", "vendor_model"}
REQUIRED_TOP = {"pack", "summary", "priority_use_cases", "emphasized_controls", "additional_evidence",
                "sector_regimes", "recommended_policy_packs", "pilot_discovery_questions"}
REQUIRED_PACK = {"id", "name", "version", "status", "effective_date", "owner", "review_cadence",
                 "profile_industry", "disclaimer"}
CONTROL_RE = re.compile(r"\b(?:AO|EI|GL|IS|SE)-\d{2}\b")


def _packs() -> dict[str, dict]:
    return {p.stem: yaml.safe_load(p.read_text(encoding="utf-8")) for p in sorted(PACK_DIR.glob("*.yaml"))}


PACKS = _packs()


def _policy_pack_ids() -> set[str]:
    ids = set()
    for p in POLICY_PACK_DIR.glob("*.y*ml"):
        d = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
        if isinstance(d, dict) and d.get("policy_id"):
            ids.add(d["policy_id"])
    return ids


def test_all_expected_packs_present():
    assert EXPECTED <= set(PACKS), f"missing packs: {EXPECTED - set(PACKS)}"


@pytest.mark.parametrize("name", sorted(PACKS))
def test_pack_structure(name):
    d = PACKS[name]
    assert REQUIRED_TOP <= set(d), REQUIRED_TOP - set(d)
    assert REQUIRED_PACK <= set(d["pack"]), REQUIRED_PACK - set(d["pack"])
    assert d["pack"]["id"] == name
    industries = next(f for f in load_assessment_template()["profile_fields"] if f["id"] == "industry")["options"]
    assert d["pack"]["profile_industry"] in industries
    assert len(d["priority_use_cases"]) >= 5
    assert len(d["emphasized_controls"]) >= 6
    assert len(d["additional_evidence"]) >= 4
    assert len(d["sector_regimes"]) >= 3
    assert len(d["recommended_policy_packs"]) >= 2
    assert len(d["pilot_discovery_questions"]) >= 6


@pytest.mark.parametrize("name", sorted(PACKS))
def test_ids_unique_within_pack(name):
    d = PACKS[name]
    ids = [x["id"] for key in ("priority_use_cases", "additional_evidence", "pilot_discovery_questions")
           for x in d[key]]
    assert len(ids) == len(set(ids))


@pytest.mark.parametrize("name", sorted(PACKS))
def test_use_cases_have_valid_tier_hints_and_profiles(name):
    for uc in PACKS[name]["priority_use_cases"]:
        assert {"id", "name", "description", "default_risk_tier_hint", "risk_tier_rationale",
                "risk_profile_hint", "key_controls"} <= set(uc), uc.get("id")
        assert uc["default_risk_tier_hint"] in TIERS
        prof = uc["risk_profile_hint"]
        for k, v in prof.items():
            if k in PROFILE_ENUMS:
                assert v in PROFILE_ENUMS[k], f"{uc['id']}: {k}={v}"
            else:
                assert k in BOOL_FIELDS and isinstance(v, bool), f"{uc['id']}: unexpected {k}"
        for k in ("decision_impact", "affected_parties", "data_sensitivity", "autonomy", "domain_category"):
            assert k in prof, f"{uc['id']} missing {k}"
        assert uc["key_controls"]


@pytest.mark.parametrize("name", sorted(PACKS))
def test_every_control_id_exists(name):
    valid = set(controls_by_id())
    text = (PACK_DIR / f"{name}.yaml").read_text(encoding="utf-8")
    cited = set(CONTROL_RE.findall(text))
    assert cited, "pack cites no controls"
    assert cited <= valid, f"unknown control IDs: {sorted(cited - valid)}"
    d = PACKS[name]
    structured = [c for uc in d["priority_use_cases"] for c in uc["key_controls"]]
    structured += [e["id"] for e in d["emphasized_controls"]]
    structured += [c for e in d["additional_evidence"] for c in e["related_controls"]]
    structured += [c for r in d["sector_regimes"] for c in r["related_controls"]]
    structured += [c for q in d["pilot_discovery_questions"] for c in q["related_controls"]]
    assert set(structured) <= valid


@pytest.mark.parametrize("name", sorted(PACKS))
def test_regimes_flagged_verify_with_counsel(name):
    for r in PACKS[name]["sector_regimes"]:
        assert r.get("verify_with_counsel") is True, r["name"]
        assert r["scope_summary"] and r["veritrail_relevance"]


@pytest.mark.parametrize("name", sorted(PACKS))
def test_eu_ai_act_regimes_carry_timeline_caveat(name):
    for r in PACKS[name]["sector_regimes"]:
        if "EU AI Act" in r["name"]:
            assert "Official Journal" in r["veritrail_relevance"] or "Official Journal" in r["scope_summary"], r["name"]


@pytest.mark.parametrize("name", sorted(PACKS))
def test_no_prohibited_compliance_claims(name):
    text = (PACK_DIR / f"{name}.yaml").read_text(encoding="utf-8")
    assert find_prohibited_claims(text) == []


@pytest.mark.parametrize("name", sorted(PACKS))
def test_policy_pack_references(name):
    for pp in PACKS[name]["recommended_policy_packs"]:
        assert pp["status"] in {"available", "proposed"}
        assert re.fullmatch(r"[a-z0-9][a-z0-9._-]{2,79}", pp["id"])
        if pp["status"] == "available":
            assert pp["id"] in _policy_pack_ids(), f"no policy pack with policy_id {pp['id']} in content/policy_packs"
        else:
            assert pp["id"] not in _policy_pack_ids(), f"{pp['id']} exists; mark it available"


def test_tier_hints_agree_with_risk_tier_engine():
    """Default hints should match what the risk-tier engine infers from the hint profile."""
    rt = pytest.importorskip("veritrail_assessment.risk_tier")
    mismatches = []
    for name, d in PACKS.items():
        for uc in d["priority_use_cases"]:
            prof = dict(uc["risk_profile_hint"], name=uc["name"], purpose=uc["description"])
            tier = rt.calculate_risk_tier(prof)["tier"]
            if tier != uc["default_risk_tier_hint"]:
                mismatches.append((uc["id"], uc["default_risk_tier_hint"], tier))
    assert not mismatches, mismatches
