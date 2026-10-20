import type { ChangeReview, ChangeStatus } from "./change-schema";

const escalationLevels = new Set(["High", "Critical"]);

export function evaluateChangeReview(review: Pick<ChangeReview, "categories" | "impacts">) {
  const highImpactAreas = Object.entries(review.impacts)
    .filter(([, level]) => escalationLevels.has(level))
    .map(([area]) => area);
  const notAssessed = Object.values(review.impacts).filter(
    (level) => level === "Not assessed",
  ).length;
  return {
    reviewRequired: review.categories.length > 0 || highImpactAreas.length > 0 || notAssessed > 0,
    highImpactAreas,
    notAssessed,
    recommendation:
      highImpactAreas.length > 0
        ? "Escalate for accountable governance review before implementation."
        : notAssessed > 0
          ? "Complete impact ratings before deciding whether the existing approval remains valid."
          : "Confirm whether the current governance decision and controls still apply before implementation.",
  };
}

export function transitionChangeReview(
  review: ChangeReview,
  status: ChangeStatus,
  actor: string,
  note: string,
  changedAt: string,
): { review?: ChangeReview; error?: string } {
  if (!actor.trim()) return { error: "Record the reviewer or accountable actor." };
  if (!note.trim()) return { error: "Record the rationale for this workflow transition." };
  if (review.status === "Rejected" || review.status === "Implemented") {
    return { error: "This change review is closed; create a new review for further changes." };
  }
  if (review.status === status) return { error: "Choose a different workflow outcome." };
  if (status === "Implemented" && review.status !== "Approved") {
    return { error: "A change must be approved before it can be marked implemented." };
  }
  if (status === "Approved") {
    const evaluation = evaluateChangeReview(review);
    if (evaluation.notAssessed > 0)
      return { error: "Complete all impact ratings before approval." };
  }
  const next: ChangeReview = {
    ...review,
    status,
    reviewer: actor.trim(),
    decisionRationale: note.trim(),
    decidedAt: changedAt,
    history: [...review.history, { status, actor: actor.trim(), note: note.trim(), changedAt }],
  };
  return { review: next };
}
