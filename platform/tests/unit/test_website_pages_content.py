"""Runs the web-content self-check (scripts/check_website_pages.py) as a test."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_website_pages_pass_content_checks():
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "check_website_pages.py")], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout + r.stderr
