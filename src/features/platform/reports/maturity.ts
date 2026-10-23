/*
 * VERITRAIL AI Governance Maturity Report — server-side Markdown renderer (pure).
 *
 * Port of platform/app/reports/veritrail_reports/maturity.py (render_maturity_markdown), the
 * renderer behind emailed/stored reports and the synthetic samples in
 * platform/output/sample_reports/maturity. All ten sections plus the two appendices.
 *
 * It differs from the browser toMarkdown() in src/features/site/engines/assessment-report.ts
 * on purpose, so the two are kept separate:
 *  - the Generated line has no "(in your browser; not stored by VERITRAIL)" suffix;
 *  - table cells are written verbatim (Python does not escape `|` or newlines).
 * Shared helpers (control citation, mapping references) are reused from that module.
 */
import type { AssessmentBundle, AssessmentResult } from "@/features/site/engines/assessment-engine";
import {
  PLAN_HORIZONS,
  controlCitationFrom,
  fixed1,
  mappingRefs,
} from "@/features/site/engines/assessment-report";

export interface MaturityLead {
  company?: string;
  name?: string;
}

/** Python round() for the bar width (round-half-even). */
function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

export function bar(score: number, width = 20): string {
  const filled = roundHalfEven((score / 100) * width);
  return "`[" + "#".repeat(filled) + ".".repeat(width - filled) + "]`";
}

