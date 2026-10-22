import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/features/governance/auth-panel";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/auth")({
  head: () =>
    pageHead(
      "Sign in",
      "Access your private AEGIS governance workspaces with email, Google, Apple, Microsoft or Lovable.",
    ),
  component: AuthPanel,
});
