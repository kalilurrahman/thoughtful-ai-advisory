import { useEffect, useRef, useState, type FormEvent } from "react";
import { EvidenceBadge } from "../ui";
import { advise, type AdviseResult, type RiskDimension } from "../engines/shield";
import { renderAdviceMarkdown } from "../../platform/policy-engine/shield-render";
import { downloadBlob } from "../../platform/reports/exporters";
import {
  CitedControls,
  FormStatus,
  KeyValues,
  ResultTable,
  ToolFields,
  type ToolFieldDef,
} from "./tool-fields";

/** GUARDRAIL_FIELDS from platform/app/website/aegis_website/tools.py. */
const GUARDRAIL_FIELDS: readonly ToolFieldDef[] = [
  {
    name: "app_name",
    label: "Application or agent name",
    type: "text",
    required: true,
    hint: "Use an internal project name. Do not enter personal data, secrets or credentials.",
  },
  { name: "purpose", label: "Intended purpose and context of use", type: "textarea", rows: 3 },
  {
    name: "users",
    label: "User groups or business functions served",
    type: "text",
    hint: "Comma-separated, e.g. customer support agents, claims handlers.",
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
  { name: "model", label: "Model (name and version)", type: "text" },
  { name: "vendor", label: "Model vendor or hosting provider", type: "text" },
  {
    name: "tools",
    label: "Tools, APIs, plugins and databases",
    type: "textarea",
    rows: 4,
    hint:
      "One per line as name:operation, where operation is read, write, delete, external_send, payment or export. " +
      "Example: crm_lookup:read. If you omit the operation AEGIS infers it from the name and labels it Inferred.",
  },
  {
    name: "data_categories",
    label: "Data categories processed",
    type: "text",
    hint: "Comma-separated, e.g. customer contact details, order history.",
  },
  {
    name: "data_sensitivity",
    label: "Highest data sensitivity",
    type: "select",
    options: [
      ["", "Not sure"],
      ["public", "Public"],
      ["internal", "Internal"],
      ["confidential", "Confidential"],
      ["personal", "Personal data"],
      ["special_category", "Special-category data"],
    ],
  },
  {
    name: "autonomy",
    label: "Autonomy",
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
    name: "human_approval_model",
    label: "Human-approval model",
    type: "select",
    options: [
      ["", "Not sure"],
      ["none", "None"],
      ["per_action", "Every action is approved"],
      ["high_impact_only", "High-impact actions only"],
      ["threshold", "Above a threshold (e.g. amount)"],
      ["batch_review", "Batch review after the fact"],
    ],
  },
  {
    name: "environment",
    label: "Deployment environment",
    type: "select",
    options: [
      ["", "Not sure"],
      ["dev", "Development"],
      ["test", "Test"],
      ["staging", "Staging"],
      ["production", "Production"],
    ],
  },
  {
    name: "risk_tier",
    label: "Assigned risk tier (if any)",
    type: "select",
    options: [
      ["", "Not assigned"],
      ["Low", "Low"],
      ["Medium", "Medium"],
      ["High", "High"],
      ["Prohibited-review", "Prohibited-review"],
    ],
  },
  {
    name: "regulatory_obligations",
    label: "Regulatory obligations",
    type: "text",
    hint: "Comma-separated, e.g. GDPR, EU AI Act, HIPAA, PCI DSS.",
  },
  {
    name: "existing_controls",
    label: "Existing security controls",
    type: "text",
    hint: "Comma-separated, e.g. SSO, DLP, SIEM, secrets manager, red-team testing.",
  },
];

function splitList(v: string): string[] {
  return v
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** "crm_lookup:read\nissue_refund:payment" -> [{name, operation?}] (tools-common.js parseTools). */
function parseTools(text: string): Array<{ name: string; operation?: string }> {
  return text
    .split(/\n|;/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = /^([^:]+?)\s*:\s*([A-Za-z_]+)\s*$/.exec(l);
      return m && m[1] && m[2]
        ? { name: m[1].trim(), operation: m[2].trim().toLowerCase() }
        : { name: l };
    });
}

/** Same profile shape guardrail.js POSTed to /api/shield/advise. */
function buildProfile(v: Record<string, string>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  for (const k of [
    "app_name",
    "purpose",
    "affected_parties",
    "model",
    "vendor",
    "data_sensitivity",
    "autonomy",
    "human_approval_model",
    "environment",
    "risk_tier",
  ]) {
    if (v[k]) p[k] = v[k];
  }
  for (const k of ["users", "data_categories", "regulatory_obligations", "existing_controls"]) {
    const val = v[k];
    if (val) p[k] = splitList(val);
  }
  if (v["tools"]) p["tools"] = parseTools(v["tools"]);
  return p;
}

function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

type StatusKind = "" | "error" | "success";

/** Runtime guardrail generator: profile -> risk profile, tool matrix and draft policy YAML. */
export function GuardrailGeneratorTool() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ text: string; kind: StatusKind }>({ text: "", kind: "" });
  const [copyStatus, setCopyStatus] = useState<{ text: string; kind: StatusKind }>({
    text: "",
    kind: "",
  });
  const [result, setResult] = useState<AdviseResult | null>(null);
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
    if (!v["app_name"]) {
      setErrors({ app_name: "Enter the application or agent name." });
      controls.current.get("app_name")?.focus();
      return;
    }
    setErrors({});
    try {
      const out = advise(buildProfile(v));
      setStatus({ text: "", kind: "" });
      setCopyStatus({ text: "", kind: "" });
      setResult(out);
      setRunId((n) => n + 1);
    } catch (e) {
      setStatus({ text: `Invalid profile: ${(e as Error).message}`, kind: "error" });
    }
  };

  const policyText = result
    ? result.policy_yaml ||
      (result.policy ? JSON.stringify(result.policy, null, 2) : "No policy returned.")
    : "";
  const fileBase = result?.policy.policy_id || "aegis-draft-policy";

  const reportTitle = `AEGIS Runtime Shield Advisor — ${String(result?.app["app_name"] ?? "")}`;

  const onDownloadMarkdown = () => {
    if (!result) return;
    downloadText(renderAdviceMarkdown(result), `${fileBase}_advisor.md`, "text/markdown");
    setCopyStatus({ text: "Markdown report downloaded (draft, for review).", kind: "success" });
  };

  const onDownloadPdf = () => {
    if (!result) return;
    setCopyStatus({ text: "Preparing PDF…", kind: "" });
    const md = renderAdviceMarkdown(result);
    // jsPDF is loaded on demand so it stays out of the initial bundle.
    import("../../platform/reports/pdf")
      .then(({ markdownToPdfBlob }) => {
        downloadBlob(markdownToPdfBlob(md, { title: reportTitle }), `${fileBase}_advisor.pdf`);
        setCopyStatus({ text: "PDF report downloaded (draft, for review).", kind: "success" });
      })
      .catch(() =>
        setCopyStatus({
          text: "The PDF could not be generated in this browser; download the Markdown report instead.",
          kind: "error",
        }),
      );
  };

  const onCopy = () => {
    const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    const fail = () =>
      setCopyStatus({
        text: "Copy is not available in this browser; select the text and copy it manually.",
        kind: "error",
      });
    if (!clip?.writeText) {
      fail();
      return;
    }
    clip
      .writeText(policyText)
      .then(
        () => setCopyStatus({ text: "Policy YAML copied to the clipboard.", kind: "success" }),
        fail,
      );
  };

  return (
    <section
      className="tool"
      id="guardrail-generator"
      data-tool="guardrail-generator"
      aria-labelledby="gg-heading"
    >
      <h2 id="gg-heading">Describe your LLM application or agent</h2>
      <p className="small">
        The output is a <strong>draft</strong> starting point for review by your security and
        governance teams. Changing production runtime policy requires human approval.
      </p>
      <form className="tool-form" id="gg-form" noValidate onSubmit={onSubmit}>
        <ToolFields
          prefix="gg"
          fields={GUARDRAIL_FIELDS}
          values={values}
          errors={errors}
          onChange={onChange}
          controlRef={(name, el) => {
            if (el) controls.current.set(name, el);
            else controls.current.delete(name);
          }}
        />
        <button className="btn btn-primary" type="submit">
          Generate draft guardrails
        </button>
        <FormStatus id="gg-status" text={status.text} kind={status.kind} />
      </form>
      {result && (
        <section className="tool-result" id="gg-result" aria-labelledby="gg-result-heading">
          <h2 id="gg-result-heading" tabIndex={-1} ref={headingRef}>
            Draft guardrails
          </h2>
          <GuardrailResult data={result} />
          <h3 id="gg-policy-heading">Draft policy (YAML)</h3>
          <div className="code-actions">
            <button className="btn btn-secondary" type="button" id="gg-copy" onClick={onCopy}>
              Copy YAML
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              id="gg-download"
              onClick={() => downloadText(policyText, `${fileBase}.yaml`, "application/yaml")}
            >
              Download YAML
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              id="gg-download-json"
              onClick={() =>
                downloadText(
                  result.policy_json || JSON.stringify(result.policy, null, 2) || "{}",
                  `${fileBase}.json`,
                  "application/json",
                )
              }
            >
              Download JSON
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              id="gg-download-md"
              onClick={onDownloadMarkdown}
            >
              Download Markdown report
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              id="gg-download-pdf"
              onClick={onDownloadPdf}
            >
              Download PDF
            </button>
            <FormStatus
              id="gg-copy-status"
              as="span"
              text={copyStatus.text}
              kind={copyStatus.kind}
            />
          </div>
          <pre className="code-block" tabIndex={0} aria-labelledby="gg-policy-heading">
            <code id="gg-policy">{policyText}</code>
          </pre>
        </section>
      )}
    </section>
  );
}

