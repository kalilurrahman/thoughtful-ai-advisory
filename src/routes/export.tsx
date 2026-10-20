import { createFileRoute } from "@tanstack/react-router";
import { ExportScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/export")({
  head: () =>
    pageHead(
      "Reports and audit pack",
      "Preview executive governance briefs, detailed scorecards and audit evidence packs.",
    ),
  component: ExportScreen,
});
