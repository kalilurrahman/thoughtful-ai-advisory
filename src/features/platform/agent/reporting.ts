/**
 * Use-case governance readiness report: Markdown composition and MD/CSV/JSON export, PDF via
 * markdownToPdfBlob (veritrail_agent/reporting.py). The browser has no file system, so exports are
 * returned as strings and kept on the report record; "paths" are virtual names for parity.
 */
import {
  EVIDENCE_STATUS_DEFINITIONS,
  STANDARD_DISCLAIMER,
  controlCitation,
  controlLibrary,
  getControl,
} from "@/features/site/content";
import {
  applicableGuardrails,
  intakeFields,
  templateMeta,
  type Profile,
} from "@/features/site/engines/ask-veritrail/question-bank";
import { findProhibitedClaims } from "@/features/site/engines/ask-veritrail/safety";
import { toCsv } from "../reports/exporters";
import {
  GAP_SEVERITIES,
  GAP_SEVERITY_SLA_DAYS,
  heatMap,
  recommendControlsFromGaps,
  roadmap,
  type GapResult,
  type HeatMapRow,
  type RecommendedFromGap,
  type RoadmapItem,
} from "./gaps";
import { pyFloat, pyStr } from "./py";
import type { ApprovalRecord, AssessmentRecord, SystemRecord } from "./store";

export const SYNTHETIC_BANNER =
  "> **Synthetic example.** This report was generated from fictional data to illustrate VERITRAIL Agent " +
  "output. It describes no real organization or system.";

export const GAP_CSV_COLUMNS = [
  "gap_id",
  "severity",
  "evidence_status",
  "gap_type",
  "question_id",
  "question",
  "module",
  "domain",
  "controls",
  "primary_control",
  "owner_role",
  "recommended_action",
  "evidence_expected",
  "due_date",
  "sla_days",
  "horizon",
  "answer",
  "evidence_refs",
  "nist_ai_rmf",
  "iso_42001",
  "eu_ai_act",
];
const FW_LABEL: Record<string, string> = {
  nist_ai_rmf: "NIST AI RMF",
  iso_42001: "ISO/IEC 42001",
  eu_ai_act: "EU AI Act",
};

function cell(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.map((x) => pyStr(x)).join(", ") : "—";
  return pyStr(v).replaceAll("|", "/").replaceAll("\n", " ");
}

function table(headers: string[], rows: unknown[][]): string {
  const out = [
    "| " + headers.join(" | ") + " |",
    "|" + headers.map(() => "---").join("|") + "|",
    ...rows.map((r) => "| " + r.map(cell).join(" | ") + " |"),
  ];
  return out.join("\n");
}

function maps(mappings: Record<string, unknown> | null | undefined): string {
  return (
    Object.entries(mappings ?? {})
      .filter(([, v]) => Array.isArray(v) && v.length)
      .map(([k, v]) => `${FW_LABEL[k] ?? k}: ${(v as unknown[]).map(String).join(", ")}`)
      .join("; ") || "—"
  );
}

export interface AuditTraceRow {
  id: string;
  ts: string;
  trace_id: string;
  action: string;
  actor: string;
  outcome: string;
}

export interface ReportData {
  report_id: string;
  report_type: string;
  synthetic: boolean;
  generated_at: string;
  prepared_by: string;
  template: { id: string; version: string };
  control_library_version: string;
  system: {
    id: string | null;
    name: string | null;
    status: string | null;
    risk_tier: string | null;
    risk_tier_status: string | null;
  };
  profile: Record<string, unknown>;
  profile_provenance: Record<string, string>;
  assessment_id: string;
  risk: Record<string, unknown>;
  modules: Array<{ id: string; name: string }>;
  gap_analysis: GapResult;
  heat_map: HeatMapRow[];
  recommended_controls: RecommendedFromGap[];
  roadmap: Record<"30" | "60" | "90" | "backlog", RoadmapItem[]>;
  runtime_guardrails: Array<{ id: string; title: string; controls: string[] }>;
  shield_advice_summary: { overall_rating: unknown; citations: string[] } | null;
  approvals: Array<Record<string, unknown>>;
  audit_trace: AuditTraceRow[];
  evidence_status_definitions: Record<string, string>;
  disclaimer: string;
  template_disclaimer: string;
}

