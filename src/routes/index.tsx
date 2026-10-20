import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/features/governance/screens-core";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Governance overview",
      "Assess enterprise AI governance maturity, release readiness and prioritized control gaps.",
    ),
  component: HomeScreen,
});
