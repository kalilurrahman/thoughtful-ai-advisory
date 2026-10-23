/*
 * VERITRAIL ROI & business-case calculator — browser UI for src/features/platform/roi/roi.ts
 * (port of platform/content/commercial/roi_calculator.py). Everything runs in the browser; no
 * input is sent anywhere. Effect sizes are labelled as VERITRAIL hypotheses to validate in a pilot.
 */
import { useId, useMemo, useState, type ReactNode } from "react";
import { downloadText } from "./reports/exporters";
import {
  ASSUMPTION_META,
  CUSTOMER_ESTIMATE,
  CUSTOMER_INPUT,
  EXAMPLE_INPUTS,
  FRACTIONS,
  HYPOTHESIS,
  REQUIRED_FIELDS,
  ROI_DEFAULTS,
  ROI_FIELDS,
  calculate,
  fmt,
  scenarios,
  scenariosMarkdown,
  summaryRows,
  toCsv,
  toMarkdown,
  type ROIInputs,
  type ROIKey,
  type ROIResult,
  type ScenarioName,
} from "./roi/roi";

type Draft = Record<ROIKey, string>;

const LABELS: Record<ROIKey, string> = {
  ai_systems: "AI systems in scope",
  assessment_hours_per_system: "Hours per assessment",
  hourly_cost: "Blended hourly cost",
  audit_prep_hours_per_year: "Audit-preparation hours per year",
  approval_cycle_days: "Approval cycle (days)",
  assessments_per_system_per_year: "Assessments per system per year",
  new_use_cases_per_year: "New use cases per year",
  delay_cost_per_day: "Value lost per use case per day of delay",
  annual_incident_probability: "Annual probability of a material AI incident (0–1)",
  expected_incident_cost: "Expected cost of a material AI incident",
  veritrail_annual_cost: "VERITRAIL annual subscription",
  implementation_cost: "One-time implementation cost",
  assessment_effort_reduction: "Assessment effort reduction (0–1)",
  audit_prep_reduction: "Audit-preparation reduction (0–1)",
  approval_cycle_reduction: "Approval cycle reduction (0–1)",
  incident_likelihood_reduction: "Incident likelihood reduction (0–1)",
  realization_rate: "Year-1 realization rate (0–1)",
};

const GROUPS: Array<{ source: string; title: string; note: string }> = [
  {
    source: CUSTOMER_INPUT,
    title: "Customer inputs",
    note: "Facts about today's operation.",
  },
  {
    source: CUSTOMER_ESTIMATE,
    title: "Customer estimates",
    note: "Judgements your team makes. Leave at 0 to exclude a benefit.",
  },
  {
    source: HYPOTHESIS,
    title: "VERITRAIL hypotheses — validate in pilot",
    note: "Planning hypotheses that have not been measured with customers. Replace them with pilot measurements before using the model in a proposal.",
  },
];

const toDraft = (inp: Partial<ROIInputs>): Draft =>
  Object.fromEntries(ROI_FIELDS.map((k) => [k, inp[k] === undefined ? "" : String(inp[k])])) as Draft;

const DEFAULT_DRAFT = toDraft(ROI_DEFAULTS);
const EXAMPLE_DRAFT = toDraft(EXAMPLE_INPUTS);
const INT_FIELDS: ReadonlySet<ROIKey> = new Set(["ai_systems", "new_use_cases_per_year"]);

function parseDraft(d: Draft): { inputs: ROIInputs | null; errors: Partial<Record<ROIKey, string>> } {
  const errors: Partial<Record<ROIKey, string>> = {};
  const out: Partial<ROIInputs> = {};
  for (const k of ROI_FIELDS) {
    const raw = d[k].trim();
    if (!raw) {
      if (REQUIRED_FIELDS.includes(k)) errors[k] = "Required.";
      else out[k] = ROI_DEFAULTS[k as keyof typeof ROI_DEFAULTS];
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) errors[k] = "Enter a number.";
    else if (n < 0) errors[k] = "Must be 0 or more.";
    else if (FRACTIONS.has(k) && n > 1) errors[k] = "Enter a fraction between 0 and 1.";
    else out[k] = INT_FIELDS.has(k) ? Math.trunc(n) : n;
  }
  return { inputs: Object.keys(errors).length ? null : (out as ROIInputs), errors };
}

