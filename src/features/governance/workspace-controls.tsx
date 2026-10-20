import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { FloppyDisk, SignIn } from "@phosphor-icons/react";
import { lovable } from "@/integrations/lovable/index";
import { saveWorkspace, loadWorkspace } from "./workspace.functions";
import { useGovernance } from "./store";
import { SOURCES } from "@/data/governance";
export function WorkspaceControls() {
  const { state, dispatch, userId, workspaceId, workspaceName, setWorkspace } = useGovernance();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const save = useServerFn(saveWorkspace),
    load = useServerFn(loadWorkspace);
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
      const r = await load();
      if (r) {
        dispatch({ type: "load", state: r.state });
        setWorkspace(r.id, r.name);
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
          <label>
            Organization
            <input
              value={workspaceName}
              onChange={(e) => setWorkspace(workspaceId, e.target.value)}
            />
          </label>
          <Button
            className="full-button"
            disabled={busy || !workspaceName.trim()}
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
