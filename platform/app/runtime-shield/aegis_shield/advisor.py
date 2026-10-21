"""AEGIS Runtime Shield Advisor.

``advise(profile) -> dict`` turns a description of an LLM application or agent
into practical runtime guardrails and a draft, versioned policy:

risk_profile, tool_matrix, data_handling, approval_rules, limits, monitoring,
incident_response, rollout, missing_inputs, clarifying_questions, citations,
citation_details, evidence, policy (+ policy_yaml / policy_json / policy_validation).

Governance properties (tested in tests/policy-engine/test_shield_advisor.py):
* advisor outputs are labelled Inferred; facts supplied by the user are User-asserted;
  nothing is labelled Verified (no named human has reviewed evidence here);
* every recommendation cites AEGIS control IDs from content/controls/controls.yaml;
* the generated policy is always ``draft`` in ``observe`` mode with no approvals —
  the advisor never activates a policy; activation requires recorded human approval;
* output is JSON-serializable and free of compliance/certification claims.
"""
from __future__ import annotations

import copy
from typing import Any

from aegis_common.content import control_citation, get_control
from aegis_common.evidence import (
    EVIDENCE_STATUS_DEFINITIONS,
    NO_SOURCE_MESSAGE,
    STANDARD_DISCLAIMER,
    EvidenceStatus,
)

from .profile import PROFILE_FIELDS, normalize_profile, slug

PRINCIPLE = "AI proposes. AEGIS evaluates. Approved actions execute."
ADVISOR_VERSION = "1.0.0"
LEVELS = ("Low", "Medium", "High", "Critical")
INFERRED = EvidenceStatus.INFERRED.value
ASSERTED = EvidenceStatus.USER_ASSERTED.value
MISSING = EvidenceStatus.MISSING_EVIDENCE.value
CRITICAL = EvidenceStatus.CRITICAL_GAP.value

OP_WEIGHT = {"read": 1, "write": 2, "export": 3, "external_send": 3, "delete": 4, "payment": 4}
EGRESS_OPS = {"external_send", "export"}
IRREVERSIBLE_OPS = {"delete", "payment"}
MUTATING_OPS = {"write", "delete", "payment", "external_send", "export"}
SENS_SCORE = {"public": 1, "internal": 1, "confidential": 2, "personal": 3, "special_category": 4}
AFFECTED_SCORE = {"internal": 1, "customers": 2, "public": 3, "vulnerable": 4}
AUTONOMY_SCORE = {"none": 1, "suggests": 1, "acts_with_approval": 2, "acts_autonomously": 3}

DEFAULT_APPROVER = {
    "payment": "Finance Approver",
    "delete": "AI System Owner",
    "external_send": "Business Owner",
    "export": "Data Owner",
    "write": "Business Owner",
    "read": "AI System Owner",
}
OP_CITATIONS = {
    "read": ["IS-11", "EI-07"],
    "write": ["IS-11", "IS-12", "EI-07"],
    "delete": ["IS-11", "IS-13", "IS-15", "EI-07"],
    "payment": ["IS-11", "IS-13", "IS-16", "EI-07"],
    "external_send": ["IS-11", "IS-13", "IS-04", "EI-07"],
    "export": ["IS-11", "IS-13", "IS-04", "IS-03", "EI-07"],
    "unknown": ["IS-11", "EI-07"],
}

LIMIT_PRESETS = {
    "Low": {"requests_per_minute": 120, "tool_calls_per_session": 50, "tokens_per_day": 2_000_000,
            "cost_per_month_usd": 2_000},
    "Medium": {"requests_per_minute": 60, "tool_calls_per_session": 30, "tokens_per_day": 1_000_000,
               "cost_per_month_usd": 3_000},
    "High": {"requests_per_minute": 30, "tool_calls_per_session": 20, "tokens_per_day": 500_000,
             "cost_per_month_usd": 3_000},
    "Critical": {"requests_per_minute": 15, "tool_calls_per_session": 10, "tokens_per_day": 250_000,
                 "cost_per_month_usd": 2_000},
}
RETENTION_DAYS = {"Low": 180, "Medium": 365, "High": 730, "Critical": 730}
TIME_TO_DISABLE = {"Low": 60, "Medium": 15, "High": 5, "Critical": 5}
OBSERVE_SAMPLE = {"Low": 500, "Medium": 1_000, "High": 5_000, "Critical": 10_000}
FP_THRESHOLD = {"Low": 5, "Medium": 5, "High": 3, "Critical": 2}


def _level(score: int) -> str:
    return LEVELS[max(1, min(4, score)) - 1]


def _max_level(*levels: str) -> str:
    return max(levels, key=LEVELS.index)


# ---------------------------------------------------------------------------
# Risk profile
# ---------------------------------------------------------------------------

