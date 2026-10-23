"""Errors raised by the website build."""
from __future__ import annotations


class BuildError(Exception):
    """A problem that must stop the build (bad front matter, unknown control ID, ...).

    ``problems`` holds every individual message so authors can fix them in one pass.
    """

    def __init__(self, problems: list[str] | str):
        if isinstance(problems, str):
            problems = [problems]
        self.problems = list(problems)
        super().__init__("\n".join(self.problems))
