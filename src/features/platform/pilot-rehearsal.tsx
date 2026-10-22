/**
 * Pilot A dress rehearsal — runs the full pilot workflow on a fictional organization in this
 * browser (port of platform/scripts/pilot_dry_run.py) and offers the outputs as downloads.
 */
import { useId, useRef, useState } from "react";
import { downloadBlob, downloadText } from "./reports/exporters";
import { ORG, runDryRunAsync, type DryRunProgress, type DryRunResult } from "./pilot/dry-run";

type Download = {
  label: string;
  filename: string;
  type: string;
  content: (r: DryRunResult) => string;
};

const DOWNLOADS: Download[] = [
  {
    label: "Executive readiness report (Markdown)",
    filename: "00_executive_readiness_report.md",
    type: "text/markdown",
    content: (r) => r.outputs.executiveMarkdown,
  },
  {
    label: "Consolidated gap register (CSV)",
    filename: "05_gap_register.csv",
    type: "text/csv",
    content: (r) => r.outputs.gapRegisterCsv,
  },
  {
    label: "Audit log (JSONL, hash-chained)",
    filename: "pilot_audit.jsonl",
    type: "application/jsonl",
    content: (r) => r.outputs.auditJsonl,
  },
  {
    label: "Evidence pack (JSON, approval-gated)",
    filename: "06_evidence_pack.json",
    type: "application/json",
    content: (r) => r.outputs.evidencePackJson,
  },
  {
    label: "AI inventory (CSV)",
    filename: "01_ai_inventory.csv",
    type: "text/csv",
    content: (r) => r.outputs.inventoryCsv,
  },
  {
    label: "Maturity baseline (Markdown)",
    filename: "02_maturity_baseline.md",
    type: "text/markdown",
    content: (r) => r.outputs.maturityMarkdown,
  },
  {
    label: "Metrics (JSON)",
    filename: "metrics.json",
    type: "application/json",
    content: (r) => r.outputs.metricsJson,
  },
  {
    label: "Run log (Markdown)",
    filename: "run_log.md",
    type: "text/markdown",
    content: (r) => r.outputs.runLogMarkdown,
  },
];

/** Run the Pilot A dress rehearsal on synthetic data and download its outputs. */
export function PilotRehearsal() {
  const uid = useId();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<DryRunProgress | null>(null);
  const [result, setResult] = useState<DryRunResult | null>(null);
  const [error, setError] = useState("");
  const runToken = useRef(0);

  async function run() {
    const token = ++runToken.current;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await runDryRunAsync((p) => {
        if (runToken.current === token) setProgress(p);
      });
      if (runToken.current === token) setResult(res);
    } catch (e) {
      if (runToken.current === token) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (runToken.current === token) {
        setRunning(false);
        setProgress(null);
      }
    }
  }

  async function downloadPdf(r: DryRunResult) {
    try {
      const { markdownToPdfBlob } = await import("./reports/pdf");
      downloadBlob(
        markdownToPdfBlob(r.outputs.executiveMarkdown, { title: `Executive Readiness Report — ${ORG}` }),
        "00_executive_readiness_report.pdf",
      );
    } catch (e) {
      setError(`PDF export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  const r = result;

  return (
    <section className="tool pilot-rehearsal" aria-labelledby={`${uid}-heading`}>
      <h2 id={`${uid}-heading`}>Pilot dress rehearsal</h2>
      <p className="notice notice--warning">
        <strong>Synthetic data — fictional organization.</strong> “{ORG}” does not exist; every answer
        is generated deterministically. The rehearsal runs entirely in this browser with the real
        AEGIS tooling and stores nothing. It proves the pilot workflow end to end; it is not evidence
        about any real organization.
      </p>
      <p>
        The run registers 28 AI systems, confirms preliminary risk tiers through the approval queue,
        runs deep-dive assessments for every High-tier system, consolidates the gap register, creates
        remediation tasks for Critical gaps after explicit confirmation, drafts runtime policies
        (activation stays pending human approval), exports an approval-gated evidence pack, checks
        that self-approval is refused and verifies the audit chain.
      </p>
      <div className="report-actions">
        <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={running}>
          {running ? "Running…" : r ? "Run dress rehearsal again" : "Run dress rehearsal"}
        </button>
      </div>

      <div role="status" aria-live="polite">
        {running && progress && (
          <div className="assessment-progress">
            <p className="progress-label" id={`${uid}-progress`}>
              {progress.phase}: {progress.label}
            </p>
            <progress max={100} value={pct} aria-labelledby={`${uid}-progress`}>
              {pct}%
            </progress>
          </div>
        )}
        {r && !running && <p>Dress rehearsal complete. Audit chain {r.audit.ok ? "verified" : "FAILED verification"}.</p>}
      </div>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      {r && (
        <>
          <h3>Summary</h3>
          <dl className="kv">
            <dt>AI systems registered</dt>
            <dd>{r.inventory.length}</dd>
            <dt>Preliminary tiers</dt>
            <dd>
              {Object.entries(r.tiers)
                .map(([k, v]) => `${k} ${v}`)
                .join(", ")}
            </dd>
            <dt>High-tier deep dives</dt>
            <dd>
              {r.assessments.length} ({r.assessments.reduce((s, a) => s + a.questions, 0)} responses)
            </dd>
            <dt>Maturity baseline</dt>
            <dd>
              {r.maturity.overall_score} / 100 — {r.maturity.maturity_level} (self-reported)
            </dd>
            <dt>Gaps</dt>
            <dd>
              {r.allGaps.length} — Critical {r.gapSeverity["Critical"] ?? 0}, High {r.gapSeverity["High"] ?? 0},
              Medium {r.gapSeverity["Medium"] ?? 0}, Low {r.gapSeverity["Low"] ?? 0}
            </dd>
            <dt>Critical remediation tasks</dt>
            <dd>{r.criticalTasks} (created after explicit confirmation)</dd>
            <dt>Runtime policies drafted</dt>
            <dd>
              {r.policies.length} —{" "}
              {r.policies.map((p) => `${p.policy_id} v${p.version} (${p.status}, ${p.rollout_mode}; activation ${p.activation_approval})`).join("; ")}
            </dd>
            <dt>Evidence pack</dt>
            <dd>
              {r.evidencePack.status} after approval {r.evidencePack.approvalId} ({r.evidencePack.items} items)
            </dd>
            <dt>Separation of duties</dt>
            <dd>{r.separationOfDuties}</dd>
            <dt>Audit chain</dt>
            <dd>
              {r.audit.count} records, verify = {r.audit.ok ? "ok" : r.audit.message}
            </dd>
          </dl>

          <h3>Pilot success metrics (dry run)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Target</th>
                  <th scope="col">Result</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {r.metrics.map((m) => (
                  <tr key={m.metric}>
                    <th scope="row">{m.metric}</th>
                    <td>{m.target}</td>
                    <td>{m.result}</td>
                    <td>{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Governance checks exercised</h3>
          <ul>
            {r.log.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>

          <h3>Downloads</h3>
          <ul className="download-list">
            {DOWNLOADS.map((d) => (
              <li key={d.filename}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => downloadText(d.content(r), d.filename, d.type)}
                >
                  {d.label}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="btn btn-secondary" onClick={() => void downloadPdf(r)}>
                Executive readiness report (PDF)
              </button>
            </li>
          </ul>
          <p className="small">All outputs are labelled synthetic and describe a fictional organization.</p>
        </>
      )}
    </section>
  );
}
