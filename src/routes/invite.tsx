import { createFileRoute } from "@tanstack/react-router";
import { InviteScreen } from "@/features/governance/invite-screen";
import { pageHead } from "@/features/governance/meta";

export const Route = createFileRoute("/invite")({
  head: () => {
    const head = pageHead(
      "Join a workspace",
      "Accept an invitation to a VERITRAIL team workspace.",
    );
    return { meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  validateSearch: (search: Record<string, unknown>): { token?: string } => {
    const token = search["token"];
    return typeof token === "string" && token ? { token } : {};
  },
  component: InviteRoute,
});

function InviteRoute() {
  const { token } = Route.useSearch();
  return <InviteScreen token={token} />;
}
