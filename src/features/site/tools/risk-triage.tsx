import { useEffect, useRef, useState, type FormEvent } from "react";
import { EvidenceBadge } from "../ui";
import { calculateRiskTier, type RiskProfile, type RiskTierResult } from "../engines/risk-tier";
import {
  CitedControls,
  FormStatus,
  KeyValues,
  ResultTable,
  ToolFields,
  type ToolFieldDef,
} from "./tool-fields";

const YES_NO_UNKNOWN = [
  ["", "Not sure"],
  ["yes", "Yes"],
  ["no", "No"],
] as const;

/** RISK_TRIAGE_FIELDS from platform/app/website/veritrail_website/tools.py. */
const RISK_TRIAGE_FIELDS: readonly ToolFieldDef[] = [
  {
    name: "name",
    label: "AI system or use-case name",
    type: "text",
    required: true,
    hint: "Use an internal project name. Do not enter personal data.",
  },
  {
    name: "purpose",
    label: "Intended purpose",
    type: "textarea",
    rows: 3,
    hint: "One or two sentences about what the system does and for whom.",
  },
  {
    name: "decision_impact",
    label: "Does its output inform or make decisions about people?",
    type: "select",
    options: [
      ["", "Not sure"],
      ["none", "No — no decisions about people"],
      ["advisory", "Advisory — a human decides"],
      ["material", "Material — strongly shapes decisions"],
      ["automated_decision", "Automated decision"],
    ],
  },
  {
    name: "affected_parties",
    label: "Who is affected by its outputs?",
    type: "select",
    options: [
      ["", "Not sure"],
      ["internal", "Internal staff"],
      ["customers", "Customers"],
      ["public", "General public"],
      ["vulnerable", "Vulnerable people (e.g. patients, minors)"],
    ],
  },
  {
    name: "data_sensitivity",
    label: "Most sensitive data it processes",
    type: "select",
    options: [
      ["", "Not sure"],
      ["public", "Public"],
      ["internal", "Internal"],
      ["confidential", "Confidential"],
      ["personal", "Personal data"],
      ["special_category", "Special-category data (health, biometric, …)"],
    ],
  },
  {
    name: "autonomy",
    label: "How autonomous is it?",
    type: "select",
    options: [
      ["", "Not sure"],
      ["none", "No autonomy — produces content only"],
      ["suggests", "Suggests actions"],
      ["acts_with_approval", "Acts after human approval"],
      ["acts_autonomously", "Acts autonomously"],
    ],
  },
  {
    name: "domain_category",
    label: "Domain",
    type: "select",
    options: [
      ["", "Not sure"],
      ["customer_service", "Customer service"],
      ["internal_productivity", "Internal productivity"],
      ["credit", "Credit / lending"],
      ["insurance", "Insurance pricing or underwriting"],
      ["employment", "Employment / HR"],
      ["education", "Education / training"],
      ["healthcare", "Healthcare"],
      ["financial_services", "Other financial services"],
      ["public_sector", "Public sector services"],
      ["essential_services", "Access to essential services"],
      ["biometric", "Biometrics"],
      ["critical_infrastructure", "Critical infrastructure"],
      ["law_enforcement", "Law enforcement"],
      ["migration", "Migration / border control"],
      ["justice", "Justice / democratic processes"],
      ["other", "Other"],
    ],
  },
  {
    name: "tools",
    label: "Tools, APIs or databases it can use",
    type: "text",
    hint: "Comma-separated, e.g. crm_read, send_email, issue_refund. Leave blank if none.",
  },
  {
    name: "external_actions",
    label: "Can it act outside your organization (send emails, payments, posts)?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "eu_exposure",
    label: "Is it placed on the EU market or does it affect people in the EU?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "vendor_model",
    label: "Does it use a third-party model or vendor AI product?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "genai",
    label: "Is it a generative AI / LLM-based system?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "environment",
    label: "Environment",
    type: "select",
    options: [
      ["", "Not sure"],
      ["development", "Development"],
      ["staging", "Staging"],
      ["production", "Production"],
    ],
  },
];

