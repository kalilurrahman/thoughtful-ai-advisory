import { createFileRoute } from "@tanstack/react-router";
import { MonitoringScreen } from "@/features/governance/screens-monitoring";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/monitoring")({
  head: () =>
    pageHead(
      "AI system monitoring",
      "Define human-owned monitoring plans, threshold checks and review cadence for AI systems.",
    ),
  component: MonitoringScreen,
});
