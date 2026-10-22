/*
 * AEGIS ROI & business-case calculator (pure).
 *
 * Port of platform/content/commercial/roi_calculator.py. Transparent, assumption-labelled
 * estimate of the annual value of AI governance automation with AEGIS: every output line carries
 * its formula and the assumptions it depends on, and every assumption carries a source label.
 *
 * IMPORTANT: AEGIS has no measured customer results yet. The default effect sizes are planning
 * hypotheses ("AEGIS hypothesis — validate in pilot") to be replaced with pilot measurements.
 * Do not present outputs as guaranteed savings.
 *
 * Number formatting follows Python: computed values are floats (`960.0`), and an input value is
 * printed as an int when it is integer-valued (as in the worked example) unless listed in
 * `floatKeys` (see CalculateOptions).
 */
import { fmtThousands, pyFloatStr, pyRound } from "@/features/site/engines/shield/py";

export const CUSTOMER_INPUT = "Customer input";
export const CUSTOMER_ESTIMATE = "Customer estimate";
export const HYPOTHESIS = "AEGIS hypothesis — validate in pilot";

export type AssumptionSource = typeof CUSTOMER_INPUT | typeof CUSTOMER_ESTIMATE | typeof HYPOTHESIS;

export const DISCLAIMER =
  "Illustrative business case. Effect sizes labelled 'AEGIS hypothesis — validate in pilot' have not been measured " +
  "with customers. Results are estimates, not guaranteed savings, and are not financial advice. Risk-reduction value " +
  "is an expected-value estimate, not a prediction that incidents will or will not occur.";

export interface ROIInputs {
  // customer inputs: today's operation
  ai_systems: number;
  assessment_hours_per_system: number;
  hourly_cost: number;
  audit_prep_hours_per_year: number;
  approval_cycle_days: number;
  assessments_per_system_per_year: number;
  new_use_cases_per_year: number;
  // customer estimates
  delay_cost_per_day: number;
  annual_incident_probability: number;
  expected_incident_cost: number;
  aegis_annual_cost: number;
  implementation_cost: number;
  // AEGIS effect hypotheses (validate in pilot)
  assessment_effort_reduction: number;
  audit_prep_reduction: number;
  approval_cycle_reduction: number;
  incident_likelihood_reduction: number;
  realization_rate: number;
}

export type ROIKey = keyof ROIInputs;

/** Dataclass field order (drives assumption and CSV row order). */
export const ROI_FIELDS: readonly ROIKey[] = [
  "ai_systems",
  "assessment_hours_per_system",
  "hourly_cost",
  "audit_prep_hours_per_year",
  "approval_cycle_days",
  "assessments_per_system_per_year",
  "new_use_cases_per_year",
  "delay_cost_per_day",
  "annual_incident_probability",
  "expected_incident_cost",
  "aegis_annual_cost",
  "implementation_cost",
  "assessment_effort_reduction",
  "audit_prep_reduction",
  "approval_cycle_reduction",
  "incident_likelihood_reduction",
  "realization_rate",
];

/** The three required inputs have no default in Python. */
export const REQUIRED_FIELDS: readonly ROIKey[] = [
  "ai_systems",
  "assessment_hours_per_system",
  "hourly_cost",
];

/** Dataclass defaults for the optional fields. */
export const ROI_DEFAULTS: Omit<
  ROIInputs,
  "ai_systems" | "assessment_hours_per_system" | "hourly_cost"
> = {
  audit_prep_hours_per_year: 0,
  approval_cycle_days: 0,
  assessments_per_system_per_year: 1,
  new_use_cases_per_year: 0,
  delay_cost_per_day: 0,
  annual_incident_probability: 0,
  expected_incident_cost: 0,
  aegis_annual_cost: 0,
  implementation_cost: 0,
  assessment_effort_reduction: 0.4,
  audit_prep_reduction: 0.5,
  approval_cycle_reduction: 0.3,
  incident_likelihood_reduction: 0.2,
  realization_rate: 0.75,
};

