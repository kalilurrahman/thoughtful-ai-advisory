"""Pytest bootstrap: make every app/* package importable."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
for d in sorted((ROOT / "app").iterdir()):
    if d.is_dir() and str(d) not in sys.path:
        sys.path.insert(0, str(d))
