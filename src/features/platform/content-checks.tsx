/*
 * Content checks — runs the browser ports of platform/scripts/check_content.py and
 * check_website_pages.py over the governed content bundled into this site, and lists
 * pass/fail per check with the script-style output.
 */
import { useCallback, useEffect, useState } from "react";
import { bundledContent } from "./checks/bundle";
import { runAllChecks, type CheckReport, type WebsitePagesReport } from "./checks/content-checks";

type Reports = [CheckReport, WebsitePagesReport];

function Status({ ok }: { ok: boolean }) {
  return (
    <span className={`badge ${ok ? "badge-verified" : "badge-critical"}`}>{ok ? "Pass" : "Fail"}</span>
  );
}

function Report({ r, title }: { r: CheckReport; title: string }) {
  return (
    <section className="report-section" aria-label={title}>
      <h3>
        {title} <Status ok={r.ok} />
      </h3>
      <p className="small">
        Port of <code>platform/{r.script}</code>
      </p>
      <div className="table-wrap" role="region" tabIndex={0} aria-label={`${title} results`}>
        <table>
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">Result</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {r.steps.map((s) => (
              <tr key={s.id}>
                <th scope="row">{s.title}</th>
                <td>
                  <code>{s.line}</code>
                  {s.errors.length > 0 && (
                    <ul>
                      {s.errors.slice(0, 50).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {s.errors.length > 50 && <li>… {s.errors.length - 50} more</li>}
                    </ul>
                  )}
                </td>
                <td>
                  <Status ok={s.ok} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.warnings.length > 0 && (
        <details>
          <summary>{r.warnings.length} warning(s)</summary>
          <ul>
            {r.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </details>
      )}
      <details>
        <summary>Script output</summary>
        <pre className="code-block">
          <code>{r.output}</code>
        </pre>
      </details>
    </section>
  );
}

export function ContentChecks() {
  const [reports, setReports] = useState<Reports | null>(null);
  const [ranAt, setRanAt] = useState<string>("");
  const [error, setError] = useState("");

  const run = useCallback(() => {
    try {
      setReports(runAllChecks(bundledContent));
      setRanAt(new Date().toLocaleTimeString());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The checks could not run.");
    }
  }, []);

  // Run once on mount (client only).
  useEffect(run, [run]);

  const pages = reports?.[1];
  return (
    <section className="tool" aria-labelledby="content-checks-title">
      <h2 id="content-checks-title">Content integrity checks</h2>
      <p>
        Checks the governed content bundled into this site ({bundledContent.length} files:
        control library, assessment templates, policy packs, industry packs, website pages and
        email templates): control IDs and references, template shape, front matter, policy-pack
        schema validity and prohibited compliance claims. The same checks run in CI through{" "}
        <code>src/test/platform-content-checks.test.ts</code>. The Python script also scans{" "}
        <code>docs/</code>, <code>app/</code> and <code>output/</code>, which are not bundled here.
      </p>
      <p>
        <button type="button" className="btn btn-primary" onClick={run}>
          Run checks again
        </button>{" "}
        <span className="form-status" role="status" aria-live="polite">
          {ranAt ? `Last run at ${ranAt}.` : "Running…"}
        </span>
      </p>
      {error && <p className="notice notice--error">{error}</p>}
      {reports && (
        <>
          <div
            className={`notice ${reports.every((r) => r.ok) ? "notice--success" : "notice--error"}`}
          >
            {reports.every((r) => r.ok)
              ? "All content checks passed."
              : `${reports.reduce((n, r) => n + r.errors.length, 0)} failure(s) found.`}
          </div>
          <Report r={reports[0]} title="Content integrity (check_content.py)" />
          <Report r={reports[1]} title="Website pages (check_website_pages.py)" />
          {pages && (
            <details>
              <summary>Per-page details ({pages.rows.length} pages)</summary>
              <div className="table-wrap" role="region" tabIndex={0} aria-label="Website pages">
                <table>
                  <thead>
                    <tr>
                      {["File", "Slug", "Section", "Template", "Words", "FAQ"].map((h) => (
                        <th scope="col" key={h}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pages.rows.map((r) => (
                      <tr key={r.name}>
                        <th scope="row">{r.name}</th>
                        <td>{r.slug}</td>
                        <td>{r.section}</td>
                        <td>{r.template}</td>
                        <td>{r.words}</td>
                        <td>{r.faq}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </section>
  );
}
