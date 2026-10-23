/*
 * Admin console — pure helpers shared by the server functions and the UI.
 *
 * Port of the read-side of platform/app/admin/veritrail_admin/cli.py: leads list/export, forms list,
 * funnel analytics (see analytics-core.ts) and audit verification output. Lead rows come from the
 * `site_leads` table (written by submitLead); assessment leads correspond to the CLI's
 * var/leads/leads.jsonl and all other forms to var/forms/submissions.jsonl.
 */
import { toCsv } from "./reports/exporters";
import { pyFloatStr } from "@/features/site/engines/shield/py";

export interface SiteLeadRow {
  id: string;
  created_at: string;
  form: string;
  email: string;
  name: string;
  company: string;
  role: string;
  industry: string;
  ai_systems: string;
  tool: string;
  message: string;
  payload: Record<string, unknown> | null;
}

/** Columns read for lead views (never `select *`). */
export const LEAD_SELECT =
  "id, created_at, form, email, name, company, role, industry, ai_systems, tool, message, payload";

export interface LeadView {
  lead_id: string;
  created_at: string;
  email: string;
  name: string;
  company: string;
  role: string;
  overall_score: number | null;
  maturity_level: string;
  lead_tags: string[];
  lead_labels: string[];
  critical_flags: string[];
  source: string;
  marketing_opt_in: boolean;
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** A site_leads row in the shape of the CLI's lead record. */
export function leadView(row: SiteLeadRow): LeadView {
  const p = row.payload ?? {};
  const score = p["overall_score"];
  return {
    lead_id: row.id,
    created_at: row.created_at,
    email: row.email,
    name: row.name,
    company: row.company,
    role: row.role,
    overall_score: typeof score === "number" ? score : null,
    maturity_level: typeof p["maturity_level"] === "string" ? p["maturity_level"] : "",
    lead_tags: strList(p["lead_tags"]),
    lead_labels: strList(p["lead_labels"]),
    critical_flags: strList(p["critical_flags"]),
    source: typeof p["source"] === "string" ? p["source"] : row.tool || `form:${row.form}`,
    marketing_opt_in: p["marketing_opt_in"] === true,
  };
}

/** cmd_leads_list --tag filter. */
export function filterByTag<T extends { lead_tags: string[] }>(leads: T[], tag?: string | null): T[] {
  return tag ? leads.filter((l) => l.lead_tags.includes(tag)) : leads;
}

/** Every tag present, in first-seen order (for the filter control). */
export function allTags(leads: ReadonlyArray<{ lead_tags: string[] }>): string[] {
  const out: string[] = [];
  for (const l of leads) for (const t of l.lead_tags) if (!out.includes(t)) out.push(t);
  return out;
}

/** cmd_leads_export columns. */
export const LEAD_EXPORT_COLUMNS = [
  "lead_id",
  "created_at",
  "email",
  "name",
  "company",
  "role",
  "overall_score",
  "maturity_level",
  "lead_tags",
  "critical_flags",
  "source",
  "marketing_opt_in",
] as const;

/** write_csv(leads, out, cols) — CSV-injection safe; scores keep Python float formatting. */
export function leadsToCsv(leads: LeadView[]): string {
  return toCsv(
    leads.map((l) => ({
      ...l,
      overall_score: l.overall_score === null ? null : pyFloatStr(l.overall_score),
    })) as unknown as Array<Record<string, unknown>>,
    [...LEAD_EXPORT_COLUMNS],
  );
}

const pad = (s: string, n: number) => s.padEnd(n);
const cut = (s: string, n: number) => Array.from(s).slice(0, n).join("");

/** cmd_leads_list text output. */
export function leadsText(leads: LeadView[]): string {
  const lines = [
    `${pad("lead_id", 26)} ${pad("created", 20)} ${pad("company", 28)} ${"score".padStart(5)} ${pad("level", 11)} tags`,
  ];
  for (const l of leads) {
    const score = l.overall_score === null ? "None" : pyFloatStr(l.overall_score);
    lines.push(
      `${pad(l.lead_id, 26)} ${pad(l.created_at.slice(0, 19), 20)} ${pad(cut(l.company, 28), 28)} ` +
        `${score.padStart(5)} ${pad(l.maturity_level, 11)} ${l.lead_tags.join(",")}`,
    );
  }
  lines.push("", `${leads.length} lead(s)`);
  return lines.join("\n");
}

export interface FormView {
  id: string;
  created_at: string;
  form: string;
  email: string;
  name: string;
  company: string;
  role: string;
  message: string;
  tool: string;
}

export function formView(row: SiteLeadRow): FormView {
  return {
    id: row.id,
    created_at: row.created_at,
    form: row.form,
    email: row.email,
    name: row.name,
    company: row.company,
    role: row.role,
    message: row.message,
    tool: row.tool,
  };
}

/** cmd_forms_list text output. */
export function formsText(subs: FormView[]): string {
  const lines = subs.map(
    (s) =>
      `${pad(s.id, 26)} ${s.created_at.slice(0, 19)} ${pad(s.form, 14)} ${cut(s.company ?? "", 30)}`,
  );
  lines.push("", `${subs.length} submission(s)`);
  return lines.join("\n");
}

/** One line of cmd_audit_verify: "OK   <file>  records=<n>  <msg>". */
export function auditVerifyLine(file: string, records: number, ok: boolean, msg: string): string {
  return `${ok ? "OK  " : "FAIL"} ${file}  records=${records}  ${msg}`;
}

/** The SQL an existing operator runs to grant admin access to a user. */
export function grantAdminSql(userId: string): string {
  const safe = /^[0-9a-f-]{36}$/i.test(userId) ? userId : "<user-id>";
  return `insert into public.site_admins (user_id) values ('${safe}');`;
}
