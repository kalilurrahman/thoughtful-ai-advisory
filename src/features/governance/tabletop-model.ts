export type TabletopStep = { id: string; prompt: string; choices: [string, string, string]; best: number; feedback: string };
export const INCIDENT_TABLETOP: TabletopStep[] = [
  { id: "contain", prompt: "A production AI assistant starts exposing snippets from another customer's records. What is your first move?", choices: ["Use the incident runbook to contain exposure and protect people while preserving evidence", "Delete logs and restart the service", "Wait for the vendor's monthly report"], best: 0, feedback: "Containment should reduce ongoing harm while preserving records needed to understand scope and cause." },
  { id: "escalate", prompt: "The incident may involve personal data and multiple customer tenants. What next?", choices: ["Notify the designated incident, privacy, security, and business owners; assess applicable notification duties", "Send an unverified public statement", "Keep it within the engineering team"], best: 0, feedback: "Use pre-assigned roles and jurisdiction-specific escalation criteria; do not assume one notification rule fits all." },
  { id: "restore", prompt: "A workaround is ready, but the root cause is not confirmed. What is a safe recovery gate?", choices: ["Require documented risk review, testing, authorized approval, and heightened monitoring before resuming", "Restore immediately to meet uptime targets", "Close the incident once the patch deploys"], best: 0, feedback: "Recovery needs validation and accountable approval; monitor for recurrence and record lessons learned." },
];
export function tabletopResult(answers: Record<string, number>) {
  const completed = INCIDENT_TABLETOP.filter((step) => answers[step.id] !== undefined);
  return { answered: completed.length, bestChoices: completed.filter((step) => answers[step.id] === step.best).length, finished: completed.length === INCIDENT_TABLETOP.length };
}
