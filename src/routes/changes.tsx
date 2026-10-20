import { createFileRoute } from "@tanstack/react-router";
import { ChangesScreen } from "@/features/governance/screens-changes";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/changes")({
  head: () =>
    pageHead(
      "AI change reviews",
      "Assess material AI-system changes, record impact review and track approval before implementation.",
    ),
  component: ChangesScreen,
});
