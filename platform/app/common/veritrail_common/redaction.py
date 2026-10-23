"""Sensitive-data detection/redaction and prompt-injection/jailbreak heuristics.

These are deterministic, dependency-free detectors suitable for the MVP and for
masking data BEFORE any external LLM call or log write. They are heuristics:
production deployments should layer a dedicated PII/DLP service and a trained
injection classifier (see docs/RUNTIME_SHIELD_DESIGN.md). Known limitations are
documented in tests/security.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field


def _luhn_ok(digits: str) -> bool:
    total, alt = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        alt = not alt
    return total % 10 == 0


# Order matters: more specific patterns first.
PII_PATTERNS: dict[str, re.Pattern] = {
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "payment_card": re.compile(r"\b(?:\d[ -]?){13,19}\b"),
    "iban": re.compile(r"\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?[A-Z0-9]{1,4})?\b"),
    "us_ssn": re.compile(r"\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"),
    "uk_nino": re.compile(r"\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b", re.IGNORECASE),
    "india_pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "india_aadhaar": re.compile(r"\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b"),
    "phone": re.compile(r"(?<![\w+])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?)?\d{2,5}(?:[\s.-]\d{2,6}){1,3}(?![\w-])"),
    "ip_address": re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b"),
    "api_key": re.compile(r"\b(?:sk|pk|api|key|token)[-_][A-Za-z0-9_-]{16,}\b", re.IGNORECASE),
    "aws_access_key": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "github_token": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b"),
}


@dataclass
class RedactionResult:
    text: str
    findings: list[dict] = field(default_factory=list)

    @property
    def entity_counts(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for f in self.findings:
            out[f["entity"]] = out.get(f["entity"], 0) + 1
        return out


def redact(text: str, entities: list[str] | None = None, mask: str = "[REDACTED:{entity}]") -> RedactionResult:
    """Redact sensitive entities. Findings never include the raw value (only entity + span length)."""
    if not text:
        return RedactionResult(text=text or "")
    wanted = list(PII_PATTERNS) if entities is None else entities  # [] means: redact nothing
    findings: list[dict] = []
    out = text
    for entity in PII_PATTERNS:
        if entity not in wanted:
            continue
        rx = PII_PATTERNS[entity]

        def _sub(m: re.Match) -> str:
            val = m.group(0)
            if entity == "payment_card":
                digits = re.sub(r"\D", "", val)
                if not (13 <= len(digits) <= 19 and _luhn_ok(digits)):
                    return val
            if entity == "phone":
                digits = re.sub(r"\D", "", val)
                if not (8 <= len(digits) <= 15) or re.fullmatch(r"\d{4}-\d{2}-\d{2}", val):
                    return val
            findings.append({"entity": entity, "length": len(val)})
            return mask.format(entity=entity)

        out = rx.sub(_sub, out)
    return RedactionResult(text=out, findings=findings)


INJECTION_PATTERNS = [
    (r"ignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions|prompts|rules|messages)", "instruction_override"),
    (r"disregard\s+(all\s+|any\s+|the\s+)?(previous|prior|above|system)\s+(instructions|prompt|rules)", "instruction_override"),
    (r"forget\s+(everything|all|your)\s+(you|instructions|rules|previous)", "instruction_override"),
    (r"(reveal|print|show|output|repeat|leak)\s+(me\s+)?(the\s+|your\s+)?(system\s+prompt|hidden\s+instructions|initial\s+instructions|developer\s+message)", "prompt_exfiltration"),
    (r"you\s+are\s+now\s+(in\s+)?(developer|dan|god|admin|unrestricted|jailbreak)\s*(mode)?", "role_hijack"),
    (r"\bact\s+as\s+(an?\s+)?(unfiltered|unrestricted|uncensored)", "role_hijack"),
    (r"<\s*/?\s*(system|assistant|im_start|im_end)\s*>", "delimiter_injection"),
    (r"\[\s*(system|INST)\s*\]", "delimiter_injection"),
    (r"<\|\s*(im_start|im_end|system|endoftext|start_header_id|end_header_id)\s*\|>", "delimiter_injection"),
    (r"(send|post|upload|exfiltrate|forward)\s+(all\s+|the\s+)?(data|records|customer\s+data|credentials|secrets|files)\s+to\s+(https?://|\S+@)", "data_exfiltration"),
    (r"(call|invoke|use|run)\s+the\s+\w+\s+tool\s+(with|to)\s+.*(delete|drop|transfer|export)", "tool_hijack"),
]
JAILBREAK_PATTERNS = [
    (r"\bDAN\b|do\s+anything\s+now", "dan"),
    (r"(no|without)\s+(any\s+)?(restrictions|filters|guidelines|limitations|safety)", "restriction_removal"),
    (r"pretend\s+(you\s+)?(have\s+no|are\s+not\s+bound|there\s+are\s+no)", "pretend_unbound"),
    (r"(hypothetically|in\s+a\s+fictional\s+world).{0,60}(how\s+to|instructions\s+for)\s+(make|build|bypass|hack)", "fictional_wrapper"),
    (r"bypass\s+(your|the)\s+(safety|content|guard)", "guardrail_bypass"),
]
_INJ = [(re.compile(p, re.IGNORECASE | re.DOTALL), t) for p, t in INJECTION_PATTERNS]
_JB = [(re.compile(p, re.IGNORECASE | re.DOTALL), t) for p, t in JAILBREAK_PATTERNS]


def detect_prompt_injection(text: str) -> list[str]:
    return sorted({t for rx, t in _INJ if rx.search(text or "")})


def detect_jailbreak(text: str) -> list[str]:
    return sorted({t for rx, t in _JB if rx.search(text or "")})
