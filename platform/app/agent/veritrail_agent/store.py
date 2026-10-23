"""JSON-file persistence for agent records (systems, assessments, approvals, ...).

Each record is one JSON file: <data_dir>/<collection>/<record_id>.json, written
atomically (tmp file + os.replace). IDs are validated to prevent path traversal.
This is an MVP store for a single tenant; production would use a database with
row-level security (see docs/AGENT_DESIGN.md §Limitations).
"""
from __future__ import annotations

import json
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from veritrail_common.ids import new_id

COLLECTIONS = {
    "systems": "sys",
    "assessments": "asm",
    "approvals": "apr",
    "tasks": "tsk",
    "evidence": "evd",
    "sessions": "ses",
    "reports": "rpt",
    "policies": "pol",
    "exports": "exp",
    "outbox": "out",
    "exceptions": "exc",
}
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,80}$")
_LOCK = threading.RLock()


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def valid_id(record_id: str) -> bool:
    return bool(record_id) and bool(_ID_RE.match(record_id))


class Store:
    def __init__(self, data_dir: str | Path):
        self.root = Path(data_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------ paths
    def _dir(self, collection: str) -> Path:
        if collection not in COLLECTIONS:
            raise ValueError(f"Unknown collection: {collection}")
        d = self.root / collection
        d.mkdir(parents=True, exist_ok=True)
        return d

    def _path(self, collection: str, record_id: str) -> Path:
        if not valid_id(record_id):
            raise ValueError(f"Invalid record id: {record_id!r}")
        return self._dir(collection) / f"{record_id}.json"

    @property
    def audit_path(self) -> Path:
        return self.root / "audit" / "agent_audit.jsonl"

    # ------------------------------------------------------------------ CRUD
    def new_id(self, collection: str) -> str:
        return new_id(COLLECTIONS[collection])

    def put(self, collection: str, record: dict) -> dict:
        if "id" not in record:
            record["id"] = self.new_id(collection)
        record.setdefault("created_at", utcnow())
        record["updated_at"] = utcnow()
        path = self._path(collection, record["id"])
        tmp = path.with_suffix(".json.tmp")
        with _LOCK:
            with open(tmp, "w", encoding="utf-8") as fh:
                json.dump(record, fh, indent=2, ensure_ascii=False, default=str)
            os.replace(tmp, path)
        return record

    def get(self, collection: str, record_id: str) -> dict | None:
        if not valid_id(record_id or ""):
            return None
        path = self._path(collection, record_id)
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)

    def list(self, collection: str) -> list[dict]:
        out = []
        for p in sorted(self._dir(collection).glob("*.json")):
            try:
                with open(p, "r", encoding="utf-8") as fh:
                    out.append(json.load(fh))
            except (OSError, json.JSONDecodeError):
                continue
        return sorted(out, key=lambda r: r.get("created_at", ""))

    def iter(self, collection: str) -> Iterator[dict]:
        yield from self.list(collection)

    def update(self, collection: str, record_id: str, **changes: Any) -> dict:
        with _LOCK:
            rec = self.get(collection, record_id)
            if rec is None:
                raise KeyError(f"{collection}/{record_id} not found")
            rec.update(changes)
            return self.put(collection, rec)
