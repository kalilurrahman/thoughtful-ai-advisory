"""Evidence status labels and safe-language guardrails shared by all AEGIS components."""
from __future__ import annotations

import re
from enum import Enum


class EvidenceStatus(str, Enum):
    VERIFIED = "Verified"                # evidence exists and has been reviewed by a named reviewer
    USER_ASSERTED = "User-asserted"      # user claims implementation, evidence absent
    INFERRED = "Inferred"                # inferred from responses / metadata
    MISSING_EVIDENCE = "Missing evidence"  # required evidence not provided
    CRITICAL_GAP = "Critical gap"        # material privacy/security/safety/legal/operational exposure


EVIDENCE_STATUS_DEFINITIONS = {
    EvidenceStatus.VERIFIED.value: "Evidence exists and has been reviewed",
    EvidenceStatus.USER_ASSERTED.value: "User claims implementation, but evidence is absent",
    EvidenceStatus.INFERRED.value: "Inferred as a likely gap or fact from responses or metadata",
    EvidenceStatus.MISSING_EVIDENCE.value: "Required evidence has not been provided",
    EvidenceStatus.CRITICAL_GAP.value: "Material privacy, security, safety, legal, or operational exposure",
}

GAP_SEVERITIES = ["Critical", "High", "Medium", "Low"]
GAP_SEVERITY_SLA_DAYS = {"Critical": 30, "High": 60, "Medium": 90, "Low": 180}

NO_SOURCE_MESSAGE = "No supporting evidence or framework source is available."

STANDARD_DISCLAIMER = (
    "AEGIS supports governance readiness, control implementation and evidence collection. "
    "It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or "
    "replace legal advice. Framework mappings are indicative."
)

# Statements AEGIS must never make about an organization or system.
_PROHIBITED_CLAIM_PATTERNS = [
    r"\b(is|are|be|being|been|now|fully|already)\s+(fully\s+)?compliant\b",
    r"\b(is|are|been|be)\s+(iso(/iec)?\s*42001\s+)?certified\b",
    r"\bguarantee[sd]?\s+(full\s+)?(eu\s+ai\s+act\s+)?compliance\b",
    r"\bregulator[- ]approved\b",
    r"\bcertif(y|ies)\s+(that\s+)?(you|your|the organi[sz]ation|this system)\b",
    r"\bmeets\s+all\s+(regulatory\s+)?requirements\b",
    r"\bin\s+full\s+compliance\b",
]
_PROHIBITED_RE = [re.compile(p, re.IGNORECASE) for p in _PROHIBITED_CLAIM_PATTERNS]

# Phrases that legitimately contain the words above (negations / disclaimers).
_ALLOWED_CONTEXT_RE = re.compile(
    r"(does not|do not|doesn't|cannot|can't|never|not)\s+(itself\s+)?(certif|guarantee|determin|make|claim|state|establish|mean)"
    r"|\bnot\s+(a|an)\s+(\w+\s+){0,3}(determination|certification|guarantee|attestation|legal opinion)",
    re.IGNORECASE,
)


def find_prohibited_claims(text: str) -> list[str]:
    """Return prohibited compliance/certification claims found in text (sentence-level, negation-aware)."""
    hits: list[str] = []
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", text or ""):
        if not sentence.strip():
            continue
        if _ALLOWED_CONTEXT_RE.search(sentence):
            continue
        if re.search(r"\bnot\s+(be\s+)?(fully\s+)?(compliant|certified)\b", sentence, re.IGNORECASE):
            continue
        for rx in _PROHIBITED_RE:
            m = rx.search(sentence)
            if m:
                hits.append(sentence.strip())
                break
    return hits
