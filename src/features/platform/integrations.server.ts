/*
 * Lead capture integrations (server only) — port of platform/app/api/veritrail_api/integrations.py
 * plus the lead record / qualification built by create_lead() and contact() in server.py.
 *
 * What runs here (Cloudflare Workers via TanStack server functions):
 *  - CRM adapters: generic webhook (Zapier/Make/n8n or a CRM inbound endpoint) and HubSpot Forms.
 *    The default Python adapter (JsonlCRM, a local file) has no Workers equivalent: the
 *    `site_leads` row written by submitLead IS the system of record, so without CRM env vars
 *    nothing else happens.
 *  - Lead qualification: the assessment lead is re-scored server-side with the shared engine and
 *    tagged with the template's lead_rules (baseline_priority, platform_candidate,
 *    shield_candidate, compliance_led, ...), exactly as score_assessment()["lead"] in Python.
 *
 * What does NOT run here: SMTP email delivery (SMTPMailer / OutboxMailer). Workers cannot open raw
 * TCP SMTP sessions with smtplib semantics and there is no outbox directory, so report emails are
 * never sent from the hosted site; the UI says so. Use a transactional email HTTP API in a
 * future adapter if needed. VERITRAIL_MAIL_BACKEND / VERITRAIL_SMTP_* are therefore ignored.
 *
 * Environment (same names as the Python API):
 *   VERITRAIL_CRM_BACKEND        "webhook" | "hubspot" (optional here: inferred from the vars below)
 *   VERITRAIL_CRM_WEBHOOK_URL    webhook adapter target (POST application/json)
 *   VERITRAIL_HUBSPOT_PORTAL_ID  HubSpot portal id      } HubSpot Forms submission API
 *   VERITRAIL_HUBSPOT_FORM_GUID  HubSpot form GUID      }
 *
 * CRM failures are reported in the return value and never thrown: a CRM outage must never fail
 * lead capture.
 */
import {
  AssessmentInputError,
  buildAssessmentBundle,
  normalizeProfile,
  scoreAssessment,
  type RuleCondition,
} from "@/features/site/engines/assessment-engine";
import { pyFloatStr, pyStr } from "@/features/site/engines/shield/py";

export const FREE_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in", "ymail.com", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.de", "gmx.net", "mail.com", "zoho.com",
  "yandex.com", "yandex.ru", "mail.ru", "qq.com", "163.com", "126.com", "rediffmail.com", "tutanota.com",
  "fastmail.com", "hey.com", "web.de", "inbox.com",
]); // prettier-ignore

export const DISPOSABLE_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "trashmail.com",
  "yopmail.com", "sharklasers.com", "getnada.com", "dispostable.com",
]); // prettier-ignore

/** email_domain(): the part after the last "@", lower-cased and stripped ("" without "@"). */
export function emailDomain(email: string): string {
  const i = email.lastIndexOf("@");
  return i < 0 ? "" : email.slice(i + 1).toLowerCase().trim();
}

/** is_business_email(): a domain that is neither free-mail nor disposable. */
export function isBusinessEmail(email: string): boolean {
  const d = emailDomain(email);
  return Boolean(d) && !FREE_MAIL_DOMAINS.has(d) && !DISPOSABLE_DOMAINS.has(d);
}

// ----------------------------------------------------------------- lead qualification

export interface LeadQualification {
  profile: Record<string, unknown>;
  overall_score: number;
  maturity_level: string;
  domain_scores: Record<string, number>;
  critical_flags: string[];
  lead_tags: string[];
  lead_labels: string[];
  template_id: string;
  template_version: string;
}

let bundleCache: ReturnType<typeof buildAssessmentBundle> | null = null;

/**
 * Re-score the submitted answers server-side (never trust client scores) and return the fields
 * Python's create_lead() stores: profile, score, level, domain scores, critical flag ids, lead
 * tags and labels. Returns null when there are no (valid) answers.
 */
export function qualifyAssessmentLead(payload: Record<string, unknown> | undefined): LeadQualification | null {
  const answers = payload?.["answers"];
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return null;
  const profile = payload?.["profile"];
  bundleCache ??= buildAssessmentBundle();
  try {
    const r = scoreAssessment(
      answers as Record<string, unknown>,
      profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {},
      bundleCache,
    );
    return {
      profile: r.profile,
      overall_score: r.overall_score,
      maturity_level: r.maturity_level,
      domain_scores: Object.fromEntries(r.domains.map((d) => [d.id, d.score])),
      critical_flags: r.critical_flags.map((f) => f.id),
      lead_tags: r.lead.tags,
      lead_labels: r.lead.labels,
      template_id: r.template_id,
      template_version: r.template_version,
    };
  } catch (e) {
    if (e instanceof AssessmentInputError) return null;
    throw e;
  }
}

export interface LeadSummaryInput {
  overall_score: unknown;
  domain_scores?: unknown;
  profile?: unknown;
  critical_flags?: unknown;
}