function levelRow(name: string, dim: RiskDimension | undefined): string[] | null {
  if (!dim) return null;
  return [name, dim.level || "", dim.rationale || (dim.factors || []).join("; ")];
}

function GuardrailResult({ data }: { data: AdviseResult }) {
  const rp = data.risk_profile;
  const overall = rp.overall;
  const rows = [
    levelRow("Autonomy", rp.autonomy),
    levelRow("Tool risk", rp.tool_risk),
    levelRow("Data exposure", rp.data_exposure),
    levelRow("Blast radius", rp.blast_radius),
  ].filter((r): r is string[] => r !== null);
  const matrix = data.tool_matrix;
  const dh = data.data_handling;
  const lim = data.limits;
  return (
    <div className="gg-output">
      <p className="notice notice--warning">
        <strong>Draft for review. </strong>
        {data.activation ||
          "This policy is not active. Activation requires review and recorded human approval."}
      </p>
      {data.summary && <p>{data.summary}</p>}

      <h3>Runtime risk profile</h3>
      <p>
        Overall runtime risk: <strong className="tier">{overall.rating || "—"}</strong>{" "}
        <EvidenceBadge status={rp.evidence_status || "Inferred"} />
      </p>
      {overall.rationale && <p className="small">{overall.rationale}</p>}
      {rows.length > 0 && (
        <ResultTable
          label="Risk dimensions"
          headers={["Dimension", "Level", "Rationale"]}
          rows={rows}
        />
      )}
      {rp.tier_mismatch && (
        <p className="notice notice--warning">
          The inferred risk tier ({rp.inferred_risk_tier}) differs from the tier you entered.
          Changing a risk tier requires human approval.
        </p>
      )}

      <h3>Tool permission matrix</h3>
      {!matrix.length ? (
        <p>No tools were declared. Anything undeclared is denied by default.</p>
      ) : (
        <>
          <ResultTable
            label="Tool permission matrix"
            headers={["Tool", "Operation", "Decision", "Reasons and conditions", "Controls"]}
            rows={matrix.map((t) => [
              t.tool,
              <span key="op">
                {t.operation} <EvidenceBadge status={t.operation_evidence || "Inferred"} />
              </span>,
              t.decision + (t.engine_action ? ` (${t.engine_action})` : ""),
              [...t.reasons, ...t.conditions].join("; "),
              <CitedControls key="cite" ids={t.citations} prefix="" />,
            ])}
          />
          <p className="small">Tools not listed here are denied by default.</p>
        </>
      )}

      {data.approval_rules.length > 0 && (
        <>
          <h3>Human approval rules</h3>
          <ul>
            {data.approval_rules.map((r) => (
              <li key={r.id}>
                <strong>{r.trigger || r.id}</strong> — approvers: {r.approver_roles.join(", ")}
              </li>
            ))}
          </ul>
        </>
      )}

      {dh.redaction_entities && (
        <>
          <h3>Data handling</h3>
          <KeyValues
            pairs={[
              ["Data sensitivity", dh.data_sensitivity],
              ["Redacted entities", dh.redaction_entities.join(", ")],
              ["Redaction surfaces", dh.redaction_surfaces.join(", ")],
              ["Prompt logging", dh.prompt_logging],
              ["Response logging", dh.response_logging],
              ["Evidence retention (days)", dh.evidence_retention_days],
            ]}
          />
        </>
      )}

      {lim.requests_per_minute !== undefined && (
        <>
          <h3>Starting limits</h3>
          <KeyValues
            pairs={[
              ["Requests per minute", lim.requests_per_minute],
              ["Tool calls per session", lim.tool_calls_per_session],
              ["Tokens per day", lim.tokens_per_day],
              ["Cost per month (USD)", lim.cost_per_month_usd],
              ["On breach", lim.action_on_breach],
            ]}
          />
          {lim.rationale && <p className="small">{lim.rationale}</p>}
        </>
      )}

      {data.missing_inputs.length > 0 && (
        <>
          <h3>Missing inputs</h3>
          <ul>
            {data.missing_inputs.map((m) => (
              <li key={m.field}>
                <EvidenceBadge status={m.status || "Missing evidence"} />{" "}
                {(m.label || m.field) + (m.impact ? ` — ${m.impact}` : "")}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.assumptions.length > 0 && (
        <>
          <h3>Assumptions AEGIS made</h3>
          <ul>
            {data.assumptions.map((a, i) => (
              <li key={`${a.field}-${i}`}>
                <EvidenceBadge status="Inferred" />{" "}
                {`${a.field} = ${a.assumed}` + (a.why ? ` — ${a.why}` : "")}
              </li>
            ))}
          </ul>
        </>
      )}

      <CitedControls ids={data.citations} prefix="AEGIS controls cited: " />
      {!data.policy_validation.valid && (
        <p className="notice notice--error">
          Schema validation reported issues: {data.policy_validation.errors.join("; ")}
        </p>
      )}
      {data.disclaimer && <p className="small">{data.disclaimer}</p>}
    </div>
  );
}
