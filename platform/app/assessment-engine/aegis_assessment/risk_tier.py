"""AEGIS use-case risk tiering (preliminary, explainable).

Produces a PRELIMINARY risk tier with a factor-by-factor rationale. Output is
labelled *Inferred* and always `requires_human_confirmation=True`: a risk tier
becomes authoritative only when an approver confirms it (changing a confirmed
tier requires human approval — see aegis_agent request_human_approval).

The EU AI Act category screen is an indicative trigger for legal review, NOT a
legal classification under Art. 6 / Annex III.
"""
from __future__ import annotations

from aegis_common.content import control_citation

DECISION_IMPACT = {"none": 0, "advisory": 5, "material": 20, "automated_decision": 30}
AFFECTED = {"internal": 0, "customers": 10, "public": 15, "vulnerable": 25}
SENSITIVITY = {"public": 0, "internal": 5, "confidential": 10, "personal": 15, "special_category": 25}
AUTONOMY = {"none": 0, "suggests": 5, "acts_with_approval": 15, "acts_autonomously": 30}

# Indicative screens. Categories echo EU AI Act Annex III areas; inclusion is a trigger for legal review only.
ANNEX_III_LIKE = {
    "biometric": "Biometrics (Annex III area 1)",
    "critical_infrastructure": "Critical infrastructure (Annex III area 2)",
    "education": "Education and vocational training (Annex III area 3)",
    "employment": "Employment and worker management (Annex III area 4)",
    "essential_services": "Access to essential private/public services (Annex III area 5)",
    "credit": "Creditworthiness / credit scoring (Annex III area 5)",
    "insurance": "Life/health insurance risk and pricing (Annex III area 5)",
    "law_enforcement": "Law enforcement (Annex III area 6)",
    "migration": "Migration, asylum and border control (Annex III area 7)",
    "justice": "Administration of justice and democratic processes (Annex III area 8)",
}
SECTOR_SENSITIVE = {"healthcare": 20, "financial_services": 10, "public_sector": 10}
CATEGORY_POINTS = 30

PROHIBITED_SCREEN_TERMS = {
    "social scoring": "Social scoring",
    "social score": "Social scoring",
    "emotion recognition": "Emotion recognition (workplace/education contexts)",
    "subliminal": "Subliminal or manipulative techniques",
    "manipulat": "Manipulative techniques exploiting vulnerabilities",
    "untargeted scraping": "Untargeted scraping of facial images",
    "facial image scraping": "Untargeted scraping of facial images",
    "predictive policing": "Crime prediction based solely on profiling",
    "biometric categori": "Biometric categorisation inferring sensitive attributes",
    "real-time remote biometric": "Real-time remote biometric identification in public spaces",
}

WRITE_TOOL_HINTS = ("write", "update", "delete", "send", "email", "pay", "transfer", "export", "post",
                    "create", "execute", "deploy", "refund", "approve", "trade")

KEY_FIELDS = ["purpose", "decision_impact", "affected_parties", "data_sensitivity", "autonomy", "domain_category"]

INTAKE_FIELDS = {
    "name": "What is the AI system or use case called?",
    "purpose": "What is the intended purpose of the system, in one or two sentences?",
    "decision_impact": "Does the system's output inform or make decisions about people? (none / advisory / material / automated_decision)",
    "affected_parties": "Who is affected by its outputs? (internal / customers / public / vulnerable)",
    "data_sensitivity": "What is the most sensitive data it processes? (public / internal / confidential / personal / special_category)",
    "autonomy": "How autonomous is it? (none / suggests / acts_with_approval / acts_autonomously)",
    "domain_category": "Which domain does it operate in? (e.g. customer_service, credit, employment, healthcare, education, internal_productivity, other)",
    "tools": "Which tools, APIs, plugins or databases can it access?",
    "external_actions": "Can it take actions outside your organization (send emails, payments, posts)? (yes/no)",
    "eu_exposure": "Is it placed on the EU market or does it affect people in the EU? (yes/no)",
    "vendor_model": "Does it use a third-party / vendor model or AI product? (yes/no)",
    "genai": "Is it a generative AI / LLM-based system? (yes/no)",
    "environment": "Which environment is it in? (development / staging / production)",
}

TIER_RULES = {
    "Low": {"approval_authority": "Product Owner with AI CoE review", "review_cadence_months": 24},
    "Medium": {"approval_authority": "AI Risk Lead", "review_cadence_months": 12},
    "High": {"approval_authority": "AI Governance Forum", "review_cadence_months": 6},
    "Prohibited-review": {"approval_authority": "Legal and AI Governance Forum (default: do not proceed)",
                          "review_cadence_months": 0},
}


def _bool(v) -> bool | None:
    if v is None:
        return None
    if isinstance(v, bool):
        return v
    return str(v).strip().lower() in ("true", "yes", "y", "1")