def _risk_profile(n: dict) -> dict:
    ops = {t["operation"] for t in n["tools"] if t["operation"] != "unknown"}
    unknown = [t["name"] for t in n["tools"] if t["operation"] == "unknown"]
    autonomous = n["autonomy"] == "acts_autonomously"
    no_approval = n["human_approval_model"] in ("none", "unknown")

    # Autonomy
    a = AUTONOMY_SCORE[n["autonomy"]]
    a_factors = [f"autonomy '{n['autonomy']}'"]
    if autonomous and ops & (IRREVERSIBLE_OPS | {"external_send"}):
        a += 1
        a_factors.append("acts autonomously with irreversible or external actions available")
    autonomy = {"level": _level(a), "score": min(a, 4), "factors": a_factors,
                "rationale": "; ".join(a_factors)}

    # Tool risk
    t = max((OP_WEIGHT[o] for o in ops), default=1)
    t_factors = [f"highest-impact operation: {max(ops, key=lambda o: OP_WEIGHT[o])}" if ops else "no tools declared"]
    if len([x for x in n["tools"] if x["operation"] in MUTATING_OPS]) >= 4 and t < 4:
        t += 1
        t_factors.append("four or more state-changing tools")
    if unknown:
        t_factors.append(f"{len(unknown)} tool(s) with unknown operation type (denied by default until classified)")
    tool_risk = {"level": _level(t), "score": min(t, 4), "factors": t_factors,
                 "operations": sorted(ops), "rationale": "; ".join(t_factors)}

    # Data exposure
    d = SENS_SCORE[n["data_sensitivity"]]
    d_factors = [f"highest data sensitivity '{n['data_sensitivity']}'"]
    if ops & EGRESS_OPS and d >= 2 and autonomous:
        d += 1
        d_factors.append("autonomous egress paths (external send / export) for sensitive data")
    if n["vendor"] and d >= 3:
        d_factors.append(f"prompts containing sensitive data may reach an external model vendor ({n['vendor']})")
    data_exposure = {"level": _level(d), "score": min(d, 4), "factors": d_factors, "rationale": "; ".join(d_factors)}

    # Blast radius
    b = AFFECTED_SCORE[n["affected_parties"]]
    b_factors = [f"affected parties: {n['affected_parties']}"]
    if n["environment"] == "production" and ops & MUTATING_OPS:
        b += 1
        b_factors.append("state-changing tools in production")
    if ops & IRREVERSIBLE_OPS and (autonomous or no_approval):
        b += 1
        b_factors.append("irreversible actions without a confirmed human-approval path")
    blast = {"level": _level(b), "score": min(b, 4), "factors": b_factors, "rationale": "; ".join(b_factors)}

    scores = [autonomy["score"], tool_risk["score"], data_exposure["score"], blast["score"]]
    composite = round(0.7 * (sum(scores) / 4) + 0.3 * max(scores), 2)
    rating = "Low" if composite < 1.75 else "Medium" if composite < 2.5 else "High" if composite < 3.5 else "Critical"
    floors = []
    if max(scores) == 4:
        floors.append(("High", "at least one dimension is Critical"))
    if n["risk_tier"] == "High":
        floors.append(("High", "user-asserted risk tier is High"))
    if n["risk_tier"] == "Prohibited-review":
        floors.append(("Critical", "user-asserted tier is Prohibited-review: legal/ethics review required before any deployment"))
    if autonomous and ops & IRREVERSIBLE_OPS:
        floors.append(("High", "autonomous agent with irreversible actions"))
    if n["data_sensitivity"] == "special_category":
        floors.append(("Medium", "special-category data"))
        if ops & EGRESS_OPS:
            floors.append(("High", "special-category data with egress tools"))
    for lvl, why in floors:
        if LEVELS.index(lvl) > LEVELS.index(rating):
            rating = lvl
    inferred_tier = {"Low": "Low", "Medium": "Medium", "High": "High", "Critical": "High"}[rating]
    if n["risk_tier"] == "Prohibited-review":
        inferred_tier = "Prohibited-review"
    asserted_tier = n["risk_tier"]
    tier_order = ["Low", "Medium", "High", "Prohibited-review"]
    mismatch = bool(asserted_tier) and tier_order.index(inferred_tier) > tier_order.index(asserted_tier)

    rationale = (
        f"Overall runtime risk {rating} (composite {composite} on a 1–4 scale; 70% mean, 30% maximum of "
        f"autonomy {autonomy['level']}, tool risk {tool_risk['level']}, data exposure {data_exposure['level']}, "
        f"blast radius {blast['level']})."
    )
    applied = [f"{why} (minimum {lvl})" for lvl, why in floors]
    if applied:
        rationale += " Floor rules triggered: " + "; ".join(applied) + "."
    if mismatch:
        rationale += (f" The user-asserted tier ({asserted_tier}) is lower than the inferred tier ({inferred_tier}); "
                      "a risk-tier change requires human approval and is not made by AEGIS.")
    return {
        "autonomy": autonomy,
        "blast_radius": blast,
        "data_exposure": data_exposure,
        "tool_risk": tool_risk,
        "overall": {"rating": rating, "composite_score": composite, "rationale": rationale,
                    "floors_applied": applied},
        "overall_rating": rating,
        "user_asserted_risk_tier": asserted_tier,
        "inferred_risk_tier": inferred_tier,
        "tier_mismatch": mismatch,
        "requires_human_confirmation": True,
        "evidence_status": INFERRED,
        "citations": ["EI-02", "IS-01", "IS-11"],
    }


# ---------------------------------------------------------------------------
# Tool permission matrix
# ---------------------------------------------------------------------------

def _approvers(n: dict, tool: dict, op: str) -> list[str]:
    roles = list(tool.get("approval_roles") or n["approver_roles"] or [])
    return roles or [DEFAULT_APPROVER.get(op, "AI System Owner")]


