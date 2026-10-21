"""Normalization of Runtime Shield Advisor input profiles.

Accepts the Phase-4 profile (see ``PROFILE_FIELDS``) with tolerant aliases so the
AEGIS Agent and API can pass partially completed intake data. Every value that
comes from the user is tracked as User-asserted; every value AEGIS fills in is
tracked as Inferred (with the assumption stated) so outputs can be labelled.
"""
from __future__ import annotations

import re
from typing import Any

from aegis_policy.constants import OPERATIONS

PROFILE_FIELDS = {
    "app_name": "Application or agent name",
    "purpose": "Intended purpose and context of use",
    "users": "User groups / business functions served",
    "model": "Model (name/version)",
    "vendor": "Model vendor or hosting provider",
    "tools": "Tools, APIs, plugins and databases, each with operation type "
             "(read|write|delete|external_send|payment|export)",
    "data_categories": "Data categories processed",
    "data_sensitivity": "Highest data sensitivity (public|internal|confidential|personal|special_category)",
    "autonomy": "Autonomy (none|suggests|acts_with_approval|acts_autonomously)",
    "human_approval_model": "Human-approval model (none|per_action|high_impact_only|threshold|batch_review or description)",
    "environment": "Deployment environment (dev|test|staging|production)",
    "risk_tier": "Assigned risk tier (Low|Medium|High|Prohibited-review)",
    "affected_parties": "Who is affected (internal|customers|public|vulnerable)",
    "regulatory_obligations": "Regulatory obligations (e.g. GDPR, EU AI Act, HIPAA, PCI DSS, SOX)",
    "customer_obligations": "Customer/contractual obligations (e.g. zero data retention, residency, SLAs)",
    "existing_controls": "Existing security controls (e.g. SSO, DLP, SIEM, secrets manager, red-team testing)",
}

AUTONOMY_LEVELS = ("none", "suggests", "acts_with_approval", "acts_autonomously")
SENSITIVITY_LEVELS = ("public", "internal", "confidential", "personal", "special_category")
AFFECTED_LEVELS = ("internal", "customers", "public", "vulnerable")
APPROVAL_MODELS = ("none", "per_action", "high_impact_only", "threshold", "batch_review")

_OP_KEYWORDS: list[tuple[str, tuple[str, ...]]] = [
    ("payment", ("pay", "payment", "refund", "transfer", "payout", "disburse", "wire", "charge", "remit", "reimburse", "settle")),
    ("delete", ("delete", "remove", "purge", "drop", "erase", "destroy", "terminate", "revoke")),
    ("export", ("export", "download", "bulk", "extract", "dump")),
    ("external_send", ("send", "email", "sms", "notify", "publish", "message", "slack", "webhook", "reply", "post", "forward")),
    ("write", ("create", "update", "write", "edit", "modify", "set", "insert", "upsert", "assign", "close",
               "merge", "deploy", "commit", "push", "apply", "schedule", "draft", "book", "restart", "scale")),
    ("read", ("get", "read", "search", "lookup", "list", "fetch", "query", "retrieve", "view", "find", "status", "check", "summari", "classify")),
]

_OP_ALIASES = {
    "read": "read", "read_only": "read", "readonly": "read", "query": "read",
    "write": "write", "update": "write", "create": "write",
    "delete": "delete", "remove": "delete",
    "external_send": "external_send", "send": "external_send", "external": "external_send", "email": "external_send",
    "payment": "payment", "pay": "payment", "refund": "payment", "transfer": "payment",
    "export": "export", "download": "export",
}

_SPECIAL = ("health", "medical", "clinical", "patient", "diagnos", "biometric", "genetic", "religio", "ethnic",
            "racial", "sexual", "trade union", "political", "criminal", "phi", "special category", "special_category")
_PERSONAL = ("personal", "pii", "customer", "contact", "employee", "hr", "payment card", "card", "bank account",
             "account number", "financial account", "address", "identity", "id number", "ssn", "passport",
             "date of birth", "email", "phone", "payroll", "salary", "credit")
