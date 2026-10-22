/*
 * Markdown rendering of Runtime Shield Advisor output (pure).
 *
 * Port of platform/app/runtime-shield/aegis_shield/render.py (render_advice_markdown). Operates on
 * the JSON-shaped advice returned by advise() in src/features/site/engines/shield.
 */
import { STANDARD_DISCLAIMER } from "@/features/site/content";
import { fmtThousands, pyStr } from "@/features/site/engines/shield/py";

/* eslint-disable @typescript-eslint/no-explicit-any -- advice is a JSON document mirroring Python dicts */
type Json = any;

function cite(ids: unknown): string {
  return Array.isArray(ids) && ids.length ? ids.join(", ") : "—";
}

function esc(v: unknown): string {
  return pyStr(v === null || v === undefined ? "—" : v)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

export function renderAdviceMarkdown(
  advice: Json,
  opts: { syntheticLabel?: boolean; includePolicyYaml?: boolean } = {},
): string {
  const app = advice.app;
  const synthetic = opts.syntheticLabel === undefined ? app.synthetic : opts.syntheticLabel;
  const includePolicyYaml = opts.includePolicyYaml ?? true;
  const r = advice.risk_profile;
  const L: string[] = [];
  L.push(`# AEGIS Runtime Shield Advisor — ${app.app_name}`, "");
  if (synthetic) {
    L.push(
      "> **Synthetic example.** Fictional organization and system, generated to illustrate AEGIS output.",
      "",
    );
  }
  L.push(`> ${advice.principle}`, "");
  L.push(
    `**Status:** Draft advisory output — evidence status **${advice.evidence_status}**. ` +
      "Requires review by the accountable owner and security before any use.",
    "",
  );
  L.push("## Summary", "", advice.summary, "");
  L.push("| Field | Value |", "|---|---|");
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
  L.push(`| Risk tier (user-asserted) | ${esc(r.user_asserted_risk_tier)} |`);
  L.push(`| Risk tier (inferred) | ${esc(r.inferred_risk_tier)} |`, "");

  L.push("## 1. Agent risk profile", "");
  L.push("| Dimension | Rating | Rationale |", "|---|---|---|");
  for (const [key, lab] of [
    ["autonomy", "Autonomy"],
    ["blast_radius", "Blast radius"],
    ["data_exposure", "Data exposure"],
    ["tool_risk", "Tool risk"],
  ] as const) {
    L.push(`| ${lab} | ${r[key].level} | ${esc(r[key].rationale)} |`);
  }
  L.push(`| **Overall** | **${r.overall.rating}** | ${esc(r.overall.rationale)} |`, "");
  L.push(`Citations: ${cite(r.citations)}. Evidence status: ${r.evidence_status}.`, "");
  if (Array.isArray(advice.assumptions) && advice.assumptions.length) {
    L.push("**Assumptions used (confirm or correct):**", "");
    for (const a of advice.assumptions) {
      L.push(`- \`${a.field}\` assumed **${pyStr(a.assumed)}** — ${a.why}`);
    }
    L.push("");
  }

  L.push("## 2. Tool permission matrix", "");
  L.push("Default-deny: any tool not listed below is denied.", "");
  L.push(
    "| Tool | Operation | Decision | Engine action | Approvers | Reasons | Controls |",
    "|---|---|---|---|---|---|---|",
  );
  for (const m of advice.tool_matrix) {
    let extra = "";
    if (m.require_approval_if?.length) {
      extra =
        " Approval if: " +
        m.require_approval_if
          .map((c: Json) => `${c.param} ${c.op} ${pyStr(c.value)}`)
          .join("; ") +
        ".";
    }
    L.push(
      `| \`${m.tool}\` | ${m.operation} (${m.operation_evidence}) | **${m.decision}** | ` +
        `${m.engine_action} | ${esc(m.approval_roles.join(", ") || "—")} | ` +
        `${esc(m.reasons.join("; ") + extra)} | ${cite(m.citations)} |`,
    );
  }
  if (!advice.tool_matrix.length) {
    L.push(
      "| — | — | — | — | — | No tools declared; all tool calls are denied by default. | IS-11 |",
    );
  }
  L.push("");

  const dh = advice.data_handling;
  L.push("## 3. Data handling and redaction", "");
  L.push(`- Redacted entities: ${dh.redaction_entities.join(", ")}`);
  L.push(`- Surfaces: ${dh.redaction_surfaces.join(", ")}`);
  L.push(`- Prompt / response logging level: ${dh.prompt_logging} / ${dh.response_logging}`);
  L.push(`- Evidence retention (proposed): ${dh.evidence_retention_days} days`);
  for (const e of dh.exemptions) {
    L.push(
      `- Exemption: \`${e.tool}\` may receive ${e.entities.join(", ")} unmasked — ${e.reason}`,
    );
  }
  L.push("");
  for (const rule of dh.rules) L.push(`- **${rule.id}** — ${rule.rule} (${cite(rule.citations)})`);
  L.push("", `*Detector limitations:* ${dh.detector_limitations}`, "");

  L.push("## 4. Human-approval rules", "");
  L.push("| Rule | Trigger | Approver roles | Binding | Controls |", "|---|---|---|---|---|");
  for (const a of advice.approval_rules) {
    L.push(
      `| ${a.id} | ${esc(a.trigger)} | ${esc(a.approver_roles.join(", "))} | ` +
        `${esc(a.binding)} | ${cite(a.citations)} |`,
    );
  }
  L.push("");

  const lim = advice.limits;
  L.push("## 5. Rate and budget limits", "");
  L.push("| Limit | Value |", "|---|---|");
  L.push(`| Requests per minute (per identity) | ${lim.requests_per_minute} |`);
  L.push(`| Tool calls per session | ${lim.tool_calls_per_session} |`);
  L.push(`| Tokens per day (tenant+agent) | ${fmtThousands(lim.tokens_per_day)} |`);
  L.push(`| Cost per month (USD) | ${fmtThousands(lim.cost_per_month_usd)} |`);
  L.push(
    `| Action on breach | ${lim.action_on_breach} (alert at ${lim.alert_at_percent}%) |`,
    "",
  );
  L.push(
    `${lim.rationale} Source: ${lim.source} (${lim.evidence_status}). Controls: ${cite(lim.citations)}.`,
    "",
  );

  const mon = advice.monitoring;
  L.push("## 6. Monitoring plan", "");
  L.push("| Metric | Description | Controls |", "|---|---|---|");
  for (const m of mon.metrics) {
    L.push(`| ${m.metric} | ${esc(m.description)} | ${cite(m.citations)} |`);
  }
  L.push("");
  L.push("| Alert | Condition | Severity | Route |", "|---|---|---|---|");
  for (const a of mon.alerts) {
    L.push(`| ${a.alert} | ${esc(a.condition)} | ${a.severity} | ${a.route} |`);
  }
  L.push("");
  L.push(
    "Review cadence: " +
      Object.entries(mon.review_cadence as Record<string, unknown>)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${pyStr(v)}`)
        .join("; ") +
      ".",
    "",
  );

  const ir = advice.incident_response;
  const ks = ir.kill_switch;
  L.push("## 7. Incident response and kill switch", "");
  L.push(
    `- Scopes: ${ks.scopes.join(", ")}; authorized roles: ${ks.authorized_roles.join(", ")}`,
  );
  L.push(
    `- Target time-to-disable: ${ks.target_time_to_disable_minutes} minutes. ${ks.precedence}.`,
  );
  ks.procedure.forEach((step: string, i: number) => L.push(`${i + 1}. ${step}`));
  L.push("");
  L.push("| Playbook | Trigger | Actions | Controls |", "|---|---|---|---|");
  for (const p of ir.playbooks) {
    L.push(
      `| ${p.id} | ${esc(p.trigger)} | ${esc(p.actions.join("; "))} | ${cite(p.citations)} |`,
    );
  }
  L.push("");

  const ro = advice.rollout;
  L.push("## 8. Rollout plan", "", ro.promotion_rule, "");
  for (const st of ro.stages) {
    L.push(`### Stage ${st.stage}: ${st.mode}`, "", st.purpose, "");
    L.push("Entry criteria:", "");
    for (const c of st.entry_criteria) L.push(`- ${c}`);
    L.push("", "Exit criteria:", "");
    for (const c of st.exit_criteria) L.push(`- ${c}`);
    L.push("", `Controls: ${cite(st.citations)}`, "");
  }

  L.push("## 9. Missing inputs and clarifying questions", "");
  if (advice.missing_inputs.length) {
    for (const m of advice.missing_inputs) L.push(`- **${m.label}** (${m.status}): ${m.impact}`);
    L.push("");
  }
  if (advice.clarifying_questions.length) {
    advice.clarifying_questions.forEach((q: Json, i: number) =>
      L.push(`${i + 1}. ${q.question} (${cite(q.citations)})`),
    );
  } else {
    L.push("No clarifying questions.");
  }
  L.push("");

  const ev = advice.evidence;
  L.push("## 10. Evidence labels", "");
  L.push("| Item | Status | Controls |", "|---|---|---|");
  for (const it of ev.items) L.push(`| ${esc(it.item)} | ${it.status} | ${cite(it.citations)} |`);
  L.push("", ev.verified_note, "");

  const pol = advice.policy;
  L.push("## 11. Draft runtime policy", "");
  L.push(
    `- Policy: \`${pol.policy_id}\` v${pol.version} — status **${pol.status}**, rollout mode ` +
      `**${pol.rollout.mode}**`,
  );
  L.push(`- ${advice.activation}`);
  const val = advice.policy_validation;
  L.push(
    `- Schema validation: ${val.valid ? "passed" : "FAILED"}; reviewer warnings: ${val.warnings.length}`,
  );
  for (const w of val.warnings) L.push(`  - ${w}`);
  L.push("");
  if (includePolicyYaml) {
    L.push("```yaml", String(advice.policy_yaml).replace(/\s+$/, ""), "```", "");
  }

  L.push("## Citations", "");
  for (const c of advice.citation_details) L.push(`- ${c.citation}`);
  L.push("", "---", "");
  L.push(
    `*${STANDARD_DISCLAIMER}* Runtime detection is heuristic and does not guarantee that every unsafe input ` +
      "or output is caught.",
  );
  L.push("");
  return L.join("\n");
}
/* eslint-enable @typescript-eslint/no-explicit-any */
