"""Use-case question bank: loading, module/question applicability, answer parsing."""
from __future__ import annotations

import re
from functools import lru_cache

from aegis_common.content import controls_by_id, load_yaml

from .config import USE_CASE_TEMPLATE_FILE

ANSWER_IDS = ["implemented", "partial", "not_implemented", "unknown", "not_applicable"]
# Order used when matching free-text answers: most specific first.
_MATCH_ORDER = ["not_applicable", "unknown", "not_implemented", "partial", "implemented"]


@lru_cache(maxsize=1)
def load_question_bank() -> dict:
    return load_yaml(USE_CASE_TEMPLATE_FILE)


def template_meta() -> dict:
    return load_question_bank()["template"]


def modules() -> list[dict]:
    return load_question_bank()["modules"]


def module_by_id(module_id: str) -> dict | None:
    return next((m for m in modules() if m["id"] == module_id), None)


@lru_cache(maxsize=1)
def questions_by_id() -> dict[str, dict]:
    out = {}
    for m in modules():
        for q in m["questions"]:
            out[q["id"]] = {**q, "module": m["id"], "module_name": m["name"]}
    return out


def get_question(qid: str) -> dict | None:
    return questions_by_id().get(qid.upper()) if qid else None


def intake_fields() -> list[dict]:
    return load_question_bank()["intake_fields"]


def intake_field(field_id: str) -> dict | None:
    return next((f for f in intake_fields() if f["id"] == field_id), None)


def answer_options() -> dict[str, dict]:
    return {o["id"]: o for o in load_question_bank()["answer_options"]}


def severity_rules() -> dict:
    return load_question_bank()["severity_rules"]


def runtime_guardrail_defs() -> list[dict]:
    return load_question_bank().get("runtime_guardrails", [])


# --------------------------------------------------------------------------- applicability
def _condition_holds(cond: dict, profile: dict, tier: str | None, required_modules: list[str]) -> bool:
    if cond.get("always"):
        return True
    if "tier_in" in cond:
        return tier in cond["tier_in"]
    if "profile" in cond:
        return all(profile.get(k) == v for k, v in cond["profile"].items())
    if "profile_in" in cond:
        return all(profile.get(k) in vals for k, vals in cond["profile_in"].items())
    if "has_tools" in cond:
        return bool(profile.get("tools")) == bool(cond["has_tools"])
    if "required_module" in cond:
        target = str(cond["required_module"]).lower()
        norm = [re.sub(r"[^a-z0-9]+", "_", str(m).lower()).strip("_") for m in required_modules or []]
        return any(target == n or target in n for n in norm)
    return False


def applies(conditions: list[dict] | None, profile: dict, tier: str | None = None,
            required_modules: list[str] | None = None) -> bool:
    if not conditions:
        return True
    return any(_condition_holds(c, profile or {}, tier, required_modules or []) for c in conditions)


def select_modules(profile: dict, tier: str | None, required_modules: list[str] | None = None) -> list[dict]:
    """Return applicable modules with the reason(s) each was selected."""
    out = []
    for m in modules():
        reasons = [c for c in m.get("applies_when", []) if _condition_holds(c, profile, tier, required_modules or [])]
        if reasons:
            out.append({"id": m["id"], "name": m["name"], "description": m.get("description", ""),
                        "reasons": [_describe_condition(c) for c in reasons]})
    return out


def applicable_questions(profile: dict, tier: str | None, required_modules: list[str] | None = None) -> list[dict]:
    qs = []
    for m in select_modules(profile, tier, required_modules):
        for q in module_by_id(m["id"])["questions"]:
            if applies(q.get("applies_when"), profile, tier, required_modules):
                qs.append(questions_by_id()[q["id"]])
    return qs


def applicable_guardrails(profile: dict, tier: str | None = None) -> list[dict]:
    return [g for g in runtime_guardrail_defs() if applies(g.get("applies_when"), profile, tier)]


def _describe_condition(c: dict) -> str:
    if c.get("always"):
        return "applies to every use case"
    if "tier_in" in c:
        return f"risk tier is {' or '.join(c['tier_in'])}"
    if "profile" in c:
        return ", ".join(f"{k} = {str(v).lower()}" for k, v in c["profile"].items())
    if "profile_in" in c:
        return ", ".join(f"{k} in [{', '.join(map(str, v))}]" for k, v in c["profile_in"].items())
    if "has_tools" in c:
        return "the system has tool access"
    if "required_module" in c:
        return f"risk tiering requires the {c['required_module']} module"
    return str(c)


# --------------------------------------------------------------------------- answers
def parse_answer(text: str) -> str | None:
    """Map free text ('partially', 'not sure', 'yes — evidence EV-12') to an answer id."""
    t = " " + re.sub(r"[^a-z0-9/'?]+", " ", (text or "").lower()) + " "
    t = t.replace("_", " ")
    # "yes, but no evidence yet" is an implementation claim without evidence, not a "no".
    t = re.sub(r" (no|without|missing) (written |formal |documented )?(evidence|documentation|docs|proof) ", " ", t)
    opts = answer_options()
    for aid in _MATCH_ORDER:
        if f" {aid.replace('_', ' ')} " in t:
            return aid
        for syn in opts[aid].get("synonyms", []):
            s = " " + re.sub(r"[^a-z0-9/'?]+", " ", str(syn).lower()) + " "
            if s in t:
                return aid
    return None


EVIDENCE_REF_RE = re.compile(
    r"\b((?:EV|EVD|DOC|EVIDENCE|TKT|JIRA|CONF|SP)[-_][A-Za-z0-9][A-Za-z0-9._-]{0,60})\b", re.IGNORECASE)


def parse_evidence_refs(text: str) -> list[str]:
    refs = []
    for m in EVIDENCE_REF_RE.finditer(text or ""):
        ref = m.group(1).rstrip(".,;")
        if ref.upper() not in {r.upper() for r in refs}:
            refs.append(ref)
    return refs


def validate_bank() -> list[str]:
    """Return integrity errors (unknown control IDs, duplicate IDs, missing evidence)."""
    errs = []
    ctrls = controls_by_id()
    seen = set()
    for m in modules():
        for q in m["questions"]:
            if q["id"] in seen:
                errs.append(f"duplicate question id {q['id']}")
            seen.add(q["id"])
            if not q.get("controls"):
                errs.append(f"{q['id']} has no controls")
            for c in q.get("controls", []):
                if c not in ctrls:
                    errs.append(f"{q['id']} cites unknown control {c}")
            if not q.get("evidence_expected"):
                errs.append(f"{q['id']} has no evidence_expected")
            if not q.get("remediation"):
                errs.append(f"{q['id']} has no remediation")
    for g in runtime_guardrail_defs():
        for c in g.get("controls", []):
            if c not in ctrls:
                errs.append(f"guardrail {g['id']} cites unknown control {c}")
    return errs
