"""VERITRAIL_* lookups accept the pre-rename AEGIS_* names; the new name wins when both exist."""
from __future__ import annotations

from veritrail_common.env import getenv, legacy_name


def test_legacy_name_only_for_prefixed_variables():
    assert legacy_name("VERITRAIL_LLM_MODEL") == "AEGIS_LLM_MODEL"
    assert legacy_name("USER") is None


def test_getenv_prefers_new_name_then_legacy_then_default(monkeypatch):
    monkeypatch.delenv("VERITRAIL_RATE_LIMIT", raising=False)
    monkeypatch.delenv("AEGIS_RATE_LIMIT", raising=False)
    assert getenv("VERITRAIL_RATE_LIMIT", "60") == "60"
    monkeypatch.setenv("AEGIS_RATE_LIMIT", "10")
    assert getenv("VERITRAIL_RATE_LIMIT", "60") == "10"
    monkeypatch.setenv("VERITRAIL_RATE_LIMIT", "20")
    assert getenv("VERITRAIL_RATE_LIMIT", "60") == "20"
    assert getenv("VERITRAIL_RATE_LIMIT") == "20"
