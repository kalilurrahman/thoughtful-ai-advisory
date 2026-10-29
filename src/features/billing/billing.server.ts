import type { Plan } from "@/data/plans";
import { entitledPlan, type PaidPlanId, type SubscriptionRecord } from "./entitlements";

// Server-side plan lookup for the signed-in caller. Reads through the caller's own Supabase client,
// so row-level security limits it to their own billing rows (migration 0011).

interface Rows<T> {
  data: T[] | null;
  error: { message: string } | null;
}

// The billing tables are newer than the generated Supabase types.
interface BillingReader {
  from(table: "billing_subscriptions"): {
    select(columns: string): {
      order(column: string, options: { ascending: boolean }): Promise<Rows<SubscriptionRow>>;
    };
  };
  from(table: "billing_customers"): {
    select(columns: string): {
      maybeSingle(): Promise<{ data: { customer_id: string } | null; error: unknown }>;
    };
  };
}

interface SubscriptionRow {
  subscription_id: string;
  plan: string | null;
  status: string;
  next_billing_date: string | null;
  cancel_at_next_billing_date: boolean;
}

const PAID = new Set<string>(["team", "business", "enterprise"]);

function toRecord(r: SubscriptionRow): SubscriptionRecord {
  return { ...r, plan: r.plan && PAID.has(r.plan) ? (r.plan as PaidPlanId) : null };
}

export async function callerSubscriptions(client: unknown): Promise<SubscriptionRecord[]> {
  const { data, error } = await (client as BillingReader)
    .from("billing_subscriptions")
    .select("subscription_id,plan,status,next_billing_date,cancel_at_next_billing_date")
    .order("event_at", { ascending: false });
  if (error) throw new Error("Unable to read billing.");
  return (data ?? []).map(toRecord);
}

/** The caller's plan; Free when billing cannot be read, so a fault never grants a paid plan. */
export async function planForCaller(client: unknown): Promise<Plan> {
  try {
    return entitledPlan(await callerSubscriptions(client));
  } catch {
    return entitledPlan([]);
  }
}

export async function callerCustomerId(client: unknown): Promise<string | null> {
  const { data } = await (client as BillingReader)
    .from("billing_customers")
    .select("customer_id")
    .maybeSingle();
  return data?.customer_id ?? null;
}

/**
 * Another user's plan (a workspace owner's, for seat limits), read with the service role. Only
 * for server functions that have already checked the caller may act on that workspace.
 */
export async function planForUser(userId: string): Promise<Plan> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // The billing tables are newer than the generated Supabase types.
    const admin = supabaseAdmin as unknown as {
      from(table: string): {
        select(columns: string): {
          eq(column: string, value: string): Promise<Rows<Record<string, unknown>>>;
        };
      };
    };
    const customers = await admin
      .from("billing_customers")
      .select("customer_id")
      .eq("user_id", userId);
    const customerId = customers.data?.[0]?.["customer_id"];
    if (typeof customerId !== "string") return entitledPlan([]);
    const { data, error } = await admin
      .from("billing_subscriptions")
      .select("subscription_id,plan,status,next_billing_date,cancel_at_next_billing_date")
      .eq("customer_id", customerId);
    if (error) return entitledPlan([]);
    return entitledPlan((data ?? []).map((r) => toRecord(r as unknown as SubscriptionRow)));
  } catch {
    return entitledPlan([]);
  }
}
