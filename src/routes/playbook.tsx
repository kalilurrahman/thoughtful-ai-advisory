import { createFileRoute } from "@tanstack/react-router";
import { PlaybookScreen } from "@/features/governance/screens-playbook";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/playbook")({
  head: () =>
    pageHead(
      "AI Governance Playbook",
      "A practical 12-chapter guide to building, operating and improving enterprise AI governance.",
    ),
  component: PlaybookScreen,
});
