"""PolicyEngine decisions in enforce mode: every decision type, default-deny, parameters, identity, approvals."""
from __future__ import annotations

import pytest

from aegis_policy.constants import DECISIONS
from aegis_policy.engine import PolicyEngine, PolicyValidationError
from pe_helpers import APPROVER, IDENTITY, FakeClock, _base_policy, req


def tool(name, params=None, **kw):
    return req("tool_call", tool=name, params=params or {}, **kw)


# --- every decision type ---------------------------------------------------------------

def test_allow(make_engine):
    d = make_engine().evaluate(tool("crm.lookup", {"order_id": "ORD-123456"}))
    assert d.decision == "ALLOW" and d.allowed and d.would_be_decision == "ALLOW"
    assert "tool.crm-lookup" in d.matched_rules
    assert d.payload == {"tool": "crm.lookup", "params": {"order_id": "ORD-123456"}}
    assert {"IS-12", "SE-08", "IS-11"} <= set(d.citations)


def test_deny(make_engine):
    d = make_engine().evaluate(tool("admin.console"))
    assert d.decision == "DENY" and not d.allowed and d.payload is None
    assert "tool.admin" in d.matched_rules


def test_redact(make_engine):
    d = make_engine().evaluate(req("prompt", "My card is 4111 1111 1111 1111 and email jo@corp.com"))
    assert d.decision == "REDACT" and d.allowed
    assert "4111" not in d.payload and "jo@corp.com" not in d.payload
    assert "[REDACTED:payment_card]" in d.payload and "[REDACTED:email]" in d.payload
    assert d.findings["pii"] == {"payment_card": 1, "email": 1}
    assert "IS-04" in d.citations


def test_transform(make_engine):
    d = make_engine().evaluate(req("response", "See https://example.com/help and ![x](https://evil.test/p.png?d=1)"))
    assert d.decision == "TRANSFORM" and d.allowed
    assert "https://example.com/help" in d.payload
    assert "evil.test" not in d.payload and "[link removed by policy]" in d.payload


def test_require_human_approval(make_engine):
    d = make_engine().evaluate(tool("records.delete", {"record_id": "r-1"}))
    assert d.decision == "REQUIRE_HUMAN_APPROVAL" and not d.allowed and d.payload is None
    assert d.approval_request_id and d.approval_request_id.startswith("apr_")
    assert "IS-13" in d.citations


def test_escalate(make_engine):
    d = make_engine().evaluate(tool("fraud.review", {"case": "c1"}))
    assert d.decision == "ESCALATE" and not d.allowed


def test_rate_limit(make_engine, policy):
    policy["limits"]["requests_per_minute"] = 1
    e = make_engine(policy, clock=FakeClock())
    assert e.evaluate(req()).decision == "ALLOW"
    d = e.evaluate(req())
    assert d.decision == "RATE_LIMIT" and "limits.requests_per_minute" in d.matched_rules and "IS-16" in d.citations


def test_all_seven_decisions_are_reachable(make_engine, policy):
    policy["limits"]["requests_per_minute"] = 5
    seen = set()
    e = make_engine(policy, clock=FakeClock())
    for r in [tool("crm.lookup", {"order_id": "ORD-123456"}), tool("admin.console"),
              req("prompt", "email a@b.co"), req("response", "https://evil.test/"),
              tool("records.delete", {"record_id": "x"})]:
        seen.add(e.evaluate(r).decision)
    seen.add(e.evaluate(tool("fraud.review")).decision)   # 6th request: over the limit, but RATE_LIMIT < ESCALATE
    seen.add(e.evaluate(req()).decision)
    assert seen == set(DECISIONS)


def test_precedence_deny_beats_redact_and_approval(make_engine):
    d = make_engine().evaluate(tool("payments.refund", {"amount": 900, "currency": "USD", "note": "x"}))
    assert d.would_be_decision == "DENY"
    assert any("exceeds maximum 500" in r for r in d.reasons)
    assert any("undeclared parameter" in r for r in d.reasons)


# --- default deny / deny-list / roles / scopes --------------------------------------------------

def test_unknown_tool_default_deny(make_engine):
    d = make_engine().evaluate(tool("db.drop_table", {"table": "users"}))
    assert d.decision == "DENY" and "tools.default" in d.matched_rules
    assert any("default-deny" in r for r in d.reasons)
    assert {"IS-11", "EI-07"} <= set(d.citations)


def test_deny_list(make_engine):
    d = make_engine().evaluate(tool("shell.exec", {"cmd": "ls"}))
    assert d.decision == "DENY" and "tools.deny_list" in d.matched_rules


def test_default_action_escalate(make_engine, policy):
    policy["tools"]["default_action"] = "ESCALATE"
    assert make_engine(policy).evaluate(tool("new.tool")).decision == "ESCALATE"