def _tool_entry(n: dict, tool: dict, rating: str) -> dict:
    op = tool["operation"]
    name = tool["name"]
    approval_model = n["human_approval_model"]
    no_approval_path = approval_model in ("none", "unknown")
    autonomous = n["autonomy"] == "acts_autonomously"
    high = rating in ("High", "Critical")
    sens = tool.get("data_sensitivity") or n["data_sensitivity"]
    reasons: list[str] = []
    conditions: list[str] = []
    params: dict = copy.deepcopy(tool.get("parameters") or {})
    declared_params = bool(params)
    approval_if: list[dict] = []
    max_calls = tool.get("max_calls_per_session")
    allow_pii = list(tool.get("allow_pii_entities") or [])

    if op == "unknown":
        decision = "denied"
        reasons.append("operation type unknown — default-deny until the tool is classified in the agent/tool registry")
    elif op == "read":
        if sens in ("personal", "special_category", "confidential"):
            decision = "conditional"
            reasons.append(f"read access to {sens} data: restrict to tenant- and record-scoped queries")
            conditions += ["read-only credential scoped to the requesting user's tenant",
                           "PII in results is redacted before reaching the model unless needed for the task"]
        else:
            decision = "allowed"
            reasons.append("read-only access to low-sensitivity data")
    elif op == "write":
        if high and autonomous:
            decision = "approval"
            reasons.append("state-changing action by an autonomous agent in a high-risk context")
        elif high and not declared_params:
            decision = "approval"
            reasons.append("state-changing action in a high-risk context with no declared parameters to validate")
        else:
            decision = "conditional"
            reasons.append("state-changing action: allowed only within validated parameters and scoped credentials")
            conditions += ["scoped write credential (no admin scopes)", "parameter validation enforced",
                           "per-session call cap"]
        max_calls = max_calls or 20
    elif op == "delete":
        max_calls = max_calls or 3
        if no_approval_path:
            decision = "denied"
            reasons.append("irreversible deletion with no confirmed human-approval path")
        else:
            decision = "approval"
            reasons.append("irreversible deletion requires designated human approval of the exact action")
    elif op == "payment":
        max_calls = max_calls or 5
        max_amount = tool.get("max_amount")
        auto_below = tool.get("auto_approve_below")
        if "amount" not in params:
            params["amount"] = {"type": "number", "min": 0, "required": True,
                                "description": "Transaction amount (proposed constraint — confirm parameter name)"}
        if max_amount is not None and params["amount"].get("type") in ("number", "integer"):
            params["amount"]["max"] = max_amount
        if tool.get("currencies"):
            params.setdefault("currency", {"type": "string", "enum": list(tool["currencies"]), "required": True})
        if no_approval_path:
            decision = "denied"
            reasons.append("payments with no confirmed human-approval path")
        elif auto_below is not None and rating != "Critical" and not autonomous:
            decision = "conditional"
            approval_if.append({"param": "amount", "op": "gt", "value": auto_below,
                                "reason": f"amount above auto-approval threshold {auto_below}"})
            reasons.append(f"payments up to {auto_below} within validated limits; above that, human approval")
            conditions.append(f"hard maximum {max_amount}" if max_amount is not None
                              else "set a hard maximum amount (missing input)")
        else:
            decision = "approval"
            reasons.append("payments are high-impact and irreversible: every call requires human approval")
    elif op == "external_send":
        max_calls = max_calls or 10
        allow_pii += [e for e in ("email",) if e not in allow_pii]
        bound = bool(tool.get("allowed_domains")) or bool(tool.get("recipient_binding"))
        if tool.get("allowed_domains"):
            rp = tool.get("recipient_param", "to")
            params.setdefault(rp, {"type": "string", "required": True})
            if params[rp].get("type") in ("string", "array"):
                params[rp]["domain_allow_list"] = list(tool["allowed_domains"])
        if no_approval_path and high:
            decision = "denied"
            reasons.append("external communication in a high-risk context with no confirmed approval path")
        elif bound and rating != "Critical":
            decision = "conditional"
            reasons.append("external send restricted to bound recipients / allow-listed domains")
            conditions += ["recipient bound to the active case or allow-listed domain",
                           "outbound content scanned for PII and injection artefacts"]
        else:
            decision = "approval"
            reasons.append("external communication leaves the organization: human approval before sending")
    elif op == "export":
        max_calls = max_calls or 2
        if sens == "special_category" and no_approval_path:
            decision = "denied"
            reasons.append("bulk export of special-category data with no approval path")
        else:
            decision = "approval"
            reasons.append("bulk data export requires designated human approval and row limits")
            params.setdefault("max_rows", {"type": "integer", "min": 1, "max": 1000,
                                           "description": "Proposed row cap — confirm parameter name"})
    else:  # pragma: no cover
        decision = "denied"
        reasons.append("unsupported operation")

    if tool.get("requires_approval") and decision in ("allowed", "conditional"):
        decision = "approval"
        approval_if = []
        reasons.append("user-specified: every call requires human approval")

    engine_action = {"allowed": "ALLOW", "conditional": "ALLOW", "approval": "REQUIRE_HUMAN_APPROVAL",
                     "denied": "DENY"}[decision]
    scopes = list(tool.get("scopes") or [f"{slug(name, 40)}:{'read' if op == 'read' else op}"])
    citations = list(OP_CITATIONS.get(op, ["IS-11"]))
    return {
        "tool": name,
        "description": tool.get("description"),
        "operation": op,
        "operation_evidence": tool["operation_source"],
        "decision": decision,
        "engine_action": engine_action,
        "reasons": reasons,
        "conditions": conditions,
        "scopes": scopes,
        "parameters": params,
        "strict_parameters": declared_params,
        "require_approval_if": approval_if,
        "approval_roles": _approvers(n, tool, op) if decision in ("approval", "conditional") and
        (decision == "approval" or approval_if) else [],
        "max_calls_per_session": max_calls,
        "allow_pii_entities": allow_pii if decision != "denied" else [],
        "citations": citations,
        "evidence_status": INFERRED,
    }


# ---------------------------------------------------------------------------
# Remaining sections
# ---------------------------------------------------------------------------

def _data_handling(n: dict, rating: str, matrix: list[dict]) -> dict:
    sens = n["data_sensitivity"]
    entities = ["email", "phone", "payment_card", "iban", "us_ssn", "uk_nino", "india_pan", "india_aadhaar",
                "ip_address", "api_key"]
    log_level = "metadata" if sens == "special_category" else "redacted"
    exemptions = [{"tool": m["tool"], "entities": m["allow_pii_entities"],
                   "reason": "needed to perform the action; still masked in logs"}
                  for m in matrix if m["allow_pii_entities"]]
    rules = [
        {"id": "dh.redact_before_llm", "rule": "Redact sensitive entities from prompts and retrieved context before "
         f"any call to the external model{' (' + n['vendor'] + ')' if n['vendor'] else ''}.",
         "applies_to": ["prompt", "tool_output"], "citations": ["IS-04"]},
        {"id": "dh.response_leakage", "rule": "Scan model responses for sensitive entities before display or onward "
         "transmission; redact matches.", "applies_to": ["response"], "citations": ["IS-04", "IS-14"]},
        {"id": "dh.tool_params", "rule": "Scan tool parameters for sensitive entities; only per-tool exemptions "
         "listed below may pass unmasked to the tool.", "applies_to": ["tool_params"], "citations": ["IS-04", "IS-11"]},
        {"id": "dh.indirect_injection", "rule": "Treat tool outputs and retrieved documents as untrusted: scan for "
         "prompt-injection signals before they enter the model context.", "applies_to": ["tool_output"],
         "citations": ["IS-12", "IS-14"]},
        {"id": "dh.logging", "rule": f"Log prompts and responses at '{log_level}' level only; raw content is never "
         "written to the decision log, which is hash-chained and tamper-evident.", "applies_to": ["logs"],
         "citations": ["SE-08", "IS-04"]},
        {"id": "dh.retention", "rule": f"Retain decision logs and approval records for {RETENTION_DAYS[rating]} "
         "days (proposed default — confirm against the obligations register).", "applies_to": ["logs"],
         "citations": ["SE-02", "AO-07"]},
    ]
    if sens in ("personal", "special_category"):
        rules.append({"id": "dh.minimisation", "rule": "Send only the fields required for the task to the model; "
                      "document lawful basis, retention and cross-border transfer in the privacy assessment.",
                      "applies_to": ["prompt", "tool_output"], "citations": ["IS-03"]})
    if n["vendor"]:
        rules.append({"id": "dh.vendor_terms", "rule": f"Confirm {n['vendor']} contract terms on data use, retention, "
                      "training opt-out and incident notice before production traffic.",
                      "applies_to": ["vendor"], "citations": ["GL-11", "AO-09"]})
    if any(m["operation"] in EGRESS_OPS and m["decision"] != "denied" for m in matrix):
        rules.append({"id": "dh.egress", "rule": "Outbound sends and exports carry only data required by the bound "
                      "case; bulk egress requires approval and row caps.", "applies_to": ["tool_params"],
                      "citations": ["IS-04", "IS-13"]})
    return {
        "data_sensitivity": sens,
        "data_categories": n["data_categories"],
        "redaction_entities": entities,
        "redaction_surfaces": ["prompt", "response", "tool_params", "tool_output"],
        "exemptions": exemptions,
        "prompt_logging": log_level,
        "response_logging": log_level,
        "evidence_retention_days": RETENTION_DAYS[rating],
        "rules": rules,
        "detector_limitations": (
            "Built-in detectors are deterministic heuristics for structured identifiers (e-mail, card, IBAN, "
            "national IDs, phone, IP, API keys). They do not detect names, postal addresses, free-text health "
            "details or paraphrased/non-English injections; layer a dedicated DLP/PII service and a trained "
            "injection classifier for production."),
        "citations": ["IS-03", "IS-04", "SE-08", "SE-02"],
        "evidence_status": INFERRED,
    }