export interface ShieldAdviceLike {
  risk_profile?: { overall_rating?: unknown; rating?: unknown } | null;
  citations?: string[];
}

export function buildReportData(args: {
  system: Partial<SystemRecord>;
  assessment: AssessmentRecord;
  gapResult: GapResult;
  approvals: ApprovalRecord[];
  auditTrace: AuditTraceRow[];
  preparedBy: string;
  generatedAt: string;
  synthetic?: boolean;
  reportId?: string;
  shieldAdvice?: ShieldAdviceLike | null;
}): ReportData {
  const { system, assessment, gapResult } = args;
  const sysProfile = (system.profile ?? {}) as Record<string, unknown>;
  const asmProfile = assessment.profile ?? {};
  const profile = Object.keys(asmProfile).length ? asmProfile : sysProfile;
  const risk = (assessment.risk ?? {}) as Record<string, unknown>;
  const gaps = gapResult.gaps;
  const name = (profile["name"] as string | undefined) || (system.name ?? null);
  const tier = (risk["tier"] as string | undefined) ?? null;
  const tmpDisclaimer = (templateMeta as { disclaimer?: string }).disclaimer ?? "";
  return {
    report_id: args.reportId ?? "",
    report_type: "VERITRAIL AI Use-Case Governance Readiness Report",
    synthetic: args.synthetic ?? false,
    generated_at: args.generatedAt,
    prepared_by: args.preparedBy,
    template: { id: templateMeta.id, version: templateMeta.version },
    control_library_version: controlLibrary.version,
    system: {
      id: system.id ?? null,
      name: name || null,
      status: system.status ?? null,
      risk_tier: system.risk_tier ?? null,
      risk_tier_status: system.risk_tier_status ?? null,
    },
    profile,
    profile_provenance: assessment.profile_provenance ?? {},
    assessment_id: assessment.id,
    risk,
    modules: assessment.modules ?? [],
    gap_analysis: gapResult,
    heat_map: heatMap(gapResult.findings),
    recommended_controls: recommendControlsFromGaps(gaps),
    roadmap: roadmap(gaps),
    runtime_guardrails: applicableGuardrails(profile as Profile, tier).map((g) => ({
      id: g.id,
      title: g.title,
      controls: g.controls,
    })),
    shield_advice_summary: shieldSummary(args.shieldAdvice),
    approvals: args.approvals.map((a) => ({
      approval_id: a.approval_id ?? null,
      type: a.type ?? null,
      status: a.status ?? null,
      resource: a.resource ?? null,
      reason: a.reason ?? null,
      requested_by: a.requested_by ?? null,
      resolved_by: a.resolved_by ?? null,
      created_at: a.created_at ?? null,
    })),
    audit_trace: args.auditTrace,
    evidence_status_definitions: { ...EVIDENCE_STATUS_DEFINITIONS },
    disclaimer: STANDARD_DISCLAIMER,
    template_disclaimer: tmpDisclaimer.trim(),
  };
}

function shieldSummary(
  advice: ShieldAdviceLike | null | undefined,
): ReportData["shield_advice_summary"] {
  if (!advice) return null;
  const rp = advice.risk_profile ?? {};
  return {
    overall_rating: rp.overall_rating || rp.rating || null,
    citations: (advice.citations ?? []).slice(0, 12),
  };
}

