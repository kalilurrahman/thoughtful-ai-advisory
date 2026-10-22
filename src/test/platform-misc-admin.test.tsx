import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLog } from "@/features/platform/audit";

const mocks = vi.hoisted(() => ({
  session: null as null | { user: { id: string } },
  isSiteAdmin: vi.fn(),
  listLeads: vi.fn(),
  listForms: vi.fn(),
  funnelAnalytics: vi.fn(),
  exportLeadsCsv: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mocks.session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}));
vi.mock("@/features/platform/admin.functions", () => ({
  isSiteAdmin: mocks.isSiteAdmin,
  listLeads: mocks.listLeads,
  listForms: mocks.listForms,
  funnelAnalytics: mocks.funnelAnalytics,
  exportLeadsCsv: mocks.exportLeadsCsv,
}));
vi.mock("@/features/site/ui", () => ({
  SiteLink: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const USER = "8a1d6a1e-0000-4000-8000-000000000001";

describe("AdminConsole", () => {
  beforeEach(() => {
    mocks.session = null;
    for (const f of [mocks.isSiteAdmin, mocks.listLeads, mocks.listForms, mocks.funnelAnalytics]) {
      f.mockReset();
    }
  });
  afterEach(cleanup);

  async function renderConsole() {
    const { AdminConsole } = await import("@/features/platform/admin-console");
    return render(<AdminConsole />);
  }

  it("asks signed-out visitors to sign in", async () => {
    await renderConsole();
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/auth");
    expect(mocks.isSiteAdmin).not.toHaveBeenCalled();
  });

  it("explains how an admin is added for signed-in non-admins", async () => {
    mocks.session = { user: { id: USER } };
    mocks.isSiteAdmin.mockResolvedValue({ isAdmin: false, userId: USER });
    await renderConsole();
    expect(
      await screen.findByText(`insert into public.site_admins (user_id) values ('${USER}');`),
    ).toBeInTheDocument();
  });

  it("shows leads, funnel and local audit verification for admins", async () => {
    mocks.session = { user: { id: USER } };
    mocks.isSiteAdmin.mockResolvedValue({ isAdmin: true, userId: USER });
    mocks.listLeads.mockResolvedValue({
      truncated: false,
      leads: [
        {
          lead_id: "l1",
          created_at: "2026-10-22T10:00:00Z",
          email: "a@acme.example",
          name: "Ann",
          company: "Acme",
          role: "",
          overall_score: 56.4,
          maturity_level: "Developing",
          lead_tags: ["shield_candidate"],
          lead_labels: [],
          critical_flags: [],
          source: "maturity-assessment",
          marketing_opt_in: false,
        },
      ],
    });
    mocks.funnelAnalytics.mockResolvedValue({
      events: 3,
      funnel: [{ step: "page_view", count: 2, conversion_from_previous: null }],
      cta_clicks: { baseline: 1 },
    });
    await renderConsole();
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "shield_candidate" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agent console" })).toHaveAttribute(
      "href",
      "/platform/agent",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Funnel" }));
    expect(await screen.findByText("CTA clicks: baseline=1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Audit verify" }));
    const log = new AuditLog();
    log.append("lead.created", "public", { n: 1 });
    log.append("report.download", "lead", { n: 2 });
    const tampered = log.toJsonl().replace('"n":2', '"n":3');
    const input = screen.getByLabelText("Audit log files (JSONL)");
    fireEvent.change(input, {
      target: {
        files: [
          new File([log.toJsonl()], "good_audit.jsonl"),
          new File([tampered], "bad_audit.jsonl"),
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByText(/1 file\(s\) failed verification/)).toBeInTheDocument(),
    );
    const out = document.querySelector("pre code")?.textContent ?? "";
    expect(out.split("\n")).toEqual([
      expect.stringMatching(
        /^FAIL bad_audit\.jsonl {2}records=2 {2}record 1 \(aud_[^)]+\) content hash mismatch$/,
      ),
      "OK   good_audit.jsonl  records=2  ok",
    ]);
  });
});
