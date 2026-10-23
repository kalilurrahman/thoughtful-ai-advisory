/*
 * VERITRAIL Maturity Self-Assessment — Markdown report (pure).
 *
 * Port of toMarkdown() in platform/app/website/static/js/assessment-report.js, which mirrors
 * veritrail_reports.maturity.render_maturity_markdown for the in-browser "Download Markdown" path.
 * The internal lead qualification (result.lead) is never rendered.
 */
import type { AssessmentBundle, AssessmentResult, ControlMappings } from "./assessment-engine";

export const INDICATIVE = "Indicative — not a compliance determination";

export const READINESS_NOTE =
  "These indicators summarise self-reported practices related to each framework area. They do not indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF.";

export const NO_STRENGTHS =
  "No practices were rated 4 or 5. Strengths will emerge as foundational controls are implemented.";
export const NO_GAPS = "No questions were rated 3 or lower.";
export const NO_FLAGS = "No critical risk flags were triggered by your answers.";
export const NO_HORIZON_ACTIONS = "No actions in this horizon based on your answers.";

export const PLAN_HORIZONS = ["30", "60", "90"] as const;

export function fixed1(n: number): string {
  return Number(n).toFixed(1);
}

function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

function bar(score: number, width = 20): string {
  const filled = roundHalfEven((score / 100) * width);
  return "`[" + "#".repeat(filled) + ".".repeat(width - filled) + "]`";
}

function mdCell(s: unknown): string {
  return String(s === undefined || s === null ? "" : s)
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ");
}

/** Joined framework references for one mapping key, or an em dash when there are none. */
export function mappingRefs(m: ControlMappings | undefined, k: keyof ControlMappings): string {
  const refs = m?.[k];
  return refs && refs.length ? refs.join(", ") : "—";
}

export function controlCitationFrom(bundle: AssessmentBundle, id: string): string | null {
  const c = bundle.controls[id];
  if (!c) return null;
  return (
    "VERITRAIL Control " +
    id +
    ": " +
    c.title +
    " (Control Library v" +
    bundle.control_library_version +
    ")"
  );
}

/** Safe download name, e.g. VERITRAIL_Maturity_Report_Acme_Corp.md */
export function markdownFilename(company: string): string {
  return (
    "VERITRAIL_Maturity_Report" +
    (company ? "_" + company.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) : "") +
    ".md"
  );
}

export interface MarkdownOptions {
  bundle: AssessmentBundle;
  company?: string;
  /** ISO date (YYYY-MM-DD); defaults to today. */
  generated?: string;
}

