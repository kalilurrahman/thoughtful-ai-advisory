import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isFreeMailDomain } from "./content";

// Public website lead capture (contact, demo, baseline, blueprint, newsletter, design
// partner, waitlist and the maturity self-assessment gate). Mirrors the /api/contact
// contract of the Python reference API: business-email gate, explicit consent and a
// honeypot. Rows are written with the service role into an RLS-locked table.

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
});
export type LeadInput = z.input<typeof leadInput>;

export type LeadResult = { ok: true; stored: boolean } | { ok: false; error: string };

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator(leadInput)
  .handler(async ({ data }): Promise<LeadResult> => {
    // Honeypot filled: report success without storing anything.
    if (data.website) return { ok: true, stored: false };
    if (BUSINESS_EMAIL_FORMS.has(data.form) && isFreeMailDomain(data.email)) {
      return { ok: false, error: "Please use your business email address." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // site_leads is newer than the generated Supabase types.
    const client = supabaseAdmin as unknown as {
      from: (table: string) => {
        insert: (row: object) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await client.from("site_leads").insert({
      form: data.form,
      email: data.email,
      name: data.name,
      company: data.company,
      role: data.role,
      industry: data.industry,
      ai_systems: data.ai_systems,
      tool: data.tool,
      message: data.message,
      payload: data.payload ?? {},
      consent: true,
    });
    if (error) {
      console.error("site lead insert failed", error.message);
      return {
        ok: false,
        error: "We could not record your request. Please try again or email us.",
      };
    }
    return { ok: true, stored: true };
  });
