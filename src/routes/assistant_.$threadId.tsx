import { createFileRoute } from "@tanstack/react-router";
import { AssistantScreen } from "@/features/assistant/assistant-screen";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/assistant_/$threadId")({
  head: () => {
    const head = pageHead(
      "Assistant conversation",
      "A private saved conversation with the VERITRAIL site assistant.",
    );
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex, nofollow" }] };
  },
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <AssistantScreen key={threadId} threadId={threadId} />;
}
