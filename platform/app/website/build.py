#!/usr/bin/env python3
"""Build the VERITRAIL static website into app/website/dist/.

Usage (from the repo root):
    python3 app/website/build.py [--pages DIR] [--out DIR] [--site-url URL] [--no-check]
"""
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
for _p in (_HERE, _HERE.parent / "common"):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from veritrail_website.builder import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
