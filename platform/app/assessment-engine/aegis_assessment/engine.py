"""AEGIS AI Governance Maturity Self-Assessment — reference scoring engine.

This is the REFERENCE implementation. The browser engine
(app/website/static/js/assessment-engine.js) must produce identical output;
parity is tested in tests/integration/test_website_engine_parity.py.

All arithmetic that determines displayed numbers uses integers and the
round-half-up rule documented in the template so that Python and JavaScript
agree exactly.
"""
from __future__ import annotations

from aegis_common.content import controls_by_id, load_assessment_template
from aegis_common.evidence import STANDARD_DISCLAIMER


class AssessmentInputError(ValueError):
    pass


def round_half_up_1dp(num: int, den: int) -> float:
    """round_half_up(num/den, 1) using integer arithmetic: floor((20*num + den) / (2*den)) / 10."""
    if den <= 0:
        raise ValueError("den must be positive")
    return ((20 * num + den) // (2 * den)) / 10


def _level_for(score: float, levels: list[dict]) -> dict:
    for lvl in levels:
        if lvl["min"] <= score <= lvl["max"]:
            return lvl
    # scores are 1dp so gaps (e.g. 39.95) cannot occur; fall back defensively
    return levels[-1] if score > levels[-1]["min"] else levels[0]


def _band_for(value: float, bands: list[dict]) -> str:
    for b in bands:
        if b["min"] <= value <= b["max"]:
            return b["name"]
    return bands[-1]["name"] if value > bands[-1]["min"] else bands[0]["name"]


def validate_answers(answers: dict, template: dict) -> dict[str, int]:
    if not isinstance(answers, dict):
        raise AssessmentInputError("answers must be an object of question_id -> score")
    qids = [q["id"] for q in template["questions"]]
    clean: dict[str, int] = {}
    missing = [q for q in qids if q not in answers]
    if missing:
        raise AssessmentInputError(f"missing answers: {', '.join(missing)}")
    unknown = [k for k in answers if k not in qids]
    if unknown:
        raise AssessmentInputError(f"unknown question ids: {', '.join(sorted(unknown))}")
    for q in qids:
        v = answers[q]
        if isinstance(v, bool) or not isinstance(v, (int, float, str)):
            raise AssessmentInputError(f"{q}: score must be an integer 1-5")
        try:
            iv = int(v)
        except (TypeError, ValueError):
            raise AssessmentInputError(f"{q}: score must be an integer 1-5")
        if str(iv) != str(v).strip() and not (isinstance(v, float) and v == iv):
            raise AssessmentInputError(f"{q}: score must be an integer 1-5")
        if iv < 1 or iv > 5:
            raise AssessmentInputError(f"{q}: score must be between 1 and 5")
        clean[q] = iv
    return clean


def normalize_profile(profile: dict | None) -> dict:
    p = dict(profile or {})
    for k in ("uses_agents", "eu_operations"):
        v = p.get(k)
        if isinstance(v, str):
            p[k] = v.strip().lower() in ("true", "yes", "1", "y")
        else:
            p[k] = bool(v)
    return p


def _profile_matches(cond: dict, profile: dict) -> bool:
    return all(profile.get(k) == v for k, v in cond.items())


def _domain_scores(answers: dict[str, int], template: dict) -> tuple[list[dict], dict, dict]:
    domains = sorted(template["domains"], key=lambda d: d["order"])
    by_domain: dict[str, list[dict]] = {d["id"]: [] for d in domains}
    for q in sorted(template["questions"], key=lambda q: q["order"]):
        by_domain[q["domain"]].append(q)
    out, sums, counts = [], {}, {}
    for d in domains:
        qs = by_domain[d["id"]]
        s = sum(answers[q["id"]] for q in qs)
        n = len(qs)
        sums[d["id"]], counts[d["id"]] = s, n
        out.append({
            "id": d["id"],
            "name": d["name"],
            "weight": d["weight"],
            "score": round_half_up_1dp(s * 100, 5 * n),
            "answers": {q["id"]: answers[q["id"]] for q in qs},
        })
    return out, sums, counts


def _overall(sums: dict, counts: dict, template: dict) -> float:
    # overall = sum_d (s_d * w_d / (5 n_d)). With a common denominator L = lcm(5 n_d):
    from math import lcm
    dens = {d["id"]: 5 * counts[d["id"]] for d in template["domains"]}
    L = 1
    for v in dens.values():
        L = lcm(L, v)
    num = sum(sums[d["id"]] * d["weight"] * (L // dens[d["id"]]) for d in template["domains"])
    return round_half_up_1dp(num, L)


def preliminary_result(answers: dict, profile: dict | None = None, template: dict | None = None) -> dict:
    template = template or load_assessment_template()
    clean = validate_answers(answers, template)
    domains, sums, counts = _domain_scores(clean, template)
    overall = _overall(sums, counts, template)
    lvl = _level_for(overall, template["scoring"]["levels"])
    return {
        "template_id": template["template"]["id"],
        "template_version": template["template"]["version"],
        "evidence_status": template["template"]["evidence_status"],
        "overall_score": overall,
        "maturity_level": lvl["name"],
        "level_interpretation": lvl["interpretation"],
        "domains": [{"id": d["id"], "name": d["name"], "weight": d["weight"], "score": d["score"]} for d in domains],
    }


def score_assessment(answers: dict, profile: dict | None = None, template: dict | None = None) -> dict:
    template = template or load_assessment_template()
    clean = validate_answers(answers, template)
    prof = normalize_profile(profile)
    sc = template["scoring"]
    domains, sums, counts = _domain_scores(clean, template)
    domain_by_id = {d["id"]: d for d in domains}
    overall = _overall(sums, counts, template)
    lvl = _level_for(overall, sc["levels"])
    weight = {d["id"]: d["weight"] for d in template["domains"]}
    dname = {d["id"]: d["name"] for d in template["domains"]}
    questions = sorted(template["questions"], key=lambda q: q["order"])

    def qview(q: dict, with_action: bool = False) -> dict:
        v = {
            "question_id": q["id"],
            "domain_id": q["domain"],
            "domain": dname[q["domain"]],
            "text": q["text"],
            "score": clean[q["id"]],
            "controls": list(q["controls"]),
        }
        if with_action:
            v["action"] = q["action"]
        return v

    # strengths: score >= min, sort score desc, weight desc, order asc
    strengths = [q for q in questions if clean[q["id"]] >= sc["strengths"]["min_score"]]
    strengths.sort(key=lambda q: (-clean[q["id"]], -weight[q["domain"]], q["order"]))
    strengths = [qview(q) for q in strengths[: sc["strengths"]["limit"]]]

    gaps = [q for q in questions if clean[q["id"]] <= sc["gaps"]["max_score"]]
    gaps.sort(key=lambda q: (clean[q["id"]], -weight[q["domain"]], q["order"]))
    gaps = [qview(q, True) for q in gaps[: sc["gaps"]["limit"]]]

    # critical flags (template order)
    flags = []
    for f in template["critical_flags"]:
        w = f["when"]
        if clean[w["question"]] > w["max_score"]:
            continue
        if "profile" in w and not _profile_matches(w["profile"], prof):
            continue
        flags.append({
            "id": f["id"], "title": f["title"], "severity": f["severity"],
            "rationale": f["rationale"], "controls": list(f["controls"]),
            "question_id": w["question"], "evidence_status": "User-asserted",
        })
    flag_ids = {f["id"] for f in flags}

    # 30/60/90 plan
    plan: dict[str, list[dict]] = {}
    for h in sc["action_plan"]["horizons"]:
        items = [q for q in questions if clean[q["id"]] in h["scores"]]
        items.sort(key=lambda q: (clean[q["id"]], -weight[q["domain"]], q["order"]))
        plan[h["horizon"]] = [
            {"question_id": q["id"], "domain": dname[q["domain"]], "action": q["action"],
             "controls": list(q["controls"]), "score": clean[q["id"]]}
            for q in items[: sc["action_plan"]["limit_per_horizon"]]
        ]
    plan_labels = {h["horizon"]: h["label"] for h in sc["action_plan"]["horizons"]}

    # recommended controls: flags then gaps, de-duplicated
    ctrl_ids: list[str] = []
    for f in flags:
        for c in f["controls"]:
            if c not in ctrl_ids:
                ctrl_ids.append(c)
    for g in gaps:
        for c in g["controls"]:
            if c not in ctrl_ids:
                ctrl_ids.append(c)
    lib = controls_by_id()
    rec_controls = [
        {"id": c, "title": lib[c]["title"], "pillar": lib[c]["pillar"], "priority": lib[c]["priority"],
         "mappings": lib[c]["mappings"]}
        for c in ctrl_ids[: sc["recommended_controls"]["limit"]]
    ]

    # readiness indicators
    readiness = []
    for fw in template["readiness_groups"]:
        groups = []
        for g in fw["groups"]:
            s = sum(clean[q] for q in g["questions"])
            val = round_half_up_1dp(s * 100, 5 * len(g["questions"]))
            groups.append({"id": g["id"], "name": g["name"], "value": val,
                           "band": _band_for(val, sc["readiness"]["bands"]),
                           "questions": list(g["questions"])})
        readiness.append({"framework": fw["framework"], "groups": groups})

    def cond_true(cond: dict) -> bool:
        if cond.get("always"):
            return True
        if "overall_below" in cond:
            return overall < cond["overall_below"]
        if "domain_below" in cond:
            return any(domain_by_id[d]["score"] < v for d, v in cond["domain_below"].items())
        if "profile" in cond:
            return _profile_matches(cond["profile"], prof)
        if "flag" in cond:
            return cond["flag"] in flag_ids
        return False

    modules = [{"module": r["module"], "reason": r["reason"]}
               for r in template["module_rules"] if any(cond_true(c) for c in r["any"])]
    lead_tags = [r for r in template["lead_rules"] if any(cond_true(c) for c in r["any"])]

    return {
        "template_id": template["template"]["id"],
        "template_version": template["template"]["version"],
        "evidence_status": template["template"]["evidence_status"],
        "overall_score": overall,
        "maturity_level": lvl["name"],
        "level_interpretation": lvl["interpretation"],
        "domains": domains,
        "strengths": strengths,
        "gaps": gaps,
        "critical_flags": flags,
        "action_plan": plan,
        "action_plan_labels": plan_labels,
        "recommended_controls": rec_controls,
        "readiness": readiness,
        "recommended_modules": modules,
        "lead": {"tags": [r["tag"] for r in lead_tags], "labels": [r["label"] for r in lead_tags]},
        "profile": prof,
        "disclaimer": template["template"]["disclaimer"],
        "standard_disclaimer": STANDARD_DISCLAIMER,
        "cta": template["cta"],
    }
