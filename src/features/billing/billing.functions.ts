import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PlanId } from "@/data/plans";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  entitledPlan,
  governingSubscription,
  productCatalogFromEnv,
  productFor,
} from "./entitlements";

// Billing server functions for the signed-in user. Payments run through Dodo Payments as the
// merchant of record: checkout and the customer portal are hosted by Dodo, and the plan changes
// only when a signed webhook (src/routes/api.billing.dodo-webhook.ts) records the subscription.

export interface BillingStatus {
  plan: PlanId;
  /** Dodo subscription status of the subscription that sets the plan, if any. */
  status: string | null;
  renewsOn: string | null;
  cancelAtPeriodEnd: boolean;
  /** True once a Dodo customer exists, so the customer portal can open. */
  canManage: boolean;
  /** Which self-serve plan and interval combinations have a product configured. */
  checkout: Record<"team" | "business", { monthly: boolean; annual: boolean }>;
}

export type BillingRedirect = { ok: true; url: string } | { ok: false; error: string };

export const BILLING_UNAVAILABLE =
  "Online payment is not available right now, so nothing was charged. Please contact us.";

async function requestOrigin(): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  return new URL(getRequest().url).origin;
}

export const getBillingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingStatus> => {
    const billing = await import("./billing.server");
    const [subs, customerId] = await Promise.all([
      billing.callerSubscriptions(context.supabase).catch(() => []),
      billing.callerCustomerId(context.supabase).catch(() => null),
    ]);
    const plan = entitledPlan(subs);
    const governing = governingSubscription(subs);
    const catalog = productCatalogFromEnv(process.env);
    const has = (p: "team" | "business", i: "monthly" | "annual") =>
      Boolean(productFor(catalog, p, i));
    return {
      plan: plan.id,
      status: governing?.status ?? null,
      renewsOn: governing?.next_billing_date ?? null,
      cancelAtPeriodEnd: governing?.cancel_at_next_billing_date ?? false,
      canManage: customerId !== null,
      checkout: {
        team: { monthly: has("team", "monthly"), annual: has("team", "annual") },
        business: { monthly: has("business", "monthly"), annual: has("business", "annual") },
      },
    };
  });

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({ plan: z.enum(["team", "business"]), interval: z.enum(["monthly", "annual"]) }),
  )
  .handler(async ({ data, context }): Promise<BillingRedirect> => {
    const [billing, dodo] = await Promise.all([
      import("./billing.server"),
      import("./dodo.server"),
    ]);
    const productId = productFor(productCatalogFromEnv(process.env), data.plan, data.interval);
    if (!productId || !dodo.dodoConfigured()) return { ok: false, error: BILLING_UNAVAILABLE };
    const current = await billing.planForCaller(context.supabase);
    if (current.id !== "free")
      return {
        ok: false,
        error: `You already have the ${current.name} plan. Use Manage billing to change it.`,
      };
    const email = typeof context.claims.email === "string" ? context.claims.email : "";
    if (!email) return { ok: false, error: "Add an e-mail address to your account first." };
    try {
      const customerId = await ensureCustomer(context.userId, email, context.supabase);
      const session = await dodo.createCheckoutSession({
        productId,
        customerId,
        returnUrl: `${await requestOrigin()}/plans?checkout=returned`,
        metadata: { veritrail_user_id: context.userId, plan: data.plan },
      });
      if (!session.checkout_url) return { ok: false, error: BILLING_UNAVAILABLE };
      return { ok: true, url: session.checkout_url };
    } catch {
      return { ok: false, error: BILLING_UNAVAILABLE };
    }
  });

export const openBillingPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BillingRedirect> => {
    const [billing, dodo] = await Promise.all([
      import("./billing.server"),
      import("./dodo.server"),
    ]);
    const customerId = await billing.callerCustomerId(context.supabase).catch(() => null);
    if (!customerId) return { ok: false, error: "There is no billing account to manage yet." };
    try {
      const { link } = await dodo.createPortalSession(customerId, `${await requestOrigin()}/plans`);
      return { ok: true, url: link };
    } catch {
      return { ok: false, error: "The billing portal could not open. Try again shortly." };
    }
  });

/**
 * The caller's Dodo customer id, creating the customer on first checkout. The link is written
 * with the service role (users cannot write billing_customers), and a concurrent first checkout
 * keeps whichever link was stored first.
 */
async function ensureCustomer(userId: string, email: string, client: unknown): Promise<string> {
  const [billing, dodo, { supabaseAdmin }] = await Promise.all([
    import("./billing.server"),
    import("./dodo.server"),
    import("@/integrations/supabase/client.server"),
  ]);
  const existing = await billing.callerCustomerId(client);
  if (existing) return existing;
  const created = await dodo.createCustomer({
    email,
    name: email.split("@")[0] || email,
    metadata: { veritrail_user_id: userId },
  });
  // billing_customers is newer than the generated Supabase types.
  const admin = supabaseAdmin as unknown as {
    from(table: "billing_customers"): {
      upsert(
        row: { user_id: string; customer_id: string },
        options: { onConflict: string; ignoreDuplicates: boolean },
      ): Promise<{ error: unknown }>;
      select(columns: string): {
        eq(
          column: string,
          value: string,
        ): { single(): Promise<{ data: { customer_id: string } | null }> };
      };
    };
  };
  await admin
    .from("billing_customers")
    .upsert(
      { user_id: userId, customer_id: created.customer_id },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  const { data } = await admin
    .from("billing_customers")
    .select("customer_id")
    .eq("user_id", userId)
    .single();
  if (!data) throw new Error("Billing customer was not stored");
  return data.customer_id;
}
