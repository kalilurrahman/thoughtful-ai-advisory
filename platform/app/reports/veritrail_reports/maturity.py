"""Render the AI Governance Maturity Self-Assessment detailed report as Markdown."""
from __future__ import annotations

from datetime import date

from veritrail_common.content import control_citation, controls_by_id, load_assessment_template


def _bar(score: float, width: int = 20) -> str:
    filled = int(round(score / 100 * width))
    return "`[" + "#" * filled + "." * (width - filled) + "]`"


def _ctrl_list(ids: list[str]) -> str:
    return ", ".join(ids)


def render_maturity_markdown(result: dict, lead: dict | None = None, generated: str | None = None) -> str:
    tpl = load_assessment_template()
    qtext = {q["id"]: q["text"] for q in tpl["questions"]}
    lib = controls_by_id()
    lead = lead or {}
    org = lead.get("company") or "Your organization"
    gen = generated or date.today().isoformat()
    L: list[str] = []
    L.append(f"# AI Governance Maturity Report — {org}")
    L.append("")
    L.append(f"**Assessment:** {tpl['template']['name']} (template {result['template_id']} v{result['template_version']})  ")
    L.append(f"**Generated:** {gen}  ")
    L.append(f"**Evidence status:** {result['evidence_status']} — all answers are self-reported; no evidence has been reviewed.")
    L.append("")
    L.append(f"> {result['disclaimer']}")
    L.append("")
    L.append("## 1. Overall maturity")
    L.append("")
    L.append("| Overall score | Maturity level | Interpretation |")
    L.append("|---|---|---|")
    L.append(f"| **{result['overall_score']:.1f} / 100** | **{result['maturity_level']}** | {result['level_interpretation']} |")
    L.append("")
    L.append("## 2. Domain scores")
    L.append("")
    L.append("| Domain | Weight | Score | Profile |")
    L.append("|---|---|---|---|")
    for d in result["domains"]:
        L.append(f"| {d['name']} | {d['weight']}% | {d['score']:.1f} | {_bar(d['score'])} |")
    L.append("")
    L.append("Scoring: domain score = sum of answers ÷ maximum possible × 100; overall = Σ(domain score × weight). "
             "Source: VERITRAIL self-assessment template " + result["template_id"] + " v" + result["template_version"] + ".")
    L.append("")

    L.append("## 3. Top strengths")
    L.append("")
    if result["strengths"]:
        for s in result["strengths"]:
            L.append(f"- **{s['domain']}** — {s['text']} (answer {s['score']}/5; question {s['question_id']}; "
                     f"controls {_ctrl_list(s['controls'])}) — *User-asserted*")
    else:
        L.append("- No practices were rated 4 or 5. Strengths will emerge as foundational controls are implemented.")
    L.append("")

    L.append("## 4. Top gaps")
    L.append("")
    if result["gaps"]:
        L.append("| # | Domain | Question | Answer | Recommended action | VERITRAIL controls |")
        L.append("|---|---|---|---|---|---|")
        for i, g in enumerate(result["gaps"], 1):
            L.append(f"| {i} | {g['domain']} | {g['question_id']}: {g['text']} | {g['score']}/5 | {g['action']} | {_ctrl_list(g['controls'])} |")
    else:
        L.append("- No questions were rated 3 or lower.")
    L.append("")

    L.append("## 5. Critical risk flags")
    L.append("")
    if result["critical_flags"]:
        for f in result["critical_flags"]:
            L.append(f"- **{f['severity']} — {f['title']}** (trigger: {f['question_id']}). {f['rationale']} "
                     f"Controls: {_ctrl_list(f['controls'])}. Evidence status: User-asserted.")
    else:
        L.append("- No critical risk flags were triggered by your answers.")
    L.append("")

    L.append("## 6. 30/60/90-day action plan")
    L.append("")
    labels = result.get("action_plan_labels", {})
    for h in ("30", "60", "90"):
        L.append(f"### {labels.get(h, h + ' days')}")
        L.append("")
        items = result["action_plan"].get(h, [])
        if not items:
            L.append("- No actions in this horizon based on your answers.")
        for it in items:
            L.append(f"- {it['action']} ({it['domain']}; {it['question_id']}; controls {_ctrl_list(it['controls'])})")
        L.append("")

    L.append("## 7. Recommended VERITRAIL controls")
    L.append("")
    L.append("| Control | Pillar | Priority | NIST AI RMF | ISO/IEC 42001 | EU AI Act |")
    L.append("|---|---|---|---|---|---|")
    for c in result["recommended_controls"]:
        m = c["mappings"]
        L.append(f"| **{c['id']}** {c['title']} | {c['pillar']} | {c['priority']} | {', '.join(m.get('nist_ai_rmf', [])) or '—'} | "
                 f"{', '.join(m.get('iso_42001', [])) or '—'} | {', '.join(m.get('eu_ai_act', [])) or '—'} |")
    L.append("")
    L.append("Framework mappings are indicative VERITRAIL interpretations (Control Library v"
             f"{__import__('veritrail_common.content', fromlist=['load_control_library']).load_control_library()['library']['version']}).")
    L.append("")

    L.append("## 8. Framework readiness indicators (indicative — not a compliance determination)")
    L.append("")
    for fw in result["readiness"]:
        L.append(f"### {fw['framework']}")
        L.append("")
        L.append("| Area | Indicator | Band | Based on questions |")
        L.append("|---|---|---|---|")
        for g in fw["groups"]:
            L.append(f"| {g['name']} | {g['value']:.1f} | {g['band']} | {', '.join(g['questions'])} |")
        L.append("")
    L.append("These indicators summarise self-reported practices that relate to each framework area. They do not "
             "indicate conformity with ISO/IEC 42001, compliance with the EU AI Act, or alignment with NIST AI RMF, "
             "and EU AI Act applicability depends on your role (provider/deployer) and system classification.")
    L.append("")

    L.append("## 9. Recommended VERITRAIL modules")
    L.append("")
    for m in result["recommended_modules"]:
        L.append(f"- **VERITRAIL {m['module']}** — {m['reason']}")
    L.append("")

    cta = result["cta"]["primary"]
    L.append("## 10. Next step: VERITRAIL Governance Baseline")
    L.append("")
    L.append(cta["description"])
    L.append("")
    L.append(f"**{cta['label']}:** {cta['url']}")
    L.append("")
    L.append("---")
    L.append("")
    L.append("### Appendix A — Your answers")
    L.append("")
    L.append("| Question | Answer |")
    L.append("|---|---|")
    scale = {s["score"]: s["label"] for s in tpl["scale"]}
    for d in result["domains"]:
        for qid, v in d.get("answers", {}).items():
            L.append(f"| {qid}: {qtext[qid]} | {v} — {scale[v]} |")
    L.append("")
    L.append("### Appendix B — Sources")
    L.append("")
    cited = []
    for c in result["recommended_controls"]:
        cited.append(c["id"])
    for f in result["critical_flags"]:
        cited += [x for x in f["controls"] if x not in cited]
    for cid in cited:
        if cid in lib:
            L.append(f"- {control_citation(cid)}")
    L.append(f"- VERITRAIL Self-Assessment template {result['template_id']} v{result['template_version']}")
    L.append("")
    L.append(f"*{result['standard_disclaimer']}*")
    L.append("")
    return "\n".join(L)
