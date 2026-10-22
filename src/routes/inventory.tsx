import { createFileRoute } from "@tanstack/react-router";
import { InventoryScreen } from "@/features/governance/screens-operations";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/inventory")({
  head: () =>
    pageHead(
      "AI inventory",
      "Maintain an AI system register and preliminary risk screen; confirm legal applicability through qualified review.",
    ),
  component: InventoryScreen,
});
