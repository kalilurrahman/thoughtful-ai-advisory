"""AEGIS HTTP API + static website server (stdlib only).

Run:  python3 -m aegis_api.server --port 8080
      (with PYTHONPATH covering app/*; see Makefile `make serve`)

Design notes
- `AegisApp.handle()` is a pure request->response function so it can be tested
  without sockets; `serve()` wraps it in a ThreadingHTTPServer.
- Lead PII is stored only in var/leads (and the configured CRM). The audit log
  records lead ids and email DOMAINS only.
- Analytics events are cookieless; no IP address or user agent is stored.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import mimetypes
import os
import re
import secrets
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from aegis_common.audit import AuditLog
from aegis_common.ids import new_id
from aegis_common.paths import APP_DIR, VAR_DIR

from . import integrations as integ

MAX_BODY = 256 * 1024
SITE_DIR_DEFAULT = APP_DIR / "website" / "dist"
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$")
FORMS = {"baseline": "Governance Baseline", "demo": "demo", "contact": "contact", "newsletter": "newsletter",
         "blueprint": "Enterprise Blueprint", "waitlist": "waitlist", "design_partner": "design-partner"}
BUSINESS_EMAIL_FORMS = {"baseline", "demo", "blueprint", "design_partner"}
EVENT_NAMES = {"page_view", "cta_click", "assessment_start", "assessment_step", "assessment_preliminary",
               "assessment_gate_view", "assessment_lead_submitted", "assessment_report_download", "form_submit",
               "tool_use", "outbound_click"}

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "Content-Security-Policy": ("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
                                "connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; "
                                "form-action 'self'"),
    "Cross-Origin-Opener-Policy": "same-origin",
}


class HttpError(Exception):
    def __init__(self, status: int, message: str, extra: dict | None = None):
        super().__init__(message)
        self.status, self.message, self.extra = status, message, extra or {}


class RateLimiter:
    """Fixed-window limiter keyed by a salted hash of the client address (never stored)."""

    def __init__(self, limit: int = 60, window: int = 60):
        self.limit, self.window = limit, window
        self.hits: dict[str, tuple[int, int]] = {}
        self.salt = secrets.token_bytes(16)
        self.lock = threading.Lock()

    def allow(self, client: str, bucket: str) -> bool:
        key = hashlib.sha256(self.salt + f"{bucket}|{client}".encode()).hexdigest()
        now = int(time.time()) // self.window
        with self.lock:
            win, n = self.hits.get(key, (now, 0))
            if win != now:
                win, n = now, 0
            n += 1
            self.hits[key] = (win, n)
            if len(self.hits) > 50_000:
                self.hits = {k: v for k, v in self.hits.items() if v[0] == now}
            return n <= self.limit


class AegisApp:
    def __init__(self, var_dir: str | Path | None = None, site_dir: str | Path | None = None,
                 public_base_url: str = ""):
        self.var = Path(var_dir or os.environ.get("AEGIS_VAR_DIR") or VAR_DIR)
        self.var.mkdir(parents=True, exist_ok=True)
        self.site = Path(site_dir or SITE_DIR_DEFAULT)
        self.base_url = public_base_url or os.environ.get("AEGIS_PUBLIC_BASE_URL", "")
        self.audit = AuditLog(self.var / "audit" / "api_audit.jsonl")
        self.crm = integ.get_crm(self.var)
        self.mailer = integ.get_mailer(self.var)
        self.sender = os.environ.get("AEGIS_MAIL_FROM", "AEGIS <reports@aegis-governance.example>")
        self.secret = self._load_secret()
        self.limiter = RateLimiter(limit=int(os.environ.get("AEGIS_RATE_LIMIT", "60")))
        self._agent = None
        self._agent_lock = threading.Lock()
        (self.var / "leads").mkdir(parents=True, exist_ok=True)
        (self.var / "reports").mkdir(parents=True, exist_ok=True)
        (self.var / "analytics").mkdir(parents=True, exist_ok=True)
        (self.var / "forms").mkdir(parents=True, exist_ok=True)
        (self.var / "approvals").mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------ utils
    def _load_secret(self) -> bytes:
        env = os.environ.get("AEGIS_SECRET")
        if env:
            return env.encode()
        p = self.var / "secret.key"
        if not p.exists():
            p.write_bytes(secrets.token_bytes(32))
            os.chmod(p, 0o600)
        return p.read_bytes()

    def report_token(self, lead_id: str) -> str:
        return hmac.new(self.secret, lead_id.encode(), hashlib.sha256).hexdigest()[:32]

    def _check_token(self, lead_id: str, token: str) -> bool:
        return hmac.compare_digest(self.report_token(lead_id), token or "")

    @staticmethod
    def _json(status: int, obj) -> tuple[int, dict, bytes]:
        return status, {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"}, \
            json.dumps(obj, ensure_ascii=False, default=str).encode()

    @staticmethod
    def _str(v, maxlen: int = 200) -> str:
        if v is None:
            return ""
        s = str(v).strip()
        s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", s)
        return s[:maxlen]

    def _validate_email(self, email: str, business: bool) -> str:
        email = self._str(email, 254).lower()
        if not EMAIL_RE.match(email):
            raise HttpError(422, "Please enter a valid email address.", {"field": "email"})
        if business and not integ.is_business_email(email):
            raise HttpError(422, "Please use your business email address.", {"field": "email", "code": "business_email_required"})
        return email

    # ------------------------------------------------------------ dispatch
    def handle(self, method: str, raw_path: str, headers: dict | None = None, body: bytes = b"",
               client: str = "local") -> tuple[int, dict, bytes]:
        headers = {k.lower(): v for k, v in (headers or {}).items()}
        u = urlparse(raw_path)
        path, query = u.path, parse_qs(u.query)
        try:
            if path.startswith("/api/"):
                if method == "POST":
                    if len(body) > MAX_BODY:
                        raise HttpError(413, "Payload too large.")
                    ctype = headers.get("content-type", "application/json")
                    if "json" not in ctype and "text/plain" not in ctype:  # text/plain = sendBeacon
                        raise HttpError(415, "Content-Type must be application/json.")
                    bucket = path.split("/")[2]
                    if not self.limiter.allow(client, bucket):
                        raise HttpError(429, "Too many requests. Please retry shortly.")
                    try:
                        data = json.loads(body.decode("utf-8") or "{}")
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        raise HttpError(400, "Invalid JSON body.")
                    if not isinstance(data, dict):
                        raise HttpError(400, "JSON body must be an object.")
                    return self._post(path, data)
                if method == "GET":
                    return self._get_api(path, query)
                raise HttpError(405, "Method not allowed.")
            if method in ("GET", "HEAD"):
                return self._static(path)
            raise HttpError(405, "Method not allowed.")
        except HttpError as e:
            return self._json(e.status, {"error": e.message, **e.extra})
        except Exception as e:  # pragma: no cover - defensive
            self.audit.append("api.error", "system", {"path": path, "error": type(e).__name__}, outcome="failure")
            return self._json(500, {"error": "Internal error. The incident has been logged."})

    def _post(self, path: str, data: dict):
        routes = {
            "/api/assessment/preliminary": self.preliminary,
            "/api/leads": self.create_lead,
            "/api/contact": self.contact,
            "/api/events": self.event,
            "/api/risk-tier": self.risk_tier,
            "/api/shield/advise": self.shield_advise,
            "/api/agent/message": self.agent_message,
        }
        fn = routes.get(path)
        if not fn:
            raise HttpError(404, "Not found.")
        return fn(data)

    def _get_api(self, path: str, query: dict):
        if path == "/api/health":
            return self._json(200, {"status": "ok", "service": "aegis-api", "time": datetime.now(timezone.utc).isoformat()})
        m = re.fullmatch(r"/api/reports/(lead_[a-z0-9]+)\.(pdf|md)", path)
        if m:
            lead_id, ext = m.groups()
            if not self._check_token(lead_id, (query.get("t") or [""])[0]):
                raise HttpError(403, "Invalid or missing report token.")
            p = self.var / "reports" / f"{lead_id}.{ext}"
            if not p.exists():
                raise HttpError(404, "Report not found.")
            self.audit.append("report.download", "lead", {"lead_id": lead_id, "format": ext}, resource=lead_id)
            ctype = "application/pdf" if ext == "pdf" else "text/markdown; charset=utf-8"
            return 200, {"Content-Type": ctype, "Cache-Control": "private, no-store",
                         "Content-Disposition": f'attachment; filename="AEGIS_Maturity_Report_{lead_id}.{ext}"'}, p.read_bytes()
        raise HttpError(404, "Not found.")

    # ------------------------------------------------------------ static site
    def _static(self, path: str):
        if not self.site.exists():
            return 503, {"Content-Type": "text/plain; charset=utf-8"}, b"Website not built. Run: make site"
        rel = unquote(path).lstrip("/")
        if "\x00" in rel:
            raise HttpError(404, "Not found.")
        target = (self.site / rel).resolve()
        site_root = self.site.resolve()
        if site_root not in target.parents and target != site_root:
            raise HttpError(404, "Not found.")
        if target.is_dir():
            if path and not path.endswith("/"):
                return 301, {"Location": path + "/"}, b""
            target = target / "index.html"
        if not target.exists():
            nf = self.site / "404.html"
            return 404, {"Content-Type": "text/html; charset=utf-8"}, nf.read_bytes() if nf.exists() else b"Not found"
        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json", "image/svg+xml"):
            ctype += "; charset=utf-8"
        cache = "public, max-age=3600" if target.suffix in (".css", ".js", ".svg", ".png", ".ico", ".woff2") else "public, max-age=300"
        return 200, {"Content-Type": ctype, "Cache-Control": cache}, target.read_bytes()

    # ------------------------------------------------------------ endpoints
    def preliminary(self, data: dict):
        from aegis_assessment.engine import AssessmentInputError, preliminary_result
        try:
            r = preliminary_result(data.get("answers") or {}, data.get("profile") or {})
        except AssessmentInputError as e:
            raise HttpError(422, str(e))
        return self._json(200, r)

    def create_lead(self, data: dict):
        from aegis_assessment.engine import AssessmentInputError, score_assessment
        from aegis_reports.maturity import render_maturity_markdown
        from aegis_reports.pdf import markdown_to_pdf

        if self._str(data.get("website")):  # honeypot
            raise HttpError(400, "Submission rejected.")
        email = self._validate_email(data.get("email", ""), business=True)
        if data.get("consent") is not True:
            raise HttpError(422, "Consent is required to email your report.", {"field": "consent"})
        name = self._str(data.get("name"), 120)
        company = self._str(data.get("company"), 160)
        role = self._str(data.get("role"), 120)
        if not name or not company:
            raise HttpError(422, "Name and company are required.", {"field": "name" if not name else "company"})
        try:
            result = score_assessment(data.get("answers") or {}, data.get("profile") or {})
        except AssessmentInputError as e:
            raise HttpError(422, str(e))

        lead_id = new_id("lead")
        token = self.report_token(lead_id)
        lead = {"company": company, "name": name}
        md = render_maturity_markdown(result, lead)
        (self.var / "reports" / f"{lead_id}.md").write_text(md, encoding="utf-8")
        pdf_path = markdown_to_pdf(md, self.var / "reports" / f"{lead_id}.pdf",
                                   title=f"AI Governance Maturity Report — {company}")
        md_url = f"{self.base_url}/api/reports/{lead_id}.md?t={token}"
        pdf_url = f"{self.base_url}/api/reports/{lead_id}.pdf?t={token}"

        record = {
            "lead_id": lead_id, "created_at": datetime.now(timezone.utc).isoformat(),
            "email": email, "name": name, "company": company, "role": role, "consent": True,
            "marketing_opt_in": data.get("marketing_opt_in") is True,
            "source": self._str(data.get("source") or "maturity-assessment", 80),
            "profile": result["profile"], "overall_score": result["overall_score"],
            "maturity_level": result["maturity_level"],
            "domain_scores": {d["id"]: d["score"] for d in result["domains"]},
            "critical_flags": [f["id"] for f in result["critical_flags"]],
            "lead_tags": result["lead"]["tags"], "lead_labels": result["lead"]["labels"],
            "template_version": result["template_version"],
        }
        with open(self.var / "leads" / "leads.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False) + "\n")
        crm_res = self.crm.upsert_contact(record)
        mail_res = self._send_template(
            "maturity_report_delivery", email,
            {"name": name, "overall_score": result["overall_score"], "maturity_level": result["maturity_level"],
             "report_url": pdf_url or md_url, "baseline_url": f"{self.base_url}/contact/book-governance-baseline/",
             "privacy_url": f"{self.base_url}/legal/privacy/"},
            attachments=[(f"AEGIS_Maturity_Report.pdf", pdf_path.read_bytes(), "application/pdf"),
                         (f"AEGIS_Maturity_Report.md", md.encode(), "text/markdown")],
            ref=lead_id)
        self.audit.append("lead.created", "public", {
            "lead_id": lead_id, "email_domain": integ.email_domain(email), "score": result["overall_score"],
            "level": result["maturity_level"], "tags": result["lead"]["tags"], "crm": crm_res, "email": mail_res},
            resource=lead_id)
        public = {k: v for k, v in result.items() if k not in ("lead",)}  # lead qualification stays internal
        return self._json(201, {"lead_id": lead_id, "result": public, "report_markdown": md,
                                "report_pdf_url": pdf_url, "report_md_url": md_url,
                                "email_status": "sent" if mail_res.get("ok") else mail_res.get("status", "not_sent")})

    def _send_template(self, template_id: str, to: str, ctx: dict, attachments=(), ref: str = "") -> dict:
        try:
            tpl, subject, body = integ.render_template(template_id, ctx)
        except KeyError:
            return {"ok": False, "status": "unknown_template"}
        if not integ.template_is_approved(tpl):
            appr_id = new_id("appr")
            (self.var / "approvals" / f"{appr_id}.json").write_text(json.dumps({
                "approval_id": appr_id, "type": "external_communication", "status": "pending",
                "template_id": template_id, "to_domain": integ.email_domain(to), "ref": ref,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "reason": "Template has no approval record; external communications require human approval."}))
            self.audit.append("email.queued_for_approval", "system", {"template": template_id, "approval_id": appr_id}, resource=ref)
            return {"ok": False, "status": "pending_approval", "approval_id": appr_id}
        msg = integ.build_message(to, subject, body, self.sender, list(attachments))
        res = self.mailer.send(msg, new_id("msg"))
        self.audit.append("email.sent" if res.get("ok") else "email.failed", "system",
                          {"template": template_id, "template_version": tpl.get("version"),
                           "approval_ref": (tpl.get("approval") or {}).get("approval_ref"),
                           "to_domain": integ.email_domain(to), "backend": res.get("backend")},
                          resource=ref, outcome="success" if res.get("ok") else "failure")
        return {**{k: v for k, v in res.items() if k != "path"}, "status": "sent" if res.get("ok") else "failed"}

    def contact(self, data: dict):
        form = self._str(data.get("form"), 40)
        if form not in FORMS:
            raise HttpError(422, "Unknown form.", {"field": "form"})
        if self._str(data.get("website")):
            raise HttpError(400, "Submission rejected.")
        email = self._validate_email(data.get("email", ""), business=form in BUSINESS_EMAIL_FORMS)
        if data.get("consent") is not True:
            raise HttpError(422, "Consent is required.", {"field": "consent"})
        name = self._str(data.get("name"), 120)
        if form not in ("newsletter", "waitlist") and not name:
            raise HttpError(422, "Name is required.", {"field": "name"})
        sub_id = new_id("form")
        rec = {"id": sub_id, "form": form, "created_at": datetime.now(timezone.utc).isoformat(), "email": email,
               "name": name, "company": self._str(data.get("company"), 160), "role": self._str(data.get("role"), 120),
               "message": self._str(data.get("message"), 4000), "ai_systems": self._str(data.get("ai_systems"), 40),
               "industry": self._str(data.get("industry"), 60), "tool": self._str(data.get("tool"), 60),
               "consent": True}
        with open(self.var / "forms" / "submissions.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        crm_res = self.crm.upsert_contact({**rec, "source": f"form:{form}"})
        mail_res = {"status": "skipped"}
        if form in ("baseline", "demo", "contact", "design_partner"):
            mail_res = self._send_template("form_acknowledgement", email, {
                "name": name or "there", "form_label": FORMS[form], "privacy_url": f"{self.base_url}/legal/privacy/"}, ref=sub_id)
        self.audit.append("form.submitted", "public", {"id": sub_id, "form": form, "email_domain": integ.email_domain(email),
                                                       "crm": crm_res, "email": mail_res.get("status")}, resource=sub_id)
        out = {"id": sub_id, "status": "received"}
        if form == "blueprint":
            out["download_url"] = "/downloads/AEGIS_Enterprise_Blueprint.pdf"
        if form == "newsletter":
            out["note"] = "Subscription recorded. Production deployments should enable double opt-in in the ESP."
        return self._json(201, out)

    def event(self, data: dict):
        name = self._str(data.get("name"), 60)
        if name not in EVENT_NAMES:
            raise HttpError(422, "Unknown event.")
        path = self._str(data.get("path"), 200).split("?")[0]
        props_in = data.get("props") if isinstance(data.get("props"), dict) else {}
        props = {self._str(k, 40): self._str(v, 120) for k, v in list(props_in.items())[:10]
                 if isinstance(v, (str, int, float, bool)) and "email" not in str(k).lower()}
        rec = {"ts": datetime.now(timezone.utc).isoformat(), "name": name, "path": path, "props": props}
        with open(self.var / "analytics" / "events.jsonl", "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec) + "\n")
        return 204, {"Cache-Control": "no-store"}, b""

    def risk_tier(self, data: dict):
        from aegis_assessment.risk_tier import calculate_risk_tier
        prof = data.get("profile") if isinstance(data.get("profile"), dict) else {}
        r = calculate_risk_tier(prof)
        self.audit.append("risk_tier.preliminary", "public", {"tier": r["tier"], "score": r["score"],
                                                              "provisional": r["provisional"]})
        return self._json(200, r)

    def shield_advise(self, data: dict):
        try:
            from aegis_shield.advisor import advise
        except ImportError:
            raise HttpError(503, "Runtime Shield Advisor is not available in this deployment.")
        prof = data.get("profile") if isinstance(data.get("profile"), dict) else {}
        try:
            out = advise(prof)
        except (ValueError, TypeError) as e:
            raise HttpError(422, f"Invalid profile: {e}")
        try:
            from aegis_shield.generator import to_json, to_yaml
            pol = out.get("policy")
            if pol is not None:
                out = {**out, "policy_yaml": to_yaml(pol), "policy_json": to_json(pol)}
        except ImportError:
            pass
        self.audit.append("shield.advise", "public", {"app": self._str(prof.get("name") or prof.get("app_name"), 80),
                                                      "rating": (out.get("risk_profile") or {}).get("overall_rating")})
        return self._json(200, out)

    def _get_agent(self):
        with self._agent_lock:
            if self._agent is None:
                from aegis_agent.orchestrator import AegisAgent
                self._agent = AegisAgent(self.var / "agent")
            return self._agent

    def agent_message(self, data: dict):
        msg = self._str(data.get("message"), 4000)
        if not msg:
            raise HttpError(422, "Message is required.", {"field": "message"})
        sid = self._str(data.get("session_id"), 64) or new_id("sess")
        if not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", sid):
            raise HttpError(422, "Invalid session id.")
        try:
            agent = self._get_agent()
        except ImportError:
            raise HttpError(503, "AEGIS Agent is not available in this deployment.")
        # Public website demo runs with a least-privilege demo identity.
        res = agent.handle(msg, session_id=sid, user={"id": "public-demo", "role": "viewer", "channel": "website"})
        if isinstance(res, dict):
            res.setdefault("session_id", sid)
        return self._json(200, res)


# ---------------------------------------------------------------- server
def make_handler(app: AegisApp):
    class Handler(BaseHTTPRequestHandler):
        server_version = "AEGIS"
        sys_version = ""

        def _respond(self, status, headers, body, head=False):
            self.send_response(status)
            for k, v in {**SECURITY_HEADERS, **headers}.items():
                self.send_header(k, v)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if not head and body:
                self.wfile.write(body)

        def _body(self) -> bytes:
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                return b"x" * (MAX_BODY + 1)
            return self.rfile.read(n) if n else b""

        def do_GET(self):
            self._respond(*app.handle("GET", self.path, dict(self.headers), client=self.client_address[0]))

        def do_HEAD(self):
            self._respond(*app.handle("HEAD", self.path, dict(self.headers), client=self.client_address[0]), head=True)

        def do_POST(self):
            self._respond(*app.handle("POST", self.path, dict(self.headers), self._body(), client=self.client_address[0]))

        def log_message(self, fmt, *args):  # no IPs in logs
            pass

    return Handler


def serve(host: str = "127.0.0.1", port: int = 8080, **kw) -> ThreadingHTTPServer:
    app = AegisApp(**kw)
    httpd = ThreadingHTTPServer((host, port), make_handler(app))
    return httpd


def main():
    ap = argparse.ArgumentParser(description="AEGIS API + website server")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--var-dir", default=None)
    ap.add_argument("--site-dir", default=None)
    a = ap.parse_args()
    httpd = serve(a.host, a.port, var_dir=a.var_dir, site_dir=a.site_dir)
    print(f"AEGIS serving on http://{a.host}:{a.port}  (site: {httpd.RequestHandlerClass and SITE_DIR_DEFAULT})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
