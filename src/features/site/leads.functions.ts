import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isFreeMailDomain } from "./content";

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

export const BUSINESS_EMAIL_FORMS: ReadonlySet<LeadForm> = new Set([
  "baseline",
  "demo",
  "blueprint",
  "design_partner",
  "waitlist",
  "assessment",
]);

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

export type LeadResult = { ok: true; stored: boolean } | { ok: false; error: string };

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator(leadInput)
  .handler(async ({ data }): Promise<LeadResult> => {
    // As server.py: every public POST is rate-limited per client and endpoint.
    const limit = await import("@/features/platform/rate-limit.server");
    if (!(await limit.allowRequest(data.form === "assessment" ? "assessment" : "contact")))
      return { ok: false, error: limit.RATE_LIMITED };
    // Honeypot filled: report success without storing anything.
    if (data.website) return { ok: true, stored: false };
    const integ = await import("@/features/platform/integrations.server");
    if (
      BUSINESS_EMAIL_FORMS.has(data.form) &&
      (isFreeMailDomain(data.email) || !integ.isBusinessEmail(data.email))
    ) {
      return { ok: false, error: "Please use your business email address." };
    }
    // Assessment leads: lead tags (e.g. shield_candidate) from the template's lead_rules.
    // Raw answers are re-scored when supplied but never stored.
    let payload: Record<string, unknown> = data.payload ?? {};
    if (data.form === "assessment") {
      const { answers: _answers, ...summary } = payload;
      const q =
        integ.qualifyAssessmentLead(payload) ??
        integ.qualifyLeadSummary({
          overall_score: summary["overall_score"],
          domain_scores: summary["domain_scores"],
          profile: data.profile,
          critical_flags: data.critical_flags,
        });
      payload = { ...summary, ...(q ?? {}), source: "maturity-assessment" };
    }
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
    const row = {
      form: data.form,
      email: data.email,
      name: data.name,
      company: data.company,
      role: data.role,
      industry: data.industry,
      ai_systems: data.ai_systems,
      tool: data.tool,
      message: data.message,
      payload,
      consent: true,
    };
    const { data: inserted, error } = await client
      .from("site_leads")
      .insert(row)
      .select("id, created_at")
      .single();
    if (error) {
      console.error("site lead insert failed", error.message);
      return {
        ok: false,
        error: "We could not record your request. Please try again or email us.",
      };
    }
    if (inserted) {
      // Only when CRM env vars are set; never throws.
      await integ.syncLeadToCrm({ ...row, id: inserted.id, created_at: inserted.created_at });
    }
    return { ok: true, stored: true };
  });