export const ASSUMPTION_META: Record<ROIKey, [AssumptionSource, string]> = {
  ai_systems: [CUSTOMER_INPUT, "Number of AI systems in scope (inventory count or best estimate)."],
  assessment_hours_per_system: [
    CUSTOMER_INPUT,
    "Person-hours to complete one risk/impact assessment today.",
  ],
  hourly_cost: [CUSTOMER_INPUT, "Blended fully loaded hourly cost of people doing governance work."],
  audit_prep_hours_per_year: [
    CUSTOMER_INPUT,
    "Person-hours per year assembling AI evidence for audits, customers and regulators.",
  ],
  approval_cycle_days: [
    CUSTOMER_INPUT,
    "Average calendar days from use-case intake to approval decision today.",
  ],
  assessments_per_system_per_year: [
    CUSTOMER_INPUT,
    "Assessments or reassessments per system per year (initial, change-triggered, periodic).",
  ],
  new_use_cases_per_year: [CUSTOMER_INPUT, "New AI use cases going through approval per year."],
  delay_cost_per_day: [
    CUSTOMER_ESTIMATE,
    "Business value lost per use case per day of approval delay. Default 0 excludes this benefit.",
  ],
  annual_incident_probability: [
    CUSTOMER_ESTIMATE,
    "Probability of at least one material AI incident in a year.",
  ],
  expected_incident_cost: [
    CUSTOMER_ESTIMATE,
    "Expected cost of a material AI incident (response, remediation, legal, customer impact).",
  ],
  aegis_annual_cost: [
    CUSTOMER_INPUT,
    "Annual AEGIS subscription from the commercial proposal (pricing is itself a hypothesis).",
  ],
  implementation_cost: [
    CUSTOMER_INPUT,
    "One-time cost, e.g. Governance Baseline fee and internal implementation effort.",
  ],
  assessment_effort_reduction: [
    HYPOTHESIS,
    "Share of assessment effort removed by agent-assisted, pre-populated assessments.",
  ],
  audit_prep_reduction: [
    HYPOTHESIS,
    "Share of audit-preparation effort removed by continuous evidence capture and evidence packs.",
  ],
  approval_cycle_reduction: [
    HYPOTHESIS,
    "Share of approval cycle time removed by triage, routing and complete submissions.",
  ],
  incident_likelihood_reduction: [
    HYPOTHESIS,
    "Relative reduction in material-incident likelihood from runtime guardrails, testing and oversight.",
  ],
  realization_rate: [
    HYPOTHESIS,
    "Share of modelled benefit realized in year 1, reflecting adoption ramp.",
  ],
};

export const FRACTIONS: ReadonlySet<ROIKey> = new Set([
  "annual_incident_probability",
  "assessment_effort_reduction",
  "audit_prep_reduction",
  "approval_cycle_reduction",
  "incident_likelihood_reduction",
  "realization_rate",
]);

/** Synthetic worked example (fictional organization; not a customer). */
export const EXAMPLE_INPUTS: ROIInputs = {
  ...ROI_DEFAULTS,
  ai_systems: 40,
  assessment_hours_per_system: 24,
  hourly_cost: 95,
  audit_prep_hours_per_year: 600,
  approval_cycle_days: 45,
  assessments_per_system_per_year: 1,
  new_use_cases_per_year: 12,
  delay_cost_per_day: 500,
  annual_incident_probability: 0.1,
  expected_incident_cost: 750_000,
  aegis_annual_cost: 75_000,
  implementation_cost: 30_000,
};

export class ROIInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ROIInputError";
  }
}

/** validate(): every field a non-negative number; fractions at most 1. */
export function validate(inp: Record<string, unknown>): void {
  for (const k of ROI_FIELDS) {
    const v = inp[k];
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new ROIInputError(`${k} must be a number, got ${JSON.stringify(v) ?? String(v)}`);
    }
    if (v < 0) throw new ROIInputError(`${k} must be >= 0, got ${v}`);
    if (FRACTIONS.has(k) && v > 1) {
      throw new ROIInputError(`${k} must be a fraction between 0 and 1, got ${v}`);
    }
  }
}

function r(x: number, nd = 2): number {
  // round(x + 0.0, nd); `+ 0` turns an exact -0 into 0 like Python's x + 0.0.
  return pyRound(x + 0, nd);
}

export type Unit = "currency" | "hours" | "days";

export interface LineItem {
  id: string;
  label: string;
  formula: string;
  value: number;
  unit: Unit;
  assumptions: ROIKey[];
}

export interface Assumption {
  key: ROIKey;
  value: number;
  /** Python repr of the value (int vs float), e.g. "40" or "0.4". */
  display: string;
  source: AssumptionSource;
  note: string;
}

export interface ROISummary {
  gross_annual_benefit: number;
  year1_realized_benefit: number;
  year1_cost: number;
  year1_net_benefit: number;
  year1_roi_pct: number | null;
  steady_state_net_benefit: number;
  steady_state_roi_pct: number | null;
  payback_months: number | null;
  hours_freed_per_year: number;
  efficiency_share_of_gross_pct: number | null;
}

