import { createFileRoute } from "@tanstack/react-router";
import { MoreScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/more")({
  head: () =>
    pageHead(
      "AEGIS tools",
      "Access release gates, guardrails, calculators, references and advisory plans.",
    ),
  component: MoreScreen,
});
