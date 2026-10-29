import { getPlan } from "@/data/plans";
import type { BillingStatus } from "./billing.functions";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/** The current-plan line for a signed-in user. */
export function describeBilling(status: BillingStatus): string {
  const plan = getPlan(status.plan);
  if (plan.id === "free") return "You are on the Free plan.";
  const date = formatDate(status.renewsOn);
  if (status.cancelAtPeriodEnd)
    return `You are on the ${plan.name} plan until ${date ?? "the end of the period"}; it will not renew.`;
  if (status.status === "past_due")
    return `You are on the ${plan.name} plan, but the last payment failed. Update your payment method to keep it.`;
  return `You are on the ${plan.name} plan${date ? `; it renews on ${date}` : ""}.`;
}
