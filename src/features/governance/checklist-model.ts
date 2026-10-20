import { CONTROLS } from "@/data/governance";
import type { GovernanceState } from "./store";
import { gateStatus, guardrailCoverage, pillarScores } from "./model";
import { monitoringState } from "./monitoring-model";

export type ChecklistTask = {
  id: string;
  title: string;
  detail: string;
  href:
    | "/inventory"
    | "/assess"
    | "/guardrails"
    | "/gates"
    | "/roadmap"
    | "/incidents"
    | "/decisions"
    | "/changes"
    | "/monitoring";
  action: string;
  status: "complete" | "action" | "not-applicable";
  progress: string;
};

export type ChecklistPhase = { id: string; title: string; tasks: ChecklistTask[] };

const filled = (value: string, placeholder: string) => value.trim() !== "" && value !== placeholder;

export function buildLifecycleChecklist(state: GovernanceState): ChecklistPhase[] {
  const systems = state.systems;
  const criticalControls = CONTROLS.filter((control) => control.w === "Critical");
  const verifiedCritical = criticalControls.filter(
    (control) => state.answers[control.id]?.e === 3,
  ).length;
  const coverage = guardrailCoverage(state.gr, state.tier);
  const gate = gateStatus(pillarScores(state.answers), state.tier);
  const activeIncidents = state.incidents.filter(
    (incident) => incident.status !== "Resolved" && incident.status !== "Closed",
  );
  const assignedRoadmap = state.roadmap.filter(
    (item) => !item.done && filled(item.owner, "Unassigned"),
  );
  const currentDecisions = state.decisions.filter((decision) => decision.lifecycle === "Current");
  const systemsWithCurrentDecision = systems.filter((system) =>
    currentDecisions.some((decision) => decision.system === system.name),
  ).length;
  const reviewOverdue = currentDecisions.filter(
    (decision) =>
      decision.reviewBy !== null && decision.reviewBy < new Date().toISOString().slice(0, 10),
  ).length;
  const pendingChangeReviews = state.changeReviews.filter((review) =>
    ["Pending review", "Changes requested"].includes(review.status),
  );
  const implementationWithoutApproval = state.changeReviews.filter(
    (review) =>
      review.status === "Implemented" &&
      !review.history.some((event) => event.status === "Approved"),
  );
  const dueMonitoringPlans = state.monitoringPlans.filter(
    (plan) => plan.status === "Active" && plan.nextDue < new Date().toISOString().slice(0, 10),
  );
  const deployedSystems = systems.filter(
    (system) => system.status === "Approved" || system.status === "Approved with limits",
  );
  const monitoredSystems = deployedSystems.filter((system) =>
    state.monitoringPlans.some((plan) => plan.system === system.name && plan.status === "Active"),
  );
  const monitoringBreaches = state.monitoringPlans.filter(
    (plan) => monitoringState(plan) === "Breach",
  ).length;
  const monitoringNeedsFirstReading = state.monitoringPlans.filter(
    (plan) => plan.status === "Active" && monitoringState(plan) === "Not yet measured",
  ).length;

  return [
    {
      id: "map",
      title: "Map and register",
      tasks: [
        {
          id: "inventory",
          title: "Register the AI systems in scope",
          detail: "Maintain a current inventory before assessing or approving use.",
          href: "/inventory",
          action: "Open inventory",
          status: systems.length > 0 ? "complete" : "action",
          progress: `${systems.length} system${systems.length === 1 ? "" : "s"} registered`,
        },
        {
          id: "profiles",
          title: "Complete each system profile",
          detail:
            "Check system type, accountable owner, supplier and data classification are recorded.",
          href: "/inventory",
          action: "Review profiles",
          status:
            systems.length > 0 &&
            systems.every(
              (system) =>
                filled(system.kind, "Registered system") &&
                filled(system.owner, "Unassigned") &&
                filled(system.vendor, "Not specified") &&
                filled(system.data, "Not specified"),
            )
              ? "complete"
              : "action",
          progress: `${
            systems.filter(
              (system) =>
                filled(system.kind, "Registered system") &&
                filled(system.owner, "Unassigned") &&
                filled(system.vendor, "Not specified") &&
                filled(system.data, "Not specified"),
            ).length
          } of ${systems.length} profiles complete`,
        },
        {
          id: "disposition",
          title: "Record a governance disposition for each system",
          detail:
            "Resolve systems still under review; an approval status is not a legal classification.",
          href: "/inventory",
          action: "Review dispositions",
          status:
            systems.length > 0 && systems.every((system) => system.status !== "Under review")
              ? "complete"
              : "action",
          progress: `${systems.filter((system) => system.status !== "Under review").length} of ${systems.length} dispositions recorded`,
        },
        {
          id: "governance-decisions",
          title: "Record an accountable use decision for each AI system",
          detail:
            "Capture the approver, rationale and conditions; new decisions supersede rather than erase earlier records.",
          href: "/decisions",
          action: "Review decisions",
          status:
            systems.length > 0 && systemsWithCurrentDecision === systems.length
              ? "complete"
              : "action",
          progress: `${systemsWithCurrentDecision} of ${systems.length} systems have a current governance decision`,
        },
        {
          id: "decision-reviews",
          title: "Review due or expired risk decisions",
          detail:
            "Risk acceptance and conditional approvals require a review date; reassess decisions when conditions or system use change.",
          href: "/decisions",
          action: "Review due decisions",
          status:
            currentDecisions.length === 0
              ? "not-applicable"
              : reviewOverdue > 0
                ? "action"
                : "complete",
          progress:
            currentDecisions.length === 0
              ? "No current decisions recorded"
              : reviewOverdue === 0
                ? "No current decisions are past their review date"
                : `${reviewOverdue} current decision${reviewOverdue === 1 ? "" : "s"} past review date`,
        },
        {
          id: "change-reviews",
          title: "Review material AI-system changes before implementation",
          detail:
            "Assess changes to purpose, data, model/provider, autonomy, affected people and controls; implementation must follow an approval record.",
          href: "/changes",
          action: "Review change requests",
          status:
            pendingChangeReviews.length > 0 || implementationWithoutApproval.length > 0
              ? "action"
              : state.changeReviews.length === 0
                ? "not-applicable"
                : "complete",
          progress:
            pendingChangeReviews.length > 0
              ? `${pendingChangeReviews.length} change review${pendingChangeReviews.length === 1 ? "" : "s"} need reviewer action`
              : implementationWithoutApproval.length > 0
                ? `${implementationWithoutApproval.length} implementation record${implementationWithoutApproval.length === 1 ? "" : "s"} lack approval history`
                : state.changeReviews.length === 0
                  ? "No material changes submitted"
                  : "No pending change reviews",
        },
        {
          id: "operational-monitoring",
          title: "Maintain monitoring for deployed AI systems",
          detail:
            "Keep an owner, measurable signal, threshold and review cadence; investigate overdue checks and threshold breaches.",
          href: "/monitoring",
          action: "Review monitoring plans",
          status:
            deployedSystems.length === 0
              ? "not-applicable"
              : monitoredSystems.length < deployedSystems.length || dueMonitoringPlans.length > 0
                ? "action"
                : monitoringBreaches > 0 || monitoringNeedsFirstReading > 0
                  ? "action"
                  : "complete",
          progress:
            deployedSystems.length === 0
              ? "No systems marked approved for deployment"
              : `${monitoredSystems.length} of ${deployedSystems.length} deployed systems have active plans; ${dueMonitoringPlans.length} overdue, ${monitoringBreaches} latest threshold breaches, ${monitoringNeedsFirstReading} active plans awaiting a first reading`,
        },
      ],
    },
    {
      id: "assess",
      title: "Assess and treat",
      tasks: [
        {
          id: "evidence",
          title: "Verify evidence for critical governance controls",
          detail:
            "Only mark evidence verified when it has been reviewed and supports the control claim.",
          href: "/assess",
          action: "Review assessment",
          status: verifiedCritical === criticalControls.length ? "complete" : "action",
          progress: `${verifiedCritical} of ${criticalControls.length} critical controls verified`,
        },
        {
          id: "guardrails",
          title: "Configure guardrails for the workspace risk tier",
          detail: "Coverage is calculated at workspace level for the currently selected tier.",
          href: "/guardrails",
          action: "Configure guardrails",
          status: coverage.percent === 100 ? "complete" : "action",
          progress: `${coverage.enabled} of ${coverage.required} required controls enabled (${coverage.percent}%)`,
        },
        {
          id: "gate",
          title: "Meet the workspace release-readiness gate",
          detail: "The gate reflects the workspace assessment, not an individual system score.",
          href: "/gates",
          action: "Review release gate",
          status: gate === "Cleared" ? "complete" : "action",
          progress: `Workspace gate: ${gate}`,
        },
      ],
    },
    {
      id: "operate",
      title: "Operate and improve",
      tasks: [
        {
          id: "roadmap-owners",
          title: "Assign owners to open remediation actions",
          detail: "Every open roadmap item should have a named accountable owner.",
          href: "/roadmap",
          action: "Review roadmap",
          status: assignedRoadmap.length === 0 ? "complete" : "action",
          progress: `${state.roadmap.filter((item) => !item.done).length - assignedRoadmap.length} of ${state.roadmap.filter((item) => !item.done).length} open actions assigned`,
        },
        {
          id: "incident-triage",
          title: "Triage and assign all recorded incidents",
          detail: "Route each logged incident, assign an owner and track it through closure.",
          href: "/incidents",
          action: "Open incident register",
          status:
            activeIncidents.length === 0
              ? "not-applicable"
              : activeIncidents.every(
                    (incident) => incident.status !== "Open" && filled(incident.owner, ""),
                  )
                ? "complete"
                : "action",
          progress:
            activeIncidents.length === 0
              ? "No active incidents recorded"
              : `${activeIncidents.filter((incident) => incident.status !== "Open" && filled(incident.owner, "")).length} of ${activeIncidents.length} active incidents triaged and assigned`,
        },
      ],
    },
  ];
}

export function checklistProgress(phases: ChecklistPhase[]) {
  const tasks = phases
    .flatMap((phase) => phase.tasks)
    .filter((task) => task.status !== "not-applicable");
  const complete = tasks.filter((task) => task.status === "complete").length;
  return {
    complete,
    total: tasks.length,
    percent: tasks.length ? Math.round((complete / tasks.length) * 100) : 0,
  };
}