export interface ROIResult {
  inputs: ROIInputs;
  line_items: LineItem[];
  summary: ROISummary;
  assumptions: Assumption[];
  hypotheses_to_validate: ROIKey[];
  disclaimer: string;
}

export interface CalculateOptions {
  /** Inputs Python holds as floats even when integer-valued (printed as `24.0`). */
  floatKeys?: Iterable<ROIKey>;
}

/** Python repr of an input value: ints for ai_systems/new_use_cases_per_year and integer values. */
export function inputRepr(key: ROIKey, v: number, floatKeys: ReadonlySet<ROIKey>): string {
  if (Number.isInteger(v) && !floatKeys.has(key)) return String(v);
  return pyFloatStr(v);
}

/** calculate(): a fully explained ROI estimate. Pure; throws ROIInputError on invalid input. */
export function calculate(inp: ROIInputs, opts: CalculateOptions = {}): ROIResult {
  validate(inp as unknown as Record<string, unknown>);
  const floatKeys = new Set(opts.floatKeys ?? []);
  const items: LineItem[] = [];
  const add = (
    id: string,
    label: string,
    formula: string,
    value: number,
    deps: ROIKey[],
    unit: Unit = "currency",
  ): number => {
    items.push({ id, label, formula, value: r(value), unit, assumptions: deps });
    return value;
  };

  const baseAssessHours = add(
    "L1",
    "Assessment effort today (hours/yr)",
    "ai_systems × assessment_hours_per_system × assessments_per_system_per_year",
    inp.ai_systems * inp.assessment_hours_per_system * inp.assessments_per_system_per_year,
    ["ai_systems", "assessment_hours_per_system", "assessments_per_system_per_year"],
    "hours",
  );
  const baseAssessCost = add(
    "L2",
    "Assessment cost today",
    "L1 × hourly_cost",
    baseAssessHours * inp.hourly_cost,
    ["hourly_cost"],
  );
  const assessHoursSaved = add(
    "L3",
    "Assessment hours saved",
    "L1 × assessment_effort_reduction",
    baseAssessHours * inp.assessment_effort_reduction,
    ["assessment_effort_reduction"],
    "hours",
  );
  const assessSaving = add(
    "L4",
    "Assessment cost saving",
    "L2 × assessment_effort_reduction",
    baseAssessCost * inp.assessment_effort_reduction,
    ["assessment_effort_reduction"],
  );
  const baseAuditCost = add(
    "L5",
    "Audit-preparation cost today",
    "audit_prep_hours_per_year × hourly_cost",
    inp.audit_prep_hours_per_year * inp.hourly_cost,
    ["audit_prep_hours_per_year", "hourly_cost"],
  );
  const auditHoursSaved = add(
    "L6",
    "Audit-preparation hours saved",
    "audit_prep_hours_per_year × audit_prep_reduction",
    inp.audit_prep_hours_per_year * inp.audit_prep_reduction,
    ["audit_prep_reduction"],
    "hours",
  );
  const auditSaving = add(
    "L7",
    "Audit-preparation cost saving",
    "L5 × audit_prep_reduction",
    baseAuditCost * inp.audit_prep_reduction,
    ["audit_prep_reduction"],
  );
  const daysSaved = add(
    "L8",
    "Approval days saved per use case",
    "approval_cycle_days × approval_cycle_reduction",
    inp.approval_cycle_days * inp.approval_cycle_reduction,
    ["approval_cycle_days", "approval_cycle_reduction"],
    "days",
  );
  const ttv = add(
    "L9",
    "Time-to-value benefit",
    "new_use_cases_per_year × L8 × delay_cost_per_day",
    inp.new_use_cases_per_year * daysSaved * inp.delay_cost_per_day,
    ["new_use_cases_per_year", "delay_cost_per_day"],
  );
  const baseLoss = add(
    "L10",
    "Expected annual incident loss today",
    "annual_incident_probability × expected_incident_cost",
    inp.annual_incident_probability * inp.expected_incident_cost,
    ["annual_incident_probability", "expected_incident_cost"],
  );
  const riskValue = add(
    "L11",
    "Risk-reduction value (expected)",
    "L10 × incident_likelihood_reduction",
    baseLoss * inp.incident_likelihood_reduction,
    ["incident_likelihood_reduction"],
  );
  const gross = add(
    "L12",
    "Gross modelled annual benefit",
    "L4 + L7 + L9 + L11",
    assessSaving + auditSaving + ttv + riskValue,
    [],
  );
  const realized = add(
    "L13",
    "Year-1 realized benefit",
    "L12 × realization_rate",
    gross * inp.realization_rate,
    ["realization_rate"],
  );
  const hoursFreed = add(
    "L14",
    "Governance hours freed per year (modelled)",
    "L3 + L6",
    assessHoursSaved + auditHoursSaved,
    [],
    "hours",
  );
  const year1Cost = add(
    "L15",
    "Year-1 cost",
    "aegis_annual_cost + implementation_cost",
    inp.aegis_annual_cost + inp.implementation_cost,
    ["aegis_annual_cost", "implementation_cost"],
  );
  const netY1 = add("L16", "Year-1 net benefit", "L13 − L15", realized - year1Cost, []);
  const netSteady = add(
    "L17",
    "Steady-state annual net benefit",
    "L12 − aegis_annual_cost",
    gross - inp.aegis_annual_cost,
    ["aegis_annual_cost"],
  );

  const roiY1 = year1Cost > 0 ? netY1 / year1Cost : null;
  const roiSteady = inp.aegis_annual_cost > 0 ? netSteady / inp.aegis_annual_cost : null;
  const payback = realized > 0 && year1Cost > 0 ? year1Cost / (realized / 12) : null;

  const assumptions: Assumption[] = ROI_FIELDS.map((key) => {
    const [source, note] = ASSUMPTION_META[key];
    return { key, value: inp[key], display: inputRepr(key, inp[key], floatKeys), source, note };
  });
  const hardSavings = assessSaving + auditSaving;
  return {
    inputs: Object.fromEntries(ROI_FIELDS.map((k) => [k, inp[k]])) as unknown as ROIInputs,
    line_items: items,
    summary: {
      gross_annual_benefit: r(gross),
      year1_realized_benefit: r(realized),
      year1_cost: r(year1Cost),
      year1_net_benefit: r(netY1),
      year1_roi_pct: roiY1 === null ? null : r(roiY1 * 100, 1),
      steady_state_net_benefit: r(netSteady),
      steady_state_roi_pct: roiSteady === null ? null : r(roiSteady * 100, 1),
      payback_months: payback === null ? null : r(payback, 1),
      hours_freed_per_year: r(hoursFreed, 1),
      efficiency_share_of_gross_pct: gross > 0 ? r((hardSavings / gross) * 100, 1) : null,
    },
    assumptions,
    hypotheses_to_validate: assumptions.filter((a) => a.source === HYPOTHESIS).map((a) => a.key),
    disclaimer: DISCLAIMER,
  };
}

