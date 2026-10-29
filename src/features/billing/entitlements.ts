import { PLANS, getPlan, type Plan, type PlanId } from "@/data/plans";

// Billing rules shared by the checkout server functions, the Dodo Payments webhook and every
// server function that enforces a plan limit. Pure, so the rules are unit-tested without Dodo.

export type PaidPlanId = Exclude<PlanId, "free">;
export type BillingInterval = "monthly" | "annual";

/** Dodo product id → the plan and interval it sells, from DODO_PRODUCT_* environment variables. */
export type ProductCatalog = Record<string, { plan: PaidPlanId; interval: BillingInterval }>;

export const PRODUCT_ENV: Record<string, { plan: PaidPlanId; interval: BillingInterval }> = {
  DODO_PRODUCT_TEAM_MONTHLY: { plan: "team", interval: "monthly" },
  DODO_PRODUCT_TEAM_ANNUAL: { plan: "team", interval: "annual" },
  DODO_PRODUCT_BUSINESS_MONTHLY: { plan: "business", interval: "monthly" },
  DODO_PRODUCT_BUSINESS_ANNUAL: { plan: "business", interval: "annual" },
  // Enterprise is never sold through checkout; a product lets a negotiated subscription created
  // in the Dodo dashboard unlock the plan.
  DODO_PRODUCT_ENTERPRISE: { plan: "enterprise", interval: "annual" },
};

export function productCatalogFromEnv(env: Record<string, string | undefined>): ProductCatalog {
  const catalog: ProductCatalog = {};
  for (const [name, sells] of Object.entries(PRODUCT_ENV)) {
    const id = env[name]?.trim();
    if (id) catalog[id] = sells;
  }
  return catalog;
}

/** The product to put in a checkout for a self-serve plan, or undefined when none is set up. */
export function productFor(
  catalog: ProductCatalog,
  plan: PaidPlanId,
  interval: BillingInterval,
): string | undefined {
  if (!getPlan(plan).selfServe) return undefined;
  return Object.entries(catalog).find(
    ([, sells]) => sells.plan === plan && sells.interval === interval,
  )?.[0];
}

/** Dodo subscription statuses that keep the plan: active, and past_due while Dodo retries. */
export const ENTITLED_STATUSES: ReadonlySet<string> = new Set(["active", "past_due"]);

export interface SubscriptionRecord {
  subscription_id: string;
  plan: PaidPlanId | null;
  status: string;
  next_billing_date: string | null;
  cancel_at_next_billing_date: boolean;
}

/** The highest plan any entitled subscription grants; Free when there is none. */
export function entitledPlan(subscriptions: readonly SubscriptionRecord[]): Plan {
  let best = 0;
  for (const s of subscriptions) {
    if (!s.plan || !ENTITLED_STATUSES.has(s.status)) continue;
    best = Math.max(
      best,
      PLANS.findIndex((p) => p.id === s.plan),
    );
  }
  return PLANS[best] ?? getPlan("free");
}

/** The subscription that sets the plan, for showing its status and renewal date. */
export function governingSubscription(
  subscriptions: readonly SubscriptionRecord[],
): SubscriptionRecord | undefined {
  const plan = entitledPlan(subscriptions);
  return (
    subscriptions.find((s) => s.plan === plan.id && ENTITLED_STATUSES.has(s.status)) ??
    // Nothing entitled: show the most recent problem (on hold, cancelled …) so the user can act.
    subscriptions[0]
  );
}

export interface SubscriptionEventRow {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  plan: PaidPlanId | null;
  status: string;
  next_billing_date: string | null;
  cancel_at_next_billing_date: boolean;
  event_at: string;
}

/**
 * The row a `subscription.*` webhook writes, or null for other events (payments, refunds …),
 * which need no state. Throws on a subscription event that lacks the fields Dodo always sends.
 */
export function subscriptionRowFromEvent(
  event: unknown,
  catalog: ProductCatalog,
): SubscriptionEventRow | null {
  const e = event as { type?: unknown; timestamp?: unknown; data?: Record<string, unknown> };
  if (typeof e?.type !== "string" || !e.type.startsWith("subscription.")) return null;
  const d = e.data ?? {};
  const customer = d["customer"] as { customer_id?: unknown } | undefined;
  const id = d["subscription_id"];
  const product = d["product_id"];
  const status = d["status"];
  if (
    typeof id !== "string" ||
    typeof product !== "string" ||
    typeof status !== "string" ||
    typeof customer?.customer_id !== "string" ||
    typeof e.timestamp !== "string" ||
    Number.isNaN(Date.parse(e.timestamp))
  )
    throw new Error(`Malformed ${e.type} event`);
  const next = d["next_billing_date"];
  return {
    subscription_id: id,
    customer_id: customer.customer_id,
    product_id: product,
    plan: catalog[product]?.plan ?? null,
    status,
    next_billing_date: typeof next === "string" && next ? next : null,
    cancel_at_next_billing_date: d["cancel_at_next_billing_date"] === true,
    event_at: e.timestamp,
  };
}
