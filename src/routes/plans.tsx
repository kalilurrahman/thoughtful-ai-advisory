import { createFileRoute } from "@tanstack/react-router";
import { PlansScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/plans")({
  head: () =>
    pageHead(
      "AEGIS advisory plans",
      "Explore Assess, Govern and Assure advisory packages for enterprise AI.",
    ),
  component: PlansScreen,
});
