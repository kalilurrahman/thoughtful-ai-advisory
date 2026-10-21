from aegis_assessment.risk_tier import INTAKE_FIELDS, KEY_FIELDS, calculate_risk_tier
from aegis_common.content import controls_by_id

SUPPORT_AGENT = {
    "name": "Customer support agent", "purpose": "Answer customer queries using CRM data",
    "decision_impact": "advisory", "affected_parties": "customers", "data_sensitivity": "personal",
    "autonomy": "acts_with_approval", "tools": ["crm_read", "crm_write", "send_email"], "external_actions": True,
    "domain_category": "customer_service", "genai": True, "vendor_model": True, "eu_exposure": True,
}


def test_low_risk_internal_tool():
    r = calculate_risk_tier({"purpose": "Summarise internal meeting notes", "decision_impact": "none",
                             "affected_parties": "internal", "data_sensitivity": "internal", "autonomy": "suggests",
                             "domain_category": "internal_productivity"})
    assert r["tier"] == "Low"
    assert r["required_modules"] == ["core"]
    assert r["evidence_status"] == "Inferred" and r["requires_human_confirmation"] is True


def test_support_agent_is_high_with_agentic_modules():
    r = calculate_risk_tier(SUPPORT_AGENT)
    assert r["tier"] == "High"
    for m in ("agentic", "genai_llm", "data_privacy", "security", "human_oversight", "vendor_third_party"):
        assert m in r["required_modules"]
    assert r["approval_authority"] == "AI Governance Forum"
    assert r["review_cadence_months"] == 6
    assert not r["missing_fields"] and not r["provisional"]


def test_annex_iii_like_trigger_needs_material_decision_for_high():
    base = {"purpose": "Rank job applicants", "decision_impact": "material", "affected_parties": "public",
            "data_sensitivity": "personal", "autonomy": "suggests", "domain_category": "employment", "eu_exposure": True}
    r = calculate_risk_tier(base)
    assert r["tier"] == "High"
    assert any("Annex III" in t for t in r["triggers"])
    assert any("legal classification review" in t for t in r["triggers"])


def test_prohibited_screen():
    r = calculate_risk_tier({"purpose": "Emotion recognition of employees during meetings"})
    assert r["tier"] == "Prohibited-review"
    assert "AO-10" in r["citation_ids"]
    assert "do not proceed" in r["approval_authority"]


def test_missing_fields_safest_default():
    r = calculate_risk_tier({"name": "Mystery bot"})
    assert r["tier"] == "Medium"
    assert r["provisional"] is True
    assert set(r["missing_fields"]) == set(KEY_FIELDS)
    assert len(r["clarifying_questions"]) == len(KEY_FIELDS)
    assert all(q in INTAKE_FIELDS.values() for q in r["clarifying_questions"])


def test_autonomous_external_agent_high():
    r = calculate_risk_tier({"purpose": "Pay supplier invoices", "decision_impact": "advisory",
                             "affected_parties": "internal", "data_sensitivity": "confidential",
                             "autonomy": "acts_autonomously", "tools": ["erp_payment"], "domain_category": "other"})
    assert r["tier"] == "High"
    assert any("Autonomous agent" in t for t in r["triggers"])


def test_citations_are_real_controls():
    lib = controls_by_id()
    r = calculate_risk_tier(SUPPORT_AGENT)
    assert r["citation_ids"] and all(c in lib for c in r["citation_ids"])
    assert all(f["citation"].startswith("AEGIS Control ") for f in r["factors"])


def test_string_tools_and_booleans():
    r = calculate_risk_tier({**SUPPORT_AGENT, "tools": "crm_read, crm_write", "external_actions": "yes"})
    assert any(f["factor"] == "tool_access" for f in r["factors"])
    assert any(f["factor"] == "external_actions" for f in r["factors"])
