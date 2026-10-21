"""Human-approval service: pending approvals, separation of duties, effects on approval.

The agent can only *request* approvals. Resolution happens outside the conversational
loop (admin CLI `approvals resolve`, or `AegisAgent.resolve_approval()` called by an
authenticated approver UI) by a user with an approver/admin role who is NOT the requester.
Effects of an approved request are applied at resolution time by the human decision,
except evidence exports, which the requester runs afterwards with the single-use approval ID.
"""
from __future__ import annotations

import hashlib
import json
from datetime import date, timedelta

from aegis_common.audit import AuditLog

from .config import APPROVER_ROLES, SENSITIVE_ACTION_CONTROLS, SENSITIVE_ACTIONS, User
from .store import Store, utcnow


class ApprovalError(Exception):
    pass


def payload_hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload or {}, sort_keys=True, default=str).encode()).hexdigest()[:16]


def create_approval(store: Store, audit: AuditLog, user: User, action: str, resource: str | None,
                    payload: dict | None, reason: str, *, trace_id: str, session_id: str | None = None) -> dict:
    if action not in SENSITIVE_ACTIONS:
        raise ApprovalError(f"Unknown approval action '{action}'. Allowed: {', '.join(sorted(SENSITIVE_ACTIONS))}")
    # De-duplicate: an identical pending request returns the existing record.
    ph = payload_hash({"action": action, "resource": resource, **(payload or {})})
    for a in store.list("approvals"):
        if a.get("status") == "pending" and a.get("payload_hash") == ph and a.get("requested_by") == user.id:
            return {**a, "deduplicated": True}
    aid = store.new_id("approvals")
    rec = {
        "id": aid,
        "approval_id": aid,
        "type": action,
        "action_type": action,
        "action_label": SENSITIVE_ACTIONS[action],
        "status": "pending",
        "resource": resource,
        "payload": payload or {},
        "payload_hash": ph,
        "reason": (reason or SENSITIVE_ACTIONS[action])[:500],
        "controls": SENSITIVE_ACTION_CONTROLS.get(action, []),
        "requested_by": user.id,
        "requested_by_name": user.name or user.id,
        "requested_role": user.role,
        "required_approver_roles": sorted(APPROVER_ROLES),
        "separation_of_duties": "Requester cannot approve their own request.",
        "trace_id": trace_id,
        "session_id": session_id,
        "executed": False,
    }
    store.put("approvals", rec)
    audit.append("approval.requested", user.id, {"approval_id": aid, "type": action, "resource": resource,
                                                 "reason": rec["reason"][:200]}, trace_id=trace_id, resource=aid)
    return rec


def resolve_approval(store: Store, audit: AuditLog, approval_id: str, decision: str, approver: User,
                     note: str = "", *, trace_id: str | None = None) -> dict:
    rec = store.get("approvals", approval_id)
    if rec is None:
        raise ApprovalError(f"Approval {approval_id} not found.")
    if approver.role not in APPROVER_ROLES:
        audit.append("approval.resolve_denied", approver.id, {"approval_id": approval_id, "reason": "role"},
                     trace_id=trace_id, resource=approval_id, outcome="denied")
        raise ApprovalError("Only users with an approver or admin role may resolve approvals.")
    if rec["status"] != "pending":
        raise ApprovalError(f"Approval {approval_id} is already {rec['status']}.")
    requester_ids = {rec.get("requested_by"), rec.get("requested_by_name")} - {None, ""}
    if approver.id in requester_ids or (approver.name and approver.name in requester_ids):
        audit.append("approval.resolve_denied", approver.id, {"approval_id": approval_id, "reason": "self-approval"},
                     trace_id=trace_id, resource=approval_id, outcome="denied")
        raise ApprovalError("Separation of duties: the requester cannot approve their own request.")
    if decision not in ("approve", "reject"):
        raise ApprovalError("decision must be 'approve' or 'reject'")
    rec.update(status="approved" if decision == "approve" else "rejected", resolved_by=approver.id,
               resolved_by_name=approver.name or approver.id, resolved_role=approver.role, resolved_at=utcnow(),
               note=(note or "")[:500])
    if decision == "approve":
        rec["execution_result"] = _apply_effect(store, rec, approver)
        rec["executed"] = rec["type"] != "export_sensitive_evidence"
    store.put("approvals", rec)
    audit.append(f"approval.{rec['status']}", approver.id,
                 {"approval_id": approval_id, "type": rec["type"], "requested_by": rec["requested_by"],
                  "note": (note or "")[:200], "effect": rec.get("execution_result")},
                 trace_id=trace_id or rec.get("trace_id"), resource=approval_id)
    return rec


