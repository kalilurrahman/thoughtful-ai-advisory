import { createFileRoute } from "@tanstack/react-router";
import { IncidentsScreen } from "@/features/governance/screens-incidents";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/incidents")({
  head: () =>
    pageHead(
      "AI incidents and near misses",
      "Record, triage and track AI incidents and near misses within the organization governance workspace.",
    ),
  component: IncidentsScreen,
});
