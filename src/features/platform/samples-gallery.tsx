/*
 * Synthetic sample reports — regenerates the samples of platform/scripts/generate_samples.py and
 * aegis_shield.samples in the browser with the TypeScript engines and offers Markdown, JSON,
 * YAML and PDF downloads. Every sample is fictional and labelled "Synthetic example".
 */
import { useMemo, useState } from "react";
import { downloadBlob, downloadText } from "./reports/exporters";
import {
  SAMPLE_DATE,
  fileName,
  generateSamples,
  type SampleFile,
  type SampleGroup,
} from "./samples/generate";

const MIME: Record<SampleFile["kind"], string> = {
  markdown: "text/markdown",
  json: "application/json",
  yaml: "application/yaml",
};

export function SamplesGallery() {
  const [date, setDate] = useState(SAMPLE_DATE);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<SampleFile | null>(null);
  const result = useMemo((): { groups: SampleGroup[]; error: string } => {
    try {
      return { groups: generateSamples(/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : SAMPLE_DATE), error: "" };
    } catch (e) {
      return { groups: [], error: e instanceof Error ? e.message : "Sample generation failed." };
    }
  }, [date]);

  const pdf = async (f: SampleFile) => {
    setStatus(`Preparing ${fileName(f.path).replace(/\.md$/, ".pdf")}…`);
    try {
      const { markdownToPdfBlob } = await import("./reports/pdf");
      const blob = markdownToPdfBlob(f.content, {
        ...(f.pdfTitle ? { title: f.pdfTitle } : {}),
        generated: date,
      });
      downloadBlob(blob, fileName(f.path).replace(/\.md$/, ".pdf"));
      setStatus("PDF downloaded.");
    } catch {
      setStatus("The PDF could not be generated in this browser. Download the Markdown instead.");
    }
  };

  return (
    <section className="tool" aria-labelledby="samples-title">
      <h2 id="samples-title">Synthetic sample reports</h2>
      <p className="notice notice--warning">
        <strong>Synthetic examples.</strong> Fictional organizations and self-reported answers,
        generated in your browser to demonstrate AEGIS outputs. They are not evidence about any
        real organization. PDFs are previews rendered with jsPDF and are not signed exports.
      </p>
      <form className="tool-form" noValidate onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor="samples-date">Report date</label>
          <p className="hint" id="samples-date-hint">
            The committed samples use {SAMPLE_DATE}; with that date the Markdown and JSON match
            platform/output/sample_reports exactly.
          </p>
          <input
            id="samples-date"
            type="date"
            value={date}
            aria-describedby="samples-date-hint"
            onChange={(e) => setDate(e.target.value || SAMPLE_DATE)}
          />
        </div>
      </form>
      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>
      {result.error && <p className="notice notice--error">{result.error}</p>}
      {result.groups.map((g) => (
        <section className="report-section" key={g.id} aria-labelledby={`samples-${g.id}`}>
          <h3 id={`samples-${g.id}`}>{g.title}</h3>
          <div className="table-wrap" role="region" tabIndex={0} aria-label={`${g.title} files`}>
            <table>
              <thead>
                <tr>
                  <th scope="col">File</th>
                  <th scope="col">Format</th>
                  <th scope="col">Download</th>
                </tr>
              </thead>
              <tbody>
                {g.files.map((f) => (
                  <tr key={f.path}>
                    <th scope="row">
                      <code>{f.path}</code>
                    </th>
                    <td>{f.kind}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => downloadText(f.content, fileName(f.path), MIME[f.kind])}
                      >
                        {f.kind === "markdown" ? "Markdown" : f.kind.toUpperCase()}
                      </button>{" "}
                      {f.kind === "markdown" && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => void pdf(f)}
                        >
                          PDF
                        </button>
                      )}{" "}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-pressed={preview?.path === f.path}
                        onClick={() => setPreview(preview?.path === f.path ? null : f)}
                      >
                        {preview?.path === f.path ? "Hide" : "Preview"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview && g.files.some((f) => f.path === preview.path) && (
            <details open>
              <summary>
                Preview: <code>{preview.path}</code>
              </summary>
              <pre className="code-block">
                <code>{preview.content}</code>
              </pre>
            </details>
          )}
        </section>
      ))}
    </section>
  );
}
