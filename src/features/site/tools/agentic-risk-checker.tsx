import { useEffect, useRef, useState, type FormEvent } from "react";
import { EvidenceBadge } from "../ui";
import { track } from "@/features/platform/analytics";
import {
  AGENT_AREAS,
  checkAgentRisk,
  type AgentProfile,
  type AgentRiskResult,
  type AreaAnswer,
} from "../engines/agentic-risk";
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

const AREA_ANSWERS = [
  ["", "Not sure"],
  ["yes", "Yes — in place and evidenced"],
  ["partial", "Partly — in progress or untested"],
  ["no", "No"],
] as const;

const CONTEXT_FIELDS: readonly ToolFieldDef[] = [
  {
    name: "name",
    label: "Agent name",
    type: "text",
    required: true,
    hint: "Use an internal name. Do not enter personal data.",
  },
  {
    name: "purpose",
    label: "What the agent is for",
    type: "textarea",
    rows: 2,
    hint: "One or two sentences on its task and who relies on it.",
  },
  {
    name: "autonomy",
    label: "How autonomous is it?",
    type: "select",
    options: [
      ["", "Not sure"],
      ["suggests", "Suggests actions — a person carries them out"],
      ["acts_with_approval", "Acts after human approval"],
      ["acts_autonomously", "Acts autonomously"],
    ],
  },
  {
    name: "external_actions",
    label: "Can it act outside your organisation (send email, pay, post, call external APIs)?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "untrusted_input",
    label: "Does it read untrusted content (web pages, inbound email, uploaded documents)?",
    type: "select",
    options: YES_NO_UNKNOWN,
  },
  {
    name: "tools",
    label: "Tools, APIs or data stores it can call",
    type: "text",
    hint: "Comma-separated, e.g. crm_read, send_email, issue_refund. Write-capable tools raise the bar.",
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

const AREA_FIELDS: readonly ToolFieldDef[] = AGENT_AREAS.map((a) => ({
  name: a.key,
  label: `${a.area}: ${a.question}`,
  type: "select",
  options: AREA_ANSWERS,
  hint: `Controls ${a.controls.join(", ")}.`,
}));

function splitList(v: string): string[] {
  return v
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function buildProfile(v: Record<string, string>): AgentProfile {
  const p: AgentProfile = {};
  for (const k of [
    "name",
    "purpose",
    "autonomy",
    "external_actions",
    "untrusted_input",
    "environment",
  ] as const) {
    if (v[k]) p[k] = v[k];
  }
  if (v["tools"]) p.tools = splitList(v["tools"]);
  for (const a of AGENT_AREAS) {
    const ans = v[a.key];
    if (ans === "yes" || ans === "partial" || ans === "no") p[a.key] = ans as AreaAnswer;
  }
  return p;
}

const NAME_ERROR = "Enter a name for the agent.";

/** Agentic AI risk checker (runs entirely in the browser; nothing is stored). */
export function AgenticRiskCheckerTool() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; kind: "" | "error" | "success" }>({
    text: "",
    kind: "",
  });
  const [result, setResult] = useState<AgentRiskResult | null>(null);
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
      const r = checkAgentRisk(buildProfile(v));
      track("tool_use", { tool: "agentic-risk-checker", posture: r.posture });
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
      id="agentic-risk-checker"
      data-tool="agentic-risk-checker"
      aria-labelledby="ar-heading"
    >
      <h2 id="ar-heading">Describe the agent</h2>
      <p className="small">
        Your answers produce an <strong>indicative</strong> posture labelled <em>Inferred</em>. A
        "Yes" is your own assertion until the evidence behind it is reviewed. Nothing you enter is
        stored.
      </p>
      <form className="tool-form" id="ar-form" noValidate onSubmit={onSubmit}>
        <ToolFields
          prefix="ar"
          fields={CONTEXT_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={controlRef}
        />
        <h3>Seven areas</h3>
        <ToolFields
          prefix="ar"
          fields={AREA_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={controlRef}
        />
        <button className="btn btn-primary" type="submit">
          Check the agent
        </button>
        <FormStatus id="ar-status" text={status.text} kind={status.kind} />
      </form>
      {result && (
        <section className="tool-result" id="ar-result" aria-labelledby="ar-result-heading">
          <h2 id="ar-result-heading" tabIndex={-1} ref={headingRef}>
            Agent posture
          </h2>
          <AgentResult d={result} />
        </section>
      )}
    </section>
  );
}

function AgentResult({ d }: { d: AgentRiskResult }) {
  return (
    <div className="rt-output">
      <p>
        <strong className="tier">{d.posture}</strong> <EvidenceBadge status={d.evidence_status} />
      </p>
      <p className="notice notice--warning">
        This posture is inferred from your answers and requires confirmation against evidence by an
        accountable reviewer. It is not a security assessment.
      </p>
      <KeyValues
        pairs={[
          ["Agent", d.name],
          ["Readiness", `${d.readiness_pct}% (${d.score} of ${d.max_score} points)`],
          ["Exposure", d.exposure.length ? d.exposure.join("; ") : "Not stated"],
          ["Critical gaps", d.critical_gaps.length ? d.critical_gaps.join(", ") : "None"],
        ]}
      />
      <h3>Areas</h3>
      <ResultTable
        label="Agent risk areas"
        headers={["Area", "Answer", "Status", "Controls"]}
        rows={d.areas.map((a) => [
          a.critical ? `${a.area} (critical for this agent)` : a.area,
          a.answer === ""
            ? "Not sure"
            : a.answer === "partial"
              ? "Partly"
              : a.answer === "yes"
                ? "Yes"
                : "No",
          <EvidenceBadge key={a.key} status={a.status} />,
          a.controls.join(", "),
        ])}
      />
      {d.next_actions.length > 0 && (
        <>
          <h3>Next actions</h3>
          <ol>
            {d.next_actions.map((t) => (
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
