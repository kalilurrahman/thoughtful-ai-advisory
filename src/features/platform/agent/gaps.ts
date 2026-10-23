/**
 * Gap analysis: evidence classification, severity, owners, due dates, roadmap, heat map
 * (veritrail_agent/gaps.py). Pure functions over an assessment record.
 *
 * Evidence status rules:
 *   Verified          answer=implemented AND ≥1 referenced evidence item reviewed by a named reviewer
 *   User-asserted     answer=implemented without reviewed evidence; also not_applicable (self-declared)
 *   Missing evidence  answer in {partial, not_implemented, unknown} and severity below Critical
 *   Critical gap      answer in {partial, not_implemented, unknown} and severity Critical
 *   Inferred          applicable question left unanswered — gap inferred from profile / tier
 * Severity = priority points + tier points + answer points (use_case_assessment.yaml severity_rules).
 */
import { EVIDENCE_STATUSES, getControl, type VeritrailControl } from "@/features/site/content";
import {
  answerOptions,
  getQuestion,
  severityRules,
  type UseCaseQuestion,
} from "@/features/site/engines/ask-veritrail/question-bank";
import { pyRound1 } from "./py";
import { addDays } from "./runtime";
import type { EvidenceRecord } from "./store";

export const GAP_SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type GapSeverity = (typeof GAP_SEVERITIES)[number];
export const GAP_SEVERITY_SLA_DAYS: Record<GapSeverity, number> = {
  Critical: 30,
  High: 60,
  Medium: 90,
  Low: 180,
};
export const PRIORITY_ORDER = ["critical", "high", "medium", "low"];
export const TIER_ORDER = ["Low", "Medium", "High", "Prohibited-review"];
export const DOMAIN_NAMES: Record<string, string> = {
  strategy: "Strategy & Accountability",
  inventory: "AI Inventory & Visibility",
  risk_lifecycle: "Risk Management & Lifecycle",
  data_privacy: "Data & Privacy",
  security: "Security & Resilience",
  fairness_transparency: "Fairness, Safety & Transparency",
  oversight_operations: "Human Oversight & Operations",
  assurance: "Assurance, Evidence & Improvement",
};
const HORIZON_BY_SEVERITY: Record<GapSeverity, string> = {
  Critical: "30",
  High: "60",
  Medium: "90",
  Low: "backlog",
};

export type EvidenceLookup = (ref: string) => EvidenceRecord | Record<string, unknown> | null | undefined;

export interface Finding {
  question_id: string;
  question: string;
  module: string;
  domain: string | null;
  controls: string[];
  primary_control: string;
  control_priority: string;
  framework_mappings: Record<string, string[]>;
  answer: string;
  evidence_refs: string[];
  reviewed_evidence: string[];
  evidence_status: string;
  is_gap: boolean;
  gap_type: "evidence" | "implementation" | null;
  severity: GapSeverity | null;
  owner_role: string;
  recommended_action: string;
  evidence_expected: string[];
  rationale: string;
  notes: string;
  sla_days?: number;
  due_date?: string;
  horizon?: string;
  gap_id?: string;
}

export type Gap = Finding & {
  severity: GapSeverity;
  sla_days: number;
  due_date: string;
  horizon: string;
  gap_id: string;
};

export interface GapSummary {
  questions: number;
  answered: number;
  gaps: number;
  by_severity: Record<GapSeverity, number>;
  by_evidence_status: Record<string, number>;
}

export interface GapResult {
  assessment_id: string | null;
  system_id: string | null;
  tier: string;
  as_of: string;
  findings: Finding[];
  gaps: Gap[];
  summary: GapSummary;
  sla_days: Record<GapSeverity, number>;
}

function sevIndex(s: string): number {
  return (GAP_SEVERITIES as readonly string[]).indexOf(s);
}

function primaryControl(controlIds: string[]): VeritrailControl {
  const ctrls = controlIds.map((c) => getControl(c)).filter((c): c is VeritrailControl => !!c);
  ctrls.sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority || "low") - PRIORITY_ORDER.indexOf(b.priority || "low"),
  );
  const first = ctrls[0];
  if (!first) throw new Error(`No known control in ${controlIds.join(", ")}`);
  return first;
}

function severityFromScore(score: number): GapSeverity {
  const th = severityRules().thresholds;
  for (const sev of ["Critical", "High", "Medium"] as const) if (score >= th[sev]) return sev;
  return "Low";
}

function capSeverity(sev: GapSeverity, cap: string): GapSeverity {
  return sevIndex(sev) >= sevIndex(cap) ? sev : (cap as GapSeverity);
}

export function mergedMappings(controlIds: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const cid of controlIds) {
    const c = getControl(cid);
    for (const [fw, refs] of Object.entries(c?.mappings ?? {})) {
      for (const r of refs ?? []) {
        const list = (out[fw] ??= []);
        if (!list.includes(String(r))) list.push(String(r));
      }
    }
  }
  return out;
}

interface ResponseLike {
  answer?: string;
  evidence_refs?: string[];
  notes?: string;
}