_CONFIDENTIAL = ("confidential", "source code", "secret", "credential", "contract", "financial report", "ledger",
                 "invoice", "trade secret", "pricing", "m&a", "legal", "infrastructure", "config")
_INTERNAL = ("internal", "policy", "knowledge base", "wiki", "documentation", "procedure", "ticket")

_CONTROL_KEYWORDS = {
    "sso": ("sso", "single sign", "idp", "okta", "entra", "azure ad", "saml", "oidc"),
    "mfa": ("mfa", "multi-factor", "2fa"),
    "dlp": ("dlp", "data loss"),
    "siem": ("siem", "splunk", "sentinel", "security monitoring", "soc"),
    "secrets_manager": ("secrets manager", "vault", "key vault", "kms", "secret manager"),
    "api_gateway": ("api gateway", "gateway", "waf", "proxy"),
    "rbac": ("rbac", "role-based", "role based", "abac"),
    "encryption": ("encryption", "tls", "encrypted"),
    "red_team": ("red team", "red-team", "pen test", "pentest", "penetration", "adversarial test"),
    "logging": ("logging", "audit log", "log retention"),
    "incident_response": ("incident response", "ir plan", "runbook", "on-call", "oncall"),
    "vendor_terms": ("zero data retention", "zero retention", "dpa", "data processing agreement", "baa",
                     "no training", "enterprise agreement"),
    "kill_switch": ("kill switch", "feature flag", "circuit breaker"),
}


def slug(text: str, max_len: int = 60) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return (s or "app")[:max_len].strip("-") or "app"


def _as_list(v: Any) -> list:
    if v is None or v == "":
        return []
    if isinstance(v, (list, tuple, set)):
        return [x for x in v if x not in (None, "")]
    if isinstance(v, str):
        return [p.strip() for p in re.split(r"[;,\n]", v) if p.strip()]
    return [v]


def _tokens(text: str) -> list[str]:
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", str(text or ""))
    return [t for t in re.split(r"[^a-z0-9&]+", text.lower()) if t]


def _kw_match(token: str, kw: str) -> bool:
    return token == kw or (len(kw) >= 4 and token.startswith(kw))


def infer_operation(name: str, description: str = "") -> str | None:
    """Infer a tool's operation type from its name (verb-first), then its description."""
    for source in (name, description):
        for tok in _tokens(source):
            for op, kws in _OP_KEYWORDS:
                if any(_kw_match(tok, k) for k in kws):
                    return op
    return None


def _has_phrase(text: str, phrases: tuple[str, ...]) -> bool:
    for ph in phrases:
        if len(ph) <= 3:
            if re.search(rf"\b{re.escape(ph)}\b", text):
                return True
        elif re.search(rf"\b{re.escape(ph)}", text):
            return True
    return False


def infer_sensitivity(categories: list[str]) -> str | None:
    text = " ".join(str(c).lower().replace("_", " ") for c in categories)
    if not text:
        return None
    if _has_phrase(text, _SPECIAL):
        return "special_category"
    if _has_phrase(text, _PERSONAL):
        return "personal"
    if _has_phrase(text, _CONFIDENTIAL):
        return "confidential"
    if _has_phrase(text, _INTERNAL):
        return "internal"
    if "public" in text:
        return "public"
    return "internal"


def recognize_controls(existing: list[str]) -> dict[str, str]:
    """Map free-text existing controls to canonical keys -> original text."""
    out: dict[str, str] = {}
    for item in existing:
        t = str(item).lower()
        for key, kws in _CONTROL_KEYWORDS.items():
            if key not in out and _has_phrase(t, kws):
                out[key] = str(item)
    return out


def _norm_enum(value: Any, allowed: tuple[str, ...], aliases: dict[str, str] | None = None) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    v = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    if aliases and v in aliases:
        return aliases[v]
    return v if v in allowed else None


