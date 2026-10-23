import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useGovernance } from "./store";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().max(120),
});
type Credentials = z.infer<typeof credentialsSchema>;
export function AuthPanel({ initialEmail = "" }: { initialEmail?: string }) {
  const navigate = useNavigate();
  const { userId } = useGovernance();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: initialEmail, password: "", displayName: "" },
  });
  async function social(provider: "google" | "apple" | "microsoft" | "lovable") {
    setBusy(true);
    setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) setMessage("Sign-in could not be completed. Please retry.");
      else if (!result.redirected) await navigate({ to: "/more" });
    } catch {
      setMessage("Sign-in could not be completed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(values: Credentials) {
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: values.displayName },
          },
        });
        if (error) throw error;
        if (data.session) await navigate({ to: "/more" });
        else setMessage("Check your email to confirm your account before signing in.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("If an account exists, a password reset link will arrive by email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        await navigate({ to: "/more" });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete this request.");
    } finally {
      setBusy(false);
    }
  }
  if (userId)
    return (
      <section className="workspace-controls">
        <h2>You’re signed in</h2>
        <Button asChild>
          <Link to="/more">Open your workspaces</Link>
        </Button>
      </section>
    );
  return (
    <section className="workspace-controls mx-auto max-w-xl">
      <h2>
        {mode === "signup"
          ? "Create your account"
          : mode === "forgot"
            ? "Reset your password"
            : "Sign in to VERITRAIL"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["google", "apple", "microsoft", "lovable"] as const).map((provider) => (
          <Button
            key={provider}
            variant="outline"
            disabled={busy}
            className={provider === "lovable" ? "lovable-auth-button" : ""}
            onClick={() => social(provider)}
          >
            Continue with{" "}
            {provider === "lovable" ? "Lovable" : provider[0]?.toUpperCase() + provider.slice(1)}
          </Button>
        ))}
      </div>
      <form
        className="mt-6 grid gap-4"
        onSubmit={
          mode === "forgot"
            ? (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const email = z.string().email().safeParse(data.get("email"));
                if (email.success)
                  void submit({ email: email.data, password: "", displayName: "" });
                else setMessage("Enter a valid email address.");
              }
            : handleSubmit(submit)
        }
      >
        {mode === "signup" && (
          <label>
            Display name
            <input {...register("displayName")} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" {...register("email")} autoComplete="email" required />
        </label>
        {mode !== "forgot" && (
          <label>
            Password
            <input
              type="password"
              {...register("password")}
              minLength={8}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>
        )}
        {errors.email && <p role="alert">Enter a valid email address.</p>}
        {errors.password && <p role="alert">Use at least eight characters.</p>}
        <Button disabled={busy} type="submit">
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in with email"}
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button
          variant="link"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setMessage("");
          }}
        >
          {mode === "signup" ? "Already have an account?" : "Create an account"}
        </Button>
        <Button
          variant="link"
          onClick={() => {
            setMode(mode === "forgot" ? "signin" : "forgot");
            setMessage("");
          }}
        >
          {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
