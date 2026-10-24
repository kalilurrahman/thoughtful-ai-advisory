import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { buildLifecycleChecklist } from "@/features/governance/checklist-model";
import { GovernanceContext } from "@/features/governance/context";
import { generateEvidenceFile, type ExportFormat } from "@/features/governance/evidence-files";
import { buildEvidenceReport } from "@/features/governance/evidence-report";
import { pillarScores } from "@/features/governance/model";
import {
  closingEvent,
  historyText,
  lifecycleLabel,
  recordDecision,
  sameRecordedFields,
  withdrawDecision,
} from "@/features/governance/decision-model";
import {
  governanceDecisionSchema,
  type GovernanceDecision,
} from "@/features/governance/decision-schema";
import { DecisionsScreen } from "@/features/governance/screens-decisions";
import { initialState, reducer, type GovernanceState } from "@/features/governance/store";

// Correcting and withdrawing governance decisions without editing or deleting records
// (src/features/governance/decision-model.ts).

const sampleSystems = initialState().systems.map((system) => system.name);
const systemA = sampleSystems[0]!;
const systemB = sampleSystems[1]!;
const at = "2026-10-24T10:00:00.000Z";
const later = "2026-10-25T09:00:00.000Z";

function decision(over: Partial<GovernanceDecision> = {}): GovernanceDecision {
  return governanceDecisionSchema.parse({
    id: crypto.randomUUID(),
    system: systemA,
    outcome: "Approved",
    decidedAt: "2026-10-20",
    reviewBy: null,
    approver: "AI Oversight Committee",
    rationale: "Reviewed against approved use and controls.",
    conditions: "",
    history: [{ action: "Created", changedAt: at }],
    ...over,
  });
}

