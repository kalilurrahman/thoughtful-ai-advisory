import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/reset-password")({ head: () => pageHead("Reset password", "Securely reset the password for your AEGIS account."), component: ResetPassword });
function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"); }, []);
  return <section className="workspace-controls mx-auto max-w-xl"><h2>Set a new password</h2>{recovery ? <form className="grid gap-4" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setMessage(error ? error.message : "Password updated. You can return to your workspace."); setBusy(false); }}><label>New password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><Button disabled={busy} type="submit">Update password</Button></form> : <p>Open the password recovery link from your email to continue.</p>}{message && <p role="status">{message}</p>}<Button asChild variant="link"><Link to="/auth">Return to sign in</Link></Button></section>;
}