/** Classify one applicable question. */
export function classifyResponse(
  question: UseCaseQuestion,
  response: ResponseLike | null | undefined,
  tier: string,
  evidenceLookup: EvidenceLookup,
): Finding {
  const rules = severityRules();
  const opts = answerOptions();
  const primary = primaryControl(question.controls);
  const priority = primary.priority || "low";
  const answer = response?.answer || "unanswered";
  const refs = [...(response?.evidence_refs ?? [])];
  const evRecords = refs.map((r) => evidenceLookup(r));
  const reviewed = evRecords.filter(
    (e): e is Record<string, unknown> =>
      !!e && !!e["reviewed_by"] && (e["review_status"] ?? "accepted") === "accepted",
  );
  const pPts = rules.priority_points[priority] ?? 0;
  const tPts = rules.tier_points[tier] ?? 1;

  const rationale: string[] = [];
  let gapType: Finding["gap_type"] = null;
  let severity: GapSeverity | null = null;
  let status: string;
  if (answer === "not_applicable") {
    status = "User-asserted";
    rationale.push("Marked not applicable by the respondent (self-declared; confirm during review).");
  } else if (answer === "implemented" && reviewed.length) {
    status = "Verified";
    const names = [...new Set(reviewed.map((e) => String(e["reviewed_by"])))].sort();
    rationale.push("Implementation evidence reviewed by " + names.join(", ") + ".");
  } else if (answer === "implemented") {
    status = "User-asserted";
    gapType = "evidence";
    let aPts: number;
    let cap: string;
    if (refs.length) {
      aPts = 0;
      cap = "Low";
      rationale.push(
        "Implementation claimed and evidence referenced, but not yet reviewed by a named reviewer.",
      );
    } else {
      aPts = opts["implemented"]?.severity_points ?? 1;
      cap = rules.evidence_gap_max_severity;
      rationale.push("Implementation claimed without evidence.");
    }
    const score = pPts + tPts + aPts;
    severity = capSeverity(severityFromScore(score), cap);
    rationale.push(
      `Severity score ${score} = priority ${priority} (${pPts}) + tier ${tier} (${tPts}) + answer (${aPts}); capped at ${cap} for evidence-only gaps.`,
    );
  } else {
    gapType = "implementation";
    const aPts = answer in opts ? (opts[answer]?.severity_points ?? 2) : 2;
    const score = pPts + tPts + aPts;
    severity = severityFromScore(score);
    const override =
      answer === "not_implemented" &&
      Boolean((question as UseCaseQuestion & { critical_if_not_implemented?: boolean })
        .critical_if_not_implemented) &&
      TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(rules.critical_override_min_tier);
    if (override) severity = "Critical";
    rationale.push(
      `Severity score ${score} = priority ${priority} (${pPts}) + tier ${tier} (${tPts}) + answer '${answer}' (${aPts})` +
        (override
          ? "; raised to Critical (question flagged critical when not implemented)."
          : "."),
    );
    if (answer === "unanswered") {
      status = "Inferred";
      rationale.unshift(
        "Applicable question not answered; gap inferred from the system profile and risk tier.",
      );
    } else if (severity === "Critical") status = "Critical gap";
    else status = "Missing evidence";
    if (refs.length) rationale.push("Evidence referenced: " + refs.join(", ") + ".");
  }

  return {
    question_id: question.id,
    question: question.text,
    module: question.module,
    domain: question.domain ?? null,
    controls: [...question.controls],
    primary_control: primary.id,
    control_priority: priority,
    framework_mappings: mergedMappings(question.controls),
    answer,
    evidence_refs: refs,
    reviewed_evidence: reviewed.map((e) => String(e["id"])),
    evidence_status: status,
    is_gap: gapType !== null,
    gap_type: gapType,
    severity,
    owner_role: primary.owner_role || "AI Governance Lead",
    recommended_action: question.remediation || "",
    evidence_expected: [...(question.evidence_expected ?? [])],
    rationale: rationale.join(" "),
    notes: response?.notes ?? "",
  };
}

interface AssessmentLike {
  id?: string | null;
  system_id?: string | null;
  risk?: { tier?: string } | null;
  questions?: string[];
  responses?: Record<string, ResponseLike>;
}

