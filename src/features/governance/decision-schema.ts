import { z } from "zod";

export const decisionOutcomes = [
  "Approved",
  "Conditional approval",
  "Risk accepted",
  "Rejected",
  "Paused",
  "Retired",
] as const;

export const CORRECTION_REASON_MAX = 1000;

// "Corrected" and "Withdrawn" close a record that was wrong rather than outdated; the reason is
// kept as the event note. Nothing is edited or deleted in place (decision-model.ts).
const decisionEventSchema = z.object({
  action: z.enum(["Created", "Superseded", "Corrected", "Withdrawn"]),
  changedAt: z.string().datetime({ offset: true }),
  note: z.string().trim().max(CORRECTION_REASON_MAX).optional(),
});

export const governanceDecisionSchema = z
  .object({
    id: z.string().uuid(),
    system: z.string().trim().min(1).max(160),
    outcome: z.enum(decisionOutcomes),
    decidedAt: z.string().date(),
    reviewBy: z.string().date().nullable().default(null),
    approver: z.string().trim().min(1).max(120),
    rationale: z.string().trim().min(1).max(4000),
    conditions: z.string().max(4000).default(""),
    lifecycle: z.enum(["Current", "Superseded", "Withdrawn"]).default("Current"),
    history: z.array(decisionEventSchema).max(100).default([]),
    /** Id of the record this one corrects; that record keeps a "Corrected" event. */
    corrects: z.string().uuid().optional(),
    correctionReason: z.string().trim().max(CORRECTION_REASON_MAX).optional(),
  })
  .superRefine((decision, ctx) => {
    if (decision.corrects && !decision.correctionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["correctionReason"],
        message: "Say why the earlier record is being corrected.",
      });
    }
    if (decision.reviewBy && decision.reviewBy < decision.decidedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewBy"],
        message: "Review date must be on or after the decision date.",
      });
    }
    if (
      ["Risk accepted", "Conditional approval"].includes(decision.outcome) &&
      !decision.reviewBy
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewBy"],
        message: "Risk acceptance and conditional approval require a review date.",
      });
    }
  });

export const governanceDecisionListSchema = z.array(governanceDecisionSchema).max(1000).default([]);

export type GovernanceDecision = z.infer<typeof governanceDecisionSchema>;
