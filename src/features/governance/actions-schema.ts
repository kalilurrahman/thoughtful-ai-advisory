import { z } from "zod";

export const correctiveActionSources = [
  "Incident",
  "Monitoring breach",
  "Change review",
  "Assessment finding",
  "Other",
] as const;
export const correctiveActionPriorities = ["Critical", "High", "Moderate", "Low"] as const;
export const correctiveActionStatuses = [
  "Open",
  "In progress",
  "Pending verification",
  "Closed",
  "Cancelled",
] as const;

export const correctiveActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(4000),
  system: z.string().trim().min(1).max(160),
  source: z.enum(correctiveActionSources),
  sourceReference: z.string().max(200).default(""),
  priority: z.enum(correctiveActionPriorities),
  owner: z.string().trim().min(1).max(120),
  dueDate: z.string().date(),
  status: z.enum(correctiveActionStatuses),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  completionEvidence: z.string().max(1000).default(""),
  verificationNote: z.string().max(2000).default(""),
  verifiedBy: z.string().max(120).default(""),
  verifiedAt: z.string().datetime({ offset: true }).nullable().default(null),
  history: z.array(z.object({
    status: z.enum(correctiveActionStatuses),
    changedAt: z.string().datetime({ offset: true }),
    actor: z.string().max(120),
    note: z.string().max(1000),
  })).max(500).default([]),
});

export const correctiveActionListSchema = z.array(correctiveActionSchema).max(2000).default([]);
export type CorrectiveAction = z.infer<typeof correctiveActionSchema>;