export function renderMarkdown(d: ReportData): string {
  const p = d.profile;
  const risk = d.risk;
  const ga = d.gap_analysis;
  const s = ga.summary;
  const name = d.system.name || "Unnamed AI system";
  const L: string[] = [`# AI Use-Case Governance Readiness Report — ${name}`, ""];
  if (d.synthetic) L.push(SYNTHETIC_BANNER, "");
  L.push(
    table(
      ["Field", "Value"],
      [
        ["Report ID", d.report_id],
        ["Assessment ID", d.assessment_id],
        ["AI system record", d.system.id],
        ["Generated (UTC)", d.generated_at],
        ["Prepared by", d.prepared_by],
        ["Question bank", `${d.template.id} v${d.template.version}`],
        ["Control library", `VERITRAIL Control Library v${d.control_library_version}`],
        [
          "Evidence basis",
          "Self-reported answers (User-asserted) unless evidence was reviewed by a named reviewer (Verified)",
        ],
      ],
    ),
    "",
  );

  // 1 executive summary
  const crit = ga.gaps.filter((g) => g.severity === "Critical");
  const st = s.by_evidence_status;
  const verified = st["Verified"] ?? 0;
  L.push("## 1. Executive summary", "");
  L.push(
    `- **Preliminary risk tier: ${pyStr(risk["tier"] ?? "Not determined")}** (Inferred; requires human confirmation` +
      (d.system.risk_tier_status ? ` — ${d.system.risk_tier_status}` : "") +
      ").",
  );
  L.push(
    `- **${s.answered} of ${s.questions}** applicable questions answered across ${d.modules.length} modules.`,
  );
  L.push(
    `- **${s.gaps} gaps** identified: ` +
      GAP_SEVERITIES.map((sev) => `${s.by_severity[sev]} ${sev}`).join(", ") +
      ".",
  );
  L.push(
    `- **Evidence posture:** ${verified} finding(s) Verified by a named reviewer; ` +
      `${st["User-asserted"] ?? 0} User-asserted; ` +
      `${st["Missing evidence"] ?? 0} Missing evidence; ` +
      `${st["Critical gap"] ?? 0} Critical gap; ${st["Inferred"] ?? 0} Inferred.`,
  );
  if (crit.length) {
    L.push(
      "- **Priority actions (Critical, due within " + `${GAP_SEVERITY_SLA_DAYS.Critical} days):**`,
    );
    for (const g of crit.slice(0, 5)) {
      L.push(
        `  - ${g.gap_id}: ${g.recommended_action} (${g.controls.join(", ")}; owner: ${g.owner_role})`,
      );
    }
  }
  L.push(
    "",
    "This report indicates governance readiness and evidence gaps for one AI system. It is not a " +
      "determination of conformity or legal compliance with any framework or law.",
    "",
  );

  // 2 profile
  const prov = d.profile_provenance ?? {};
  const rows: unknown[][] = [];
  for (const f of intakeFields) {
    if (f.id in p) rows.push([f.id, p[f.id], prov[f.id] ?? "User-asserted"]);
  }
  L.push("## 2. AI system profile", "", table(["Field", "Value", "Evidence status"], rows), "");

  // 3 risk tier
  L.push("## 3. Risk tier and rationale", "");
  const rhc = risk["requires_human_confirmation"];
  L.push(
    `**Tier:** ${pyStr(risk["tier"])} (score ${pyStr(risk["score"])}) — evidence status: ${pyStr(risk["evidence_status"] ?? "Inferred")}; ` +
      `requires human confirmation: ${rhc === undefined || rhc ? "yes" : "no"}.`,
    "",
  );
  if (risk["rationale"]) L.push(`**Rationale:** ${pyStr(risk["rationale"])}`, "");
  const factors = (risk["factors"] ?? []) as Array<Record<string, unknown>>;
  if (factors.length) {
    L.push(
      table(
        ["Factor", "Value", "Points", "Citation"],
        factors.map((f) => [f["factor"], f["value"], f["points"], f["citation"]]),
      ),
      "",
    );
  }
  const triggers = (risk["triggers"] ?? []) as string[];
  if (triggers.length) L.push("**Triggers:**", ...triggers.map((t) => `- ${t}`), "");
  L.push(
    `- Approval authority for this tier: ${pyStr(risk["approval_authority"] ?? "—")}`,
    `- Review cadence: every ${pyStr(risk["review_cadence_months"] ?? "—")} months`,
    `- Assessment modules applied: ${d.modules.map((m) => m.name).join(", ") || "—"}`,
    `- Method: ${pyStr(risk["method"] ?? "VERITRAIL risk-tier rules")}`,
    "",
  );

  // 4 heat map
  L.push(
    "## 4. Domain heat map",
    "",
    table(
      ["Domain", "Qs", "Implementation (self-reported)", "Verified", "Crit", "High", "Med", "Low", "Rating"],
      d.heat_map.map((r) => [
        r.name,
        r.questions,
        r.implementation_indicator !== null ? `${pyFloat(r.implementation_indicator)}%` : "—",
        r.verified,
        r.critical,
        r.high,
        r.medium,
        r.low,
        r.rating,
      ]),
    ),
    "",
    "Implementation indicator = implemented (1.0) and partial (0.5) answers as a share of applicable questions; " +
      "it reflects self-reported answers, not verified evidence.",
    "",
  );

  // 5 gap register
  L.push("## 5. Gap register", "");
  if (ga.gaps.length) {
    L.push(
      table(
        ["Gap · severity · due", "Evidence status", "Question", "Controls", "Owner role", "Recommended action"],
        ga.gaps.map((g) => [
          `${g.gap_id} · ${g.severity} · due ${g.due_date}`,
          g.evidence_status,
          `${g.question_id}: ${g.question}`,
          g.controls,
          g.owner_role,
          g.recommended_action,
        ]),
      ),
      "",
    );
    L.push(
      `Due dates apply the VERITRAIL severity SLAs (Critical ${GAP_SEVERITY_SLA_DAYS.Critical}, High ${GAP_SEVERITY_SLA_DAYS.High}, ` +
        `Medium ${GAP_SEVERITY_SLA_DAYS.Medium}, Low ${GAP_SEVERITY_SLA_DAYS.Low} days) from ${ga.as_of}.`,
      "",
    );
  } else {
    L.push(
      "No gaps were identified from the answers provided. Findings remain subject to evidence review.",
      "",
    );
  }

  // 6 control recommendations
  L.push("## 6. Control recommendations", "");
  if (d.recommended_controls.length) {
    L.push(
      table(
        ["Control", "Title", "Priority", "Highest gap severity", "Owner role", "Framework mappings (indicative)"],
        d.recommended_controls.map((c) => [
          c.id,
          c.title,
          c.priority,
          c.highest_severity,
          c.owner_role,
          maps(c.mappings),
        ]),
      ),
      "",
    );
  } else {
    L.push("No additional controls recommended from the answers provided.", "");
  }

  // 7 roadmap
  L.push("## 7. Remediation roadmap (30/60/90 days)", "");
  const labels: Record<string, string> = {
    "30": "First 30 days — contain Critical exposure",
    "60": "Days 31–60 — close High gaps",
    "90": "Days 61–90 — standardise and evidence",
    backlog: "Beyond 90 days — evidence hygiene backlog",
  };
  for (const h of ["30", "60", "90", "backlog"] as const) {
    const items = d.roadmap[h];
    L.push(`### ${labels[h] ?? h}`, "");
    if (items.length) {
      for (const i of items) {
        L.push(
          `- ${i.gap_id} (${i.severity}): ${i.action} — ${i.controls.join(", ")}; owner: ${i.owner_role}; due ${i.due_date}`,
        );
      }
    } else L.push("- No items.");
    L.push("");
  }

  // 8 evidence checklist
  L.push("## 8. Audit-ready evidence checklist", "");
  const evRows: unknown[][] = [];
  for (const f of ga.findings) {
    if (f.answer === "not_applicable") continue;
    evRows.push([
      f.evidence_status === "Verified" ? "[x]" : "[ ]",
      f.question_id,
      f.controls.join(", "),
      f.evidence_expected.join("; "),
      f.evidence_refs.join(", ") || "—",
      f.evidence_status,
    ]);
  }
  L.push(
    table(["Done", "Question", "Controls", "Evidence expected", "Evidence provided", "Status"], evRows),
    "",
    "Only items marked [x] have evidence reviewed by a named reviewer.",
    "",
  );

  // 9 guardrails
  L.push("## 9. Runtime guardrail recommendations", "");
  if (d.runtime_guardrails.length) {
    for (const g of d.runtime_guardrails)
      L.push(`- **${g.id}** — ${g.title} (${g.controls.join(", ")})`);
  } else L.push("- None identified.");
  if (d.shield_advice_summary) {
    L.push(
      "",
      `VERITRAIL Shield advisor rating: ${pyStr(d.shield_advice_summary.overall_rating || "n/a")} ` +
        "(see the draft runtime policy for details; activation in production requires human approval).",
    );
  }
  L.push(
    "",
    "Draft guardrail policies can be generated with VERITRAIL Shield; activating or changing a production runtime " +
      "policy requires human approval (IS-12, GL-04).",
    "",
  );

  // 10 approvals
  L.push("## 10. Human approvals", "");
  if (d.approvals.length) {
    L.push(
      table(
        ["Approval", "Type", "Status", "Resource", "Requested by", "Resolved by"],
        d.approvals.map((a) => [
          a["approval_id"],
          a["type"],
          a["status"],
          a["resource"],
          a["requested_by"],
          a["resolved_by"],
        ]),
      ),
      "",
    );
  } else L.push("No approvals recorded for this assessment.", "");

  // appendices
  L.push(
    "## Appendix A — Evidence status definitions",
    "",
    table(["Status", "Definition"], Object.entries(d.evidence_status_definitions)),
    "",
  );
  L.push(
    "## Appendix B — Audit trace",
    "",
    "Tool calls and agent turns for this assessment are recorded in the hash-chained VERITRAIL audit log (SE-08).",
    "",
  );
  if (d.audit_trace.length) {
    L.push(
      table(
        ["Timestamp (UTC)", "Trace ID", "Action", "Actor", "Outcome", "Audit record"],
        d.audit_trace
          .slice(-60)
          .map((r) => [(r.ts ?? "").slice(0, 19), r.trace_id, r.action, r.actor, r.outcome, r.id]),
      ),
      "",
    );
  }
  L.push(
    "## Appendix C — Method and limitations",
    "",
    "- Answers are self-reported; VERITRAIL has not inspected systems or documents unless evidence is marked Verified.",
    "- The risk tier is preliminary and rule-based; the EU AI Act category screen is a trigger for legal review, not a legal classification.",
    "- Framework mappings are indicative VERITRAIL interpretations from the Control Library, not official crosswalks.",
    "- Regulatory applicability timelines must be verified against the current Official Journal text and any amendments.",
    "",
    "## Disclaimer",
    "",
    d.disclaimer,
    "",
    d.template_disclaimer,
    "",
  );
  if (d.synthetic) L.push("*Synthetic example — fictional data.*", "");
  return L.join("\n");
}

