"""Environment lookups that still honour the pre-rename AEGIS_* variable names.

The platform was renamed from AEGIS to VERITRAIL. Hosts configured before the rename may still
export ``AEGIS_*`` variables, so every ``VERITRAIL_*`` lookup falls back to the matching legacy
name. The new name always wins when both are set.
"""
from __future__ import annotations

import os

PREFIX = "VERITRAIL_"
LEGACY_PREFIX = "AEGIS_"


def legacy_name(name: str) -> str | None:
    """Return the pre-rename spelling of a VERITRAIL_* variable, or None for other names."""
    return LEGACY_PREFIX + name[len(PREFIX):] if name.startswith(PREFIX) else None


def getenv(name: str, default: str | None = None) -> str | None:
    """os.environ.get() that also accepts the legacy AEGIS_* spelling of VERITRAIL_* names."""
    if name in os.environ:
        return os.environ[name]
    legacy = legacy_name(name)
    if legacy is not None and legacy in os.environ:
        return os.environ[legacy]
    return default