def calculate_risk_tier(profile: dict) -> dict:
    p = dict(profile or {})
    factors: list[dict] = []
    triggers: list[str] = []
    citations: set[str] = {"EI-02", "GL-01"}
    score = 0

    def add(factor: str, value, points: int, cite: str):
        nonlocal score
        score += points
        citations.add(cite)
        factors.append({"factor": factor, "value": value, "points": points, "citation": control_citation(cite)})

    missing = [f for f in KEY_FIELDS if p.get(f) in (None, "", [])]

    di = p.get("decision_impact")
    if di in DECISION_IMPACT:
        add("decision_impact", di, DECISION_IMPACT[di], "GL-02")
    ap = p.get("affected_parties")
    if ap in AFFECTED:
        add("affected_parties", ap, AFFECTED[ap], "EI-04")
    ds = p.get("data_sensitivity")
    if ds in SENSITIVITY:
        add("data_sensitivity", ds, SENSITIVITY[ds], "IS-03")
    au = p.get("autonomy")
    if au in AUTONOMY:
        add("autonomy", au, AUTONOMY[au], "IS-09")

    tools = p.get("tools") or []
    if isinstance(tools, str):
        tools = [t.strip() for t in tools.split(",") if t.strip()]
    write_tools = [t for t in tools if any(h in str(t).lower() for h in WRITE_TOOL_HINTS)]
    if tools:
        add("tool_access", f"{len(tools)} tool(s), {len(write_tools)} with write/act capability",
            5 + (10 if write_tools else 0), "IS-11")
    ext = _bool(p.get("external_actions"))
    if ext:
        add("external_actions", True, 10, "IS-13")

    cat = (p.get("domain_category") or "").strip().lower()
    eu = _bool(p.get("eu_exposure"))
    if cat in ANNEX_III_LIKE:
        add("domain_category", f"{cat} — {ANNEX_III_LIKE[cat]}", CATEGORY_POINTS, "AO-07")
        if eu:
            triggers.append(f"Potential EU AI Act high-risk area: {ANNEX_III_LIKE[cat]} — legal classification review required (Art. 6)")
    elif cat in SECTOR_SENSITIVE:
        add("domain_category", cat, SECTOR_SENSITIVE[cat], "AO-07")
    elif cat:
        add("domain_category", cat, 0, "EI-02")

    if _bool(p.get("genai")):
        add("generative_ai", True, 5, "IS-14")
    if _bool(p.get("vendor_model")):
        add("third_party_model", True, 5, "GL-11")
    if eu:
        add("eu_exposure", True, 5, "AO-07")

    # High-risk triggers (any => High)
    material = di in ("material", "automated_decision")
    if cat in ANNEX_III_LIKE and material:
        triggers.append("Material or automated decisions in a sensitive (Annex III-like) domain")
    if au == "acts_autonomously" and (ext or write_tools):
        triggers.append("Autonomous agent with write or external-action capability")
    if ds == "special_category" and material:
        triggers.append("Special-category data used for material decisions")
    if ap == "vulnerable" and material:
        triggers.append("Material decisions affecting vulnerable people")

    # Prohibited-practice screen (text match on purpose/description)
    text = " ".join(str(p.get(k, "")) for k in ("purpose", "description", "name")).lower()
    prohibited = sorted({label for term, label in PROHIBITED_SCREEN_TERMS.items() if term in text})

    if prohibited:
        tier = "Prohibited-review"
        citations.add("AO-10")
        triggers.extend(f"Possible prohibited practice (EU AI Act Art. 5 screen): {x}" for x in prohibited)
    elif score >= 60 or any(not t.startswith("Potential EU AI Act") for t in triggers):
        tier = "High"
    elif score >= 30:
        tier = "Medium"
    else:
        tier = "Low"

    provisional = bool(missing)
    if len(missing) >= 3 and tier == "Low":
        tier = "Medium"  # safest default when key facts are unknown
        triggers.append("Tier floored at Medium because key intake facts are missing (safest default)")

    # required assessment modules
    mods = ["core"]
    if ds in ("personal", "special_category", "confidential") or "data_sensitivity" in missing:
        mods.append("data_privacy")
    if tier in ("Medium", "High", "Prohibited-review") or tools:
        mods.append("security")
    if _bool(p.get("genai")):
        mods.append("genai_llm")
    if tools or au in ("acts_with_approval", "acts_autonomously"):
        mods.append("agentic")
    if tier in ("High", "Prohibited-review") or material or ap in ("public", "vulnerable"):
        mods.append("fairness_safety")
    if tier in ("High", "Prohibited-review") or material or au in ("acts_with_approval", "acts_autonomously"):
        mods.append("human_oversight")
    if _bool(p.get("vendor_model")):
        mods.append("vendor_third_party")

    rules = TIER_RULES[tier]
    citations |= {"GL-02", "GL-03"}
    rationale_bits = [f"{f['factor']}={f['value']} (+{f['points']})" for f in factors if f["points"]]
    rationale = (f"Preliminary tier {tier} (score {score}). "
                 + ("Drivers: " + "; ".join(rationale_bits) + ". " if rationale_bits else "")
                 + ("Triggers: " + "; ".join(triggers) + ". " if triggers else "")
                 + (f"Provisional — missing: {', '.join(missing)}. " if missing else "")
                 + "Inferred from user-provided intake; requires human confirmation.")

    return {
        "tier": tier,
        "score": score,
        "provisional": provisional,
        "factors": factors,
        "triggers": triggers,
        "missing_fields": missing,
        "clarifying_questions": [INTAKE_FIELDS[f] for f in missing],
        "required_modules": mods,
        "approval_authority": rules["approval_authority"],
        "review_cadence_months": rules["review_cadence_months"],
        "evidence_status": "Inferred",
        "requires_human_confirmation": True,
        "rationale": rationale,
        "citations": [control_citation(c) for c in sorted(citations)],
        "citation_ids": sorted(citations),
        "method": "AEGIS risk-tier rules v1.0 (thresholds: High >= 60 or any high-risk trigger; Medium >= 30)",
    }
