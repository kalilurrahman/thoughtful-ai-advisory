import { createFileRoute } from "@tanstack/react-router";
import { DecisionsScreen } from "@/features/governance/screens-decisions";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/decisions")({
  head: () =>
    pageHead(
      "AI governance decisions",
      "Record accountable AI system dispositions, time-bound risk acceptance and review history.",
    ),
  component: DecisionsScreen,
});
