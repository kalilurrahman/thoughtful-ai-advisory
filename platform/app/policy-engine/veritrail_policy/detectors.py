"""Content detectors for the policy engine.

Thin, documented extension of ``veritrail_common.redaction`` (which stays the single
source of PII patterns). Additions here:

* ``normalize_for_detection`` — Unicode NFKC folding, zero-width/soft-hyphen
  removal, a small Cyrillic/Greek homoglyph map, collapsing of letter-spaced
  words ("i g n o r e") and whitespace, so trivially obfuscated injections are
  still matched by the shared regex heuristics.
* ``decoded_variants`` — decodes base64 (two nested layers), %-encoded text and
  ROT13 and scans the decoded text too (flagged as ``obfuscation:<kind>``).
* ``EXTRA_INJECTION_PATTERNS`` — chat-template control tokens (``<|im_start|>`` etc.).
* leetspeak folding (1→i, 0→o, 3→e, 4→a, 5→s, 7→t, @→a, $→s) on a detection-only copy.

These remain heuristics. Known misses (paraphrase, non-English, multi-turn
splitting, semantic jailbreaks, PII without a fixed format such as names and
postal addresses) are pinned as strict xfail tests in tests/security so the
limitation is visible and any improvement is noticed.
"""
from __future__ import annotations

import base64
import binascii
import codecs
import re
import unicodedata
from urllib.parse import unquote

from veritrail_common.redaction import (
    PII_PATTERNS,
    RedactionResult,
    detect_jailbreak,
    detect_prompt_injection,
    redact,
)

__all__ = [
    "PII_PATTERNS", "normalize_for_detection", "decoded_variants", "scan_injection",
    "scan_jailbreak", "redact_text", "redact_structure", "MAX_SCAN_CHARS",
]

# Detection is bounded so a hostile payload cannot make scanning unbounded.
MAX_SCAN_CHARS = 200_000

_ZERO_WIDTH = re.compile("[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff\u00ad\u034f\u180e]")
_HOMOGLYPHS = str.maketrans({
    # Cyrillic
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j",
    "ѕ": "s", "ԁ": "d", "ɡ": "g", "һ": "h", "ӏ": "l", "к": "k", "м": "m", "т": "t", "в": "b", "н": "h",
    "А": "A", "Е": "E", "О": "O", "Р": "P", "С": "C", "У": "Y", "Х": "X", "І": "I", "Ѕ": "S",
    "К": "K", "М": "M", "Т": "T", "В": "B", "Н": "H",
    # Greek
    "α": "a", "ε": "e", "ο": "o", "ρ": "p", "ι": "i", "κ": "k", "ν": "v", "τ": "t", "υ": "u",
    "Α": "A", "Ε": "E", "Ο": "O", "Ρ": "P", "Ι": "I", "Κ": "K", "Ν": "N", "Τ": "T", "Υ": "Y",
})
_LEET = str.maketrans({"1": "i", "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i"})
_SPACED = re.compile(r"\b(?:[A-Za-z][ .\-_*]){3,}[A-Za-z]\b")
_B64 = re.compile(r"(?<![A-Za-z0-9+/=])[A-Za-z0-9+/]{16,}={0,2}(?![A-Za-z0-9+/=])")
_PCT = re.compile(r"%[0-9A-Fa-f]{2}")

# Extra injection signals layered on top of veritrail_common.redaction.INJECTION_PATTERNS
# (chat-template control tokens that the shared delimiter pattern does not cover).
EXTRA_INJECTION_PATTERNS = [
    (r"<\|\s*(im_start|im_end|system|endoftext|begin_of_text|start_header_id|eot_id)\s*\|>", "delimiter_injection"),
    (r"(^|\n)\s*#{2,}\s*(system|new\s+instructions?)\s*:?", "delimiter_injection"),
]
_EXTRA_INJ = [(re.compile(p, re.IGNORECASE), t) for p, t in EXTRA_INJECTION_PATTERNS]


def _detect_injection(text: str) -> list[str]:
    hits = set(detect_prompt_injection(text))
    hits.update(t for rx, t in _EXTRA_INJ if rx.search(text or ""))
    return sorted(hits)


def normalize_for_detection(text: str) -> str:
    t = unicodedata.normalize("NFKC", text or "")
    t = _ZERO_WIDTH.sub("", t)
    t = t.translate(_HOMOGLYPHS)
    t = _SPACED.sub(lambda m: re.sub(r"[ .\-_*]", "", m.group(0)), t)
    t = re.sub(r"\s+", " ", t)
    return t