function splitList(v: string): string[] {
  return v
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function yesNo(v: string | undefined): boolean | undefined {
  return v === "yes" ? true : v === "no" ? false : undefined;
}

/** Same profile shape risk-triage.js POSTed to /api/risk-tier. */
function buildProfile(v: Record<string, string>): RiskProfile {
  const p: RiskProfile = {};
  for (const k of [
    "name",
    "purpose",
    "decision_impact",
    "affected_parties",
    "data_sensitivity",
    "autonomy",
    "domain_category",
    "environment",
  ]) {
    if (v[k]) p[k] = v[k];
  }
  if (v["tools"]) p.tools = splitList(v["tools"]);
  for (const k of ["external_actions", "eu_exposure", "vendor_model", "genai"]) {
    const b = yesNo(v[k]);
    if (b !== undefined) p[k] = b;
  }
  return p;
}

const NAME_ERROR = "Enter a name for the AI system or use case.";

/** Preliminary AI use-case risk triage (runs entirely in the browser). */
export function RiskTriageTool() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; kind: "" | "error" | "success" }>({
    text: "",
    kind: "",
  });
  const [result, setResult] = useState<RiskTierResult | null>(null);
  const [runId, setRunId] = useState(0);
  const controls = useRef(new Map<string, HTMLElement>());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (runId > 0) headingRef.current?.focus();
  }, [runId]);

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const v: Record<string, string> = {};
    for (const [k, raw] of Object.entries(values)) {
      const t = raw.trim();
      if (t) v[k] = t;
    }
    if (!v["name"]) {
      setErrors({ name: NAME_ERROR });
      controls.current.get("name")?.focus();
      return;
    }
    setErrors({});
    try {
      const r = calculateRiskTier(buildProfile(v));
      setStatus({ text: "", kind: "" });
      setResult(r);
      setRunId((n) => n + 1);
    } catch (e) {
      setStatus({ text: (e as Error).message || "Please check your inputs.", kind: "error" });
    }
  };

  return (
    <section className="tool" id="risk-triage" data-tool="risk-triage" aria-labelledby="rt-heading">
      <h2 id="rt-heading">Describe the AI system</h2>
      <p className="small">
        Your answers produce a <strong>preliminary</strong> risk tier labelled <em>Inferred</em>. A
        tier only becomes authoritative when an accountable approver confirms it.
      </p>
      <form className="tool-form" id="rt-form" noValidate onSubmit={onSubmit}>
        <ToolFields
          prefix="rt"
          fields={RISK_TRIAGE_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={(name, el) => {
            if (el) controls.current.set(name, el);
            else controls.current.delete(name);
          }}
        />
        <button className="btn btn-primary" type="submit">
          Calculate preliminary tier
        </button>
        <FormStatus id="rt-status" text={status.text} kind={status.kind} />
      </form>
      {result && (
        <section className="tool-result" id="rt-result" aria-labelledby="rt-result-heading">
          <h2 id="rt-result-heading" tabIndex={-1} ref={headingRef}>
            Preliminary risk tier
          </h2>
          <RiskResult d={result} />
        </section>
      )}
    </section>
  );
}

function RiskResult({ d }: { d: RiskTierResult }) {
  return (
    <div className="rt-output">
      <p>
        Preliminary tier: <strong className="tier">{d.tier}</strong>{" "}
        <EvidenceBadge status={d.evidence_status || "Inferred"} />
        {d.provisional ? " (provisional — key facts missing)" : ""}
      </p>
      <p className="notice notice--warning">
        This tier is preliminary and inferred from your answers. It requires confirmation by an
        accountable approver; changing a confirmed tier requires human approval.
      </p>
      <KeyValues
        pairs={[
          ["Score", d.score],
          ["Approval authority", d.approval_authority],
          [
            "Review cadence",
            d.review_cadence_months
              ? `Every ${d.review_cadence_months} months`
              : "Not applicable — do not proceed without legal review",
          ],
          ["Required assessment modules", d.required_modules.join(", ")],
        ]}
      />
      {d.triggers.length > 0 && (
        <>
          <h3>Triggers</h3>
          <ul>
            {d.triggers.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}
      {d.factors.length > 0 && (
        <>
          <h3>Scoring factors</h3>
          <ResultTable
            label="Scoring factors"
            headers={["Factor", "Value", "Points", "Citation"]}
            rows={d.factors.map((f) => [
              f.factor.replace(/_/g, " "),
              String(f.value),
              `+${f.points}`,
              f.citation,
            ])}
          />
        </>
      )}
      {d.missing_fields.length > 0 && (
        <>
          <h3>Missing information</h3>
          <ul>
            {(d.clarifying_questions.length ? d.clarifying_questions : d.missing_fields).map(
              (q) => (
                <li key={q}>
                  <EvidenceBadge status="Missing evidence" /> {q}
                </li>
              ),
            )}
          </ul>
        </>
      )}
      <h3>Rationale</h3>
      <p>{d.rationale}</p>
      <CitedControls ids={d.citation_ids} prefix="VERITRAIL controls cited: " />
      {d.method && (
        <p className="small">
          Method: {d.method}. EU AI Act category screens are indicative triggers for legal review,
          not a legal classification.
        </p>
      )}
    </div>
  );
}
