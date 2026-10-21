"""Tool-call parameter validation (least privilege at the argument level)."""
from __future__ import annotations

import re
import unicodedata
from typing import Any
from urllib.parse import urlsplit

MAX_REGEX_INPUT = 10_000  # bound regex work on hostile input


def extract_host(value: str) -> str | None:
    """Host for a URL, e-mail address or bare hostname (lower-cased, NFKC, no trailing dot)."""
    v = unicodedata.normalize("NFKC", str(value)).strip()
    if not v:
        return None
    if "://" in v:
        try:
            host = urlsplit(v).hostname
        except ValueError:
            return None
    elif "@" in v:
        host = v.rsplit("@", 1)[1]
    else:
        host = v.split("/", 1)[0].split(":", 1)[0]
    if not host:
        return None
    host = host.strip().rstrip(".").lower()
    if not re.fullmatch(r"[a-z0-9.-]+", host):
        return None  # reject IDN/unicode or odd hosts rather than guess
    return host


def domain_allowed(value: str, allow_list: list[str]) -> bool:
    host = extract_host(value)
    if not host:
        return False
    for d in allow_list:
        d = d.lower().lstrip("*.").rstrip(".")
        if host == d or host.endswith("." + d):
            return True
    return False


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _check_scalar(name: str, value: Any, spec: dict, problems: list[tuple[str, str]]) -> None:
    if "enum" in spec and value not in spec["enum"]:
        problems.append(("enum", f"parameter '{name}' is not one of the permitted values"))
    if isinstance(value, str):
        if "max_length" in spec and len(value) > spec["max_length"]:
            problems.append(("max_length", f"parameter '{name}' exceeds max length {spec['max_length']}"))
        if "min_length" in spec and len(value) < spec["min_length"]:
            problems.append(("min_length", f"parameter '{name}' shorter than {spec['min_length']}"))
        if "regex" in spec:
            if len(value) > MAX_REGEX_INPUT or not re.fullmatch(spec["regex"], value):
                problems.append(("regex", f"parameter '{name}' does not match the required pattern"))
        if "domain_allow_list" in spec and not domain_allowed(value, spec["domain_allow_list"]):
            problems.append(("domain", f"parameter '{name}' domain is not on the allow-list"))
    if _is_num(value):
        if "min" in spec and value < spec["min"]:
            problems.append(("min", f"parameter '{name}' is below minimum {spec['min']}"))
        if "max" in spec and value > spec["max"]:
            problems.append(("max", f"parameter '{name}' exceeds maximum {spec['max']}"))


def validate_params(params: dict, specs: dict, additional_allowed: bool = False) -> list[tuple[str, str]]:
    """Return [(code, message)] problems. Messages never echo parameter values."""
    problems: list[tuple[str, str]] = []
    params = params or {}
    if not isinstance(params, dict):
        return [("type", "tool parameters must be an object")]
    for name, spec in (specs or {}).items():
        if name not in params:
            if spec.get("required"):
                problems.append(("required", f"required parameter '{name}' missing"))
            continue
        value = params[name]
        typ = spec.get("type")
        ok = {
            "string": isinstance(value, str),
            "integer": _is_int(value),
            "number": _is_num(value),
            "boolean": isinstance(value, bool),
            "array": isinstance(value, list),
        }.get(typ, True)
        if not ok:
            problems.append(("type", f"parameter '{name}' must be of type {typ}"))
            continue
        if typ == "number" and isinstance(value, float) and value != value:  # NaN
            problems.append(("type", f"parameter '{name}' is not a finite number"))
            continue
        if typ == "array":
            if "max_items" in spec and len(value) > spec["max_items"]:
                problems.append(("max_items", f"parameter '{name}' has more than {spec['max_items']} items"))
            for item in value:
                _check_scalar(name, item, spec, problems)
        else:
            _check_scalar(name, value, spec, problems)
    if not additional_allowed:
        extra = sorted(k for k in params if k not in (specs or {}))
        if extra:
            problems.append(("undeclared", f"undeclared parameter(s) {extra} are not permitted"))
    return problems


def condition_met(params: dict, cond: dict) -> tuple[bool, str]:
    """Evaluate a require_approval_if condition. Missing parameter => met (conservative)."""
    name, op, target = cond["param"], cond["op"], cond["value"]
    if not isinstance(params, dict) or name not in params:
        return True, f"parameter '{name}' absent; approval required conservatively"
    v = params[name]
    try:
        met = {
            "gt": lambda: v > target, "gte": lambda: v >= target,
            "lt": lambda: v < target, "lte": lambda: v <= target,
            "eq": lambda: v == target, "ne": lambda: v != target,
            "in": lambda: v in target, "not_in": lambda: v not in target,
        }[op]()
    except TypeError:
        return True, f"parameter '{name}' not comparable; approval required conservatively"
    reason = cond.get("reason") or f"parameter '{name}' {op} {target!r}"
    return bool(met), reason
