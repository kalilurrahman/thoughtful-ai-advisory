"""Deterministic keyword extraction of use-case intake fields from free text.

Every extracted value is a *candidate* (evidence status: Inferred) that the user
is asked to confirm or correct. Extraction is intentionally conservative: when
signals conflict or are absent the field is left missing and the agent asks.
"""
from __future__ import annotations

import re

from .question_bank import intake_field, intake_fields

# (pattern, value) — first match wins, so order from most to least specific.
_DOMAIN = [
    (r"\b(credit|loan|lending|underwrit|creditworth)", "credit"),
    (r"\b(hiring|recruit|cv|resume|candidate|employment|hr screening|promotion|performance review)", "employment"),
    (r"\b(patient|clinical|diagnos|medical|health|triage nurse|hospital)", "healthcare"),
    (r"\b(biometric|face recognition|facial|fingerprint|voiceprint)", "biometric"),
    (r"\b(student|exam|school|admission|education|grading)", "education"),
    (r"\b(power grid|water supply|critical infrastructure|energy grid|traffic control)", "critical_infrastructure"),
    (r"\b(police|law enforcement|crime predict|policing)", "law_enforcement"),
    (r"\b(visa|asylum|immigration|border control|migration)", "migration"),
    (r"\b(court|judicial|sentencing|justice)", "justice"),
    (r"\b(insurance pricing|benefit eligibility|social benefit|emergency dispatch|essential service)", "essential_services"),
    (r"\b(customer[- ]support|customer[- ]service|support agent|helpdesk|help desk|contact cent|call cent|support ticket|customer queries|customer enquir|customer inquir)", "customer_service"),
    (r"\b(internal productivity|summari[sz]e (meeting|document)|coding assistant|code assistant|knowledge assistant|internal (search|assistant|copilot|chatbot|chat bot|bot|tool)|employee productivity)", "internal_productivity"),
]
_DATA = [
    (r"\b(health data|medical record|diagnos|biometric|ethnic|religio|sexual orientation|trade union|genetic|special[- ]category)", "special_category"),
    (r"\b(crm|cvs?|resumes?|candidate data|applicant data|customer data|customer record|personal data|pii|personally identifiable|email address|phone number|names? and address|customer profile|account details|order history|employee data|patient)", "personal"),
    (r"\b(confidential|financial statement|trade secret|source code|contracts?|pricing data|m&a)", "confidential"),
    (r"\b(internal (docs|documents|wiki|knowledge base)|intranet|internal data)", "internal"),
    (r"\b(public (data|website|information)|publicly available|open data)", "public"),
]
_AFFECTED = [
    (r"\b(children|minors|patients|elderly|vulnerable|students)\b", "vulnerable"),
    (r"\b(citizens|general public|members of the public|public[- ]facing|applicants?|candidates?|job seekers?)\b", "public"),
    (r"\b(customers?|clients?|consumers?|policyholders?|account holders?|end users?)\b", "customers"),
    (r"\b(employees|staff|internal users|agents? on our team|colleagues|internal (chatbot|assistant|copilot|tool))\b", "internal"),
]
_TOOLS = {
    "crm": r"\b(crm|salesforce|hubspot|dynamics)\b",
    "email": r"\b(e-?mails?|outlook|gmail)\b",
    "ticketing": r"\b(ticket|zendesk|servicenow|jira|freshdesk)",
    "payments": r"\b(refund|payment|payout|stripe|billing|charge)",
    "knowledge_base": r"\b(knowledge base|kb articles?|faq|help cent|confluence|sharepoint)\b",
    "database": r"\b(database|sql|data warehouse)\b",
    "web_search": r"\b(web search|browse the web|internet search)\b",
    "calendar": r"\b(calendar|schedul)",
    "messaging": r"\b(slack|teams|sms|whatsapp|chat messages?)\b",
    "code_execution": r"\b(execute code|run code|code interpreter|shell)\b",
    "code_repository": r"\b(repo|repos|repository|repositories|github|gitlab|bitbucket|pull requests?|commits?)\b",
    "hr_system": r"\b(ats|applicant tracking|hris|workday)\b",
    "file_storage": r"\b(file storage|google drive|onedrive|s3 bucket|documents? store)\b",
}
_ACTION_VERBS = r"\b(issues?|issuing|process(es|ing)?|sends?|sending|updates?|updating|creates?|creating|clos(e|es|ing)|delet(e|es|ing)|refunds?|cancel(s|ling)?|books?|transfers?|pays?|posts?|modif(y|ies)|writes? back|write access|write permissions?|merges?|push(es)?|deploys?|executes?|escalates?|reassigns?)\b"
_GENAI = r"\b(llm|gpt|genai|gen ai|generative|chatbot|chat bot|copilot|claude|gemini|llama|mistral|large language model|rag|retrieval[- ]augmented|prompt|ai agent|agentic|assistant)\b"
_VENDOR = r"\b(openai|azure openai|anthropic|claude|gemini|google vertex|bedrock|vendor|third[- ]party|saas|cohere|mistral api|hosted model|api model|gpt-?\d)"
_EU = r"\b(eu|european union|europe|gdpr|germany|france|spain|italy|netherlands|ireland|belgium|poland|sweden|austria|denmark|finland|portugal)\b"
_ENV = [
    (r"\b(in production|production|live|go[- ]live|deployed)\b", "production"),
    (r"\b(pilot|proof of concept|poc|trial)\b", "pilot"),
    (r"\b(in development|building|prototype|developing)\b", "development"),
    (r"\b(idea|exploring|considering|planning to)\b", "idea"),
]


def _first(patterns, text):
    for rx, val in patterns:
        if re.search(rx, text):
            return val
    return None


