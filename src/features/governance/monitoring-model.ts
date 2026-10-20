import type { MonitoringCadence } from "./monitoring-schema";
import type { MonitoringPlan } from "./monitoring-schema";

export function isThresholdBreach(
  plan: Pick<MonitoringPlan, "threshold" | "breachDirection">,
  value: number,
) {
  return plan.breachDirection === "At or above threshold"
    ? value >= plan.threshold
    : value <= plan.threshold;
}

export function monitoringState(
  plan: MonitoringPlan,
  asOf = new Date().toISOString().slice(0, 10),
) {
  if (plan.status === "Paused") return "Paused" as const;
  const latest = [...plan.observations].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0];
  if (latest && isThresholdBreach(plan, latest.value)) return "Breach" as const;
  if (plan.nextDue < asOf) return "Overdue" as const;
  return latest ? ("Current" as const) : ("Not yet measured" as const);
}

export function nextMonitoringDate(current: string, cadence: MonitoringCadence) {
  const [year = 0, month = 1, day = 1] = current.split("-").map(Number);
  const monthsToAdd = cadence === "Quarterly" ? 3 : cadence === "Monthly" ? 1 : 0;
  const daysToAdd = cadence === "Weekly" ? 7 : cadence === "Daily" ? 1 : 0;
  if (monthsToAdd) {
    const targetMonth = month - 1 + monthsToAdd;
    const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDay))).toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(year, month - 1, day + daysToAdd)).toISOString().slice(0, 10);
}
