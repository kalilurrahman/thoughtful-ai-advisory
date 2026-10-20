import { z } from "zod";

export const monitoringDomains = [
  "Quality",
  "Safety",
  "Fairness",
  "Privacy",
  "Security",
  "Drift",
  "Human oversight",
  "Reliability",
  "Other",
] as const;
export const monitoringCadences = ["Daily", "Weekly", "Monthly", "Quarterly"] as const;
export const breachDirections = ["At or above threshold", "At or below threshold"] as const;

export const monitoringObservationSchema = z.object({
  id: z.string().uuid(),
  measuredAt: z.string().date(),
  value: z.number().finite(),
  recordedBy: z.string().trim().min(1).max(120),
  evidenceReference: z.string().max(500).default(""),
  notes: z.string().max(2000).default(""),
});

export const monitoringPlanSchema = z.object({
  id: z.string().uuid(),
  system: z.string().trim().min(1).max(160),
  metric: z.string().trim().min(1).max(160),
  domain: z.enum(monitoringDomains),
  unit: z.string().trim().min(1).max(40),
  threshold: z.number().finite(),
  breachDirection: z.enum(breachDirections),
  cadence: z.enum(monitoringCadences),
  nextDue: z.string().date(),
  owner: z.string().trim().min(1).max(120),
  status: z.enum(["Active", "Paused"]).default("Active"),
  createdAt: z.string().datetime({ offset: true }),
  notes: z.string().max(2000).default(""),
  observations: z.array(monitoringObservationSchema).max(500).default([]),
});

export const monitoringPlanListSchema = z.array(monitoringPlanSchema).max(1000).default([]);
export type MonitoringPlan = z.infer<typeof monitoringPlanSchema>;
export type MonitoringObservation = z.infer<typeof monitoringObservationSchema>;
export type MonitoringCadence = (typeof monitoringCadences)[number];
