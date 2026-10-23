import { describe, expect, it, vi } from "vitest";
import fixturesRaw from "./fixtures/platform-misc-parity.json?raw";
import {
  calculate,
  EXAMPLE_INPUTS,
  HYPOTHESIS,
  ROIInputError,
  scenarios,
  scenariosMarkdown,
  toCsv as roiCsv,
  toMarkdown as roiMarkdown,
  type ROIInputs,
  type ROIKey,
} from "@/features/platform/roi/roi";
import {
  RateLimiter,
  buildEvent,
  computeFunnel,
  funnelFromCounts,
  funnelText,
  sanitizeProps,
  trackingAllowed,
  validateEvent,
} from "@/features/platform/analytics-core";
import {
  auditVerifyLine,
  filterByTag,
  formsText,
  grantAdminSql,
  leadsText,
  leadsToCsv,
  leadView,
  type FormView,
  type LeadView,
  type SiteLeadRow,
} from "@/features/platform/admin-core";
import {
  crmRecord,
  emailDomain,
  getCrm,
  isBusinessEmail,
  qualifyAssessmentLead,
  qualifyLeadSummary,
  syncLeadToCrm,
  toHubspotPayload,
  type StoredLead,
} from "@/features/platform/integrations.server";
import { AuditLog, verifyChain } from "@/features/platform/audit";
import { renderMaturityMarkdown } from "@/features/platform/reports/maturity";
import { buildAssessmentBundle, scoreAssessment } from "@/features/site/engines/assessment-engine";
import { findProhibitedClaims } from "@/features/site/engines/ask-veritrail/safety";

const trackEvent = vi.hoisted(() => vi.fn());
vi.mock("@/features/platform/analytics.functions", () => ({ trackEvent }));

/* eslint-disable @typescript-eslint/no-explicit-any -- fixture JSON */
const fx = JSON.parse(fixturesRaw) as any;

describe("ROI calculator parity with content/commercial/roi_calculator.py", () => {
  for (const c of fx.roi.cases) {
    describe(c.id, () => {
      const opts = { floatKeys: c.float_keys as ROIKey[] };
      const res = calculate(c.inputs as ROIInputs, opts);
      it("calculates the same line items and summary", () => {
        expect(res.line_items).toEqual(c.result.line_items);
        expect(res.summary).toEqual(c.result.summary);
        expect(res.hypotheses_to_validate).toEqual(c.result.hypotheses_to_validate);
        expect(res.disclaimer).toBe(c.result.disclaimer);
        expect(res.assumptions.map(({ display: _d, ...a }) => a)).toEqual(c.result.assumptions);
      });
      it("renders identical Markdown and CSV", () => {
        expect(roiMarkdown(res)).toBe(c.markdown);
        expect(roiCsv(res)).toBe(c.csv);
      });
      it("computes the same scenarios", () => {
        const sc = scenarios(c.inputs as ROIInputs, opts);
        for (const k of ["conservative", "base", "optimistic"] as const) {
          expect(sc[k].summary).toEqual(c.scenarios[k]);
          expect(sc[k].inputs).toEqual(c.scenario_inputs[k]);
        }
      });
    });
  }

  it("reproduces the worked example CSV and the CLI --scenarios table", () => {
    const res = calculate(EXAMPLE_INPUTS);
    expect(roiCsv(res)).toBe(fx.roi.worked_example_csv);
    expect(scenariosMarkdown(scenarios(EXAMPLE_INPUTS))).toBe(fx.roi.example_scenarios_markdown);
    expect(roiMarkdown(res)).toContain(HYPOTHESIS);
    expect(findProhibitedClaims(roiMarkdown(res))).toEqual([]);
  });

  it("rejects the same invalid inputs", () => {
    for (const inv of fx.roi.invalid) {
      expect(inv.error).toBeTruthy();
      expect(() => calculate({ ...EXAMPLE_INPUTS, [inv.field]: inv.value })).toThrow(ROIInputError);
      expect(() => calculate({ ...EXAMPLE_INPUTS, [inv.field]: inv.value })).toThrow(inv.error);
    }
    expect(() => calculate({ ...EXAMPLE_INPUTS, hourly_cost: "95" as unknown as number })).toThrow(
      ROIInputError,
    );
  });
});

