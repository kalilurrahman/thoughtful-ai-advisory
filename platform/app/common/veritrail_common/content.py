"""Loaders for VERITRAIL governed content (controls, assessment template)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from .paths import ASSESSMENT_TEMPLATE_FILE, CONTENT_DIR, CONTROLS_FILE


def load_yaml(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@lru_cache(maxsize=1)
def load_control_library() -> dict:
    return load_yaml(CONTROLS_FILE)


def controls() -> list[dict]:
    return load_control_library()["controls"]


@lru_cache(maxsize=1)
def controls_by_id() -> dict[str, dict]:
    return {c["id"]: c for c in controls()}


def get_control(control_id: str) -> dict | None:
    return controls_by_id().get(control_id)


def control_citation(control_id: str) -> str:
    """Human-readable citation, e.g. 'VERITRAIL Control IS-11: Least-privilege tool access (v1.0.0)'."""
    c = get_control(control_id)
    if not c:
        raise KeyError(f"Unknown VERITRAIL control ID: {control_id}")
    ver = load_control_library()["library"]["version"]
    return f"VERITRAIL Control {c['id']}: {c['title']} (Control Library v{ver})"


def pillars() -> list[dict]:
    return load_control_library()["pillars"]


@lru_cache(maxsize=1)
def load_assessment_template() -> dict:
    return load_yaml(ASSESSMENT_TEMPLATE_FILE)


def content_path(*parts: str) -> Path:
    return CONTENT_DIR.joinpath(*parts)
