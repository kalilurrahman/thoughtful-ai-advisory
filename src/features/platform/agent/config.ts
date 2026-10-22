/** Agent configuration: roles, permission levels and the user model (aegis_agent/config.py). */

export { CTA_ASSESSMENT, CTA_BASELINE, CTA_SHIELD } from "@/features/site/engines/ask-aegis/compose";

// --------------------------------------------------------------------------- permissions
export const READ = "read";
export const COMPUTE = "compute";
export const CREATE_DRAFT = "create_draft";
export const WRITE_CONFIRM = "write_confirm";
export const APPROVAL_REQUIRED = "approval_required";
export const PERMISSION_LEVELS = [READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED];
export type Permission = (typeof PERMISSION_LEVELS)[number];

/** Roles, least to most privileged. "anonymous" is the public website visitor. */
export const ROLES = ["anonymous", "viewer", "assessor", "approver", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_RANK: Record<string, number> = Object.fromEntries(ROLES.map((r, i) => [r, i]));

/** Permission levels each role may invoke. approval_required tools may be *requested* by assessors. */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<string>> = {
  anonymous: new Set([READ, COMPUTE]),
  viewer: new Set([READ, COMPUTE]),
  assessor: new Set([READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED]),
  approver: new Set([READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED]),
  admin: new Set([READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED]),
};
/** Roles that may resolve (approve/reject) pending approvals — never their own. */
export const APPROVER_ROLES: ReadonlySet<string> = new Set(["approver", "admin"]);
/** Roles that may mark evidence as reviewed (making it Verified). */
export const EVIDENCE_REVIEWER_ROLES: ReadonlySet<string> = new Set(["approver", "admin"]);

/** Actions that must go through request_human_approval and never self-execute. */
export const SENSITIVE_ACTIONS: Record<string, string> = {
  change_risk_tier: "Change an AI system's risk tier",
  confirm_risk_tier: "Confirm an inferred risk tier for an AI system",
  approve_exception: "Approve a governance exception / risk acceptance",
  activate_runtime_policy: "Activate or change a production runtime policy",
  export_sensitive_evidence: "Export a sensitive evidence pack",
  send_external_communication: "Send an external communication",
};
/** Control IDs that justify each approval type (all exist in controls.yaml). */
export const SENSITIVE_ACTION_CONTROLS: Record<string, string[]> = {
  change_risk_tier: ["EI-02", "GL-03"],
  confirm_risk_tier: ["EI-02", "GL-03"],
  approve_exception: ["GL-10"],
  activate_runtime_policy: ["IS-12", "GL-04"],
  export_sensitive_evidence: ["SE-02", "SE-05"],
  send_external_communication: ["AO-06", "SE-11"],
};

export interface User {
  id: string;
  role: Role;
  name: string;
  org: string;
}

export type UserInput =
  | User
  | { id?: string; user_id?: string; email?: string; role?: string; name?: string; org?: string }
  | string
  | null
  | undefined;

export function userDisplay(u: User): string {
  return u.name || u.id;
}

function isRole(r: string): r is Role {
  return (ROLES as readonly string[]).includes(r);
}

/**
 * Accept a user object, a bare user-id string, or null/undefined (coerce_user).
 * Strings are authenticated-but-unprivileged viewers; null is the anonymous visitor;
 * unknown roles are downgraded to anonymous.
 */
export function coerceUser(user: UserInput): User {
  let id: string;
  let role: string;
  let name = "";
  let org = "";
  if (user === null || user === undefined) {
    id = "anonymous";
    role = "anonymous";
  } else if (typeof user === "string") {
    id = user;
    role = "viewer";
  } else {
    const u = user as { id?: string; user_id?: string; email?: string; role?: string; name?: string; org?: string };
    id = String(u.id || u.user_id || u.email || "anonymous");
    role = String(u.role || "viewer");
    name = String(u.name || "");
    org = String(u.org || "");
  }
  return { id, role: isRole(role) ? role : "anonymous", name, org };
}
