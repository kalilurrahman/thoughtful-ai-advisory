"""Shortcodes: ``{{cta:key}}``, ``{{disclaimer}}``, ``{{controls:ID,ID}}``.

Shortcodes are block-level. They are replaced by opaque tokens before Markdown runs and
swapped for rendered HTML afterwards, so page Markdown never passes through Jinja.
Shortcodes inside fenced code blocks or inline code spans are left untouched.
Unknown shortcode names, unknown CTA keys and unknown control IDs fail the build.
"""
from __future__ import annotations

import re
from typing import Callable

from .errors import BuildError

SHORTCODE_RE = re.compile(r"\{\{\s*([A-Za-z_][A-Za-z0-9_-]*)\s*(?::([^{}]*))?\}\}")
_FENCE_RE = re.compile(r"^(?P<fence>```+|~~~+)[^\n]*\n.*?^(?P=fence)[ \t]*$", re.MULTILINE | re.DOTALL)
_INLINE_CODE_RE = re.compile(r"(`+)(?!`).+?(?<!`)\1", re.DOTALL)
TOKEN_FMT = "VERITRAILSHORTCODE{n}TOKEN"
CONTROL_ID_RE = re.compile(r"^(AO|EI|GL|IS|SE)-\d{2}$")


def _code_spans(text: str) -> list[tuple[int, int]]:
    spans = [m.span() for m in _FENCE_RE.finditer(text)]

    def inside(pos: int) -> bool:
        return any(a <= pos < b for a, b in spans)

    for m in _INLINE_CODE_RE.finditer(text):
        if not inside(m.start()):
            spans.append(m.span())
    return spans


class ShortcodeProcessor:
    """``renderers`` maps name -> callable(arg: str|None) -> html (may raise BuildError)."""

    def __init__(self, renderers: dict[str, Callable[[str | None], str]]):
        self.renderers = renderers

    def extract(self, text: str, source: str = "") -> tuple[str, dict[str, str]]:
        spans = _code_spans(text)
        out: list[str] = []
        blocks: dict[str, str] = {}
        problems: list[str] = []
        last = 0
        for m in SHORTCODE_RE.finditer(text):
            if any(a <= m.start() < b for a, b in spans):
                continue
            name, arg = m.group(1).lower(), m.group(2)
            arg = arg.strip() if arg is not None else None
            renderer = self.renderers.get(name)
            prefix = f"{source}: " if source else ""
            if renderer is None:
                problems.append(f"{prefix}unknown shortcode {m.group(0)!r} "
                                f"(known: {', '.join('{{' + k + '}}' for k in sorted(self.renderers))})")
                continue
            try:
                html = renderer(arg)
            except BuildError as exc:
                problems.extend(prefix + p for p in exc.problems)
                continue
            token = TOKEN_FMT.format(n=len(blocks))
            blocks[token] = html
            out.append(text[last:m.start()])
            out.append(f"\n\n{token}\n\n")
            last = m.end()
        if problems:
            raise BuildError(problems)
        out.append(text[last:])
        return "".join(out), blocks

    @staticmethod
    def inject(html: str, blocks: dict[str, str]) -> str:
        for token, block in blocks.items():
            html, n = re.subn(rf"<p>\s*{token}\s*</p>", lambda _m, b=block: b, html)
            if n == 0:
                html = html.replace(token, block)
        return html


def parse_control_ids(arg: str | None, known: dict) -> list[str]:
    if not arg:
        raise BuildError("{{controls:...}} needs at least one control ID, e.g. {{controls:IS-11,IS-13}}")
    ids = [x.strip().upper() for x in arg.split(",") if x.strip()]
    problems = []
    for cid in ids:
        if cid not in known:
            problems.append(f"unknown VERITRAIL control ID {cid!r} in {{{{controls:{arg}}}}} "
                            "(valid IDs are defined in content/controls/controls.yaml)")
    if problems:
        raise BuildError(problems)
    seen: list[str] = []
    for cid in ids:
        if cid not in seen:
            seen.append(cid)
    return seen