describe("analytics parity with server.py event() and cli.py funnel()", () => {
  it("validates and normalises events exactly like VeritrailApp.event", () => {
    const stored: unknown[] = [];
    fx.analytics.raw.forEach((raw: unknown, i: number) => {
      const v = validateEvent(raw);
      const resp = fx.analytics.responses[i];
      if (resp.status === 204) {
        expect(v.ok).toBe(true);
        if (v.ok) stored.push(v.event);
      } else {
        expect(v).toEqual({ ok: false, error: JSON.parse(resp.body).error });
      }
    });
    expect(stored).toEqual(fx.analytics.stored);
  });

  it("computes the same funnel and CLI output", () => {
    const f = computeFunnel(fx.analytics.stored);
    expect(f).toEqual(fx.analytics.funnel);
    expect(funnelText(f) + "\n").toBe(fx.analytics.funnel_text);
    expect(computeFunnel([])).toEqual(fx.analytics.empty_funnel);
  });

  for (const c of fx.funnel_cases) {
    it(`funnel case ${c.id}`, () => {
      const f = computeFunnel(c.events);
      expect(f).toEqual(c.funnel);
      expect(funnelText(f) + "\n").toBe(c.text);
      const counts: Record<string, number> = {};
      for (const e of c.events) counts[e.name] = (counts[e.name] ?? 0) + 1;
      expect(funnelFromCounts(counts, c.events.length, f.cta_clicks)).toEqual(c.funnel);
    });
  }

  it("respects Do Not Track and Global Privacy Control like analytics.js", () => {
    expect(trackingAllowed({ navigator: {} })).toBe(true);
    expect(trackingAllowed({ navigator: { doNotTrack: "1" } })).toBe(false);
    expect(trackingAllowed({ navigator: { doNotTrack: "yes" } })).toBe(false);
    expect(trackingAllowed({ navigator: {}, doNotTrack: "1" })).toBe(false);
    expect(trackingAllowed({ navigator: { msDoNotTrack: "1" } })).toBe(false);
    expect(trackingAllowed({ navigator: { globalPrivacyControl: true } })).toBe(false);
    expect(trackingAllowed({ navigator: { doNotTrack: "0" } })).toBe(true);
  });

  it("sanitises client props like analytics.js (no personal keys, no emails, scalars only)", () => {
    expect(
      sanitizeProps({
        cta: "baseline",
        step: 2,
        ok: true,
        email: "x",
        user_id: "u",
        company: "Acme",
        note: "mail me at a@b.co",
        obj: { a: 1 },
        long: "y".repeat(200),
      }),
    ).toEqual({ cta: "baseline", step: 2, ok: true, long: "y".repeat(120) });
    expect(buildEvent("page_view", {}, "/a/b")).toEqual({
      name: "page_view",
      path: "/a/b",
      props: {},
    });
    expect(buildEvent("page_view", null, undefined).path).toBe("/");
  });

  it("track() is fire-and-forget, allow-listed and respects Do Not Track", async () => {
    const { track } = await import("@/features/platform/analytics");
    trackEvent.mockReset();
    trackEvent.mockRejectedValue(new Error("offline"));
    expect(track("assessment_start", { email: "a@b.co", step: 1 })).toBe(true);
    expect(trackEvent).toHaveBeenCalledWith({
      data: { name: "assessment_start", path: window.location.pathname, props: { step: 1 } },
    });
    expect(track("not_an_event")).toBe(false);
    Object.defineProperty(window.navigator, "doNotTrack", { value: "1", configurable: true });
    expect(track("page_view")).toBe(false);
    Object.defineProperty(window.navigator, "doNotTrack", { value: null, configurable: true });
    trackEvent.mockImplementation(() => {
      throw new Error("sync failure");
    });
    expect(track("page_view")).toBe(false);
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("rate-limits per salted client hash in fixed windows", () => {
    let t = 1000;
    const rl = new RateLimiter(2, 60, () => t);
    expect([rl.allow("1.2.3.4", "events"), rl.allow("1.2.3.4", "events")]).toEqual([true, true]);
    expect(rl.allow("1.2.3.4", "events")).toBe(false);
    expect(rl.allow("5.6.7.8", "events")).toBe(true);
    t += 60;
    expect(rl.allow("1.2.3.4", "events")).toBe(true);
  });
});

describe("lead qualification and CRM integrations parity with integrations.py / create_lead", () => {
  it("re-scores and tags assessment leads like score_assessment()['lead']", () => {
    for (const c of fx.leads.qualify) {
      expect(qualifyAssessmentLead({ answers: c.answers, profile: c.profile })).toEqual(c.expected);
    }
    expect(qualifyAssessmentLead({})).toBeNull();
    // Summary path (the public tool sends score, profile and flag ids — never answers).
    for (const c of fx.leads.qualify) {
      const e = c.expected;
      expect(
        qualifyLeadSummary({
          overall_score: e.overall_score,
          domain_scores: e.domain_scores,
          profile: c.profile,
          critical_flags: e.critical_flags,
        }),
      ).toEqual({
        profile: e.profile,
        critical_flags: e.critical_flags,
        lead_tags: e.lead_tags,
        lead_labels: e.lead_labels,
      });
    }
    expect(qualifyLeadSummary({ overall_score: "50" })).toBeNull();
    expect(
      qualifyLeadSummary({
        overall_score: 80,
        profile: { uses_agents: true, industry: "not-an-option" },
        critical_flags: ["FLAG-BOGUS"],
      })?.lead_tags,
    ).toEqual(["shield_candidate"]);
    expect(qualifyAssessmentLead({ answers: { "STR-Q1": 9 }, profile: {} })).toBeNull();
  });

  it("uses the same business-email rules and domain parsing", () => {
    for (const b of fx.leads.business_email) {
      expect(emailDomain(b.email)).toBe(b.domain);
      expect(isBusinessEmail(b.email)).toBe(b.business);
    }
  });

  it("builds the same HubSpot Forms payload", () => {
    for (const h of fx.leads.hubspot) expect(toHubspotPayload(h.record)).toEqual(h.payload);
  });

  const lead: StoredLead = {
    id: "8a1d6a1e-0000-4000-8000-000000000001",
    created_at: "2026-10-22T10:00:00Z",
    form: "assessment",
    email: "jane@acme-bank.example",
    name: "Jane",
    company: "Acme",
    role: "CRO",
    industry: "bfsi",
    ai_systems: "25-99",
    tool: "maturity-assessment",
    message: "",
    payload: { overall_score: 56.4, maturity_level: "Developing", lead_tags: ["shield_candidate"] },
  };

  it("selects CRM adapters only when env vars are set", () => {
    expect(getCrm({})).toBeNull();
    expect(getCrm({ VERITRAIL_CRM_BACKEND: "webhook" })).toBeNull();
    expect(getCrm({ VERITRAIL_CRM_WEBHOOK_URL: "https://hooks.example/x" })?.name).toBe("webhook");
    expect(
      getCrm({ VERITRAIL_HUBSPOT_PORTAL_ID: "1", VERITRAIL_HUBSPOT_FORM_GUID: "g" })?.name,
    ).toBe("hubspot");
    expect(
      getCrm({
        VERITRAIL_CRM_BACKEND: "hubspot",
        VERITRAIL_CRM_WEBHOOK_URL: "https://hooks.example/x",
        VERITRAIL_HUBSPOT_PORTAL_ID: "1",
        VERITRAIL_HUBSPOT_FORM_GUID: "g",
      })?.name,
    ).toBe("hubspot");
  });

  it("posts the lead record to the webhook and never throws on CRM failure", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const ok = await syncLeadToCrm(
      lead,
      { VERITRAIL_CRM_WEBHOOK_URL: "https://hooks.example/x" },
      async (url, init) => {
        calls.push({ url, body: JSON.parse(String(init.body)) });
        return { status: 202 };
      },
    );
    expect(ok).toEqual({ ok: true, backend: "webhook", status: 202 });
    expect(calls[0]?.body).toMatchObject({ lead_id: lead.id, lead_tags: ["shield_candidate"] });
    expect(crmRecord({ ...lead, form: "demo" })).toMatchObject({ source: "form:demo" });
    const down = await syncLeadToCrm(
      lead,
      { VERITRAIL_CRM_WEBHOOK_URL: "https://hooks.example/x" },
      () => Promise.reject(new TypeError("network")),
    );
    expect(down).toEqual({ ok: false, backend: "webhook", error: "TypeError" });
    expect(await syncLeadToCrm(lead, {})).toBeNull();
  });
});

describe("admin console helpers parity with veritrail_admin.cli", () => {
  const cli = fx.leads.cli;
  const asRow = (l: any): SiteLeadRow => ({
    id: l.lead_id,
    created_at: l.created_at,
    form: "assessment",
    email: l.email,
    name: l.name,
    company: l.company,
    role: l.role,
    industry: "",
    ai_systems: "",
    tool: "maturity-assessment",
    message: "",
    payload: {
      overall_score: l.overall_score,
      maturity_level: l.maturity_level,
      lead_tags: l.lead_tags,
      critical_flags: l.critical_flags,
      source: l.source,
      marketing_opt_in: l.marketing_opt_in,
    },
  });
  const leads: LeadView[] = cli.leads.map(asRow).map(leadView);

  it("lists leads (optionally by tag) like `leads list`", () => {
    expect(leadsText(leads) + "\n").toBe(cli.list_all);
    expect(leadsText(filterByTag(leads, "shield_candidate")) + "\n").toBe(cli.list_tag);
  });

  it("exports the same CSV as `leads export` (CSV-injection safe)", () => {
    expect(leadsToCsv(leads)).toBe(cli.export_csv);
  });

  it("lists form submissions like `forms list`", () => {
    const forms = cli.forms.map((f: any) => ({
      ...f,
      email: "",
      name: "",
      role: "",
      message: "",
      tool: "",
    }));
    expect(formsText(forms as FormView[]) + "\n").toBe(cli.forms_text);
  });

  it("verifies uploaded audit logs and prints `audit verify` lines", () => {
    const names = Object.keys(fx.audit.logs).sort();
    const lines = names.map((n) => {
      const log = AuditLog.fromJsonl(fx.audit.logs[n]);
      const r = verifyChain(log.records as unknown as Array<Record<string, unknown>>);
      return auditVerifyLine(n, log.records.length, r.ok, r.message);
    });
    expect(lines.join("\n") + "\n").toBe(fx.audit.output);
  });

  it("shows a safe grant statement", () => {
    expect(grantAdminSql("8a1d6a1e-0000-4000-8000-000000000001")).toBe(
      "insert into public.site_admins (user_id) values ('8a1d6a1e-0000-4000-8000-000000000001');",
    );
    expect(grantAdminSql("x'); drop table y;--")).toContain("<user-id>");
  });
});

describe("maturity report parity with veritrail_reports.maturity.render_maturity_markdown", () => {
  const bundle = buildAssessmentBundle();
  for (const c of fx.maturity) {
    it(c.id, () => {
      const r = scoreAssessment(c.answers, c.profile, bundle);
      expect(renderMaturityMarkdown(r, bundle, c.lead, c.generated)).toBe(c.markdown);
    });
  }
});
/* eslint-enable @typescript-eslint/no-explicit-any */
