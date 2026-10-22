/**
 * Pilot dress rehearsal — browser port of platform/scripts/pilot_dry_run.py.
 *
 * Runs the full Pilot A (regulated enterprise) workflow end-to-end on a SYNTHETIC organization
 * with the real (browser) AEGIS tooling: nothing here is customer data; all answers are generated
 * deterministically and labelled synthetic. Pure and deterministic: with the default seed it
 * reproduces the Python run exactly (same IDs, gap register, executive report and audit chain).
 *
 *   W2  register 28 AI systems + preliminary risk tiers; tier confirmation via the approval queue
 *       (assessor requests, approver resolves); self-approval refused
 *   W3  organization maturity self-assessment
 *   W4  deep-dive assessments of all High-tier systems; runtime policies for 2 agentic systems
 *       (draft, activation pending human approval)
 *   W5  consolidated gap register; remediation tasks for Critical gaps after explicit confirmation
 *   W6  executive readiness report; approval-gated evidence pack export; audit-chain verification
 */
import { STANDARD_DISCLAIMER, getControl } from "@/features/site/content";
import { findProhibitedClaims } from "@/features/site/engines/ask-aegis/safety";
import {
  buildAssessmentBundle,
  scoreAssessment,
  type AssessmentResult,
} from "@/features/site/engines/assessment-engine";
import { sha256Hex } from "../audit";
import { AegisAgent } from "../agent/orchestrator";
import { pyFloat } from "../agent/py";
import { deterministicRuntime } from "../agent/runtime";
import type { Gap, GapSummary } from "../agent/gaps";
import { toCsv } from "../reports/exporters";
import { renderMaturityMarkdown } from "../reports/maturity";

export const ORG = "Example Regional Bank (synthetic)";
export const ASSESSOR = { id: "u-assessor-1", role: "assessor", name: "Synthetic AEGIS Analyst" } as const;
export const APPROVER = { id: "u-approver-1", role: "approver", name: "Synthetic Head of AI Risk" } as const;
export const AS_OF = "2026-10-21";
/** Virtual output directory (the Python script writes output/sample_reports/pilot_dry_run). */
export const OUT = "pilot_dry_run";

type Row = [
  name: string,
  purpose: string,
  decisionImpact: string,
  affected: string,
  sensitivity: string,
  autonomy: string,
  category: string,
  tools: string[],
  external: boolean,
  genai: boolean,
  vendor: boolean,
];