function Table({ head, rows, label }: { head: string[]; rows: ReactNode[][]; label: string }) {
  return (
    <div className="table-wrap" role="region" tabIndex={0} aria-label={label}>
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th scope="row" key={j}>
                    {c}
                  </th>
                ) : (
                  <td key={j}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SCENARIO_LABEL: Record<ScenarioName, string> = {
  conservative: "Conservative (hypotheses × 0.5)",
  base: "Base (hypotheses × 1.0)",
  optimistic: "Optimistic (hypotheses × 1.5, capped at 0.9)",
};

export function RoiCalculator() {
  const uid = useId();
  const [draft, setDraft] = useState<Draft>(EXAMPLE_DRAFT);
  const [currency, setCurrency] = useState("USD");
  const { inputs, errors } = useMemo(() => parseDraft(draft), [draft]);
  const computed = useMemo((): {
    result: ROIResult;
    sc: Record<ScenarioName, ROIResult>;
  } | null => {
    if (!inputs) return null;
    try {
      return { result: calculate(inputs), sc: scenarios(inputs) };
    } catch {
      return null;
    }
  }, [inputs]);
  const isExample = ROI_FIELDS.every((k) => draft[k] === EXAMPLE_DRAFT[k]);

  const markdown = () => {
    if (!computed) return "";
    return (
      toMarkdown(computed.result, "VERITRAIL ROI estimate", currency || "USD") +
      "\n## Sensitivity (effect hypotheses × 0.5 / 1.0 / 1.5)\n\n" +
      scenariosMarkdown(computed.sc)
    );
  };

  return (
    <section className="tool" aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`}>ROI &amp; business-case calculator</h2>
      <p className="notice notice--warning">
        Illustrative estimate. VERITRAIL has no measured customer results yet: values labelled{" "}
        <strong>{HYPOTHESIS}</strong> are planning hypotheses, not measurements. Results are not
        guaranteed savings and are not financial advice. Your inputs stay in this browser.
      </p>
      <p className="small">
        {isExample
          ? "Pre-filled with the synthetic worked example (fictional “Example Co”; not a customer)."
          : "Custom inputs."}{" "}
        <button type="button" className="btn btn-secondary" onClick={() => setDraft(EXAMPLE_DRAFT)}>
          Load worked example
        </button>{" "}
        <button type="button" className="btn btn-secondary" onClick={() => setDraft(DEFAULT_DRAFT)}>
          Reset to model defaults
        </button>
      </p>

      <form className="tool-form" noValidate onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <label htmlFor={`${uid}-currency`}>Currency label</label>
          <input
            id={`${uid}-currency`}
            type="text"
            maxLength={8}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
        {GROUPS.map((g) => (
          <fieldset key={g.source}>
            <legend>{g.title}</legend>
            <p className="hint">{g.note}</p>
            {ROI_FIELDS.filter((k) => ASSUMPTION_META[k][0] === g.source).map((k) => {
              const id = `${uid}-${k}`;
              const err = errors[k];
              return (
                <div className="field" key={k}>
                  <label htmlFor={id}>
                    {LABELS[k]}
                    {REQUIRED_FIELDS.includes(k) && <span className="req"> (required)</span>}
                  </label>
                  <p className="hint" id={`${id}-hint`}>
                    {ASSUMPTION_META[k][1]} <code>{k}</code>
                  </p>
                  <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={FRACTIONS.has(k) ? 1 : undefined}
                    step={FRACTIONS.has(k) ? 0.05 : INT_FIELDS.has(k) ? 1 : "any"}
                    value={draft[k]}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={`${id}-hint${err ? ` ${id}-error` : ""}`}
                    onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  />
                  {err && (
                    <p className="field-error" id={`${id}-error`}>
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>
        ))}
      </form>

      <div aria-live="polite">
        {!computed ? (
          <p className="notice notice--error">
            Correct the highlighted inputs to see the estimate.
          </p>
        ) : (
          <>
            <h3>Summary ({currency || "USD"} per year unless stated)</h3>
            <Table
              label="ROI summary"
              head={["Measure", "Value"]}
              rows={summaryRows(computed.result.summary).map(([a, b]) => [a, b])}
            />
            <div className="report-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => downloadText(markdown(), "VERITRAIL_ROI_estimate.md", "text/markdown")}
              >
                Download Markdown
              </button>{" "}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  downloadText(toCsv(computed.result), "VERITRAIL_ROI_estimate.csv", "text/csv")
                }
              >
                Download CSV
              </button>
            </div>

            <h3>Sensitivity — read this before using the numbers</h3>
            <p className="small">
              Every VERITRAIL effect hypothesis is scaled by 0.5 / 1.0 / 1.5. Present ranges, never a
              single headline number.
            </p>
            <Table
              label="Sensitivity scenarios"
              head={["Scenario", "Gross benefit", "Year-1 net", "Year-1 ROI", "Payback"]}
              rows={(Object.keys(computed.sc) as ScenarioName[]).map((k) => {
                const s = computed.sc[k].summary;
                return [
                  SCENARIO_LABEL[k],
                  fmt(s.gross_annual_benefit, "currency"),
                  fmt(s.year1_net_benefit, "currency"),
                  s.year1_roi_pct === null ? "n/a" : `${s.year1_roi_pct.toFixed(1)}%`,
                  s.payback_months === null ? "n/a" : `${s.payback_months.toFixed(1)} months`,
                ];
              })}
            />

            <h3>Calculation</h3>
            <Table
              label="ROI calculation"
              head={["Line", "Item", "Formula", "Value"]}
              rows={computed.result.line_items.map((it) => [
                it.id,
                it.label,
                <code key="f">{it.formula}</code>,
                fmt(it.value, it.unit),
              ])}
            />

            <h3>Assumptions</h3>
            <Table
              label="ROI assumptions"
              head={["Assumption", "Value", "Source", "Note"]}
              rows={computed.result.assumptions.map((a) => [
                <code key="k">{a.key}</code>,
                a.display,
                a.source === HYPOTHESIS ? (
                  <span key="s" className="badge badge-asserted">
                    {a.source}
                  </span>
                ) : (
                  a.source
                ),
                a.note,
              ])}
            />
            <p className="small">
              Hypotheses to validate in pilots:{" "}
              {computed.result.hypotheses_to_validate.map((k, i) => (
                <span key={k}>
                  {i > 0 && ", "}
                  <code>{k}</code>
                </span>
              ))}
              .
            </p>
            <aside className="disclaimer" aria-label="ROI disclaimer">
              <p>{computed.result.disclaimer}</p>
            </aside>
          </>
        )}
      </div>
    </section>
  );
}