describe("decision records", () => {
  it("reads records saved before corrections existed", () => {
    const old = governanceDecisionSchema.parse({
      ...decision(),
      corrects: undefined,
      correctionReason: undefined,
    });
    expect(old.corrects).toBeUndefined();
    expect(old.history).toEqual([{ action: "Created", changedAt: at }]);
  });

  it("requires a reason on a correction", () => {
    const parsed = governanceDecisionSchema.safeParse({
      ...decision(),
      corrects: crypto.randomUUID(),
      correctionReason: "  ",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.path).toEqual(["correctionReason"]);
  });
});

describe("recording, correcting and withdrawing", () => {
  it("supersedes the system's current decision and leaves other systems alone", () => {
    const first = decision();
    const other = decision({ system: systemB });
    const next = decision({ outcome: "Paused" });
    const register = recordDecision([first, other], next, later);
    expect(register.map((d) => d.lifecycle)).toEqual(["Current", "Superseded", "Current"]);
    expect(closingEvent(register[1]!)).toEqual({ action: "Superseded", changedAt: later });
    expect(lifecycleLabel(register[1]!)).toBe("Superseded");
  });

  it("closes the corrected record with its reason, even when the system was wrong", () => {
    const wrong = decision({ system: systemB });
    const currentForA = decision();
    const fix = decision({ corrects: wrong.id, correctionReason: "Recorded against B by mistake" });
    const register = recordDecision([wrong, currentForA], fix, later);
    const [, corrected, superseded] = register;
    expect(closingEvent(corrected!)).toEqual({
      action: "Corrected",
      changedAt: later,
      note: "Recorded against B by mistake",
    });
    expect(lifecycleLabel(corrected!)).toBe("Corrected");
    // The correction is now A's current decision, so A's earlier one is superseded as usual.
    expect(closingEvent(superseded!)?.action).toBe("Superseded");
    expect(register.filter((d) => d.lifecycle === "Current")).toEqual([fix]);
  });

  it("withdraws only a current record, and only with a reason", () => {
    const d = decision();
    expect(withdrawDecision(d, " ", later).error).toMatch(/why/);
    expect(withdrawDecision(d, "x".repeat(1001), later).error).toMatch(/1000/);
    const { decision: withdrawn } = withdrawDecision(d, " Entered twice ", later);
    expect(withdrawn).toMatchObject({ lifecycle: "Withdrawn" });
    expect(closingEvent(withdrawn!)).toEqual({
      action: "Withdrawn",
      changedAt: later,
      note: "Entered twice",
    });
    expect(withdrawDecision(withdrawn!, "again", later).error).toMatch(/current/);
  });

  it("spots a correction that changes nothing", () => {
    const d = decision();
    expect(sameRecordedFields(d, { ...d, id: crypto.randomUUID() })).toBe(true);
    expect(sameRecordedFields(d, { ...d, approver: "Chief Risk Officer" })).toBe(false);
    expect(sameRecordedFields(d, { ...d, reviewBy: "2026-12-01" })).toBe(false);
  });

  it("writes event notes into the export history line", () => {
    const { decision: withdrawn } = withdrawDecision(decision(), "Entered twice", later);
    expect(historyText(withdrawn!)).toBe(`Created ${at}; Withdrawn ${later} (Entered twice)`);
  });

  it("leaves the system without a current decision once withdrawn", () => {
    const d = decision();
    const base = { ...initialState(), systems: initialState().systems.slice(0, 1), decisions: [d] };
    const covered = (s: GovernanceState) =>
      buildLifecycleChecklist(s)
        .flatMap((stage) => stage.tasks)
        .find((t) => t.id === "governance-decisions")?.status;
    expect(covered(base)).toBe("complete");
    const ignored = reducer(base, { type: "decision-withdraw", id: d.id, reason: " ", at: later });
    expect(ignored.decisions).toEqual([d]);
    const s = reducer(base, { type: "decision-withdraw", id: d.id, reason: "Wrong", at: later });
    expect(s.decisions[0]?.lifecycle).toBe("Withdrawn");
    expect(covered(s)).not.toBe("complete");
  });
});

describe("evidence exports", () => {
  it.each(["PDF", "DOCX", "XLSX", "PPTX"] as ExportFormat[])(
    "carry corrected and withdrawn records into %s",
    async (format) => {
      const wrong = decision();
      const fix = decision({ approver: "CRO", corrects: wrong.id, correctionReason: "Typo" });
      const register = recordDecision([wrong, decision({ system: systemB })], fix, later);
      register[2] = withdrawDecision(register[2]!, "Entered twice", later).decision!;
      const state = { ...initialState(), decisions: register };
      const report = buildEvidenceReport(
        state,
        "Acme Health",
        "Audit evidence pack",
        later,
        pillarScores(state.answers),
        "Blocked",
      );
      expect(report.decisions.map(lifecycleLabel)).toEqual(["Current", "Corrected", "Withdrawn"]);
      const file = await generateEvidenceFile(report, format);
      expect(file.size).toBeGreaterThan(500);
    },
  );
});

describe("decision register screen", () => {
  afterEach(cleanup);

  function Harness({ start }: { start: GovernanceState }) {
    const [state, dispatch] = useReducer(reducer, start);
    return (
      <GovernanceContext.Provider
        value={{
          state,
          dispatch,
          userId: null,
          workspaceId: null,
          workspaceName: "Demo workspace",
          setWorkspace: () => {},
        }}
      >
        <DecisionsScreen />
      </GovernanceContext.Provider>
    );
  }
  const showing = (value: string) =>
    fireEvent.change(screen.getByLabelText("Filter decisions by lifecycle"), {
      target: { value },
    });
  const card = (text: string) =>
    screen.getByRole("heading", { name: text }).closest("article") as HTMLElement;

  it("corrects a record and keeps the original, marked Corrected", () => {
    render(<Harness start={{ ...initialState(), decisions: [decision()] }} />);
    fireEvent.click(screen.getByRole("button", { name: /Correct this record/ }));
    const form = screen.getByRole("form", { name: `Correct the ${systemA} decision` });

    fireEvent.submit(form);
    expect(within(form).getByRole("alert")).toHaveTextContent(/Say why/);
    fireEvent.change(within(form).getByLabelText(/What was wrong/), {
      target: { value: "Approver recorded wrongly" },
    });
    fireEvent.submit(form);
    expect(within(form).getByRole("alert")).toHaveTextContent(/Nothing has changed/);

    fireEvent.change(within(form).getByLabelText("Accountable approver"), {
      target: { value: "Chief Risk Officer" },
    });
    fireEvent.submit(form);
    expect(screen.getByRole("status")).toHaveTextContent(`Correction saved for ${systemA}`);
    const current = card(systemA);
    expect(within(current).getByText(/Chief Risk Officer/)).toBeTruthy();
    expect(within(current).getByText(/the Approved record for .* decided 2026-10-20/)).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(1);

    showing("Superseded");
    const original = card(systemA);
    expect(
      within(original).getByText("Corrected", { selector: ".decision-lifecycle" }),
    ).toBeTruthy();
    expect(within(original).getByText("Corrected:").parentElement).toHaveTextContent(
      "Approver recorded wrongly",
    );
    expect(within(original).queryByRole("button", { name: /Correct this record/ })).toBeNull();
  });

  it("withdraws a record only after a reason is given, and can back out", () => {
    render(<Harness start={{ ...initialState(), decisions: [decision()] }} />);
    fireEvent.click(screen.getByRole("button", { name: "Withdraw…" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.queryByRole("button", { name: "Confirm withdrawal" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Withdraw…" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Say why/);
    fireEvent.change(screen.getByLabelText("Reason for withdrawing"), {
      target: { value: "Entered twice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm withdrawal" }));
    expect(screen.getByRole("status")).toHaveTextContent(`Decision for ${systemA} withdrawn`);
    expect(screen.queryAllByRole("article")).toHaveLength(0);

    showing("Withdrawn");
    expect(within(card(systemA)).getByText(/Withdrawn:/)).toBeTruthy();
  });
});
