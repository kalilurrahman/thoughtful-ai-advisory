import { useEffect, useRef, useState, type FormEvent } from "react";
import { EvidenceBadge } from "../ui";
import { track } from "@/features/platform/analytics";
import {
  OBLIGATION_AREAS,
  checkActReadiness,
  type ActProfile,
  type ActReadinessResult,
  type ReadinessAnswer,
} from "../engines/eu-ai-act-readiness";
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

const READINESS_ANSWERS = [
  ["", "Not sure"],
  ["yes", "Yes — in place and evidenced"],
  ["partial", "Partly — in progress or undocumented"],
  ["no", "No"],
] as const;

const SCREENING_FIELDS: readonly ToolFieldDef[] = [
  {
    name: "name",
    label: "AI system name",
    type: "text",
    required: true,
    hint: "Use an internal name. Do not enter personal data.",
  },
  {
    name: "purpose",
    label: "Intended purpose",
    type: "textarea",
    rows: 2,
    hint: "One or two sentences. Screened against prohibited-practice terms for legal review.",
  },
  {
    name: "role",
    label: "Your role for this system",
    type: "select",
    options: [
      ["", "Not sure — record the facts for legal review"],
      ["provider", "Provider — we develop it or place it on the market under our name"],
      ["deployer", "Deployer — we use a system someone else provides"],
      ["both", "Both — we build it and use it"],
    ],
  },
  {
    name: "eu_exposure",
    label: "Is it placed on the EU market or does it affect people in the EU?",
    type: "select",
    options: YES_NO_UNKNOWN,
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
    name: "genai",
    label: "Is it a generative AI / LLM-based system?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "interacts_with_people",
    label: "Do people interact with it directly (chat, voice, assistant)?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "synthetic_content",
    label: "Does it generate synthetic text, images, audio or video for people to see?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
];

const OBLIGATION_FIELDS: readonly ToolFieldDef[] = OBLIGATION_AREAS.map((o) => ({
  name: o.key,
  label: `${o.area} (${o.article}): ${o.question}`,
  type: "select",
  options: READINESS_ANSWERS,
  hint: `Controls ${o.controls.join(", ")}.`,
}));

function buildProfile(v: Record<string, string>): ActProfile {
  const p: ActProfile = {};
  for (const k of [
    "name",
    "purpose",
    "role",
    "eu_exposure",
    "domain_category",
    "decision_impact",
    "genai",
    "interacts_with_people",
    "synthetic_content",
  ] as const) {
    if (v[k]) p[k] = v[k];
  }
  for (const o of OBLIGATION_AREAS) {
    const ans = v[o.key];
    if (ans === "yes" || ans === "partial" || ans === "no") p[o.key] = ans as ReadinessAnswer;
  }
  return p;
}

const NAME_ERROR = "Enter a name for the AI system.";

/** EU AI Act readiness checker (runs entirely in the browser; nothing is stored). */
export function EuAiActReadinessCheckerTool() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; kind: "" | "error" | "success" }>({
    text: "",
    kind: "",
  });
  const [result, setResult] = useState<ActReadinessResult | null>(null);
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
      const r = checkActReadiness(buildProfile(v));
      track("tool_use", {
        tool: "eu-ai-act-readiness-checker",
        role: r.screening.role || "unknown",
        high_risk_like: r.screening.high_risk_like,
      });
      setStatus({ text: "", kind: "" });
      setResult(r);
      setRunId((n) => n + 1);
    } catch (e) {
      setStatus({ text: (e as Error).message || "Please check your inputs.", kind: "error" });
    }
  };

  const controlRef = (name: string, el: HTMLElement | null) => {
    if (el) controls.current.set(name, el);
    else controls.current.delete(name);
  };

  return (
    <section
      className="tool"
      id="eu-ai-act-readiness-checker"
      data-tool="eu-ai-act-readiness-checker"
      aria-labelledby="eu-heading"
    >
      <h2 id="eu-heading">Role and screening</h2>
      <p className="small">
        The checker organises readiness work by role and obligation area. It does{" "}
        <strong>not</strong> classify your system under the Act or make a compliance determination;
        screens are triggers for legal review. Nothing you enter is stored.
      </p>
      <form className="tool-form" id="eu-form" noValidate onSubmit={onSubmit}>
        <ToolFields
          prefix="eu"
          fields={SCREENING_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={controlRef}
        />
        <h3>Obligation areas</h3>
        <p className="small">
          Answer what you can. Areas that do not apply to your role or facts are shown as voluntary
          or not triggered, so unanswered ones do not count against you.
        </p>
        <ToolFields
          prefix="eu"
          fields={OBLIGATION_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={controlRef}
        />
        <button className="btn btn-primary" type="submit">
          Build the readiness view
        </button>
        <FormStatus id="eu-status" text={status.text} kind={status.kind} />
      </form>
      {result && (
        <section className="tool-result" id="eu-result" aria-labelledby="eu-result-heading">
          <h2 id="eu-result-heading" tabIndex={-1} ref={headingRef}>
            Readiness view
          </h2>
          <ActResult d={result} />
        </section>
      )}
    </section>
  );
}

function roleLabel(role: string): string {
  return role === "provider"
    ? "Provider"
    : role === "deployer"
      ? "Deployer"
      : role === "both"
        ? "Provider and deployer"
        : "Not determined — record the facts for legal review";
}

function ActResult({ d }: { d: ActReadinessResult }) {
  const s = d.screening;
  return (
    <div className="rt-output">
      <p>
        <strong className="tier">{d.readiness_pct}% ready</strong>{" "}
        <EvidenceBadge status={d.evidence_status} />
        {` across ${d.applicable_count} applicable area${d.applicable_count === 1 ? "" : "s"}`}
      </p>
      {s.prohibited_flags.length > 0 && (
        <p className="notice notice--error">
          The stated purpose matches a prohibited-practice screen ({s.prohibited_flags.join("; ")}
          ). Obtain legal review before proceeding (AO-10).
        </p>
      )}
      <p className="notice notice--warning">
        Indicative readiness only. This is not a legal classification and not a compliance
        determination. Timelines were amended by Regulation (EU) 2026/1744; verify all dates against
        the current EUR-Lex text.
      </p>
      <KeyValues
        pairs={[
          ["System", d.name],
          ["Role", roleLabel(s.role)],
          [
            "EU exposure",
            s.eu_exposure === "yes" ? "Yes" : s.eu_exposure === "no" ? "No" : "Not stated",
          ],
          [
            "High-risk-like screen",
            s.high_risk_like
              ? `Triggered: ${s.high_risk_reasons.join("; ")}`
              : "Not triggered on these facts",
          ],
          [
            "Transparency duties (Art. 50)",
            s.transparency_duties ? "Likely" : "Not triggered on these facts",
          ],
          ["Legal review recommended", d.requires_legal_review ? "Yes" : "Not on these facts"],
        ]}
      />
      <h3>Obligation areas</h3>
      <ResultTable
        label="EU AI Act obligation areas"
        headers={["Area", "Article", "Applicability", "Answer", "Status", "Controls"]}
        rows={d.obligations.map((o) => [
          o.area,
          o.article,
          o.applicability,
          o.answer === ""
            ? "Not sure"
            : o.answer === "partial"
              ? "Partly"
              : o.answer === "yes"
                ? "Yes"
                : "No",
          <EvidenceBadge key={o.key} status={o.status} />,
          o.controls.join(", "),
        ])}
      />
      {d.next_steps.length > 0 && (
        <>
          <h3>Next steps</h3>
          <ol>
            {d.next_steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
        </>
      )}
      <h3>Rationale</h3>
      <p>{d.rationale}</p>
      <CitedControls ids={d.citation_ids} prefix="VERITRAIL controls cited: " />
      <p className="small">Method: {d.method}.</p>
    </div>
  );
}
