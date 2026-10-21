"""AEGIS policy decision engine.

"AI proposes. AEGIS evaluates. Approved actions execute."

``PolicyEngine(policy).evaluate(request) -> Decision`` evaluates a prompt, model
response, tool call or tool output against one runtime policy.

Evaluation order (see docs/RUNTIME_SHIELD_DESIGN.md §4):

1. request shape (malformed => DENY)
2. kill switch (policy-level, targeted, runtime-engaged, or rollout mode ``contain``)
   — overrides everything, including observe mode
3. scope (``applies_to``) — out-of-scope requests are default-denied
4. identity (required claims, issuer, roles, tenant binding)
5. payload size (oversize => DENY, content not scanned or logged)
6. content detectors (prompt injection, jailbreak, PII)
7. tool rules (deny-list, default-deny, roles, scopes, parameters, approval conditions)
8. limits (requests/min, tool calls/session, tokens/day, cost/month)
9. transforms (responses)
10. verdicts are combined by precedence into the *would-be* decision; a valid,
    single-use human approval bound to the exact action converts
    REQUIRE_HUMAN_APPROVAL to ALLOW
11. the rollout mode maps would-be => *effective* decision
12. every evaluation is appended to the hash-chained ``AuditLog`` with redacted content only
"""
from __future__ import annotations

import copy
import fnmatch
import hashlib
import json
import re
import threading
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from aegis_common.audit import AuditLog
from aegis_common.ids import new_id

from . import detectors
from .constants import (
    ALLOW,
    BASE_CITATIONS,
    BLOCKING_DECISIONS,
    CONTAIN,
    DECISION_PRECEDENCE,
    DENY,
    ENFORCE,
    ESCALATE,
    KILL_SWITCH_SCOPES,
    OBSERVE,
    PERMITTING_DECISIONS,
    PROTECT,
    RATE_LIMIT,
    REDACT,
    REQUEST_TYPES,
    REQUIRE_HUMAN_APPROVAL,
    TRANSFORM,
    WARN,
)
from .params import condition_met, domain_allowed, validate_params
from .schema import validate_policy

LOG_CONTENT_MAX_CHARS = 4000
DEFAULT_PII_SURFACES = ["prompt", "response", "tool_output"]
DEFAULT_INJECTION_SURFACES = ["prompt", "tool_output"]
DEFAULT_JAILBREAK_SURFACES = ["prompt"]
_SURFACE = {"prompt": "prompt", "response": "response", "tool_output": "tool_output", "tool_call": "tool_params"}


class PolicyValidationError(ValueError):
    def __init__(self, errors: list[str]):
        super().__init__("invalid policy: " + "; ".join(errors[:10]))
        self.errors = errors


@dataclass
class Verdict:
    decision: str
    rule_id: str
    reason: str
    citations: tuple[str, ...] = ()


@dataclass
class Decision:
    decision: str                       # effective decision under the rollout mode
    would_be_decision: str              # decision the policy would take under full enforcement
    mode: str
    reasons: list[str]
    matched_rules: list[str]
    citations: list[str]
    payload: Any                        # what the caller may forward (None when blocked)
    redacted_payload: Any               # payload after policy redaction/transforms (always computed)
    warning: bool = False
    kill_switch: bool = False
    findings: dict = field(default_factory=dict)
    policy_id: str = ""
    policy_version: str = ""
    policy_status: str = ""
    simulation: bool = False            # True when the policy is not 'active' (draft/in_review/approved)
    approval_request_id: str | None = None
    shadow: dict | None = None
    trace_id: str = ""
    audit_id: str = ""
    latency_ms: float = 0.0

    @property
    def allowed(self) -> bool:
        """True when the caller may proceed (using ``payload``)."""
        return self.decision in PERMITTING_DECISIONS

    @property
    def enforced(self) -> bool:
        return self.decision == self.would_be_decision

    def to_dict(self) -> dict:
        d = asdict(self)
        d["allowed"] = self.allowed
        return d


