"""AEGIS Agent — deterministic, citation-first AI governance copilot.

Public entry points (see CONTRIBUTING.md §3 and docs/AGENT_DESIGN.md):

    from aegis_agent.orchestrator import AegisAgent   # AegisAgent(data_dir).handle(message, session_id, user)
    from aegis_agent.tools import TOOL_REGISTRY       # name -> ToolSpec(permission, requires_approval, fn)

The agent works fully offline: intent routing + BM25 retrieval over governed AEGIS
content + templated, cited composition. An optional LLM adapter (aegis_agent.llm)
may rephrase answers but never decides content; its output is discarded unless it
passes citation validation and the prohibited-claim check.
"""
from __future__ import annotations

__version__ = "1.0.0"
AGENT_ID = "aegis-agent"
