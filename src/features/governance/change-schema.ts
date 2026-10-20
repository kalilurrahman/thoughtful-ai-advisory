import { z } from "zod";

export const changeCategories = [
  "Purpose or intended use",
  "Affected people or population",
  "Model or AI provider",
  "Data source or processing",
  "Autonomy or human oversight",
  "Integration or deployment context",
  "Controls or operating procedure",
  "Material incident or performance shift",
] as const;

export const impactAreas = [
  "Safety",
  "Privacy",
  "Security",
  "Fairness",
  "Rights",
  "Operations",
] as const;
export const impactLevels = ["Not assessed", "Low", "Moderate", "High", "Critical"] as const;
export const changeStatuses = [
  "Pending review",
  "Approved",
  "Changes requested",
  "Rejected",
  "Implemented",
] as const;

const impactLevelSchema = z.enum(impactLevels);
const impactSchema = z.object({
  Safety: impactLevelSchema,
  Privacy: impactLevelSchema,
  Security: impactLevelSchema,
  Fairness: impactLevelSchema,
  Rights: impactLevelSchema,
  Operations: impactLevelSchema,
});

const changeEventSchema = z.object({
  status: z.enum(changeStatuses),
  actor: z.string().trim().min(1).max(120),
  note: z.string().max(2000),
  changedAt: z.string().datetime({ offset: true }),
});

export const changeReviewSchema = z
  .object({
    id: z.string().uuid(),
    system: z.string().trim().min(1).max(160),
    categories: z.array(z.enum(changeCategories)).min(1).max(changeCategories.length),
    summary: z.string().trim().min(1).max(4000),
    requestedBy: z.string().trim().min(1).max(120),
    targetDate: z.string().date().nullable().default(null),
    submittedAt: z.string().datetime({ offset: true }),
    impacts: impactSchema,
    impactRationale: z.string().trim().min(1).max(4000),
    status: z.enum(changeStatuses).default("Pending review"),
    reviewer: z.string().max(120).default(""),
    decisionRationale: z.string().max(4000).default(""),
    decidedAt: z.string().datetime({ offset: true }).nullable().default(null),
    history: z.array(changeEventSchema).max(100).default([]),
  })
  .superRefine((review, ctx) => {
    if (new Set(review.categories).size !== review.categories.length) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: "Remove duplicate change areas.",
      });
    }
    if (review.targetDate && review.targetDate < review.submittedAt.slice(0, 10)) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "Target date cannot be before submission.",
      });
    }
  });

export const changeReviewListSchema = z.array(changeReviewSchema).max(1000).default([]);
export type ChangeReview = z.infer<typeof changeReviewSchema>;
export type ChangeStatus = ChangeReview["status"];
