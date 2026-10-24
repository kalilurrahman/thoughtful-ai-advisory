import { CORRECTION_REASON_MAX, type GovernanceDecision } from "./decision-schema";

// How the decision register changes (src/features/governance/screens-decisions.tsx). Records are
// never edited or deleted in place, so the register stays an audit trail:
// - a new decision for a system supersedes that system's current decision;
// - correcting a record that was entered wrongly adds a new current record that names it
//   (`corrects`), and closes the old one with a "Corrected" event carrying the reason;
// - withdrawing a record made in error closes it with a "Withdrawn" event and no replacement.

type DecisionEvent = GovernanceDecision["history"][number];

const close = (
  decision: GovernanceDecision,
  lifecycle: "Superseded" | "Withdrawn",
  event: DecisionEvent,
): GovernanceDecision => ({ ...decision, lifecycle, history: [...decision.history, event] });

/** The register with `incoming` added first and the records it replaces closed. */
export function recordDecision(
  decisions: GovernanceDecision[],
  incoming: GovernanceDecision,
  at: string,
): GovernanceDecision[] {
  return [
    incoming,
    ...decisions.map((decision) => {
      if (decision.lifecycle !== "Current") return decision;
      if (incoming.corrects && decision.id === incoming.corrects)
        return close(decision, "Superseded", {
          action: "Corrected",
          changedAt: at,
          note: incoming.correctionReason,
        });
      if (decision.system === incoming.system)
        return close(decision, "Superseded", { action: "Superseded", changedAt: at });
      return decision;
    }),
  ];
}

/** Close a current record made in error, keeping the reason; or say why it cannot be. */
export function withdrawDecision(
  decision: GovernanceDecision,
  reason: string,
  at: string,
): { decision: GovernanceDecision; error?: undefined } | { decision?: undefined; error: string } {
  if (decision.lifecycle !== "Current")
    return { error: "Only a current decision can be withdrawn." };
  const note = reason.trim();
  if (!note) return { error: "Say why this decision is being withdrawn." };
  if (note.length > CORRECTION_REASON_MAX)
    return { error: `Keep the reason to ${CORRECTION_REASON_MAX} characters or fewer.` };
  return { decision: close(decision, "Withdrawn", { action: "Withdrawn", changedAt: at, note }) };
}

const RECORDED_FIELDS = [
  "system",
  "outcome",
  "decidedAt",
  "reviewBy",
  "approver",
  "rationale",
  "conditions",
] as const;

/** True when a correction would record exactly what the original already says. */
export function sameRecordedFields(a: GovernanceDecision, b: GovernanceDecision) {
  return RECORDED_FIELDS.every((field) => (a[field] ?? null) === (b[field] ?? null));
}

/** The event that closed a record (Corrected, Withdrawn or Superseded), if any. */
export function closingEvent(decision: GovernanceDecision): DecisionEvent | undefined {
  return decision.lifecycle === "Current" ? undefined : decision.history.at(-1);
}

/** Badge text: "Corrected" reads better than "Superseded" for a record that was wrong. */
export function lifecycleLabel(decision: GovernanceDecision) {
  return closingEvent(decision)?.action === "Corrected" ? "Corrected" : decision.lifecycle;
}

/** One line per record for the evidence exports. */
export function historyText(decision: GovernanceDecision) {
  return decision.history
    .map((event) => `${event.action} ${event.changedAt}${event.note ? ` (${event.note})` : ""}`)
    .join("; ");
}
