import { createFileRoute } from "@tanstack/react-router";
import { handleDodoWebhook } from "@/features/billing/webhook";

// Dodo Payments webhook endpoint. Register this URL (https://<domain>/api/billing/dodo-webhook)
// in the Dodo dashboard with the subscription events, and set DODO_PAYMENTS_WEBHOOK_KEY to its
// signing secret.
export const Route = createFileRoute("/api/billing/dodo-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleDodoWebhook(request, {
          secret: process.env["DODO_PAYMENTS_WEBHOOK_KEY"],
          env: process.env,
          record: async (webhookId, type, subscription) => {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            // record_billing_webhook (migration 0011) is newer than the generated Supabase types.
            const rpc = supabaseAdmin.rpc as unknown as (
              fn: "record_billing_webhook",
              args: { p_webhook_id: string; p_type: string; p_subscription: object | null },
            ) => Promise<{ data: string | null; error: { message: string } | null }>;
            const { data, error } = await rpc.call(supabaseAdmin, "record_billing_webhook", {
              p_webhook_id: webhookId,
              p_type: type,
              p_subscription: subscription,
            });
            if (error) throw new Error(error.message);
            return data ?? "unknown";
          },
        }),
    },
  },
});
