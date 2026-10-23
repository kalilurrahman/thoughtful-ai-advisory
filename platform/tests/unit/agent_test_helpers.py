"""Shared helpers for VERITRAIL Agent tests (imported by test_agent_*.py modules)."""
from __future__ import annotations

import pytest

ASSESSOR = {"id": "u-assessor", "role": "assessor", "name": "Asha Rao"}
APPROVER = {"id": "u-approver", "role": "approver", "name": "Dana Lee"}
VIEWER = {"id": "u-viewer", "role": "viewer", "name": "Vic Viewer"}

CS_DESCRIPTION = ("assess a use case: A customer-support agent called HelpBot that reads CRM data, drafts replies to "
                  "customers and can issue refunds with supervisor approval, using GPT-4 via Azure OpenAI for EU customers.")
CS_PROFILE = {
    "name": "HelpBot", "purpose": "Customer-support agent reading CRM data", "domain_category": "customer_service",
    "decision_impact": "advisory", "affected_parties": "customers", "data_sensitivity": "personal",
    "autonomy": "acts_with_approval", "external_actions": True, "genai": True, "vendor_model": True,
    "eu_exposure": True, "tools": ["crm", "payments"],
}
LOW_PROFILE = {
    "name": "DocSummarizer", "purpose": "Summarise internal policy documents", "domain_category": "internal_productivity",
    "decision_impact": "none", "affected_parties": "internal", "data_sensitivity": "internal", "autonomy": "suggests",
    "external_actions": False, "genai": True, "vendor_model": False, "eu_exposure": False, "tools": [],
}


@pytest.fixture
def agent(tmp_path):
    from veritrail_agent import llm
    from veritrail_agent.orchestrator import VeritrailAgent
    llm.set_llm_adapter(None)  # deterministic regardless of environment
    yield VeritrailAgent(tmp_path / "agent")
    llm.reset_llm_adapter()


def run_guided(agent, session="s-guided", user=ASSESSOR, remaining="unknown"):
    """Drive the guided flow to completion; returns the final response."""
    agent.handle(CS_DESCRIPTION, session, user)
    agent.handle("continue", session, user)
    return agent.handle(f"remaining: {remaining}", session, user)
