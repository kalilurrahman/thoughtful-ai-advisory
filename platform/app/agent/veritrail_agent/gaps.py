"""Gap analysis: evidence classification, severity, owners, due dates, roadmap, heat map.

Pure functions over an assessment dict so they can be unit-tested without a store.

Evidence status rules (veritrail_common.evidence.EvidenceStatus):
  Verified         answer=implemented AND >=1 referenced evidence item reviewed by a named reviewer
  User-asserted    answer=implemented without reviewed evidence (claim only, or evidence pending review);
                   also not_applicable (self-declared)
  Missing evidence answer in {partial, not_implemented, unknown} and severity below Critical
  Critical gap     answer in {partial, not_implemented, unknown} and severity Critical
  Inferred         applicable question left unanswered — gap inferred from the system profile / tier

Severity = priority_points[highest control priority] + tier_points[tier] + answer points
           (thresholds and caps in use_case_assessment.yaml: severity_rules).
"""
from __future__ import annotations

from datetime import date, timedelta

from veritrail_common.content import get_control
from veritrail_common.evidence import GAP_SEVERITIES, GAP_SEVERITY_SLA_DAYS, EvidenceStatus

from .question_bank import answer_options, get_question, severity_rules

PRIORITY_ORDER = ["critical", "high", "medium", "low"]
TIER_ORDER = ["Low", "Medium", "High", "Prohibited-review"]
DOMAIN_NAMES = {
    "strategy": "Strategy & Accountability",
    "inventory": "AI Inventory & Visibility",
    "risk_lifecycle": "Risk Management & Lifecycle",
    "data_privacy": "Data & Privacy",
    "security": "Security & Resilience",
    "fairness_transparency": "Fairness, Safety & Transparency",
    "oversight_operations": "Human Oversight & Operations",
    "assurance": "Assurance, Evidence & Improvement",
}
HORIZON_BY_SEVERITY = {"Critical": "30", "High": "60", "Medium": "90", "Low": "backlog"}


def _primary_control(control_ids: list[str]) -> dict:
    ctrls = [get_control(c) for c in control_ids if get_control(c)]
    ctrls.sort(key=lambda c: PRIORITY_ORDER.index(c.get("priority", "low")))
    return ctrls[0]


def _severity_from_score(score: int) -> str:
    th = severity_rules()["thresholds"]
    for sev in ("Critical", "High", "Medium"):
        if score >= th[sev]:
            return sev
    return "Low"


def _cap(sev: str, cap: str) -> str:
    return sev if GAP_SEVERITIES.index(sev) >= GAP_SEVERITIES.index(cap) else cap


