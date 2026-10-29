import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EnvelopeOpen } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useGovernance } from "./store";
import { acceptInvitation } from "./team.functions";
import { loadWorkspace } from "./workspace.functions";

// Invitation links (/invite?token=…). A signed-out visitor's token is kept for this tab only,
// so it survives signing in; /more offers to continue while one is waiting.
const PENDING_KEY = "veritrail-pending-invite";

function readPending(): string | null {
  try {
    return sessionStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}
function writePending(token: string | null) {
  try {
    if (token) sessionStorage.setItem(PENDING_KEY, token);
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* storage unavailable: the visitor can open the link again after signing in */
  }
}

export function InviteScreen({ token: fromUrl }: { token?: string | undefined }) {
  const { userId, dispatch, setWorkspace } = useGovernance();
  const accept = useServerFn(acceptInvitation),
    load = useServerFn(loadWorkspace);
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(fromUrl ?? null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = fromUrl ?? readPending();
    setToken(t);
    if (t) writePending(t);
  }, [fromUrl]);

  async function join() {
    if (!token) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await accept({ data: { token } });
      if (!res.ok) {
        setMessage(res.error);
        if (!res.error.includes("different e-mail")) writePending(null);
        return;
      }
      writePending(null);
      const ws = await load({ data: { organizationId: res.organizationId } });
      if (ws) {
        dispatch({ type: "load", state: ws.state });
        setWorkspace(ws.id, ws.name, ws.role);
      }
      await navigate({ to: "/workspace" });
    } catch {
      setMessage("You were not added: the service could not be reached. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="invite-screen">
      <EnvelopeOpen weight="duotone" aria-hidden />
      <h2>Join a VERITRAIL workspace</h2>
      {!token ? (
        <p>This invitation link is incomplete. Ask the person who invited you for a new link.</p>
      ) : userId ? (
        <>
          <p>
            You have been invited to a team workspace. Joining replaces the workspace on this screen
            with the team&apos;s saved workspace.
          </p>
          <Button className="full-button" disabled={busy} onClick={() => void join()}>
            {busy ? "Joining…" : "Join workspace"}
          </Button>
        </>
      ) : (
        <>
          <p>
            Sign in or create an account with the e-mail address the invitation was sent to, then
            come back here to join.
          </p>
          <Button asChild className="full-button">
            <Link to="/auth">Sign in to accept</Link>
          </Button>
        </>
      )}
      {message && (
        <p role="status" className="workspace-message">
          {message}
        </p>
      )}
    </section>
  );
}

/** Shown on /more after signing in while an invitation from this tab is waiting. */
export function PendingInviteBanner() {
  const { userId } = useGovernance();
  const [waiting, setWaiting] = useState(false);
  useEffect(() => setWaiting(Boolean(userId && readPending())), [userId]);
  if (!waiting) return null;
  return (
    <p className="invite-banner" role="status">
      You have a workspace invitation waiting. <Link to="/invite">Continue to join</Link>
    </p>
  );
}
