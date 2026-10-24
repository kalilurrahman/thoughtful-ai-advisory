import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { processLead } from "./lead-intake";

// Public website lead capture (contact, demo, baseline, blueprint, newsletter, design
// partner, waitlist and the maturity self-assessment gate). Mirrors the /api/contact
// contract of the Python reference API: a per-client rate limit, business-email gate,
// explicit consent and a honeypot. Rows are written with the service role into an RLS-locked table.
// After a successful insert, assessment leads are qualified (re-scored server-side and tagged
// with the template's lead_rules, e.g. shield_candidate) and the lead is pushed to the CRM only
// when VERITRAIL_CRM_* / VERITRAIL_HUBSPOT_* env vars are set (src/features/platform/integrations.server.ts).
// CRM failures never fail the lead.

export const LEAD_FORMS = [
  "baseline",
  "demo",
  "contact",
  "newsletter",
  "blueprint",
  "design_partner",
  "waitlist",
  "assessment",
] as const;
export type LeadForm = (typeof LEAD_FORMS)[number];

export { BUSINESS_EMAIL_FORMS } from "./lead-intake";

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");

export const leadInput = z.object({
  form: z.enum(LEAD_FORMS),
  email: z.string().trim().toLowerCase().email().max(254),
  name: optionalText(160),
  company: optionalText(160),
  role: optionalText(160),
  industry: optionalText(60),
  ai_systems: optionalText(20),
  tool: optionalText(80),
  message: optionalText(4000),
  consent: z.literal(true),
  website: z.string().max(200).optional().default(""),
  // Summary data attached by a tool (e.g. assessment score); never contact details.
  payload: z.record(z.string(), z.unknown()).optional(),
  // Assessment lead qualification inputs (never raw answers): the organization profile and
  // the ids of triggered critical flags, evaluated server-side against the lead_rules.
  profile: z.record(z.string().max(40), z.union([z.string().max(40), z.boolean()])).optional(),
  critical_flags: z.array(z.string().max(60)).max(20).optional(),
});
export type LeadInput = z.input<typeof leadInput>;
export type LeadData = z.output<typeof leadInput>;

export type LeadResult = { ok: true; stored: boolean } | { ok: false; error: string };

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator(leadInput)
  .handler(async ({ data }): Promise<LeadResult> => {
    const [limit, integ] = await Promise.all([
      import("@/features/platform/rate-limit.server"),
      import("@/features/platform/integrations.server"),
    ]);
    return processLead(data, {
      allowRequest: limit.allowRequest,
      rateLimited: limit.RATE_LIMITED,
      isBusinessEmail: integ.isBusinessEmail,
      qualifyAssessmentLead: integ.qualifyAssessmentLead,
      qualifyLeadSummary: integ.qualifyLeadSummary,
      syncLeadToCrm: (lead) => integ.syncLeadToCrm(lead),
      insertLead: async (row) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // site_leads is newer than the generated Supabase types.
        const client = supabaseAdmin as unknown as {
          from: (table: string) => {
            insert: (row: object) => {
              select: (cols: string) => {
                single: () => Promise<{
                  data: { id: string; created_at: string } | null;
                  error: { message: string } | null;
                }>;
              };
            };
          };
        };
        const { data: inserted, error } = await client
          .from("site_leads")
          .insert(row)
          .select("id, created_at")
          .single();
        if (error || !inserted) return { error: error?.message ?? "no row returned" };
        return inserted;
      },
    });
  });
