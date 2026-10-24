import { createFileRoute } from "@tanstack/react-router";
import { GlossaryView, glossaryHead } from "@/features/site/glossary-view";

// AI governance glossary, from platform/content/glossary.yaml.
export const Route = createFileRoute("/glossary")({
  head: glossaryHead,
  component: GlossaryView,
});
