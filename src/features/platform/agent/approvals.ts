/**
 * Human-approval service: pending approvals, separation of duties, effects on approval
 * (veritrail_agent/approvals.py).
 *
 * The agent can only *request* approvals. Resolution happens outside the conversation (the
 * console's Approvals panel → VeritrailAgent.resolveApproval) by a user with an approver/admin role
 * who is NOT the requester. Every resolution attempt — including refusals — is audit-logged.
 */
import { sha256Hex } from "../audit";
import type { AgentAuditLog } from "./audit-log";
import {
  APPROVER_ROLES,
  SENSITIVE_ACTION_CONTROLS,
  SENSITIVE_ACTIONS,
  type User,
} from "./config";
import { pyDumps, pySlice } from "./py";
import { addDays } from "./runtime";
import type { ApprovalRecord, NewRecord, Store } from "./store";

export class ApprovalError extends Error {
  override name = "ApprovalError";
}

export function payloadHash(payload: Record<string, unknown> | null | undefined): string {
  return sha256Hex(pyDumps(payload ?? {}, { sortKeys: true })).slice(0, 16);
}

export type ApprovalResult = ApprovalRecord & { deduplicated?: boolean };

export function createApproval(
  store: Store,
  audit: AgentAuditLog,
  user: User,
  action: string,
  resource: string | null,
  payload: Record<string, unknown> | null,
  reason: string,
  opts: { traceId: string; sessionId?: string | null },
): ApprovalResult {
  if (!(action in SENSITIVE_ACTIONS)) {
    throw new ApprovalError(
      `Unknown approval action '${action}'. Allowed: ${Object.keys(SENSITIVE_ACTIONS).sort().join(", ")}`,
    );
  }
  // De-duplicate: an identical pending request returns the existing record.
  const ph = payloadHash({ action, resource, ...(payload ?? {}) });
  for (const a of store.list("approvals")) {
    if (a.status === "pending" && a.payload_hash === ph && a.requested_by === user.id) {
      return { ...a, deduplicated: true };
    }
  }
  const aid = store.newId("approvals");
  const label = SENSITIVE_ACTIONS[action] ?? action;
  const rec: NewRecord<ApprovalRecord> = {
    id: aid,
    approval_id: aid,
    type: action,
    action_type: action,
    action_label: label,
    status: "pending",
    resource,
    payload: payload ?? {},
    payload_hash: ph,
    reason: pySlice(reason || label, 500),
    controls: SENSITIVE_ACTION_CONTROLS[action] ?? [],
    requested_by: user.id,
    requested_by_name: user.name || user.id,
    requested_role: user.role,
    required_approver_roles: [...APPROVER_ROLES].sort(),
    separation_of_duties: "Requester cannot approve their own request.",
    trace_id: opts.traceId,
    session_id: opts.sessionId ?? null,
    executed: false,
  };
  const saved = store.put("approvals", rec);
  audit.append(
    "approval.requested",
    user.id,
    { approval_id: aid, type: action, resource, reason: pySlice(saved.reason, 200) },
    { traceId: opts.traceId, resource: aid },
  );
  return saved;
}

export function resolveApproval(
  store: Store,
  audit: AgentAuditLog,
  approvalId: string,
  decision: string,
  approver: User,
  note = "",
  traceId: string | null = null,
): ApprovalRecord {
  const rec = store.get("approvals", approvalId);
  if (!rec) throw new ApprovalError(`Approval ${approvalId} not found.`);
  if (!APPROVER_ROLES.has(approver.role)) {
    audit.append(
      "approval.resolve_denied",
      approver.id,
      { approval_id: approvalId, reason: "role" },
      { traceId, resource: approvalId, outcome: "denied" },
    );
    throw new ApprovalError("Only users with an approver or admin role may resolve approvals.");
  }
  if (rec.status !== "pending") throw new ApprovalError(`Approval ${approvalId} is already ${rec.status}.`);
  const requesterIds = new Set([rec.requested_by, rec.requested_by_name].filter((x) => x));
  if (requesterIds.has(approver.id) || (approver.name && requesterIds.has(approver.name))) {
    audit.append(
      "approval.resolve_denied",
      approver.id,
      { approval_id: approvalId, reason: "self-approval" },
      { traceId, resource: approvalId, outcome: "denied" },
    );
    throw new ApprovalError("Separation of duties: the requester cannot approve their own request.");
  }
  if (decision !== "approve" && decision !== "reject") {
    throw new ApprovalError("decision must be 'approve' or 'reject'");
  }
  Object.assign(rec, {
    status: decision === "approve" ? "approved" : "rejected",
    resolved_by: approver.id,
    resolved_by_name: approver.name || approver.id,
    resolved_role: approver.role,
    resolved_at: store.runtime.utcnow(),
    note: pySlice(note || "", 500),
  });
  if (decision === "approve") {
    rec.execution_result = applyEffect(store, rec, approver);
    rec.executed = rec.type !== "export_sensitive_evidence";
  }
  store.put("approvals", rec);
  audit.append(
    `approval.${rec.status}`,
    approver.id,
    {
      approval_id: approvalId,
      type: rec.type,
      requested_by: rec.requested_by,
      note: pySlice(note || "", 200),
      effect: rec.execution_result ?? null,
    },
    { traceId: traceId || rec.trace_id, resource: approvalId },
  );
  return rec;
}

