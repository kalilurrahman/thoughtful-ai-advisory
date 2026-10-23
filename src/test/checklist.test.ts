import { describe, expect, it } from "vitest";
import { CONTROLS } from "@/data/governance";
import { buildLifecycleChecklist, checklistProgress } from "@/features/governance/checklist-model";
import { initialState, type AIIncident } from "@/features/governance/store";

const allTasks = (state: ReturnType<typeof initialState>) =>
  buildLifecycleChecklist(state).flatMap((phase) => phase.tasks);

describe("workspace lifecycle checklist", () => {
  it("checks inventory profile completeness without creating per-system scores", () => {
    const state = initialState();
    const system = state.systems[0];
    if (!system) throw new Error("Seed system missing");
    state.systems[0] = { ...system, owner: "Unassigned", vendor: "Not specified" };

    const tasks = allTasks(state);
    expect(tasks.find((task) => task.id === "profiles")).toMatchObject({
      status: "action",
      progress: "5 of 6 profiles complete",
    });
    expect(tasks.find((task) => task.id === "inventory")?.status).toBe("complete");
    expect(tasks.some((task) => task.id.includes("system-score"))).toBe(false);
  });

  it("requires a saved preliminary use-case triage for every system", () => {
    const state = initialState();
    expect(allTasks(state).find((task) => task.id === "use-case-risk-triage")).toMatchObject({
      status: "action",
      progress: "0 of 6 systems triaged",
    });
    state.systems = state.systems.map((system) => ({
      ...system,
      riskTriage: {
        profile: { name: system.name },
        result: {
          tier: "Low",
          score: 0,
          provisional: true,
          factors: [],
          triggers: [],
          missing_fields: [],
          clarifying_questions: [],
          required_modules: ["core"],
          approval_authority: "Product Owner with AI CoE review",
          review_cadence_months: 24,
          evidence_status: "Inferred",
          requires_human_confirmation: true,
          rationale: "Inferred; reviewer confirmation required.",
          citations: [],
          citation_ids: [],
          method: "AEGIS risk-tier rules v1.0",
        },
        assessedAt: "2026-10-23T00:00:00.000Z",
      },
    }));
    expect(allTasks(state).find((task) => task.id === "use-case-risk-triage")?.status).toBe(
      "complete",
    );
  });

  it("derives verified critical evidence, guardrail coverage and the workspace gate", () => {
    const state = initialState();
    for (const control of CONTROLS) state.answers[control.id] = { s: 4, e: 3 };
    state.gr = Object.fromEntries(Object.keys(state.gr).map((name) => [name, true]));

    const tasks = allTasks(state);
    expect(tasks.find((task) => task.id === "evidence")?.status).toBe("complete");
    expect(tasks.find((task) => task.id === "guardrails")?.status).toBe("complete");
    expect(tasks.find((task) => task.id === "gate")?.progress).toBe("Workspace gate: Cleared");
  });

  it("flags untriaged incidents and excludes an empty incident register from progress", () => {
    const state = initialState();
    const noIncidents = allTasks(state).find((task) => task.id === "incident-triage");
    expect(noIncidents?.status).toBe("not-applicable");

    const incident: AIIncident = {
      id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
      title: "Near miss",
      system: "",
      severity: "Low",
      category: "Near miss",
      status: "Open",
      detectedAt: "2026-10-20",
      owner: "",
      summary: "Test record",
      response: "",
      statusHistory: [{ status: "Open", changedAt: "2026-10-20T00:00:00.000Z" }],
    };
    state.incidents = [incident];
    expect(allTasks(state).find((task) => task.id === "incident-triage")?.status).toBe("action");
    state.incidents = [{ ...incident, status: "Triage", owner: "Safety lead" }];
    expect(allTasks(state).find((task) => task.id === "incident-triage")?.status).toBe("complete");
  });

  it("calculates overall progress without counting not-applicable tasks", () => {
    const phases = buildLifecycleChecklist(initialState());
    const result = checklistProgress(phases);
    expect(result.total).toBe(
      phases.flatMap((phase) => phase.tasks).filter((task) => task.status !== "not-applicable")
        .length,
    );
    expect(result.percent).toBe(Math.round((result.complete / result.total) * 100));
  });

  it("flags pending material change reviews in the lifecycle checklist", () => {
    const state = initialState();
    expect(allTasks(state).find((task) => task.id === "change-reviews")?.status).toBe(
      "not-applicable",
    );
    state.changeReviews = [
      {
        id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
        system: state.systems[0]!.name,
        categories: ["Model or AI provider"],
        summary: "Model version change",
        requestedBy: "Product owner",
        targetDate: null,
        submittedAt: "2026-10-20T12:00:00.000Z",
        impacts: {
          Safety: "Low",
          Privacy: "Low",
          Security: "Low",
          Fairness: "Low",
          Rights: "Low",
          Operations: "Low",
        },
        impactRationale: "Initial review",
        status: "Pending review",
        reviewer: "",
        decisionRationale: "",
        decidedAt: null,
        history: [],
      },
    ];
    expect(allTasks(state).find((task) => task.id === "change-reviews")?.status).toBe("action");
  });

  it("requires active monitoring coverage for approved systems and flags overdue plans", () => {
    const state = initialState();
    const system = state.systems.find((item) => item.status === "Approved");
    if (!system) throw new Error("Expected an approved seed system");
    expect(allTasks(state).find((task) => task.id === "operational-monitoring")?.status).toBe(
      "action",
    );
    state.monitoringPlans = [
      {
        id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
        system: system.name,
        metric: "Quality review",
        domain: "Quality",
        unit: "%",
        threshold: 90,
        breachDirection: "At or below threshold",
        cadence: "Monthly",
        nextDue: "2026-01-01",
        owner: "System owner",
        status: "Active",
        createdAt: "2026-01-01T00:00:00.000Z",
        notes: "",
        observations: [],
      },
    ];
    expect(
      allTasks(state).find((task) => task.id === "operational-monitoring")?.progress,
    ).toContain("1 overdue");
  });
});
