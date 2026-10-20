import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeScreen } from "@/features/governance/screens-resources";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/knowledge")({
  head: () =>
    pageHead(
      "Knowledge hub",
      "Explore checked AI governance resources with practical highlights, access notes, laws, standards and responsible AI frameworks.",
    ),
  component: KnowledgeScreen,
});
