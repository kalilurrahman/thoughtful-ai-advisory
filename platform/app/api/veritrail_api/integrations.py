"""Lead capture integrations: CRM adapters and email delivery adapters.

Default adapters are local and dependency-free (JSONL CRM store, .eml outbox),
so the product works end-to-end without third-party accounts. Webhook/HubSpot
and SMTP adapters are selected by environment variables (see
docs/API_SPECIFICATION.md#integrations).

Governance: transactional report-delivery emails use PRE-APPROVED templates
(content/email_templates.yaml, each with approver + approval date). Any template
without an approval record is NOT sent; it is queued for human approval
(external communications require human approval).
"""
from __future__ import annotations

import json
import os
import smtplib
import urllib.request
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path

import yaml

from veritrail_common.paths import CONTENT_DIR

FREE_MAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.in", "ymail.com", "hotmail.com",
    "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com",
    "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.de", "gmx.net", "mail.com", "zoho.com",
    "yandex.com", "yandex.ru", "mail.ru", "qq.com", "163.com", "126.com", "rediffmail.com", "tutanota.com",
    "fastmail.com", "hey.com", "web.de", "inbox.com",
}
DISPOSABLE_DOMAINS = {"mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "trashmail.com",
                      "yopmail.com", "sharklasers.com", "getnada.com", "dispostable.com"}


def email_domain(email: str) -> str:
    return email.rsplit("@", 1)[-1].lower().strip() if "@" in email else ""


def is_business_email(email: str) -> bool:
    d = email_domain(email)
    return bool(d) and d not in FREE_MAIL_DOMAINS and d not in DISPOSABLE_DOMAINS


# ----------------------------------------------------------------- CRM
class JsonlCRM:
    name = "jsonl"

    def __init__(self, var_dir: Path):
        self.path = Path(var_dir) / "crm" / "contacts.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def upsert_contact(self, record: dict) -> dict:
        rec = {**record, "synced_at": datetime.now(timezone.utc).isoformat(), "crm": self.name}
        with open(self.path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        return {"ok": True, "backend": self.name}


class WebhookCRM:
    """POSTs the lead JSON to VERITRAIL_CRM_WEBHOOK_URL (e.g. Zapier/Make/n8n or a CRM inbound endpoint)."""
    name = "webhook"

    def __init__(self, url: str, timeout: float = 5.0):
        self.url, self.timeout = url, timeout

    def upsert_contact(self, record: dict) -> dict:
        req = urllib.request.Request(self.url, data=json.dumps(record).encode(), method="POST",
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:  # noqa: S310 (configured URL)
                return {"ok": 200 <= r.status < 300, "backend": self.name, "status": r.status}
        except Exception as e:  # never fail lead capture because the CRM is down
            return {"ok": False, "backend": self.name, "error": type(e).__name__}


class HubSpotFormsCRM(WebhookCRM):
    """HubSpot Forms submission API (portal id + form guid). Field mapping in to_hubspot()."""
    name = "hubspot"

    def __init__(self, portal_id: str, form_guid: str, timeout: float = 5.0):
        super().__init__(f"https://api.hsforms.com/submissions/v3/integration/submit/{portal_id}/{form_guid}", timeout)

    def upsert_contact(self, record: dict) -> dict:
        payload = {"fields": [{"name": k, "value": str(v)} for k, v in {
            "email": record.get("email"), "firstname": record.get("name"), "company": record.get("company"),
            "jobtitle": record.get("role"), "veritrail_maturity_score": record.get("overall_score"),
            "veritrail_maturity_level": record.get("maturity_level"),
            "veritrail_lead_tags": ";".join(record.get("lead_tags", [])), "veritrail_source": record.get("source"),
        }.items() if v not in (None, "")],
            "legalConsentOptions": {"consent": {"consentToProcess": bool(record.get("consent")),
                                                "text": "I agree to VERITRAIL processing my data to deliver my report."}}}
        return WebhookCRM.upsert_contact(self, payload)


def get_crm(var_dir: Path):
    backend = os.environ.get("VERITRAIL_CRM_BACKEND", "jsonl")
    if backend == "webhook" and os.environ.get("VERITRAIL_CRM_WEBHOOK_URL"):
        return WebhookCRM(os.environ["VERITRAIL_CRM_WEBHOOK_URL"])
    if backend == "hubspot" and os.environ.get("VERITRAIL_HUBSPOT_PORTAL_ID") and os.environ.get("VERITRAIL_HUBSPOT_FORM_GUID"):
        return HubSpotFormsCRM(os.environ["VERITRAIL_HUBSPOT_PORTAL_ID"], os.environ["VERITRAIL_HUBSPOT_FORM_GUID"])
    return JsonlCRM(var_dir)


# ----------------------------------------------------------------- Email
def load_email_templates() -> dict:
    p = CONTENT_DIR / "email_templates.yaml"
    return yaml.safe_load(p.read_text(encoding="utf-8"))["templates"] if p.exists() else {}


class OutboxMailer:
    name = "outbox"

    def __init__(self, var_dir: Path):
        self.dir = Path(var_dir) / "outbox"
        self.dir.mkdir(parents=True, exist_ok=True)

    def send(self, msg: EmailMessage, msg_id: str) -> dict:
        p = self.dir / f"{msg_id}.eml"
        p.write_bytes(bytes(msg))
        return {"ok": True, "backend": self.name, "path": str(p)}


class SMTPMailer:
    name = "smtp"

    def __init__(self):
        self.host = os.environ["VERITRAIL_SMTP_HOST"]
        self.port = int(os.environ.get("VERITRAIL_SMTP_PORT", "587"))
        self.user = os.environ.get("VERITRAIL_SMTP_USER")
        self.password = os.environ.get("VERITRAIL_SMTP_PASSWORD")

    def send(self, msg: EmailMessage, msg_id: str) -> dict:
        try:
            with smtplib.SMTP(self.host, self.port, timeout=10) as s:
                s.starttls()
                if self.user:
                    s.login(self.user, self.password or "")
                s.send_message(msg)
            return {"ok": True, "backend": self.name}
        except Exception as e:
            return {"ok": False, "backend": self.name, "error": type(e).__name__}


def get_mailer(var_dir: Path):
    if os.environ.get("VERITRAIL_MAIL_BACKEND") == "smtp" and os.environ.get("VERITRAIL_SMTP_HOST"):
        return SMTPMailer()
    return OutboxMailer(var_dir)


def render_template(template_id: str, context: dict) -> tuple[dict, str, str]:
    """Returns (template_meta, subject, body). Raises KeyError for unknown templates."""
    tpl = load_email_templates()[template_id]
    subject = tpl["subject"].format(**context)
    body = tpl["body"].format(**context)
    return tpl, subject, body


def template_is_approved(tpl: dict) -> bool:
    appr = tpl.get("approval") or {}
    return tpl.get("status") == "approved" and bool(appr.get("approved_by")) and bool(appr.get("approved_at"))


def build_message(to: str, subject: str, body: str, sender: str, attachments: list[tuple[str, bytes, str]] = ()) -> EmailMessage:
    msg = EmailMessage()
    msg["To"] = to
    msg["From"] = sender
    msg["Subject"] = subject
    msg.set_content(body)
    for filename, data, mime in attachments:
        maintype, subtype = mime.split("/", 1)
        msg.add_attachment(data, maintype=maintype, subtype=subtype, filename=filename)
    return msg