function applyEffect(store: Store, rec: ApprovalRecord, approver: User): Record<string, unknown> {
  const t = rec.type;
  const p = rec.payload ?? {};
  const now = () => store.runtime.utcnow();
  if (t === "change_risk_tier" || t === "confirm_risk_tier") {
    const sid = rec.resource;
    const system = sid ? store.get("systems", sid) : null;
    if (!system) return { status: "no_effect", message: "System record not found; tier unchanged." };
    const newTier = (p["to_tier"] || p["tier"] || null) as string | null;
    system.risk_tier = newTier;
    system.risk_tier_status = `Confirmed by ${approver.name || approver.id} (${now().slice(0, 10)})`;
    (system.tier_history ??= []).push({
      tier: newTier,
      approval_id: rec.id,
      approved_by: approver.id,
      at: now(),
    });
    store.put("systems", system);
    return { status: "applied", system_id: sid, risk_tier: newTier };
  }
  if (t === "approve_exception") {
    const days = Number(p["expiry_days"] || 90);
    const exc = store.put("exceptions", {
      approval_id: rec.id,
      resource: rec.resource,
      control_ids: p["control_ids"] ?? [],
      justification: rec.reason,
      approved_by: approver.id,
      expires_on: addDays(store.runtime.today(), days),
    });
    return { status: "applied", exception_id: exc.id, expires_on: exc.expires_on };
  }
  if (t === "activate_runtime_policy") {
    const pid = rec.resource;
    const pol = pid ? store.get("policies", pid) : null;
    if (!pol) return { status: "no_effect", message: "Policy draft not found." };
    Object.assign(pol, {
      status: "approved_for_activation",
      environment: (p["environment"] as string | undefined) ?? "production",
      approved_by: approver.id,
      approval_id: rec.id,
    });
    store.put("policies", pol);
    return {
      status: "applied",
      policy_id: pid,
      message:
        "Policy approved for activation; deployment to the enforcement point is performed by the platform team.",
    };
  }
  if (t === "send_external_communication") {
    const out = store.put("outbox", {
      approval_id: rec.id,
      to: p["to"] ?? null,
      subject: p["subject"] ?? null,
      body_ref: p["body_ref"] ?? null,
      status: "queued",
      note: "Approved and queued. The MVP does not transmit messages; a delivery integration sends queued items.",
    });
    return { status: "queued", outbox_id: out.id };
  }
  if (t === "export_sensitive_evidence") {
    return {
      status: "approved_pending_execution",
      message: "Requester may now run export_evidence_pack with this approval_id (single use).",
    };
  }
  return { status: "no_effect" };
}

/**
 * Validate an approved, unused approval for (action, resource) and mark it consumed.
 * Only the original requester may execute the approved action.
 */
export function consumeApproval(
  store: Store,
  approvalId: string | null | undefined,
  action: string,
  resource: string | null,
  user: User | null = null,
): ApprovalRecord {
  const rec = store.get("approvals", approvalId || "");
  if (!rec) throw new ApprovalError("Approval not found.");
  if (user && rec.requested_by !== user.id) {
    throw new ApprovalError("Only the original requester may execute this approved action.");
  }
  if (rec.type !== action || (resource && rec.resource !== resource)) {
    throw new ApprovalError("Approval does not match this action/resource.");
  }
  if (rec.status !== "approved") throw new ApprovalError(`Approval is ${rec.status}, not approved.`);
  if (rec.executed) throw new ApprovalError("Approval has already been used.");
  rec.executed = true;
  rec.executed_at = store.runtime.utcnow();
  store.put("approvals", rec);
  return rec;
}
