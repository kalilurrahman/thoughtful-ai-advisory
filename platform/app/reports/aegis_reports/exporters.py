"""File exporters (Markdown, CSV, JSON) with CSV-injection protection."""
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterable

_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_safe(v) -> str:
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        v = "; ".join(str(x) for x in v)
    elif isinstance(v, dict):
        v = json.dumps(v, ensure_ascii=False, sort_keys=True)
    s = str(v)
    # Neutralise spreadsheet formula injection (OWASP CSV injection guidance)
    if s.startswith(_FORMULA_PREFIXES):
        s = "'" + s
    return s


def write_csv(rows: Iterable[dict], path: str | Path, columns: list[str] | None = None) -> Path:
    rows = list(rows)
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if columns is None:
        columns = []
        for r in rows:
            for k in r:
                if k not in columns:
                    columns.append(k)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(columns)
        for r in rows:
            w.writerow([_csv_safe(r.get(c)) for c in columns])
    return path


def write_json(obj, path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, indent=2, ensure_ascii=False, default=str)
        fh.write("\n")
    return path


def write_markdown(md: str, path: str | Path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(md, encoding="utf-8")
    return path
