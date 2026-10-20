import type { CorrectiveAction } from "./actions-schema";

export type ActionTransition = {
  action: CorrectiveAction;
  error?: undefined;
} | {
  action?: undefined;
  error: string;
};

export function transitionCorrectiveAction(
  action: CorrectiveAction,
  status: CorrectiveAction["status"],
  actor: string,
  note: string,
  changedAt: string,
): ActionTransition {
  if (action.status === "Closed" || action.status === "Cancelled")
    return { error: "Closed or cancelled actions cannot be changed." };
  if (status === action.status) return { error: "Choose a different status." };
  if (status === "Pending verification" && action.status !== "In progress")
    return { error: "Only in-progress work can be submitted for verification." };
  if (status === "Pending verification" && !action.completionEvidence.trim())
    return { error: "Record completion evidence before requesting verification." };
  if (status === "Closed" && action.status !== "Pending verification")
    return { error: "An action must be independently verified before closure." };
  if (status === "Closed" && !note.trim())
    return { error: "Record the verifier's effectiveness finding before closure." };
  if (status === "Open" && action.status !== "In progress")
    return { error: "Only in-progress work can be returned to the open queue." };
  const verified = status === "Closed";
  return {
    action: {
      ...action,
      status,
      updatedAt: changedAt,
      ...(verified ? { verifiedBy: actor.trim(), verifiedAt: changedAt, verificationNote: note.trim() } : {}),
      history: [...action.history, { status, changedAt, actor: actor.trim(), note: note.trim() }],
    },
  };
}

export function correctiveActionState(action: CorrectiveAction, today: string) {
  if (action.status === "Closed") return "Verified closed";
  if (action.status === "Cancelled") return "Cancelled";
  if (action.status === "Pending verification") return "Needs verification";
  if (action.dueDate < today) return "Overdue";
  return action.status;
}
