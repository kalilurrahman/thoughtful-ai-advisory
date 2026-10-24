import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GovernanceContext } from "@/features/governance/context";
import {
  correctiveActionState,
  transitionCorrectiveAction,
} from "@/features/governance/actions-model";
import type { CorrectiveAction } from "@/features/governance/actions-schema";
import { ActionsScreen } from "@/features/governance/screens-actions";
import { initialState } from "@/features/governance/store";

// Corrective actions: Open → In progress → Pending verification → Closed (verified), with
// return-to-work and cancellation (src/features/governance/actions-model.ts).

const AT = "2026-10-24T10:00:00.000Z";
const base: CorrectiveAction = {
  id: "5a0c1f7e-3b8d-4f43-9d7e-2c1b6a4e8f10",
  title: "Add output filtering to the support assistant",
  description: "Block account numbers in generated replies.",
  system: "Support assistant",
  source: "Incident",
  sourceReference: "INC-12",
  priority: "High",
  owner: "Platform lead",
  dueDate: "2026-11-15",
  status: "Open",
  createdAt: AT,
  updatedAt: AT,
  completionEvidence: "",
  verificationNote: "",
  verifiedBy: "",
  verifiedAt: null,
  history: [{ status: "Open", changedAt: AT, actor: "Risk lead", note: "" }],
};
const as = (patch: Partial<CorrectiveAction>): CorrectiveAction => ({ ...base, ...patch });
const move = (a: CorrectiveAction, status: CorrectiveAction["status"], note = "") =>
  transitionCorrectiveAction(a, status, "Reviewer", note, "2026-10-25T09:00:00.000Z");

describe("corrective action lifecycle", () => {
  it("runs from open to verified closure, recording who verified and when", () => {
    const started = move(base, "In progress").action!;
    expect(started.status).toBe("In progress");
    const submitted = move(
      as({ ...started, completionEvidence: "PR-481" }),
      "Pending verification",
    ).action!;
    const closed = move(
      submitted,
      "Closed",
      "Replayed 50 transcripts; no account numbers.",
    ).action!;
    expect(closed).toMatchObject({
      status: "Closed",
      verifiedBy: "Reviewer",
      verifiedAt: "2026-10-25T09:00:00.000Z",
      verificationNote: "Replayed 50 transcripts; no account numbers.",
    });
    expect(closed.history.map((h) => h.status)).toEqual([
      "Open",
      "In progress",
      "Pending verification",
      "Closed",
    ]);
  });

  it("refuses moves that skip evidence or verification", () => {
    expect(move(base, "Pending verification").error).toMatch(/in-progress/);
    expect(move(as({ status: "In progress" }), "Pending verification").error).toMatch(
      /completion evidence/,
    );
    expect(move(as({ status: "In progress" }), "Closed").error).toMatch(/verified/);
    expect(move(as({ status: "Pending verification" }), "Closed").error).toMatch(/finding/);
    expect(move(base, "Open").error).toMatch(/different status/);
    expect(move(as({ status: "Pending verification" }), "Open").error).toMatch(/open queue/);
  });

  it("lets verification send work back, but never reopens closed or cancelled actions", () => {
    const back = move(as({ status: "Pending verification" }), "In progress", "Still leaking");
    expect(back.action?.status).toBe("In progress");
    expect(move(as({ status: "Closed" }), "In progress").error).toMatch(/cannot be changed/);
    expect(move(as({ status: "Cancelled" }), "Open").error).toMatch(/cannot be changed/);
  });

  it("cancels only with a recorded reason", () => {
    expect(move(base, "Cancelled").error).toMatch(/why the action is being cancelled/);
    const cancelled = move(base, "Cancelled", "Superseded by AC-7").action!;
    expect(cancelled.status).toBe("Cancelled");
    expect(cancelled.history.at(-1)).toMatchObject({
      status: "Cancelled",
      note: "Superseded by AC-7",
    });
  });

  it("labels each action's stage, with overdue work flagged", () => {
    expect(correctiveActionState(base, "2026-10-24")).toBe("Open");
    expect(correctiveActionState(base, "2026-12-01")).toBe("Overdue");
    expect(correctiveActionState(as({ status: "Pending verification" }), "2026-12-01")).toBe(
      "Needs verification",
    );
    expect(correctiveActionState(as({ status: "Closed" }), "2026-12-01")).toBe("Verified closed");
    expect(correctiveActionState(as({ status: "Cancelled" }), "2026-12-01")).toBe("Cancelled");
  });
});

describe("corrective actions screen", () => {
  afterEach(cleanup);

  function renderActions(actions: CorrectiveAction[]) {
    const dispatch = vi.fn();
    render(
      <GovernanceContext.Provider
        value={{
          state: { ...initialState(), correctiveActions: actions },
          dispatch,
          userId: null,
          workspaceId: null,
          workspaceName: "Demo workspace",
          setWorkspace: vi.fn(),
        }}
      >
        <ActionsScreen />
      </GovernanceContext.Provider>,
    );
    const transitions = () =>
      dispatch.mock.calls
        .map(([a]) => a as { type: string; status?: string; note?: string })
        .filter((a) => a.type === "transition-corrective-action");
    return { dispatch, transitions };
  }

  it("says why a submission is refused instead of doing nothing", () => {
    const { transitions } = renderActions([as({ status: "In progress" })]);
    fireEvent.click(screen.getByRole("button", { name: "Submit for verification" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/completion evidence/);
    expect(transitions()).toEqual([]);
  });

  it("submits for verification with the evidence reference", () => {
    const { dispatch, transitions } = renderActions([as({ status: "In progress" })]);
    fireEvent.change(screen.getByPlaceholderText("Records-system link or evidence ID"), {
      target: { value: "PR-481" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit for verification" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "edit-corrective-evidence", evidence: "PR-481" }),
    );
    expect(transitions()).toEqual([expect.objectContaining({ status: "Pending verification" })]);
  });

  it("cancels an action only after a reason is given", () => {
    const { transitions } = renderActions([base]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel action…" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/why the action is being cancelled/);
    expect(transitions()).toEqual([]);
    fireEvent.change(screen.getByLabelText("Reason for cancelling"), {
      target: { value: "Superseded by AC-7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(transitions()).toEqual([
      expect.objectContaining({ status: "Cancelled", note: "Superseded by AC-7" }),
    ]);
  });

  it("lets the user back out of cancelling", () => {
    const { transitions } = renderActions([base]);
    fireEvent.click(screen.getByRole("button", { name: "Cancel action…" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep the action" }));
    expect(screen.queryByLabelText("Reason for cancelling")).toBeNull();
    expect(transitions()).toEqual([]);
  });
});
