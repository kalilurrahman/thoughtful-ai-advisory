import { createFileRoute } from "@tanstack/react-router";
import { GatesScreen } from "@/features/governance/screens-core";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/gates")({
  head: () =>
    pageHead(
      "Release readiness",
      "Evaluate AI release gates across ethics, reliability and monitoring.",
    ),
  component: GatesScreen,
});