_AUTONOMY_ALIASES = {
    "suggest": "suggests", "advisory": "suggests", "assistive": "suggests", "copilot": "suggests",
    "human_in_the_loop": "acts_with_approval", "with_approval": "acts_with_approval", "supervised": "acts_with_approval",
    "autonomous": "acts_autonomously", "fully_autonomous": "acts_autonomously", "full": "acts_autonomously",
    "no": "none", "manual": "none",
}
_ENV_ALIASES = {"prod": "production", "live": "production", "development": "dev", "stage": "staging",
                "uat": "staging", "qa": "test", "pilot": "staging"}
_TIER_MAP = {"low": "Low", "medium": "Medium", "high": "High", "prohibited_review": "Prohibited-review",
             "prohibited": "Prohibited-review", "critical": "High"}


MAX_TEXT = 500
MAX_ITEMS = 100


def _scalar(v: Any, max_len: int = MAX_TEXT) -> str | None:
    """Accept strings and numbers (not booleans) as text; anything else is treated as not provided."""
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        v = str(v)
    if not isinstance(v, str):
        return None
    v = v.strip()
    return v[:max_len] if v else None


def _str_list(v: Any) -> list[str]:
    out = []
    for x in _as_list(v)[:MAX_ITEMS]:
        sx = _scalar(x)
        if sx:
            out.append(sx)
    return out


def _pos_number(v: Any) -> float | int | None:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or v <= 0:
        return None
    return v


def _clean_tool(t: Any, assumptions: list[dict]) -> dict | None:
    from aegis_common.redaction import PII_PATTERNS
    from aegis_policy.schema import validate_parameter_specs

    if isinstance(t, str):
        name, _, op_part = t.strip().rpartition(":")
        if name and op_part.strip().lower() in _OP_ALIASES:   # "crm_lookup:read" (website form format)
            t = {"name": name.strip(), "operation": op_part.strip().lower()}
        else:
            t = {"name": t.strip()}
    if not isinstance(t, dict):
        return None
    name = _scalar(t.get("name"), 200)
    if not name:
        return None
    out: dict[str, Any] = {"name": name}
    desc = _scalar(t.get("description"))
    if desc:
        out["description"] = desc
    raw_op = _scalar(t.get("operation") or t.get("operation_type") or t.get("type"), 50)
    op = _OP_ALIASES.get(raw_op.lower()) if raw_op else None
    if op in OPERATIONS:
        op_source = "User-asserted"
    else:
        op = infer_operation(name, desc or "")
        op_source = "Inferred" if op else "Missing evidence"
        if raw_op:
            assumptions.append({"field": f"tools[{name}].operation", "assumed": op or "unknown",
                                "why": f"operation '{raw_op}' not recognized"})
    out["operation"] = op or "unknown"
    out["operation_source"] = op_source
    for key in ("max_amount", "auto_approve_below"):
        if key in t:
            num = _pos_number(t[key])
            if num is None:
                assumptions.append({"field": f"tools[{name}].{key}", "assumed": "not set",
                                    "why": f"{key} must be a positive number; value ignored"})
            else:
                out[key] = num
    if "max_calls_per_session" in t:
        n = t["max_calls_per_session"]
        if isinstance(n, int) and not isinstance(n, bool) and n > 0:
            out["max_calls_per_session"] = n
    for key in ("allowed_domains", "scopes", "approval_roles", "currencies"):
        out[key] = _str_list(t.get(key))
    out["allow_pii_entities"] = [e for e in _str_list(t.get("allow_pii_entities")) if e in PII_PATTERNS]
    sens = _norm_enum(t.get("data_sensitivity"), SENSITIVITY_LEVELS)
    if sens:
        out["data_sensitivity"] = sens
    rp = _scalar(t.get("recipient_param"), 64)
    if rp and re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,63}", rp):
        out["recipient_param"] = rp
    out["recipient_binding"] = t.get("recipient_binding") is True
    out["requires_approval"] = t.get("requires_approval") is True
    params = t.get("parameters")
    if params not in (None, {}, []):
        errs = validate_parameter_specs(params)
        if errs:
            assumptions.append({"field": f"tools[{name}].parameters", "assumed": "not declared",
                                "why": "declared parameters were invalid and were ignored: " + "; ".join(errs[:3])})
        else:
            out["parameters"] = params
    return out


