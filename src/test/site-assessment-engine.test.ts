import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, type AnchorHTMLAttributes, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fixturesRaw from "./fixtures/assessment-parity.json?raw";
import {
  AssessmentInputError,
  buildAssessmentBundle,
  preliminaryResult,
  roundHalfUp1dp,
  scoreAssessment,
} from "@/features/site/engines/assessment-engine";
import { markdownFilename, toMarkdown } from "@/features/site/engines/assessment-report";

// The tool's links render through the router and its gate calls a server function; neither
// is needed to exercise the flow in jsdom.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    hash,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string;
    hash?: string;
    children: ReactNode;
  }) => createElement("a", { ...rest, href: hash ? `${to}#${hash}` : to }, children),
}));
const submitLead = vi.fn();
vi.mock("@/features/site/leads.functions", () => ({
  submitLead: (...args: unknown[]) => submitLead(...args),
}));

interface ParityCase {
  label: string;
  answers: Record<string, unknown>;
  profile: Record<string, unknown>;
  expected_full: unknown;
  expected_preliminary: unknown;
}
interface Fixtures {
  bundle: Record<string, unknown>;
  cases: ParityCase[];
  validation_errors: Array<{ label: string; answers: Record<string, unknown>; error: string }>;
  markdown: Array<{ case: number; company: string; generated: string; markdown: string }>;
}

const fixtures = JSON.parse(fixturesRaw) as Fixtures;
const bundle = buildAssessmentBundle();

describe("assessment bundle", () => {
  it("matches the bundle the Python site builder embeds (template, controls, disclaimer)", () => {
    expect(bundle).toEqual(fixtures.bundle);
  });
});

describe("assessment engine parity with the Python reference engine", () => {
  it("has a meaningful fixture set covering every level", () => {
    expect(fixtures.cases.length).toBeGreaterThanOrEqual(25);
    const levels = new Set(
      fixtures.cases.map(
        (c) => (c.expected_preliminary as { maturity_level: string }).maturity_level,
      ),
    );
    expect(levels).toEqual(new Set(bundle.template.scoring.levels.map((l) => l.name)));
  });

  it.each(fixtures.cases.map((c) => [c.label, c] as const))("%s", (_label, c) => {
    expect(scoreAssessment(c.answers, c.profile, bundle)).toEqual(c.expected_full);
    expect(preliminaryResult(c.answers, c.profile, bundle)).toEqual(c.expected_preliminary);
  });

  it.each(fixtures.validation_errors.map((c) => [c.label, c] as const))(
    "rejects invalid input: %s",
    (_label, c) => {
      let err: unknown;
      try {
        scoreAssessment(c.answers, {}, bundle);
      } catch (e) {
        err = e;
      }
      expect(err).toBeInstanceOf(AssessmentInputError);
      expect((err as Error).name).toBe("AssessmentInputError");
      expect((err as Error).message).toBe(c.error);
    },
  );

  it("rounds half up with integer arithmetic", () => {
    expect(roundHalfUp1dp(1, 8)).toBe(0.1); // 0.125 -> 0.1
    expect(roundHalfUp1dp(3, 40)).toBe(0.1); // 0.075 -> 0.1
    expect(roundHalfUp1dp(2999, 50)).toBe(60);
    expect(() => roundHalfUp1dp(1, 0)).toThrow("den must be positive");
  });
});

describe("assessment Markdown report", () => {
  it("has fixtures produced by the original assessment-report.js", () => {
    expect(fixtures.markdown.length).toBeGreaterThan(0);
  });

  it.each(fixtures.markdown.map((m) => [m.company, m] as const))(
    "matches the original browser Markdown for %s",
    (_company, m) => {
      const c = fixtures.cases[m.case];
      if (!c) throw new Error(`fixture case ${m.case} missing`);
      const result = scoreAssessment(c.answers, c.profile, bundle);
      expect(toMarkdown(result, { bundle, company: m.company, generated: m.generated })).toBe(
        m.markdown,
      );
    },
  );

  it("never renders the internal lead qualification", () => {
    const c = fixtures.cases[0];
    if (!c) throw new Error("fixture case missing");
    const result = scoreAssessment(c.answers, c.profile, bundle);
    const md = toMarkdown(result, { bundle, company: "Acme", generated: "2026-10-21" });
    for (const label of result.lead.labels) expect(md).not.toContain(label);
  });

  it("builds a safe download filename", () => {
    expect(markdownFilename("Acme Corp / <EU>")).toBe("VERITRAIL_Maturity_Report_Acme_Corp_EU_.md");
    expect(markdownFilename("")).toBe("VERITRAIL_Maturity_Report.md");
  });
});

