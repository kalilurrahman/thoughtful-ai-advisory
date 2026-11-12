import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/features/governance/meta";
import { AcademyScreen } from "@/features/governance/screens-academy";

export const Route = createFileRoute("/academy")({
  head: () =>
    pageHead("Governance Learning Arcade", "Scenario-based AI governance learning for teams."),
  component: AcademyScreen,
});
