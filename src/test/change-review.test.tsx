import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GovernanceContext } from "@/features/governance/context";
import { ChangesScreen } from "@/features/governance/screens-changes";
import { initialState } from "@/features/governance/store";
import { changeReviewSchema, impactAreas } from "@/features/governance/change-schema";
import {
  evaluateChangeReview,
  transitionChangeReview,
} from "@/features/governance/change-review-model";

const createReview = () =>
  changeReviewSchema.parse({
    id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
    system: "Clinical summarizer",
    categories: ["Model or AI provider"],
    summary: "Upgrade the underlying model version.",
    requestedBy: "Product owner",
    submittedAt: "2026-10-20T12:00:00.000Z",
    impacts: Object.fromEntries(impactAreas.map((area) => [area, "Low"])),
    impactRationale: "Regression and privacy tests reviewed.",
    history: [
      {
        status: "Pending review",
        actor: "Product owner",
        note: "Submitted",
        changedAt: "2026-10-20T12:00:00.000Z",
      },
    ],
  });

describe("AI material change review workflow", () => {
  it("flags material changes and high/critical impact areas for review", () => {
    const review = createReview();
    expect(evaluateChangeReview(review).reviewRequired).toBe(true);
    expect(
      evaluateChangeReview({ ...review, impacts: { ...review.impacts, Safety: "Critical" } })
        .highImpactAreas,
    ).toContain("Safety");
  });

  it("requires reviewer, rationale and completed impact ratings before approval", () => {
    const review = changeReviewSchema.parse({
      ...createReview(),
      impacts: { ...createReview().impacts, Privacy: "Not assessed" },
    });
    expect(
      transitionChangeReview(
        review,
        "Approved",
        "Reviewer",
        "Looks good",
        "2026-10-20T13:00:00.000Z",
      ).error,
    ).toContain("impact ratings");
    expect(
      transitionChangeReview(
        review,
        "Changes requested",
        "",
        "Need evidence",
        "2026-10-20T13:00:00.000Z",
      ).error,
    ).toContain("reviewer");
  });

  it("rejects duplicate change areas and target dates before submission", () => {
    const review = createReview();
    expect(
      changeReviewSchema.safeParse({
        ...review,
        categories: ["Model or AI provider", "Model or AI provider"],
      }).success,
    ).toBe(false);
    expect(changeReviewSchema.safeParse({ ...review, targetDate: "2026-10-19" }).success).toBe(
      false,
    );
  });

  it("prevents implementation before approval and records an auditable approval-to-implementation chain", () => {
    const review = createReview();
    expect(
      transitionChangeReview(review, "Implemented", "Owner", "Done", "2026-10-20T13:00:00.000Z")
        .error,
    ).toContain("approved");
    const approved = transitionChangeReview(
      review,
      "Approved",
      "Risk lead",
      "Reviewed test evidence.",
      "2026-10-20T13:00:00.000Z",
    ).review;
    expect(approved?.history.at(-1)?.actor).toBe("Risk lead");
    const implemented = transitionChangeReview(
      approved!,
      "Implemented",
      "Owner",
      "Released under change ticket 42.",
      "2026-10-21T13:00:00.000Z",
    ).review;
    expect(implemented?.history.map((event) => event.status)).toEqual([
      "Pending review",
      "Approved",
      "Implemented",
    ]);
    expect(
      transitionChangeReview(
        implemented!,
        "Approved",
        "Risk lead",
        "Duplicate",
        "2026-10-22T13:00:00.000Z",
      ).error,
    ).toContain("closed");
  });
});

describe("change review screen", () => {
  afterEach(cleanup);

  function renderChanges(review: ReturnType<typeof createReview>) {
    const dispatch = vi.fn();
    render(
      <GovernanceContext.Provider
        value={{
          state: { ...initialState(), changeReviews: [review] },
          dispatch,
          userId: null,
          workspaceId: null,
          workspaceName: "Demo workspace",
          setWorkspace: vi.fn(),
        }}
      >
        <ChangesScreen />
      </GovernanceContext.Provider>,
    );
    return dispatch;
  }

  function recordOutcome(actor: string, note: string) {
    fireEvent.change(screen.getByLabelText("Reviewer / accountable role"), {
      target: { value: actor },
    });
    fireEvent.change(screen.getByLabelText("Decision rationale / conditions"), {
      target: { value: note },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save review outcome" }));
  }

  it("says why an approval is refused instead of silently keeping the review open", () => {
    const review = createReview();
    review.impacts[impactAreas[0]!] = "Not assessed";
    const dispatch = renderChanges(review);
    recordOutcome("AI Risk Lead", "Approve the upgrade.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Complete all impact ratings before approval.",
    );
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("records a permitted outcome", () => {
    const dispatch = renderChanges(createReview());
    recordOutcome("AI Risk Lead", "Approved with regression monitoring for 30 days.");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "transition-change-review",
        status: "Approved",
        actor: "AI Risk Lead",
      }),
    );
  });
});