def extract_profile(text: str) -> dict:
    """Return candidate intake fields found in free text (missing fields are omitted)."""
    t = (text or "").lower()
    out: dict = {}
    if not t.strip():
        return out

    name = re.search(r"\b(?:called|named|name is|codename)\s+[\"“']?([A-Z][\w-]*(?:\s+[A-Z0-9][\w-]*){0,4})", text or "")
    if name:
        out["name"] = name.group(1).strip()

    # purpose: first sentence of the description, trimmed
    first = re.split(r"(?<=[.!?])\s+", (text or "").strip())[0]
    if len(first.split()) >= 4:
        out["purpose"] = first[:300]

    dom = _first(_DOMAIN, t)
    if dom:
        out["domain_category"] = dom
    data = _first(_DATA, t)
    if data:
        out["data_sensitivity"] = data
    aff = _first(_AFFECTED, t)
    if aff:
        out["affected_parties"] = aff

    tools = [k for k, rx in _TOOLS.items() if re.search(rx, t)]
    if tools:
        out["tools"] = tools

    genai = bool(re.search(_GENAI, t))
    if genai:
        out["genai"] = True
    if re.search(_VENDOR, t):
        out["vendor_model"] = True
    if re.search(r"\b(in[- ]house model|self[- ]hosted|our own model|trained internally)\b", t) and "vendor_model" not in out:
        out["vendor_model"] = False
    if re.search(_EU, t):
        out["eu_exposure"] = True
    elif re.search(r"\b(us only|united states only|india only|no eu|not in the eu|uk only)\b", t):
        out["eu_exposure"] = False

    acts = bool(re.search(_ACTION_VERBS, t)) and bool(tools or re.search(r"\bagent\b", t))
    approval = bool(re.search(r"\b(with (human )?approval|human[- ]approv|approved by|requires? approval|after review|human in the loop|hitl|supervisor approv)", t))
    suggests = bool(re.search(r"\b(drafts?|suggests?|recommends?|proposes?|summari[sz]es?|answers? questions)\b", t))
    autonomous = bool(re.search(r"\b(autonomous(ly)?|without (human )?(review|approval)|automatically|on its own|fully automated)\b", t))
    if acts:
        out["external_actions"] = True
        out["autonomy"] = "acts_autonomously" if autonomous and not approval else ("acts_with_approval" if approval else "acts_autonomously" if autonomous else None)
        if out["autonomy"] is None:
            del out["autonomy"]  # acts, but approval model unclear -> ask
    elif suggests:
        out["autonomy"] = "suggests"
    if re.search(r"\b(read[- ]only|cannot take actions|no actions|only reads)\b", t):
        out["external_actions"] = False

    if re.search(r"\b(automated decision|automatically (approve|reject|deny|decide)|decides whether|approves or rejects|denies)\b", t):
        out["decision_impact"] = "automated_decision"
    elif re.search(r"\b(eligibility|pricing decision|credit limit|hire|hiring decision|reject|material decision|screen(s|ing)?|shortlist(s|ing)?|rank(s|ing)? (candidates|applicants)|scor(e|es|ing) (candidates|applicants|customers))\b", t):
        out["decision_impact"] = "material"
    elif re.search(r"\b(advis|recommend|suggest|assist|draft)", t):
        out["decision_impact"] = "advisory"

    env = _first(_ENV, t)
    if env:
        out["environment"] = env
    return out


_BOOL_TRUE = re.compile(r"^\s*(y|yes|yeah|yep|true|correct|it does|it can|we do|affirmative)\b", re.IGNORECASE)
_BOOL_FALSE = re.compile(r"^\s*(n|no|nope|false|it does not|it doesn't|it can't|it cannot|we don't|we do not|negative)\b", re.IGNORECASE)


def parse_field_value(field_id: str, text: str):
    """Parse a reply for a specific intake field. Returns None if it cannot be parsed."""
    f = intake_field(field_id)
    if not f or text is None:
        return None
    raw = text.strip()
    if not raw:
        return None
    if f["type"] == "boolean":
        if _BOOL_TRUE.search(raw):
            return True
        if _BOOL_FALSE.search(raw):
            return False
        return None
    if f["type"] == "select":
        opts = [str(o) for o in f["options"]]
        norm = re.sub(r"[\s-]+", "_", raw.lower()).strip("_ .")
        if norm in [o.lower() for o in opts]:
            return next(o for o in opts if o.lower() == norm)
        for o in opts:  # option mentioned inside a sentence
            if re.search(rf"(?<![a-z_]){re.escape(o.lower())}(?![a-z_])", re.sub(r"[\s-]+", "_", raw.lower())):
                return o
        # fall back to keyword extraction for this field
        cand = extract_profile(raw).get(field_id)
        return cand if cand in opts else None
    if f["type"] == "list":
        if re.match(r"^\s*(none|no tools|nothing)\s*$", raw, re.IGNORECASE):
            return []
        cand = extract_profile(raw).get("tools")
        if cand:
            return cand
        return [p.strip().lower().replace(" ", "_") for p in re.split(r"[,;/]| and ", raw) if p.strip()][:12]
    # text
    return raw[:300]


_KV_RE = re.compile(r"\b([a-z_]{3,30})\s*[:=]\s*([^;\n]+)")


def parse_field_assignments(text: str) -> dict:
    """Parse explicit corrections such as 'data_sensitivity: confidential; autonomy = suggests'."""
    out = {}
    known = {f["id"] for f in intake_fields()}
    for m in _KV_RE.finditer(text or ""):
        key = m.group(1).lower()
        if key in known:
            val = parse_field_value(key, m.group(2).strip())
            if val is not None:
                out[key] = val
    return out
