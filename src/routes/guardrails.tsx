import { createFileRoute } from "@tanstack/react-router";
import { GuardrailsScreen } from "@/features/governance/screens-operations";
import { pageHead } from "@/features/governance/meta";
export const Route = createFileRoute("/guardrails")({
  head: () =>
    pageHead(
      "Guardrails designer",
      "Configure data, input, output, agent and monitoring controls by risk tier.",
    ),
  component: GuardrailsScreen,
});