def _b64_segments(text: str, max_segments: int) -> list[str]:
    out = []
    for m in list(_B64.finditer(text or ""))[:max_segments]:
        seg = m.group(0)
        try:
            dec = base64.b64decode(seg + "=" * (-len(seg) % 4), validate=True).decode("utf-8")
        except (binascii.Error, UnicodeDecodeError, ValueError):
            continue
        printable = sum(ch.isprintable() or ch.isspace() for ch in dec)
        if dec and printable / len(dec) > 0.9:
            out.append(dec)
    return out


def decoded_variants(text: str, max_segments: int = 20) -> list[tuple[str, str]]:
    """Return [(kind, decoded_text)] for base64 (up to two nested layers), %-encoding and ROT13."""
    out: list[tuple[str, str]] = []
    for dec in _b64_segments(text, max_segments):
        out.append(("base64", dec))
        for dec2 in _b64_segments(dec, 5):
            out.append(("base64", dec2))
    if len(_PCT.findall(text or "")) >= 3:
        dec = unquote(text)
        if dec != text:
            out.append(("percent_encoding", dec))
    out.append(("rot13", codecs.decode(text or "", "rot13")))
    return out


def _variants(text: str, decode: bool) -> list[tuple[str | None, str]]:
    base = (text or "")[:MAX_SCAN_CHARS]
    norm = normalize_for_detection(base)
    variants: list[tuple[str | None, str]] = [(None, base), (None, norm), (None, norm.translate(_LEET))]
    if decode:
        for kind, dec in decoded_variants(base):
            dn = normalize_for_detection(dec)
            variants.append((kind, dn))
    return variants


def _scan(text: str, detector, decode: bool) -> list[str]:
    hits: set[str] = set()
    for kind, variant in _variants(text, decode):
        found = detector(variant)
        hits.update(found)
        if found and kind:
            hits.add(f"obfuscation:{kind}")
    return sorted(hits)


def scan_injection(text: str, decode: bool = True) -> list[str]:
    """Prompt-injection signals (types) found in text or its normalized/decoded variants."""
    return _scan(text, _detect_injection, decode)


def scan_jailbreak(text: str, decode: bool = True) -> list[str]:
    return _scan(text, detect_jailbreak, decode)


def redact_text(text: str, entities: list[str] | None, exempt: list[str] | None = None) -> RedactionResult:
    """Redact the listed entities (minus exemptions). Empty entity list => no redaction.

    Unlike ``veritrail_common.redaction.redact`` (where ``entities=None`` or ``[]``
    means *all* entities), an empty list here means *nothing*; pass ``None`` for all.
    """
    if text is None or text == "":
        return RedactionResult(text=text or "")
    wanted = list(PII_PATTERNS) if entities is None else [e for e in entities if e in PII_PATTERNS]
    if exempt:
        wanted = [e for e in wanted if e not in exempt]
    if not wanted:
        return RedactionResult(text=text)
    # Redact on the NFKC-normalized, zero-width-stripped text so full-width digits and
    # zero-width splitting do not smuggle identifiers past the regexes.
    cleaned = _ZERO_WIDTH.sub("", unicodedata.normalize("NFKC", text))
    return redact(cleaned, entities=wanted)


def redact_structure(value, entities: list[str] | None, exempt: list[str] | None = None,
                     _depth: int = 0) -> tuple[object, dict[str, int]]:
    """Recursively redact strings inside dict/list structures. Returns (copy, entity_counts)."""
    counts: dict[str, int] = {}

    def add(c: dict[str, int]):
        for k, v in c.items():
            counts[k] = counts.get(k, 0) + v

    if _depth > 20:
        return "[TRUNCATED:depth]", counts
    if isinstance(value, str):
        r = redact_text(value, entities, exempt)
        add(r.entity_counts)
        return r.text, counts
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            nv, c = redact_structure(v, entities, exempt, _depth + 1)
            add(c)
            out[k] = nv
        return out, counts
    if isinstance(value, (list, tuple)):
        out_l = []
        for v in value:
            nv, c = redact_structure(v, entities, exempt, _depth + 1)
            add(c)
            out_l.append(nv)
        return out_l, counts
    return value, counts
