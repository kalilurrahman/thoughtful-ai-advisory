import { createFileRoute } from "@tanstack/react-router";
import { CalculatorsScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/calculators")({
  head: () =>
    pageHead(
      "AI governance calculators",
      "Estimate AI cost, risk exposure, compliance readiness and governance maturity.",
    ),
  component: CalculatorsScreen,
});
