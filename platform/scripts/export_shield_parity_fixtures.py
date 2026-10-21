"""Export parity fixtures for the browser (TypeScript) ports of the AEGIS engines.

    python3 platform/scripts/export_shield_parity_fixtures.py

Writes deterministic JSON fixtures consumed by the website's Vitest suite:

* src/test/fixtures/risk-tier-parity.json  -- aegis_assessment.risk_tier.calculate_risk_tier
  (the `/api/risk-tier` response) for a set of varied intake profiles;
* src/test/fixtures/shield-parity.json     -- aegis_shield.advisor.advise plus policy_yaml /
  policy_json (the `/api/shield/advise` response) for the example profiles and edge cases.

The generated policy's change-history date is normalised to FIXED_DATE (and policy_yaml /
policy_json re-rendered) so the fixtures do not change from day to day.
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

PLATFORM = Path(__file__).resolve().parent.parent
REPO = PLATFORM.parent
for d in sorted((PLATFORM / "app").iterdir()):
    if d.is_dir() and str(d) not in sys.path:
        sys.path.insert(0, str(d))

from aegis_assessment.risk_tier import calculate_risk_tier  # noqa: E402
from aegis_shield.advisor import advise  # noqa: E402
from aegis_shield.examples import (  # noqa: E402
    AUTONOMOUS_HIGH_RISK_PROFILE,
    CUSTOMER_SUPPORT_PROFILE,
    FINANCIAL_OPS_PROFILE,
    INTERNAL_RAG_PROFILE,
)
from aegis_shield.generator import to_json, to_yaml  # noqa: E402

FIXED_DATE = "2000-01-01"
OUT_DIR = REPO / "src" / "test" / "fixtures"

RISK_PROFILES: list[tuple[str, dict]] = [
    ("empty", {}),
    ("name_only", {"name": "Internal helper"}),
    ("minimal_low", {"name": "Docs search", "purpose": "Search internal docs", "decision_impact": "none",
                     "affected_parties": "internal", "data_sensitivity": "internal", "autonomy": "none",
                     "domain_category": "internal_productivity"}),
    ("two_missing_low", {"name": "Meeting notes", "purpose": "Summarise meetings", "decision_impact": "none",
                         "affected_parties": "internal", "data_sensitivity": "internal", "autonomy": "suggests"}),
    ("medium_customer_service", {"name": "Support bot", "purpose": "Answer customer questions",
                                 "decision_impact": "advisory", "affected_parties": "customers",
                                 "data_sensitivity": "personal", "autonomy": "suggests",
                                 "domain_category": "customer_service", "genai": True, "vendor_model": True}),
    ("credit_eu_material", {"name": "Credit scorer", "purpose": "Score loan applications",
                            "decision_impact": "automated_decision", "affected_parties": "customers",
                            "data_sensitivity": "personal", "autonomy": "acts_autonomously",
                            "domain_category": "credit", "eu_exposure": True, "external_actions": False}),
    ("employment_eu_advisory", {"name": "CV screener", "purpose": "Rank CVs for recruiters",
                                "decision_impact": "advisory", "affected_parties": "public",
                                "data_sensitivity": "personal", "autonomy": "suggests",
                                "domain_category": "employment", "eu_exposure": "yes"}),
    ("healthcare_special", {"name": "Triage assistant", "purpose": "Suggest triage priority for patients",
                            "decision_impact": "material", "affected_parties": "vulnerable",
                            "data_sensitivity": "special_category", "autonomy": "acts_with_approval",
                            "domain_category": "healthcare", "genai": "yes"}),
    ("agentic_write_tools", {"name": "Ops agent", "purpose": "Resolve IT tickets",
                             "decision_impact": "none", "affected_parties": "internal",
                             "data_sensitivity": "confidential", "autonomy": "acts_autonomously",
                             "domain_category": "other",
                             "tools": ["ticket_read", "ticket_update", "send_email", "deploy_service"],
                             "external_actions": True, "environment": "production"}),
    ("agentic_tools_string", {"name": "Refund agent", "purpose": "Issue refunds",
                              "decision_impact": "material", "affected_parties": "customers",
                              "data_sensitivity": "personal", "autonomy": "acts_with_approval",
                              "domain_category": "financial_services", "tools": "crm_read, issue_refund,  "}),
    ("read_only_tools", {"name": "KB bot", "purpose": "Answer HR policy questions", "decision_impact": "advisory",
                         "affected_parties": "internal", "data_sensitivity": "internal", "autonomy": "suggests",
                         "domain_category": "internal_productivity", "tools": ["kb_search", "policy_lookup"]}),
    ("prohibited_social_scoring", {"name": "Citizen score", "purpose": "Social scoring of residents",
                                   "decision_impact": "automated_decision", "affected_parties": "public",
                                   "data_sensitivity": "personal", "autonomy": "acts_autonomously",
                                   "domain_category": "public_sector"}),
    ("prohibited_emotion_recognition", {"name": "Classroom mood monitor",
                                        "purpose": "Emotion recognition of students to manipulate engagement",
                                        "domain_category": "education", "eu_exposure": True}),
    ("prohibited_in_description", {"name": "Patrol planner", "description": "Predictive policing hotspots",
                                   "decision_impact": "material", "domain_category": "law_enforcement"}),
    ("prohibited_biometric_name", {"name": "Real-time remote biometric ID", "purpose": "Identify people",
                                   "domain_category": "biometric", "data_sensitivity": "special_category"}),
    ("unknown_enum_values", {"name": "Odd", "purpose": "Testing", "decision_impact": "sometimes",
                             "affected_parties": "aliens", "data_sensitivity": "secret", "autonomy": "maybe",
                             "domain_category": "  Gardening  "}),
    ("bool_strings", {"name": "Flags", "purpose": "Flags test", "external_actions": "Y", "genai": "TRUE",
                      "vendor_model": "no", "eu_exposure": "1", "domain_category": "Migration"}),
    ("score_threshold_60", {"name": "Threshold", "purpose": "Threshold test", "decision_impact": "material",
                            "affected_parties": "public", "data_sensitivity": "personal",
                            "autonomy": "acts_with_approval", "domain_category": "other"}),
    ("vulnerable_material", {"name": "Benefits helper", "purpose": "Recommend benefit eligibility",
                             "decision_impact": "material", "affected_parties": "vulnerable",
                             "data_sensitivity": "personal", "autonomy": "suggests",
                             "domain_category": "essential_services", "eu_exposure": False}),
    ("website_form_shape", {"name": "Website form", "purpose": "Draft marketing copy",
                            "decision_impact": "none", "affected_parties": "public", "data_sensitivity": "public",
                            "autonomy": "suggests", "domain_category": "other", "tools": ["cms_post"],
                            "external_actions": False, "eu_exposure": True, "vendor_model": True, "genai": True,
                            "environment": "staging"}),
    ("empty_strings", {"name": "", "purpose": "", "decision_impact": "", "tools": [], "domain_category": ""}),
]

SHIELD_PROFILES: list[tuple[str, dict]] = [
    ("customer_support_agent", CUSTOMER_SUPPORT_PROFILE),
    ("financial_operations_agent", FINANCIAL_OPS_PROFILE),
    ("internal_rag", INTERNAL_RAG_PROFILE),
    ("autonomous_high_risk", AUTONOMOUS_HIGH_RISK_PROFILE),
    ("empty", {}),
    ("website_form_minimal", {"app_name": "Claims Copilot"}),
    ("website_form_full", {
        "app_name": "Claims Copilot",
        "purpose": "Help claims handlers summarise claims and draft customer letters",
        "users": ["claims handlers", "team leads"],
        "affected_parties": "customers",
        "model": "gpt-4o",
        "vendor": "Azure OpenAI",
        "tools": [{"name": "claims_lookup", "operation": "read"}, {"name": "send_letter", "operation": "external_send"},
                  {"name": "update_claim_status"}, {"name": "mystery"}, {"name": "pay_claim", "operation": "foo"}],
        "data_categories": ["customer contact details", "medical reports"],
        "data_sensitivity": "personal",
        "autonomy": "acts_with_approval",
        "human_approval_model": "Team lead signs off in the claims system",
        "environment": "staging",
        "risk_tier": "Medium",
        "regulatory_obligations": ["GDPR", "EU AI Act"],
        "existing_controls": ["SSO", "DLP", "red-team testing", "Splunk SIEM"],
    }),
    ("aliases_and_invalid", {
        "name": "Ops Agent X",
        "description": "Operations helper",
        "user_groups": "Employees; contractors",
        "sensitivity": "restricted",
        "autonomy": "autonomous",
        "environment": "prod",
        "risk_tier": "critical",
        "approval_model": "high-impact",
        "apis": "crm_lookup:read\ndelete_record:delete\nexport_report:export\nnotify_slack",
        "data": ["source code", "credentials"],
        "limits": {"requests_per_minute": 10, "tokens_per_day": 12345.7, "bogus": -1},
        "approver_roles": ["Ops Lead"],
        "existing_controls": "Vault, kill switch, runbook",
    }),
    ("special_category_export", {
        "app_name": "Patient Data Exporter",
        "purpose": "Export patient records for research",
        "tools": [{"name": "records.export_bulk", "operation": "export"},
                  {"name": "records.search", "operation": "read", "data_sensitivity": "public"},
                  {"name": "bad_params", "operation": "write",
                   "parameters": {"x": {"type": "float"}, "y": {"type": "string", "min": 1}}},
                  {"name": "pay", "operation": "payment", "max_amount": 0, "auto_approve_below": 25}],
        "data_categories": ["patient health records"],
        "autonomy": "suggests",
        "human_approval_model": "none",
        "vendor": "Example Vendor",
        "risk_tier": "Low",
        "affected_parties": "patients",
    }),
    ("prohibited_review_tier", {
        "app_name": "Social Scoring Engine",
        "risk_tier": "Prohibited-review",
        "autonomy": "none",
        "human_approval_model": "per_action",
        "environment": "dev",
        "data_sensitivity": "public",
        "affected_parties": "public",
        "tools": ["score_citizens:write", "publish_scores:send"],
    }),
]


def _normalise_shield(out: dict) -> dict:
    out = copy.deepcopy(out)
    pol = out["policy"]
    for h in pol.get("change_history", []):
        h["date"] = FIXED_DATE
    out["policy_yaml"] = to_yaml(pol)
    out["policy_json"] = to_json(pol)
    return out


def shield_api(profile: dict) -> dict:
    """Same shape as AegisApp.shield_advise (advise + policy_yaml / policy_json)."""
    out = advise(copy.deepcopy(profile))
    pol = out.get("policy")
    if pol is not None:
        out = {**out, "policy_yaml": to_yaml(pol), "policy_json": to_json(pol)}
    return _normalise_shield(out)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    risk = {
        "generated_by": "platform/scripts/export_shield_parity_fixtures.py",
        "cases": [{"id": cid, "profile": prof, "expected": calculate_risk_tier(copy.deepcopy(prof))}
                  for cid, prof in RISK_PROFILES],
    }
    shield = {
        "generated_by": "platform/scripts/export_shield_parity_fixtures.py",
        "fixed_date": FIXED_DATE,
        "cases": [{"id": cid, "profile": prof, "expected": shield_api(prof)} for cid, prof in SHIELD_PROFILES],
    }
    for name, data in (("risk-tier-parity.json", risk), ("shield-parity.json", shield)):
        p = OUT_DIR / name
        p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
