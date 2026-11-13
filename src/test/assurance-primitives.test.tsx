import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ControlRow,
  EvidenceTimeline,
  FilterTabs,
  GateBanner,
  KpiTile,
  PageHeader,
  PillarScore,
  RiskTierTag,
  STATUS_WORDS,
  StatusBadge,
  formatUtc,
  gateState,
  pillarTone,
} from "@/components/assurance";
import { Button } from "@/components/ui/button";

// Assurance primitives (src/components/assurance): every status is a word, never a colour alone.

describe("StatusBadge and RiskTierTag", () => {
  it("shows the status word for every tone", () => {
    for (const [tone, word] of Object.entries(STATUS_WORDS)) {
      const { unmount } = render(<StatusBadge tone={tone as keyof typeof STATUS_WORDS} />);
      expect(screen.getByText(word)).toBeInTheDocument();
      unmount();
    }
  });

  it("takes a custom label and keeps the tone as data", () => {
    render(<StatusBadge tone="gap">Capped · Claimed</StatusBadge>);
    const badge = screen.getByText("Capped · Claimed");
    expect(badge).toHaveAttribute("data-tone", "gap");
  });

  it("labels every EU AI Act tier in text", () => {
    render(
      <>
        <RiskTierTag tier="Prohibited" />
        <RiskTierTag tier="High-risk" />
        <RiskTierTag tier="Limited" />
        <RiskTierTag tier="Minimal" />
      </>,
    );
    for (const t of ["Prohibited", "High-risk", "Limited", "Minimal"])
      expect(screen.getByText(t)).toHaveAttribute("data-tier", t);
  });
});

describe("KpiTile", () => {
  it("renders value, unit, label and delta", () => {
    render(<KpiTile value={72} unit="%" label="Guardrail coverage" delta="+4 since last save" />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("Guardrail coverage")).toBeInTheDocument();
    expect(screen.getByText("+4 since last save")).toBeInTheDocument();
  });
});

describe("PillarScore", () => {
  it("derives the tone from the distance to the target", () => {
    expect(pillarTone(40, 75)).toBe("danger");
    expect(pillarTone(60, 75)).toBe("warning");
    expect(pillarTone(75, 75)).toBe("success");
  });

  it("exposes the score as a meter and opens on click", () => {
    const onClick = vi.fn();
    render(
      <PillarScore
        letter="T"
        name="Transparency"
        fn="GOVERN"
        score={58}
        target={80}
        onClick={onClick}
      />,
    );
    const meter = screen.getByRole("meter", { name: /Transparency score 58 of 100, target 80/ });
    expect(meter).toHaveAttribute("aria-valuenow", "58");
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ControlRow", () => {
  it("shows code, question, meta, references and status, and marks the selected row", () => {
    const onClick = vi.fn();
    render(
      <ControlRow
        code="IS11"
        text="Is there an AI inventory?"
        weight="Critical"
        owner="CIO"
        evidence="Attached"
        refs={["NIST MAP 1.1", "ISO 42001 6.1", "EU AI Act Art. 9"]}
        status="attested"
        selected
        onClick={onClick}
      />,
    );
    const row = screen.getByRole("button");
    expect(row).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("IS11")).toBeInTheDocument();
    expect(screen.getByText("Is there an AI inventory?")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Evidence · Attached")).toBeInTheDocument();
    expect(screen.getByText("NIST MAP 1.1")).toBeInTheDocument();
    expect(screen.queryByText("EU AI Act Art. 9")).not.toBeInTheDocument(); // two refs at most
    expect(screen.getByText("Attested")).toBeInTheDocument();
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("GateBanner", () => {
  it("maps the workspace gate words to states", () => {
    expect(gateState("Cleared")).toBe("ready");
    expect(gateState("Conditional")).toBe("conditional");
    expect(gateState("Blocked")).toBe("blocked");
  });

  it("names the verdict in text with its context and detail", () => {
    render(
      <GateBanner
        state="blocked"
        context="Workspace release gate · High tier"
        detail="Blocking: IS11, PM01"
      />,
    );
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-gate", "blocked");
    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(screen.getByText("Workspace release gate · High tier")).toBeInTheDocument();
    expect(screen.getByText("Blocking: IS11, PM01")).toBeInTheDocument();
  });

  it("uses the default word of each state", () => {
    const { rerender } = render(<GateBanner state="conditional" />);
    expect(screen.getByText("Conditional")).toBeInTheDocument();
    rerender(<GateBanner state="ready" />);
    expect(screen.getByText("Ready to release")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("renders eyebrow, title, actions and the meta line", () => {
    render(
      <PageHeader
        eyebrow="Workspace"
        title="Governance overview"
        meta={["Demo workspace", "High tier"]}
        actions={<button type="button">Export</button>}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Governance overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Demo workspace")).toBeInTheDocument();
    expect(screen.getByText("High tier")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("can render as a section heading", () => {
    render(<PageHeader as="h2" title="Evidence" />);
    expect(screen.getByRole("heading", { level: 2, name: "Evidence" })).toBeInTheDocument();
  });
});

describe("FilterTabs", () => {
  it("shows labels with counts, marks the active tab and reports changes", () => {
    const onChange = vi.fn();
    render(
      <FilterTabs
        label="Filter by tier"
        value="all"
        onChange={onChange}
        items={[
          { id: "all", label: "All", count: 6 },
          { id: "high", label: "High-risk", count: 2 },
        ]}
      />,
    );
    expect(screen.getByLabelText("Filter by tier")).toBeInTheDocument();
    const all = screen.getByRole("radio", { name: /All/ });
    expect(all).toHaveAttribute("data-state", "on");
    expect(screen.getByText("6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /High-risk/ }));
    expect(onChange).toHaveBeenCalledWith("high");
    // Clicking the active tab keeps it selected (one filter is always on).
    fireEvent.click(all);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("EvidenceTimeline", () => {
  it("formats instants in UTC", () => {
    expect(formatUtc("2026-11-13T14:05:09.000Z")).toBe("2026-11-13 14:05 UTC");
    expect(formatUtc("not a date")).toBe("not a date");
  });

  it("lists entries with who, ref and a machine-readable time", () => {
    render(
      <EvidenceTimeline
        entries={[
          {
            id: "1",
            title: "IS11 scored 3 · Evidence attached",
            who: "Demo reviewer",
            ref: "IS11",
            at: "2026-11-13T14:05:00Z",
            outcome: "attested",
          },
        ]}
      />,
    );
    expect(screen.getByText("IS11 scored 3 · Evidence attached")).toBeInTheDocument();
    expect(screen.getByText("Demo reviewer · IS11")).toBeInTheDocument();
    const time = screen.getByText("2026-11-13 14:05 UTC");
    expect(time).toHaveAttribute("datetime", "2026-11-13T14:05:00Z");
    expect(screen.getByRole("listitem")).toHaveAttribute("data-outcome", "attested");
  });

  it("says when nothing is recorded", () => {
    render(<EvidenceTimeline entries={[]} empty="No trail yet (preview)." />);
    expect(screen.getByText("No trail yet (preview).")).toBeInTheDocument();
  });
});

describe("Button", () => {
  it("offers the seal variant and the 32 / 40 / 48 heights", () => {
    render(
      <>
        <Button variant="seal">Sign off</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "Sign off" }).className).toContain("bg-seal");
    expect(screen.getByRole("button", { name: "Small" }).className).toContain("h-8");
    expect(screen.getByRole("button", { name: "Large" }).className).toContain("h-12");
    expect(screen.getByRole("button", { name: "Sign off" }).className).toContain("rounded-control");
  });
});
