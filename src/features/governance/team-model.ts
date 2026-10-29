// Team workspace rules shared by the team server functions and screens. The database enforces
// the same rules (migration 0012); these keep the screens honest and are unit-tested.

export const MEMBER_ROLES = ["owner", "admin", "operator", "approver", "viewer"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export const INVITABLE_ROLES = ["admin", "operator", "approver", "viewer"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABELS: Record<MemberRole, { name: string; summary: string }> = {
  owner: { name: "Owner", summary: "Created the workspace; manages members and billing." },
  admin: { name: "Admin", summary: "Edits the workspace and manages members." },
  operator: { name: "Operator", summary: "Edits the workspace." },
  approver: { name: "Approver", summary: "Reads the workspace; free seat." },
  viewer: { name: "Viewer", summary: "Reads the workspace; free seat." },
};

/** Roles that edit the workspace use a paid operator seat; approvers and viewers are free. */
export function usesSeat(role: MemberRole): boolean {
  return role === "owner" || role === "admin" || role === "operator";
}
export function canEdit(role: MemberRole | null): boolean {
  return role !== null && usesSeat(role);
}
export function canManageMembers(role: MemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** Whether `actor` may change or remove `target` (the database applies the same rule). */
export function canManage(actor: MemberRole | null, target: MemberRole, self: boolean): boolean {
  if (target === "owner") return false;
  if (actor === "owner") return true;
  if (actor === "admin") return target !== "admin" || self;
  return false;
}

export function seatLimitMessage(limit: number, planName: string): string {
  return `All ${limit} operator ${limit === 1 ? "seat is" : "seats are"} in use on the ${planName} plan. Invite as an approver or viewer (free), free a seat, or upgrade on the Plans page.`;
}

/** Null when an invitation for `role` fits the plan, otherwise why not. */
export function checkSeat(
  role: InvitableRole,
  seatsInUse: number,
  limit: number,
  planName: string,
): string | null {
  if (!usesSeat(role)) return null;
  return seatsInUse >= limit ? seatLimitMessage(limit, planName) : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function normalizeInviteEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

export function inviteLink(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/invite?token=${encodeURIComponent(token)}`;
}

/** A 256-bit random token, base64url, for an invitation link. */
export function newInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Hex SHA-256 of the token; only the hash is stored. */
export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
