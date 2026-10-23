import { CONTROLS, PILLARS } from "@/data/governance";
import { maturityBand } from "./model";
import type { GovernanceState } from "./store";
import type { ChangeReview } from "./change-schema";
import type { MonitoringPlan } from "./monitoring-schema";
import type { GovernanceDecision } from "./decision-schema";
import type { System } from "./store";

export type EvidenceReport = {
  workspace: string;
  pack: string;
  version: string;
  generatedAt: string;
  index: number;
  maturity: string;
  gate: string;
  tier: string;
  evidenceVerified: number;
  inventoryCount: number;
  openActions: number;
  pillars: { name: string; score: number }[];
  assessment: {
    id: string;
    pillar: string;
    control: string;
    weight: string;
    score: number;
    evidenceStatus: string;
    attachment: string;
    evidenceLink: string;
    reviewerNotes: string;
    snapshotAt: string;
  }[];
  inventory: {
    name: string;
    tier: string;
    status: string;
    kind: string;
    owner: string;
    vendor: string;
    data: string;
    triageTier: string;
    triageScore: string;
    triageEvidenceStatus: string;
    triageRationale: string;
    triageDrivers: string;
    triageTriggers: string;
    triageMissingFacts: string;
    triageProfile: string;
    triageAssessedAt: string;
    triageApprovalAuthority: string;
    triageReviewCadenceMonths: string;
    triageModules: string;
    triageCitations: string;
    triageMethod: string;
  }[];
  roadmap: { title: string; owner: string; phase: number; effort: string; status: string }[];
  incidents: {
    title: string;
    system: string;
    severity: string;
    status: string;
    detectedAt: string;
    owner: string;
    summary: string;
    response: string;
  }[];
  changeReviews: ChangeReview[];
  monitoringPlans: MonitoringPlan[];
  decisions: GovernanceDecision[];
};

const maturityLabels = ["None", "Ad hoc", "Defined", "Managed", "Optimized"];
const evidenceLabels = ["None", "Claimed", "Partial", "Verified"];

export function buildEvidenceReport(
  state: GovernanceState,
  workspace: string,
  pack: string,
  generatedAt: string,
  scores: number[],
  gate: string,
): EvidenceReport {
  const index = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  return {
    workspace,
    pack,
    version: "1.3",
    generatedAt,
    index,
    maturity: maturityBand(index),
    gate,
    tier: state.tier,
    evidenceVerified: Object.values(state.answers).filter((answer) => answer.e === 3).length,
    inventoryCount: state.systems.length,
    openActions: state.roadmap.filter((item) => !item.done).length,
    pillars: PILLARS.map((pillar, index) => ({ name: pillar.name, score: scores[index] ?? 0 })),
    assessment: CONTROLS.map((control) => {
      const answer = state.answers[control.id] ?? { s: control.s, e: control.e };
      return {
        id: control.id,
        pillar: PILLARS[control.p]?.name ?? "Unassigned",
        control: control.text,
        weight: control.w,
        score: answer.s,
        evidenceStatus: evidenceLabels[answer.e] ?? "Unknown",
        attachment: answer.attachment ?? "None",
        evidenceLink: answer.url ?? "None",
        reviewerNotes: answer.notes ?? "None",
        snapshotAt: generatedAt,
      };
    }),
    inventory: state.systems.map((system: System) => ({
      name: system.name,
      tier: system.tier,
      status: system.status,
      kind: system.kind,
      owner: system.owner,
      vendor: system.vendor,
      data: system.data,
      triageTier: system.riskTriage?.result.tier ?? "Not triaged",
      triageScore: system.riskTriage ? String(system.riskTriage.result.score) : "",
      triageEvidenceStatus: system.riskTriage?.result.evidence_status ?? "Not triaged",
      triageRationale: system.riskTriage?.result.rationale ?? "",
      triageDrivers:
        system.riskTriage?.result.factors
          .filter((factor) => factor.points > 0)
          .map((factor) => `${factor.factor}: ${factor.value} (+${factor.points})`)
          .join("; ") ?? "",
      triageTriggers: system.riskTriage?.result.triggers.join("; ") ?? "",
      triageMissingFacts: system.riskTriage?.result.missing_fields.join("; ") ?? "",
      triageProfile: system.riskTriage ? JSON.stringify(system.riskTriage.profile) : "",
      triageAssessedAt: system.riskTriage?.assessedAt ?? "",
      triageApprovalAuthority: system.riskTriage?.result.approval_authority ?? "",
      triageReviewCadenceMonths: system.riskTriage
        ? String(system.riskTriage.result.review_cadence_months)
        : "",
      triageModules: system.riskTriage?.result.required_modules.join("; ") ?? "",
      triageCitations: system.riskTriage?.result.citation_ids.join("; ") ?? "",
      triageMethod: system.riskTriage?.result.method ?? "",
    })),
    roadmap: state.roadmap.map((item) => ({
      title: item.title,
      owner: item.owner,
      phase: item.phase + 1,
      effort: item.effort,
      status: item.done ? "Complete" : "Open",
    })),
    incidents: state.incidents.map((incident) => ({
      title: incident.title,
      system: incident.system || "Not identified",
      severity: incident.severity,
      status: incident.status,
      detectedAt: incident.detectedAt,
      owner: incident.owner || "Unassigned",
      summary: incident.summary,
      response: incident.response || "None recorded",
    })),
    changeReviews: state.changeReviews,
    monitoringPlans: state.monitoringPlans,
    decisions: state.decisions,
  };
}

export const reportCaveats = [
  "DEMO PREVIEW: internally generated working document; not a certification, legal opinion, or signed audit record.",
  "The snapshot timestamp is the export-generation time. Historical per-response edit timestamps are not stored by this workspace.",
  "Prior generated files are not retained as version history; this preview records only its current version and generation event.",
  "Evidence attachments shown by name are demo references only; source file bytes are not included. Verify links and evidence with their owners.",
  "No reviewer sign-off is recorded in this preview. Complete the sign-off fields through your approved governance process.",
  "A governance disposition is an internal record and does not establish legal classification, regulatory approval, or compliance.",
  "Use-case risk triage is a rules-based inference, not a legal classification or approval. Human confirmation is required.",
  "Monitoring observations are manually entered records in this preview; no live telemetry or automated alerting is connected.",
];

export function reportFilename(pack: string, workspace: string, extension: string) {
  const safe = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  return `AEGIS_${safe(pack)}_${safe(workspace)}.${extension}`;
}

export function maturityLabel(score: number) {
  return maturityLabels[score] ?? "Unknown";
}
