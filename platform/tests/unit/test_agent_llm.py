"""Unit tests: optional LLM phrasing adapter — redaction in, validation out, deterministic fallback."""
from __future__ import annotations

from veritrail_common.evidence import NO_SOURCE_MESSAGE

from veritrail_agent import llm
from veritrail_agent.orchestrator import VeritrailAgent
from agent_test_helpers import ASSESSOR


class Recorder:
    name = "recorder"

    def __init__(self, transform):
        self.transform = transform
        self.prompts = []

    def rephrase(self, prompt, system):
        self.prompts.append(prompt)
        return self.transform(prompt)


def test_default_is_deterministic(monkeypatch):
    llm.reset_llm_adapter()
    monkeypatch.delenv("VERITRAIL_LLM_PROVIDER", raising=False)
    assert llm.get_llm_adapter() is None
    text, meta = llm.polish("IS-11 applies.", allowed_controls={"IS-11"}, allowed_questions=set())
    assert text == "IS-11 applies." and meta["used"] is False


def test_env_configuration_requires_key_and_https(monkeypatch):
    llm.reset_llm_adapter()
    monkeypatch.setenv("VERITRAIL_LLM_PROVIDER", "openai_compatible")
    monkeypatch.setenv("VERITRAIL_LLM_API_KEY", "k")
    monkeypatch.setenv("VERITRAIL_LLM_ENDPOINT", "http://insecure.example/v1/chat")
    assert llm.get_llm_adapter() is None
    monkeypatch.setenv("VERITRAIL_LLM_ENDPOINT", "https://llm.example/v1/chat")
    assert llm.get_llm_adapter().name == "openai_compatible"
    monkeypatch.delenv("VERITRAIL_LLM_API_KEY")
    assert llm.get_llm_adapter() is None


def test_adapter_receives_only_redacted_text():
    rec = Recorder(lambda p: p)
    llm.polish("Contact jane.doe@example.com or +44 20 7946 0958 about IS-11.", allowed_controls={"IS-11"},
               allowed_questions=set(), adapter=rec)
    assert "jane.doe@example.com" not in rec.prompts[0] and "[REDACTED:email]" in rec.prompts[0]


def test_good_phrasing_is_used():
    rec = Recorder(lambda p: "In short: " + p)
    out, meta = llm.polish("IS-11 limits agent tools.", allowed_controls={"IS-11"}, allowed_questions=set(), adapter=rec)
    assert out.startswith("In short:") and meta["used"]


def test_prohibited_claim_output_is_discarded():
    rec = Recorder(lambda p: p + " Your organization is fully compliant with the EU AI Act.")
    out, meta = llm.polish("IS-11 limits agent tools.", allowed_controls={"IS-11"}, allowed_questions=set(), adapter=rec)
    assert out == "IS-11 limits agent tools." and not meta["used"] and "prohibited claim" in meta["reason"]


def test_invented_or_dropped_citations_are_discarded():
    for bad in (lambda p: p + " See also IS-99.", lambda p: p + " See also AO-02.", lambda p: "Agent tools are limited."):
        out, meta = llm.polish("IS-11 limits agent tools.", allowed_controls={"IS-11"}, allowed_questions=set(),
                               adapter=Recorder(bad))
        assert out == "IS-11 limits agent tools." and not meta["used"], meta


def test_no_source_message_must_survive():
    out, meta = llm.polish(NO_SOURCE_MESSAGE, allowed_controls=set(), allowed_questions=set(),
                           adapter=Recorder(lambda p: "I'm not sure."))
    assert out == NO_SOURCE_MESSAGE and not meta["used"]


def test_adapter_errors_fall_back():
    class Boom:
        name = "boom"

        def rephrase(self, prompt, system):
            raise TimeoutError("slow")
    out, meta = llm.polish("IS-11 applies.", allowed_controls={"IS-11"}, allowed_questions=set(), adapter=Boom())
    assert out == "IS-11 applies." and "TimeoutError" in meta["reason"]


def test_agent_uses_adapter_only_when_valid(tmp_path):
    good = VeritrailAgent(tmp_path / "a", llm_adapter=Recorder(lambda p: "Summary — " + p))
    r = good.handle("What does IS-11 require?", "s", ASSESSOR)
    assert r["llm"]["used"] and r["answer"].startswith("Summary — ")
    assert good.audit.query(action="agent.llm.phrasing")
    bad = VeritrailAgent(tmp_path / "b", llm_adapter=Recorder(lambda p: "You are certified. " + p))
    r = bad.handle("Are we EU AI Act compliant?", "s", ASSESSOR)
    assert not r["llm"]["used"] and "certified. " not in r["answer"]
