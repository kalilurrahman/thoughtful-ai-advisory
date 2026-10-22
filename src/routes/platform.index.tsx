import { createFileRoute } from "@tanstack/react-router";
import { PlatformIndexView, platformIndexHead } from "@/features/platform/views";

export const Route = createFileRoute("/platform/")({
  head: platformIndexHead,
  component: PlatformIndexView,
});