def _canonical(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


_TRACE_RE = re.compile(r"^[A-Za-z0-9_.:\-]{1,128}$")
# Markdown links/images and bare URLs in responses (markdown-image exfiltration defence).
_URL_RE = re.compile(r"(!?\[[^\]]*\]\()?(https?://[^\s)\]>\"']+)(\))?", re.IGNORECASE)


def _clean_str(v: Any, max_len: int = 256) -> str | None:
    return v[:max_len] if isinstance(v, str) and v else None


def _clean_num(v: Any) -> float | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or v < 0 or v == float("inf"):
        return None
    return v


def coerce_request(raw: Any) -> tuple[dict, str | None]:
    """Normalize an untrusted request into well-typed fields. Returns (request, shape_problem).

    Unknown/ill-typed optional fields are dropped; an ill-typed *required* field produces a
    shape problem so the engine fails closed (DENY) instead of raising.
    """
    if not isinstance(raw, dict):
        return coerce_request({})[0], "request must be an object"
    problem = None
    rtype = raw.get("type")
    if not (isinstance(rtype, str) and rtype in REQUEST_TYPES):
        problem = "request type must be one of " + ", ".join(REQUEST_TYPES)
        rtype = None
    r: dict = {"type": rtype, "content": raw.get("content"), "tool": raw.get("tool"), "params": raw.get("params")}
    tid = raw.get("trace_id")
    r["trace_id"] = tid if isinstance(tid, str) and _TRACE_RE.match(tid) else None
    ident = raw.get("identity")
    if isinstance(ident, dict):
        clean = {}
        for k, v in ident.items():
            if not isinstance(k, str):
                continue
            if k in ("roles", "groups", "scopes"):
                clean[k] = [x for x in v if isinstance(x, str)] if isinstance(v, list) else \
                    [v] if isinstance(v, str) and v else []
            elif isinstance(v, (str, int, float)) and not isinstance(v, bool):
                clean[k] = v if not isinstance(v, str) else v[:512]
            elif isinstance(v, bool):
                clean[k] = v
        r["identity"] = clean
    else:
        r["identity"] = {}
    ctx = raw.get("context")
    r["context"] = {k: v for k, v in ctx.items() if isinstance(k, str) and isinstance(v, str)} \
        if isinstance(ctx, dict) else {}
    sess = raw.get("session")
    sess = sess if isinstance(sess, dict) else {}
    tc = sess.get("tool_calls")
    r["session"] = {"id": _clean_str(sess.get("id")),
                    "tool_calls": int(tc) if isinstance(tc, int) and not isinstance(tc, bool) and tc > 0 else 0}
    usage = raw.get("usage")
    usage = usage if isinstance(usage, dict) else {}
    r["usage"] = {"tokens": _clean_num(usage.get("tokens")), "cost_usd": _clean_num(usage.get("cost_usd"))}
    r["approval_id"] = _clean_str(raw.get("approval_id"), 64)
    scopes = raw.get("requested_scopes")
    if scopes is None:
        r["requested_scopes"] = []
    elif isinstance(scopes, list) and all(isinstance(x, str) for x in scopes):
        r["requested_scopes"] = scopes
    else:
        r["requested_scopes"] = []
        problem = problem or "requested_scopes must be a list of strings"
    return r, problem


def _match_any(value: Any, patterns: list[str]) -> bool:
    if "*" in patterns:
        return True
    if value is None:
        return False
    return any(fnmatch.fnmatchcase(str(value), str(p)) for p in patterns)


def apply_mode(mode: str, would_be: str, has_redaction: bool, has_transform: bool) -> tuple[str, bool]:
    """Map a would-be decision to the effective decision for a rollout mode -> (decision, warning)."""
    if mode == CONTAIN:
        return DENY, False
    if mode == OBSERVE:
        return ALLOW, False
    if mode == WARN:
        return ALLOW, would_be != ALLOW
    if mode == PROTECT:
        eff = REDACT if has_redaction else TRANSFORM if has_transform else ALLOW
        return eff, would_be in BLOCKING_DECISIONS
    if mode == ENFORCE:
        return would_be, False
    raise ValueError(f"unknown rollout mode {mode!r}")


class PolicyEngine:
    """Evaluate requests against one AEGIS runtime policy.

    Parameters
    ----------
    policy: policy document (validated unless ``validate=False``).
    audit_log: ``AuditLog`` instance or path. Defaults to ``var/audit/runtime_shield.jsonl``.
    clock: injectable time source (seconds since epoch) for deterministic tests.
    default_context: context merged under each request's ``context`` (agent_name, environment, ...).
    approval_ttl_seconds: lifetime of a granted, unused human approval.
    """

    def __init__(self, policy: dict, audit_log: AuditLog | str | Path | None = None, *,
                 clock: Callable[[], float] = time.time, default_context: dict | None = None,
                 validate: bool = True, approval_ttl_seconds: int = 3600):
        if validate:
            errors = validate_policy(policy)
            if errors:
                raise PolicyValidationError(errors)
        self.policy = copy.deepcopy(policy)
        if audit_log is None:
            from aegis_common.paths import VAR_DIR
            audit_log = VAR_DIR / "audit" / "runtime_shield.jsonl"
        self.audit = audit_log if isinstance(audit_log, AuditLog) else AuditLog(audit_log)
        self.clock = clock
        self.default_context = dict(default_context or {})
        self.approval_ttl_seconds = approval_ttl_seconds
        self._lock = threading.RLock()
        self._req_times: dict[tuple, deque] = defaultdict(deque)
        self._session_tool_calls: dict[str, int] = defaultdict(int)
        self._session_tool_calls_by_tool: dict[tuple, int] = defaultdict(int)
        self._tokens: dict[tuple, int] = defaultdict(int)
        self._cost: dict[tuple, float] = defaultdict(float)
        self._runtime_kills: list[dict] = []
        self._pending: dict[str, dict] = {}
        self._approved: dict[str, dict] = {}
        self._rules_by_tool = {r["tool"]: r for r in self.policy["tools"]["rules"]}

    # ------------------------------------------------------------------ helpers
    @property
    def policy_ref(self) -> str:
        return f"{self.policy['policy_id']}@{self.policy['version']}"

    def _now_iso(self) -> str:
        return datetime.fromtimestamp(self.clock(), tz=timezone.utc).isoformat()

    def _scope_key(self, ctx: dict, identity: dict) -> tuple:
        return (ctx.get("tenant") or identity.get("tenant_id") or "-", ctx.get("agent_name") or "-")

    # ------------------------------------------------------------ kill switch
    def engage_kill_switch(self, scope: str, target: str, actor: dict, reason: str) -> dict:
        """Engage a runtime kill switch. ``actor`` = {name, role}; role must be authorized."""
        ks = self.policy["kill_switch"]
        if scope not in KILL_SWITCH_SCOPES:
            raise ValueError(f"unknown kill-switch scope {scope!r}")
        if (actor or {}).get("role") not in ks["authorized_roles"]:
            self.audit.append("policy.kill_switch.engage", (actor or {}).get("name", "unknown"),
                              {"scope": scope, "target": target, "policy": self.policy_ref},
                              resource=f"policy:{self.policy_ref}", outcome="denied")
            raise PermissionError("actor role is not authorized to engage the kill switch")
        entry = {"scope": scope, "target": target, "reason": reason, "engaged_by": actor["name"],
                 "role": actor["role"], "engaged_at": self._now_iso()}
        with self._lock:
            self._runtime_kills.append(entry)
        self.audit.append("policy.kill_switch.engage", actor["name"], {**entry, "policy": self.policy_ref},
                          resource=f"policy:{self.policy_ref}")
        return entry

    def release_kill_switch(self, scope: str, target: str, actor: dict, reason: str) -> int:
        ks = self.policy["kill_switch"]
        if (actor or {}).get("role") not in ks["authorized_roles"]:
            raise PermissionError("actor role is not authorized to release the kill switch")
        with self._lock:
            before = len(self._runtime_kills)
            self._runtime_kills = [k for k in self._runtime_kills
                                   if not (k["scope"] == scope and k["target"] == target)]
            released = before - len(self._runtime_kills)
        self.audit.append("policy.kill_switch.release", actor["name"],
                          {"scope": scope, "target": target, "reason": reason, "released": released,
                           "policy": self.policy_ref}, resource=f"policy:{self.policy_ref}")
        return released

    def _kill_switch_match(self, ctx: dict, identity: dict, tool: str | None) -> str | None:
        ks = self.policy["kill_switch"]
        if ks.get("engaged"):
            return "kill switch engaged for the entire policy scope"
        values = {
            "agent": ctx.get("agent_name"),
            "tool": tool,
            "model": ctx.get("model"),
            "tenant": ctx.get("tenant") or identity.get("tenant_id"),
        }
        with self._lock:
            targets = list(ks.get("engaged_targets") or []) + list(self._runtime_kills)
        for t in targets:
            v = values.get(t["scope"])
            if t["target"] == "*" or (v is not None and fnmatch.fnmatchcase(str(v), t["target"])):
                if t["scope"] == "tool" and tool is None and t["target"] != "*":
                    continue
                return f"kill switch engaged for {t['scope']} '{t['target']}'"
        return None

    # --------------------------------------------------------------- approvals
    def _approval_key(self, request: dict, identity: dict) -> str:
        material = {
            "policy": self.policy_ref,
            "type": request.get("type"),
            "tool": request.get("tool"),
            "params": request.get("params"),
            "content_sha256": hashlib.sha256(str(request.get("content") or "").encode()).hexdigest(),
            "sub": identity.get("sub"),
            "session": (request.get("session") or {}).get("id"),
        }
        return "apr_" + hashlib.sha256(_canonical(material).encode()).hexdigest()[:24]

    def pending_approvals(self) -> list[dict]:
        with self._lock:
            return [dict(v, approval_request_id=k) for k, v in self._pending.items()]

    def approve(self, approval_request_id: str, approver: dict, note: str = "") -> dict:
        """Record a human approval for one exact pending action (single use).

        ``approver`` = {name, role, sub?}. The role must be in the rule's approval roles and
        the approver must not be the requesting identity (no self-approval).
        """
        with self._lock:
            pending = self._pending.get(approval_request_id)
        if not pending:
            raise KeyError("unknown or expired approval request")
        name, role = (approver or {}).get("name"), (approver or {}).get("role")
        problem = None
        if not name or not role:
            problem = "approver name and role are required"
        elif pending["approval_roles"] and role not in pending["approval_roles"]:
            problem = f"role '{role}' is not an authorized approver for this action"
        elif pending.get("requester") and pending["requester"] in (name, approver.get("sub")):
            problem = "self-approval is not permitted (separation of duties)"
        if problem:
            self.audit.append("policy.approval.grant", name or "unknown",
                              {"approval_request_id": approval_request_id, "policy": self.policy_ref,
                               "error": problem}, resource=f"policy:{self.policy_ref}", outcome="denied",
                              trace_id=pending.get("trace_id"))
            raise PermissionError(problem)
        record = {"approver": name, "role": role, "note": note, "approved_at": self.clock(),
                  "tool": pending.get("tool"), "trace_id": pending.get("trace_id")}
        with self._lock:
            self._pending.pop(approval_request_id, None)
            self._approved[approval_request_id] = record
        self.audit.append("policy.approval.grant", name,
                          {"approval_request_id": approval_request_id, "role": role, "note": note,
                           "tool": pending.get("tool"), "policy": self.policy_ref},
                          resource=f"policy:{self.policy_ref}", trace_id=pending.get("trace_id"))
        return record

    def reject(self, approval_request_id: str, approver: dict, reason: str) -> None:
        with self._lock:
            pending = self._pending.pop(approval_request_id, None)
        if not pending:
            raise KeyError("unknown or expired approval request")
        self.audit.append("policy.approval.reject", (approver or {}).get("name", "unknown"),
                          {"approval_request_id": approval_request_id, "role": (approver or {}).get("role"),
                           "reason": reason, "policy": self.policy_ref},
                          resource=f"policy:{self.policy_ref}", trace_id=pending.get("trace_id"))

    def _consume_approval(self, key: str, approval_id: str | None) -> dict | None:
        if not approval_id or approval_id != key:
            return None
        with self._lock:
            rec = self._approved.get(key)
            if not rec:
                return None
            if self.clock() - rec["approved_at"] > self.approval_ttl_seconds:
                self._approved.pop(key, None)
                return None
            return self._approved.pop(key)

    # ------------------------------------------------------------------ checks
    def _check_scope(self, ctx: dict) -> Verdict | None:
        applies = self.policy["applies_to"]
        for key, patterns in applies.items():
            if not _match_any(ctx.get(key), patterns):
                return Verdict(DENY, "scope.not_applicable",
                               f"request context '{key}' is outside this policy's applies_to; default-deny",
                               ("IS-12",))
        return None

    def _check_identity(self, identity: dict, ctx: dict) -> list[Verdict]:
        cfg = self.policy["identity"]
        out: list[Verdict] = []
        if not cfg.get("required"):
            return out
        if not identity or identity.get("authenticated") is False:
            return [Verdict(DENY, "identity.unauthenticated", "authenticated identity required", ("IS-11",))]
        for claim in cfg.get("required_claims") or []:
            if identity.get(claim) in (None, "", []):
                out.append(Verdict(DENY, "identity.missing_claim", f"required identity claim '{claim}' missing",
                                   ("IS-11",)))
        issuers = cfg.get("allowed_issuers") or []
        if issuers and identity.get("iss") not in issuers:
            out.append(Verdict(DENY, "identity.issuer", "identity issuer is not trusted by this policy", ("IS-11",)))
        roles = cfg.get("allowed_roles") or []
        if roles and not set(identity.get("roles") or []) & set(roles):
            out.append(Verdict(DENY, "identity.role", "identity has no role permitted by this policy", ("IS-11",)))
        if cfg.get("tenant_binding") and ctx.get("tenant") and identity.get("tenant_id") \
                and ctx["tenant"] != identity["tenant_id"]:
            out.append(Verdict(DENY, "identity.tenant_mismatch",
                               "identity tenant does not match request tenant (cross-tenant access)", ("IS-11",)))
        return out

    def _check_content(self, text: str, surface: str, verdicts: list[Verdict], findings: dict) -> tuple[str, bool]:
        """Run detectors on text; returns (redacted_text, redaction_applied)."""
        content = self.policy["content"]
        inj = content["prompt_injection"]
        if inj.get("enabled") and surface in (inj.get("apply_to") or DEFAULT_INJECTION_SURFACES):
            hits = detectors.scan_injection(text, decode=inj.get("decode_obfuscation", True))
            if hits:
                findings["prompt_injection"] = hits
                verdicts.append(Verdict(inj["action"], f"content.prompt_injection.{surface}",
                                        f"prompt-injection signals detected in {surface}: {', '.join(hits)}",
                                        ("IS-12", "IS-14")))
        jb = content["jailbreak"]
        if jb.get("enabled") and surface in (jb.get("apply_to") or DEFAULT_JAILBREAK_SURFACES):
            hits = detectors.scan_jailbreak(text, decode=jb.get("decode_obfuscation", True))
            if hits:
                findings["jailbreak"] = hits
                verdicts.append(Verdict(jb["action"], f"content.jailbreak.{surface}",
                                        f"jailbreak signals detected in {surface}: {', '.join(hits)}",
                                        ("IS-12", "IS-14")))
        pii = content["pii_redaction"]
        if pii.get("enabled") and surface in (pii.get("apply_to") or DEFAULT_PII_SURFACES):
            r = detectors.redact_text(text, pii.get("entities") or [])
            if r.findings:
                findings["pii"] = r.entity_counts
                action = pii["action"]
                verdicts.append(Verdict(action, f"content.pii.{surface}",
                                        f"sensitive data detected in {surface}: "
                                        + ", ".join(f"{k}×{v}" for k, v in sorted(r.entity_counts.items())),
                                        ("IS-04",)))
                return r.text, True
        return text, False

    def _check_tool(self, request: dict, identity: dict, verdicts: list[Verdict], findings: dict,
                    session_id: str | None) -> tuple[dict | None, list[str]]:
        """Tool rules. Returns (rule or None, approval roles)."""
        tools = self.policy["tools"]
        tool = request.get("tool")
        params = request.get("params") or {}
        if tool in (tools.get("deny_list") or []):
            verdicts.append(Verdict(DENY, "tools.deny_list", f"tool '{tool}' is on the policy deny-list", ("IS-11",)))
            return None, []
        rule = self._rules_by_tool.get(tool)
        if rule is None:
            default = tools["default_action"]
            esc = self.policy.get("escalation") or {}
            roles = [esc["contact_role"]] if esc.get("contact_role") else []
            verdicts.append(Verdict(default, "tools.default",
                                    f"tool '{tool}' is not declared in the policy; default action {default} "
                                    "(default-deny for unknown tools)", ("IS-11", "EI-07")))
            return None, roles
        rid = rule["id"]
        cits = tuple(rule.get("citations") or ("IS-11",))
        if rule["action"] == DENY:
            verdicts.append(Verdict(DENY, rid, f"tool '{tool}' is denied by rule {rid}", cits))
        elif rule["action"] == ESCALATE:
            verdicts.append(Verdict(ESCALATE, rid, f"tool '{tool}' requires escalation by rule {rid}", cits))
        allowed_roles = rule.get("allowed_roles") or []
        if allowed_roles and not set(identity.get("roles") or []) & set(allowed_roles):
            verdicts.append(Verdict(DENY, f"{rid}.roles", f"identity lacks a role permitted to call '{tool}'", cits))
        req_scopes = request.get("requested_scopes") or []
        if req_scopes:
            excess = sorted(set(req_scopes) - set(rule.get("scopes") or []))
            if excess:
                verdicts.append(Verdict(DENY, f"{rid}.scopes",
                                        f"requested scope(s) {excess} exceed least-privilege scopes for '{tool}'",
                                        ("IS-11",)))
        problems = validate_params(params, rule.get("parameters") or {}, rule.get("additional_parameters", False))
        if problems:
            findings["parameter_violations"] = [code for code, _ in problems]
        for code, msg in problems:
            verdicts.append(Verdict(DENY, f"{rid}.params.{code}", msg, ("IS-11", "IS-12")))
        limit = rule.get("max_calls_per_session")
        if limit and session_id is not None:
            used = self._session_tool_calls_by_tool[(session_id, tool)]
            if used >= limit:
                verdicts.append(Verdict(RATE_LIMIT, f"{rid}.max_calls_per_session",
                                        f"tool '{tool}' reached {limit} calls this session", ("IS-16",)))
        approval_cits = tuple(sorted(set(cits) | {"IS-13"}))
        if rule["action"] == REQUIRE_HUMAN_APPROVAL:
            verdicts.append(Verdict(REQUIRE_HUMAN_APPROVAL, rid,
                                    f"tool '{tool}' ({rule['operation']}) requires human approval", approval_cits))
        for i, cond in enumerate(rule.get("require_approval_if") or []):
            met, reason = condition_met(params, cond)
            if met:
                verdicts.append(Verdict(REQUIRE_HUMAN_APPROVAL, f"{rid}.approval_if[{i}]",
                                        f"human approval required: {reason}", approval_cits))
        if rule["action"] == ALLOW and not any(v.rule_id.startswith(rid) and v.decision != ALLOW for v in verdicts):
            verdicts.append(Verdict(ALLOW, rid, f"tool '{tool}' permitted by rule {rid}", cits))
        return rule, list(rule.get("approval_roles") or [])

    def _check_limits(self, request: dict, ctx: dict, identity: dict, session_id: str | None,
                      verdicts: list[Verdict], findings: dict, est_tokens: int, cost: float) -> None:
        lim = self.policy["limits"]
        action = lim.get("action_on_breach", RATE_LIMIT)
        alert_pct = lim.get("alert_at_percent")
        now = self.clock()
        scope = self._scope_key(ctx, identity)
        alerts = []

        def near(name, used, limit):
            if alert_pct and limit and used / limit * 100 >= alert_pct:
                alerts.append(f"{name} at {round(used / limit * 100)}% of limit")

        with self._lock:
            key = scope + (identity.get("sub") or "anonymous",)
            dq = self._req_times[key]
            while dq and now - dq[0] >= 60:
                dq.popleft()
            if len(dq) >= lim["requests_per_minute"]:
                verdicts.append(Verdict(action, "limits.requests_per_minute",
                                        f"rate limit of {lim['requests_per_minute']} requests/minute exceeded",
                                        ("IS-16",)))
            dq.append(now)
            near("requests_per_minute", len(dq), lim["requests_per_minute"])

            if request.get("type") == "tool_call":
                supplied = request["session"]["tool_calls"]
                used = max(self._session_tool_calls[session_id] if session_id else 0, supplied)
                if used >= lim["tool_calls_per_session"]:
                    verdicts.append(Verdict(action, "limits.tool_calls_per_session",
                                            f"session reached {lim['tool_calls_per_session']} tool calls",
                                            ("IS-16",)))
                near("tool_calls_per_session", used + 1, lim["tool_calls_per_session"])

            day = time.strftime("%Y-%m-%d", time.gmtime(now))
            used_tokens = self._tokens[scope + (day,)]
            if used_tokens + est_tokens > lim["tokens_per_day"]:
                verdicts.append(Verdict(action, "limits.tokens_per_day",
                                        f"token budget of {lim['tokens_per_day']}/day would be exceeded", ("IS-16",)))
            near("tokens_per_day", used_tokens + est_tokens, lim["tokens_per_day"])

            month = day[:7]
            used_cost = self._cost[scope + (month,)]
            if cost and used_cost + cost > lim["cost_per_month_usd"]:
                verdicts.append(Verdict(action, "limits.cost_per_month_usd",
                                        f"monthly cost budget of USD {lim['cost_per_month_usd']} would be exceeded",
                                        ("IS-16",)))
            near("cost_per_month_usd", used_cost + cost, lim["cost_per_month_usd"])
        if alerts:
            findings["limit_alerts"] = alerts

    def _record_usage(self, request: dict, ctx: dict, identity: dict, session_id: str | None,
                      est_tokens: int, cost: float) -> None:
        now = self.clock()
        scope = self._scope_key(ctx, identity)
        day = time.strftime("%Y-%m-%d", time.gmtime(now))
        with self._lock:
            if request.get("type") == "tool_call" and session_id:
                self._session_tool_calls[session_id] += 1
                self._session_tool_calls_by_tool[(session_id, request.get("tool"))] += 1
            self._tokens[scope + (day,)] += est_tokens
            self._cost[scope + (day[:7],)] += cost

    def _apply_transforms(self, text: str, verdicts: list[Verdict]) -> tuple[str, bool]:
        changed = False
        for t in self.policy["content"].get("transforms") or []:
            if "response" not in (t.get("apply_to") or ["response"]):
                continue
            before = text
            if t["type"] == "strip_unapproved_urls":
                allow = t["domain_allow_list"]

                def _sub(m):
                    return m.group(0) if domain_allowed(m.group(2), allow) else "[link removed by policy]"
                text = _URL_RE.sub(_sub, text)
            elif t["type"] == "truncate" and len(text) > t["max_chars"]:
                text = text[: t["max_chars"]] + " [truncated by policy]"
            elif t["type"] == "append_disclosure" and t["text"] not in text:
                text = f"{text.rstrip()}\n\n{t['text']}"
            if text != before:
                changed = True
                verdicts.append(Verdict(TRANSFORM, t["id"], f"response transformed by {t['type']}", ("IS-12",)))
        return text, changed

    # ------------------------------------------------------------- evaluation
    def evaluate(self, request: dict) -> Decision:
        """Evaluate one request.

        request keys:
          type: prompt | response | tool_call | tool_output
          content: str (prompt / response / tool_output)
          tool, params, requested_scopes: tool calls
          identity: {sub, tenant_id, roles, iss, authenticated}
          context: {agent_name, environment, risk_tier, tenant, model}
          session: {id, tool_calls}
          usage: {tokens, cost_usd}
          approval_id: id returned by a previous REQUIRE_HUMAN_APPROVAL decision, once approved
          trace_id: optional correlation id
        """
        t0 = time.perf_counter()
        request, shape_problem = coerce_request(request)
        trace_id = request.get("trace_id") or new_id("trc")
        ctx = {**self.default_context, **request["context"]}
        identity = request["identity"]
        if not ctx.get("tenant") and identity.get("tenant_id"):
            ctx["tenant"] = identity["tenant_id"]
        rtype = request.get("type")
        tool = request.get("tool") if rtype == "tool_call" else None
        session_id = request["session"]["id"]
        mode = self.policy["rollout"]["mode"]
        verdicts: list[Verdict] = []
        findings: dict = {}
        content_cfg = self.policy["content"]
        max_chars = content_cfg["max_input_chars"]

        # Original payload.
        if rtype == "tool_call":
            original: Any = {"tool": tool, "params": request.get("params") if request.get("params") is not None else {}}
        else:
            original = request.get("content")
        working = copy.deepcopy(original)
        redaction_applied = transform_applied = False
        oversize = False

        # 1. shape
        malformed = shape_problem
        if malformed:
            pass
        elif rtype == "tool_call" and (not isinstance(tool, str) or not tool):
            malformed = "tool_call requires a tool name"
        elif rtype == "tool_call" and not isinstance(original["params"], dict):
            malformed = "tool_call params must be an object"
        elif rtype != "tool_call" and not isinstance(original, str):
            malformed = f"{rtype} content must be a string"
        if malformed:
            verdicts.append(Verdict(DENY, "request.malformed", malformed, ("IS-12",)))

        # 2. kill switch (overrides everything, including observe mode)
        kill_reason = self._kill_switch_match(ctx, identity, tool)
        if mode == CONTAIN and not kill_reason:
            kill_reason = "rollout mode 'contain': kill switch active for the whole policy scope"
        if kill_reason:
            verdicts.append(Verdict(DENY, "kill_switch", kill_reason, ("IS-15",)))

        if not malformed and not kill_reason:
            # 3-4. scope + identity
            v = self._check_scope(ctx)
            if v:
                verdicts.append(v)
            verdicts.extend(self._check_identity(identity, ctx))

            # 5. size
            size = len(original) if isinstance(original, str) else len(_canonical(original))
            if size > max_chars:
                oversize = True
                findings["oversize_chars"] = size
                verdicts.append(Verdict(DENY, "content.oversize",
                                        f"payload of {size} characters exceeds max_input_chars {max_chars}",
                                        ("IS-12", "IS-16")))
            else:
                surface = _SURFACE[rtype]
                if rtype == "tool_call":
                    # injection / jailbreak detectors over string params, PII redaction per rule exemptions
                    text_blob = " \n".join(str(x) for x in _iter_strings(original["params"]))
                    sub_findings: dict = {}
                    self._check_content_detectors_only(text_blob, surface, verdicts, sub_findings)
                    findings.update(sub_findings)
                    rule, approval_roles = self._check_tool(request, identity, verdicts, findings, session_id)
                    pii = content_cfg["pii_redaction"]
                    if pii.get("enabled") and surface in (pii.get("apply_to") or DEFAULT_PII_SURFACES):
                        exempt = (rule or {}).get("allow_pii_entities") or []
                        red, counts = detectors.redact_structure(original["params"], pii.get("entities") or [],
                                                                 exempt)
                        if counts:
                            findings["pii"] = counts
                            redaction_applied = True
                            working = {"tool": tool, "params": red}
                            verdicts.append(Verdict(pii["action"], "content.pii.tool_params",
                                                    "sensitive data detected in tool parameters: "
                                                    + ", ".join(f"{k}×{v}" for k, v in sorted(counts.items())),
                                                    ("IS-04",)))
                else:
                    approval_roles = []
                    working, redaction_applied = self._check_content(original, surface, verdicts, findings)
                    if rtype == "response":
                        working, transform_applied = self._apply_transforms(working, verdicts)

        if malformed or kill_reason or oversize:
            approval_roles = []

        # 8. limits (skipped for killed / malformed requests: they never execute)
        usage = request["usage"]
        est_tokens = int(usage["tokens"] if usage["tokens"] is not None else
                         (len(original) // 4 + 1 if isinstance(original, str) else 0))
        cost = float(usage["cost_usd"] or 0.0)
        if not malformed and not kill_reason:
            self._check_limits(request, ctx, identity, session_id, verdicts, findings, est_tokens, cost)

        # 10. combine
        would_be = max((v.decision for v in verdicts), key=lambda d: DECISION_PRECEDENCE[d], default=ALLOW)
        approval_key = None
        approval_note = None
        if would_be == REQUIRE_HUMAN_APPROVAL:
            approval_key = self._approval_key(request, identity)
            rec = self._consume_approval(approval_key, request.get("approval_id"))
            if rec:
                approval_note = f"human approval granted by {rec['approver']} ({rec['role']})"
                verdicts = [Verdict(ALLOW, v.rule_id, v.reason + " — approved", v.citations)
                            if v.decision == REQUIRE_HUMAN_APPROVAL else v for v in verdicts]
                verdicts.append(Verdict(ALLOW, "approval.granted", approval_note, ("IS-13",)))
                would_be = max((v.decision for v in verdicts), key=lambda d: DECISION_PRECEDENCE[d])
                approval_key = None
            elif request.get("approval_id"):
                verdicts.append(Verdict(REQUIRE_HUMAN_APPROVAL, "approval.invalid",
                                        "supplied approval does not match this exact action, was already used, "
                                        "or has expired", ("IS-13",)))

        # 11. rollout mode. Kill switch and malformed requests fail closed in every mode.
        if kill_reason or malformed:
            effective, warning = DENY, False
            would_be = DENY
        else:
            effective, warning = apply_mode(mode, would_be, redaction_applied, transform_applied)
        if effective not in PERMITTING_DECISIONS:
            forward = None
        elif mode in (OBSERVE, WARN):
            forward = original
        else:
            forward = working

        shadow = None
        sm = self.policy.get("shadow_mode") or {}
        if sm.get("enabled") and not kill_reason and not malformed:
            s_mode = sm.get("evaluate_as", ENFORCE)
            s_dec, s_warn = apply_mode(s_mode, would_be, redaction_applied, transform_applied)
            shadow = {"evaluate_as": s_mode, "decision": s_dec, "warning": s_warn}

        if effective == REQUIRE_HUMAN_APPROVAL and approval_key:
            if not approval_roles:
                esc = self.policy.get("escalation") or {}
                approval_roles = [esc["contact_role"]] if esc.get("contact_role") else \
                    list(self.policy["approval"]["required_approver_roles"])
            with self._lock:
                self._pending[approval_key] = {
                    "tool": tool, "request_type": rtype, "approval_roles": approval_roles,
                    "requester": identity.get("sub"), "trace_id": trace_id, "created_at": self.clock(),
                    "reasons": [v.reason for v in verdicts if v.decision == REQUIRE_HUMAN_APPROVAL],
                }
        else:
            approval_key = None

        if effective in PERMITTING_DECISIONS and not kill_reason:
            self._record_usage(request, ctx, identity, session_id, est_tokens, cost)

        reasons = []
        for v in verdicts:
            if v.reason not in reasons:
                reasons.append(v.reason)
        if not kill_reason and not malformed and effective != would_be:
            reasons.append(f"rollout mode '{mode}': would-be decision {would_be} not enforced; effective {effective}")
        if self.policy["status"] != "active":
            reasons.append(f"policy status is '{self.policy['status']}': evaluation is a simulation until a human "
                           "approves and activates the policy")
        matched = []
        for v in verdicts:
            if v.rule_id not in matched:
                matched.append(v.rule_id)
        cits = set(BASE_CITATIONS)
        for v in verdicts:
            cits.update(v.citations)

        decision = Decision(
            decision=effective, would_be_decision=would_be, mode=mode, reasons=reasons, matched_rules=matched,
            citations=sorted(cits), payload=forward,
            redacted_payload=None if oversize else working,
            warning=warning, kill_switch=bool(kill_reason), findings=findings,
            policy_id=self.policy["policy_id"], policy_version=self.policy["version"],
            policy_status=self.policy["status"], simulation=self.policy["status"] != "active",
            approval_request_id=approval_key, shadow=shadow, trace_id=trace_id,
        )
        decision.latency_ms = round((time.perf_counter() - t0) * 1000, 3)
        rec = self._audit(decision, ctx, rtype, tool, original, oversize, identity)
        decision.audit_id = rec["id"]
        return decision

    def _check_content_detectors_only(self, text: str, surface: str, verdicts: list[Verdict], findings: dict) -> None:
        content = self.policy["content"]
        for key, scan, default_surfaces in (
            ("prompt_injection", detectors.scan_injection, DEFAULT_INJECTION_SURFACES),
            ("jailbreak", detectors.scan_jailbreak, DEFAULT_JAILBREAK_SURFACES),
        ):
            cfg = content[key]
            if cfg.get("enabled") and surface in (cfg.get("apply_to") or default_surfaces):
                hits = scan(text, decode=cfg.get("decode_obfuscation", True))
                if hits:
                    findings[key] = hits
                    verdicts.append(Verdict(cfg["action"], f"content.{key}.{surface}",
                                            f"{key.replace('_', '-')} signals detected in {surface}: {', '.join(hits)}",
                                            ("IS-12", "IS-14")))

    # ------------------------------------------------------------------ audit
    def _log_content(self, value: Any, level: str, oversize: bool) -> Any:
        if level == "none":
            return None
        size = len(value) if isinstance(value, str) else len(_canonical(value)) if value is not None else 0
        if level == "metadata" or oversize:
            return {"chars": size, "omitted": "oversize" if oversize else "metadata-only logging"}
        # 'redacted': always mask with ALL known entities, regardless of the policy's entity list
        red, _ = detectors.redact_structure(value, None)
        if isinstance(red, str) and len(red) > LOG_CONTENT_MAX_CHARS:
            red = red[:LOG_CONTENT_MAX_CHARS] + "…[truncated]"
        elif not isinstance(red, str):
            s = _canonical(red)
            if len(s) > LOG_CONTENT_MAX_CHARS:
                red = {"truncated_json": s[:LOG_CONTENT_MAX_CHARS]}
        return red

    def _audit(self, d: Decision, ctx: dict, rtype: str | None, tool: str | None, original: Any,
               oversize: bool, identity: dict) -> dict:
        lg = self.policy["logging"]
        level = {
            "prompt": lg["prompt_logging"],
            "response": lg["response_logging"],
            "tool_output": lg["response_logging"],
            "tool_call": lg.get("tool_param_logging", "redacted"),
        }.get(rtype, "metadata")
        details = {
            "policy_id": d.policy_id, "policy_version": d.policy_version, "policy_status": d.policy_status,
            "simulation": d.simulation, "mode": d.mode, "request_type": rtype, "tool": tool,
            "decision": d.decision, "would_be_decision": d.would_be_decision, "warning": d.warning,
            "kill_switch": d.kill_switch, "reasons": d.reasons, "matched_rules": d.matched_rules,
            "citations": d.citations, "findings": d.findings, "shadow": d.shadow,
            "approval_request_id": d.approval_request_id, "latency_ms": d.latency_ms,
            "content_logging": level,
            "content": self._log_content(original, level, oversize),
            "context": {k: v for k, v in ctx.items()
                        if k in ("agent_name", "environment", "risk_tier", "tenant", "model")},
        }
        actor = detectors.redact_text(str(identity.get("sub") or "anonymous"), None).text
        return self.audit.append("policy.evaluate", actor, details, trace_id=d.trace_id,
                                 resource=f"policy:{self.policy_ref}", outcome=d.decision)


def _iter_strings(value, depth: int = 0):
    if depth > 20:
        return
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for k, v in value.items():
            yield from _iter_strings(v, depth + 1)
    elif isinstance(value, (list, tuple)):
        for v in value:
            yield from _iter_strings(v, depth + 1)