// name, purpose, decision_impact, affected, sensitivity, autonomy, category, tools, external, genai, vendor
export const SYSTEMS: Row[] = [
  ["SME credit decisioning model", "Recommend credit limits for small-business applicants", "material", "customers", "personal", "suggests", "credit", [], false, false, false],
  ["Retail credit scorecard", "Score consumer loan applications", "automated_decision", "customers", "personal", "acts_autonomously", "credit", ["loan_origination_write"], false, false, false],
  ["Card fraud detection", "Flag suspicious card transactions for review", "material", "customers", "personal", "acts_with_approval", "financial_services", ["card_block"], false, false, true],
  ["AML transaction monitoring", "Prioritise AML alerts for investigators", "advisory", "customers", "personal", "suggests", "financial_services", [], false, false, true],
  ["KYC document verification", "Extract and verify ID documents at onboarding", "material", "customers", "special_category", "suggests", "essential_services", [], false, false, true],
  ["Biometric face match (ID&V)", "Match selfie to ID photo during onboarding", "material", "customers", "special_category", "suggests", "biometric", [], false, false, true],
  ["Customer support agent", "Answer customer queries and update tickets using CRM data", "advisory", "customers", "personal", "acts_with_approval", "customer_service", ["crm_read", "crm_write", "send_email"], true, true, true],
  ["Collections outreach agent", "Draft and send payment-reminder messages", "advisory", "customers", "personal", "acts_autonomously", "customer_service", ["crm_read", "send_sms", "send_email"], true, true, true],
  ["Chargeback dispute assistant", "Draft dispute responses for analysts", "advisory", "customers", "personal", "suggests", "customer_service", ["case_read"], false, true, true],
  ["Marketing propensity model", "Rank customers for product offers", "advisory", "customers", "personal", "suggests", "other", [], false, false, false],
  ["CV screening assistant", "Shortlist job applicants for recruiters", "material", "public", "personal", "suggests", "employment", [], false, true, true],
  ["Employee attrition model", "Predict attrition risk for HR planning", "advisory", "internal", "personal", "suggests", "employment", [], false, false, false],
  ["Internal code assistant", "Suggest code for developers", "none", "internal", "confidential", "suggests", "internal_productivity", [], false, true, true],
  ["Meeting summariser", "Summarise internal meetings", "none", "internal", "internal", "suggests", "internal_productivity", [], false, true, true],
  ["Contract review LLM", "Highlight clauses in supplier contracts", "advisory", "internal", "confidential", "suggests", "other", [], false, true, true],
  ["Call-centre speech analytics", "Transcribe and tag call topics", "advisory", "customers", "personal", "suggests", "customer_service", [], false, true, true],
  ["Treasury liquidity forecast", "Forecast intraday liquidity", "advisory", "internal", "confidential", "suggests", "financial_services", [], false, false, false],
  ["Branch staffing forecast", "Forecast branch staffing needs", "advisory", "internal", "internal", "suggests", "internal_productivity", [], false, false, false],
  ["Document OCR pipeline", "Digitise paper forms", "none", "internal", "personal", "suggests", "other", [], false, false, true],
  ["Email triage classifier", "Route inbound customer emails", "advisory", "customers", "personal", "suggests", "customer_service", [], false, false, false],
  ["IT helpdesk agent", "Reset passwords and answer IT questions", "advisory", "internal", "internal", "acts_with_approval", "internal_productivity", ["itsm_write", "iam_reset"], false, true, true],
  ["Cyber threat detection", "Detect anomalous network activity", "advisory", "internal", "confidential", "suggests", "critical_infrastructure", [], false, false, true],
  ["Robo-advice portfolio tool", "Suggest investment portfolios to retail clients", "material", "customers", "personal", "suggests", "financial_services", [], false, false, true],
  ["Complaints classifier", "Classify and route complaints", "advisory", "customers", "personal", "suggests", "customer_service", [], false, false, false],
  ["Regulatory reporting assistant", "Answer questions over regulatory reporting manuals (RAG)", "advisory", "internal", "confidential", "suggests", "other", ["doc_search"], false, true, true],
  ["Policy Q&A assistant", "Answer staff questions about internal policies (RAG)", "none", "internal", "internal", "suggests", "internal_productivity", ["doc_search"], false, true, true],
  ["Sales copilot (vendor)", "Draft sales emails inside the CRM", "none", "customers", "personal", "suggests", "other", ["crm_read"], false, true, true],
  ["Mortgage valuation model", "Estimate property values for mortgage underwriting", "material", "customers", "confidential", "suggests", "credit", [], false, false, true],
];

export const AGENT_REVIEWS = ["Customer support agent", "Collections outreach agent"];
export const MATURITY_ANSWERS: Record<string, number> = {
  "STR-Q1": 3, "STR-Q2": 3, "STR-Q3": 2, "INV-Q1": 2, "INV-Q2": 2, "INV-Q3": 2,
  "RSK-Q1": 3, "RSK-Q2": 2, "RSK-Q3": 2, "DAT-Q1": 3, "DAT-Q2": 3, "DAT-Q3": 2,
  "SEC-Q1": 3, "SEC-Q2": 2, "SEC-Q3": 2, "FST-Q1": 3, "FST-Q2": 2, "FST-Q3": 2,
  "HUM-Q1": 3, "HUM-Q2": 3, "HUM-Q3": 2, "ASR-Q1": 2, "ASR-Q2": 2, "ASR-Q3": 3,
};
export const MATURITY_PROFILE = {
  industry: "bfsi",
  org_size: "1000-5000",
  ai_systems: "25-99",
  uses_agents: true,
  eu_operations: true,
};

const TIER_ORDER: Record<string, number> = { "Prohibited-review": 0, High: 1, Medium: 2, Low: 3 };

