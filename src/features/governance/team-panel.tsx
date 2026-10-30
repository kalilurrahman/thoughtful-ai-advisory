import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, UserPlus, UsersThree } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useGovernance } from "./store";
import {
  INVITABLE_ROLES,
  ROLE_LABELS,
  canManage,
  canManageMembers,
  type InvitableRole,
} from "./team-model";
import {
  getTeam,
  inviteMember,
  removeMember,
  revokeInvitation,
  setMemberRole,
  type TeamView,
} from "./team.functions";

/** Members, roles and invitation links for the saved workspace (owners and admins manage). */
export function TeamPanel() {
  const { userId, workspaceId } = useGovernance();
  const fetchTeam = useServerFn(getTeam),
    invite = useServerFn(inviteMember),
    revoke = useServerFn(revokeInvitation),
    changeRole = useServerFn(setMemberRole),
    remove = useServerFn(removeMember);
  const [team, setTeam] = useState<TeamView | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("operator");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetchTeam({ data: { organizationId: workspaceId } }).catch(() => null);
    if (res?.ok) {
      setTeam(res.team);
      setError("");
    } else {
      setTeam(null);
      setError(res?.error ?? "Team details could not be loaded.");
    }
  }, [workspaceId, fetchTeam]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!userId || !workspaceId) return null;

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setBusy(true);
    setMessage("");
    try {
      const res = await action();
      setMessage(res.ok ? done : (res.error ?? "Nothing was changed."));
      if (res.ok) await refresh();
    } catch {
      setMessage("Nothing was changed: the service could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  async function submitInvite(event: FormEvent) {
    event.preventDefault();
    if (!workspaceId) return;
    setBusy(true);
    setMessage("");
    setLink("");
    try {
      const res = await invite({ data: { organizationId: workspaceId, email, role } });
      if (res.ok) {
        setLink(res.link);
        setEmail("");
        setMessage("Invitation created. No e-mail was sent: copy the link and send it yourself.");
        await refresh();
      } else setMessage(res.error);
    } catch {
      setMessage("No invitation was created: the service could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  const manager = canManageMembers(team?.role ?? null);

  return (
    <section className="team-panel" aria-labelledby="team-heading">
      <h2 id="team-heading">
        <UsersThree weight="duotone" aria-hidden /> Team
      </h2>
      {error && <p className="workspace-message">{error}</p>}
      {team && (
        <>
          <p className="muted">
            {team.seats.used} of {team.seats.limit} operator{" "}
            {team.seats.limit === 1 ? "seat" : "seats"} used on the {team.seats.plan} plan.
            Approvers and viewers are free.
          </p>
          <ul className="team-list">
            {team.members.map((m) => {
              const self = m.userId === userId;
              const editable = canManage(team.role, m.role, self);
              return (
                <li key={m.userId}>
                  <div>
                    <strong>
                      {m.name || m.email}
                      {self ? " (you)" : ""}
                    </strong>
                    {m.name && <small>{m.email}</small>}
                  </div>
                  {editable && m.role !== "owner" && !self ? (
                    <select
                      aria-label={`Role for ${m.email}`}
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        void run(
                          () =>
                            changeRole({
                              data: {
                                organizationId: workspaceId,
                                userId: m.userId,
                                role: e.target.value as InvitableRole,
                              },
                            }),
                          "Role changed.",
                        )
                      }
                    >
                      {INVITABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r].name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="chip neutral">{ROLE_LABELS[m.role].name}</span>
                  )}
                  {m.role !== "owner" && (editable || self) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        const prompt = self
                          ? "Leave this workspace? You will lose access until invited again."
                          : `Remove ${m.email} from this workspace?`;
                        if (window.confirm(prompt))
                          void run(
                            () =>
                              remove({ data: { organizationId: workspaceId, userId: m.userId } }),
                            self ? "You left the workspace." : "Member removed.",
                          );
                      }}
                    >
                      {self ? "Leave" : "Remove"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          {manager && team.invitations.length > 0 && (
            <>
              <h3>Pending invitations</h3>
              <ul className="team-list">
                {team.invitations.map((i) => (
                  <li key={i.id}>
                    <div>
                      <strong>{i.email}</strong>
                      <small>
                        {ROLE_LABELS[i.role].name} · expires{" "}
                        {new Date(i.expiresAt).toLocaleDateString()}
                      </small>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () => revoke({ data: { invitationId: i.id } }),
                          "Invitation revoked.",
                        )
                      }
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {manager && (
            <form className="team-invite" onSubmit={submitInvite}>
              <h3>Invite someone</h3>
              <label>
                E-mail
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Role
                <select value={role} onChange={(e) => setRole(e.target.value as InvitableRole)}>
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r].name} — {ROLE_LABELS[r].summary}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" className="full-button" disabled={busy || !email.trim()}>
                <UserPlus weight="duotone" />
                Create invitation link
              </Button>
            </form>
          )}
        </>
      )}
      {message && (
        <p role="status" className="workspace-message">
          {message}
        </p>
      )}
      {link && (
        <div className="team-link">
          <input readOnly value={link} aria-label="Invitation link" />
          <Button
            variant="outline"
            onClick={() =>
              navigator.clipboard
                .writeText(link)
                .then(() => setMessage("Link copied. It works once, for 14 days."))
                .catch(() => setMessage("Copy the link from the box."))
            }
          >
            <Copy weight="duotone" /> Copy
          </Button>
        </div>
      )}
      {link && (
        <details className="email-preview-stub">
          <summary>
            Email preview{" "}
            <span className="chip stub-badge" title="SMTP delivery is not yet configured (stub-smtp)">
              Not sent — not connected
            </span>
          </summary>
          <div className="email-preview-card" role="note" aria-label="Preview of invitation email">
            <p className="email-preview-meta">
              <strong>To:</strong> {email || "invitee@example.com"}
            </p>
            <p className="email-preview-meta">
              <strong>Subject:</strong> You've been invited to a VERITRAIL workspace
            </p>
            <hr />
            <p>Hi,</p>
            <p>
              You have been invited to join a VERITRAIL AI governance workspace. Click the link
              below to accept — it works once and expires in 14 days.
            </p>
            <p>
              <strong>
                <a href={link}>{link}</a>
              </strong>
            </p>
            <p className="muted">
              If you weren't expecting this invitation, you can safely ignore this message.
            </p>
            <p className="muted">— The VERITRAIL team</p>
          </div>
          <p className="stub-notice">
            <strong>Not connected (stub-smtp):</strong> No transactional email provider is
            configured. This preview shows what recipients would see once SMTP delivery is wired.
            Until then, copy the link above and share it directly.
          </p>
        </details>
      )}
    </section>
  );
}