def _approval_rules(n: dict, rating: str, matrix: list[dict], policy_approvers: list[str]) -> list[dict]:
    rules: list[dict] = []
    for m in matrix:
        if m["decision"] == "approval":
            rules.append({
                "id": f"approval.{slug(m['tool'], 50)}",
                "trigger": f"Every call to '{m['tool']}' ({m['operation']})",
                "approver_roles": m["approval_roles"],
                "binding": "Approval binds to the exact tool, parameters, requester and session; single use; expires if unused",
                "separation_of_duties": "Requester cannot approve their own action",
                "on_timeout": "DENY (no auto-approval)",
                "citations": ["IS-13", "IS-09"],
            })
        elif m["require_approval_if"]:
            for c in m["require_approval_if"]:
                rules.append({
                    "id": f"approval.{slug(m['tool'], 40)}.{c['param']}_{c['op']}",
                    "trigger": f"'{m['tool']}' when {c['param']} {c['op']} {c['value']}",
                    "approver_roles": m["approval_roles"],
                    "binding": "Approval binds to the exact tool, parameters, requester and session; single use",
                    "separation_of_duties": "Requester cannot approve their own action",
                    "on_timeout": "DENY (no auto-approval)",
                    "citations": ["IS-13"],
                })
    rules += [
        {"id": "approval.policy_change", "trigger": "Any change to the production runtime policy, including promotion "
         "between rollout modes", "approver_roles": policy_approvers,
         "binding": "Approval recorded on the specific policy version (draft → in_review → approved → active)",
         "separation_of_duties": "Policy author cannot approve the same version", "on_timeout": "Change not applied",
         "citations": ["GL-04", "IS-12"]},
        {"id": "approval.risk_tier_change", "trigger": "Changing the system's risk tier",
         "approver_roles": ["AI Governance Lead"], "binding": "Recorded in the AI inventory",
         "separation_of_duties": "Not the system owner alone", "on_timeout": "Tier unchanged",
         "citations": ["EI-02", "GL-03"]},
        {"id": "approval.exception", "trigger": "Any exception to this policy (e.g. temporarily allowing a denied tool)",
         "approver_roles": ["AI Governance Lead", "Security Lead"],
         "binding": "Exception has an accountable approver, expiry and compensating controls",
         "separation_of_duties": "Requester cannot approve", "on_timeout": "Exception not granted",
         "citations": ["GL-10"]},
        {"id": "approval.kill_switch_release", "trigger": "Releasing an engaged kill switch or leaving contain mode",
         "approver_roles": ["Security Operations Lead", "AI System Owner"],
         "binding": "Root cause recorded; release logged in the decision log",
         "separation_of_duties": "Two-person rule recommended", "on_timeout": "Remain contained",
         "citations": ["IS-15", "SE-04"]},
        {"id": "approval.sensitive_export", "trigger": "Exporting decision logs or evidence containing sensitive data",
         "approver_roles": ["Data Owner"], "binding": "Export request and recipient recorded",
         "separation_of_duties": "Requester cannot approve", "on_timeout": "Export not performed",
         "citations": ["SE-02", "IS-04"]},
    ]
    return rules


def _limits(n: dict, rating: str) -> dict:
    preset = dict(LIMIT_PRESETS[rating])
    overrides = {k: v for k, v in n["limits"].items() if k in preset and isinstance(v, (int, float)) and v > 0}
    preset.update(overrides)
    return {
        **preset,
        "action_on_breach": "RATE_LIMIT",
        "alert_at_percent": 80,
        "source": "User-asserted overrides: " + ", ".join(sorted(overrides)) if overrides else
        f"AEGIS starting points for a {rating} runtime-risk profile",
        "rationale": "Contain runaway loops, abuse and denial-of-wallet. Calibrate from observe-mode telemetry before "
                     "enforcement; limits are per tenant+agent (rate also per identity).",
        "citations": ["IS-16"],
        "evidence_status": ASSERTED if overrides else INFERRED,
    }


