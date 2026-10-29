import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  INVITABLE_ROLES,
  MEMBER_ROLES,
  checkSeat,
  hashInviteToken,
  inviteLink,
  newInviteToken,
  normalizeInviteEmail,
  usesSeat,
  type InvitableRole,
  type MemberRole,
} from "./team-model";

// Team workspaces (migration 0012): members, roles and invitation links. Every call runs with
// the caller's own Supabase client, so row-level security and the membership functions decide
// what they may see and change; these functions add the plan's seat limit and friendly errors.
// No e-mail is sent: the inviter copies the link, and the screen says so.

export interface TeamMember {
  userId: string;
  role: MemberRole;
  name: string;
  email: string;
  joinedAt: string;
}
export interface PendingInvitation {
  id: string;
  email: string;
  role: InvitableRole;
  expiresAt: string;
}
export interface TeamView {
  role: MemberRole | null;
  members: TeamMember[];
  invitations: PendingInvitation[];
  seats: { used: number; limit: number; plan: string };
}

export type TeamResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// The team tables and functions are newer than the generated Supabase types.
interface Rpc {
  rpc(fn: string, args: object): Promise<{ data: unknown; error: { code?: string } | null }>;
}
interface InvitationTable {
  from(table: "organization_invitations"): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): {
        is(
          column: string,
          value: null,
        ): {
          gt(
            column: string,
            value: string,
          ): Promise<{ data: Record<string, string>[] | null; error: unknown }>;
        };
      };
    };
    insert(row: object): Promise<{ error: { code?: string } | null }>;
    delete(): {
      eq(column: string, value: string): Promise<{ error: unknown }>;
    };
  };
}

const call = (client: unknown, fn: string, args: object) =>
  (client as Rpc).rpc(fn, args) as ReturnType<Rpc["rpc"]>;

const TEAM_UNAVAILABLE =
  "Team features are not available yet for this workspace. Save it first, then try again.";

async function loadTeam(client: unknown, orgId: string): Promise<TeamView> {
  const [roleRes, directory] = await Promise.all([
    call(client, "org_role", { p_org: orgId }),
    call(client, "org_member_directory", { p_org: orgId }),
  ]);
  if (roleRes.error || directory.error) throw new Error(TEAM_UNAVAILABLE);
  const role = (MEMBER_ROLES as readonly string[]).includes(String(roleRes.data))
    ? (roleRes.data as MemberRole)
    : null;
  const members: TeamMember[] = (
    (directory.data ?? []) as {
      user_id: string;
      role: MemberRole;
      display_name: string;
      email: string;
      joined_at: string;
    }[]
  ).map((m) => ({
    userId: m.user_id,
    role: m.role,
    name: m.display_name,
    email: m.email,
    joinedAt: m.joined_at,
  }));
  let invitations: PendingInvitation[] = [];
  if (role === "owner" || role === "admin") {
    const { data } = await (client as InvitationTable)
      .from("organization_invitations")
      .select("id,email,role,expires_at")
      .eq("organization_id", orgId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());
    invitations = (data ?? []).map((i) => ({
      id: i["id"]!,
      email: i["email"]!,
      role: i["role"] as InvitableRole,
      expiresAt: i["expires_at"]!,
    }));
  }
  const owner = members.find((m) => m.role === "owner");
  const { planForUser } = await import("@/features/billing/billing.server");
  const plan = owner ? await planForUser(owner.userId) : (await import("@/data/plans")).PLANS[0]!;
  const used =
    members.filter((m) => usesSeat(m.role)).length +
    invitations.filter((i) => usesSeat(i.role)).length;
  return {
    role,
    members,
    invitations,
    seats: { used, limit: plan.limits.operatorSeats, plan: plan.name },
  };
}

const orgInput = z.object({ organizationId: z.string().uuid() });

