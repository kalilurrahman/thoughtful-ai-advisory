"""Fixtures for policy-engine and Runtime Shield tests."""
from __future__ import annotations

import copy

import pytest

from aegis_common.audit import AuditLog
from aegis_policy.engine import PolicyEngine
from pe_helpers import CTX, _base_policy


@pytest.fixture
def policy() -> dict:
    return _base_policy()


@pytest.fixture
def make_engine(tmp_path):
    """make_engine(policy=None, mode=None, clock=None, **policy_overrides) -> PolicyEngine"""
    counter = {"n": 0}

    def _make(policy: dict | None = None, mode: str | None = None, clock=None, **kw) -> PolicyEngine:
        p = copy.deepcopy(policy or _base_policy())
        if mode:
            p["rollout"]["mode"] = mode
        counter["n"] += 1
        log = AuditLog(tmp_path / f"audit-{counter['n']}.jsonl")
        extra = {"clock": clock} if clock else {}
        return PolicyEngine(p, log, default_context=dict(CTX), **extra, **kw)

    return _make