/** Markdown report generated in the browser (not stored by VERITRAIL). */
export function toMarkdown(result: AssessmentResult, opts: MarkdownOptions): string {
  const bundle = opts.bundle;
  const tpl = bundle.template;
  const qtext: Record<string, string> = {};
  for (const q of tpl.questions) qtext[q.id] = q.text;
  const scale: Record<number, string> = {};
  for (const s of tpl.scale) scale[s.score] = s.label;
  const org = opts.company || "Your organization";
  const gen = opts.generated || new Date().toISOString().slice(0, 10);
  const L: string[] = [];
  L.push("# AI Governance Maturity Report — " + org, "");
  L.push(
    "**Assessment:** " +
      tpl.template.name +
      " (template " +
      result.template_id +
      " v" +
      result.template_version +
      ")  ",
  );
  L.push("**Generated:** " + gen + " (in your browser; not stored by VERITRAIL)  ");
  L.push(
    "**Evidence status:** " +
      result.evidence_status +
      " — all answers are self-reported; no evidence has been reviewed.",
    "",
  );
  L.push("> " + result.disclaimer, "");
  L.push(
    "## 1. Overall maturity",
    "",
    "| Overall score | Maturity level | Interpretation |",
    "|---|---|---|",
  );
  L.push(
    "| **" +
      fixed1(result.overall_score) +
      " / 100** | **" +
      result.maturity_level +
      "** | " +
      mdCell(result.level_interpretation) +
      " |",
    "",
  );
  L.push("## 2. Domain scores", "", "| Domain | Weight | Score | Profile |", "|---|---|---|---|");
  for (const d of result.domains) {
    L.push(
      "| " +
        mdCell(d.name) +
        " | " +
        d.weight +
        "% | " +
        fixed1(d.score) +
        " | " +
        bar(d.score) +
        " |",
    );
  }
  L.push(
    "",
    "Scoring: domain score = sum of answers ÷ maximum possible × 100; overall = Σ(domain score × weight). Source: VERITRAIL self-assessment template " +
      result.template_id +
      " v" +
      result.template_version +
      ".",
    "",
  );
  L.push("## 3. Top strengths", "");
  if (result.strengths.length) {
    for (const s of result.strengths) {
      L.push(
        "- **" +
          s.domain +
          "** — " +
          s.text +
          " (answer " +
          s.score +
          "/5; question " +
          s.question_id +
          "; controls " +
          s.controls.join(", ") +
          ") — *User-asserted*",
      );
    }
  } else {
    L.push("- " + NO_STRENGTHS);
  }
  L.push("", "## 4. Top gaps", "");
  if (result.gaps.length) {
    L.push(
      "| # | Domain | Question | Answer | Recommended action | VERITRAIL controls |",
      "|---|---|---|---|---|---|",
    );
    result.gaps.forEach((g, i) => {
      L.push(
        "| " +
          (i + 1) +
          " | " +
          mdCell(g.domain) +
          " | " +
          g.question_id +
          ": " +
          mdCell(g.text) +
          " | " +
          g.score +
          "/5 | " +
          mdCell(g.action) +
          " | " +
          g.controls.join(", ") +
          " |",
      );
    });
  } else {
    L.push("- " + NO_GAPS);
  }
  L.push("", "## 5. Critical risk flags", "");
  if (result.critical_flags.length) {
    for (const f of result.critical_flags) {
      L.push(
        "- **" +
          f.severity +
          " — " +
          f.title +
          "** (trigger: " +
          f.question_id +
          "). " +
          f.rationale +
          " Controls: " +
          f.controls.join(", ") +
          ". Evidence status: User-asserted.",
      );
    }
  } else {
    L.push("- " + NO_FLAGS);
  }
  L.push("", "## 6. 30/60/90-day action plan", "");
  const labels = result.action_plan_labels;
  for (const h of PLAN_HORIZONS) {
    L.push("### " + (labels[h] || h + " days"), "");
    const items = result.action_plan[h] ?? [];
    if (!items.length) L.push("- " + NO_HORIZON_ACTIONS);
    for (const it of items) {
      L.push(
        "- " +
          it.action +
          " (" +
          it.domain +
          "; " +
          it.question_id +
          "; controls " +
          it.controls.join(", ") +
          ")",
      );
    }
    L.push("");
  }
  L.push(
    "## 7. Recommended VERITRAIL controls",
    "",
    "| Control | Pillar | Priority | NIST AI RMF | ISO/IEC 42001 | EU AI Act |",
    "|---|---|---|---|---|---|",
  );
  for (const c of result.recommended_controls) {
    const m = c.mappings;
    L.push(
      "| **" +
        c.id +
        "** " +
        mdCell(c.title) +
        " | " +
        c.pillar +
        " | " +
        c.priority +
        " | " +
        mappingRefs(m, "nist_ai_rmf") +
        " | " +
        mappingRefs(m, "iso_42001") +
        " | " +
        mappingRefs(m, "eu_ai_act") +
        " |",
    );
  }
  L.push(
    "",
    "Framework mappings are indicative VERITRAIL interpretations (Control Library v" +
      (bundle.control_library_version || "") +
      ").",
    "",
  );
  L.push("## 8. Framework readiness indicators (indicative — not a compliance determination)", "");
  for (const fw of result.readiness) {
    L.push(
      "### " + fw.framework,
      "",
      "| Area | Indicator | Band | Based on questions |",
      "|---|---|---|---|",
    );
    for (const g of fw.groups) {
      L.push(
        "| " +
          mdCell(g.name) +
          " | " +
          fixed1(g.value) +
          " | " +
          g.band +
          " | " +
          g.questions.join(", ") +
          " |",
      );
    }
    L.push("");
  }
  L.push(
    "These indicators summarise self-reported practices that relate to each framework area. They do not indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF, and EU AI Act applicability depends on your role (provider/deployer) and system classification.",
    "",
  );
  L.push("## 9. Recommended VERITRAIL modules", "");
  for (const m of result.recommended_modules)
    L.push("- **VERITRAIL " + m.module + "** — " + m.reason);
  L.push("");
  const cta = result.cta.primary;
  L.push(
    "## 10. Next step: VERITRAIL Governance Baseline",
    "",
    cta.description,
    "",
    "**" + cta.label + ":** " + cta.url,
    "",
    "---",
    "",
  );
  L.push("### Appendix A — Your answers", "", "| Question | Answer |", "|---|---|");
  for (const d of result.domains) {
    for (const [qid, v] of Object.entries(d.answers)) {
      L.push(
        "| " + qid + ": " + mdCell(qtext[qid] ?? "") + " | " + v + " — " + (scale[v] ?? "") + " |",
      );
    }
  }
  L.push("", "### Appendix B — Sources", "");
  const cited = result.recommended_controls.map((c) => c.id);
  for (const f of result.critical_flags) {
    for (const x of f.controls) if (!cited.includes(x)) cited.push(x);
  }
  for (const cid of cited) {
    const c = controlCitationFrom(bundle, cid);
    if (c) L.push("- " + c);
  }
  L.push(
    "- VERITRAIL Self-Assessment template " + result.template_id + " v" + result.template_version,
    "",
  );
  L.push("*" + result.standard_disclaimer + "*", "");
  return L.join("\n");
}
