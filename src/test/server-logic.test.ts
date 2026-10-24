import { afterEach, describe, expect, it, vi } from "vitest";
import { CONTROLS } from "@/data/governance";
import { adviceFromResponse, extractText } from "@/features/governance/advisor.functions";
import {
  BUSINESS_EMAIL_ERROR,
  NOT_RECORDED_ERROR,
  processLead,
  type LeadIntakeDeps,
  type LeadRow,
} from "@/features/site/lead-intake";
import { leadInput } from "@/features/site/leads.functions";

// Server-side rules that run behind server functions, tested with their dependencies passed in
// (server functions themselves need the Start runtime): lead intake, the AI advisor's answer
// handling and the admin membership check.

const serviceRole = { role: "service" };
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: serviceRole }));
const { adminClient, callerIsAdmin } = await import("@/features/platform/admin.functions");

afterEach(() => vi.restoreAllMocks());

// ------------------------------------------------------------------ lead intake

function deps(over: Partial<LeadIntakeDeps> = {}) {
  const stored: LeadRow[] = [];
  const synced: unknown[] = [];
  const d: LeadIntakeDeps = {
    allowRequest: async () => true,
    rateLimited: "Too many requests. Please retry shortly.",
    isBusinessEmail: () => true,
    qualifyAssessmentLead: () => null,
    qualifyLeadSummary: () => ({ lead_tags: ["shield_candidate"] }) as never,
    syncLeadToCrm: async (lead) => {
      synced.push(lead);
      return null;
    },
    insertLead: async (row) => {
      stored.push(row);
      return { id: "lead-1", created_at: "2026-10-24T10:00:00Z" };
    },
    ...over,
  };
  return { d, stored, synced };
}
const lead = (over: Record<string, unknown> = {}) =>
  leadInput.parse({ form: "baseline", email: "Ana@Acme.example", consent: true, ...over });

describe("lead intake (submitLead)", () => {
  it("stores a valid lead with a normalised email and pushes it to the CRM", async () => {
    const { d, stored, synced } = deps();
    expect(await processLead(lead({ name: " Ana " }), d)).toEqual({ ok: true, stored: true });
    expect(stored[0]).toMatchObject({ form: "baseline", email: "ana@acme.example", name: "Ana" });
    expect(synced[0]).toMatchObject({ id: "lead-1", email: "ana@acme.example" });
  });

  it("refuses before anything else once the client is rate-limited", async () => {
    const buckets: string[] = [];
    const { d, stored } = deps({
      allowRequest: async (b) => {
        buckets.push(b);
        return false;
      },
    });
    expect(await processLead(lead(), d)).toEqual({ ok: false, error: d.rateLimited });
    await processLead(lead({ form: "assessment" }), d);
    expect(buckets).toEqual(["contact", "assessment"]);
    expect(stored).toEqual([]);
  });

  it("pretends success for the honeypot and stores nothing", async () => {
    const { d, stored, synced } = deps();
    expect(await processLead(lead({ website: "https://spam.example" }), d)).toEqual({
      ok: true,
      stored: false,
    });
    expect(stored).toEqual([]);
    expect(synced).toEqual([]);
  });

  it("asks for a business email on business forms only", async () => {
    const { d, stored } = deps();
    expect(await processLead(lead({ email: "ana@gmail.com" }), d)).toEqual({
      ok: false,
      error: BUSINESS_EMAIL_ERROR,
    });
    const { d: d2 } = deps({ isBusinessEmail: () => false });
    expect((await processLead(lead(), d2)).ok).toBe(false);
    expect(await processLead(lead({ form: "newsletter", email: "ana@gmail.com" }), d)).toEqual({
      ok: true,
      stored: true,
    });
    expect(stored.map((r) => r.form)).toEqual(["newsletter"]);
  });

  it("never stores raw assessment answers, and tags the lead", async () => {
    const { d, stored } = deps();
    await processLead(
      lead({
        form: "assessment",
        payload: { overall_score: 41, answers: { q1: 3 }, domain_scores: { strategy: 40 } },
      }),
      d,
    );
    expect(stored[0]?.payload).toEqual({
      overall_score: 41,
      domain_scores: { strategy: 40 },
      lead_tags: ["shield_candidate"],
      source: "maturity-assessment",
    });
  });

  it("says nothing was recorded when the insert fails, and skips the CRM", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { d, synced } = deps({ insertLead: async () => ({ error: "permission denied" }) });
    expect(await processLead(lead(), d)).toEqual({ ok: false, error: NOT_RECORDED_ERROR });
    expect(synced).toEqual([]);
  });
});

