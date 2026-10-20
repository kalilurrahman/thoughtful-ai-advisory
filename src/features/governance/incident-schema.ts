import { z } from "zod";

const statusEventSchema = z.object({
  status: z.enum(["Open", "Triage", "Contained", "Resolved", "Closed"]),
  changedAt: z.string().datetime({ offset: true }),
});

export const aiIncidentSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    system: z.string().max(160),
    severity: z.enum(["Critical", "High", "Moderate", "Low"]),
    category: z.string().min(1).max(80),
    status: z.enum(["Open", "Triage", "Contained", "Resolved", "Closed"]),
    detectedAt: z.string().date(),
    owner: z.string().max(120),
    summary: z.string().max(5000),
    response: z.string().max(5000),
    statusHistory: z.array(statusEventSchema).max(500).default([]),
  })
  .transform((incident) => ({
    ...incident,
    statusHistory:
      incident.statusHistory.length > 0
        ? incident.statusHistory
        : [{ status: incident.status, changedAt: `${incident.detectedAt}T00:00:00.000Z` }],
  }));

export const aiIncidentListSchema = z.array(aiIncidentSchema).max(1000).default([]);
