import { createFileRoute } from "@tanstack/react-router";
import { DiscussionsScreen } from "@/features/governance/screens-discussions";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/discussions")({
  head: () =>
    pageHead(
      "Team governance discussions",
      "A live, saved discussion space where organisation members talk through AI policy, risk and control topics.",
    ),
  component: DiscussionsScreen,
});
