import { describe, expect, it } from "vitest";
import { monitoringPlanSchema, type MonitoringPlan } from "@/features/governance/monitoring-schema";
import {
  isThresholdBreach,
  monitoringState,
  nextMonitoringDate,
} from "@/features/governance/monitoring-model";

const plan = (patch: Partial<MonitoringPlan> = {}) =>
  monitoringPlanSchema.parse({
    id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
    system: "Clinical Summary Copilot",
    metric: "Human override rate",
    domain: "Human oversight",
    unit: "%",
    threshold: 10,
    breachDirection: "At or above threshold",
    cadence: "Monthly",
    nextDue: "2026-10-20",
    owner: "Clinical Informatics",
    createdAt: "2026-10-01T12:00:00.000Z",
    observations: [],
    ...patch,
  });

describe("AI system operational monitoring", () => {
  it("compares observations against the configured breach direction, including equality", () => {
    expect(isThresholdBreach(plan(), 10)).toBe(true);
    expect(isThresholdBreach(plan({ breachDirection: "At or below threshold" }), 10)).toBe(true);
    expect(isThresholdBreach(plan(), 9.99)).toBe(false);
  });

  it("derives due, overdue, breach, and paused states from the plan and latest observation", () => {
    expect(monitoringState(plan(), "2026-10-20")).toBe("Not yet measured");
    expect(monitoringState(plan(), "2026-10-21")).toBe("Overdue");
    const observed = plan({
      observations: [
        {
          id: "c03e6c7c-6a1d-44af-87c0-c52c648c58d2",
          measuredAt: "2026-10-20",
          value: 11,
          recordedBy: "Reviewer",
          evidenceReference: "",
          notes: "",
        },
      ],
    });
    expect(monitoringState(observed, "2026-10-20")).toBe("Breach");
    expect(monitoringState(plan({ status: "Paused" }), "2026-10-21")).toBe("Paused");
  });

  it("advances cadence dates without overflowing month ends", () => {
    expect(nextMonitoringDate("2026-01-31", "Monthly")).toBe("2026-02-28");
    expect(nextMonitoringDate("2028-01-31", "Quarterly")).toBe("2028-04-30");
    expect(nextMonitoringDate("2026-10-20", "Weekly")).toBe("2026-10-27");
  });

  it("validates finite thresholds, observation history and required ownership", () => {
    expect(monitoringPlanSchema.safeParse({ ...plan(), threshold: Number.NaN }).success).toBe(
      false,
    );
    expect(monitoringPlanSchema.safeParse({ ...plan(), owner: " " }).success).toBe(false);
  });
});