export function profileOf(row: Row): Record<string, unknown> {
  const [name, purpose, di, ap, ds, au, cat, tools, ext, genai, vendor] = row;
  return {
    name,
    purpose,
    decision_impact: di,
    affected_parties: ap,
    data_sensitivity: ds,
    autonomy: au,
    domain_category: cat,
    tools,
    external_actions: ext,
    genai,
    vendor_model: vendor,
    eu_exposure: true,
    environment: "production",
    business_owner: `Synthetic owner — ${name}`,
  };
}

/** Deterministic pseudo-random answer with a realistic mix; ~15% carry an evidence reference. */
export function syntheticAnswer(system: string, qid: string): [string, string[]] {
  const h = BigInt("0x" + sha256Hex(`${system}|${qid}`));
  const r = Number(h % 100n);
  const ans = r < 30 ? "implemented" : r < 58 ? "partial" : r < 83 ? "not_implemented" : "unknown";
  const refs =
    (ans === "implemented" || ans === "partial") && (h / 100n) % 3n === 0n
      ? [`EVD-${Number(h % 9000n) + 1000}`]
      : [];
  return [ans, refs];
}

function slugOf(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("&", "and")
    .replaceAll("-", "_");
}

/** collections.Counter with most_common() ordering (count desc, then first-seen order). */
class Counter {
  readonly counts = new Map<string, number>();
  constructor(items: Iterable<string> = []) {
    for (const x of items) this.add(x);
  }
  add(x: string): void {
    this.counts.set(x, (this.counts.get(x) ?? 0) + 1);
  }
  get(x: string): number {
    return this.counts.get(x) ?? 0;
  }
  mostCommon(n?: number): Array<[string, number]> {
    const out = [...this.counts.entries()].sort((a, b) => b[1] - a[1]);
    return n === undefined ? out : out.slice(0, n);
  }
  toObject(): Record<string, number> {
    return Object.fromEntries(this.counts);
  }
}

