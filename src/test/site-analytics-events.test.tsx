import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The public tools and lead forms send the same cookieless events as the Python site
// (risk-triage.js, guardrail.js, ask-veritrail.js and site.js): tool_use after a result,
// form_submit after a stored lead. Both names are in the shared allow-list (analytics-core.ts).

const track = vi.fn();
vi.mock("@/features/platform/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

const submitLead = vi.fn();
vi.mock("@/features/site/leads.functions", () => ({
  submitLead: (...args: unknown[]) => submitLead(...args),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const { RiskTriageTool } = await import("@/features/site/tools/risk-triage");
const { GuardrailGeneratorTool } = await import("@/features/site/tools/guardrail-generator");
const { AskVeritrailTool } = await import("@/features/site/tools/ask-veritrail");
const { LeadForm } = await import("@/features/site/forms");

afterEach(() => {
  cleanup();
  track.mockReset();
  submitLead.mockReset();
});

const events = (name: string) => track.mock.calls.filter(([n]) => n === name).map(([, p]) => p);

describe("tool_use events", () => {
  it("records the suggested tier when risk triage runs", () => {
    const { container } = render(<RiskTriageTool />);
    fireEvent.change(screen.getByLabelText(/AI system or use-case name/), {
      target: { value: "Claims triage assistant" },
    });
    fireEvent.submit(container.querySelector("#rt-form")!);
    expect(events("tool_use")).toEqual([
      { tool: "risk-triage", tier: expect.stringMatching(/^(Prohibited|High-risk|Limited|Minimal)$/) },
    ]);
  });

  it("records nothing when the triage form is refused", () => {
    const { container } = render(<RiskTriageTool />);
    fireEvent.submit(container.querySelector("#rt-form")!);
    expect(events("tool_use")).toEqual([]);
  });

  it("records the overall rating when the guardrail generator runs", () => {
    const { container } = render(<GuardrailGeneratorTool />);
    fireEvent.change(screen.getByLabelText(/Application or agent name/), {
      target: { value: "Support copilot" },
    });
    fireEvent.submit(container.querySelector("#gg-form")!);
    const [props] = events("tool_use");
    expect(props).toMatchObject({ tool: "guardrail-generator" });
    expect(String((props as { rating: string }).rating)).not.toBe("");
  });

  it("records the intent when Ask VERITRAIL answers", () => {
    const { container } = render(<AskVeritrailTool />);
    fireEvent.change(container.querySelector("textarea")!, {
      target: { value: "What is a kill switch?" },
    });
    fireEvent.submit(container.querySelector("form.chat-form")!);
    const [props] = events("tool_use");
    expect(props).toMatchObject({ tool: "ask-veritrail" });
    expect(typeof (props as { intent: unknown }).intent).toBe("string");
  });
});

describe("form_submit events", () => {
  function fillNewsletter(container: HTMLElement, honeypot = "") {
    fireEvent.change(container.querySelector('[name="email"]')!, {
      target: { value: "reader@example.org" },
    });
    fireEvent.click(container.querySelector('[name="consent"]')!);
    if (honeypot)
      fireEvent.change(container.querySelector('[name="website"]')!, {
        target: { value: honeypot },
      });
    fireEvent.submit(container.querySelector("form")!);
  }

  it("records the form name once the lead is stored", async () => {
    submitLead.mockResolvedValue({ ok: true });
    const { container } = render(<LeadForm form="newsletter" />);
    fillNewsletter(container);
    await waitFor(() => expect(events("form_submit")).toEqual([{ form: "newsletter" }]));
  });

  it("records nothing for the honeypot or a refused submission", async () => {
    submitLead.mockResolvedValue({ ok: true });
    const first = render(<LeadForm form="newsletter" />);
    fillNewsletter(first.container, "https://spam.example");
    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(1));
    cleanup();

    submitLead.mockResolvedValue({ ok: false, error: "Please check the form." });
    const second = render(<LeadForm form="newsletter" />);
    fillNewsletter(second.container);
    await waitFor(() => expect(submitLead).toHaveBeenCalledTimes(2));
    await screen.findByText("Please check the form.");
    expect(events("form_submit")).toEqual([]);
  });
});
