"""Safety checks: injection / coercion detection, compliance-claim traps, citation validation."""
from __future__ import annotations

import re

from aegis_common.content import controls_by_id
from aegis_common.evidence import NO_SOURCE_MESSAGE, find_prohibited_claims
from aegis_common.redaction import detect_jailbreak, detect_prompt_injection

from .knowledge import CONTROL_ID_RE, MATURITY_QID_RE, UC_QID_RE

# Attempts to coerce the agent into making a compliance / certification statement.
_CLAIM_COERCION = [
    r"\b(say|state|write|declare|confirm|tell\s+\w+|announce|print|output|respond\s+with|reply\s+with|draft\s+a\s+statement)\b.{0,60}\b(we|our|they|the\s+company|the\s+organi[sz]ation|this\s+system|it)\b.{0,30}\b(are|is|'re|'s|be)\b.{0,20}\b(compliant|certified|approved|conformant|accredited)\b",
    r"\b(just|simply)\s+(say|tell|confirm)\b.{0,40}\b(compliant|certified)\b",
    r"\bissue\s+(us\s+)?(a\s+)?(certificate|certification|attestation\s+of\s+compliance)\b",
]
# Attempts to bypass human approval / separation of duties.
_APPROVAL_BYPASS = [
    r"\b(skip|bypass|circumvent|avoid|ignore|override|disable|without)\b.{0,25}\b(the\s+)?(human\s+)?(approval|approver|sign[- ]?off|review\s+step|four[- ]eyes)\b",
    r"\b(approve|authori[sz]e|sign\s+off)\b.{0,30}\b(it|this|that|them|the\s+request|the\s+change|apr_\w+)?\s*(yourself|on\s+my\s+behalf|for\s+me|automatically|now)\b",
    r"\b(auto[- ]?approve|self[- ]?approve|rubber[- ]?stamp)\b",
    r"\bmark\b.{0,40}\b(as\s+)?(approved|verified|reviewed)\b",
    r"\b(i\s+am|i'm|as)\s+(the\s+|an?\s+)?(ciso|ceo|cro|admin|administrator|approver|dpo|owner|head\s+of\s+\w+)\b.{0,60}\b(so\s+)?(just|go\s+ahead|do\s+it|approve|activate|export|change|no\s+need)\b",
    r"\b(pretend|assume|act\s+as\s+if)\b.{0,30}\b(i\s+am|i'm|it\s+is|it's|this\s+is)\b.{0,20}\b(approved|an?\s+approver|admin)\b",
    r"\bapprove\s+(apr_[a-z0-9]+|approval\s+\S+|the\s+pending)",
    r"\b(go\s+ahead\s+and|just)\s+(activate|enable|deploy|export|send|change|lower|downgrade)\b",
]
# Requests for a compliance / certification determination.
_COMPLIANCE_DETERMINATION = [
    r"\b(are|am|is)\s+(we|our|this|the|it|they|i|my)\b.{0,50}?\b(compliant|certified|conformant|certifiable|accredited)\b",
    r"\b(do|does|did)\s+(we|our|this|the|it|they|i|my)\b.{0,50}?\b(comply|conform)\b",
    r"\bcertify\b",
    r"\bcertification\b",
    r"\bcertificate\b",
    r"\bguarantee\b.{0,30}\bcompliance\b",
    r"\bcompliance\s+(status|determination|sign[- ]?off|verdict)\b",
    r"\b(confirm|verify|determine|tell\s+me|check|attest)\b.{0,60}\b(compliance|compliant|conformity|certified)\b",
    r"\b(will|would|do|can)\s+(we|i|our\s+\w+)\s+(pass|fail)\b.{0,30}\b(audit|certification|assessment|conformity)\b",
    r"\b(meet|meets|satisfy|satisfies)\s+(all\s+)?(the\s+)?(eu\s+ai\s+act|iso|nist|regulatory|legal)\b",
    r"\bregulator[- ]approved\b",
    r"\bcompliant\b",
    r"\b(compliance|certified|conformity)\b.{0,60}\b(confirm|verify|attest|in writing|sign[- ]?off|right\?|correct\?)",
    r"\b(does|do|will|would)\s+(the\s+)?(eu\s+ai\s+act|ai\s+act|iso(/iec)?\s*42001|gdpr|regulation)\s+(apply|applies)\b",
    r"\b(apply|applies|applicable)\s+to\s+(us|our|me|my)\b",
    r"\b(are|is)\s+(we|our\s+\w+(\s+\w+)?|this\s+\w+|it)\s+in\s+scope\b",
]
_C = lambda pats: [re.compile(p, re.IGNORECASE | re.DOTALL) for p in pats]  # noqa: E731
_CLAIM_RX, _BYPASS_RX, _DET_RX = _C(_CLAIM_COERCION), _C(_APPROVAL_BYPASS), _C(_COMPLIANCE_DETERMINATION)


