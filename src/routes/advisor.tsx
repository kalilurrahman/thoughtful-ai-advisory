import { createFileRoute } from "@tanstack/react-router";
import { AdvisorScreen } from "@/features/governance/screens-advisor";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/advisor")({
  head: () =>
    pageHead(
      "AI governance advisor",
      "Describe a policy, risk or control concern and get mapped GOVERN areas and corrective actions.",
    ),
  component: AdvisorScreen,
});