/** Python round() (half-even) to an integer. */
function pyRound(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

export interface InventoryItem {
  system_id: string;
  name: string;
  purpose: string;
  domain_category: string;
  autonomy: string;
  data_sensitivity: string;
  genai: boolean;
  vendor_model: boolean;
  tools: string[];
  preliminary_tier: string;
  tier_score: number;
  tier_evidence_status: string;
  triggers: string[];
  profile: Record<string, unknown>;
  tier_confirmation?: string;
}

export interface DeepDive {
  system: string;
  assessment_id: string;
  tier: string;
  questions: number;
  summary: GapSummary;
  report_dir: string;
  report_id: string;
}

export interface PolicyRow {
  agent: string;
  policy_id: string;
  version: string;
  status: string;
  rollout_mode: string;
  rating: string;
  validation_errors: number;
  activation_approval: string;
  yaml: string;
  json: string;
}

export interface Metric {
  metric: string;
  target: string;
  result: string;
  status: string;
}

export interface DryRunResult {
  synthetic: true;
  organization: string;
  agent: AegisAgent;
  inventory: InventoryItem[];
  maturity: AssessmentResult;
  assessments: DeepDive[];
  policies: PolicyRow[];
  allGaps: Array<Record<string, unknown>>;
  criticalTasks: number;
  tiers: Record<string, number>;
  gapSeverity: Record<string, number>;
  evidenceStatus: Record<string, number>;
  metrics: Metric[];
  log: string[];
  separationOfDuties: string;
  evidencePack: { status: string; items: number; approvalId: string; pack: Record<string, unknown> | null };
  audit: { count: number; ok: boolean; message: string; head: string };
  outputs: {
    executiveMarkdown: string;
    inventoryCsv: string;
    maturityMarkdown: string;
    gapRegisterCsv: string;
    evidencePackJson: string;
    metricsJson: string;
    runLogMarkdown: string;
    auditJsonl: string;
  };
}

export interface DryRunProgress {
  phase: string;
  label: string;
  done: number;
  total: number;
}

export interface DryRunOptions {
  /** Lowercase alphanumeric tag mixed into every generated ID; "" (default) reproduces the Python run. */
  seed?: string;
  /** Fixed clock for the run (ISO); default 2026-10-21T09:00:00Z, as in the Python parity export. */
  at?: string;
}

const GAP_COLS = [
  "system",
  "tier",
  "gap_id",
  "severity",
  "evidence_status",
  "question_id",
  "controls",
  "owner_role",
  "recommended_action",
  "due_date",
];

/**
 * The dress rehearsal as a generator: yields progress between units of work (so a UI can keep
 * the main thread responsive) and returns the full result.
 */
export function* dryRunSteps(opts: DryRunOptions = {}): Generator<DryRunProgress, DryRunResult> {
  const runtimeOpts: { tag?: string; at?: string } = {};
  if (opts.seed) runtimeOpts.tag = opts.seed;
  if (opts.at) runtimeOpts.at = opts.at;
  const agent = new AegisAgent({ runtime: deterministicRuntime(runtimeOpts), root: `${OUT}/_agent_data` });
  const log: string[] = [];
  const TOTAL = 8;

  // ---------------- W2 inventory + preliminary tiers
  yield { phase: "W2", label: "Registering 28 AI systems and calculating preliminary tiers", done: 0, total: TOTAL };
  const inventory: InventoryItem[] = [];
  for (const row of SYSTEMS) {
    const prof = profileOf(row);
    const rec = agent.callTool("create_ai_system_record", ASSESSOR, {
      profile: prof,
      owner: String(prof["business_owner"]),
    });
    const tier = agent.callTool("calculate_risk_tier", ASSESSOR, { profile: prof });
    inventory.push({
      system_id: rec.system.id,
      name: String(prof["name"]),
      purpose: String(prof["purpose"]),
      domain_category: String(prof["domain_category"]),
      autonomy: String(prof["autonomy"]),
      data_sensitivity: String(prof["data_sensitivity"]),
      genai: Boolean(prof["genai"]),
      vendor_model: Boolean(prof["vendor_model"]),
      tools: prof["tools"] as string[],
      preliminary_tier: tier.tier,
      tier_score: tier.score,
      tier_evidence_status: tier.evidence_status,
      triggers: tier.triggers,
      profile: prof,
    });
  }
  log.push(`W2: registered ${inventory.length} AI systems as draft records`);

  // Human confirmation of tiers: assessor requests, approver resolves (separation of duties)
  yield { phase: "W2", label: "Confirming tiers through the approval queue", done: 1, total: TOTAL };
  let confirmed = 0;
  for (const inv of inventory) {
    const req = agent.callTool("request_human_approval", ASSESSOR, {
      action: "confirm_risk_tier",
      resource_id: inv.system_id,
      payload: { system_id: inv.system_id, tier: inv.preliminary_tier },
      reason: `Confirm preliminary tier ${inv.preliminary_tier}`,
    });
    const res = agent.resolveApproval(req.approval_id, "approve", APPROVER, "Synthetic dry-run confirmation");
    inv.tier_confirmation = res.status || "approved";
    confirmed += 1;
  }
  // Self-approval must be refused
  const first = inventory[0];
  if (!first) throw new Error("no systems");
  const down = agent.callTool("request_human_approval", ASSESSOR, {
    action: "change_risk_tier",
    resource_id: first.system_id,
    payload: { system_id: first.system_id, tier: "Low" },
    reason: "Attempted downgrade",
  });
  let sod: string;
  try {
    agent.resolveApproval(down.approval_id, "approve", ASSESSOR);
    sod = "FAILED — self-approval was accepted";
  } catch (e) {
    sod = `PASS — self-approval refused (${e instanceof Error ? e.name : "Error"})`;
  }
  agent.resolveApproval(down.approval_id, "reject", APPROVER, "Downgrade not justified (synthetic)");
  log.push(`W2: ${confirmed} tier confirmations approved by approver; separation-of-duties check: ${sod}`);
  const inventoryCsv = toCsv(inventory.map(({ profile: _p, ...rest }) => rest as Record<string, unknown>));

  // ---------------- W3 maturity
  yield { phase: "W3", label: "Scoring the maturity self-assessment", done: 2, total: TOTAL };
  const bundle = buildAssessmentBundle();
  const mres = scoreAssessment(MATURITY_ANSWERS, MATURITY_PROFILE, bundle);
  const maturityMarkdown = renderMaturityMarkdown(mres, bundle, { company: ORG }, AS_OF);
  log.push(
    `W3: maturity baseline ${pyFloat(mres.overall_score)} (${mres.maturity_level}), ${mres.critical_flags.length} critical flags`,
  );

  // ---------------- W4 deep dives: all High (+ Prohibited-review) systems, at least 5
  const ranked = [...inventory].sort(
    (a, b) =>
      (TIER_ORDER[a.preliminary_tier] ?? 9) - (TIER_ORDER[b.preliminary_tier] ?? 9) || b.tier_score - a.tier_score,
  );
  const high = ranked.filter((i) => i.preliminary_tier === "High" || i.preliminary_tier === "Prohibited-review");
  const deep = high.length >= 5 ? high : ranked.slice(0, 5);
  const allGaps: Array<Record<string, unknown>> = [];
  const assessments: DeepDive[] = [];
  let n = 0;
  for (const inv of deep) {
    n += 1;
    yield { phase: "W4", label: `Deep-dive assessment ${n} of ${deep.length}: ${inv.name}`, done: 3, total: TOTAL };
    const st = agent.callTool("start_assessment", ASSESSOR, { system_id: inv.system_id });
    const aid = st.assessment_id;
    const a = agent.store.get("assessments", aid);
    const questions = a?.questions ?? [];
    for (const qid of questions) {
      const [ans, refs] = syntheticAnswer(inv.name, qid);
      agent.callTool("submit_assessment_response", ASSESSOR, {
        assessment_id: aid,
        question_id: qid,
        answer: ans,
        evidence_refs: refs,
        notes: "synthetic dry-run answer",
      });
    }
    // approver reviews half of the submitted evidence -> becomes Verified
    const evs = agent.store.list("evidence").filter((e) => e.assessment_id === aid);
    evs.forEach((e, i) => {
      if (i % 2 === 0) agent.reviewEvidence(e.ref, APPROVER, true, "Synthetic review");
    });
    const g = agent.callTool("identify_gaps", ASSESSOR, { assessment_id: aid, as_of: AS_OF });
    const slug = slugOf(inv.name);
    const rep = agent.callTool("generate_report", ASSESSOR, {
      assessment_id: aid,
      formats: ["md", "pdf", "csv", "json"],
      out_dir: `${OUT}/03_deep_dives/${slug}`,
      synthetic: true,
      as_of: AS_OF,
      basename: slug,
    });
    for (const gap of g.gaps as Gap[]) {
      allGaps.push({ system: inv.name, system_id: inv.system_id, tier: inv.preliminary_tier, ...gap });
    }
    assessments.push({
      system: inv.name,
      assessment_id: aid,
      tier: inv.preliminary_tier,
      questions: questions.length,
      summary: g.summary,
      report_dir: `03_deep_dives/${slug}`,
      report_id: rep.report_id,
    });
  }
  log.push(
    `W4: completed ${assessments.length} deep-dive assessments via agent tools (${assessments.reduce((s, x) => s + x.questions, 0)} responses)`,
  );

  // Agent reviews -> runtime policies
  yield { phase: "W4", label: "Drafting runtime policies for agentic systems", done: 4, total: TOTAL };
  const policies: PolicyRow[] = [];
  for (const name of AGENT_REVIEWS) {
    const inv = inventory.find((i) => i.name === name);
    if (!inv) continue;
    const asm = assessments.find((x) => x.system === name);
    const res = asm
      ? agent.callTool("draft_runtime_policy", ASSESSOR, { assessment_id: asm.assessment_id })
      : agent.callTool("draft_runtime_policy", ASSESSOR, { profile: inv.profile });
    if (res.status === "draft" && res.advice) {
      const pol = res.advice.policy as unknown as Record<string, unknown>;
      // activation requires approval — request it, do NOT resolve (stays pending: production change)
      const appr = agent.callTool("request_human_approval", ASSESSOR, {
        action: "activate_runtime_policy",
        resource_id: res.policy_id ?? null,
        payload: { policy_id: pol["policy_id"] ?? null, version: pol["version"] ?? null },
        reason: "Move from observe to enforce after shadow period (synthetic)",
      });
      policies.push({
        agent: name,
        policy_id: String(pol["policy_id"]),
        version: String(pol["version"]),
        status: String(pol["status"]),
        rollout_mode: String(((pol["rollout"] ?? {}) as Record<string, unknown>)["mode"]),
        rating: String(res.advice.risk_profile?.overall_rating ?? ""),
        validation_errors: (res.validation_errors ?? []).length,
        activation_approval: `${appr.approval_id} (pending)`,
        yaml: res.advice.policy_yaml,
        json: res.advice.policy_json,
      });
    }
  }
  log.push(
    `W4: ${policies.length} agent reviews; runtime policies drafted (status draft, activation pending human approval)`,
  );

  // ---------------- W5 consolidated gap register + remediation tasks
  yield { phase: "W5", label: "Consolidating the gap register and remediation tasks", done: 5, total: TOTAL };
  const gapRegisterCsv = toCsv(allGaps, GAP_COLS);
  let critTasks = 0;
  for (const asm of assessments) {
    const hasCritical = allGaps.some((g) => g["severity"] === "Critical" && g["system"] === asm.system);
    const prev = hasCritical
      ? agent.callTool("create_remediation_task", ASSESSOR, {
          assessment_id: asm.assessment_id,
          severities: ["Critical"],
        })
      : null;
    if (prev && prev.status === "confirmation_required") {
      const done = agent.callTool("create_remediation_task", ASSESSOR, {
        assessment_id: asm.assessment_id,
        severities: ["Critical"],
        confirmed: true,
      });
      if (done.status === "created") critTasks += done.count;
    }
  }
  log.push(
    `W5: gap register ${allGaps.length} gaps; ${critTasks} remediation tasks created for Critical gaps after explicit confirmation`,
  );

  // ---------------- W6 evidence pack (approval-gated) for the top system
  yield { phase: "W6", label: "Approval-gated evidence pack export", done: 6, total: TOTAL };
  const top = assessments[0];
  if (!top) throw new Error("no deep dives");
  const p1 = agent.callTool("export_evidence_pack", ASSESSOR, { assessment_id: top.assessment_id });
  if (p1.status !== "pending_approval") throw new Error("evidence export was not approval-gated");
  agent.resolveApproval(p1.approval_id, "approve", APPROVER, "Approved for audit preparation (synthetic)");
  const p2 = agent.callTool("export_evidence_pack", ASSESSOR, {
    assessment_id: top.assessment_id,
    approval_id: p1.approval_id,
    out_dir: `${OUT}/06_evidence_pack`,
  });
  const items = p2.status === "exported" ? p2.evidence_items : 0;
  log.push(
    `W6: evidence pack export: first call -> ${p1.status}; after approval -> ${p2.status} (${items} items)`,
  );
  const pack =
    p2.status === "exported"
      ? ((agent.store.get("exports", p2.export_id)?.pack ?? null) as Record<string, unknown> | null)
      : null;

  // ---------------- metrics
  yield { phase: "W6", label: "Executive report, metrics and audit-chain verification", done: 7, total: TOTAL };
  const tiers = new Counter(inventory.map((i) => i.preliminary_tier));
  const nHigh = tiers.get("High") + tiers.get("Prohibited-review");
  const assessedHigh = assessments.filter((x) => x.tier === "High" || x.tier === "Prohibited-review").length;
  const sev = new Counter(allGaps.map((g) => String(g["severity"])));
  const evs = new Counter(allGaps.map((g) => String(g["evidence_status"])));
  const metrics: Metric[] = [
    ["AI systems registered", "≥ 25", String(inventory.length), inventory.length >= 25 ? "Met (synthetic)" : "Not met"],
    [
      "High-risk systems assessed",
      "100%",
      `${assessedHigh}/${nHigh} (${pyRound((assessedHigh / Math.max(nHigh, 1)) * 100)}%)`,
      assessedHigh === nHigh ? "Met (synthetic)" : "Not met",
    ],
    [
      "Agent-assisted assessment completion",
      "≥ 70%",
      "100% (all responses captured via agent tools; scripted)",
      "Met (synthetic — not a measure of user adoption)",
    ],
    [
      "Critical gaps documented with owners",
      "Yes",
      `${sev.get("Critical")} critical gaps, all with owner role + due date`,
      "Met (synthetic)",
    ],
    ["Runtime policies drafted", "≥ 2", String(policies.length), policies.length >= 2 ? "Met (synthetic)" : "Not met"],
    ["Executive report accepted", "Yes", "Report generated", "Requires real partner"],
    ["Follow-on commercial discussion initiated", "Yes", "—", "Requires real partner"],
  ].map(([metric, target, result, status]) => ({
    metric: metric ?? "",
    target: target ?? "",
    result: result ?? "",
    status: status ?? "",
  }));

  // ---------------- executive readiness report
  const L: string[] = [
    `# Executive Readiness Report — ${ORG}`,
    "",
    "> **SYNTHETIC DRESS REHEARSAL.** Fictional organization, generated answers. This report demonstrates the AEGIS " +
      "Pilot A workflow and outputs; it is not evidence about any real organization.",
    "",
    `**Prepared:** ${AS_OF} · **Scope:** AEGIS Governance Baseline (Pilot A profile) · **Prepared by:** AEGIS Agent-assisted workflow, synthetic analyst`,
    "",
    "## 1. Executive summary",
    "",
    `- **${inventory.length} AI systems** registered as draft inventory records (EI-01); preliminary tiers: ` +
      [...tiers.counts.entries()]
        .sort((a, b) => (TIER_ORDER[a[0]] ?? 9) - (TIER_ORDER[b[0]] ?? 9))
        .map(([k, v]) => `${k} ${v}`)
        .join(", ") +
      ". Tiers are Inferred and were confirmed through the approval queue (EI-02, IS-13).",
    `- **Enterprise maturity: ${pyFloat(mres.overall_score)} / 100 — ${mres.maturity_level}** (self-reported, User-asserted).`,
    `- **${assessments.length} deep-dive assessments** covering every High-tier system; **${allGaps.length} gaps** identified ` +
      `(Critical ${sev.get("Critical")}, High ${sev.get("High")}, Medium ${sev.get("Medium")}, Low ${sev.get("Low")}).`,
    `- **${policies.length} runtime policies** drafted for agentic systems; both remain in draft/observe mode pending human approval to activate (IS-12, IS-13).`,
    "- Evidence position: " + evs.mostCommon().map(([k, v]) => `${k}: ${v}`).join(", ") + ".",
    "",
    "## 2. AI portfolio by risk tier",
    "",
    "| Tier | Systems | Examples |",
    "|---|---|---|",
  ];
  for (const t of ["Prohibited-review", "High", "Medium", "Low"]) {
    const ex = inventory.filter((i) => i.preliminary_tier === t).slice(0, 4).map((i) => i.name);
    if (ex.length) L.push(`| ${t} | ${tiers.get(t)} | ${ex.join(", ")} |`);
  }
  L.push("", "## 3. Maturity baseline by domain", "", "| Domain | Score |", "|---|---|");
  for (const d of mres.domains) L.push(`| ${d.name} | ${pyFloat(d.score)} |`);
  L.push(
    "",
    "## 4. Risk heat map — gaps by system and severity",
    "",
    "| System | Tier | Critical | High | Medium | Low |",
    "|---|---|---|---|---|---|",
  );
  for (const x of assessments) {
    const c = new Counter(allGaps.filter((g) => g["system"] === x.system).map((g) => String(g["severity"])));
    L.push(`| ${x.system} | ${x.tier} | ${c.get("Critical")} | ${c.get("High")} | ${c.get("Medium")} | ${c.get("Low")} |`);
  }
  const ctrlCounter = new Counter(
    allGaps
      .filter((g) => g["severity"] === "Critical" || g["severity"] === "High")
      .flatMap((g) => (g["controls"] as string[] | undefined) ?? []),
  );
  L.push("", "## 5. Most frequent Critical/High control gaps", "", "| Control | Occurrences |", "|---|---|");
  for (const [cid, cnt] of ctrlCounter.mostCommon(10)) L.push(`| ${cid} ${getControl(cid)?.title ?? cid} | ${cnt} |`);
  L.push(
    "",
    "## 6. Remediation roadmap",
    "",
    "- **First 30 days:** close Critical gaps (owners and due dates in the gap register), stand up the AI system of record as authoritative (EI-01, EI-03), enable redaction and kill switch for agentic systems (IS-04, IS-15).",
    "- **Days 31–60:** High gaps; adversarial testing of LLM apps and agents (IS-14); change triggers for model/prompt/tool changes (GL-04); move runtime policies from observe to warn/protect (IS-12).",
    "- **Days 61–90:** Medium gaps; control-testing programme and evidence repository (SE-01, SE-02); leadership KPI pack (SE-03); enforce mode for agents after approval (IS-13).",
    "",
    "## 7. Runtime Shield recommendations",
    "",
    "| Agent | Policy | Version | Status | Rollout mode | Risk rating | Activation |",
    "|---|---|---|---|---|---|---|",
  );
  for (const p of policies) {
    L.push(
      `| ${p.agent} | ${p.policy_id} | ${p.version} | ${p.status} | ${p.rollout_mode} | ${p.rating} | ${p.activation_approval} |`,
    );
  }
  L.push("", "## 8. Pilot success metrics (dry run)", "", "| Metric | Target | Result | Status |", "|---|---|---|---|");
  for (const m of metrics) L.push(`| ${m.metric} | ${m.target} | ${m.result} | ${m.status} |`);
  L.push("", "## 9. Governance checks exercised", "", ...log.map((x) => `- ${x}`));
  L.push(
    "",
    "## 10. Artefacts",
    "",
    "- `01_ai_inventory.csv` — inventory with preliminary tiers",
    "- `02_maturity_baseline.{md,pdf}`",
    "- `03_deep_dives/<system>/` — per-system report (md, pdf, csv gap register, json)",
    "- `04_runtime_policies/` — advisor output + policy YAML/JSON for two agents",
    "- `05_gap_register.csv` — consolidated",
    "- `06_evidence_pack/` — approval-gated evidence pack",
    "- `metrics.json`, `run_log.md`",
    "",
    `*${STANDARD_DISCLAIMER}*`,
    "",
  );
  const executiveMarkdown = L.join("\n");
  const claims = findProhibitedClaims(executiveMarkdown);
  if (claims.length) throw new Error(`Executive report failed prohibited-claim check: ${claims[0]}`);

  const verify = agent.audit.verify();
  const nAudit = agent.audit.records.length;
  const runLogMarkdown =
    "# Pilot dry-run log (synthetic)\n\n" +
    log.map((x) => `- ${x}`).join("\n") +
    "\n" +
    `- Audit chain: ${nAudit} records, verify=${verify.ok ? "True" : "False"} (${verify.message})\n`;
  const metricsJson =
    JSON.stringify(
      {
        synthetic: true,
        organization: ORG,
        metrics,
        tiers: tiers.toObject(),
        gap_severity: sev.toObject(),
        evidence_status: evs.toObject(),
        assessments: assessments.map(({ report_id: _r, ...rest }) => rest),
        policies: policies.map(({ yaml: _y, json: _j, ...rest }) => rest),
      },
      null,
      2,
    ) + "\n";

  return {
    synthetic: true,
    organization: ORG,
    agent,
    inventory,
    maturity: mres,
    assessments,
    policies,
    allGaps,
    criticalTasks: critTasks,
    tiers: tiers.toObject(),
    gapSeverity: sev.toObject(),
    evidenceStatus: evs.toObject(),
    metrics,
    log,
    separationOfDuties: sod,
    evidencePack: { status: p2.status, items, approvalId: p1.approval_id, pack },
    audit: { count: nAudit, ok: verify.ok, message: verify.message, head: agent.audit.lastHash },
    outputs: {
      executiveMarkdown,
      inventoryCsv,
      maturityMarkdown,
      gapRegisterCsv,
      evidencePackJson: JSON.stringify(pack, null, 2) + "\n",
      metricsJson,
      runLogMarkdown,
      auditJsonl: agent.audit.toJsonl(),
    },
  };
}

/** Run the whole rehearsal synchronously. */
export function runDryRun(opts: DryRunOptions = {}): DryRunResult {
  const it = dryRunSteps(opts);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

/** Run the rehearsal in chunks, yielding to the event loop between units of work. */
export async function runDryRunAsync(
  onProgress: (p: DryRunProgress) => void = () => {},
  opts: DryRunOptions = {},
): Promise<DryRunResult> {
  const it = dryRunSteps(opts);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
    onProgress(r.value);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}