/**
 * Lead tags from the score summary the browser sends (the public tool keeps raw answers in the
 * browser): evaluates the template's lead_rules with the same conditions as cond_true() in
 * engine.py — overall_below, domain_below, profile and flag. Returns null without a numeric
 * overall score.
 */
export function qualifyLeadSummary(input: LeadSummaryInput): Pick<
  LeadQualification,
  "profile" | "lead_tags" | "lead_labels" | "critical_flags"
> | null {
  const overall = input.overall_score;
  if (typeof overall !== "number" || !Number.isFinite(overall)) return null;
  bundleCache ??= buildAssessmentBundle();
  const tpl = bundleCache.template;
  const domainScores =
    input.domain_scores && typeof input.domain_scores === "object" && !Array.isArray(input.domain_scores)
      ? (input.domain_scores as Record<string, unknown>)
      : {};
  const allowedFields = new Map(tpl.profile_fields.map((f) => [f.id, f]));
  const rawProfile =
    input.profile && typeof input.profile === "object" && !Array.isArray(input.profile)
      ? (input.profile as Record<string, unknown>)
      : {};
  const profile = normalizeProfile(
    Object.fromEntries(
      Object.entries(rawProfile).filter(([k, v]) => {
        const f = allowedFields.get(k);
        if (!f) return false;
        return f.type === "select" ? typeof v === "string" && (f.options ?? []).includes(v) : true;
      }),
    ),
  );
  const flagIds = new Set(tpl.critical_flags.map((f) => f.id));
  const flags = Array.isArray(input.critical_flags)
    ? input.critical_flags.filter((f): f is string => typeof f === "string" && flagIds.has(f))
    : [];
  const condTrue = (c: RuleCondition): boolean => {
    if (c.always) return true;
    if (c.overall_below !== undefined) return overall < c.overall_below;
    if (c.domain_below !== undefined) {
      return Object.entries(c.domain_below).some(([d, v]) => {
        const sc = domainScores[d];
        return typeof sc === "number" && sc < v;
      });
    }
    if (c.profile !== undefined) {
      return Object.entries(c.profile).every(([k, v]) => (k in profile ? profile[k] : null) === v);
    }
    if (c.flag !== undefined) return flags.includes(c.flag);
    return false;
  };
  const rules = tpl.lead_rules.filter((r) => r.any.some(condTrue));
  return {
    profile,
    critical_flags: flags,
    lead_tags: rules.map((r) => r.tag),
    lead_labels: rules.map((r) => r.label),
  };
}

// ----------------------------------------------------------------- CRM records

export interface StoredLead {
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
  payload: Record<string, unknown>;
}

/**
 * The record pushed to the CRM. Assessment leads mirror create_lead()'s record (lead_id, profile,
 * score, level, tags...); other forms mirror contact()'s submission with source "form:<form>".
 */
export function crmRecord(lead: StoredLead): Record<string, unknown> {
  const p = lead.payload ?? {};
  if (lead.form === "assessment") {
    return {
      lead_id: lead.id,
      created_at: lead.created_at,
      email: lead.email,
      name: lead.name,
      company: lead.company,
      role: lead.role,
      consent: true,
      marketing_opt_in: p["marketing_opt_in"] === true,
      source: typeof p["source"] === "string" ? p["source"] : "maturity-assessment",
      profile: p["profile"] ?? {},
      overall_score: p["overall_score"] ?? null,
      maturity_level: p["maturity_level"] ?? null,
      domain_scores: p["domain_scores"] ?? {},
      critical_flags: p["critical_flags"] ?? [],
      lead_tags: p["lead_tags"] ?? [],
      lead_labels: p["lead_labels"] ?? [],
      template_version: p["template_version"] ?? null,
    };
  }
  return {
    id: lead.id,
    form: lead.form,
    created_at: lead.created_at,
    email: lead.email,
    name: lead.name,
    company: lead.company,
    role: lead.role,
    message: lead.message,
    ai_systems: lead.ai_systems,
    industry: lead.industry,
    tool: lead.tool,
    consent: true,
    source: `form:${lead.form}`,
  };
}

/** Python str() of a scalar for HubSpot field values (scores are Python floats: "60.0"). */
function pyScalarStr(name: string, v: unknown): string {
  if (typeof v === "number" && name === "veritrail_maturity_score") return pyFloatStr(v);
  return pyStr(v);
}

