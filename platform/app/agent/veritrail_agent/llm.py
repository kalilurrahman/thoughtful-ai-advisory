"""Optional LLM phrasing adapter.

The agent is fully deterministic. If (and only if) an adapter is configured, it may
*rephrase* the deterministic direct answer for readability. Guarantees:

  * The adapter only ever receives `veritrail_common.redaction.redact()`-ed text.
  * Its output is discarded (and the deterministic answer used) unless it passes:
      - `find_prohibited_claims()` (no compliance/certification claims),
      - citation validation (only control IDs from controls.yaml AND from the answer's sources),
      - citation preservation (every control ID cited in the deterministic answer is kept),
      - required-text preservation (e.g. the exact no-source message),
      - prompt-injection screening of the output, and a length bound.
  * Failures, timeouts and exceptions fall back silently to the deterministic answer
    (the reason is recorded in response metadata and the audit log).

Configuration (environment):
  VERITRAIL_LLM_PROVIDER = none (default) | openai_compatible | anthropic
  VERITRAIL_LLM_API_KEY, VERITRAIL_LLM_MODEL, VERITRAIL_LLM_ENDPOINT (openai_compatible), VERITRAIL_LLM_TIMEOUT (seconds, default 15)
Tests and integrators may inject an adapter with `set_llm_adapter()`.
"""
from __future__ import annotations

import json
import os
import urllib.request
from typing import Protocol

from veritrail_common.redaction import redact

from .safety import detect_injection, output_problems

SYSTEM_INSTRUCTIONS = (
    "You rephrase governance answers for clarity. Rules: keep every VERITRAIL control ID and question ID exactly as "
    "written; do not add facts, control IDs, framework clauses or numbers that are not in the input; never state or "
    "imply that any organization or system is compliant, certified or regulator-approved; keep any sentence stating "
    "that no supporting evidence or framework source is available verbatim; keep [REDACTED:...] markers; return only "
    "the rephrased text."
)


class LLMAdapter(Protocol):
    name: str

    def rephrase(self, prompt: str, system: str) -> str: ...


class OpenAICompatibleAdapter:
    name = "openai_compatible"

    def __init__(self, endpoint: str, api_key: str, model: str, timeout: float = 15.0):
        self.endpoint, self.api_key, self.model, self.timeout = endpoint, api_key, model, timeout

    def rephrase(self, prompt: str, system: str) -> str:
        body = json.dumps({"model": self.model, "temperature": 0,
                           "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}).encode()
        req = urllib.request.Request(self.endpoint, data=body, method="POST",
                                     headers={"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"})
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # noqa: S310 (configured endpoint)
            data = json.loads(resp.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


class AnthropicAdapter:
    name = "anthropic"

    def __init__(self, api_key: str, model: str, timeout: float = 15.0,
                 endpoint: str = "https://api.anthropic.com/v1/messages"):
        self.api_key, self.model, self.timeout, self.endpoint = api_key, model, timeout, endpoint

    def rephrase(self, prompt: str, system: str) -> str:
        body = json.dumps({"model": self.model, "max_tokens": 1024, "temperature": 0, "system": system,
                           "messages": [{"role": "user", "content": prompt}]}).encode()
        req = urllib.request.Request(self.endpoint, data=body, method="POST",
                                     headers={"content-type": "application/json", "x-api-key": self.api_key,
                                              "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # noqa: S310
            data = json.loads(resp.read().decode("utf-8"))
        return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")


_OVERRIDE: dict = {"adapter": None, "set": False}


def set_llm_adapter(adapter: LLMAdapter | None) -> None:
    """Inject an adapter (tests/integrations). Pass None to force deterministic mode."""
    _OVERRIDE["adapter"], _OVERRIDE["set"] = adapter, True


def reset_llm_adapter() -> None:
    _OVERRIDE["adapter"], _OVERRIDE["set"] = None, False


def get_llm_adapter() -> LLMAdapter | None:
    if _OVERRIDE["set"]:
        return _OVERRIDE["adapter"]
    provider = (os.environ.get("VERITRAIL_LLM_PROVIDER") or "none").strip().lower()
    key = os.environ.get("VERITRAIL_LLM_API_KEY", "")
    timeout = float(os.environ.get("VERITRAIL_LLM_TIMEOUT", "15"))
    if provider in ("", "none", "off", "deterministic") or not key:
        return None
    if provider == "openai_compatible":
        endpoint = os.environ.get("VERITRAIL_LLM_ENDPOINT", "")
        if not endpoint.startswith("https://"):
            return None  # refuse plaintext / unset endpoints
        return OpenAICompatibleAdapter(endpoint, key, os.environ.get("VERITRAIL_LLM_MODEL", "gpt-4o-mini"), timeout)
    if provider == "anthropic":
        return AnthropicAdapter(key, os.environ.get("VERITRAIL_LLM_MODEL", "claude-sonnet-4-5"), timeout)
    return None


def polish(text: str, *, allowed_controls: set[str], allowed_questions: set[str],
           must_contain: list[str] | None = None, adapter: LLMAdapter | None = None) -> tuple[str, dict]:
    """Optionally rephrase `text`. Returns (final_text, meta). Never raises."""
    adapter = adapter if adapter is not None else get_llm_adapter()
    if adapter is None:
        return text, {"used": False, "provider": None, "reason": "deterministic mode (no LLM configured)"}
    red = redact(text)
    meta = {"used": False, "provider": getattr(adapter, "name", "custom"),
            "redacted_entities": red.entity_counts}
    try:
        out = adapter.rephrase(red.text, SYSTEM_INSTRUCTIONS)
    except Exception as exc:  # network, timeout, provider error
        meta["reason"] = f"adapter error: {type(exc).__name__}"
        return text, meta
    out = (out or "").strip()
    if not out:
        meta["reason"] = "empty output"
        return text, meta
    if len(out) > max(400, 3 * len(text)):
        meta["reason"] = "output too long"
        return text, meta
    from veritrail_common.evidence import NO_SOURCE_MESSAGE
    from .safety import extract_ids
    must_cite = set(extract_ids(text)["controls"])
    must_contain = list(must_contain or [])
    if NO_SOURCE_MESSAGE in text and NO_SOURCE_MESSAGE not in must_contain:
        must_contain.append(NO_SOURCE_MESSAGE)
    probs = output_problems(out, allowed_controls=allowed_controls, allowed_questions=allowed_questions,
                            must_contain=must_contain, must_cite=must_cite)
    if detect_injection(out):
        probs.append("injection markers in output")
    if probs:
        meta["reason"] = "discarded: " + "; ".join(probs[:5])
        return text, meta
    meta["used"] = True
    meta["reason"] = "passed citation and prohibited-claim validation"
    return out, meta
