import { createFileRoute } from "@tanstack/react-router";
import { TemplatesScreen } from "@/features/governance/screens-templates";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/templates")({
  head: () =>
    pageHead(
      "AI Governance Templates",
      "Adaptable governance charter, intake, risk, supplier, release and operational templates.",
    ),
  component: TemplatesScreen,
});
