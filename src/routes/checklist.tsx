import { createFileRoute } from "@tanstack/react-router";
import { ChecklistScreen } from "@/features/governance/screens-checklist";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/checklist")({
  head: () =>
    pageHead(
      "AI governance lifecycle checklist",
      "A live workspace-level checklist for AI governance readiness and inventory profile completeness.",
    ),
  component: ChecklistScreen,
});
