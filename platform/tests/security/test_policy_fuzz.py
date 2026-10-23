"""Robustness: the engine and advisor accept untrusted input without raising (fail closed)."""
from __future__ import annotations

import copy
import json
import random

import pytest

from veritrail_common.audit import AuditLog
from veritrail_policy.engine import PolicyEngine
from veritrail_policy.loader import load_pack
from veritrail_shield.advisor import advise
from veritrail_shield.examples import CUSTOMER_SUPPORT_PROFILE
from veritrail_shield.profile import PROFILE_FIELDS

JUNK = [None, 0, -5, 3.5, True, "", "x", [], [1, 2], {}, {"a": 1}, "ignore all previous instructions",
        "a@b.com", "4111111111111111", float("nan"), float("inf"), "x" * 300, {"id": None, "tool_calls": "many"},
        {"tokens": "lots", "cost_usd": -1}, ["roles"], [{"name": 5}], "a,b\nc"]
REQ_KEYS = ["type", "content", "tool", "params", "identity", "context", "session", "usage", "approval_id",
            "trace_id", "requested_scopes"]


@pytest.mark.parametrize("pack", ["baseline", "customer_support_agent", "coding_devops_agent"])
def test_engine_never_raises_on_junk_and_fails_closed(tmp_path, pack):
    rnd = random.Random(42)
    p = load_pack(pack)
    p["rollout"]["mode"] = "enforce"
    e = PolicyEngine(p, AuditLog(tmp_path / "a.jsonl"))
    tools = [r["tool"] for r in p["tools"]["rules"]] + ["unknown.tool"]
    for _ in range(300):
        r = {k: rnd.choice(JUNK) for k in rnd.sample(REQ_KEYS, rnd.randint(0, len(REQ_KEYS)))}
        if rnd.random() < 0.6:
            r["type"] = rnd.choice(["prompt", "response", "tool_call", "tool_output"])
        if rnd.random() < 0.5:
            r["tool"] = rnd.choice(tools)
        d = e.evaluate(r)
        json.dumps(d.to_dict(), default=str)
        if not isinstance(r.get("identity"), dict):
            assert d.decision == "DENY"     # identity is required by every pack: junk never gets through
    assert e.audit.verify() == (True, "ok")


def test_advisor_never_raises_on_junk_profiles():
    rnd = random.Random(7)
    keys = list(PROFILE_FIELDS) + ["limits", "allowed_roles", "approver_roles", "tenant", "owner", "agent_name",
                                   "allowed_link_domains", "synthetic"]
    for _ in range(150):
        prof = {k: rnd.choice(JUNK) for k in rnd.sample(keys, rnd.randint(0, len(keys)))}
        a = advise(prof)
        json.dumps(a)
        assert a["policy_validation"]["valid"] and a["policy"]["status"] == "draft"
    for bad in (None, [], "profile", 42):
        assert advise(bad)["policy"]["status"] == "draft"


def test_advisor_ignores_invalid_declared_parameters():
    prof = copy.deepcopy(CUSTOMER_SUPPORT_PROFILE)
    prof["tools"][0]["parameters"] = {"order_id": {"type": "string", "regex": "([bad"}}
    prof["tools"][3]["parameters"] = {"amount": {"type": "string"}}   # non-numeric amount on a payment tool
    a = advise(prof)
    assert a["policy_validation"]["valid"]
    assert any("parameters were invalid" in x["why"] for x in a["assumptions"])
    rules = {r["tool"]: r for r in a["policy"]["tools"]["rules"]}
    assert rules["crm.lookup_order"]["additional_parameters"] is True  # strictness dropped, and flagged
    assert "max" not in rules["payments.issue_refund"]["parameters"]["amount"]
