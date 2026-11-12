import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/features/governance/meta";
import { GamesScreen } from "@/features/governance/screens-games";

export const Route = createFileRoute("/games")({
  head: () => pageHead("AI Governance Games", "Scenario-based AI governance learning games."),
  component: GamesScreen,
});