export const SCENARIO_FACTORS = { conservative: 0.5, base: 1.0, optimistic: 1.5 } as const;
export type ScenarioName = keyof typeof SCENARIO_FACTORS;
const SCALED: readonly ROIKey[] = [
  "assessment_effort_reduction",
  "audit_prep_reduction",
  "approval_cycle_reduction",
  "incident_likelihood_reduction",
];

/** Conservative / base / optimistic: scale every effect hypothesis by 0.5 / 1.0 / 1.5 (capped at 0.9). */
export function scenarios(inp: ROIInputs, opts: CalculateOptions = {}): Record<ScenarioName, ROIResult> {
  const out = {} as Record<ScenarioName, ROIResult>;
  for (const [name, k] of Object.entries(SCENARIO_FACTORS) as Array<[ScenarioName, number]>) {
    const d: ROIInputs = { ...inp };
    for (const key of SCALED) d[key] = Math.min(0.9, d[key] * k);
    out[name] = calculate(d, opts);
  }
  return out;
}

// --------------------------------------------------------------------------- rendering

/** f"{v:,.0f}" — round half-even on the exact value, thousands separators. */
export function fmtCurrency(v: number): string {
  const n = pyRound(v, 0);
  const neg = n < 0 || Object.is(n, -0);
  return (neg ? "-" : "") + fmtThousands(Math.abs(n));
}

/** f"{v:,.1f}" */
export function fmtOneDecimal(v: number): string {
  const n = pyRound(v, 1);
  const neg = n < 0 || Object.is(n, -0);
  const [i = "0", f = "0"] = Math.abs(n).toFixed(1).split(".");
  return (neg ? "-" : "") + fmtThousands(Number(i)) + "." + f;
}

