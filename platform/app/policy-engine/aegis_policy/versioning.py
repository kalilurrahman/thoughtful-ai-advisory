"""Policy versioning and lifecycle helpers.

Every material change produces a new semantic version, resets the policy to
``draft``, clears approvals (approvals bind to a reviewed version), records the
previous version for rollback and appends to ``change_history``. Status changes
follow ``STATUS_TRANSITIONS``; ``approved``/``active`` require recorded human
approvals from the required roles (IS-13, GL-04) and are never performed by the
advisor or generator.
"""
from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Any

from .constants import STATUS_TRANSITIONS
from .schema import parse_semver, semver_key, validate_policy


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def bump_version(version: str, part: str = "minor") -> str:
    """Bump a semantic version. ``part`` = major | minor | patch. Pre-release tags are dropped."""
    ma, mi, pa, pre = parse_semver(version)
    if part == "major":
        return f"{ma + 1}.0.0"
    if part == "minor":
        return f"{ma}.{mi + 1}.0"
    if part == "patch":
        return f"{ma}.{mi}.{pa + 1}" if not pre else f"{ma}.{mi}.{pa}"
    raise ValueError("part must be one of major, minor, patch")


def record_change(policy: dict, author: str, summary: str, change_type: str = "modified",
                  date: str | None = None) -> dict:
    """Return a copy of ``policy`` with a change-history entry for its current version."""
    p = copy.deepcopy(policy)
    p.setdefault("change_history", []).append({
        "version": p["version"], "date": date or _today(), "author": author,
        "change_type": change_type, "summary": summary,
    })
    return p


def new_version(policy: dict, changes: dict | None = None, *, part: str = "minor", author: str,
                summary: str) -> dict:
    """Create the next draft version of a policy.

    ``changes`` is a nested dict deep-merged into the copy (lists are replaced).
    The result is ``draft`` with approvals cleared and ``rollback.previous_version``
    set to the old version.
    """
    p = copy.deepcopy(policy)
    if changes:
        _deep_merge(p, copy.deepcopy(changes))
    old = policy["version"]
    p["version"] = bump_version(old, part)
    p["status"] = "draft"
    p.setdefault("rollback", {})["previous_version"] = old
    if p["rollback"].get("strategy") in (None, "disable"):
        p["rollback"]["strategy"] = "revert_to_previous"
    p["approval"]["approved_by"] = []
    p["approval"]["approved_at"] = None
    return record_change(p, author, summary, "modified")


def _deep_merge(base: dict, upd: dict) -> None:
    for k, v in upd.items():
        if isinstance(v, dict) and isinstance(base.get(k), dict):
            _deep_merge(base[k], v)
        else:
            base[k] = v


def diff_policies(old: Any, new: Any, path: str = "") -> list[dict]:
    """Structural diff -> [{path, change: added|removed|changed, old, new}].

    Tool rules are matched by ``id`` (and change-history is summarized) so diffs stay
    readable for reviewers.
    """
    out: list[dict] = []
    if isinstance(old, dict) and isinstance(new, dict):
        for k in list(old.keys()) + [k for k in new.keys() if k not in old]:
            sub = f"{path}.{k}" if path else k
            if k not in new:
                out.append({"path": sub, "change": "removed", "old": old[k], "new": None})
            elif k not in old:
                out.append({"path": sub, "change": "added", "old": None, "new": new[k]})
            else:
                out.extend(diff_policies(old[k], new[k], sub))
        return out
    if isinstance(old, list) and isinstance(new, list):
        keyed = all(isinstance(x, dict) and "id" in x for x in old + new) and (old or new)
        if keyed:
            om = {x["id"]: x for x in old}
            nm = {x["id"]: x for x in new}
            for k in list(om) + [k for k in nm if k not in om]:
                sub = f"{path}[{k}]"
                if k not in nm:
                    out.append({"path": sub, "change": "removed", "old": om[k], "new": None})
                elif k not in om:
                    out.append({"path": sub, "change": "added", "old": None, "new": nm[k]})
                else:
                    out.extend(diff_policies(om[k], nm[k], sub))
            return out
        if old != new:
            out.append({"path": path, "change": "changed", "old": old, "new": new})
        return out
    if old != new:
        out.append({"path": path, "change": "changed", "old": old, "new": new})
    return out


