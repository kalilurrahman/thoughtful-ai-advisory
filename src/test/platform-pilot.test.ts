/**
 * Pilot A dress rehearsal (browser port of platform/scripts/pilot_dry_run.py) against the
 * Python run exported by platform/scripts/export_agent_parity_fixtures.py.
 */
import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PilotRehearsal } from "@/features/platform/pilot-rehearsal";
import fixture from "./fixtures/agent-parity.json";
import { sha256Hex, verifyChain, AuditLog } from "@/features/platform/audit";
import {
  runDryRun,
  runDryRunAsync,
  syntheticAnswer,
  type DryRunResult,
} from "@/features/platform/pilot/dry-run";

const py = (fixture as unknown as { pilot: Record<string, unknown> }).pilot as {
  systems: number;
  tiers: Record<string, number>;
  gap_severity: Record<string, number>;
  evidence_status: Record<string, number>;
  deep_dives: number;
  responses: number;
  assessments: Array<{
    system: string;
    assessment_id: string;
    tier: string;
    questions: number;
    summary: unknown;
  }>;
  gaps: number;
  critical_tasks: number;
  policies: Array<Record<string, unknown>>;
  metrics: Array<Record<string, string>>;
  approvals: Array<[string, string, string]>;
  evidence_pack: {
    assessment_id: string;
    approval_id: string;
    approved_by: string;
    items: number;
    findings: number;
  };
  audit_count: number;
  audit_ok: boolean;
  audit_head: string;
  audit_actions: Record<string, number>;
  log: string[];
  run_log: string;
  exec_markdown: string;
  gap_register_csv_sha256: string;
  gap_register_head: string;
  inventory_csv_sha256: string;
};

let cached: DryRunResult | null = null;
function result(): DryRunResult {
  cached ??= runDryRun();
  return cached;
}

describe("pilot dress rehearsal — summary numbers", () => {
  it("matches the Python dry run: 28 systems, 12 High-tier deep dives, 403 gaps, 40 critical tasks, 2 policies", () => {
    const r = result();
    expect(r.inventory).toHaveLength(28);
    expect(r.inventory).toHaveLength(py.systems);
    expect(r.tiers).toEqual(py.tiers);
    expect(r.assessments).toHaveLength(12);
    expect(r.assessments.length).toBe(py.deep_dives);
    expect(r.assessments.reduce((s, a) => s + a.questions, 0)).toBe(py.responses);
    expect(r.allGaps).toHaveLength(403);
    expect(r.allGaps.length).toBe(py.gaps);
    expect(r.gapSeverity).toEqual(py.gap_severity);
    expect(r.evidenceStatus).toEqual(py.evidence_status);
    expect(r.criticalTasks).toBe(40);
    expect(r.criticalTasks).toBe(py.critical_tasks);
    expect(r.policies).toHaveLength(2);
    expect(r.metrics).toEqual(py.metrics);
    expect(r.log).toEqual(py.log);
  });

  it("assesses the same systems with the same per-system gap summaries", () => {
    const r = result();
    expect(
      r.assessments.map((a) => ({
        system: a.system,
        assessment_id: a.assessment_id,
        tier: a.tier,
        questions: a.questions,
        summary: a.summary,
      })),
    ).toEqual(py.assessments);
  });

  it("drafts runtime policies whose activation stays pending human approval", () => {
    const r = result();
    expect(r.policies.map(({ yaml: _y, json: _j, ...rest }) => rest)).toEqual(py.policies);
    for (const p of r.policies) {
      expect(p.status).toBe("draft");
      expect(p.rollout_mode).toBe("observe");
      expect(p.activation_approval).toMatch(/\(pending\)$/);
      expect(p.yaml).toContain("policy_id:");
    }
    const approvals = r.agent.store.list("approvals").map((a) => [a.approval_id, a.type, a.status]);
    expect(approvals).toEqual(py.approvals);
    expect(
      approvals.filter(([, t, s]) => t === "activate_runtime_policy" && s === "pending"),
    ).toHaveLength(2);
  });

  it("refuses self-approval and gates the evidence pack export behind an approval", () => {
    const r = result();
    expect(r.separationOfDuties).toBe("PASS — self-approval refused (ApprovalError)");
    expect(r.evidencePack.status).toBe("exported");
    expect(r.evidencePack.items).toBe(py.evidence_pack.items);
    expect(r.evidencePack.approvalId).toBe(py.evidence_pack.approval_id);
    const pack = r.evidencePack.pack ?? {};
    expect(pack["assessment_id"]).toBe(py.evidence_pack.assessment_id);
    expect(pack["approved_by"]).toBe(py.evidence_pack.approved_by);
    expect((pack["findings"] as unknown[]).length).toBe(py.evidence_pack.findings);
  });
});