def test_tool_role_restriction(make_engine):
    e = make_engine()
    assert e.evaluate(tool("notes.search", {"q": "x"})).decision == "DENY"
    admin = dict(IDENTITY, roles=["admin"])
    assert e.evaluate(tool("notes.search", {"q": "x"}, identity=admin)).decision == "ALLOW"


def test_least_privilege_scopes(make_engine):
    e = make_engine()
    ok = e.evaluate(tool("crm.lookup", {"order_id": "ORD-123456"}, requested_scopes=["orders:read"]))
    assert ok.decision == "ALLOW"
    bad = e.evaluate(tool("crm.lookup", {"order_id": "ORD-123456"}, requested_scopes=["orders:read", "orders:write"]))
    assert bad.decision == "DENY" and "tool.crm-lookup.scopes" in bad.matched_rules


# --- parameter validation ---------------------------------------------------------------------

@pytest.mark.parametrize("params,code", [
    ({"order_id": "ORD-12"}, "regex"),
    ({"order_id": "ORD-123456\nDROP"}, "regex"),
    ({}, "required"),
    ({"order_id": 123456}, "type"),
    ({"order_id": "ORD-123456", "extra": 1}, "undeclared"),
])
def test_param_violations_lookup(make_engine, params, code):
    d = make_engine().evaluate(tool("crm.lookup", params))
    assert d.decision == "DENY", d.reasons
    assert f"tool.crm-lookup.params.{code}" in d.matched_rules


@pytest.mark.parametrize("params,code", [
    ({"amount": 501, "currency": "USD"}, "max"),
    ({"amount": 0, "currency": "USD"}, "min"),
    ({"amount": 10, "currency": "BTC"}, "enum"),
    ({"amount": True, "currency": "USD"}, "type"),      # bool is not a number
    ({"amount": float("nan"), "currency": "USD"}, "type"),
    ({"amount": "10", "currency": "USD"}, "type"),
])
def test_param_violations_refund(make_engine, params, code):
    d = make_engine().evaluate(tool("payments.refund", params))
    assert d.decision == "DENY", d.reasons
    assert f"tool.refund.params.{code}" in d.matched_rules


@pytest.mark.parametrize("to,ok", [
    ("customer@example.com", True),
    ("billing@mail.example.com", True),
    ("x@evil.com", False),
    ("x@notexample.com", False),            # suffix trick
    ("x@example.com.evil.com", False),      # prefix trick
    ("https://example.com@evil.com/", False),  # userinfo trick
    ("x@exаmple.com", False),               # Cyrillic 'а' homoglyph: rejected, not guessed
    ("", False),
])
def test_domain_allow_list(make_engine, to, ok):
    d = make_engine().evaluate(tool("email.send", {"to": to, "body": "Hi"}))
    assert (d.decision in ("ALLOW", "REDACT")) is ok, (to, d.decision, d.reasons)


def test_reasons_never_echo_parameter_values(make_engine):
    d = make_engine().evaluate(tool("email.send", {"to": "secret.person@evil.com", "body": "Hi"}))
    assert d.decision == "DENY"
    assert not any("secret.person" in r for r in d.reasons)


# --- conditional approval + approval workflow -------------------------------------------------

def test_conditional_approval_threshold(make_engine):
    e = make_engine()
    assert e.evaluate(tool("payments.refund", {"amount": 40, "currency": "USD"})).decision == "ALLOW"
    d = e.evaluate(tool("payments.refund", {"amount": 80, "currency": "USD"}))
    assert d.decision == "REQUIRE_HUMAN_APPROVAL" and "tool.refund.approval_if[0]" in d.matched_rules


def test_missing_condition_param_requires_approval_conservatively(make_engine, policy):
    policy["tools"]["rules"][1]["parameters"]["amount"]["required"] = False
    d = make_engine(policy).evaluate(tool("payments.refund", {"currency": "USD"}))
    assert d.decision == "REQUIRE_HUMAN_APPROVAL"
    assert any("conservatively" in r for r in d.reasons)


def test_approval_flow_single_use_and_bound_to_exact_action(make_engine):
    e = make_engine()
    r = tool("payments.refund", {"amount": 80, "currency": "USD"})
    d1 = e.evaluate(r)
    apr = d1.approval_request_id
    assert [p["approval_request_id"] for p in e.pending_approvals()] == [apr]

    # parameters tampered after approval -> not covered
    e.approve(apr, APPROVER, note="customer complaint #12")
    tampered = e.evaluate(tool("payments.refund", {"amount": 450, "currency": "USD"}, approval_id=apr))
    assert tampered.decision == "REQUIRE_HUMAN_APPROVAL"
    assert "approval.invalid" in tampered.matched_rules

    d2 = e.evaluate(dict(r, approval_id=apr))
    assert d2.decision == "ALLOW" and "approval.granted" in d2.matched_rules
    assert any("Dana Lead" in x for x in d2.reasons)

    d3 = e.evaluate(dict(r, approval_id=apr))  # replay
    assert d3.decision == "REQUIRE_HUMAN_APPROVAL"


