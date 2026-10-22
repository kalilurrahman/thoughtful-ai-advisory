import { createFileRoute } from "@tanstack/react-router";
import { ActionsScreen } from "@/features/governance/screens-actions";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/actions")({
  head: () =>
    pageHead(
      "Corrective actions",
      "Track owned corrective and preventive work, completion evidence and effectiveness verification.",
    ),
  component: ActionsScreen,
});
