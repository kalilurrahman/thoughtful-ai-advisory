"""Agent configuration: paths, roles, permission levels and the user model."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from veritrail_common.paths import CONTENT_DIR, REPO_ROOT, VAR_DIR
from veritrail_common.env import getenv

DEFAULT_DATA_DIR = VAR_DIR / "agent"
USE_CASE_TEMPLATE_FILE = CONTENT_DIR / "assessment_templates" / "use_case_assessment.yaml"
DOCS_DIR = REPO_ROOT / "docs"

CTA_BASELINE = {
    "label": "Book an VERITRAIL Governance Baseline",
    "url": "/contact/book-governance-baseline/",
}
CTA_ASSESSMENT = {"label": "Take the AI Governance Maturity Self-Assessment", "url": "/tools/maturity-assessment/"}
CTA_SHIELD = {"label": "Generate runtime guardrails with VERITRAIL Shield", "url": "/solutions/shield/"}


def data_dir_from_env(explicit: str | Path | None = None) -> Path:
    if explicit:
        return Path(explicit)
    env = getenv("VERITRAIL_AGENT_DATA_DIR")
    return Path(env) if env else DEFAULT_DATA_DIR


# --------------------------------------------------------------------------- permissions
# Permission levels, from least to most consequential.
READ = "read"
COMPUTE = "compute"
CREATE_DRAFT = "create_draft"
WRITE_CONFIRM = "write_confirm"
APPROVAL_REQUIRED = "approval_required"
PERMISSION_LEVELS = [READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED]

# Roles, least to most privileged. "anonymous" is the public website visitor.
ROLES = ["anonymous", "viewer", "assessor", "approver", "admin"]
ROLE_RANK = {r: i for i, r in enumerate(ROLES)}

# Which permission levels each role may invoke. approval_required tools may be
# *requested* by assessors; they only execute after a different approver approves.
ROLE_PERMISSIONS: dict[str, set[str]] = {
    "anonymous": {READ, COMPUTE},
    "viewer": {READ, COMPUTE},
    "assessor": {READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED},
    "approver": {READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED},
    "admin": {READ, COMPUTE, CREATE_DRAFT, WRITE_CONFIRM, APPROVAL_REQUIRED},
}
# Roles that may resolve (approve/reject) pending approvals — never their own.
APPROVER_ROLES = {"approver", "admin"}
# Roles that may mark evidence as reviewed (making it Verified).
EVIDENCE_REVIEWER_ROLES = {"approver", "admin"}

# Actions that must go through request_human_approval and never self-execute.
SENSITIVE_ACTIONS = {
    "change_risk_tier": "Change an AI system's risk tier",
    "confirm_risk_tier": "Confirm an inferred risk tier for an AI system",
    "approve_exception": "Approve a governance exception / risk acceptance",
    "activate_runtime_policy": "Activate or change a production runtime policy",
    "export_sensitive_evidence": "Export a sensitive evidence pack",
    "send_external_communication": "Send an external communication",
}
# Control IDs that justify each approval type (all exist in controls.yaml).
SENSITIVE_ACTION_CONTROLS = {
    "change_risk_tier": ["EI-02", "GL-03"],
    "confirm_risk_tier": ["EI-02", "GL-03"],
    "approve_exception": ["GL-10"],
    "activate_runtime_policy": ["IS-12", "GL-04"],
    "export_sensitive_evidence": ["SE-02", "SE-05"],
    "send_external_communication": ["AO-06", "SE-11"],
}


@dataclass(frozen=True)
class User:
    id: str
    role: str = "viewer"
    name: str = ""
    org: str = ""
    extra: dict = field(default_factory=dict, compare=False, hash=False)

    @property
    def display(self) -> str:
        return self.name or self.id


def coerce_user(user) -> User:
    """Accept a User, a dict {id, role, name}, a bare user-id string, or None.

    Strings and None get the least-privileged applicable role: a bare string is an
    authenticated-but-unprivileged 'viewer'; None is the public 'anonymous' visitor.
    Unknown roles are downgraded to 'anonymous'.
    """
    if isinstance(user, User):
        u = user
    elif user is None:
        u = User(id="anonymous", role="anonymous")
    elif isinstance(user, str):
        u = User(id=user, role="viewer")
    elif isinstance(user, dict):
        u = User(
            id=str(user.get("id") or user.get("user_id") or user.get("email") or "anonymous"),
            role=str(user.get("role") or "viewer"),
            name=str(user.get("name") or ""),
            org=str(user.get("org") or ""),
        )
    else:
        raise TypeError(f"Unsupported user type: {type(user).__name__}")
    if u.role not in ROLE_RANK:
        u = User(id=u.id, role="anonymous", name=u.name, org=u.org)
    return u
