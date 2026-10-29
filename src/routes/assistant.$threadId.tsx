import { createFileRoute } from "@tanstack/react-router";
import { AssistantScreen } from "@/features/assistant/assistant-screen";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/assistant/$threadId")({
  head: () =>
    pageHead("Assistant conversation", "A saved conversation with the VERITRAIL site assistant."),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <AssistantScreen key={threadId} threadId={threadId} />;
}
