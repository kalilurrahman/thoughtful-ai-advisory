"""Form definitions rendered by templates/partials/form_fields.html.

Field names match the /api/contact contract (CONTRIBUTING.md §3 and aegis_api.server.contact):
form, email, name, company, role, message, ai_systems, industry, tool, consent, website (honeypot).
"""
from __future__ import annotations

AI_SYSTEMS_OPTIONS = [("", "Select…"), ("0-9", "0–9"), ("10-24", "10–24"), ("25-99", "25–99"),
                      ("100+", "100 or more"), ("unknown", "Not sure")]
INDUSTRY_OPTIONS = [("", "Select…"), ("healthcare_pharma", "Healthcare & pharma"),
                    ("bfsi", "Banking, financial services & insurance"),
                    ("gcc_it_services", "Global capability center / IT services"),
                    ("saas_product", "SaaS / product company"), ("public_sector", "Public sector"),
                    ("other", "Other")]
INTEREST_OPTIONS = [("", "Select…"), ("assess", "AEGIS Assess"), ("register", "AEGIS Register"),
                    ("control", "AEGIS Control"), ("shield", "AEGIS Shield (runtime guardrails)"),
                    ("assurance", "AEGIS Assurance"), ("agent", "AEGIS Agent"), ("not_sure", "Not sure yet")]


def _f(name, label, type_="text", required=False, autocomplete=None, options=None, hint=None, rows=None):
    return {"name": name, "label": label, "type": type_, "required": required,
            "autocomplete": autocomplete, "options": options, "hint": hint, "rows": rows}


NAME = _f("name", "Full name", required=True, autocomplete="name")
WORK_EMAIL = _f("email", "Work email", "email", True, "email", hint="Please use your business email address.")
EMAIL = _f("email", "Email", "email", True, "email")
COMPANY = _f("company", "Organization", required=True, autocomplete="organization")
COMPANY_OPT = _f("company", "Organization", autocomplete="organization")
ROLE = _f("role", "Job title", autocomplete="organization-title")
AI_SYSTEMS = _f("ai_systems", "Approximate number of AI systems in use", "select", options=AI_SYSTEMS_OPTIONS)
INDUSTRY = _f("industry", "Industry", "select", options=INDUSTRY_OPTIONS)

FORMS: dict[str, dict] = {
    "baseline": {
        "api_form": "baseline", "business_email": True, "submit": "Request a Governance Baseline",
        "fields": [NAME, WORK_EMAIL, COMPANY, ROLE, INDUSTRY, AI_SYSTEMS,
                   _f("message", "What would you like the Baseline to focus on?", "textarea", rows=5,
                      hint="Optional. Do not include personal or confidential data about individuals.")],
        "consent": "I agree that AEGIS may contact me about this request.",
        "success": "Thank you. Your request has been received. A member of the AEGIS team will contact you to schedule a scoping call.",
    },
    "demo": {
        "api_form": "demo", "business_email": True, "submit": "Request a demo",
        "fields": [NAME, WORK_EMAIL, COMPANY, ROLE,
                   _f("tool", "Main area of interest", "select", options=INTEREST_OPTIONS),
                   _f("message", "What would you like to see?", "textarea", rows=5,
                      hint="Optional. Do not include personal or confidential data about individuals.")],
        "consent": "I agree that AEGIS may contact me about this request.",
        "success": "Thank you. Your demo request has been received and we will be in touch to arrange a time.",
    },
    "contact": {
        "api_form": "contact", "business_email": False, "submit": "Send message",
        "fields": [NAME, EMAIL, COMPANY_OPT,
                   _f("message", "Message", "textarea", True, rows=6,
                      hint="Do not include personal or confidential data about individuals.")],
        "consent": "I agree that AEGIS may use these details to respond to my message.",
        "success": "Thank you. Your message has been received.",
    },
    "newsletter": {
        "api_form": "newsletter", "business_email": False, "submit": "Subscribe",
        "fields": [EMAIL],
        "consent": "Send me the AEGIS governance briefing. I can unsubscribe at any time.",
        "success": "Thank you. Your subscription request has been recorded.",
    },
    "blueprint": {
        "api_form": "blueprint", "business_email": True, "submit": "Get the blueprint",
        "fields": [NAME, WORK_EMAIL, COMPANY, ROLE],
        "consent": "I agree that AEGIS may send me the blueprint and related governance content.",
        "success": "Thank you. Your download is ready.",
    },
    "design_partner": {
        "api_form": "design_partner", "business_email": True, "submit": "Apply to the design partner programme",
        "fields": [NAME, WORK_EMAIL, COMPANY, ROLE, INDUSTRY, AI_SYSTEMS,
                   _f("message", "What would you like to pilot?", "textarea", rows=5,
                      hint="Optional. Do not include personal or confidential data about individuals.")],
        "consent": "I agree that AEGIS may contact me about the design partner programme.",
        "success": "Thank you. Your application has been received and we will contact you to discuss fit and scope.",
    },
    "waitlist": {
        "api_form": "waitlist", "business_email": True, "submit": "Join the waitlist",
        "fields": [NAME, WORK_EMAIL, COMPANY, ROLE,
                   _f("message", "What would you use it for?", "textarea", rows=4,
                      hint="Optional. Do not include personal or confidential data about individuals.")],
        "consent": "I agree that AEGIS may contact me when this tool becomes available.",
        "success": "Thank you. You are on the waitlist and we will contact you when the tool is available.",
    },
}
