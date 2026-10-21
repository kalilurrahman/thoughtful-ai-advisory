"""Load policies and policy packs from YAML/JSON."""
from __future__ import annotations

import json
from pathlib import Path

import yaml

from .schema import validate_policy


def policy_packs_dir() -> Path:
    from aegis_common.paths import CONTENT_DIR
    return CONTENT_DIR / "policy_packs"


def load_policy(path: str | Path, validate: bool = True) -> dict:
    path = Path(path)
    text = path.read_text(encoding="utf-8")
    data = json.loads(text) if path.suffix.lower() == ".json" else yaml.safe_load(text)
    if validate:
        errors = validate_policy(data)
        if errors:
            raise ValueError(f"{path.name}: invalid policy: " + "; ".join(errors))
    return data


def list_packs() -> list[str]:
    return sorted(p.stem for p in policy_packs_dir().glob("*.yaml"))


def load_pack(name: str, validate: bool = True) -> dict:
    if "/" in name or "\\" in name or name.startswith("."):
        raise ValueError("invalid pack name")
    return load_policy(policy_packs_dir() / f"{name}.yaml", validate=validate)
