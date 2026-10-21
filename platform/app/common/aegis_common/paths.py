"""Repository paths and import bootstrap for AEGIS Python packages.

The /app tree uses hyphenated directory names (e.g. app/assessment-engine) as
required by the repository layout; each contains an importable package
(e.g. aegis_assessment). `bootstrap()` adds every app/* directory to sys.path.
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
APP_DIR = REPO_ROOT / "app"
CONTENT_DIR = REPO_ROOT / "content"
CONTROLS_FILE = CONTENT_DIR / "controls" / "controls.yaml"
ASSESSMENT_TEMPLATE_FILE = CONTENT_DIR / "assessment_templates" / "maturity_self_assessment.yaml"
VAR_DIR = REPO_ROOT / "var"  # runtime data (audit logs, leads, outbox) — git-ignored
OUTPUT_DIR = REPO_ROOT / "output"


def bootstrap() -> None:
    for d in sorted(APP_DIR.iterdir()):
        if d.is_dir() and str(d) not in sys.path:
            sys.path.insert(0, str(d))