def detect_injection(text: str) -> list[str]:
    """Combined prompt-injection, jailbreak and claim-coercion signals."""
    sig = detect_prompt_injection(text) + detect_jailbreak(text)
    if any(rx.search(text or "") for rx in _CLAIM_RX):
        sig.append("compliance_claim_coercion")
    if re.search(r"\b(new|updated|override)\s+(rules?|instructions?|policy)\s*[:=]", text or "", re.IGNORECASE):
        sig.append("instruction_override")
    if re.search(r"\b(ignore|forget|disregard)\b.{0,30}\b(rules?|guardrails?|instructions?|policy|policies|restrictions?)\b", text or "", re.IGNORECASE):
        sig.append("instruction_override")
    return sorted(set(sig))


def detect_approval_bypass(text: str) -> bool:
    return any(rx.search(text or "") for rx in _BYPASS_RX)


def asks_compliance_determination(text: str) -> bool:
    return any(rx.search(text or "") for rx in _DET_RX)


def extract_ids(text: str) -> dict[str, list[str]]:
    ctrl = sorted({f"{m.group(1).upper()}-{m.group(2)}" for m in CONTROL_ID_RE.finditer(text or "")})
    qs = sorted({m.group(0).upper() for m in MATURITY_QID_RE.finditer(text or "")} |
                {m.group(0).upper() for m in UC_QID_RE.finditer(text or "")})
    return {"controls": ctrl, "questions": qs}


def validate_citations(text: str, allowed_controls: set[str] | None = None,
                       allowed_questions: set[str] | None = None) -> list[str]:
    """Return citation problems: control IDs not in controls.yaml, or IDs outside the allowed set."""
    problems = []
    known = controls_by_id()
    ids = extract_ids(text)
    for cid in ids["controls"]:
        if cid not in known:
            problems.append(f"unknown control ID {cid}")
        elif allowed_controls is not None and cid not in allowed_controls:
            problems.append(f"control {cid} not among the answer's sources")
    if allowed_questions is not None:
        for qid in ids["questions"]:
            if qid not in allowed_questions:
                problems.append(f"question {qid} not among the answer's sources")
    return problems


def output_problems(text: str, *, allowed_controls: set[str] | None = None,
                    allowed_questions: set[str] | None = None, must_contain: list[str] | None = None,
                    must_cite: set[str] | None = None) -> list[str]:
    """All checks an outgoing answer (deterministic or LLM-phrased) must pass."""
    probs = [f"prohibited claim: {c}" for c in find_prohibited_claims(text)]
    probs += validate_citations(text, allowed_controls, allowed_questions)
    for s in must_contain or []:
        if s not in text:
            probs.append(f"missing required text: {s[:60]}")
    if must_cite:
        present = set(extract_ids(text)["controls"])
        for cid in sorted(must_cite - present):
            probs.append(f"dropped citation {cid}")
    return probs


__all__ = ["detect_injection", "detect_approval_bypass", "asks_compliance_determination", "validate_citations",
           "output_problems", "extract_ids", "NO_SOURCE_MESSAGE", "asks_legal_classification"]


_CLASSIFICATION = [
    r"\bwhat\s+(is|are|counts\s+as)\s+(a\s+)?high[- ]risk\s+(ai\s+)?(system|use)",
    r"\b(is|are|would|will)\b.{0,50}\b(classified|considered|count|counted|qualify|regarded)\b.{0,25}\b(as\s+)?(high[- ]risk|prohibited|limited[- ]risk|gpai)\b",
    r"\bhigh[- ]risk\s+(under|according\s+to|per)\s+(the\s+)?(eu\s+ai\s+act|ai\s+act|annex\s+iii|art)",
    r"\bannex\s+iii\b.{0,40}\b(apply|applies|cover|covers|include|includes)\b",
]
_CLASS_RX = [re.compile(p, re.IGNORECASE) for p in _CLASSIFICATION]


def asks_legal_classification(text: str) -> bool:
    return any(rx.search(text or "") for rx in _CLASS_RX)
