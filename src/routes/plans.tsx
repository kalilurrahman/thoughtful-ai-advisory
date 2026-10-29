import { createFileRoute } from "@tanstack/react-router";
import { PlansScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/plans")({
  head: () =>
    pageHead(
      "VERITRAIL plans",
      "Compare the Free, Team, Business and Enterprise plans and the Governance Baseline engagement.",
    ),
  component: PlansScreen,
});