/** render_maturity_markdown(result, lead, generated) */
export function renderMaturityMarkdown(
  result: AssessmentResult,
  bundle: AssessmentBundle,
  lead: MaturityLead | null = null,
  generated?: string,
): string {
  const tpl = bundle.template;
  const qtext: Record<string, string> = {};
  for (const q of tpl.questions) qtext[q.id] = q.text;
  const org = lead?.company || "Your organization";
  const gen = generated || new Date().toISOString().slice(0, 10);
  const L: string[] = [];
  const ver = `${result.template_id} v${result.template_version}`;
  L.push(`# AI Governance Maturity Report — ${org}`, "");
  L.push(`**Assessment:** ${tpl.template.name} (template ${ver})  `);
  L.push(`**Generated:** ${gen}  `);
  L.push(
    `**Evidence status:** ${result.evidence_status} — all answers are self-reported; no evidence has been reviewed.`,
    "",
  );
  L.push(`> ${result.disclaimer}`, "");

  L.push("## 1. Overall maturity", "");
  L.push("| Overall score | Maturity level | Interpretation |", "|---|---|---|");
  L.push(
    `| **${fixed1(result.overall_score)} / 100** | **${result.maturity_level}** | ${result.level_interpretation} |`,
    "",
  );

  L.push("## 2. Domain scores", "");
  L.push("| Domain | Weight | Score | Profile |", "|---|---|---|---|");
  for (const d of result.domains) {
    L.push(`| ${d.name} | ${d.weight}% | ${fixed1(d.score)} | ${bar(d.score)} |`);
  }
  L.push("");
  L.push(
    "Scoring: domain score = sum of answers ÷ maximum possible × 100; overall = Σ(domain score × weight). " +
      `Source: VERITRAIL self-assessment template ${result.template_id} v${result.template_version}.`,
  );
  L.push("");

  L.push("## 3. Top strengths", "");
  if (result.strengths.length) {
    for (const s of result.strengths) {
      L.push(
        `- **${s.domain}** — ${s.text} (answer ${s.score}/5; question ${s.question_id}; ` +
          `controls ${s.controls.join(", ")}) — *User-asserted*`,
      );
    }
  } else {
    L.push(
      "- No practices were rated 4 or 5. Strengths will emerge as foundational controls are implemented.",
    );
  }
  L.push("");

  L.push("## 4. Top gaps", "");
  if (result.gaps.length) {
    L.push(
      "| # | Domain | Question | Answer | Recommended action | VERITRAIL controls |",
      "|---|---|---|---|---|---|",
    );
    result.gaps.forEach((g, i) => {
      L.push(
        `| ${i + 1} | ${g.domain} | ${g.question_id}: ${g.text} | ${g.score}/5 | ${g.action ?? ""} | ${g.controls.join(", ")} |`,
      );
    });
  } else {
    L.push("- No questions were rated 3 or lower.");
  }
  L.push("");

  L.push("## 5. Critical risk flags", "");
  if (result.critical_flags.length) {
    for (const f of result.critical_flags) {
      L.push(
        `- **${f.severity} — ${f.title}** (trigger: ${f.question_id}). ${f.rationale} ` +
          `Controls: ${f.controls.join(", ")}. Evidence status: User-asserted.`,
      );
    }
  } else {
    L.push("- No critical risk flags were triggered by your answers.");
  }
  L.push("");

  L.push("## 6. 30/60/90-day action plan", "");
  const labels = result.action_plan_labels ?? {};
  for (const h of PLAN_HORIZONS) {
    L.push(`### ${labels[h] ?? `${h} days`}`, "");
    const items = result.action_plan[h] ?? [];
    if (!items.length) L.push("- No actions in this horizon based on your answers.");
    for (const it of items) {
      L.push(
        `- ${it.action} (${it.domain}; ${it.question_id}; controls ${it.controls.join(", ")})`,
      );
    }
    L.push("");
  }

  L.push("## 7. Recommended VERITRAIL controls", "");
  L.push(
    "| Control | Pillar | Priority | NIST AI RMF | ISO/IEC 42001 | EU AI Act |",
    "|---|---|---|---|---|---|",
  );
  for (const c of result.recommended_controls) {
    const m = c.mappings;
    L.push(
      `| **${c.id}** ${c.title} | ${c.pillar} | ${c.priority} | ${mappingRefs(m, "nist_ai_rmf")} | ` +
        `${mappingRefs(m, "iso_42001")} | ${mappingRefs(m, "eu_ai_act")} |`,
    );
  }
  L.push("");
  L.push(
    "Framework mappings are indicative VERITRAIL interpretations (Control Library v" +
      `${bundle.control_library_version}).`,
  );
  L.push("");

  L.push("## 8. Framework readiness indicators (indicative — not a compliance determination)", "");
  for (const fw of result.readiness) {
    L.push(`### ${fw.framework}`, "");
    L.push("| Area | Indicator | Band | Based on questions |", "|---|---|---|---|");
    for (const g of fw.groups) {
      L.push(`| ${g.name} | ${fixed1(g.value)} | ${g.band} | ${g.questions.join(", ")} |`);
    }
    L.push("");
  }
  L.push(
    "These indicators summarise self-reported practices that relate to each framework area. They do not " +
      "indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF, " +
      "and EU AI Act applicability depends on your role (provider/deployer) and system classification.",
  );
  L.push("");

  L.push("## 9. Recommended VERITRAIL modules", "");
  for (const m of result.recommended_modules) L.push(`- **VERITRAIL ${m.module}** — ${m.reason}`);
  L.push("");

  const cta = result.cta.primary;
  L.push("## 10. Next step: VERITRAIL Governance Baseline", "");
  L.push(cta.description, "");
  L.push(`**${cta.label}:** ${cta.url}`, "");
  L.push("---", "");
  L.push("### Appendix A — Your answers", "");
  L.push("| Question | Answer |", "|---|---|");
  const scale: Record<number, string> = {};
  for (const s of tpl.scale) scale[s.score] = s.label;
  for (const d of result.domains) {
    for (const [qid, v] of Object.entries(d.answers ?? {})) {
      L.push(`| ${qid}: ${qtext[qid] ?? ""} | ${v} — ${scale[v] ?? ""} |`);
    }
  }
  L.push("");
  L.push("### Appendix B — Sources", "");
  const cited: string[] = result.recommended_controls.map((c) => c.id);
  for (const f of result.critical_flags) {
    for (const x of f.controls) if (!cited.includes(x)) cited.push(x);
  }
  for (const cid of cited) {
    const c = controlCitationFrom(bundle, cid);
    if (c) L.push(`- ${c}`);
  }
  L.push(`- VERITRAIL Self-Assessment template ${ver}`);
  L.push("");
  L.push(`*${result.standard_disclaimer}*`);
  L.push("");
  return L.join("\n");
}

/** Download name for the PDF variant, e.g. VERITRAIL_Maturity_Report_Acme_Corp.pdf */
export function pdfFilename(company: string): string {
  return (
    "VERITRAIL_Maturity_Report" +
    (company ? "_" + company.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40) : "") +
    ".pdf"
  );
}