def _monitoring(n: dict, rating: str) -> dict:
    fp = FP_THRESHOLD[rating]
    cadence = {
        "Low": {"decision_log_review": "monthly sample review", "policy_review": "quarterly",
                "kill_switch_drill": "semi-annually", "adversarial_retest": "after material change and annually"},
        "Medium": {"decision_log_review": "bi-weekly sample review", "policy_review": "quarterly",
                   "kill_switch_drill": "quarterly", "adversarial_retest": "after material change and semi-annually"},
        "High": {"decision_log_review": "weekly review of DENY/ESCALATE/approval decisions", "policy_review": "monthly",
                 "kill_switch_drill": "quarterly", "adversarial_retest": "after every material change and quarterly"},
    }
    cad = cadence["High" if rating in ("High", "Critical") else rating]
    return {
        "metrics": [
            {"metric": "decision_distribution", "description": "Count of ALLOW/DENY/REDACT/TRANSFORM/REQUIRE_HUMAN_APPROVAL/"
             "ESCALATE/RATE_LIMIT per policy version and mode (effective and would-be)", "citations": ["IS-12", "SE-03"]},
            {"metric": "would_be_block_rate", "description": "Share of requests whose would-be decision blocks while in "
             "observe/warn/protect — the main promotion signal", "citations": ["IS-12"]},
            {"metric": "false_positive_rate", "description": f"Reviewer-sampled false positives among blocks (target < {fp}%)",
             "citations": ["GL-08"]},
            {"metric": "redaction_events_by_entity", "description": "Redactions per entity type and surface",
             "citations": ["IS-04"]},
            {"metric": "injection_jailbreak_detections", "description": "Detections by surface (prompt, tool output) "
             "and signal type, including obfuscation flags", "citations": ["IS-14"]},
            {"metric": "default_deny_hits", "description": "Calls to undeclared tools (registry drift or misuse)",
             "citations": ["IS-11", "EI-07"]},
            {"metric": "approval_queue", "description": "Pending approvals, approval latency, rejection rate, expiries",
             "citations": ["IS-13"]},
            {"metric": "limit_utilisation", "description": "Rate, tool-call, token and cost utilisation vs limits; breaches",
             "citations": ["IS-16"]},
            {"metric": "kill_switch_time_to_disable", "description": "Measured in drills and incidents (target ≤ "
             f"{TIME_TO_DISABLE[rating]} minutes)", "citations": ["IS-15"]},
            {"metric": "audit_chain_integrity", "description": "Result of scheduled AuditLog.verify() runs",
             "citations": ["SE-08"]},
        ],
        "alerts": [
            {"alert": "injection_spike", "condition": "prompt-injection detections > 3x trailing baseline for an "
             "agent/tenant", "severity": "High", "route": "Security Operations", "citations": ["IS-14", "SE-04"]},
            {"alert": "pii_in_response", "condition": "any REDACT on the response surface for special-category or "
             "payment data", "severity": "High" if n["data_sensitivity"] in ("personal", "special_category") else "Medium",
             "route": "Privacy / Data Protection", "citations": ["IS-04", "SE-04"]},
            {"alert": "default_deny_surge", "condition": "> 10 undeclared-tool calls per hour", "severity": "Medium",
             "route": "Platform Engineering", "citations": ["IS-11"]},
            {"alert": "approval_backlog", "condition": "pending approvals older than the approval timeout",
             "severity": "Medium", "route": "Business Owner", "citations": ["IS-13"]},
            {"alert": "budget_threshold", "condition": "token or cost utilisation ≥ 80% of limit", "severity": "Low",
             "route": "FinOps / Platform", "citations": ["IS-16"]},
            {"alert": "audit_chain_broken", "condition": "AuditLog.verify() fails", "severity": "Critical",
             "route": "Security Operations", "citations": ["SE-08", "SE-04"]},
            {"alert": "kill_switch_engaged", "condition": "any kill-switch engagement or contain mode", "severity": "High",
             "route": "Incident commander", "citations": ["IS-15", "SE-04"]},
        ],
        "review_cadence": cad,
        "dashboards": ["Runtime decisions by policy version and mode", "Approvals queue", "Limits and spend",
                       "Detections and redactions"],
        "citations": ["GL-08", "SE-03", "SE-08", "SE-12"],
        "evidence_status": INFERRED,
    }


def _incident_response(n: dict, rating: str) -> dict:
    ttd = TIME_TO_DISABLE[rating]
    return {
        "kill_switch": {
            "scopes": ["agent", "tool", "model", "tenant"],
            "authorized_roles": ["Security Operations Lead", "AI System Owner", "SRE On-call"],
            "target_time_to_disable_minutes": ttd,
            "procedure": [
                "Engage the narrowest effective scope first (tool → agent → tenant → model); escalate scope if impact continues",
                "For a full stop, deploy an approved policy version in 'contain' mode or set kill_switch.engaged",
                "Confirm in the decision log that in-scope requests now return DENY with matched rule 'kill_switch'",
                "Notify the incident commander and business owner; open an incident record",
            ],
            "precedence": "Kill switch overrides every other rule and every rollout mode, including observe",
            "drill": f"Test time-to-disable in drills; record the measured time (target ≤ {ttd} minutes)",
            "citations": ["IS-15"],
        },
        "rollback": {
            "strategy": "revert_to_previous once a previous approved version exists; until then 'disable' (contain)",
            "steps": [
                "Identify the last known-good policy version from change_history",
                "Re-activate it through the approval workflow (expedited emergency approval is still recorded)",
                "Verify decisions against a replay of the incident traffic in observe mode",
            ],
            "citations": ["IS-15", "GL-04"],
        },
        "playbooks": [
            {"id": "ir.prompt_injection", "trigger": "Injection detected in a prompt or tool output that reached a tool call",
             "actions": ["Kill-switch the affected tool", "Preserve decision-log records by trace ID",
                         "Identify the injected source (document, e-mail, web page) and quarantine it",
                         "Re-run adversarial tests before release"], "citations": ["IS-14", "IS-15", "SE-04"]},
            {"id": "ir.data_leakage", "trigger": "Sensitive data observed in a response, outbound message or log",
             "actions": ["Contain the agent or tenant", "Assess scope from redacted logs and finding counts",
                         "Engage Privacy/Legal for notification assessment", "Add detector or policy fix; re-test"],
             "citations": ["IS-04", "SE-04"]},
            {"id": "ir.tool_misuse", "trigger": "Unauthorized or anomalous tool call (default-deny spike, scope violation, "
             "parameter violations)", "actions": ["Kill-switch the tool", "Revoke and rotate the agent's credentials",
                                                  "Review the tool permission matrix and registry"],
             "citations": ["IS-11", "EI-07", "IS-15"]},
            {"id": "ir.runaway_cost", "trigger": "Rate/budget limit breaches or loop behaviour",
             "actions": ["Confirm RATE_LIMIT decisions are effective", "Contain the session/agent",
                         "Fix the loop; recalibrate limits through a new policy version"], "citations": ["IS-16"]},
            {"id": "ir.vendor_incident", "trigger": "Model vendor outage, unannounced model change or vendor security incident",
             "actions": ["Kill-switch the model scope or fail over to an approved alternative",
                         "Re-validate behaviour before re-enabling", "Record vendor notice under contract terms"],
             "citations": ["IS-15", "GL-11", "SE-04"]},
        ],
        "escalation": {"queue": "ai-security-review", "contact_role": "Security Operations Lead",
                       "citations": ["AO-06", "SE-04"]},
        "evidence_to_capture": ["Decision-log records (trace IDs) and AuditLog.verify() result",
                                "Kill-switch engagement record with measured time-to-disable",
                                "Policy versions involved and the approval records", "Corrective actions"],
        "citations": ["IS-15", "SE-04", "AO-06"],
        "evidence_status": INFERRED,
    }