export function identifyGaps(
  assessment: AssessmentLike,
  evidenceLookup: EvidenceLookup = () => null,
  asOf: string,
): GapResult {
  const tier = assessment.risk?.tier || "Medium";
  const responses = assessment.responses ?? {};
  const questions = assessment.questions ?? [];
  const findings: Finding[] = [];
  for (const qid of questions) {
    const q = getQuestion(qid);
    if (!q) continue;
    const f = classifyResponse(q, responses[qid], tier, evidenceLookup);
    if (f.is_gap && f.severity) {
      const sla = GAP_SEVERITY_SLA_DAYS[f.severity];
      f.sla_days = sla;
      f.due_date = addDays(asOf, sla);
      f.horizon = HORIZON_BY_SEVERITY[f.severity];
    }
    findings.push(f);
  }
  const gaps = findings.filter((f): f is Gap => f.is_gap);
  gaps.sort(
    (a, b) =>
      sevIndex(a.severity) - sevIndex(b.severity) ||
      PRIORITY_ORDER.indexOf(a.control_priority) - PRIORITY_ORDER.indexOf(b.control_priority) ||
      questions.indexOf(a.question_id) - questions.indexOf(b.question_id),
  );
  gaps.forEach((g, i) => {
    g.gap_id = `GAP-${String(i + 1).padStart(3, "0")}`;
  });
  const bySev = Object.fromEntries(
    GAP_SEVERITIES.map((s) => [s, gaps.filter((g) => g.severity === s).length]),
  ) as Record<GapSeverity, number>;
  const byStatus: Record<string, number> = Object.fromEntries(EVIDENCE_STATUSES.map((s) => [s, 0]));
  for (const f of findings) byStatus[f.evidence_status] = (byStatus[f.evidence_status] ?? 0) + 1;
  return {
    assessment_id: assessment.id ?? null,
    system_id: assessment.system_id ?? null,
    tier,
    as_of: asOf,
    findings,
    gaps,
    summary: {
      questions: findings.length,
      answered: findings.filter((f) => f.answer !== "unanswered").length,
      gaps: gaps.length,
      by_severity: bySev,
      by_evidence_status: byStatus,
    },
    sla_days: { ...GAP_SEVERITY_SLA_DAYS },
  };
}

export interface RecommendedFromGap {
  id: string;
  title: string;
  pillar: string;
  priority: string;
  owner_role: string | null;
  objective: string | null;
  evidence: string[];
  mappings: Record<string, unknown>;
  related_gaps: string[];
  related_questions: string[];
  highest_severity: GapSeverity;
}

export function recommendControlsFromGaps(gaps: Gap[], limit?: number | null): RecommendedFromGap[] {
  const agg = new Map<string, RecommendedFromGap>();
  for (const g of gaps) {
    for (const cid of g.controls) {
      const c = getControl(cid);
      if (!c) continue;
      let rec = agg.get(cid);
      if (!rec) {
        rec = {
          id: cid,
          title: c.title,
          pillar: c.pillar,
          priority: c.priority,
          owner_role: c.owner_role ?? null,
          objective: c.objective ?? null,
          evidence: [...(c.evidence ?? [])],
          mappings: (c.mappings ?? {}) as Record<string, unknown>,
          related_gaps: [],
          related_questions: [],
          highest_severity: g.severity,
        };
        agg.set(cid, rec);
      }
      rec.related_gaps.push(g.gap_id);
      rec.related_questions.push(g.question_id);
      if (sevIndex(g.severity) < sevIndex(rec.highest_severity)) rec.highest_severity = g.severity;
    }
  }
  const out = [...agg.values()].sort(
    (a, b) =>
      sevIndex(a.highest_severity) - sevIndex(b.highest_severity) ||
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  return limit ? out.slice(0, limit) : out;
}

export interface HeatMapRow {
  domain: string;
  name: string;
  questions: number;
  verified: number;
  implementation_indicator: number | null;
  critical: number;
  high: number;
  medium: number;
  low: number;
  rating: string;
}

export function heatMap(findings: Finding[]): HeatMapRow[] {
  const opts = answerOptions();
  const rows: HeatMapRow[] = [];
  for (const [dom, name] of Object.entries(DOMAIN_NAMES)) {
    const fs = findings.filter((f) => f.domain === dom);
    if (!fs.length) continue;
    const scored = fs.filter((f) => f.answer !== "not_applicable");
    const credit = scored.map((f) => (f.answer in opts ? (opts[f.answer]?.credit ?? 0) : 0));
    const impl = credit.length
      ? pyRound1((100 * credit.reduce((a, n) => a + n, 0)) / credit.length)
      : null;
    const sev = Object.fromEntries(
      GAP_SEVERITIES.map((s) => [s, fs.filter((f) => f.severity === s).length]),
    ) as Record<GapSeverity, number>;
    const rating = sev.Critical
      ? "Critical exposure"
      : sev.High
        ? "High exposure"
        : sev.Medium
          ? "Moderate exposure"
          : "Low exposure";
    rows.push({
      domain: dom,
      name,
      questions: fs.length,
      verified: fs.filter((f) => f.evidence_status === "Verified").length,
      implementation_indicator: impl,
      critical: sev.Critical,
      high: sev.High,
      medium: sev.Medium,
      low: sev.Low,
      rating,
    });
  }
  return rows;
}

export interface RoadmapItem {
  gap_id: string;
  action: string;
  controls: string[];
  owner_role: string;
  due_date: string;
  severity: GapSeverity;
}

export function roadmap(gaps: Gap[]): Record<"30" | "60" | "90" | "backlog", RoadmapItem[]> {
  const out: Record<"30" | "60" | "90" | "backlog", RoadmapItem[]> = {
    "30": [],
    "60": [],
    "90": [],
    backlog: [],
  };
  for (const g of gaps) {
    out[g.horizon as "30" | "60" | "90" | "backlog"].push({
      gap_id: g.gap_id,
      action: g.recommended_action,
      controls: g.controls,
      owner_role: g.owner_role,
      due_date: g.due_date,
      severity: g.severity,
    });
  }
  return out;
}
