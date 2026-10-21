"""Runs the node:test JavaScript unit tests in tests/unit/js/ (browser code: site, analytics, engine, report, tools)."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from aegis_website.builder import SiteBuilder
from aegis_website.paths import FIXTURE_PAGES_DIR

JS_TEST_DIR = Path(__file__).resolve().parent / "js"
NODE = shutil.which("node")


@pytest.mark.skipif(NODE is None, reason="node is not installed")
def test_js_unit_suite(tmp_path):
    bundle = SiteBuilder(FIXTURE_PAGES_DIR, tmp_path / "out", run_checks=False).assessment_context()["bundle"]
    bundle_file = tmp_path / "bundle.json"
    bundle_file.write_text(json.dumps(bundle), encoding="utf-8")
    files = sorted(str(p) for p in JS_TEST_DIR.glob("*.test.js"))
    assert files, "no JS tests found"
    proc = subprocess.run([NODE, "--test", *files], capture_output=True, text=True, timeout=120,
                          env={**os.environ, "AEGIS_ASSESSMENT_BUNDLE": str(bundle_file)})
    out = proc.stdout + proc.stderr
    assert proc.returncode == 0, out[-6000:]
    assert "# fail 0" in out
    assert "# skipped 0" in out, "bundle-dependent JS tests were skipped"
