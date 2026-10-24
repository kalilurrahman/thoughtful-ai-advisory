import type * as Integrations from "@/features/platform/integrations.server";
import { isFreeMailDomain } from "./content";
import type { LeadData, LeadForm, LeadResult } from "./leads.functions";

// The steps of a lead submission, in order, with the server-only parts (rate limiter, Supabase,
// CRM) passed in — so submitLead (leads.functions.ts) stays a thin server wrapper and the
// rules can be tested without the server runtime.

export const BUSINESS_EMAIL_FORMS: ReadonlySet<LeadForm> = new Set([
  "baseline",
  "demo",
  "blueprint",
  "design_partner",
  "waitlist",
  "assessment",
]);

export const BUSINESS_EMAIL_ERROR = "Please use your business email address.";
export const NOT_RECORDED_ERROR = "We could not record your request. Please try again or email us.";

export interface LeadRow {
  form: LeadForm;
  email: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  ai_systems: string;
  tool: string;
  message: string;
  payload: Record<string, unknown>;
  consent: true;
}

export interface LeadIntakeDeps extends Pick<
  typeof Integrations,
  "isBusinessEmail" | "qualifyAssessmentLead" | "qualifyLeadSummary" | "syncLeadToCrm"
> {
  /** Per-client, per-endpoint limit (rate-limit.server.ts). */
  allowRequest: (bucket: string) => Promise<boolean>;
  rateLimited: string;
  /** Store the row; the new id and timestamp, or the database error message. */
  insertLead: (row: LeadRow) => Promise<{ id: string; created_at: string } | { error: string }>;
}

export async function processLead(data: LeadData, deps: LeadIntakeDeps): Promise<LeadResult> {
  // As server.py: every public POST is rate-limited per client and endpoint.
  if (!(await deps.allowRequest(data.form === "assessment" ? "assessment" : "contact")))
    return { ok: false, error: deps.rateLimited };
  // Honeypot filled: report success without storing anything.
  if (data.website) return { ok: true, stored: false };
  if (
    BUSINESS_EMAIL_FORMS.has(data.form) &&
    (isFreeMailDomain(data.email) || !deps.isBusinessEmail(data.email))
  ) {
    return { ok: false, error: BUSINESS_EMAIL_ERROR };
  }
  // Assessment leads: lead tags (e.g. shield_candidate) from the template's lead_rules.
  // Raw answers are re-scored when supplied but never stored.
  let payload: Record<string, unknown> = data.payload ?? {};
  if (data.form === "assessment") {
    const { answers: _answers, ...summary } = payload;
    const q =
      deps.qualifyAssessmentLead(payload) ??
      deps.qualifyLeadSummary({
        overall_score: summary["overall_score"],
        domain_scores: summary["domain_scores"],
        profile: data.profile,
        critical_flags: data.critical_flags,
      });
    payload = { ...summary, ...(q ?? {}), source: "maturity-assessment" };
  }
  const row: LeadRow = {
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
  const inserted = await deps.insertLead(row);
  if ("error" in inserted) {
    console.error("site lead insert failed", inserted.error);
    return { ok: false, error: NOT_RECORDED_ERROR };
  }
  // Only when CRM env vars are set; never throws.
  await deps.syncLeadToCrm({ ...row, id: inserted.id, created_at: inserted.created_at });
  return { ok: true, stored: true };
}
