"""Shared helpers for policy-engine and Runtime Shield tests (imported by conftest and test modules)."""
from __future__ import annotations

import copy

from veritrail_common.audit import AuditLog
from veritrail_policy.engine import PolicyEngine

CTX = {"agent_name": "test-agent", "environment": "production", "risk_tier": "Medium", "model": "test-model",
       "tenant": "acme"}
IDENTITY = {"sub": "user-1", "tenant_id": "acme", "roles": ["support_agent"], "iss": "https://idp.example.com/"}
APPROVER = {"name": "Dana Lead", "role": "Team Lead"}


def _base_policy() -> dict:
    return {
        "schema_version": "veritrail.policy/v1",
        "policy_id": "pol-test-agent",
        "policy_name": "Test Agent Runtime Policy",
        "version": "1.2.0",
        "status": "draft",
        "owner": "AI System Owner",
        "applies_to": {"agent_name": ["test-*"], "environment": ["staging", "production"],
                       "risk_tier": ["Medium", "High"], "tenant": ["*"], "model": ["*"]},
        "rollout": {"mode": "enforce"},
        "identity": {"required": True, "required_claims": ["sub", "tenant_id", "roles"],
                     "allowed_roles": ["support_agent", "admin"], "tenant_binding": True},
        "tools": {
            "default_action": "DENY",
            "deny_list": ["shell.exec"],
            "rules": [
                {"id": "tool.crm-lookup", "tool": "crm.lookup", "operation": "read", "action": "ALLOW",
                 "scopes": ["orders:read"],
                 "parameters": {"order_id": {"type": "string", "required": True, "regex": "^ORD-[0-9]{6}$"}},
                 "citations": ["IS-11"]},
                {"id": "tool.refund", "tool": "payments.refund", "operation": "payment", "action": "ALLOW",
                 "scopes": ["refunds:create"],
                 "parameters": {"amount": {"type": "number", "required": True, "min": 0.01, "max": 500},
                                "currency": {"type": "string", "enum": ["USD", "EUR"]}},
                 "require_approval_if": [{"param": "amount", "op": "gt", "value": 50}],
                 "approval_roles": ["Team Lead"], "max_calls_per_session": 2,
                 "citations": ["IS-11", "IS-13"]},
                {"id": "tool.email-send", "tool": "email.send", "operation": "external_send", "action": "ALLOW",
                 "parameters": {"to": {"type": "string", "required": True, "domain_allow_list": ["example.com"]},
                                "body": {"type": "string", "max_length": 2000}},
                 "allow_pii_entities": ["email"], "citations": ["IS-11", "IS-04"]},
                {"id": "tool.records-delete", "tool": "records.delete", "operation": "delete",
                 "action": "REQUIRE_HUMAN_APPROVAL", "approval_roles": ["Data Owner"],
                 "parameters": {"record_id": {"type": "string", "required": True}},
                 "citations": ["IS-13"]},
                {"id": "tool.fraud-review", "tool": "fraud.review", "operation": "read", "action": "ESCALATE",
                 "additional_parameters": True, "citations": ["IS-09"]},
                {"id": "tool.admin", "tool": "admin.console", "operation": "write", "action": "DENY"},
                {"id": "tool.notes", "tool": "notes.search", "operation": "read", "action": "ALLOW",
                 "allowed_roles": ["admin"], "additional_parameters": True},
            ],
        },
        "content": {
            "max_input_chars": 5000,
            "pii_redaction": {"enabled": True, "entities": ["email", "payment_card", "us_ssn", "iban", "phone"],
                              "apply_to": ["prompt", "response", "tool_params", "tool_output"], "action": "REDACT"},
            "prompt_injection": {"enabled": True, "apply_to": ["prompt", "tool_output", "tool_params"],
                                 "action": "DENY", "decode_obfuscation": True},
            "jailbreak": {"enabled": True, "apply_to": ["prompt"], "action": "DENY"},
            "transforms": [
                {"id": "transform.urls", "type": "strip_unapproved_urls", "apply_to": ["response"],
                 "domain_allow_list": ["example.com"]},
            ],
        },
        "limits": {"requests_per_minute": 1000, "tool_calls_per_session": 1000, "tokens_per_day": 10_000_000,
                   "cost_per_month_usd": 1000, "action_on_breach": "RATE_LIMIT", "alert_at_percent": 80},
        "logging": {"immutable_audit": True, "prompt_logging": "redacted", "response_logging": "redacted",
                    "tool_param_logging": "redacted"},
        "kill_switch": {"enabled": True, "engaged": False, "scopes": ["agent", "tool", "model", "tenant"],
                        "engaged_targets": [], "authorized_roles": ["Security Operations Lead"],
                        "target_time_to_disable_minutes": 5},
        "rollback": {"previous_version": "1.1.0", "strategy": "revert_to_previous"},
        "shadow_mode": {"enabled": False},
        "evidence_retention_days": 365,
        "approval": {"required_approver_roles": ["AI System Owner", "Security Lead"], "min_approvers": 2,
                     "separation_of_duties": True, "approved_by": [], "approved_at": None},
        "escalation": {"queue": "sec-review", "contact_role": "Security Operations Lead"},
        "change_history": [{"version": "1.2.0", "date": "2026-10-21", "author": "Pat Author",
                            "change_type": "modified", "summary": "test policy"}],
        "citations": ["IS-04", "IS-11", "IS-12", "IS-13", "IS-15", "IS-16", "SE-08"],
    }


def req(rtype: str = "prompt", content: str | None = "Hello", **kw) -> dict:
    r = {"type": rtype, "identity": dict(IDENTITY), "session": {"id": "s1"}}
    if rtype == "tool_call":
        r.update(tool=kw.pop("tool"), params=kw.pop("params", {}))
    else:
        r["content"] = content
    r.update(kw)
    return r


class FakeClock:
    def __init__(self, t: float = 1_790_000_000.0):
        self.t = t

    def __call__(self) -> float:
        return self.t

    def advance(self, s: float) -> None:
        self.t += s
