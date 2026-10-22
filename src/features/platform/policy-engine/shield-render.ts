/**
 * Markdown rendering of Runtime Shield Advisor output — port of
 * platform/app/runtime-shield/aegis_shield/render.py — plus the browser-relevant parts of the
 * runtime-shield CLI (`__main__.py` validate/diff) and sample bundles (`samples.py`).
 */
import { STANDARD_DISCLAIMER } from "../../site/content";
import { findProhibitedClaims } from "../../site/engines/ask-aegis/safety";
import { advise, lintPolicy, toJson, toYaml, validatePolicy } from "../../site/engines/shield";
import type { AdviseResult } from "../../site/engines/shield";
import { fmtThousands, pyNumStr, pyStr } from "../../site/engines/shield/py";
import { parsePolicyText } from "./parse";
import { pyRstrip } from "./pyre";
import { diffPolicies, summarizeDiff } from "./versioning";

type Dict = Record<string, unknown>;

const obj = (v: unknown): Dict => (v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strs = (v: unknown): string[] => arr(v).map((x) => pyStr(x));

function cite(ids: unknown): string {
  const list = strs(ids);
  return list.length ? list.join(", ") : "—";
}

function esc(v: unknown): string {
  return pyStr(v !== null && v !== undefined ? v : "—")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

/** Python format(n, ","): thousands separators for ints and floats. */
function thousands(n: unknown): string {
  if (typeof n !== "number") return pyStr(n);
  const s = pyNumStr(n);
  const [i = "", f] = s.split(".");
  const neg = i.startsWith("-");
  const grouped = fmtThousands(Math.abs(Number(i)));
  return (neg ? "-" : "") + grouped + (f !== undefined ? `.${f}` : "");
}

export interface RenderOptions {
  /** Force (true/false) the "Synthetic example" banner; default: `app.synthetic`. */
  syntheticLabel?: boolean | null;
  includePolicyYaml?: boolean;
}

/** render_advice_markdown(advice) — the advisor report as Markdown. */
export function renderAdviceMarkdown(
  advice: AdviseResult | Dict,
  { syntheticLabel = null, includePolicyYaml = true }: RenderOptions = {},
): string {
  const a = advice as Dict;
  const app = obj(a["app"]);
  const synthetic = syntheticLabel === null ? app["synthetic"] : syntheticLabel;
  const r = obj(a["risk_profile"]);
  const L: string[] = [];
  L.push(`# AEGIS Runtime Shield Advisor — ${pyStr(app["app_name"])}`);
  L.push("");
  if (synthetic) {
    L.push(
      "> **Synthetic example.** Fictional organization and system, generated to illustrate AEGIS output.",
    );
    L.push("");
  }
  L.push(`> ${pyStr(a["principle"])}`);
  L.push("");
  L.push(
    `**Status:** Draft advisory output — evidence status **${pyStr(a["evidence_status"])}**. ` +
      "Requires review by the accountable owner and security before any use.",
  );
  L.push("");
  L.push("## Summary");
  L.push("");
  L.push(pyStr(a["summary"]));
  L.push("");
  L.push("| Field | Value |");
  L.push("|---|---|");
  for (const [k, lab] of [
    ["purpose", "Purpose"],
    ["model", "Model"],
    ["vendor", "Vendor"],
    ["environment", "Environment"],
    ["autonomy", "Autonomy"],
    ["human_approval_model", "Human-approval model"],
    ["data_sensitivity", "Data sensitivity"],
    ["affected_parties", "Affected parties"],
  ] as const) {
    L.push(`| ${lab} | ${esc(app[k])} |`);
  }
  L.push(`| Risk tier (user-asserted) | ${esc(r["user_asserted_risk_tier"])} |`);
  L.push(`| Risk tier (inferred) | ${esc(r["inferred_risk_tier"])} |`);
  L.push("");

  L.push("## 1. Agent risk profile");
  L.push("");
  L.push("| Dimension | Rating | Rationale |");
  L.push("|---|---|---|");
  for (const [key, lab] of [
    ["autonomy", "Autonomy"],
    ["blast_radius", "Blast radius"],
    ["data_exposure", "Data exposure"],
    ["tool_risk", "Tool risk"],
  ] as const) {
    const dim = obj(r[key]);
    L.push(`| ${lab} | ${pyStr(dim["level"])} | ${esc(dim["rationale"])} |`);
  }
  const overall = obj(r["overall"]);
  L.push(
    `| **Overall** | **${pyStr(overall["rating"])}** | ${esc(overall["rationale"])} |`,
  );
  L.push("");
  L.push(
    `Citations: ${cite(r["citations"])}. Evidence status: ${pyStr(r["evidence_status"])}.`,
  );
  L.push("");
  const assumptions = arr(a["assumptions"]);
  if (assumptions.length) {
    L.push("**Assumptions used (confirm or correct):**");
    L.push("");
    for (const x of assumptions.map(obj)) {
      L.push(`- \`${pyStr(x["field"])}\` assumed **${pyStr(x["assumed"])}** — ${pyStr(x["why"])}`);
    }
    L.push("");
  }

  L.push("## 2. Tool permission matrix");
  L.push("");
  L.push("Default-deny: any tool not listed below is denied.");
  L.push("");
  L.push("| Tool | Operation | Decision | Engine action | Approvers | Reasons | Controls |");
  L.push("|---|---|---|---|---|---|---|");
  const matrix = arr(a["tool_matrix"]).map(obj);
  for (const m of matrix) {
    let extra = "";
    const conds = arr(m["require_approval_if"]).map(obj);
    if (conds.length) {
      extra =
        " Approval if: " +
        conds.map((c) => `${pyStr(c["param"])} ${pyStr(c["op"])} ${pyStr(c["value"])}`).join("; ") +
        ".";
    }
    L.push(
      `| \`${pyStr(m["tool"])}\` | ${pyStr(m["operation"])} (${pyStr(m["operation_evidence"])}) | **${pyStr(m["decision"])}** | ` +
        `${pyStr(m["engine_action"])} | ${esc(strs(m["approval_roles"]).join(", ") || "—")} | ` +
        `${esc(strs(m["reasons"]).join("; ") + extra)} | ${cite(m["citations"])} |`,
    );
  }
  if (!matrix.length) {
    L.push(
      "| — | — | — | — | — | No tools declared; all tool calls are denied by default. | IS-11 |",
    );
  }
  L.push("");

  const dh = obj(a["data_handling"]);
  L.push("## 3. Data handling and redaction");
  L.push("");
  L.push(`- Redacted entities: ${strs(dh["redaction_entities"]).join(", ")}`);
  L.push(`- Surfaces: ${strs(dh["redaction_surfaces"]).join(", ")}`);
  L.push(
    `- Prompt / response logging level: ${pyStr(dh["prompt_logging"])} / ${pyStr(dh["response_logging"])}`,
  );
  L.push(`- Evidence retention (proposed): ${pyStr(dh["evidence_retention_days"])} days`);
  for (const e of arr(dh["exemptions"]).map(obj)) {
    L.push(
      `- Exemption: \`${pyStr(e["tool"])}\` may receive ${strs(e["entities"]).join(", ")} unmasked — ${pyStr(e["reason"])}`,
    );
  }
  L.push("");
  for (const rule of arr(dh["rules"]).map(obj)) {
    L.push(`- **${pyStr(rule["id"])}** — ${pyStr(rule["rule"])} (${cite(rule["citations"])})`);
  }
  L.push("");
  L.push(`*Detector limitations:* ${pyStr(dh["detector_limitations"])}`);
  L.push("");

  L.push("## 4. Human-approval rules");
  L.push("");
  L.push("| Rule | Trigger | Approver roles | Binding | Controls |");
  L.push("|---|---|---|---|---|");
  for (const x of arr(a["approval_rules"]).map(obj)) {
    L.push(
      `| ${pyStr(x["id"])} | ${esc(x["trigger"])} | ${esc(strs(x["approver_roles"]).join(", "))} | ` +
        `${esc(x["binding"])} | ${cite(x["citations"])} |`,
    );
  }
  L.push("");

  const lim = obj(a["limits"]);
  L.push("## 5. Rate and budget limits");
  L.push("");
  L.push("| Limit | Value |");
  L.push("|---|---|");
  L.push(`| Requests per minute (per identity) | ${pyStr(lim["requests_per_minute"])} |`);
  L.push(`| Tool calls per session | ${pyStr(lim["tool_calls_per_session"])} |`);
  L.push(`| Tokens per day (tenant+agent) | ${thousands(lim["tokens_per_day"])} |`);
  L.push(`| Cost per month (USD) | ${thousands(lim["cost_per_month_usd"])} |`);
  L.push(
    `| Action on breach | ${pyStr(lim["action_on_breach"])} (alert at ${pyStr(lim["alert_at_percent"])}%) |`,
  );
  L.push("");
  L.push(
    `${pyStr(lim["rationale"])} Source: ${pyStr(lim["source"])} (${pyStr(lim["evidence_status"])}). Controls: ${cite(lim["citations"])}.`,
  );
  L.push("");

  const mon = obj(a["monitoring"]);
  L.push("## 6. Monitoring plan");
  L.push("");
  L.push("| Metric | Description | Controls |");
  L.push("|---|---|---|");
  for (const m of arr(mon["metrics"]).map(obj)) {
    L.push(`| ${pyStr(m["metric"])} | ${esc(m["description"])} | ${cite(m["citations"])} |`);
  }
  L.push("");
  L.push("| Alert | Condition | Severity | Route |");
  L.push("|---|---|---|---|");
  for (const x of arr(mon["alerts"]).map(obj)) {
    L.push(
      `| ${pyStr(x["alert"])} | ${esc(x["condition"])} | ${pyStr(x["severity"])} | ${pyStr(x["route"])} |`,
    );
  }
  L.push("");
  L.push(
    "Review cadence: " +
      Object.entries(obj(mon["review_cadence"]))
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${pyStr(v)}`)
        .join("; ") +
      ".",
  );
  L.push("");

  const ir = obj(a["incident_response"]);
  const ks = obj(ir["kill_switch"]);
  L.push("## 7. Incident response and kill switch");
  L.push("");
  L.push(
    `- Scopes: ${strs(ks["scopes"]).join(", ")}; authorized roles: ${strs(ks["authorized_roles"]).join(", ")}`,
  );
  L.push(
    `- Target time-to-disable: ${pyStr(ks["target_time_to_disable_minutes"])} minutes. ${pyStr(ks["precedence"])}.`,
  );
  strs(ks["procedure"]).forEach((step, i) => L.push(`${i + 1}. ${step}`));
  L.push("");
  L.push("| Playbook | Trigger | Actions | Controls |");
  L.push("|---|---|---|---|");
  for (const p of arr(ir["playbooks"]).map(obj)) {
    L.push(
      `| ${pyStr(p["id"])} | ${esc(p["trigger"])} | ${esc(strs(p["actions"]).join("; "))} | ${cite(p["citations"])} |`,
    );
  }
  L.push("");

  const ro = obj(a["rollout"]);
  L.push("## 8. Rollout plan");
  L.push("");
  L.push(pyStr(ro["promotion_rule"]));
  L.push("");
  for (const st of arr(ro["stages"]).map(obj)) {
    L.push(`### Stage ${pyStr(st["stage"])}: ${pyStr(st["mode"])}`);
    L.push("");
    L.push(pyStr(st["purpose"]));
    L.push("");
    L.push("Entry criteria:");
    L.push("");
    for (const c of strs(st["entry_criteria"])) L.push(`- ${c}`);
    L.push("");
    L.push("Exit criteria:");
    L.push("");
    for (const c of strs(st["exit_criteria"])) L.push(`- ${c}`);
    L.push("");
    L.push(`Controls: ${cite(st["citations"])}`);
    L.push("");
  }

  L.push("## 9. Missing inputs and clarifying questions");
  L.push("");
  const missing = arr(a["missing_inputs"]).map(obj);
  if (missing.length) {
    for (const m of missing) {
      L.push(`- **${pyStr(m["label"])}** (${pyStr(m["status"])}): ${pyStr(m["impact"])}`);
    }
    L.push("");
  }
  const questions = arr(a["clarifying_questions"]).map(obj);
  if (questions.length) {
    questions.forEach((q, i) => L.push(`${i + 1}. ${pyStr(q["question"])} (${cite(q["citations"])})`));
  } else {
    L.push("No clarifying questions.");
  }
  L.push("");

  const ev = obj(a["evidence"]);
  L.push("## 10. Evidence labels");
  L.push("");
  L.push("| Item | Status | Controls |");
  L.push("|---|---|---|");
  for (const it of arr(ev["items"]).map(obj)) {
    L.push(`| ${esc(it["item"])} | ${pyStr(it["status"])} | ${cite(it["citations"])} |`);
  }
  L.push("");
  L.push(pyStr(ev["verified_note"]));
  L.push("");

  const pol = obj(a["policy"]);
  L.push("## 11. Draft runtime policy");
  L.push("");
  L.push(
    `- Policy: \`${pyStr(pol["policy_id"])}\` v${pyStr(pol["version"])} — status **${pyStr(pol["status"])}**, rollout mode ` +
      `**${pyStr(obj(pol["rollout"])["mode"])}**`,
  );
  L.push(`- ${pyStr(a["activation"])}`);
  const val = obj(a["policy_validation"]);
  const warnings = strs(val["warnings"]);
  L.push(
    `- Schema validation: ${val["valid"] ? "passed" : "FAILED"}; reviewer warnings: ${warnings.length}`,
  );
  for (const w of warnings) L.push(`  - ${w}`);
  L.push("");
  if (includePolicyYaml) {
    L.push("```yaml");
    L.push(pyRstrip(pyStr(a["policy_yaml"])));
    L.push("```");
    L.push("");
  }

  L.push("## Citations");
  L.push("");
  for (const c of arr(a["citation_details"]).map(obj)) L.push(`- ${pyStr(c["citation"])}`);
  L.push("");
  L.push("---");
  L.push("");
  L.push(
    `*${STANDARD_DISCLAIMER}* Runtime detection is heuristic and does not guarantee that every unsafe input ` +
      "or output is caught.",
  );
  L.push("");
  return L.join("\n");
}

// ------------------------------------------------------------------ CLI equivalents

export interface PolicyCheck {
  valid: boolean;
  errors: string[];
  warnings: string[];
  policy: unknown;
}

/** `aegis_shield validate POLICY`: parse YAML/JSON, validate, lint (warnings only when valid). */
export function validatePolicyText(text: string): PolicyCheck {
  let policy: unknown;
  try {
    policy = parsePolicyText(text);
  } catch (e) {
    return { valid: false, errors: [`could not parse: ${(e as Error).message}`], warnings: [], policy: null };
  }
  const errors = validatePolicy(policy);
  return { valid: !errors.length, errors, warnings: errors.length ? [] : lintPolicy(policy), policy };
}

/** `aegis_shield diff OLD NEW`: reviewer-readable lines of a structural policy diff. */
export function diffPolicyTexts(oldText: string, newText: string): string[] {
  return summarizeDiff(diffPolicies(parsePolicyText(oldText), parsePolicyText(newText)));
}

export const SYNTHETIC_BANNER =
  "# Synthetic example — fictional organization and system generated by AEGIS for illustration.\n";

/**
 * samples.write_samples for one profile, as an in-memory file map (no file system):
 * `<key>_advisor.md`, `<key>_advisor.json`, `<key>_policy.yaml`, `<key>_policy.json`.
 */
export function sampleFiles(
  key: string,
  profile: Record<string, unknown>,
  opts: { today?: string } = {},
): Record<string, string> {
  const advice = advise(profile, opts.today ? { today: opts.today } : {});
  const md = renderAdviceMarkdown(advice, { syntheticLabel: true });
  const hits = findProhibitedClaims(md);
  if (hits.length) throw new Error(`prohibited claims in sample ${key}: ${hits.join(", ")}`);
  const policy = advice.policy as unknown as Dict;
  const files: Record<string, string> = {
    [`${key}_advisor.md`]: md,
    [`${key}_advisor.json`]: JSON.stringify(
      { label: "Synthetic example", profile, advice },
      null,
      2,
    ),
    [`${key}_policy.yaml`]: SYNTHETIC_BANNER + toYaml(advice.policy),
    [`${key}_policy.json`]: toJson({
      ...policy,
      metadata: { ...obj(policy["metadata"]), label: "Synthetic example" },
    } as unknown as Parameters<typeof toJson>[0]),
  };
  for (const [k, v] of Object.entries(files)) if (!v.endsWith("\n")) files[k] = v + "\n";
  return files;
}