// ------------------------------------------------------------------ AI advisor answers

const [c1, c2] = CONTROLS;
const answer = (json: unknown) => ({ output_text: JSON.stringify(json) });
const good = {
  summary: "Prompt injection exposure in the support agent.",
  areas: [
    { controlId: c1!.id, relevance: "High", rationale: "Directly relevant." },
    { controlId: "XX-99", relevance: "High", rationale: "Not a real control." },
    { controlId: c2!.id, relevance: "Extreme", rationale: "Unknown relevance." },
  ],
  actions: [
    {
      title: "Add input filtering",
      description: "Filter tool arguments.",
      priority: "High",
      owner: "Platform lead",
      controlId: c1!.id,
    },
    {
      title: "Made-up control",
      description: "x",
      priority: "High",
      owner: "x",
      controlId: "XX-99",
    },
    { title: "Bad priority", description: "x", priority: "Urgent", owner: "x", controlId: c1!.id },
  ],
};

describe("AI advisor answers", () => {
  it("keeps only areas and actions that cite a catalogue control", () => {
    const r = adviceFromResponse(200, answer(good));
    expect(r.ok).toBe(true);
    expect(r.areas?.map((a) => a.controlId)).toEqual([c1!.id]);
    expect(r.areas?.[0]).toMatchObject({ code: c1!.code, question: c1!.text, relevance: "High" });
    expect(r.actions?.map((a) => a.title)).toEqual(["Add input filtering"]);
  });

  it("reads the text from either response shape", () => {
    expect(extractText({ output_text: "a" })).toBe("a");
    expect(extractText({ output: [{ content: [{ text: "b" }] }] })).toBe("b");
    expect(extractText(null)).toBe("");
  });

  it("explains gateway errors and unreadable or incomplete answers", () => {
    expect(adviceFromResponse(429, null).error).toMatch(/busy/);
    expect(adviceFromResponse(402, null).error).toMatch(/credits/);
    expect(adviceFromResponse(500, null).error).toMatch(/could not respond/);
    expect(adviceFromResponse(200, { output_text: "not json" }).error).toMatch(/unreadable/);
    expect(adviceFromResponse(200, answer({ summary: "s" })).error).toMatch(/unreadable/);
    expect(adviceFromResponse(200, answer(null)).error).toMatch(/unreadable/);
  });
});

// ------------------------------------------------------------------ admin membership

function rlsClient(result: { data: unknown; error: { message: string } | null }) {
  const calls: string[] = [];
  const chain = {
    from: (t: string) => (calls.push(`from:${t}`), chain),
    select: (c: string) => (calls.push(`select:${c}`), chain),
    eq: (k: string, v: string) => (calls.push(`eq:${k}=${v}`), chain),
    maybeSingle: async () => result,
  };
  return { supabase: chain, calls };
}

describe("admin membership check", () => {
  it("looks up only the caller's own row in site_admins", async () => {
    const { supabase, calls } = rlsClient({ data: { user_id: "u1" }, error: null });
    expect(await callerIsAdmin({ supabase, userId: "u1" })).toBe(true);
    expect(calls).toEqual(["from:site_admins", "select:user_id", "eq:user_id=u1"]);
  });

  it("treats a missing row or a failed check as not an admin", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await callerIsAdmin({ ...rlsClient({ data: null, error: null }), userId: "u2" })).toBe(
      false,
    );
    expect(
      await callerIsAdmin({
        ...rlsClient({ data: null, error: { message: "permission denied" } }),
        userId: "u2",
      }),
    ).toBe(false);
  });

  it("hands out the service-role client only after the check passes", async () => {
    const admin = rlsClient({ data: { user_id: "u1" }, error: null });
    expect(await adminClient({ supabase: admin.supabase, userId: "u1" })).toBe(serviceRole);
    const other = rlsClient({ data: null, error: null });
    await expect(adminClient({ supabase: other.supabase, userId: "u2" })).rejects.toThrow(
      /Forbidden/,
    );
  });
});
