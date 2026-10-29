import { createFileRoute } from "@tanstack/react-router";
import { AssistantScreen } from "@/features/assistant/assistant-screen";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/assistant/")({
  head: () =>
    pageHead(
      "Site assistant",
      "Chat with an assistant that answers from VERITRAIL governance guidance, with private saved conversations.",
    ),
  component: () => <AssistantScreen />,
});
