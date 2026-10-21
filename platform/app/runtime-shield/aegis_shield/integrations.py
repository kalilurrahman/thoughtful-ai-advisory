"""Integration helpers: SDK wrapper, tool-call guard (agent-framework hook) and event sink.

These show the four integration patterns described in docs/RUNTIME_SHIELD_DESIGN.md §7:

* ``ShieldedLLM`` — SDK wrapper around any ``fn(prompt) -> str`` model call.
* ``ToolGuard`` — agent-framework hook: every tool call is evaluated before execution
  and every tool output is screened before it re-enters the model context.
* gateway/proxy — run ``PolicyEngine.evaluate`` in an HTTP proxy in front of the model
  API (the AEGIS API exposes the advisor; a gateway is a deployment choice, see docs).
* ``decision_events`` — event sink: turns the hash-chained decision log into flat
  JSON events for a SIEM/data lake (redacted content only).
"""
from __future__ import annotations

from typing import Any, Callable, Iterator

from aegis_policy.engine import Decision, PolicyEngine


class Blocked(Exception):
    def __init__(self, decision: Decision):
        super().__init__(f"{decision.decision}: {'; '.join(decision.reasons[:3])}")
        self.decision = decision


class ShieldedLLM:
    """Wrap a model call: evaluate the prompt, call the model with the permitted payload,
    evaluate the response. Raises ``Blocked`` when a decision does not permit proceeding."""

    def __init__(self, engine: PolicyEngine, llm: Callable[[str], str], *, identity: dict,
                 context: dict | None = None, session_id: str | None = None):
        self.engine, self.llm = engine, llm
        self.identity, self.context, self.session_id = identity, context or {}, session_id

    def _req(self, rtype: str, content: str, trace_id: str | None) -> dict:
        return {"type": rtype, "content": content, "identity": self.identity, "context": self.context,
                "session": {"id": self.session_id}, "trace_id": trace_id}

    def __call__(self, prompt: str) -> dict:
        d_in = self.engine.evaluate(self._req("prompt", prompt, None))
        if not d_in.allowed:
            raise Blocked(d_in)
        raw = self.llm(d_in.payload)  # the model only ever sees the permitted (e.g. redacted) payload
        d_out = self.engine.evaluate(self._req("response", raw, d_in.trace_id))
        if not d_out.allowed:
            raise Blocked(d_out)
        return {"text": d_out.payload, "prompt_decision": d_in.to_dict(), "response_decision": d_out.to_dict()}


class ToolGuard:
    """Agent-framework hook. ``tools`` maps tool name -> callable(**params)."""

    def __init__(self, engine: PolicyEngine, tools: dict[str, Callable[..., Any]]):
        self.engine, self.tools = engine, tools

    def call(self, tool: str, params: dict, *, identity: dict, context: dict | None = None,
             session_id: str | None = None, approval_id: str | None = None, trace_id: str | None = None) -> dict:
        req = {"type": "tool_call", "tool": tool, "params": params, "identity": identity,
               "context": context or {}, "session": {"id": session_id}, "approval_id": approval_id,
               "trace_id": trace_id}
        d = self.engine.evaluate(req)
        if not d.allowed:
            return {"executed": False, "decision": d.decision, "reasons": d.reasons,
                    "approval_request_id": d.approval_request_id, "trace_id": d.trace_id}
        fn = self.tools.get(tool)
        if fn is None:  # declared in policy but not wired: fail closed
            return {"executed": False, "decision": "DENY", "reasons": ["tool not available"], "trace_id": d.trace_id}
        output = fn(**d.payload["params"])
        d_out = self.engine.evaluate({"type": "tool_output", "content": str(output), "identity": identity,
                                      "context": context or {}, "session": {"id": session_id},
                                      "trace_id": d.trace_id})
        return {"executed": True, "decision": d.decision, "output": d_out.payload if d_out.allowed else None,
                "output_decision": d_out.decision, "reasons": d.reasons + d_out.reasons, "trace_id": d.trace_id}


def decision_events(engine_or_log, action: str = "policy.evaluate") -> Iterator[dict]:
    """Flatten decision-log records into SIEM-friendly events (content already redacted)."""
    log = engine_or_log.audit if isinstance(engine_or_log, PolicyEngine) else engine_or_log
    for r in log.records():
        if r.get("action") != action:
            continue
        d = r.get("details", {})
        yield {
            "ts": r["ts"], "trace_id": r["trace_id"], "audit_id": r["id"], "record_hash": r["hash"],
            "actor": r["actor"], "policy": r.get("resource"), "mode": d.get("mode"),
            "decision": d.get("decision"), "would_be_decision": d.get("would_be_decision"),
            "warning": d.get("warning"), "kill_switch": d.get("kill_switch"),
            "request_type": d.get("request_type"), "tool": d.get("tool"),
            "matched_rules": d.get("matched_rules"), "citations": d.get("citations"),
            "findings": d.get("findings"), **{f"ctx_{k}": v for k, v in (d.get("context") or {}).items()},
        }
