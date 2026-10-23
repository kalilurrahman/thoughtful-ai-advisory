import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/features/governance/auth-panel";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/auth")({
  head: () =>
    pageHead(
      "Sign in",
      "Access your private VERITRAIL governance workspaces with email, Google, Apple, Microsoft or Lovable.",
    ),
  // ?email= prefills the form, e.g. from the onboarding screen.
  validateSearch: (search: Record<string, unknown>): { email?: string } => {
    const email = search["email"];
    return typeof email === "string" && email ? { email } : {};
  },
  component: AuthRoute,
});

function AuthRoute() {
  const { email } = Route.useSearch();
  return <AuthPanel initialEmail={email ?? ""} />;
}
