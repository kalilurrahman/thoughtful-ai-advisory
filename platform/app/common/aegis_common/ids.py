"""ID helpers."""
from __future__ import annotations

import secrets
import time


def new_id(prefix: str) -> str:
    """Sortable-ish unique id: <prefix>_<ms timestamp base36><random hex>."""
    ms = int(time.time() * 1000)
    b36 = ""
    n = ms
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    while n:
        n, r = divmod(n, 36)
        b36 = alphabet[r] + b36
    return f"{prefix}_{b36}{secrets.token_hex(4)}"