describe("pilot dress rehearsal — audit chain and outputs", () => {
  it("produces a verifying 675-record audit chain identical to the Python run", () => {
    const r = result();
    expect(r.audit.count).toBe(675);
    expect(r.audit.count).toBe(py.audit_count);
    expect(r.audit.ok).toBe(true);
    expect(r.audit.head).toBe(py.audit_head);
    const counts: Record<string, number> = {};
    for (const rec of r.agent.audit.records) counts[rec.action] = (counts[rec.action] ?? 0) + 1;
    expect(counts).toEqual(py.audit_actions);
    // The downloadable JSONL re-verifies on its own.
    const reloaded = AuditLog.fromJsonl(r.outputs.auditJsonl);
    expect(reloaded.verify().ok).toBe(true);
    const tampered = r.outputs.auditJsonl
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Record<string, unknown>);
    tampered[10] = { ...tampered[10], actor: "someone-else" };
    expect(verifyChain(tampered).ok).toBe(false);
  });

  it("writes the same executive report, run log and gap register as the Python script", () => {
    const r = result();
    expect(r.outputs.executiveMarkdown).toBe(py.exec_markdown);
    expect(r.outputs.executiveMarkdown).toContain("SYNTHETIC DRESS REHEARSAL");
    expect(r.outputs.runLogMarkdown).toBe(py.run_log);
    expect(r.outputs.gapRegisterCsv.split("\r\n").slice(0, 4).join("\r\n")).toBe(
      py.gap_register_head,
    );
    expect(sha256Hex(r.outputs.gapRegisterCsv)).toBe(py.gap_register_csv_sha256);
    expect(sha256Hex(r.outputs.inventoryCsv)).toBe(py.inventory_csv_sha256);
    expect(JSON.parse(r.outputs.evidencePackJson)["assessment_id"]).toBe(
      py.evidence_pack.assessment_id,
    );
    expect(JSON.parse(r.outputs.metricsJson)["synthetic"]).toBe(true);
    expect(r.outputs.maturityMarkdown).toContain("Example Regional Bank (synthetic)");
  });

  it("is deterministic, seedable and can run in chunks", async () => {
    expect(syntheticAnswer("Retail credit scorecard", "UC-CORE-Q1")).toEqual(
      syntheticAnswer("Retail credit scorecard", "UC-CORE-Q1"),
    );
    const phases: string[] = [];
    const chunked = await runDryRunAsync((p) => phases.push(p.phase), { seed: "s1" });
    expect(new Set(phases)).toEqual(new Set(["W2", "W3", "W4", "W5", "W6"]));
    expect(chunked.allGaps.length).toBe(403);
    expect(chunked.audit.ok).toBe(true);
    expect(chunked.inventory[0]?.system_id).toBe("sys_s1000001");
    expect(chunked.audit.head).not.toBe(py.audit_head);
  }, 60_000);
});

describe("PilotRehearsal UI", () => {
  afterEach(cleanup);

  it("runs the rehearsal, shows the summary metrics and offers the outputs", async () => {
    render(createElement(PilotRehearsal));
    expect(screen.getByText(/Synthetic data — fictional organization/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run dress rehearsal" }));
    expect(
      await screen.findByText(/Dress rehearsal complete/, {}, { timeout: 30_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("403 — Critical 40, High 254, Medium 90, Low 19")).toBeInTheDocument();
    expect(screen.getByText(/675 records, verify = ok/)).toBeInTheDocument();
    for (const label of [
      "Executive readiness report (Markdown)",
      "Consolidated gap register (CSV)",
      "Audit log (JSONL, hash-chained)",
      "Evidence pack (JSON, approval-gated)",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  }, 60_000);
});