export function gapRows(gapResult: GapResult): Array<Record<string, unknown>> {
  return gapResult.gaps.map((g) => {
    const src = g as unknown as Record<string, unknown>;
    const r: Record<string, unknown> = {};
    for (const k of GAP_CSV_COLUMNS) if (k in src) r[k] = src[k];
    for (const fw of ["nist_ai_rmf", "iso_42001", "eu_ai_act"]) r[fw] = g.framework_mappings[fw] ?? [];
    return r;
  });
}

export interface ReportExport {
  paths: Record<string, string | null>;
  errors: Record<string, string>;
  markdown: string;
  csv: string;
  json: string;
  pdfTitle: string;
}

/** Python json.dump(indent=2) shape (close enough for downloads; values are identical). */
function toJsonText(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

export const REPORT_FORMATS = ["md", "pdf", "csv", "json"] as const;

export function pdfTitleFor(d: Pick<ReportData, "synthetic" | "system">): string {
  const title = `VERITRAIL Use-Case Readiness Report — ${d.system.name || ""}`;
  return d.synthetic ? "Synthetic example — " + title : title;
}

/** Render every requested format; PDFs are produced on download (markdownToPdfBlob). */
export function exportReport(
  d: ReportData,
  outDir: string,
  formats: readonly string[] = REPORT_FORMATS,
  basename?: string | null,
): ReportExport {
  const base = basename || `veritrail_use_case_report_${d.report_id || "draft"}`;
  const md = renderMarkdown(d);
  const claims = findProhibitedClaims(md);
  if (claims.length) {
    // defence in depth: never emit a report containing a prohibited claim
    throw new Error(`Report failed prohibited-claim check: ${claims.slice(0, 3).join(" | ")}`);
  }
  const paths: Record<string, string | null> = {};
  if (formats.includes("md")) paths["md"] = `${outDir}/${base}.md`;
  if (formats.includes("json")) paths["json"] = `${outDir}/${base}.json`;
  if (formats.includes("csv")) paths["csv"] = `${outDir}/${base}_gap_register.csv`;
  if (formats.includes("pdf")) paths["pdf"] = `${outDir}/${base}.pdf`;
  return {
    paths,
    errors: {},
    markdown: md,
    csv: toCsv(gapRows(d.gap_analysis), GAP_CSV_COLUMNS),
    json: toJsonText({ ...d, markdown_sha_note: "Markdown rendering available in the .md export" }),
    pdfTitle: pdfTitleFor(d),
  };
}

export function controlLine(cid: string): string {
  const c = getControl(cid);
  return c ? `${controlCitation(cid)} — ${maps(c.mappings as Record<string, unknown>)}` : cid;
}
