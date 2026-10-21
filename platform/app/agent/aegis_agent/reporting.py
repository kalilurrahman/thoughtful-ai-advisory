"""Use-case governance readiness report: Markdown composition and MD/PDF/CSV/JSON export."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from aegis_common.content import control_citation, get_control, load_control_library
from aegis_common.evidence import (EVIDENCE_STATUS_DEFINITIONS, GAP_SEVERITY_SLA_DAYS, STANDARD_DISCLAIMER,
                                   EvidenceStatus, find_prohibited_claims)

from .gaps import heat_map, recommend_controls_from_gaps, roadmap
from .question_bank import applicable_guardrails, intake_fields, template_meta

SYNTHETIC_BANNER = ("> **Synthetic example.** This report was generated from fictional data to illustrate AEGIS Agent "
                    "output. It describes no real organization or system.")

GAP_CSV_COLUMNS = ["gap_id", "severity", "evidence_status", "gap_type", "question_id", "question", "module", "domain",
                   "controls", "primary_control", "owner_role", "recommended_action", "evidence_expected", "due_date",
                   "sla_days", "horizon", "answer", "evidence_refs", "nist_ai_rmf", "iso_42001", "eu_ai_act"]
FW_LABEL = {"nist_ai_rmf": "NIST AI RMF", "iso_42001": "ISO/IEC 42001", "eu_ai_act": "EU AI Act"}


def _cell(v) -> str:
    if v is None or v == "":
        return "—"
    if isinstance(v, bool):
        return "Yes" if v else "No"
    if isinstance(v, (list, tuple)):
        return ", ".join(str(x) for x in v) if v else "—"
    return str(v).replace("|", "/").replace("\n", " ")


def _table(headers: list[str], rows: list[list]) -> str:
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    out += ["| " + " | ".join(_cell(c) for c in r) + " |" for r in rows]
    return "\n".join(out)


def _maps(mappings: dict) -> str:
    return "; ".join(f"{FW_LABEL.get(k, k)}: {', '.join(map(str, v))}" for k, v in (mappings or {}).items() if v) or "—"


def build_report_data(*, system: dict, assessment: dict, gap_result: dict, approvals: list[dict],
                      audit_trace: list[dict], prepared_by: str, synthetic: bool = False,
                      report_id: str = "", shield_advice: dict | None = None) -> dict:
    profile = assessment.get("profile") or system.get("profile") or {}
    risk = assessment.get("risk") or {}
    gaps = gap_result["gaps"]
    return {
        "report_id": report_id,
        "report_type": "AEGIS AI Use-Case Governance Readiness Report",
        "synthetic": synthetic,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "prepared_by": prepared_by,
        "template": {"id": template_meta()["id"], "version": template_meta()["version"]},
        "control_library_version": load_control_library()["library"]["version"],
        "system": {"id": system.get("id"), "name": profile.get("name") or system.get("name"), "status": system.get("status"),
                   "risk_tier": system.get("risk_tier"), "risk_tier_status": system.get("risk_tier_status")},
        "profile": profile,
        "profile_provenance": assessment.get("profile_provenance", {}),
        "assessment_id": assessment.get("id"),
        "risk": risk,
        "modules": assessment.get("modules", []),
        "gap_analysis": gap_result,
        "heat_map": heat_map(gap_result["findings"]),
        "recommended_controls": recommend_controls_from_gaps(gaps),
        "roadmap": roadmap(gaps),
        "runtime_guardrails": [{"id": g["id"], "title": g["title"], "controls": g["controls"]}
                               for g in applicable_guardrails(profile, risk.get("tier"))],
        "shield_advice_summary": _shield_summary(shield_advice),
        "approvals": [{k: a.get(k) for k in ("approval_id", "type", "status", "resource", "reason", "requested_by",
                                             "resolved_by", "created_at")} for a in approvals],
        "audit_trace": audit_trace,
        "evidence_status_definitions": EVIDENCE_STATUS_DEFINITIONS,
        "disclaimer": STANDARD_DISCLAIMER,
        "template_disclaimer": template_meta().get("disclaimer", "").strip(),
    }


def _shield_summary(advice: dict | None) -> dict | None:
    if not advice:
        return None
    rp = advice.get("risk_profile") or {}
    return {"overall_rating": rp.get("overall_rating") or rp.get("rating"), "citations": advice.get("citations", [])[:12]}


def render_markdown(d: dict) -> str:
    p, risk, ga = d["profile"], d["risk"], d["gap_analysis"]
    s = ga["summary"]
    name = d["system"]["name"] or "Unnamed AI system"
    L: list[str] = [f"# AI Use-Case Governance Readiness Report — {name}", ""]
    if d["synthetic"]:
        L += [SYNTHETIC_BANNER, ""]
    L += [_table(["Field", "Value"], [
        ["Report ID", d["report_id"]], ["Assessment ID", d["assessment_id"]], ["AI system record", d["system"]["id"]],
        ["Generated (UTC)", d["generated_at"]], ["Prepared by", d["prepared_by"]],
        ["Question bank", f"{d['template']['id']} v{d['template']['version']}"],
        ["Control library", f"AEGIS Control Library v{d['control_library_version']}"],
        ["Evidence basis", "Self-reported answers (User-asserted) unless evidence was reviewed by a named reviewer (Verified)"],
    ]), ""]

    # 1 executive summary
    crit = [g for g in ga["gaps"] if g["severity"] == "Critical"]
    verified = s["by_evidence_status"].get(EvidenceStatus.VERIFIED.value, 0)
    L += ["## 1. Executive summary", ""]
    L += [f"- **Preliminary risk tier: {risk.get('tier', 'Not determined')}** (Inferred; requires human confirmation"
          + (f" — {d['system']['risk_tier_status']}" if d["system"].get("risk_tier_status") else "") + ")."]
    L += [f"- **{s['answered']} of {s['questions']}** applicable questions answered across {len(d['modules'])} modules."]
    L += [f"- **{s['gaps']} gaps** identified: " + ", ".join(f"{n} {sev}" for sev, n in s["by_severity"].items()) + "."]
    L += [f"- **Evidence posture:** {verified} finding(s) Verified by a named reviewer; "
          f"{s['by_evidence_status'].get('User-asserted', 0)} User-asserted; "
          f"{s['by_evidence_status'].get('Missing evidence', 0)} Missing evidence; "
          f"{s['by_evidence_status'].get('Critical gap', 0)} Critical gap; {s['by_evidence_status'].get('Inferred', 0)} Inferred."]
    if crit:
        L += ["- **Priority actions (Critical, due within "
              f"{GAP_SEVERITY_SLA_DAYS['Critical']} days):**"]
        for g in crit[:5]:
            L += [f"  - {g['gap_id']}: {g['recommended_action']} ({', '.join(g['controls'])}; owner: {g['owner_role']})"]
    L += ["", "This report indicates governance readiness and evidence gaps for one AI system. It is not a "
          "determination of conformity or legal compliance with any framework or law.", ""]

    # 2 profile
    prov = d.get("profile_provenance") or {}
    rows = []
    for f in intake_fields():
        if f["id"] in p:
            rows.append([f["id"], p[f["id"]], prov.get(f["id"], EvidenceStatus.USER_ASSERTED.value)])
    L += ["## 2. AI system profile", "", _table(["Field", "Value", "Evidence status"], rows), ""]

    # 3 risk tier
    L += ["## 3. Risk tier and rationale", ""]
    L += [f"**Tier:** {risk.get('tier')} (score {risk.get('score')}) — evidence status: {risk.get('evidence_status', 'Inferred')}; "
          f"requires human confirmation: {'yes' if risk.get('requires_human_confirmation', True) else 'no'}.", ""]
    if risk.get("rationale"):
        L += [f"**Rationale:** {risk['rationale']}", ""]
    if risk.get("factors"):
        L += [_table(["Factor", "Value", "Points", "Citation"],
                     [[f["factor"], f["value"], f["points"], f["citation"]] for f in risk["factors"]]), ""]
    if risk.get("triggers"):
        L += ["**Triggers:**"] + [f"- {t}" for t in risk["triggers"]] + [""]
    L += [f"- Approval authority for this tier: {risk.get('approval_authority', '—')}",
          f"- Review cadence: every {risk.get('review_cadence_months', '—')} months",
          f"- Assessment modules applied: {', '.join(m['name'] for m in d['modules']) or '—'}",
          f"- Method: {risk.get('method', 'AEGIS risk-tier rules')}", ""]

    # 4 heat map
    L += ["## 4. Domain heat map", "",
          _table(["Domain", "Qs", "Implementation (self-reported)", "Verified", "Crit", "High", "Med", "Low", "Rating"],
                 [[r["name"], r["questions"], f"{r['implementation_indicator']}%" if r["implementation_indicator"] is not None else "—",
                   r["verified"], r["critical"], r["high"], r["medium"], r["low"], r["rating"]] for r in d["heat_map"]]),
          "", "Implementation indicator = implemented (1.0) and partial (0.5) answers as a share of applicable questions; "
          "it reflects self-reported answers, not verified evidence.", ""]

    # 5 gap register
    L += ["## 5. Gap register", ""]
    if ga["gaps"]:
        L += [_table(["Gap · severity · due", "Evidence status", "Question", "Controls", "Owner role", "Recommended action"],
                     [[f"{g['gap_id']} · {g['severity']} · due {g['due_date']}", g["evidence_status"],
                       f"{g['question_id']}: {g['question']}", g["controls"], g["owner_role"], g["recommended_action"]]
                      for g in ga["gaps"]]), ""]
        L += [f"Due dates apply the AEGIS severity SLAs (Critical {GAP_SEVERITY_SLA_DAYS['Critical']}, High {GAP_SEVERITY_SLA_DAYS['High']}, "
              f"Medium {GAP_SEVERITY_SLA_DAYS['Medium']}, Low {GAP_SEVERITY_SLA_DAYS['Low']} days) from {ga['as_of']}.", ""]
    else:
        L += ["No gaps were identified from the answers provided. Findings remain subject to evidence review.", ""]

    # 6 control recommendations
    L += ["## 6. Control recommendations", ""]
    if d["recommended_controls"]:
        L += [_table(["Control", "Title", "Priority", "Highest gap severity", "Owner role", "Framework mappings (indicative)"],
                     [[c["id"], c["title"], c["priority"], c["highest_severity"], c["owner_role"], _maps(c["mappings"])]
                      for c in d["recommended_controls"]]), ""]
    else:
        L += ["No additional controls recommended from the answers provided.", ""]

    # 7 roadmap
    L += ["## 7. Remediation roadmap (30/60/90 days)", ""]
    labels = {"30": "First 30 days — contain Critical exposure", "60": "Days 31–60 — close High gaps",
              "90": "Days 61–90 — standardise and evidence", "backlog": "Beyond 90 days — evidence hygiene backlog"}
    for h in ("30", "60", "90", "backlog"):
        items = d["roadmap"][h]
        L += [f"### {labels[h]}", ""]
        L += [f"- {i['gap_id']} ({i['severity']}): {i['action']} — {', '.join(i['controls'])}; owner: {i['owner_role']}; due {i['due_date']}"
              for i in items] or ["- No items."]
        L += [""]

    # 8 evidence checklist
    L += ["## 8. Audit-ready evidence checklist", ""]
    rows = []
    for f in ga["findings"]:
        if f["answer"] == "not_applicable":
            continue
        mark = "[x]" if f["evidence_status"] == EvidenceStatus.VERIFIED.value else "[ ]"
        rows.append([mark, f["question_id"], ", ".join(f["controls"]), "; ".join(f["evidence_expected"]),
                     ", ".join(f["evidence_refs"]) or "—", f["evidence_status"]])
    L += [_table(["Done", "Question", "Controls", "Evidence expected", "Evidence provided", "Status"], rows), "",
          "Only items marked [x] have evidence reviewed by a named reviewer.", ""]

    # 9 guardrails
    L += ["## 9. Runtime guardrail recommendations", ""]
    L += [f"- **{g['id']}** — {g['title']} ({', '.join(g['controls'])})" for g in d["runtime_guardrails"]] or ["- None identified."]
    if d.get("shield_advice_summary"):
        L += ["", f"AEGIS Shield advisor rating: {d['shield_advice_summary'].get('overall_rating') or 'n/a'} "
              "(see the draft runtime policy for details; activation in production requires human approval)."]
    L += ["", "Draft guardrail policies can be generated with AEGIS Shield; activating or changing a production runtime "
          "policy requires human approval (IS-12, GL-04).", ""]

    # 10 approvals
    L += ["## 10. Human approvals", ""]
    if d["approvals"]:
        L += [_table(["Approval", "Type", "Status", "Resource", "Requested by", "Resolved by"],
                     [[a["approval_id"], a["type"], a["status"], a["resource"], a["requested_by"], a.get("resolved_by")]
                      for a in d["approvals"]]), ""]
    else:
        L += ["No approvals recorded for this assessment.", ""]

    # appendices
    L += ["## Appendix A — Evidence status definitions", "",
          _table(["Status", "Definition"], [[k, v] for k, v in d["evidence_status_definitions"].items()]), ""]
    L += ["## Appendix B — Audit trace", "",
          "Tool calls and agent turns for this assessment are recorded in the hash-chained AEGIS audit log (SE-08).", ""]
    if d["audit_trace"]:
        L += [_table(["Timestamp (UTC)", "Trace ID", "Action", "Actor", "Outcome", "Audit record"],
                     [[r.get("ts", "")[:19], r.get("trace_id"), r.get("action"), r.get("actor"), r.get("outcome"), r.get("id")]
                      for r in d["audit_trace"][-60:]]), ""]
    L += ["## Appendix C — Method and limitations", "",
          "- Answers are self-reported; AEGIS has not inspected systems or documents unless evidence is marked Verified.",
          "- The risk tier is preliminary and rule-based; the EU AI Act category screen is a trigger for legal review, not a legal classification.",
          "- Framework mappings are indicative AEGIS interpretations from the Control Library, not official crosswalks.",
          "- Regulatory applicability timelines must be verified against the current Official Journal text and any amendments.",
          "", "## Disclaimer", "", d["disclaimer"], "", d["template_disclaimer"], ""]
    if d["synthetic"]:
        L += ["*Synthetic example — fictional data.*", ""]
    return "\n".join(L)


def gap_rows(gap_result: dict) -> list[dict]:
    rows = []
    for g in gap_result["gaps"]:
        r = {k: g.get(k) for k in GAP_CSV_COLUMNS if k in g}
        for fw in ("nist_ai_rmf", "iso_42001", "eu_ai_act"):
            r[fw] = g["framework_mappings"].get(fw, [])
        rows.append(r)
    return rows


def export_report(d: dict, out_dir: Path, formats: tuple[str, ...] = ("md", "pdf", "csv", "json"),
                  basename: str | None = None) -> dict:
    """Write requested formats. Returns {format: path or None} plus any per-format errors."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    base = basename or f"aegis_use_case_report_{d['report_id'] or 'draft'}"
    md = render_markdown(d)
    claims = find_prohibited_claims(md)
    if claims:  # defence in depth: never emit a report containing a prohibited claim
        raise ValueError(f"Report failed prohibited-claim check: {claims[:3]}")
    paths: dict = {}
    errors: dict = {}
    try:
        from aegis_reports.exporters import write_csv, write_json, write_markdown
    except ImportError:  # pragma: no cover - orchestrator package missing
        write_csv = write_json = write_markdown = None
    if "md" in formats:
        p = out_dir / f"{base}.md"
        (write_markdown(md, p) if write_markdown else p.write_text(md, encoding="utf-8"))
        paths["md"] = str(p)
    if "json" in formats:
        p = out_dir / f"{base}.json"
        payload = {**d, "markdown_sha_note": "Markdown rendering available in the .md export"}
        if write_json:
            write_json(payload, p)
        else:
            p.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")
        paths["json"] = str(p)
    if "csv" in formats:
        p = out_dir / f"{base}_gap_register.csv"
        rows = gap_rows(d["gap_analysis"])
        if write_csv:
            write_csv(rows, p, GAP_CSV_COLUMNS)
        else:
            import csv
            with open(p, "w", newline="", encoding="utf-8") as fh:
                w = csv.DictWriter(fh, fieldnames=GAP_CSV_COLUMNS)
                w.writeheader()
                for r in rows:
                    w.writerow({k: "; ".join(map(str, v)) if isinstance(v, list) else v for k, v in r.items()})
        paths["csv"] = str(p)
    if "pdf" in formats:
        p = out_dir / f"{base}.pdf"
        try:
            from aegis_reports.pdf import markdown_to_pdf
            title = f"AEGIS Use-Case Readiness Report — {d['system']['name'] or ''}"
            if d["synthetic"]:
                title = "Synthetic example — " + title
            markdown_to_pdf(md, p, title=title)
            paths["pdf"] = str(p)
        except Exception as exc:  # degrade gracefully: other formats still delivered
            paths["pdf"] = None
            errors["pdf"] = f"PDF export unavailable: {type(exc).__name__}: {exc}"
    return {"paths": paths, "errors": errors, "markdown": md}


def control_line(cid: str) -> str:
    c = get_control(cid)
    return f"{control_citation(cid)} — {_maps(c.get('mappings', {}))}" if c else cid