def normalize_profile(profile: dict | None) -> dict:
    """Return a normalized profile with ``_asserted`` (user-provided keys), ``_assumptions`` and ``_missing``.

    Input is untrusted (it can come from the public API): values of an unexpected type are
    treated as not provided, text is length-capped and lists are size-capped.
    """
    p = dict(profile) if isinstance(profile, dict) else {}
    asserted: dict[str, Any] = {}
    assumptions: list[dict] = []
    missing: list[str] = []

    def take_text(key, *aliases):
        for k in (key,) + aliases:
            v = _scalar(p.get(k))
            if v:
                asserted[key] = v
                return v
        return None

    def take_list(key, *aliases):
        for k in (key,) + aliases:
            v = _str_list(p.get(k))
            if v:
                asserted[key] = v
                return v
        return []

    app_name = take_text("app_name", "name", "application", "agent_name")
    app_name = app_name[:150] if app_name else None
    purpose = take_text("purpose", "description", "intended_purpose")
    users = take_list("users", "user_groups")
    business_functions = take_list("business_functions", "business_function")
    model = take_text("model")
    vendor = take_text("vendor", "model_vendor", "provider")
    data_categories = take_list("data_categories", "data")
    regulatory = take_list("regulatory_obligations", "regulations")
    customer_obl = take_list("customer_obligations", "contractual_obligations")
    existing = take_list("existing_controls", "existing_security_controls", "security_controls")

    raw_autonomy = take_text("autonomy")
    autonomy = _norm_enum(raw_autonomy, AUTONOMY_LEVELS, _AUTONOMY_ALIASES)
    if autonomy is None:
        autonomy = "acts_autonomously"
        assumptions.append({"field": "autonomy", "assumed": autonomy,
                            "why": "autonomy not provided or not recognized; assuming the most permissive level "
                                   "until confirmed (conservative)"})

    raw_sens = take_text("data_sensitivity", "sensitivity")
    sensitivity = _norm_enum(raw_sens, SENSITIVITY_LEVELS, {"special": "special_category", "pii": "personal",
                                                             "sensitive": "personal", "restricted": "confidential"})
    inferred_sens = infer_sensitivity(data_categories)
    if sensitivity is None:
        sensitivity = inferred_sens or "personal"
        assumptions.append({"field": "data_sensitivity", "assumed": sensitivity,
                            "why": "inferred from data categories" if inferred_sens else
                            "no data categories provided; assuming personal data until confirmed"})
    elif inferred_sens and SENSITIVITY_LEVELS.index(inferred_sens) > SENSITIVITY_LEVELS.index(sensitivity):
        assumptions.append({"field": "data_sensitivity", "assumed": inferred_sens,
                            "why": f"stated sensitivity '{sensitivity}' is lower than the data categories suggest; "
                                   "using the higher level pending confirmation"})
        sensitivity = inferred_sens

    raw_env = take_text("environment")
    environment = _norm_enum(raw_env, ("dev", "test", "staging", "production"), _ENV_ALIASES)
    if environment is None:
        environment = "production"
        assumptions.append({"field": "environment", "assumed": "production",
                            "why": "environment not provided or not recognized; production controls proposed "
                                   "(conservative)"})

    raw_tier = take_text("risk_tier")
    risk_tier = _TIER_MAP.get(raw_tier.lower().replace("-", "_").replace(" ", "_")) if raw_tier else None
    if raw_tier and risk_tier is None:
        asserted.pop("risk_tier", None)
        assumptions.append({"field": "risk_tier", "assumed": "not assigned",
                            "why": f"risk tier '{raw_tier}' not recognized (Low|Medium|High|Prohibited-review)"})

    raw_aff = take_text("affected_parties")
    affected = _norm_enum(raw_aff, AFFECTED_LEVELS, {"employees": "internal", "staff": "internal",
                                                     "customer": "customers", "clients": "customers",
                                                     "patients": "vulnerable", "children": "vulnerable",
                                                     "consumers": "customers"})
    if affected is None:
        text = " ".join(u.lower() for u in users + business_functions)
        if any(k in text for k in ("patient", "child", "minor", "vulnerable")):
            affected = "vulnerable"
        elif any(k in text for k in ("customer", "client", "consumer", "member", "policyholder")):
            affected = "customers"
        elif any(k in text for k in ("public", "citizen", "anyone")):
            affected = "public"
        elif text:
            affected = "internal"
        else:
            affected = "customers"
        assumptions.append({"field": "affected_parties", "assumed": affected,
                            "why": "inferred from users/business functions" if text else
                            "not provided; assuming customers are affected"})

    raw_appr = take_text("human_approval_model", "approval_model", "human_approval")
    approval_model = _norm_enum(raw_appr, APPROVAL_MODELS, {"per-action": "per_action", "always": "per_action",
                                                            "high_impact": "high_impact_only", "no": "none",
                                                            "thresholds": "threshold"})
    approval_description = None
    if raw_appr and approval_model is None:
        approval_model = "described"
        approval_description = raw_appr
    if not raw_appr:
        approval_model = "unknown"

    tools: list[dict] = []
    raw_tools = None
    for k in ("tools", "apis", "integrations"):
        if p.get(k) not in (None, "", [], {}):
            raw_tools = p[k]
            break
    seen: set[str] = set()
    for t in _as_list(raw_tools)[:MAX_ITEMS]:
        ct = _clean_tool(t, assumptions)
        if ct and ct["name"] not in seen:
            seen.add(ct["name"])
            tools.append(ct)
    if tools:
        asserted["tools"] = [t["name"] for t in tools]

    for k in PROFILE_FIELDS:
        if k not in asserted:
            missing.append(k)

    limits = {}
    if isinstance(p.get("limits"), dict):
        for k, v in p["limits"].items():
            num = _pos_number(v)
            if isinstance(k, str) and num is not None:
                limits[k] = int(num) if k != "cost_per_month_usd" else num

    agent_name = slug(_scalar(p.get("agent_name")) or app_name or "unnamed-agent")
    return {
        "app_name": app_name or "Unnamed AI application",
        "agent_name": agent_name,
        "purpose": purpose,
        "users": users,
        "business_functions": business_functions,
        "model": model,
        "vendor": vendor,
        "tools": tools,
        "data_categories": data_categories,
        "data_sensitivity": sensitivity,
        "autonomy": autonomy,
        "human_approval_model": approval_model,
        "human_approval_description": approval_description,
        "environment": environment,
        "risk_tier": risk_tier,
        "affected_parties": affected,
        "regulatory_obligations": regulatory,
        "customer_obligations": customer_obl,
        "existing_controls": existing,
        "recognized_controls": recognize_controls(existing),
        "tenant": _scalar(p.get("tenant"), 100) or "*",
        "owner": _scalar(p.get("owner"), 200) or "AI System Owner",
        "limits": limits,
        "allowed_roles": _str_list(p.get("allowed_roles")),
        "approver_roles": _str_list(p.get("approver_roles")),
        "allowed_link_domains": _str_list(p.get("allowed_link_domains")),
        "synthetic": p.get("synthetic") is True,
        "_asserted": asserted,
        "_assumptions": assumptions,
        "_missing": missing,
    }
