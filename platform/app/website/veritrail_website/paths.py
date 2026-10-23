"""Filesystem locations used by the website build."""
from __future__ import annotations

from pathlib import Path

WEBSITE_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = WEBSITE_DIR.parents[1]
TEMPLATES_DIR = WEBSITE_DIR / "templates"
STATIC_DIR = WEBSITE_DIR / "static"
DIST_DIR = WEBSITE_DIR / "dist"
SITE_CONFIG = WEBSITE_DIR / "site.yaml"
DEFAULT_PAGES_DIR = REPO_ROOT / "content" / "website_pages"
CONTROLS_FILE = REPO_ROOT / "content" / "controls" / "controls.yaml"
ASSESSMENT_TEMPLATE_FILE = REPO_ROOT / "content" / "assessment_templates" / "maturity_self_assessment.yaml"
FIXTURE_PAGES_DIR = REPO_ROOT / "tests" / "fixtures" / "website_pages"
