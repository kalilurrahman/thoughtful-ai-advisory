import { createFileRoute } from "@tanstack/react-router";
import { AssessScreen } from "@/features/governance/screens-core";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/assess")({
  head: () =>
    pageHead(
      "GOVERN assessment",
      "Score twelve GOVERN controls with evidence, guidance and framework references.",
    ),
  component: AssessScreen,
});
