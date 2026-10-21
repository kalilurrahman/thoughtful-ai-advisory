"""Sensitive-data leakage tests for the policy engine (IS-04, SE-08).

Structured identifiers must never reach the audit log or (when redaction applies)
the forwarded payload. Formats the heuristics do not cover are pinned as strict
xfail tests so the limitation stays visible.
"""
from __future__ import annotations

import copy
import json

import pytest

from aegis_common.audit import AuditLog
from aegis_policy.detectors import redact_text
from aegis_policy.engine import PolicyEngine
from aegis_policy.loader import load_pack

CTX = {"agent_name": "leak-agent", "environment": "production", "risk_tier": "High", "model": "m", "tenant": "acme"}
ID = {"sub": "u-1", "tenant_id": "acme", "roles": ["support_agent"]}

SECRETS = {
    "email": "jane.doe@example.org",
    "payment_card": "4111 1111 1111 1111",
    "iban": "DE89 3704 0044 0532 0130 00",
    "us_ssn": "123-45-6789",
    "uk_nino": "AB 12 34 56 C",
    "india_pan": "ABCDE1234F",
    "phone": "+44 20 7946 0958",
    "api_key": "sk-live_4f9a8b7c6d5e4f3a2b1c",
}


@pytest.fixture
def engine(tmp_path):
    p = copy.deepcopy(load_pack("customer_support_agent"))
    p["rollout"]["mode"] = "enforce"
    p["applies_to"] = {"agent_name": ["*"], "environment": ["*"]}
    return PolicyEngine(p, AuditLog(tmp_path / "audit.jsonl"), default_context=dict(CTX))


@pytest.mark.parametrize("entity", list(SECRETS))
@pytest.mark.parametrize("surface", ["prompt", "response", "tool_output"])
def test_identifier_redacted_from_payload_and_log(engine, entity, surface):
    raw = SECRETS[entity]
    d = engine.evaluate({"type": surface, "identity": ID, "content": f"Here it is: {raw} thanks"})
    assert d.decision in ("REDACT", "TRANSFORM"), d.reasons
    assert raw not in json.dumps(d.payload)
    assert raw not in engine.audit.path.read_text()


@pytest.mark.parametrize("entity", list(SECRETS))
def test_identifier_never_in_log_even_in_observe_mode(tmp_path, entity):
    p = copy.deepcopy(load_pack("customer_support_agent"))
    p["applies_to"] = {"agent_name": ["*"], "environment": ["*"]}
    e = PolicyEngine(p, AuditLog(tmp_path / "a.jsonl"), default_context=dict(CTX))
    d = e.evaluate({"type": "prompt", "identity": ID, "content": f"value {SECRETS[entity]}"})
    assert d.decision == "ALLOW" and d.mode == "observe"
    assert SECRETS[entity] not in e.audit.path.read_text()


def test_identifiers_in_tool_params_masked_in_payload_and_log(engine):
    d = engine.evaluate({"type": "tool_call", "tool": "tickets.update", "identity": ID,
                         "params": {"ticket_id": "TCK-1234567",
                                    "note": f"Customer card {SECRETS['payment_card']} and SSN {SECRETS['us_ssn']}"}})
    assert d.decision == "REDACT"
    assert SECRETS["payment_card"] not in json.dumps(d.payload)
    assert SECRETS["us_ssn"] not in engine.audit.path.read_text()


def test_reasons_and_findings_never_contain_raw_values(engine):
    d = engine.evaluate({"type": "prompt", "identity": ID, "content": " ".join(SECRETS.values())})
    blob = json.dumps({"reasons": d.reasons, "findings": d.findings, "rules": d.matched_rules})
    for raw in SECRETS.values():
        assert raw not in blob


def test_fullwidth_digits_and_zero_width_splitting_still_redacted():
    assert "4111" not in redact_text("card ４１１１ １１１１ １１１１ １１１１", None).text
    assert "example" not in redact_text("mail jo\u200bhn@exa\u200bmple.com", None).text


def test_audit_chain_survives_hostile_unicode(engine):
    for s in ["\u0000\u202e\ud7ff", "\U0001F600" * 100, "\\u0000 \" ' ` $(rm -rf /)"]:
        engine.evaluate({"type": "prompt", "identity": ID, "content": s})
    assert engine.audit.verify() == (True, "ok")


# --- KNOWN LIMITATIONS --------------------------------------------------------------------

LIMITATION = "Known limitation: structured-identifier heuristics only; see docs/RUNTIME_SHIELD_DESIGN.md §9"


@pytest.mark.xfail(strict=True, reason=LIMITATION + " — person names / postal addresses")
def test_limitation_names_and_addresses():
    out = redact_text("John Smith lives at 221B Baker Street, London NW1 6XE", None).text
    assert "John Smith" not in out and "Baker Street" not in out


@pytest.mark.xfail(strict=True, reason=LIMITATION + " — dates of birth and passport numbers")
def test_limitation_dob_and_passport():
    out = redact_text("dob 1985-03-14, passport 123456789", None).text
    assert "1985-03-14" not in out and "123456789" not in out


def test_cloud_tokens_redacted():
    # Formerly a pinned limitation; fixed by adding aws_access_key / github_token patterns to aegis_common.redaction.
    out = redact_text("AKIAIOSFODNN7EXAMPLE and ghp_abcdefghijklmnopqrstuvwxyz0123456789", None).text
    assert "AKIAIOSFODNN7EXAMPLE" not in out and "ghp_" not in out


@pytest.mark.xfail(strict=True, reason=LIMITATION + " — free-text health information")
def test_limitation_free_text_health_data():
    out = redact_text("Patient has HIV and was prescribed Biktarvy", None).text
    assert "HIV" not in out
