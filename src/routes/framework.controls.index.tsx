import { createFileRoute } from "@tanstack/react-router";
import { ControlLibraryView, controlLibraryHead } from "@/features/site/views";

export const Route = createFileRoute("/framework/controls/")({
  head: controlLibraryHead,
  component: ControlLibraryView,
});
