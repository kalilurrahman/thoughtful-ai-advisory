import {
  productCatalogFromEnv,
  subscriptionRowFromEvent,
  type SubscriptionEventRow,
} from "./entitlements";
import { verifyWebhook } from "./standard-webhooks";

// Dodo Payments webhook handling, with its storage passed in so it is tested without a database.
// Unsigned or stale requests get 401 and change nothing; malformed events get 400; a storage
// failure gets 500 so Dodo retries. Everything else is acknowledged with 200, including events
// VERITRAIL does not use and repeats of a webhook already applied.

export interface WebhookDeps {
  secret: string | undefined;
  env: Record<string, string | undefined>;
  record: (
    webhookId: string,
    type: string,
    subscription: SubscriptionEventRow | null,
  ) => Promise<string>;
  now?: number;
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function handleDodoWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  if (!deps.secret) {
    console.error("[billing] DODO_PAYMENTS_WEBHOOK_KEY is not set");
    return json(503, { error: "not configured" });
  }
  const body = await request.text();
  const check = await verifyWebhook(deps.secret, request.headers, body, deps.now);
  if (!check.ok) return json(401, { error: "invalid signature" });

  let event: unknown;
  let row: SubscriptionEventRow | null;
  try {
    event = JSON.parse(body);
    row = subscriptionRowFromEvent(event, productCatalogFromEnv(deps.env));
  } catch {
    return json(400, { error: "malformed event" });
  }
  const type = String((event as { type?: unknown }).type ?? "unknown").slice(0, 80);
  try {
    const outcome = await deps.record(request.headers.get("webhook-id")!, type, row);
    return json(200, { received: true, outcome });
  } catch {
    console.error(`[billing] could not record ${type}`);
    return json(500, { error: "not recorded" });
  }
}