export const getTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(orgInput)
  .handler(async ({ data, context }): Promise<TeamResult<{ team: TeamView }>> => {
    try {
      return { ok: true, team: await loadTeam(context.supabase, data.organizationId) };
    } catch {
      return { ok: false, error: TEAM_UNAVAILABLE };
    }
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(orgInput.extend({ email: z.string().max(254), role: z.enum(INVITABLE_ROLES) }))
  .handler(async ({ data, context }): Promise<TeamResult<{ link: string }>> => {
    const email = normalizeInviteEmail(data.email);
    if (!email) return { ok: false, error: "Enter a valid e-mail address." };
    let team: TeamView;
    try {
      team = await loadTeam(context.supabase, data.organizationId);
    } catch {
      return { ok: false, error: TEAM_UNAVAILABLE };
    }
    if (team.role !== "owner" && team.role !== "admin")
      return { ok: false, error: "Only the owner or an admin can invite people." };
    if (team.members.some((m) => m.email.toLowerCase() === email))
      return { ok: false, error: "That person is already a member." };
    if (team.invitations.some((i) => i.email === email))
      return { ok: false, error: "That person already has a pending invitation." };
    const seat = checkSeat(data.role, team.seats.used, team.seats.limit, team.seats.plan);
    if (seat) return { ok: false, error: seat };
    const token = newInviteToken();
    const { error } = await (context.supabase as unknown as InvitationTable)
      .from("organization_invitations")
      .insert({
        organization_id: data.organizationId,
        email,
        role: data.role,
        token_hash: await hashInviteToken(token),
        invited_by: context.userId,
      });
    if (error) return { ok: false, error: "The invitation was not created. Try again." };
    const { getRequest } = await import("@tanstack/react-start/server");
    return { ok: true, link: inviteLink(new URL(getRequest().url).origin, token) };
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ invitationId: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<TeamResult> => {
    const { error } = await (context.supabase as unknown as InvitationTable)
      .from("organization_invitations")
      .delete()
      .eq("id", data.invitationId);
    return error ? { ok: false, error: "The invitation was not revoked." } : { ok: true };
  });

const memberInput = orgInput.extend({ userId: z.string().uuid() });

function refusal(error: { code?: string } | null, fallback: string): string {
  return error?.code === "42501" ? "You are not allowed to do that." : fallback;
}

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(memberInput.extend({ role: z.enum(INVITABLE_ROLES) }))
  .handler(async ({ data, context }): Promise<TeamResult> => {
    let team: TeamView;
    try {
      team = await loadTeam(context.supabase, data.organizationId);
    } catch {
      return { ok: false, error: TEAM_UNAVAILABLE };
    }
    const current = team.members.find((m) => m.userId === data.userId);
    if (current && !usesSeat(current.role)) {
      const seat = checkSeat(data.role, team.seats.used, team.seats.limit, team.seats.plan);
      if (seat) return { ok: false, error: seat };
    }
    const { error } = await call(context.supabase, "set_org_member_role", {
      p_org: data.organizationId,
      p_user: data.userId,
      p_role: data.role,
    });
    return error ? { ok: false, error: refusal(error, "The role was not changed.") } : { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(memberInput)
  .handler(async ({ data, context }): Promise<TeamResult> => {
    const { error } = await call(context.supabase, "remove_org_member", {
      p_org: data.organizationId,
      p_user: data.userId,
    });
    return error
      ? { ok: false, error: refusal(error, "The member was not removed.") }
      : { ok: true };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ token: z.string().min(20).max(100) }))
  .handler(async ({ data, context }): Promise<TeamResult<{ organizationId: string }>> => {
    const { data: orgId, error } = await call(context.supabase, "accept_org_invitation", {
      p_token_hash: await hashInviteToken(data.token),
    });
    if (error?.code === "42501")
      return {
        ok: false,
        error:
          "This invitation is for a different e-mail address. Sign in with the invited address.",
      };
    if (error || typeof orgId !== "string")
      return {
        ok: false,
        error: "This invitation has expired, was revoked or was already used.",
      };
    return { ok: true, organizationId: orgId };
  });
