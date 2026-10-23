"""Tamper-evident (hash-chained), append-only audit log.

Each record contains the SHA-256 hash of the previous record. `verify()` detects
any modification, deletion or reordering of records. This provides tamper
EVIDENCE, not tamper PROOF: production deployments should additionally ship
records to WORM storage (see docs/TECHNICAL_ARCHITECTURE.md).

Records must never contain raw sensitive data: callers pass redacted payloads.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from .ids import new_id

GENESIS = "0" * 64
_LOCK = threading.Lock()


def _canonical(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _hash(record_wo_hash: dict) -> str:
    return hashlib.sha256(_canonical(record_wo_hash).encode("utf-8")).hexdigest()


class AuditLog:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.touch()

    def _last_hash(self) -> str:
        # Cache keyed on file size: valid as long as nobody else appended since our last read/write.
        size = self.path.stat().st_size
        cached = getattr(self, "_cache", None)
        if cached and cached[0] == size:
            return cached[1]
        last = GENESIS
        for rec in self.records():
            last = rec["hash"]
        self._cache = (size, last)
        return last

    def append(self, action: str, actor: str, details: dict | None = None, *,
               trace_id: str | None = None, resource: str | None = None,
               outcome: str = "success") -> dict:
        with _LOCK:
            rec = {
                "id": new_id("aud"),
                "ts": datetime.now(timezone.utc).isoformat(),
                "trace_id": trace_id or new_id("trc"),
                "actor": actor,
                "action": action,
                "resource": resource,
                "outcome": outcome,
                "details": details or {},
                "prev_hash": self._last_hash(),
            }
            rec["hash"] = _hash(rec)
            with open(self.path, "a", encoding="utf-8") as fh:
                fh.write(_canonical(rec) + "\n")
                fh.flush()
                os.fsync(fh.fileno())
            self._cache = (self.path.stat().st_size, rec["hash"])
            return rec

    def records(self) -> Iterator[dict]:
        with open(self.path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    yield json.loads(line)

    def verify(self) -> tuple[bool, str]:
        prev = GENESIS
        for i, rec in enumerate(self.records()):
            if rec.get("prev_hash") != prev:
                return False, f"chain broken at record {i} ({rec.get('id')}): prev_hash mismatch"
            body = {k: v for k, v in rec.items() if k != "hash"}
            if _hash(body) != rec.get("hash"):
                return False, f"record {i} ({rec.get('id')}) content hash mismatch"
            prev = rec["hash"]
        return True, "ok"

    def query(self, *, action: str | None = None, trace_id: str | None = None,
              resource: str | None = None) -> list[dict]:
        out = []
        for r in self.records():
            if action and r["action"] != action:
                continue
            if trace_id and r["trace_id"] != trace_id:
                continue
            if resource and r.get("resource") != resource:
                continue
            out.append(r)
        return out