def _rollout(n: dict, rating: str) -> dict:
    sample = OBSERVE_SAMPLE[rating]
    fp = FP_THRESHOLD[rating]
    ttd = TIME_TO_DISABLE[rating]
    stages = [
        {"stage": 1, "mode": "observe",
         "purpose": "Evaluate every request and log the would-be decision; nothing is blocked or modified.",
         "entry_criteria": ["Policy reviewed; deployment of observe mode approved by the AI System Owner",
                            "Decision log writing to the hash-chained audit log", "Shadow mode evaluating as 'enforce'"],
         "exit_criteria": [f"At least {sample:,} representative requests evaluated",
                           "Would-be decision distribution reviewed by the system owner and security",
                           f"Sampled would-be blocks reviewed; false-positive rate < {fp}%",
                           "Every legitimate tool seen in traffic has an explicit rule (no legitimate default-deny hits)",
                           "Limits calibrated from observed peaks"],
         "citations": ["IS-12", "GL-07"]},
        {"stage": 2, "mode": "warn",
         "purpose": "Still allow, but surface warnings to the application/operators when the would-be decision is not ALLOW.",
         "entry_criteria": ["Observe exit criteria met", "New policy version approved for warn mode"],
         "exit_criteria": ["Warnings triaged by application owners; no unresolved false-positive patterns",
                           "Human-approval workflow tested end-to-end (request → approve/reject → single-use execution)",
                           "Alert routing confirmed with on-call teams"],
         "citations": ["IS-12", "IS-13"]},
        {"stage": 3, "mode": "protect",
         "purpose": "Apply REDACT and TRANSFORM to payloads; blocking decisions are still logged but not enforced.",
         "entry_criteria": ["Warn exit criteria met", "New policy version approved for protect mode"],
         "exit_criteria": ["No raw sensitive data in sampled logs, prompts to the vendor, or responses",
                           "Task quality impact of redaction reviewed and accepted by the business owner",
                           "Adversarial (prompt-injection / leakage) test results reviewed"],
         "citations": ["IS-04", "IS-14"]},
        {"stage": 4, "mode": "enforce",
         "purpose": "Full decisions: DENY, REQUIRE_HUMAN_APPROVAL, ESCALATE and RATE_LIMIT block execution.",
         "entry_criteria": ["Protect exit criteria met", "Kill-switch drill passed (contain test below)",
                            "New policy version approved for enforce mode by all required approver roles"],
         "exit_criteria": ["Steady state: false-positive rate and approval latency within agreed targets",
                           "Monitoring alerts and review cadence operating", "Periodic policy review scheduled"],
         "citations": ["IS-12", "IS-13", "IS-16"]},
        {"stage": 5, "mode": "contain",
         "purpose": "Incident state, not a promotion target: kill switch active for the whole policy scope; "
                    "every in-scope request is denied. Rehearse it before enforcement and use it during incidents.",
         "entry_criteria": ["Drill: scheduled test window approved", "Incident: authorized role engages the kill switch"],
         "exit_criteria": [f"Drill: measured time-to-disable ≤ {ttd} minutes and full DENY confirmed in the decision log",
                           "Incident: root cause identified, fix approved as a new policy version, release approved "
                           "by the kill-switch release approvers"],
         "citations": ["IS-15", "SE-04"]},
    ]
    return {
        "recommended_start_mode": "observe",
        "current_stage": 1,
        "promotion_rule": "Each promotion is a new policy version that goes draft → in_review → approved → active with "
                          "recorded human approval. AEGIS never promotes or activates a policy on its own.",
        "stages": stages,
        "citations": ["IS-12", "GL-04", "GL-07", "IS-15"],
        "evidence_status": INFERRED,
    }


_QUESTION_BANK = {
    "app_name": ("What is the application or agent called, and who is its accountable owner?", ["EI-03", "EI-07"]),
    "purpose": ("What is the intended purpose and context of use, and what is explicitly out of scope?", ["EI-04"]),
    "users": ("Which user groups and business functions use or are affected by it?", ["EI-04", "IS-08"]),
    "model": ("Which model and version will run in production, and how are model changes controlled?", ["EI-05", "GL-04"]),
    "vendor": ("Which vendor or platform hosts the model, and under which contract terms (data use, retention, training)?",
               ["GL-11", "AO-09"]),
    "tools": ("List every tool/API/plugin/database the agent can call, with its operation type "
              "(read, write, delete, external_send, payment, export) and parameters.", ["EI-07", "IS-11"]),
    "data_categories": ("Which data categories are processed (e.g. customer contact data, payment data, health data)?",
                        ["IS-03", "EI-06"]),
    "data_sensitivity": ("What is the highest sensitivity of data the system can access?", ["IS-03", "IS-04"]),
    "autonomy": ("Does the agent only suggest, act with approval, or act autonomously?", ["IS-09", "IS-13"]),
    "human_approval_model": ("Who approves high-impact actions today, through which workflow, and within what time?",
                             ["IS-13", "IS-09"]),
    "environment": ("Which environment is this for (dev, staging, production)?", ["GL-07"]),
    "risk_tier": ("Has the system been assigned a risk tier in the AI inventory?", ["EI-02"]),
    "affected_parties": ("Are customers, the public or vulnerable groups affected by outputs or actions?", ["EI-02", "IS-09"]),
    "regulatory_obligations": ("Which regulatory obligations apply (e.g. GDPR, EU AI Act, sector rules)?", ["AO-07"]),
    "customer_obligations": ("Which customer or contractual commitments apply (data residency, retention, notice)?", ["AO-07"]),
    "existing_controls": ("Which security controls already exist (SSO, DLP, SIEM, secrets manager, red-team testing)?",
                          ["IS-12", "SE-08"]),
}