/** _fmt(v, unit) */
export function fmt(v: number | null, unit: Unit | ""): string {
  if (v === null) return "n/a";
  if (unit === "currency") return fmtCurrency(v);
  if (unit === "hours") return `${fmtOneDecimal(v)} h`;
  if (unit === "days") return `${fmtOneDecimal(v)} d`;
  return pyFloatStr(v);
}

const pct = (v: number | null) => (v === null ? "n/a" : `${pyFloatStr(v)}%`);

export function summaryRows(s: ROISummary): Array<[string, string]> {
  return [
    ["Gross modelled annual benefit", fmt(s.gross_annual_benefit, "currency")],
    ["Year-1 realized benefit", fmt(s.year1_realized_benefit, "currency")],
    ["Year-1 cost", fmt(s.year1_cost, "currency")],
    ["Year-1 net benefit", fmt(s.year1_net_benefit, "currency")],
    ["Year-1 ROI", pct(s.year1_roi_pct)],
    ["Steady-state annual net benefit", fmt(s.steady_state_net_benefit, "currency")],
    ["Steady-state ROI", pct(s.steady_state_roi_pct)],
    [
      "Payback",
      s.payback_months === null ? "n/a" : `${pyFloatStr(s.payback_months)} months`,
    ],
    ["Governance hours freed (modelled)", fmt(s.hours_freed_per_year, "hours")],
    ["Efficiency savings share of gross benefit", pct(s.efficiency_share_of_gross_pct)],
  ];
}

/** to_markdown(result, title, currency) */
export function toMarkdown(
  result: ROIResult,
  title = "AEGIS ROI estimate",
  currency = "USD",
): string {
  const lines = [
    `# ${title}`,
    "",
    `> ${result.disclaimer}`,
    "",
    `Currency: ${currency}. All values per year unless stated.`,
    "",
    "## Summary",
    "",
    "| Measure | Value |",
    "|---|---|",
  ];
  for (const [a, b] of summaryRows(result.summary)) lines.push(`| ${a} | ${b} |`);
  lines.push("", "## Calculation", "", "| Line | Item | Formula | Value |", "|---|---|---|---|");
  for (const it of result.line_items) {
    lines.push(`| ${it.id} | ${it.label} | \`${it.formula}\` | ${fmt(it.value, it.unit)} |`);
  }
  lines.push(
    "",
    "## Assumptions",
    "",
    "| Assumption | Value | Source | Note |",
    "|---|---|---|---|",
  );
  for (const a of result.assumptions) {
    lines.push(`| \`${a.key}\` | ${a.display} | ${a.source} | ${a.note} |`);
  }
  lines.push(
    "",
    "Hypotheses to validate in pilots: " +
      result.hypotheses_to_validate.map((k) => `\`${k}\``).join(", "),
    "",
  );
  return lines.join("\n");
}

function csvField(s: string): string {
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** to_csv(result): csv.writer(lineterminator="\n"). */
export function toCsv(result: ROIResult): string {
  const rows: string[][] = [["section", "id", "label", "formula", "value", "unit", "source", "note"]];
  for (const a of result.assumptions) {
    rows.push(["assumption", a.key, a.key, "", a.display, "", a.source, a.note]);
  }
  for (const it of result.line_items) {
    rows.push([
      "calculation",
      it.id,
      it.label,
      it.formula,
      pyFloatStr(it.value),
      it.unit,
      "derived",
      it.assumptions.length ? "depends on: " + it.assumptions.join(", ") : "derived",
    ]);
  }
  for (const [k, v] of Object.entries(result.summary) as Array<[string, number | null]>) {
    rows.push(["summary", k, k, "", v === null ? "" : pyFloatStr(v), "", "derived", ""]);
  }
  return rows.map((row) => row.map(csvField).join(",")).join("\n") + "\n";
}

/** The CLI --scenarios Markdown table (main() in roi_calculator.py). */
export function scenariosMarkdown(sc: Record<ScenarioName, ROIResult>): string {
  const lines = [
    "| Scenario | Gross benefit | Year-1 net | Year-1 ROI | Payback (months) |",
    "|---|---|---|---|---|",
  ];
  for (const [k, res] of Object.entries(sc) as Array<[ScenarioName, ROIResult]>) {
    const s = res.summary;
    const py = (v: number | null) => (v === null ? "None" : pyFloatStr(v));
    lines.push(
      `| ${k} | ${fmtCurrency(s.gross_annual_benefit)} | ${fmtCurrency(s.year1_net_benefit)} | ` +
        `${py(s.year1_roi_pct)}% | ${py(s.payback_months)} |`,
    );
  }
  return lines.join("\n") + "\n";
}
