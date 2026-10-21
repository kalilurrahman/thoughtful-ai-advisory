"""AEGIS Agent tools (14) with declared permission levels, RBAC and audit logging.

Every tool is invoked through `invoke(ctx, name, **kwargs)`, which:
  1. checks the caller's role against the tool's permission level and minimum role (least privilege),
  2. runs the tool,
  3. appends an audit record (action `agent.tool.<name>`, trace ID, redacted inputs, outcome).

Permission levels: read < compute < create_draft < write_confirm < approval_required.
  * create_draft tools only ever create records in `draft` / `in_progress` status.
  * write_confirm tools require `confirmed=True` (explicit user confirmation) or return a preview.
  * approval_required tools create a pending approval and only execute with an approved,
    single-use approval resolved by a different user with an approver role.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any, Callable

from aegis_common.audit import AuditLog
from aegis_common.content import control_citation, controls_by_id, get_control
from aegis_common.evidence import NO_SOURCE_MESSAGE
from aegis_common.paths import VAR_DIR
from aegis_common.redaction import redact

from . import approvals as approvals_svc
from . import gaps as gaps_mod
from . import knowledge
from .config import (APPROVAL_REQUIRED, COMPUTE, CREATE_DRAFT, READ, ROLE_PERMISSIONS, ROLE_RANK,
                     SENSITIVE_ACTIONS, WRITE_CONFIRM, User)
from .question_bank import (ANSWER_IDS, applicable_guardrails, applicable_questions, get_question, select_modules,
                            template_meta)
from .store import Store, utcnow


class ToolPermissionError(PermissionError):
    pass


class ToolInputError(ValueError):
    pass


@dataclass
class ToolContext:
    store: Store
    audit: AuditLog
    user: User
    trace_id: str
    session_id: str | None = None
    calls: list[dict] = field(default_factory=list)


@dataclass(frozen=True)
class ToolSpec:
    name: str
    permission: str
    requires_approval: bool
    fn: Callable[..., dict]
    description: str
    min_role: str = "viewer"


# --------------------------------------------------------------------------- helpers
def redact_obj(obj: Any, max_len: int = 500) -> Any:
    """Recursively redact strings (PII masking) and truncate long values for audit records."""
    if isinstance(obj, str):
        t = redact(obj).text
        return t if len(t) <= max_len else t[:max_len] + "…"
    if isinstance(obj, dict):
        return {str(k): redact_obj(v, max_len) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [redact_obj(v, max_len) for v in list(obj)[:50]]
    return obj


def _require(cond: bool, msg: str):
    if not cond:
        raise ToolInputError(msg)


def _get_assessment(ctx: ToolContext, assessment_id: str) -> dict:
    a = ctx.store.get("assessments", assessment_id or "")
    _require(a is not None, f"Assessment {assessment_id!r} not found.")
    return a


def _evidence_lookup(ctx: ToolContext):
    def look(ref: str):
        for e in ctx.store.list("evidence"):
            if e.get("ref", "").upper() == str(ref).upper() or e.get("id") == ref:
                return e
        return None
    return look


def _risk_engine():
    try:
        from aegis_assessment.risk_tier import calculate_risk_tier as engine
        return engine, "aegis_assessment.risk_tier"
    except ImportError:
        return None, None


def _fallback_tier(profile: dict) -> dict:
    """Used only if aegis_assessment is unavailable: safest default, clearly labelled."""
    return {"tier": "High", "score": None, "provisional": True, "factors": [], "triggers": [
        "Risk engine unavailable — defaulted to High pending human review"], "missing_fields": [],
        "required_modules": [], "approval_authority": "AI Governance Forum", "review_cadence_months": 6,
        "evidence_status": "Inferred", "requires_human_confirmation": True,
        "rationale": "The AEGIS risk-tier engine was unavailable; the safest default (High) applies until a human confirms the tier.",
        "citations": [control_citation("EI-02")], "citation_ids": ["EI-02"], "method": "fallback"}


# --------------------------------------------------------------------------- 1 search_aegis_knowledge
def search_aegis_knowledge(ctx: ToolContext, query: str, k: int = 5, kinds: list[str] | None = None) -> dict:
    _require(isinstance(query, str) and query.strip() != "", "query is required")
    idx = knowledge.get_index()
    res = idx.search(query, k=k, kinds=set(kinds) if kinds else None)
    band, conf = knowledge.confidence_band(res[0] if res else None, query)
    refs = knowledge.parse_framework_refs(query)
    fw_matches = [{"framework": fw, "reference": ref,
                   "controls": [c["id"] for c in knowledge.controls_for_framework_ref(fw, ref)]} for fw, ref in refs]
    return {
        "query": query,
        "confidence": conf,
        "band": band,
        "results": [{"id": r["doc"].id, "kind": r["doc"].kind, "title": r["doc"].title, "score": r["score"],
                     "coverage": r["coverage"], "matched": r["matched"], "control_ids": r["doc"].control_ids,
                     "question_ids": r["doc"].question_ids, "source": r["doc"].to_source(), "summary": r["doc"].summary,
                     "text": r["doc"].text} for r in res],
        "framework_matches": fw_matches,
        "indexed_documents": len(idx.docs),
        "no_source_message": NO_SOURCE_MESSAGE if not res else None,
    }


# --------------------------------------------------------------------------- 2 search_ai_inventory
def search_ai_inventory(ctx: ToolContext, query: str = "", filters: dict | None = None, limit: int = 50) -> dict:
    q = (query or "").lower().strip()
    out = []
    for s in ctx.store.list("systems"):
        hay = " ".join(str(v) for v in [s.get("name"), s.get("profile", {}).get("purpose"), s.get("risk_tier"),
                                         s.get("owner"), s.get("status")]).lower()
        if q and not all(tok in hay for tok in q.split()):
            continue
        if filters and any(str(s.get(k) or s.get("profile", {}).get(k)) != str(v) for k, v in filters.items()):
            continue
        out.append({k: s.get(k) for k in ("id", "name", "status", "risk_tier", "risk_tier_status", "owner",
                                           "created_by", "created_at", "assessment_ids")})
    return {"count": len(out[:limit]), "systems": out[:limit]}


# --------------------------------------------------------------------------- 3 create_ai_system_record
def create_ai_system_record(ctx: ToolContext, profile: dict, owner: str | None = None) -> dict:
    _require(isinstance(profile, dict) and profile.get("name"), "profile.name is required")
    rec = ctx.store.put("systems", {
        "name": str(profile["name"])[:120],
        "status": "draft",
        "profile": profile,
        "owner": owner,
        "risk_tier": None,
        "risk_tier_status": "Not confirmed",
        "created_by": ctx.user.id,
        "assessment_ids": [],
        "controls": ["EI-01", "EI-03", "EI-12"],
    })
    return {"status": "draft", "system": rec,
            "message": f"Draft AI system record {rec['id']} created (EI-01, EI-12). Draft records are not authoritative until reviewed."}


# --------------------------------------------------------------------------- 6 calculate_risk_tier
def calculate_risk_tier(ctx: ToolContext, profile: dict) -> dict:
    _require(isinstance(profile, dict), "profile must be an object")
    engine, src = _risk_engine()
    res = engine(profile) if engine else _fallback_tier(profile)
    res = dict(res)
    res["engine"] = src or "fallback"
    res["evidence_status"] = "Inferred"
    res["requires_human_confirmation"] = True
    return res


# --------------------------------------------------------------------------- 4 start_assessment
def start_assessment(ctx: ToolContext, system_id: str | None = None, profile: dict | None = None,
                     profile_provenance: dict | None = None) -> dict:
    system = ctx.store.get("systems", system_id) if system_id else None
    _require(system is not None or profile, "system_id or profile is required")
    prof = dict(profile or system.get("profile") or {})
    risk = calculate_risk_tier(ctx, prof)
    mods = select_modules(prof, risk["tier"], risk.get("required_modules"))
    qs = applicable_questions(prof, risk["tier"], risk.get("required_modules"))
    a = ctx.store.put("assessments", {
        "system_id": system["id"] if system else None,
        "status": "in_progress",
        "template": {"id": template_meta()["id"], "version": template_meta()["version"]},
        "profile": prof,
        "profile_provenance": profile_provenance or {},
        "risk": risk,
        "modules": mods,
        "questions": [q["id"] for q in qs],
        "responses": {},
        "created_by": ctx.user.id,
        "trace_ids": [ctx.trace_id],
    })
    if system:
        system.setdefault("assessment_ids", []).append(a["id"])
        if not system.get("risk_tier"):
            system["inferred_risk_tier"] = risk["tier"]
        ctx.store.put("systems", system)
    return {"status": "in_progress", "assessment_id": a["id"], "risk": risk, "modules": mods,
            "question_count": len(qs), "first_question": qs[0] if qs else None}


# --------------------------------------------------------------------------- 5 submit_assessment_response
def submit_assessment_response(ctx: ToolContext, assessment_id: str, question_id: str, answer: str,
                               evidence_refs: list[str] | None = None, notes: str = "") -> dict:
    a = _get_assessment(ctx, assessment_id)
    _require(a.get("status") in ("in_progress", "completed"), "Assessment is not open for responses.")
    qid = (question_id or "").upper()
    _require(qid in a["questions"], f"{question_id} is not an applicable question for this assessment.")
    _require(answer in ANSWER_IDS, f"answer must be one of {ANSWER_IDS}")
    refs = [str(r)[:80] for r in (evidence_refs or [])][:10]
    for r in refs:
        _require(re.fullmatch(r"[A-Za-z0-9._:/#-]{2,80}", r) is not None, f"Invalid evidence reference {r!r}")
        if not _evidence_lookup(ctx)(r):
            ctx.store.put("evidence", {"ref": r, "assessment_id": assessment_id, "question_id": qid,
                                       "submitted_by": ctx.user.id, "reviewed_by": None, "review_status": "pending",
                                       "label": "User-asserted (pending review)"})
    a["responses"][qid] = {"answer": answer, "evidence_refs": refs, "notes": redact(notes or "").text[:1000],
                           "answered_by": ctx.user.id, "answered_at": utcnow()}
    a.setdefault("trace_ids", [])
    if ctx.trace_id not in a["trace_ids"]:
        a["trace_ids"].append(ctx.trace_id)
    remaining = [q for q in a["questions"] if q not in a["responses"]]
    if not remaining:
        a["status"] = "completed"
    ctx.store.put("assessments", a)
    return {"status": "recorded", "question_id": qid, "answer": answer, "evidence_refs": refs,
            "evidence_status": "User-asserted", "remaining": len(remaining), "assessment_status": a["status"]}


# --------------------------------------------------------------------------- 7 identify_gaps
def identify_gaps(ctx: ToolContext, assessment_id: str, as_of: str | None = None) -> dict:
    a = _get_assessment(ctx, assessment_id)
    d = date.fromisoformat(as_of) if as_of else None
    return gaps_mod.identify_gaps(a, _evidence_lookup(ctx), d)


# --------------------------------------------------------------------------- 8 recommend_controls
def recommend_controls(ctx: ToolContext, assessment_id: str | None = None, profile: dict | None = None,
                       limit: int = 10) -> dict:
    if assessment_id:
        _require(ROLE_RANK[ctx.user.role] >= ROLE_RANK["viewer"], "Assessment data requires an authenticated role.")
        g = identify_gaps(ctx, assessment_id)
        recs = gaps_mod.recommend_controls_from_gaps(g["gaps"], limit)
        return {"basis": "gap analysis", "assessment_id": assessment_id, "controls": recs}
    _require(isinstance(profile, dict), "assessment_id or profile is required")
    risk = calculate_risk_tier(ctx, profile)
    qs = applicable_questions(profile, risk["tier"], risk.get("required_modules"))
    seen, recs = set(), []
    for q in qs:
        for cid in q["controls"]:
            if cid in seen:
                continue
            seen.add(cid)
            c = get_control(cid)
            recs.append({"id": cid, "title": c["title"], "priority": c["priority"], "owner_role": c["owner_role"],
                         "mappings": c.get("mappings", {}), "related_questions": [q["id"]]})
    order = ["critical", "high", "medium", "low"]
    recs.sort(key=lambda r: (order.index(r["priority"]), r["id"]))
    return {"basis": "profile and preliminary risk tier (Inferred)", "tier": risk["tier"], "controls": recs[:limit]}


# --------------------------------------------------------------------------- 9 create_remediation_task
def create_remediation_task(ctx: ToolContext, assessment_id: str, gap_ids: list[str] | None = None,
                            severities: list[str] | None = None, confirmed: bool = False) -> dict:
    g = identify_gaps(ctx, assessment_id)
    selected = [x for x in g["gaps"] if (not gap_ids or x["gap_id"] in gap_ids)
                and (not severities or x["severity"] in severities)]
    _require(bool(selected), "No matching gaps to create tasks for.")
    preview = [{"gap_id": x["gap_id"], "title": x["recommended_action"], "controls": x["controls"],
                "owner_role": x["owner_role"], "due_date": x["due_date"], "severity": x["severity"]} for x in selected]
    if confirmed is not True:
        return {"status": "confirmation_required", "preview": preview,
                "message": f"Confirm to create {len(preview)} remediation task(s). Nothing has been created yet."}
    created = []
    for p in preview:
        t = ctx.store.put("tasks", {**p, "assessment_id": assessment_id, "status": "open",
                                    "created_by": ctx.user.id, "confirmed_by": ctx.user.id,
                                    "source": "AEGIS Agent gap analysis"})
        created.append(t["id"])
    return {"status": "created", "task_ids": created, "count": len(created)}


# --------------------------------------------------------------------------- 10 generate_report
def generate_report(ctx: ToolContext, assessment_id: str, formats: list[str] | None = None,
                    out_dir: str | None = None, synthetic: bool = False, as_of: str | None = None,
                    basename: str | None = None) -> dict:
    from .reporting import build_report_data, export_report
    a = _get_assessment(ctx, assessment_id)
    system = ctx.store.get("systems", a["system_id"]) if a.get("system_id") else {}
    g = identify_gaps(ctx, assessment_id, as_of)
    apprs = [x for x in ctx.store.list("approvals")
             if x.get("resource") in {assessment_id, a.get("system_id")} or (x.get("payload") or {}).get("assessment_id") == assessment_id]
    trace_ids = set(a.get("trace_ids", []))
    trace = [{k: r.get(k) for k in ("id", "ts", "trace_id", "action", "actor", "outcome")}
             for r in ctx.audit.records() if r.get("trace_id") in trace_ids or r.get("resource") in {assessment_id, a.get("system_id")}]
    rid = ctx.store.new_id("reports")
    advice = None
    try:
        from aegis_shield.advisor import advise
        advice = advise(shield_profile(a.get("profile") or {}, (a.get("risk") or {}).get("tier")))
    except Exception:
        advice = None
    data = build_report_data(system=system or {}, assessment=a, gap_result=g, approvals=apprs, audit_trace=trace,
                             prepared_by=f"{ctx.user.display} via AEGIS Agent", synthetic=synthetic,
                             report_id=rid, shield_advice=advice)
    fmts = tuple(formats or ("md", "pdf", "csv", "json"))
    _require(all(f in ("md", "pdf", "csv", "json") for f in fmts), "formats must be md/pdf/csv/json")
    target = Path(out_dir) if out_dir else ctx.store.root / "reports_out" / rid
    res = export_report(data, target, fmts, basename=basename)
    ctx.store.put("reports", {"id": rid, "assessment_id": assessment_id, "status": "draft", "paths": res["paths"],
                              "errors": res["errors"], "created_by": ctx.user.id, "synthetic": synthetic})
    return {"status": "draft", "report_id": rid, "paths": res["paths"], "errors": res["errors"],
            "summary": g["summary"], "markdown": res["markdown"]}


# --------------------------------------------------------------------------- 11 search_runtime_logs
def _runtime_log_files(ctx: ToolContext) -> list[Path]:
    dirs = [ctx.store.root / "runtime_logs", VAR_DIR / "shield", VAR_DIR / "runtime"]
    files = []
    for d in dirs:
        if d.exists():
            files += sorted(d.glob("*.jsonl"))
    return files


def search_runtime_logs(ctx: ToolContext, query: str = "", system_id: str | None = None,
                        decision: str | None = None, limit: int = 50) -> dict:
    import json
    q = (query or "").lower().split()
    hits = []
    for f in _runtime_log_files(ctx):
        try:
            lines = f.read_text(encoding="utf-8").splitlines()
        except OSError:
            continue
        for ln in lines:
            try:
                rec = json.loads(ln)
            except json.JSONDecodeError:
                continue
            blob = json.dumps(rec, default=str).lower()
            if q and not all(t in blob for t in q):
                continue
            if system_id and system_id not in blob:
                continue
            if decision and str(rec.get("decision", rec.get("outcome", ""))).lower() != decision.lower():
                continue
            hits.append(redact_obj(rec, 300))
    hits = hits[-limit:]
    return {"count": len(hits), "records": hits, "sources": [str(f) for f in _runtime_log_files(ctx)],
            "note": None if hits else "No runtime log records matched (or no runtime logs are configured)."}


# --------------------------------------------------------------------------- 12 draft_runtime_policy
_TOOL_HINTS = {  # agent intake tool keyword -> Shield tool name + operation (User-asserted only when stated)
    "crm": ("crm.lookup_customer", "read"), "knowledge_base": ("kb.search", "read"), "database": ("db.query", "read"),
    "web_search": ("web.search", "read"), "ticketing": ("ticket.update", "write"), "calendar": ("calendar.schedule", "write"),
    "email": ("email.send_reply", "external_send"), "messaging": ("message.send", "external_send"),
    "payments": ("payments.refund", "payment"), "code_repository": ("repo.push_commit", "write"),
    "hr_system": ("ats.read_candidates", "read"), "file_storage": ("files.read", "read"), "code_execution": ("code.execute", "write"),
}
_ENV_MAP = {"idea": "dev", "development": "dev", "pilot": "staging", "production": "production"}


def shield_profile(profile: dict, tier: str | None = None) -> dict:
    """Translate an agent intake profile into the AEGIS Shield advisor profile (tolerant aliases)."""
    p = profile or {}
    tools = []
    for t in p.get("tools") or []:
        name, op = _TOOL_HINTS.get(str(t), (str(t), None))
        tools.append({"name": name, **({"description": f"{t} ({op})"} if op else {})})
    out = {"app_name": p.get("name"), "purpose": p.get("purpose"), "tools": tools,
           "data_sensitivity": p.get("data_sensitivity"), "autonomy": p.get("autonomy"),
           "affected_parties": p.get("affected_parties"), "risk_tier": tier}
    if p.get("environment") in _ENV_MAP:
        out["environment"] = _ENV_MAP[p["environment"]]
    if p.get("vendor_model"):
        out["vendor"] = "Third-party model provider (to be confirmed)"
    if p.get("autonomy") == "acts_with_approval":
        out["human_approval_model"] = "high_impact_only"
    return {k: v for k, v in out.items() if v not in (None, "", [])}


def draft_runtime_policy(ctx: ToolContext, assessment_id: str | None = None, profile: dict | None = None) -> dict:
    prof = dict(profile or {})
    tier = None
    if assessment_id:
        a = _get_assessment(ctx, assessment_id)
        prof = dict(a.get("profile") or {})
        tier = (a.get("risk") or {}).get("tier")
    _require(bool(prof), "assessment_id or profile is required")
    fallback = [{"id": g["id"], "title": g["title"], "controls": g["controls"]} for g in applicable_guardrails(prof)]
    try:
        from aegis_shield.advisor import advise
    except ImportError:
        return {"status": "unavailable", "guardrails": fallback,
                "message": ("The AEGIS Shield policy generator is not available in this deployment, so no machine-readable "
                            "policy was drafted. The guardrail recommendations below come from the use-case question bank.")}
    try:
        advice = advise(shield_profile(prof, tier))
    except Exception as exc:
        return {"status": "unavailable", "guardrails": fallback, "message": f"AEGIS Shield advisor failed ({type(exc).__name__}); no policy drafted."}
    policy = advice.get("policy")
    rec = ctx.store.put("policies", {"status": "draft", "environment": "non-production", "mode": "monitor",
                                     "assessment_id": assessment_id, "policy": policy, "created_by": ctx.user.id,
                                     "citations": advice.get("citations", [])})
    errors = list((advice.get("policy_validation") or {}).get("errors") or [])
    if not policy:
        errors.append("advisor returned no policy")
    return {"status": "draft", "policy_id": rec["id"], "mode": "monitor", "environment": "non-production",
            "validation_errors": errors, "guardrails": fallback, "advice": advice,
            "message": ("Draft runtime policy created by AEGIS Shield (status: draft, observe/monitor mode, not active). "
                        "Activating it in production requires human approval.")}


# --------------------------------------------------------------------------- 13 request_human_approval
def request_human_approval(ctx: ToolContext, action: str, resource_id: str | None = None,
                           payload: dict | None = None, reason: str = "") -> dict:
    _require(action in SENSITIVE_ACTIONS, f"action must be one of {sorted(SENSITIVE_ACTIONS)}")
    rec = approvals_svc.create_approval(ctx.store, ctx.audit, ctx.user, action, resource_id, payload,
                                        redact(reason or "").text, trace_id=ctx.trace_id, session_id=ctx.session_id)
    return {"status": "pending", "approval_id": rec["approval_id"], "type": action, "resource": resource_id,
            "controls": rec["controls"], "deduplicated": rec.get("deduplicated", False),
            "message": (f"Pending approval {rec['approval_id']} created for: {SENSITIVE_ACTIONS[action]}. It will not take "
                        "effect unless a different user with an approver role approves it.")}


# --------------------------------------------------------------------------- 14 export_evidence_pack
def export_evidence_pack(ctx: ToolContext, assessment_id: str, approval_id: str | None = None,
                         out_dir: str | None = None) -> dict:
    import json
    a = _get_assessment(ctx, assessment_id)
    if not approval_id:
        res = request_human_approval(ctx, "export_sensitive_evidence", assessment_id,
                                     {"assessment_id": assessment_id}, "Export evidence pack for assessment " + assessment_id)
        return {"status": "pending_approval", **{k: res[k] for k in ("approval_id", "message", "controls")}}
    try:
        appr = approvals_svc.consume_approval(ctx.store, approval_id, "export_sensitive_evidence", assessment_id,
                                              ctx.user)
    except approvals_svc.ApprovalError as exc:
        raise ToolPermissionError(str(exc)) from exc
    g = identify_gaps(ctx, assessment_id)
    ev = [e for e in ctx.store.list("evidence") if e.get("assessment_id") == assessment_id]
    pack = {"assessment_id": assessment_id, "system_id": a.get("system_id"), "approval_id": approval_id,
            "approved_by": appr.get("resolved_by"), "exported_by": ctx.user.id, "exported_at": utcnow(),
            "evidence": ev, "findings": g["findings"], "risk": a.get("risk"),
            "disclaimer": "Evidence pack for audit preparation. It does not constitute a certification or legal opinion."}
    target = Path(out_dir) if out_dir else ctx.store.root / "exports_out" / approval_id
    target.mkdir(parents=True, exist_ok=True)
    p = target / f"evidence_pack_{assessment_id}.json"
    p.write_text(json.dumps(pack, indent=2, default=str), encoding="utf-8")
    ctx.store.put("exports", {"assessment_id": assessment_id, "approval_id": approval_id, "path": str(p),
                              "exported_by": ctx.user.id})
    return {"status": "exported", "path": str(p), "evidence_items": len(ev)}


# --------------------------------------------------------------------------- registry
TOOL_REGISTRY: dict[str, ToolSpec] = {s.name: s for s in [
    ToolSpec("search_aegis_knowledge", READ, False, search_aegis_knowledge,
             "BM25 retrieval over controls, assessment templates, policy/industry packs and compliance mapping docs.", "anonymous"),
    ToolSpec("search_ai_inventory", READ, False, search_ai_inventory, "Search AI system records.", "viewer"),
    ToolSpec("create_ai_system_record", CREATE_DRAFT, False, create_ai_system_record,
             "Create a draft AI system record.", "assessor"),
    ToolSpec("start_assessment", CREATE_DRAFT, False, start_assessment,
             "Start a use-case assessment (risk tier + applicable modules).", "assessor"),
    ToolSpec("submit_assessment_response", CREATE_DRAFT, False, submit_assessment_response,
             "Record an answer and evidence references (User-asserted).", "assessor"),
    ToolSpec("calculate_risk_tier", COMPUTE, False, calculate_risk_tier,
             "Preliminary, explainable risk tier (Inferred; requires human confirmation).", "anonymous"),
    ToolSpec("identify_gaps", COMPUTE, False, identify_gaps,
             "Classify findings by evidence status and severity; owners and due dates.", "viewer"),
    ToolSpec("recommend_controls", COMPUTE, False, recommend_controls,
             "Recommend AEGIS controls from gaps or from a profile.", "anonymous"),
    ToolSpec("create_remediation_task", WRITE_CONFIRM, False, create_remediation_task,
             "Create remediation tasks (requires explicit user confirmation).", "assessor"),
    ToolSpec("generate_report", CREATE_DRAFT, False, generate_report,
             "Generate a draft readiness report (Markdown, PDF, CSV gap register, JSON).", "assessor"),
    ToolSpec("search_runtime_logs", READ, False, search_runtime_logs,
             "Search runtime guardrail decision logs (redacted).", "assessor"),
    ToolSpec("draft_runtime_policy", CREATE_DRAFT, False, draft_runtime_policy,
             "Draft a runtime guardrail policy (draft, observe mode, not active) via AEGIS Shield.", "assessor"),
    ToolSpec("request_human_approval", CREATE_DRAFT, False, request_human_approval,
             "Create a pending approval for a sensitive action (never self-executes).", "assessor"),
    ToolSpec("export_evidence_pack", APPROVAL_REQUIRED, True, export_evidence_pack,
             "Export an evidence pack — only with an approved, single-use approval.", "assessor"),
]}


def check_permission(user: User, spec: ToolSpec) -> str | None:
    if spec.permission not in ROLE_PERMISSIONS.get(user.role, set()):
        return f"role '{user.role}' may not use {spec.permission} tools"
    if ROLE_RANK.get(user.role, -1) < ROLE_RANK[spec.min_role]:
        return f"{spec.name} requires role '{spec.min_role}' or higher (you are '{user.role}')"
    return None


def invoke(ctx: ToolContext, name: str, **kwargs) -> dict:
    spec = TOOL_REGISTRY.get(name)
    if spec is None:
        raise ToolInputError(f"Unknown tool {name}")
    safe_inputs = redact_obj(kwargs)
    denied = check_permission(ctx.user, spec)
    call = {"tool": name, "permission": spec.permission, "trace_id": ctx.trace_id}
    if denied:
        ctx.audit.append(f"agent.tool.{name}", ctx.user.id, {"inputs": safe_inputs, "permission": spec.permission,
                                                             "role": ctx.user.role, "reason": denied},
                         trace_id=ctx.trace_id, outcome="denied")
        ctx.calls.append({**call, "outcome": "denied"})
        raise ToolPermissionError(denied)
    try:
        result = spec.fn(ctx, **kwargs)
    except (ToolInputError, ToolPermissionError, approvals_svc.ApprovalError) as exc:
        outcome = "denied" if isinstance(exc, (ToolPermissionError, approvals_svc.ApprovalError)) else "rejected"
        ctx.audit.append(f"agent.tool.{name}", ctx.user.id, {"inputs": safe_inputs, "permission": spec.permission,
                                                             "error": str(exc)[:300]}, trace_id=ctx.trace_id, outcome=outcome)
        ctx.calls.append({**call, "outcome": outcome})
        raise
    except Exception as exc:
        ctx.audit.append(f"agent.tool.{name}", ctx.user.id, {"inputs": safe_inputs, "permission": spec.permission,
                                                             "error": f"{type(exc).__name__}: {str(exc)[:200]}"},
                         trace_id=ctx.trace_id, outcome="error")
        ctx.calls.append({**call, "outcome": "error"})
        raise
    summary = {k: result.get(k) for k in ("status", "assessment_id", "approval_id", "report_id", "policy_id",
                                         "task_ids", "count", "band", "tier") if isinstance(result, dict) and k in result}
    ctx.audit.append(f"agent.tool.{name}", ctx.user.id, {"inputs": safe_inputs, "permission": spec.permission,
                                                         "result": redact_obj(summary)},
                     trace_id=ctx.trace_id, resource=(result or {}).get("assessment_id") or kwargs.get("assessment_id"))
    ctx.calls.append({**call, "outcome": "success"})
    return result


def known_control(cid: str) -> bool:
    return cid in controls_by_id()
