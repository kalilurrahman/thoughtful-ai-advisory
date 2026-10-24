import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { funnelFromCounts, FUNNEL, type FunnelReport } from "./analytics-core";
import {
  LEAD_SELECT,
  filterByTag,
  formView,
  leadView,
  leadsToCsv,
  type FormView,
  type LeadView,
  type SiteLeadRow,
} from "./admin-core";

// VERITRAIL admin console server functions — port of platform/app/admin/veritrail_admin/cli.py
// (leads list/export, forms list, analytics funnel). Every function requires a signed-in user
// (requireSupabaseAuth) whose id is in `site_admins` (checked through the caller's own RLS
// client: authenticated users may read only their own row). Only after that check do we read
// `site_leads` / `site_events` with the service role. Approvals live in the Agent console.

const MAX_ROWS = 5000;

/* eslint-disable @typescript-eslint/no-explicit-any -- tables newer than the generated types */
type Loose = any;

/** Whether the signed-in caller is in site_admins, read through their own RLS client. */
export async function callerIsAdmin(context: { supabase: unknown; userId: string }): Promise<boolean> {
  const sb = context.supabase as Loose;
  const { data, error } = await sb
    .from("site_admins")
    .select("user_id")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) {
    console.warn("site_admins check failed", error.message);
    return false;
  }
  return Boolean(data);
}

/** The service-role client, only after the membership check passes. */
export async function adminClient(context: { supabase: unknown; userId: string }): Promise<Loose> {
  if (!(await callerIsAdmin(context))) throw new Error("Forbidden: site admin access required.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as Loose;
}

async function leadRows(db: Loose, assessment: boolean): Promise<SiteLeadRow[]> {
  let q = db.from("site_leads").select(LEAD_SELECT);
  q = assessment ? q.eq("form", "assessment") : q.neq("form", "assessment");
  const { data, error } = await q.order("created_at", { ascending: false }).limit(MAX_ROWS);
  if (error) throw new Error(`Could not read leads: ${error.message}`);
  return (data ?? []) as SiteLeadRow[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const isSiteAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; userId: string }> => ({
    isAdmin: await callerIsAdmin(context),
    userId: context.userId,
  }));

/** leads list [--tag TAG] — assessment leads, newest first. */
export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ tag: z.string().trim().max(60).optional() }).optional().default({}))
  .handler(async ({ data, context }): Promise<{ leads: LeadView[]; truncated: boolean }> => {
    const db = await adminClient(context);
    const rows = await leadRows(db, true);
    return {
      leads: filterByTag(rows.map(leadView), data.tag || null),
      truncated: rows.length >= MAX_ROWS,
    };
  });

/** leads export — CSV with the CLI columns (contains personal data). */
export const exportLeadsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ csv: string; count: number }> => {
    const db = await adminClient(context);
    const leads = (await leadRows(db, true)).map(leadView);
    // Python appends "leads.export" to the admin audit log; here only the count is logged.
    console.info("admin leads.export", { count: leads.length });
    return { csv: leadsToCsv(leads), count: leads.length };
  });

/** forms list — every non-assessment submission (contact, demo, baseline, newsletter...). */
export const listForms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ forms: FormView[]; truncated: boolean }> => {
    const db = await adminClient(context);
    const rows = await leadRows(db, false);
    return { forms: rows.map(formView), truncated: rows.length >= MAX_ROWS };
  });

/** analytics funnel — counts per funnel step + CTA clicks from site_events. */
export const funnelAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FunnelReport> => {
    const db = await adminClient(context);
    const count = async (name?: string): Promise<number> => {
      let q = db.from("site_events").select("id", { count: "exact", head: true });
      if (name) q = q.eq("name", name);
      const { count: n, error } = await q;
      if (error) throw new Error(`Could not read events: ${error.message}`);
      return n ?? 0;
    };
    const [total, ...stepCounts] = await Promise.all([count(), ...FUNNEL.map((n) => count(n))]);
    const counts = Object.fromEntries(FUNNEL.map((n, i) => [n, stepCounts[i] ?? 0]));
    const { data: ctaRows, error } = await db
      .from("site_events")
      .select("props")
      .eq("name", "cta_click")
      .order("created_at", { ascending: true })
      .limit(50_000);
    if (error) throw new Error(`Could not read events: ${error.message}`);
    const ctas: Record<string, number> = {};
    for (const r of (ctaRows ?? []) as Array<{ props: Record<string, unknown> | null }>) {
      const v = r.props?.["cta"];
      const k = v === undefined || v === null ? "None" : String(v);
      ctas[k] = (ctas[k] ?? 0) + 1;
    }
    return funnelFromCounts(counts, total ?? 0, ctas);
  });