def summarize_diff(diff: list[dict]) -> list[str]:
    lines = []
    for d in diff:
        if d["path"].startswith("change_history"):
            continue
        if d["change"] == "changed":
            lines.append(f"{d['path']}: {d['old']!r} -> {d['new']!r}")
        else:
            lines.append(f"{d['path']}: {d['change']}")
    return lines


def add_approval(policy: dict, approver: dict, note: str = "") -> dict:
    """Record a human approval on an ``in_review`` policy. ``approver`` = {name, role}.

    Enforces: role is a required approver role; separation of duties (the author of the
    current version cannot approve it) when enabled; no duplicate approver names.
    """
    if policy.get("status") != "in_review":
        raise ValueError("approvals can only be recorded while the policy is in_review")
    name, role = (approver or {}).get("name"), (approver or {}).get("role")
    if not name or not role:
        raise ValueError("approver name and role are required")
    appr = policy["approval"]
    if role not in appr["required_approver_roles"]:
        raise PermissionError(f"role '{role}' is not a required approver role for this policy")
    if appr.get("separation_of_duties", True):
        authors = {h["author"] for h in policy["change_history"]
                   if h["version"] == policy["version"] and h["change_type"] in ("created", "modified", "rollback")}
        if name in authors:
            raise PermissionError("separation of duties: the author of this version cannot approve it")
    if any(a["name"] == name for a in appr["approved_by"]):
        raise ValueError(f"{name} has already approved this version")
    p = copy.deepcopy(policy)
    entry = {"name": name, "role": role, "approved_at": _now()}
    if note:
        entry["note"] = note
    p["approval"]["approved_by"].append(entry)
    return p


def approvals_complete(policy: dict) -> bool:
    appr = policy["approval"]
    roles = {a["role"] for a in appr["approved_by"]}
    names = {a["name"] for a in appr["approved_by"]}
    return all(r in roles for r in appr["required_approver_roles"]) and len(names) >= appr["min_approvers"]


def transition_status(policy: dict, to_status: str, actor: dict, note: str = "") -> dict:
    """Move a policy through its lifecycle, enforcing human approval gates.

    draft -> in_review -> approved -> active -> retired (in_review/approved -> draft for changes).
    Returns a validated copy; raises ``ValueError``/``PermissionError`` on illegal transitions.
    """
    frm = policy["status"]
    if to_status not in STATUS_TRANSITIONS.get(frm, set()):
        raise ValueError(f"illegal status transition {frm} -> {to_status}")
    name = (actor or {}).get("name")
    if not name:
        raise ValueError("actor name is required")
    p = copy.deepcopy(policy)
    if to_status == "approved":
        if not approvals_complete(p):
            raise PermissionError("cannot approve: approvals from all required roles are not yet recorded")
        p["approval"]["approved_at"] = _now()
    if to_status == "active":
        if (actor or {}).get("role") not in p["approval"]["required_approver_roles"]:
            raise PermissionError("activation must be performed by a holder of a required approver role")
    if to_status == "draft":
        p["approval"]["approved_by"] = []
        p["approval"]["approved_at"] = None
    p["status"] = to_status
    change_type = {"approved": "approved", "active": "activated", "retired": "retired"}.get(to_status, "status_change")
    p = record_change(p, name, note or f"status {frm} -> {to_status}", change_type)
    errors = validate_policy(p)
    if errors:
        raise ValueError("transition would produce an invalid policy: " + "; ".join(errors))
    return p


def latest(versions: list[dict]) -> dict:
    return max(versions, key=lambda p: semver_key(p["version"]))
