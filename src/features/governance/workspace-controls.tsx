import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { FloppyDisk, SignIn } from "@phosphor-icons/react";
import { lovable } from "@/integrations/lovable/index";
import { saveWorkspace, loadWorkspace, listWorkspaces } from "./workspace.functions";
import { ROLE_LABELS, canEdit, type MemberRole } from "./team-model";
import { useGovernance } from "./store";
import { SOURCES } from "@/data/governance";
export function WorkspaceControls() {
  const { state, dispatch, userId, workspaceId, workspaceName, workspaceRole, setWorkspace } =
    useGovernance();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const save = useServerFn(saveWorkspace),
    load = useServerFn(loadWorkspace),
    list = useServerFn(listWorkspaces);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; role: MemberRole }[]>(
    [],
  );
  const readOnly = workspaceRole != null && !canEdit(workspaceRole);
  useEffect(() => {
    if (!userId) return setWorkspaces([]);
    let active = true;
    list()
      .then((w) => active && setWorkspaces(w))
      .catch(() => active && setWorkspaces([]));
    return () => {
      active = false;
    };
  }, [userId, workspaceId, list]);
  async function switchTo(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const r = await load({ data: { organizationId: id } });
      if (r) {
        dispatch({ type: "load", state: r.state });
        setWorkspace(r.id, r.name, r.role);
        setMessage(`Opened ${r.name}.`);
      }
    } catch {
      setMessage("Could not open that workspace.");
    } finally {
      setBusy(false);
    }
  }
  async function signIn(provider: "microsoft" | "lovable") {
    setBusy(true);
    setMessage("");
    try {
      const r = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (r.error) setMessage("Sign-in could not be completed. Please retry.");
    } catch {
      setMessage("Sign-in could not be completed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function saveCurrent() {
    setBusy(true);
    setMessage("");
    try {
      const r = await save({
        data: { organizationId: workspaceId, name: workspaceName, state, sources: SOURCES },
      });
      setWorkspace(r.id, workspaceName);
      setMessage("Workspace saved.");
    } catch {
      setMessage("Could not save. Your current work is still on this screen.");
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    setBusy(true);
    try {
      const r = await load({ data: workspaceId ? { organizationId: workspaceId } : undefined });
      if (r) {
        dispatch({ type: "load", state: r.state });
        setWorkspace(r.id, r.name, r.role);
        setMessage("Saved workspace restored.");
      } else setMessage("No saved workspace yet.");
    } catch {
      setMessage("Could not load your saved workspace.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="workspace-controls">
      <h2>{userId ? "Your workspace" : "Save your workspace"}</h2>
      {userId ? (
        <>
          {workspaces.length > 1 && (
            <label>
              Workspace
              <select
                value={workspaceId ?? ""}
                disabled={busy}
                onChange={(e) => void switchTo(e.target.value)}
              >
                {!workspaceId && <option value="">Unsaved workspace</option>}
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} · {ROLE_LABELS[w.role].name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Organization
            <input
              value={workspaceName}
              readOnly={readOnly}
              onChange={(e) => setWorkspace(workspaceId, e.target.value)}
            />
          </label>
          {readOnly && workspaceRole && (
            <p className="workspace-message">
              You have read-only access as {ROLE_LABELS[workspaceRole].name.toLowerCase()}. Ask the
              owner or an admin for an editing role to save changes.
            </p>
          )}
          <Button
            className="full-button"
            disabled={busy || !workspaceName.trim() || readOnly}
            onClick={saveCurrent}
          >
            <FloppyDisk weight="duotone" />
            {busy ? "Saving…" : "Save workspace"}
          </Button>
          <Button variant="outline" className="full-button" disabled={busy} onClick={reload}>
            Restore saved workspace
          </Button>
        </>
      ) : (
        <>
          <Button className="full-button" disabled={busy} onClick={() => signIn("microsoft")}>
            <SignIn weight="duotone" />
            Sign in with Microsoft
          </Button>
          <Button
            className="full-button lovable-auth-button"
            disabled={busy}
            onClick={() => signIn("lovable")}
          >
            Sign in with Lovable
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
