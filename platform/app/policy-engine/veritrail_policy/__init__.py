"""VERITRAIL policy-as-code: schema, validator, decision engine, versioning.

"AI proposes. VERITRAIL evaluates. Approved actions execute."
"""
from .constants import DECISIONS, ROLLOUT_MODES, SCHEMA_VERSION, STATUSES  # noqa: F401
from .schema import lint_policy, validate_policy  # noqa: F401

__version__ = "1.0.0"
