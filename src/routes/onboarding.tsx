import { createFileRoute } from "@tanstack/react-router";
import { OnboardingScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/onboarding")({
  head: () =>
    pageHead(
      "Welcome to VERITRAIL",
      "AI Governance, Guardrails and Assurance Studio for responsible enterprise deployment.",
    ),
  component: OnboardingScreen,
});
