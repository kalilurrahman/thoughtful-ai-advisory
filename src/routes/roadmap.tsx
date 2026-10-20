import { createFileRoute } from "@tanstack/react-router";
import { RoadmapScreen } from "@/features/governance/screens-operations";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/roadmap")({
  head: () =>
    pageHead(
      "Governance roadmap",
      "Prioritize governance remediation with owners across four delivery phases.",
    ),
  component: RoadmapScreen,
});
