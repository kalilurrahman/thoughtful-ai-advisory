import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PHASES } from "@/data/governance";
import { buildLifecycleChecklist } from "@/features/governance/checklist-model";
import { GovernanceContext } from "@/features/governance/context";
import {
  MANUAL_TAG,
  UNASSIGNED,
  newRoadmapItem,
  validateRoadmapDraft,
} from "@/features/governance/roadmap-model";
import { RoadmapScreen } from "@/features/governance/screens-operations";
import { initialState, reducer, type GovernanceState } from "@/features/governance/store";

// Remediation roadmap: items from gaps and gate blockers, plus items added, edited, moved
// between phases or deleted by hand (src/features/governance/roadmap-model.ts).

const draft = {
  title: "Run a red-team exercise on the claims agent",
  owner: "",
  effort: "High",
  phase: 3,
};

describe("roadmap item rules", () => {
  it("accepts a complete item and files an empty owner as Unassigned", () => {
    expect(validateRoadmapDraft(draft).fields).toEqual({
      title: "Run a red-team exercise on the claims agent",
      owner: UNASSIGNED,
      effort: "High",
      phase: 3,
    });
  });

  it("refuses a missing action, an unknown effort or a phase outside the plan", () => {
    expect(validateRoadmapDraft({ ...draft, title: "  " }).error).toMatch(/Describe/);
    expect(validateRoadmapDraft({ ...draft, title: "x".repeat(201) }).error).toMatch(/200/);
    expect(validateRoadmapDraft({ ...draft, effort: "Huge" }).error).toMatch(/effort/);
    expect(validateRoadmapDraft({ ...draft, phase: PHASES.length }).error).toMatch(/phase/);
    expect(validateRoadmapDraft({ ...draft, phase: -1 }).error).toMatch(/phase/);
  });

  it("gives hand-made items their own keys and tag, open", () => {
    const item = newRoadmapItem(validateRoadmapDraft(draft).fields!, "abc");
    expect(item).toMatchObject({ key: "item-abc", tag: MANUAL_TAG, done: false, phase: 3 });
  });
});

describe("roadmap store actions", () => {
  const added = (s: GovernanceState) =>
    reducer(s, {
      type: "roadmap-add",
      item: newRoadmapItem(validateRoadmapDraft(draft).fields!, "abc"),
    });

  it("adds, edits, moves and deletes items", () => {
    const start = initialState();
    let s = added(start);
    expect(s.roadmap).toHaveLength(start.roadmap.length + 1);
    expect(added(s).roadmap).toHaveLength(s.roadmap.length); // same key twice: no duplicate
    s = reducer(s, {
      type: "roadmap-edit",
      key: "item-abc",
      fields: {
        title: "Red-team the claims agent",
        owner: "AI Risk Lead",
        effort: "Medium",
        phase: 1,
      },
    });
    expect(s.roadmap.find((i) => i.key === "item-abc")).toMatchObject({
      title: "Red-team the claims agent",
      owner: "AI Risk Lead",
      phase: 1,
      tag: MANUAL_TAG,
    });
    s = reducer(s, { type: "roadmap-delete", key: "item-abc" });
    expect(s.roadmap.some((i) => i.key === "item-abc")).toBe(false);
  });

  it("keeps the checklist asking for an owner until one is assigned", () => {
    const base = { ...initialState(), roadmap: [] };
    const owners = (s: GovernanceState) =>
      buildLifecycleChecklist(s)
        .flatMap((stage) => stage.tasks)
        .find((t) => t.id === "roadmap-owners")?.status;
    let s = added(base);
    expect(owners(s)).toBe("action");
    s = reducer(s, {
      type: "roadmap-edit",
      key: "item-abc",
      fields: { ...validateRoadmapDraft(draft).fields!, owner: "AI Risk Lead" },
    });
    expect(owners(s)).toBe("complete");
  });
});

describe("roadmap screen", () => {
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
        <RoadmapScreen />
      </GovernanceContext.Provider>
    );
  }

  const phaseSection = (name: string) =>
    screen.getByRole("heading", { name }).closest("section") as HTMLElement;

  it("adds an item to the chosen phase, including the last one", () => {
    render(<Harness start={{ ...initialState(), roadmap: [] }} />);
    const form = screen.getByRole("button", { name: "Add to roadmap" }).closest("form")!;
    fireEvent.submit(form);
    expect(within(form).getByRole("alert")).toHaveTextContent("Describe the remediation action.");
    fireEvent.change(within(form).getByLabelText("Remediation action"), {
      target: { value: "Annual independent assurance review" },
    });
    fireEvent.change(within(form).getByLabelText("Phase"), { target: { value: "3" } });
    fireEvent.submit(form);
    const last = PHASES[PHASES.length - 1]!.name;
    expect(
      within(phaseSection(last)).getByText("Annual independent assurance review"),
    ).toBeTruthy();
    expect(within(phaseSection(last)).getByText(/Unassigned · Medium effort/)).toBeTruthy();
    expect(within(form).getByLabelText("Remediation action")).toHaveValue("");
  });

  it("reassigns and moves an item, and deletes it only after confirming", () => {
    const start = added({ ...initialState(), roadmap: [] });
    render(<Harness start={start} />);
    fireEvent.click(screen.getByRole("button", { name: `Edit "${draft.title}"` }));
    const editForm = screen.getByRole("button", { name: "Save changes" }).closest("form")!;
    fireEvent.change(within(editForm).getByLabelText("Accountable owner"), {
      target: { value: "AI Risk Lead" },
    });
    fireEvent.change(within(editForm).getByLabelText("Phase"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      within(phaseSection(PHASES[0]!.name)).getByText(/AI Risk Lead · High effort/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: `Edit "${draft.title}"` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete item…" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete item…" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(screen.queryByText(draft.title)).toBeNull();
  });

  function added(s: GovernanceState) {
    return reducer(s, {
      type: "roadmap-add",
      item: newRoadmapItem(validateRoadmapDraft(draft).fields!, "abc"),
    });
  }
});
