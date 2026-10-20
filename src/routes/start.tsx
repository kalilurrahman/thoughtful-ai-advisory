import { createFileRoute } from "@tanstack/react-router";
import { StartScreen } from "@/features/governance/screens-start";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/start")({
  head: () =>
    pageHead(
      "Start here",
      "Choose an AI governance learning path by role, programme stage and immediate goal.",
    ),
  component: StartScreen,
});