/** HubSpotFormsCRM.upsert_contact() payload (field mapping; empty values are omitted). */
export function toHubspotPayload(record: Record<string, unknown>): Record<string, unknown> {
  const tags = Array.isArray(record["lead_tags"]) ? (record["lead_tags"] as unknown[]) : [];
  const fields: Array<[string, unknown]> = [
    ["email", record["email"]],
    ["firstname", record["name"]],
    ["company", record["company"]],
    ["jobtitle", record["role"]],
    ["veritrail_maturity_score", record["overall_score"]],
    ["veritrail_maturity_level", record["maturity_level"]],
    ["veritrail_lead_tags", tags.map(String).join(";")],
    ["veritrail_source", record["source"]],
  ];
  return {
    fields: fields
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([name, v]) => ({ name, value: pyScalarStr(name, v) })),
    legalConsentOptions: {
      consent: {
        consentToProcess: Boolean(record["consent"]),
        text: "I agree to VERITRAIL processing my data to deliver my report.",
      },
    },
  };
}

// ----------------------------------------------------------------- CRM adapters

export type CrmResult =
  | { ok: boolean; backend: string; status: number }
  | { ok: false; backend: string; error: string };

export interface CrmAdapter {
  name: "webhook" | "hubspot";
  upsertContact(record: Record<string, unknown>): Promise<CrmResult>;
}

type FetchLike = (url: string, init: RequestInit) => Promise<{ status: number }>;

async function postJson(
  url: string,
  body: unknown,
  backend: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
): Promise<CrmResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return { ok: r.status >= 200 && r.status < 300, backend, status: r.status };
  } catch (e) {
    // never fail lead capture because the CRM is down
    return { ok: false, backend, error: e instanceof Error ? e.name : "Error" };
  } finally {
    clearTimeout(timer);
  }
}

/** WebhookCRM: POSTs the lead JSON to VERITRAIL_CRM_WEBHOOK_URL. */
export function webhookCrm(url: string, fetchImpl: FetchLike = fetch, timeoutMs = 5000): CrmAdapter {
  return {
    name: "webhook",
    upsertContact: (record) => postJson(url, record, "webhook", fetchImpl, timeoutMs),
  };
}

export const HUBSPOT_SUBMIT_URL = "https://api.hsforms.com/submissions/v3/integration/submit";

/** HubSpotFormsCRM: HubSpot Forms submission API (portal id + form guid). */
export function hubspotCrm(
  portalId: string,
  formGuid: string,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 5000,
): CrmAdapter {
  const url = `${HUBSPOT_SUBMIT_URL}/${encodeURIComponent(portalId)}/${encodeURIComponent(formGuid)}`;
  return {
    name: "hubspot",
    upsertContact: (record) =>
      postJson(url, toHubspotPayload(record), "hubspot", fetchImpl, timeoutMs),
  };
}

export type IntegrationEnv = Record<string, string | undefined>;

/**
 * get_crm(): the configured adapter, or null when no CRM env vars are set (the site_leads row is
 * then the only store). VERITRAIL_CRM_BACKEND selects explicitly; when unset the backend is inferred
 * from which variables are present (webhook first).
 */
export function getCrm(env: IntegrationEnv, fetchImpl: FetchLike = fetch): CrmAdapter | null {
  const backend = env["VERITRAIL_CRM_BACKEND"]?.trim();
  const url = env["VERITRAIL_CRM_WEBHOOK_URL"]?.trim();
  const portal = env["VERITRAIL_HUBSPOT_PORTAL_ID"]?.trim();
  const guid = env["VERITRAIL_HUBSPOT_FORM_GUID"]?.trim();
  const wantWebhook = backend === "webhook" || (!backend && Boolean(url));
  const wantHubspot = backend === "hubspot" || (!backend && !url && Boolean(portal && guid));
  if (wantWebhook && url && /^https:\/\//i.test(url)) return webhookCrm(url, fetchImpl);
  if (wantHubspot && portal && guid) return hubspotCrm(portal, guid, fetchImpl);
  return null;
}

/** Why email delivery is not available on the hosted site (shown in admin/status output). */
export const MAIL_UNAVAILABLE =
  "Email delivery is not available on the hosted site: SMTP (VERITRAIL_MAIL_BACKEND=smtp) needs raw TCP sockets " +
  "that Cloudflare Workers do not provide, so reports are never emailed.";

/**
 * Push a stored lead to the configured CRM. Never throws; returns null when no CRM is configured.
 * Only the lead id, outcome and email DOMAIN are logged (never the address).
 */
export async function syncLeadToCrm(
  lead: StoredLead,
  env: IntegrationEnv = typeof process !== "undefined" ? process.env : {},
  fetchImpl: FetchLike = fetch,
): Promise<CrmResult | null> {
  try {
    const crm = getCrm(env, fetchImpl);
    if (!crm) return null;
    const res = await crm.upsertContact(crmRecord(lead));
    if (!res.ok) {
      console.warn("crm sync failed", { lead_id: lead.id, domain: emailDomain(lead.email), ...res });
    }
    return res;
  } catch (e) {
    console.warn("crm sync error", { lead_id: lead.id, error: e instanceof Error ? e.name : "Error" });
    return { ok: false, backend: "unknown", error: e instanceof Error ? e.name : "Error" };
  }
}
