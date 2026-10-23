import { describe, expect, it } from "vitest";
import { initialState } from "@/features/governance/store";
import {
  buildEvidenceReport,
  reportCaveats,
  reportFilename,
} from "@/features/governance/evidence-report";
import { generateEvidenceFile, type ExportFormat } from "@/features/governance/evidence-files";
import { pillarScores } from "@/features/governance/model";
import { calculateRiskTier } from "@/features/site/engines/risk-tier";

const generatedAt = "2026-10-20T12:00:00.000Z";

describe("governance evidence downloads", () => {
  const state = initialState();
  const report = buildEvidenceReport(
    state,
    "Acme Health",
    "Audit evidence pack",
    generatedAt,
    pillarScores(state.answers),
    "Blocked",
  );

  it("builds an honest workspace snapshot with assessment evidence and owned actions", () => {
    expect(report.assessment).toHaveLength(12);
    expect(report.assessment[0]).toMatchObject({
      snapshotAt: generatedAt,
      evidenceLink: "None",
      attachment: "None",
    });
    expect(report.roadmap[0]).toMatchObject({ owner: expect.any(String), phase: 1 });
    expect(report.changeReviews).toEqual([]);
    expect(reportCaveats.join(" ")).toContain(
      "Historical per-response edit timestamps are not stored",
    );
    expect(reportFilename("Audit evidence pack", "Acme Health", "pdf")).toBe(
      "VERITRAIL_Audit-evidence-pack_Acme-Health.pdf",
    );
  });

  it("includes decision rationale, conditions and lifecycle history in the export snapshot", () => {
    const stateWithDecision = {
      ...state,
      decisions: [
        {
          id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
          system: "Clinical summarizer",
          outcome: "Conditional approval" as const,
          decidedAt: "2026-10-20",
          reviewBy: "2026-11-20",
          approver: "AI Oversight Committee",
          rationale: "Controls verified for the defined scope.",
          conditions: "Monthly performance review",
          lifecycle: "Current" as const,
          history: [{ action: "Created" as const, changedAt: generatedAt }],
        },
      ],
    };
    const snapshot = buildEvidenceReport(
      stateWithDecision,
      "Acme Health",
      "Audit evidence pack",
      generatedAt,
      pillarScores(state.answers),
      "Blocked",
    );
    expect(snapshot.decisions[0]).toMatchObject({
      outcome: "Conditional approval",
      rationale: "Controls verified for the defined scope.",
      conditions: "Monthly performance review",
    });
    expect(reportCaveats.join(" ")).toContain("does not establish legal classification");
  });

  it("carries inferred triage rationale, drivers and evidence caveat into the export snapshot", () => {
    const triagedState = {
      ...state,
      systems: state.systems.map((system, index) =>
        index === 0
          ? {
              ...system,
              riskTriage: {
                profile: {
                  name: system.name,
                  purpose: "Clinical prioritization",
                  domain_category: "healthcare",
                },
                result: calculateRiskTier({
                  name: system.name,
                  purpose: "Clinical prioritization",
                  domain_category: "healthcare",
                  decision_impact: "material",
                  affected_parties: "vulnerable",
                  data_sensitivity: "special_category",
                }),
                assessedAt: generatedAt,
              },
            }
          : system,
      ),
    };
    const snapshot = buildEvidenceReport(
      triagedState,
      "Acme Health",
      "Audit evidence pack",
      generatedAt,
      pillarScores(state.answers),
      "Blocked",
    );

    expect(snapshot.inventory[0]).toMatchObject({
      triageTier: "High",
      triageEvidenceStatus: "Inferred",
      triageAssessedAt: generatedAt,
    });
    expect(snapshot.inventory[0]?.triageRationale).toContain("requires human confirmation");
    expect(reportCaveats.join(" ")).toContain("Use-case risk triage is a rules-based inference");
  });

  it("includes monitoring thresholds and manual observations in evidence snapshots", () => {
    const monitoringState = {
      ...state,
      monitoringPlans: [
        {
          id: "1033e56c-80a8-4ca8-9b89-5f8911897729",
          system: "Clinical Summary Copilot",
          metric: "Human override rate",
          domain: "Human oversight" as const,
          unit: "%",
          threshold: 10,
          breachDirection: "At or above threshold" as const,
          cadence: "Monthly" as const,
          nextDue: "2026-11-20",
          owner: "Clinical Informatics",
          status: "Active" as const,
          createdAt: generatedAt,
          notes: "Escalate to model risk lead.",
          observations: [
            {
              id: "c03e6c7c-6a1d-44af-87c0-c52c648c58d2",
              measuredAt: "2026-10-20",
              value: 12,
              recordedBy: "Clinical Informatics",
              evidenceReference: "record-123",
              notes: "Above local threshold.",
            },
          ],
        },
      ],
    };
    const snapshot = buildEvidenceReport(
      monitoringState,
      "Acme Health",
      "Audit evidence pack",
      generatedAt,
      pillarScores(state.answers),
      "Blocked",
    );
    expect(snapshot.monitoringPlans[0]).toMatchObject({
      metric: "Human override rate",
      threshold: 10,
      owner: "Clinical Informatics",
    });
    expect(reportCaveats.join(" ")).toContain("no live telemetry");
  });

  it.each(["PDF", "DOCX", "XLSX", "PPTX"] as ExportFormat[])(
    "generates a valid %s file",
    async (format) => {
      const file = await generateEvidenceFile(report, format);
      const header = await blobPrefix(file);
      expect(file.size).toBeGreaterThan(500);
      expect(header.startsWith(format === "PDF" ? "%PDF" : "PK")).toBe(true);
    },
  );
});

function blobPrefix(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(new TextDecoder().decode((reader.result as ArrayBuffer).slice(0, 4)));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