def _apply_effect(store: Store, rec: dict, approver: User) -> dict:
    t, p = rec["type"], rec.get("payload") or {}
    if t in ("change_risk_tier", "confirm_risk_tier"):
        sid = rec.get("resource")
        system = store.get("systems", sid) if sid else None
        if not system:
            return {"status": "no_effect", "message": "System record not found; tier unchanged."}
        new_tier = p.get("to_tier") or p.get("tier")
        system["risk_tier"] = new_tier
        system["risk_tier_status"] = f"Confirmed by {approver.name or approver.id} ({utcnow()[:10]})"
        system.setdefault("tier_history", []).append({"tier": new_tier, "approval_id": rec["id"],
                                                     "approved_by": approver.id, "at": utcnow()})
        store.put("systems", system)
        return {"status": "applied", "system_id": sid, "risk_tier": new_tier}
    if t == "approve_exception":
        days = int(p.get("expiry_days") or 90)
        exc = store.put("exceptions", {"approval_id": rec["id"], "resource": rec.get("resource"),
                                       "control_ids": p.get("control_ids", []), "justification": rec.get("reason"),
                                       "approved_by": approver.id,
                                       "expires_on": (date.today() + timedelta(days=days)).isoformat()})
        return {"status": "applied", "exception_id": exc["id"], "expires_on": exc["expires_on"]}
    if t == "activate_runtime_policy":
        pid = rec.get("resource")
        pol = store.get("policies", pid) if pid else None
        if not pol:
            return {"status": "no_effect", "message": "Policy draft not found."}
        pol.update(status="approved_for_activation", environment=p.get("environment", "production"),
                   approved_by=approver.id, approval_id=rec["id"])
        store.put("policies", pol)
        return {"status": "applied", "policy_id": pid,
                "message": "Policy approved for activation; deployment to the enforcement point is performed by the platform team."}
    if t == "send_external_communication":
        out = store.put("outbox", {"approval_id": rec["id"], "to": p.get("to"), "subject": p.get("subject"),
                                   "body_ref": p.get("body_ref"), "status": "queued",
                                   "note": "Approved and queued. The MVP does not transmit messages; a delivery integration sends queued items."})
        return {"status": "queued", "outbox_id": out["id"]}
    if t == "export_sensitive_evidence":
        return {"status": "approved_pending_execution",
                "message": "Requester may now run export_evidence_pack with this approval_id (single use)."}
    return {"status": "no_effect"}


def consume_approval(store: Store, approval_id: str, action: str, resource: str | None,
                     user: User | None = None) -> dict:
    """Validate an approved, unused approval for (action, resource) and mark it consumed.
    Only the original requester may execute the approved action."""
    rec = store.get("approvals", approval_id or "")
    if not rec:
        raise ApprovalError("Approval not found.")
    if user is not None and rec.get("requested_by") != user.id:
        raise ApprovalError("Only the original requester may execute this approved action.")
    if rec["type"] != action or (resource and rec.get("resource") != resource):
        raise ApprovalError("Approval does not match this action/resource.")
    if rec["status"] != "approved":
        raise ApprovalError(f"Approval is {rec['status']}, not approved.")
    if rec.get("executed"):
        raise ApprovalError("Approval has already been used.")
    rec["executed"] = True
    rec["executed_at"] = utcnow()
    store.put("approvals", rec)
    return rec