def _missing_and_questions(n: dict, matrix: list[dict]) -> tuple[list[dict], list[dict]]:
    missing, questions = [], []
    for f in n["_missing"]:
        q, cits = _QUESTION_BANK[f]
        missing.append({"field": f, "label": PROFILE_FIELDS[f], "status": MISSING,
                        "impact": next((a["why"] for a in n["_assumptions"] if a["field"] == f),
                                       "Recommendations use conservative defaults until provided.")})
        questions.append({"question": q, "field": f, "citations": cits})
    for m in matrix:
        if m["operation"] == "unknown":
            questions.append({"question": f"What operation does tool '{m['tool']}' perform (read, write, delete, "
                              "external_send, payment, export)? It is denied until classified.",
                              "field": f"tools.{m['tool']}", "citations": ["EI-07", "IS-11"]})
        elif m["operation_evidence"] == INFERRED:
            questions.append({"question": f"Confirm the operation type for '{m['tool']}' (AEGIS inferred "
                              f"'{m['operation']}' from its name).", "field": f"tools.{m['tool']}",
                              "citations": ["EI-07"]})
        if m["decision"] != "denied" and not m["strict_parameters"] and m["operation"] != "read":
            questions.append({"question": f"Declare the parameters of '{m['tool']}' (types, max values, allowed "
                              "domains/patterns) so undeclared arguments can be rejected.",
                              "field": f"tools.{m['tool']}.parameters", "citations": ["IS-11", "IS-12"]})
        if m["operation"] == "payment" and "max" not in (m["parameters"].get("amount") or {}):
            questions.append({"question": f"What is the hard maximum amount per call for '{m['tool']}'?",
                              "field": f"tools.{m['tool']}.max_amount", "citations": ["IS-13", "IS-16"]})
    if n["human_approval_model"] == "described":
        questions.append({"question": "Map the described approval process to named approver roles and thresholds: "
                          f"\"{n['human_approval_description']}\"", "field": "human_approval_model",
                          "citations": ["IS-13"]})
    return missing, questions


def _evidence(n: dict, risk: dict, matrix: list[dict]) -> dict:
    items: list[dict] = []
    a = n["_asserted"]
    labels = {"app_name": "Application name", "purpose": "Intended purpose", "model": "Model", "vendor": "Vendor",
              "autonomy": "Autonomy level", "human_approval_model": "Human-approval model",
              "environment": "Environment", "risk_tier": "Risk tier", "data_sensitivity": "Data sensitivity",
              "affected_parties": "Affected parties"}
    for k, lab in labels.items():
        if k in a:
            items.append({"item": f"{lab}: {a[k]}", "status": ASSERTED, "source": "profile",
                          "citations": ["EI-02"] if k == "risk_tier" else ["EI-04"]})
    for t in n["tools"]:
        items.append({"item": f"Tool '{t['name']}' performs '{t['operation']}'",
                      "status": t["operation_source"] if t["operation_source"] != "Missing evidence" else MISSING,
                      "source": "profile" if t["operation_source"] == ASSERTED else "AEGIS inference",
                      "citations": ["EI-07"]})
    rc = n["recognized_controls"]
    for key, text in rc.items():
        items.append({"item": f"Existing control: {text}", "status": ASSERTED, "source": "profile",
                      "citations": {"red_team": ["IS-14"], "siem": ["SE-08", "GL-08"], "logging": ["SE-08"],
                                    "dlp": ["IS-04"], "kill_switch": ["IS-15"], "vendor_terms": ["GL-11"],
                                    "incident_response": ["SE-04"]}.get(key, ["IS-11"])})
    for f in n["_missing"]:
        items.append({"item": f"Not provided: {PROFILE_FIELDS[f]}", "status": MISSING, "source": "profile",
                      "citations": _QUESTION_BANK[f][1]})
    # Evidence that only a human review can make Verified.
    if "red_team" not in rc:
        items.append({"item": "Prompt-injection / data-leakage test results", "status": MISSING, "source": "not provided",
                      "citations": ["IS-14"]})
    else:
        items.append({"item": "Prompt-injection / data-leakage test results (claimed, not yet reviewed)",
                      "status": ASSERTED, "source": "profile", "citations": ["IS-14"]})
    items.append({"item": "Kill-switch test record with measured time-to-disable", "status": MISSING,
                  "source": "not provided", "citations": ["IS-15"]})
    items.append({"item": "Approval records with approver identity for high-impact actions", "status": MISSING,
                  "source": "not provided", "citations": ["IS-13"]})
    # Critical gaps
    ops = {m["operation"] for m in matrix}
    autonomous = n["autonomy"] == "acts_autonomously"
    no_approval = n["human_approval_model"] in ("none", "unknown")
    if autonomous and ops & IRREVERSIBLE_OPS and no_approval:
        items.append({"item": "Autonomous agent can reach irreversible actions (payment/delete) with no confirmed human "
                      "approval path — those tools are denied in the draft policy until an approval workflow exists",
                      "status": CRITICAL, "source": "AEGIS inference", "citations": ["IS-13", "IS-09"]})
    if n["data_sensitivity"] == "special_category" and n["vendor"] and not ({"vendor_terms", "dlp"} & set(rc)):
        items.append({"item": f"Special-category data may be sent to an external model vendor ({n['vendor']}) with no "
                      "asserted contract terms or DLP — runtime redaction is heuristic and not sufficient alone",
                      "status": CRITICAL, "source": "AEGIS inference", "citations": ["IS-03", "IS-04", "GL-11"]})
    if n["risk_tier"] == "Prohibited-review":
        items.append({"item": "System is flagged for prohibited-use review; do not deploy pending legal/ethics review",
                      "status": CRITICAL, "source": "profile", "citations": ["AO-10", "EI-02"]})
    if risk["tier_mismatch"]:
        items.append({"item": f"Asserted risk tier {risk['user_asserted_risk_tier']} is lower than inferred "
                      f"{risk['inferred_risk_tier']}", "status": INFERRED, "source": "AEGIS inference",
                      "citations": ["EI-02"]})
    items.append({"item": "Risk profile, tool matrix, limits, monitoring, rollout plan and draft policy",
                  "status": INFERRED, "source": "AEGIS Runtime Shield Advisor", "citations": ["IS-12"]})
    counts: dict[str, int] = {}
    for it in items:
        counts[it["status"]] = counts.get(it["status"], 0) + 1
    return {
        "legend": EVIDENCE_STATUS_DEFINITIONS,
        "items": items,
        "counts": counts,
        "verified_note": "Nothing in this output is labelled Verified: no evidence has been reviewed by a named human reviewer.",
    }


