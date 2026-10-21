/**
 * Response composition: structured, cited answers rendered to Markdown
 * (port of platform/app/agent/aegis_agent/compose.py).
 */
import {
  EVIDENCE_STATUSES,
  STANDARD_DISCLAIMER,
  controlCitation,
  controlLibrary,
  getControl,
  maturityTemplate,
  type EvidenceStatus,
} from "../../content";
import { maturityQuestions, realControlIds, type SourceRef } from "./knowledge";
import { getQuestion, templateMeta } from "./question-bank";

const FW_LABEL: Record<string, string> = {
  nist_ai_rmf: "NIST AI RMF",
  iso_42001: "ISO/IEC 42001",
  eu_ai_act: "EU AI Act",
};

export interface Cta {
  label: string;
  url: string;
}

export const CTA_BASELINE: Cta = {
  label: "Book an AEGIS Governance Baseline",
  url: "/contact/book-governance-baseline/",
};
export const CTA_ASSESSMENT: Cta = {
  label: "Take the AI Governance Maturity Self-Assessment",
  url: "/tools/maturity-assessment/",
};
export const CTA_SHIELD: Cta = {
  label: "Generate runtime guardrails with AEGIS Shield",
  url: "/solutions/shield/",
};

export interface Claim {
  text: string;
  evidence_status: EvidenceStatus;
  sources: string[];
}

export type AnswerSource =
  | {
      type: "control";
      id: string;
      title: string;
      citation: string;
      priority: string;
      owner_role: string;
      mappings: Record<string, Array<string | number>>;
      library_version: string;
    }
  | { type: "question"; id: string; text: string; template: string; controls: string[] }
  | {
      type: "policy" | "document";
      id: string;
      title?: string;
      path?: string;
      section?: string;
      policy_id?: string;
      policy_version?: string;
      key: string;
    };

export interface RequiredApproval {
  action: string;
  why: string;
}

const VALID = new Set<string>(EVIDENCE_STATUSES);

export class AnswerBuilder {
  intent: string;
  answer = "";
  details: string[] = [];
  claims: Claim[] = [];
  sources: AnswerSource[] = [];
  missingEvidence: string[] = [];
  nextActions: string[] = [];
  requiredApprovals: RequiredApproval[] = [];
  cta: Cta | null = null;
  clarifyingQuestion: string | null = null;
  confidence: number | null = null;
  confidenceBand: string | null = null;
  disclaimer = false;

  constructor(intent: string) {
    this.intent = intent;
  }

  private has(type: string, id: string): boolean {
    return this.sources.some((s) => s.type === type && s.id === id);
  }

  addControl(cid: string): void {
    const c = getControl(cid);
    if (!c || this.has("control", c.id)) return;
    this.sources.push({
      type: "control",
      id: c.id,
      title: c.title,
      citation: controlCitation(c.id),
      priority: c.priority,
      owner_role: c.owner_role,
      mappings: (c.mappings ?? {}) as Record<string, Array<string | number>>,
      library_version: controlLibrary.version,
    });
  }

  addQuestion(qid: string): void {
    if (this.has("question", qid)) return;
    const q = getQuestion(qid);
    if (q) {
      this.sources.push({
        type: "question",
        id: q.id,
        text: q.text,
        template: `${templateMeta.id} v${templateMeta.version}`,
        controls: q.controls,
      });
      return;
    }
    const mq = maturityQuestions.find((x) => x.id === qid);
    if (mq) {
      const t = maturityTemplate?.template ?? {};
      this.sources.push({
        type: "question",
        id: mq.id,
        text: mq.text,
        template: `${String(t.id ?? "")} v${String(t.version ?? "")}`,
        controls: mq.controls ?? [],
      });
    }
  }

  addDoc(src: Partial<SourceRef> & { id?: string }): void {
    const key = src.policy_id
      ? `policy:${src.policy_id}@${src.policy_version ?? "None"}`
      : `${src.path ?? ""}#${src.section ?? ""}${src.id ?? ""}`;
    if (this.sources.some((s) => "key" in s && s.key === key)) return;
    const doc: AnswerSource = {
      type: src.policy_id ? "policy" : "document",
      id: src.policy_id ?? src.id ?? "",
      key,
    };
    if (src.title !== undefined) doc.title = src.title;
    if (src.path !== undefined) doc.path = src.path;
    if (src.section !== undefined) doc.section = src.section;
    if (src.policy_id !== undefined) doc.policy_id = src.policy_id;
    if (src.policy_version !== undefined) doc.policy_version = src.policy_version;
    this.sources.push(doc);
  }

  claim(text: string, status: EvidenceStatus, sources: string[] = []): void {
    if (!VALID.has(status)) throw new Error(`Invalid evidence status: ${status}`);
    this.claims.push({ text, evidence_status: status, sources });
  }

  /** Cite every real control ID mentioned anywhere in the answer. */
  autoCite(): void {
    const blob = [
      this.answer,
      ...this.details,
      ...this.nextActions,
      ...this.missingEvidence,
      ...this.claims.map((c) => c.text),
    ].join(" ");
    for (const cid of realControlIds(blob)) this.addControl(cid);
  }

  controlIds(): string[] {
    return this.sources.filter((s) => s.type === "control").map((s) => s.id);
  }

  questionIds(): string[] {
    return this.sources.filter((s) => s.type === "question").map((s) => s.id);
  }

  render(): string {
    const L: string[] = [this.answer.trim()];
    for (const d of this.details) L.push("", d.trim());
    if (this.clarifyingQuestion && !this.answer.includes(this.clarifyingQuestion)) {
      L.push("", `**Clarifying question:** ${this.clarifyingQuestion}`);
    }
    if (this.claims.length) {
      L.push("", "**Evidence status**");
      for (const c of this.claims) {
        L.push(
          `- ${c.text} — *${c.evidence_status}*` +
            (c.sources.length ? ` (${c.sources.join(", ")})` : ""),
        );
      }
    }
    if (this.sources.length) {
      L.push("", "**Sources**");
      for (const s of this.sources) {
        if (s.type === "control") {
          const maps = Object.entries(s.mappings)
            .filter(([, v]) => Array.isArray(v) && v.length)
            .map(([k, v]) => `${FW_LABEL[k] ?? k}: ${v.map(String).join(", ")}`)
            .join("; ");
          L.push(`- ${s.citation}` + (maps ? ` — indicative mappings: ${maps}` : ""));
        } else if (s.type === "question") {
          L.push(`- Question ${s.id} (${s.template})`);
        } else if (s.type === "policy") {
          L.push(`- Policy ${s.id} v${s.policy_version || "?"} (${s.path ?? "None"})`);
        } else {
          L.push(`- ${s.path ?? "None"}` + (s.section ? ` § ${s.section}` : ""));
        }
      }
    }
    if (this.missingEvidence.length) {
      L.push("", "**Missing evidence**", ...this.missingEvidence.map((m) => `- ${m}`));
    }
    if (this.nextActions.length) {
      L.push("", "**Next actions**", ...this.nextActions.map((a, i) => `${i + 1}. ${a}`));
    }
    if (this.requiredApprovals.length) {
      L.push(
        "",
        "**Required approvals**",
        ...this.requiredApprovals.map((a) => `- ${a.action}: ${a.why}`),
      );
    }
    if (this.cta) L.push("", `**Next step:** [${this.cta.label}](${this.cta.url})`);
    if (this.disclaimer) L.push("", `_${STANDARD_DISCLAIMER}_`);
    return L.join("\n").trim();
  }
}