def test_approval_cannot_override_deny(make_engine):
    e = make_engine()
    d = e.evaluate(tool("payments.refund", {"amount": 900, "currency": "USD"}))
    assert d.decision == "DENY" and d.approval_request_id is None


def test_approval_role_and_self_approval_enforced(make_engine):
    e = make_engine()
    apr = e.evaluate(tool("records.delete", {"record_id": "r-9"})).approval_request_id
    with pytest.raises(PermissionError, match="not an authorized approver"):
        e.approve(apr, {"name": "Eve", "role": "Intern"})
    with pytest.raises(PermissionError, match="self-approval"):
        e.approve(apr, {"name": "user-1", "role": "Data Owner"})
    with pytest.raises(KeyError):
        e.approve("apr_doesnotexist", {"name": "X", "role": "Data Owner"})
    e.approve(apr, {"name": "Olu Owner", "role": "Data Owner"})


def test_reject_and_expiry(make_engine):
    clock = FakeClock()
    e = make_engine(clock=clock, approval_ttl_seconds=60)
    r = tool("records.delete", {"record_id": "r-1"})
    apr = e.evaluate(r).approval_request_id
    e.reject(apr, {"name": "Olu", "role": "Data Owner"}, "not justified")
    with pytest.raises(KeyError):
        e.approve(apr, {"name": "Olu", "role": "Data Owner"})
    apr = e.evaluate(r).approval_request_id
    e.approve(apr, {"name": "Olu", "role": "Data Owner"})
    clock.advance(61)
    assert e.evaluate(dict(r, approval_id=apr)).decision == "REQUIRE_HUMAN_APPROVAL"


# --- identity, scope, shape -------------------------------------------------------------------

def test_identity_required(make_engine):
    d = make_engine().evaluate({"type": "prompt", "content": "hi"})
    assert d.decision == "DENY" and "identity.unauthenticated" in d.matched_rules
    d = make_engine().evaluate(req(identity=dict(IDENTITY, authenticated=False)))
    assert d.decision == "DENY"


def test_identity_missing_claim_and_role(make_engine):
    d = make_engine().evaluate(req(identity={"sub": "u", "tenant_id": "acme"}))
    assert "identity.missing_claim" in d.matched_rules and d.decision == "DENY"
    d = make_engine().evaluate(req(identity=dict(IDENTITY, roles=["guest"])))
    assert "identity.role" in d.matched_rules


def test_identity_issuer(make_engine, policy):
    policy["identity"]["allowed_issuers"] = ["https://idp.example.com/"]
    e = make_engine(policy)
    assert e.evaluate(req()).decision == "ALLOW"
    assert e.evaluate(req(identity=dict(IDENTITY, iss="https://evil/"))).decision == "DENY"


def test_cross_tenant_denied(make_engine):
    d = make_engine().evaluate(req(context={"tenant": "globex"}))
    assert d.decision == "DENY" and "identity.tenant_mismatch" in d.matched_rules


def test_out_of_scope_request_default_denied(make_engine):
    d = make_engine().evaluate(req(context={"environment": "dev"}))
    assert d.decision == "DENY" and "scope.not_applicable" in d.matched_rules
    d = make_engine().evaluate(req(context={"agent_name": "other-agent"}))
    assert d.decision == "DENY"


@pytest.mark.parametrize("bad", [
    {"type": "telepathy", "content": "x"},
    {"type": "prompt", "content": {"not": "a string"}},
    {"type": "tool_call", "params": {}},
    {"type": "tool_call", "tool": "crm.lookup", "params": ["a"]},
    "not even a dict",
])
def test_malformed_requests_fail_closed(make_engine, bad):
    if isinstance(bad, dict):
        bad = dict(bad, identity=dict(IDENTITY))
    d = make_engine(mode="observe").evaluate(bad)
    assert d.decision == "DENY" and "request.malformed" in d.matched_rules


def test_invalid_policy_rejected_by_engine(tmp_path):
    p = _base_policy()
    p["tools"]["default_action"] = "ALLOW"
    with pytest.raises(PolicyValidationError) as ei:
        PolicyEngine(p, tmp_path / "a.jsonl")
    assert any("default_action" in e for e in ei.value.errors)


def test_draft_policy_flagged_as_simulation(make_engine, policy):
    d = make_engine(policy).evaluate(req())
    assert d.simulation is True and any("simulation" in r for r in d.reasons)


def test_decision_to_dict_is_json_serializable(make_engine):
    import json
    d = make_engine().evaluate(tool("payments.refund", {"amount": 80, "currency": "USD"}))
    out = json.loads(json.dumps(d.to_dict()))
    assert out["decision"] == "REQUIRE_HUMAN_APPROVAL" and out["allowed"] is False