def _collect_citations(obj: Any, acc: set[str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "citations" and isinstance(v, list):
                acc.update(x for x in v if isinstance(x, str))
            else:
                _collect_citations(v, acc)
    elif isinstance(obj, list):
        for v in obj:
            _collect_citations(v, acc)


def policy_approver_roles(rating: str) -> list[str]:
    if rating == "Low":
        return ["AI System Owner"]
    if rating == "Medium":
        return ["AI System Owner", "Security Lead"]
    return ["AI System Owner", "Security Lead", "Risk & Compliance Lead"]


def analyze(profile: dict) -> dict:
    """Produce the advisory sections without the policy (used by ``generate_policy``)."""
    n = normalize_profile(profile)
    risk = _risk_profile(n)
    rating = risk["overall"]["rating"]
    matrix = [_tool_entry(n, t, rating) for t in n["tools"]]
    approvers = policy_approver_roles(rating)
    missing, questions = _missing_and_questions(n, matrix)
    advice = {
        "advisor_version": ADVISOR_VERSION,
        "principle": PRINCIPLE,
        "app": {"app_name": n["app_name"], "agent_name": n["agent_name"], "purpose": n["purpose"],
                "users": n["users"], "business_functions": n["business_functions"], "model": n["model"],
                "vendor": n["vendor"], "environment": n["environment"], "autonomy": n["autonomy"],
                "human_approval_model": n["human_approval_model"], "data_sensitivity": n["data_sensitivity"],
                "affected_parties": n["affected_parties"], "regulatory_obligations": n["regulatory_obligations"],
                "customer_obligations": n["customer_obligations"], "existing_controls": n["existing_controls"],
                "synthetic": n["synthetic"]},
        "assumptions": n["_assumptions"],
        "risk_profile": risk,
        "tool_matrix": matrix,
        "data_handling": _data_handling(n, rating, matrix),
        "approval_rules": _approval_rules(n, rating, matrix, approvers),
        "policy_approver_roles": approvers,
        "limits": _limits(n, rating),
        "monitoring": _monitoring(n, rating),
        "incident_response": _incident_response(n, rating),
        "rollout": _rollout(n, rating),
        "missing_inputs": missing,
        "clarifying_questions": questions,
        "evidence": _evidence(n, risk, matrix),
        "evidence_status": INFERRED,
        "requires_human_approval": True,
        "disclaimer": STANDARD_DISCLAIMER,
        "_normalized": n,
    }
    if n["regulatory_obligations"] or n["customer_obligations"]:
        advice["obligations_note"] = {
            "text": "Listed obligations are User-asserted and should be recorded in the obligations register; AEGIS "
                    "maps runtime controls to them indicatively and does not determine legal applicability.",
            "items": n["regulatory_obligations"] + n["customer_obligations"],
            "status": ASSERTED, "citations": ["AO-07"],
        }
    return advice


def _summary(advice: dict) -> str:
    r = advice["risk_profile"]
    m = advice["tool_matrix"]
    counts = {k: sum(1 for x in m if x["decision"] == k) for k in ("allowed", "conditional", "approval", "denied")}
    crit = advice["evidence"]["counts"].get(CRITICAL, 0)
    s = (f"{advice['app']['app_name']}: overall runtime risk {r['overall']['rating']} (Inferred). "
         f"Tool matrix: {counts['allowed']} allowed, {counts['conditional']} conditional, {counts['approval']} "
         f"approval-gated, {counts['denied']} denied (default-deny for anything undeclared). "
         f"A draft policy ({advice['policy']['policy_id']} v{advice['policy']['version']}) starts in observe mode and "
         "requires recorded human approval before any promotion.")
    if crit:
        s += f" {crit} critical gap(s) need attention before production use."
    if advice["missing_inputs"]:
        s += f" {len(advice['missing_inputs'])} input(s) missing; conservative defaults were used."
    return s


def advise(profile: dict) -> dict:
    """Runtime Shield Advisor entry point (contract: CONTRIBUTING.md §3). JSON-serializable output."""
    from .generator import generate_policy, to_json, to_yaml
    from aegis_policy.schema import lint_policy, validate_policy

    advice = analyze(profile or {})
    policy = generate_policy(profile or {}, advice=advice)
    advice.pop("_normalized", None)
    advice["policy"] = policy
    advice["policy_yaml"] = to_yaml(policy)
    advice["policy_json"] = to_json(policy)
    errors = validate_policy(policy)
    advice["policy_validation"] = {"valid": not errors, "errors": errors, "warnings": lint_policy(policy)}
    advice["activation"] = ("Not activated. The policy is a draft in observe mode; activation requires review and "
                            f"recorded approval by: {', '.join(policy['approval']['required_approver_roles'])}.")
    advice["summary"] = _summary(advice)

    cits: set[str] = set()
    _collect_citations({k: v for k, v in advice.items() if k not in ("policy",)}, cits)
    cits.update(policy["citations"])
    unknown = sorted(c for c in cits if get_control(c) is None)
    if unknown:  # developer error: never emit invented control IDs
        raise RuntimeError(f"advisor produced unknown control IDs: {unknown}")
    ordered = sorted(cits, key=lambda c: (["AO", "EI", "GL", "IS", "SE"].index(c[:2]), c))
    advice["citations"] = ordered
    advice["citation_details"] = [
        {"id": c, "title": get_control(c)["title"], "citation": control_citation(c),
         "mappings": get_control(c).get("mappings", {})} for c in ordered
    ] or [{"id": None, "citation": NO_SOURCE_MESSAGE}]
    return advice