def merged_mappings(control_ids: list[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for cid in control_ids:
        c = get_control(cid) or {}
        for fw, refs in (c.get("mappings") or {}).items():
            for r in refs or []:
                out.setdefault(fw, [])
                if str(r) not in out[fw]:
                    out[fw].append(str(r))
    return out


def classify_response(question: dict, response: dict | None, tier: str, evidence_lookup) -> dict:
    """Classify one applicable question. `evidence_lookup(ref) -> evidence record | None`."""
    rules = severity_rules()
    opts = answer_options()
    primary = _primary_control(question["controls"])
    answer = (response or {}).get("answer") or "unanswered"
    refs = list((response or {}).get("evidence_refs") or [])
    ev_records = [evidence_lookup(r) for r in refs]
    reviewed = [e for e in ev_records if e and e.get("reviewed_by") and e.get("review_status", "accepted") == "accepted"]
    p_pts = rules["priority_points"][primary.get("priority", "low")]
    t_pts = rules["tier_points"].get(tier, 1)

    rationale = []
    gap_type = None
    severity = None
    if answer == "not_applicable":
        status = EvidenceStatus.USER_ASSERTED.value
        rationale.append("Marked not applicable by the respondent (self-declared; confirm during review).")
    elif answer == "implemented" and reviewed:
        status = EvidenceStatus.VERIFIED.value
        rationale.append("Implementation evidence reviewed by " + ", ".join(sorted({e["reviewed_by"] for e in reviewed})) + ".")
    elif answer == "implemented":
        status = EvidenceStatus.USER_ASSERTED.value
        gap_type = "evidence"
        if refs:
            a_pts, cap = 0, "Low"
            rationale.append("Implementation claimed and evidence referenced, but not yet reviewed by a named reviewer.")
        else:
            a_pts, cap = opts["implemented"]["severity_points"], rules["evidence_gap_max_severity"]
            rationale.append("Implementation claimed without evidence.")
        score = p_pts + t_pts + a_pts
        severity = _cap(_severity_from_score(score), cap)
        rationale.append(f"Severity score {score} = priority {primary['priority']} ({p_pts}) + tier {tier} ({t_pts}) + answer ({a_pts}); capped at {cap} for evidence-only gaps.")
    else:
        gap_type = "implementation"
        a_pts = opts[answer]["severity_points"] if answer in opts else 2
        score = p_pts + t_pts + a_pts
        severity = _severity_from_score(score)
        override = (answer == "not_implemented" and question.get("critical_if_not_implemented")
                    and TIER_ORDER.index(tier) >= TIER_ORDER.index(rules["critical_override_min_tier"]))
        if override:
            severity = "Critical"
        rationale.append(f"Severity score {score} = priority {primary['priority']} ({p_pts}) + tier {tier} ({t_pts}) + answer '{answer}' ({a_pts})"
                         + ("; raised to Critical (question flagged critical when not implemented)." if override else "."))
        if answer == "unanswered":
            status = EvidenceStatus.INFERRED.value
            rationale.insert(0, "Applicable question not answered; gap inferred from the system profile and risk tier.")
        elif severity == "Critical":
            status = EvidenceStatus.CRITICAL_GAP.value
        else:
            status = EvidenceStatus.MISSING_EVIDENCE.value
        if refs:
            rationale.append("Evidence referenced: " + ", ".join(refs) + ".")

    return {
        "question_id": question["id"],
        "question": question["text"],
        "module": question.get("module"),
        "domain": question.get("domain"),
        "controls": list(question["controls"]),
        "primary_control": primary["id"],
        "control_priority": primary.get("priority"),
        "framework_mappings": merged_mappings(question["controls"]),
        "answer": answer,
        "evidence_refs": refs,
        "reviewed_evidence": [e["id"] for e in reviewed],
        "evidence_status": status,
        "is_gap": gap_type is not None,
        "gap_type": gap_type,
        "severity": severity,
        "owner_role": primary.get("owner_role", "AI Governance Lead"),
        "recommended_action": question.get("remediation", ""),
        "evidence_expected": list(question.get("evidence_expected", [])),
        "rationale": " ".join(rationale),
        "notes": (response or {}).get("notes", ""),
    }


def identify_gaps(assessment: dict, evidence_lookup=lambda ref: None, as_of: date | None = None) -> dict:
    tier = (assessment.get("risk") or {}).get("tier") or "Medium"
    as_of = as_of or date.today()
    responses = assessment.get("responses") or {}
    findings = []
    for qid in assessment.get("questions", []):
        q = get_question(qid)
        if not q:
            continue
        f = classify_response(q, responses.get(qid), tier, evidence_lookup)
        if f["is_gap"]:
            sla = GAP_SEVERITY_SLA_DAYS[f["severity"]]
            f["sla_days"] = sla
            f["due_date"] = (as_of + timedelta(days=sla)).isoformat()
            f["horizon"] = HORIZON_BY_SEVERITY[f["severity"]]
        findings.append(f)
    gaps = [f for f in findings if f["is_gap"]]
    gaps.sort(key=lambda f: (GAP_SEVERITIES.index(f["severity"]), PRIORITY_ORDER.index(f["control_priority"]),
                             assessment.get("questions", []).index(f["question_id"])))
    for i, g in enumerate(gaps, 1):
        g["gap_id"] = f"GAP-{i:03d}"
    by_sev = {s: sum(1 for g in gaps if g["severity"] == s) for s in GAP_SEVERITIES}
    by_status: dict[str, int] = {s.value: 0 for s in EvidenceStatus}
    for f in findings:
        by_status[f["evidence_status"]] += 1
    return {
        "assessment_id": assessment.get("id"),
        "system_id": assessment.get("system_id"),
        "tier": tier,
        "as_of": as_of.isoformat(),
        "findings": findings,
        "gaps": gaps,
        "summary": {"questions": len(findings), "answered": sum(1 for f in findings if f["answer"] != "unanswered"),
                    "gaps": len(gaps), "by_severity": by_sev, "by_evidence_status": by_status},
        "sla_days": dict(GAP_SEVERITY_SLA_DAYS),
    }


def recommend_controls_from_gaps(gaps: list[dict], limit: int | None = None) -> list[dict]:
    agg: dict[str, dict] = {}
    for g in gaps:
        for cid in g["controls"]:
            c = get_control(cid)
            if not c:
                continue
            rec = agg.setdefault(cid, {
                "id": cid, "title": c["title"], "pillar": c["pillar"], "priority": c["priority"],
                "owner_role": c.get("owner_role"), "objective": c.get("objective"),
                "evidence": list(c.get("evidence", [])), "mappings": c.get("mappings", {}),
                "related_gaps": [], "related_questions": [], "highest_severity": g["severity"]})
            rec["related_gaps"].append(g.get("gap_id"))
            rec["related_questions"].append(g["question_id"])
            if GAP_SEVERITIES.index(g["severity"]) < GAP_SEVERITIES.index(rec["highest_severity"]):
                rec["highest_severity"] = g["severity"]
    out = sorted(agg.values(), key=lambda r: (GAP_SEVERITIES.index(r["highest_severity"]),
                                              PRIORITY_ORDER.index(r["priority"]), r["id"]))
    return out[:limit] if limit else out


def heat_map(findings: list[dict]) -> list[dict]:
    opts = answer_options()
    rows = []
    for dom, name in DOMAIN_NAMES.items():
        fs = [f for f in findings if f.get("domain") == dom]
        if not fs:
            continue
        scored = [f for f in fs if f["answer"] != "not_applicable"]
        credit = [opts[f["answer"]]["credit"] if f["answer"] in opts else 0.0 for f in scored]
        impl = round(100 * sum(credit) / len(credit), 1) if credit else None
        sev = {s: sum(1 for f in fs if f.get("severity") == s) for s in GAP_SEVERITIES}
        if sev["Critical"]:
            rating = "Critical exposure"
        elif sev["High"]:
            rating = "High exposure"
        elif sev["Medium"]:
            rating = "Moderate exposure"
        else:
            rating = "Low exposure"
        rows.append({"domain": dom, "name": name, "questions": len(fs),
                     "verified": sum(1 for f in fs if f["evidence_status"] == EvidenceStatus.VERIFIED.value),
                     "implementation_indicator": impl, **{s.lower(): n for s, n in sev.items()}, "rating": rating})
    return rows


def roadmap(gaps: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {"30": [], "60": [], "90": [], "backlog": []}
    for g in gaps:
        out[g["horizon"]].append({"gap_id": g["gap_id"], "action": g["recommended_action"], "controls": g["controls"],
                                  "owner_role": g["owner_role"], "due_date": g["due_date"], "severity": g["severity"]})
    return out