describe("MaturityAssessmentTool", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    submitLead.mockReset();
  });
  afterEach(() => {
    cleanup();
  });

  async function renderTool() {
    const { MaturityAssessmentTool } = await import("@/features/site/tools/maturity-assessment");
    return render(createElement(MaturityAssessmentTool));
  }

  function byId<T extends HTMLElement>(container: HTMLElement, id: string): T {
    const el = container.querySelector<T>(`#${CSS.escape(id)}`);
    if (!el) throw new Error(`#${id} not found`);
    return el;
  }

  async function completeSteps(container: HTMLElement, score: number) {
    fireEvent.change(byId(container, "pf-industry"), { target: { value: "bfsi" } });
    fireEvent.change(byId(container, "pf-org_size"), { target: { value: "250-1000" } });
    fireEvent.change(byId(container, "pf-ai_systems"), { target: { value: "25-99" } });
    fireEvent.click(byId(container, "pf-uses_agents-yes"));
    fireEvent.click(byId(container, "pf-eu_operations-no"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const domains = bundle.template.domains.slice().sort((a, b) => a.order - b.order);
    for (const [i, d] of domains.entries()) {
      expect(await screen.findByRole("heading", { name: d.name })).toHaveFocus();
      for (const q of bundle.template.questions.filter((x) => x.domain === d.id)) {
        fireEvent.click(byId(container, `q-${q.id.toLowerCase()}-${score}`));
      }
      const last = i === domains.length - 1;
      fireEvent.click(screen.getByRole("button", { name: last ? "See my results" : "Next" }));
    }
  }

  it("validates steps, keeps progress in sessionStorage and falls back to a local report", async () => {
    submitLead.mockRejectedValue(new Error("database not configured"));
    const { container } = await renderTool();

    expect(screen.getByText(/Step 1 of 9/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Select: Industry");
    expect(byId(container, "pf-industry")).toHaveAttribute("aria-invalid", "true");

    await completeSteps(container, 3);

    expect(await screen.findByRole("heading", { name: "Your preliminary result" })).toHaveFocus();
    expect(byId(container, "prelim-score")).toHaveTextContent("60.0");
    expect(byId(container, "prelim-level")).toHaveTextContent("Defined");

    const stored = JSON.parse(
      window.sessionStorage.getItem("veritrail.assessment.v1") ?? "null",
    ) as {
      step: number;
      answers: Record<string, number>;
      profile: Record<string, unknown>;
    };
    expect(Object.keys(stored.answers)).toHaveLength(bundle.template.questions.length);
    expect(stored.profile["industry"]).toBe("bfsi");

    // business-email gate
    fireEvent.change(byId(container, "gate-name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(byId(container, "gate-email"), { target: { value: "ada@gmail.com" } });
    fireEvent.change(byId(container, "gate-company"), { target: { value: "Acme Corp" } });
    fireEvent.click(byId(container, "gate-consent"));
    fireEvent.click(screen.getByRole("button", { name: "Get my detailed report" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/business email address/);
    expect(submitLead).not.toHaveBeenCalled();

    fireEvent.change(byId(container, "gate-email"), { target: { value: "ada@acme.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Get my detailed report" }));

    expect(
      await screen.findByRole("heading", { name: "AI Governance Maturity Report — Acme Corp" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(byId(container, "report-delivery")).toHaveFocus());
    expect(byId(container, "report-delivery")).toHaveTextContent(
      /could not reach the VERITRAIL service, so your details were not saved/,
    );
    expect(screen.getByRole("button", { name: "Download Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print or save as PDF" })).toBeInTheDocument();

    expect(submitLead).toHaveBeenCalledTimes(1);
    const sent = (submitLead.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
    expect(sent["form"]).toBe("assessment");
    expect(sent["email"]).toBe("ada@acme.example");
    expect(sent["payload"]).toEqual({
      template_id: "VERITRAIL-SA-MATURITY",
      template_version: bundle.template.template.version,
      overall_score: 60,
      maturity_level: "Defined",
      domain_scores: Object.fromEntries(bundle.template.domains.map((d) => [d.id, 60])),
    });
    expect(JSON.stringify(sent)).not.toContain("answers");
    // contact details never reach sessionStorage
    expect(window.sessionStorage.getItem("veritrail.assessment.v1")).not.toContain("acme.example");

    fireEvent.click(screen.getByRole("button", { name: "Start a new assessment" }));
    expect(await screen.findByRole("heading", { name: "Your organization" })).toHaveFocus();
  });

  it("shows a success notice when the lead is stored", async () => {
    submitLead.mockResolvedValue({ ok: true, stored: true });
    const { container } = await renderTool();
    await completeSteps(container, 5);
    expect(byId(container, "prelim-level")).toHaveTextContent("Optimized");
    fireEvent.change(byId(container, "gate-name"), { target: { value: "Ada" } });
    fireEvent.change(byId(container, "gate-email"), { target: { value: "ada@acme.example" } });
    fireEvent.change(byId(container, "gate-company"), { target: { value: "Acme" } });
    fireEvent.click(byId(container, "gate-consent"));
    fireEvent.click(screen.getByRole("button", { name: "Get my detailed report" }));
    await waitFor(() =>
      expect(byId(container, "report-delivery")).toHaveTextContent(
        "Your detailed report is ready.",
      ),
    );
    expect(byId(container, "report-delivery")).toHaveClass("notice--success");
  });
});
