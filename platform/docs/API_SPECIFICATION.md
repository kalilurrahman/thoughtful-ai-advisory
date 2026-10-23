# VERITRAIL API Specification

Version 1.0.0 (MVP) · Base path `/api` · JSON over HTTPS · Implementation: `app/api/veritrail_api/server.py`

The API serves the public website (self-assessment, forms, interactive tools) and the VERITRAIL Agent demo.
Administrative operations (approvals, lead export, audit verification) are **not exposed over HTTP**. They
run through the admin CLI (`app/admin`) to keep the public attack surface minimal.

## 1. Conventions

| Topic | Rule |
|---|---|
| Content type | `application/json` (`text/plain` accepted for `sendBeacon` analytics) — anything else returns 415 |
| Body limit | 256 KiB → 413 |
| Errors | `{"error": "human message", "field"?: "...", "code"?: "..."}` with 400/403/404/405/413/415/422/429/500/503 |
| Rate limit | Fixed window per client per endpoint group, default 60 req/min (`VERITRAIL_RATE_LIMIT`). The client key is a salted in-memory hash; IPs are never stored |
| Caching | API responses `Cache-Control: no-store`; reports `private, no-store` |
| Security headers | CSP `default-src 'self'` (no inline script), `X-Frame-Options: DENY`, `nosniff`, strict referrer, restrictive Permissions-Policy, COOP |
| Audit | Material actions are appended to the hash-chained `var/audit/api_audit.jsonl` (lead IDs and email **domains**, never full emails or answers) |
| Evidence labels | Self-assessment results are `User-asserted`. Risk tiers and advisor outputs are `Inferred` |

## 2. Endpoints

### GET /api/health
`200 {"status":"ok","service":"veritrail-api","time":"…"}`

### POST /api/assessment/preliminary
Instant, anonymous preliminary score. No PII.
```json
{"answers": {"STR-Q1": 3, "...": 4}, "profile": {"industry": "bfsi", "uses_agents": true}}
```
`200` → `{template_id, template_version, evidence_status, overall_score, maturity_level, level_interpretation, domains:[{id,name,weight,score}]}`
`422` if any of the 24 answers is missing, unknown, or not an integer 1–5.

### POST /api/leads — gated detailed report
```json
{"email":"cro@examplebank.com","name":"Dana","company":"Example Bank","role":"CRO",
 "consent":true,"marketing_opt_in":false,"answers":{…24…},"profile":{…},"source":"maturity-assessment",
 "website":""}
```
Validation: business email (free-mail and disposable domains rejected → `422 code=business_email_required`), `consent` must be boolean `true`, `name` and `company` required, `website` is a honeypot and must be empty.

Effects:
1. Scores with the reference engine.
2. Renders the Markdown report and PDF into `var/reports/`.
3. Appends the lead to `var/leads/leads.jsonl`.
4. Upserts to the CRM adapter, including internal qualification tags.
5. Sends the **pre-approved** `maturity_report_delivery` email with PDF and MD attachments.
6. Writes an audit record.

`201` →
```json
{"lead_id":"lead_…","result":{…full result without internal `lead` tags…},
 "report_markdown":"# AI Governance Maturity Report …",
 "report_pdf_url":"/api/reports/lead_….pdf?t=…","report_md_url":"/api/reports/lead_….md?t=…",
 "email_status":"sent|failed|pending_approval"}
```

### GET /api/reports/{lead_id}.pdf | .md?t={token}
`t` is an HMAC-SHA256 token bound to the lead ID (secret `VERITRAIL_SECRET` or `var/secret.key`). Wrong or missing token → 403. Downloads are audit-logged.

### POST /api/contact
```json
{"form":"baseline|demo|contact|newsletter|blueprint|waitlist|design_partner","email":"…","name":"…",
 "company":"…","role":"…","message":"…","ai_systems":"25-99","industry":"bfsi","tool":"…","consent":true,"website":""}
```
Business email is required for `baseline`, `demo`, `blueprint` and `design_partner`. Name is required except for `newsletter` and `waitlist`. An acknowledgement email (pre-approved template) goes out for baseline, demo, contact and design_partner.
`201 {"id":"form_…","status":"received","download_url"?: "/downloads/VERITRAIL_Enterprise_Blueprint.pdf"}`

### POST /api/events — cookieless analytics
`{"name":"cta_click","path":"/solutions/shield/","props":{"cta":"baseline"}}` → `204`.
Allowed names: `page_view, cta_click, assessment_start, assessment_step, assessment_preliminary, assessment_gate_view, assessment_lead_submitted, assessment_report_download, form_submit, tool_use, outbound_click`.
Query strings are stripped from `path`. Props are limited to 10 scalar values, and keys containing "email" are dropped. Timestamp, name, path and props are stored. IP and user agent are not.

### POST /api/risk-tier
`{"profile": {purpose, decision_impact, affected_parties, data_sensitivity, autonomy, domain_category, tools, external_actions, eu_exposure, vendor_model, genai, environment}}`
→ `calculate_risk_tier` output: `tier` (`Low|Medium|High|Prohibited-review`), `score`, `factors[]` (each with a control citation), `triggers[]`, `missing_fields[]`, `clarifying_questions[]`, `required_modules[]`, `approval_authority`, `review_cadence_months`, `evidence_status:"Inferred"`, `requires_human_confirmation:true`, `rationale`, `citations[]`.

### POST /api/shield/advise
`{"profile": {…Runtime Shield inputs…}}` → `veritrail_shield.advisor.advise()` output (risk profile, tool permission matrix, data handling, approval rules, limits, monitoring, incident response, rollout plan, citations, `policy`) plus `policy_yaml` and `policy_json`. The generated policy is always `status: draft` and needs human approval before activation. See RUNTIME_SHIELD_DESIGN.md.

### POST /api/agent/message
`{"session_id":"sess_…(optional, [A-Za-z0-9_-]{1,64})","message":"What controls apply to a support agent?"}` → VERITRAIL Agent response (answer, sources/citations, evidence labels, missing evidence, next actions, required approvals, `session_id`, `trace_id`). The public website runs as the least-privilege identity `{"id":"public-demo","role":"viewer"}`. Write tools are therefore unavailable there, and high-impact actions return a pending-approval or refusal. See AGENT_DESIGN.md.

## 3. Integrations (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `VERITRAIL_VAR_DIR` | `./var` | Runtime data (leads, reports, audit, outbox, approvals, analytics) |
| `VERITRAIL_PUBLIC_BASE_URL` | "" | Absolute URL prefix for report links in emails |
| `VERITRAIL_SECRET` | auto (`var/secret.key`) | HMAC secret for report tokens |
| `VERITRAIL_RATE_LIMIT` | 60 | Requests per minute per client per endpoint group |
| `VERITRAIL_CRM_BACKEND` | `jsonl` | `jsonl` \| `webhook` \| `hubspot` |
| `VERITRAIL_CRM_WEBHOOK_URL` | — | Webhook target (Zapier/Make/n8n/CRM inbound) |
| `VERITRAIL_HUBSPOT_PORTAL_ID`, `VERITRAIL_HUBSPOT_FORM_GUID` | — | HubSpot Forms API submission |
| `VERITRAIL_MAIL_BACKEND` | `outbox` | `outbox` (writes .eml to `var/outbox`) \| `smtp` |
| `VERITRAIL_SMTP_HOST/PORT/USER/PASSWORD` | — | SMTP (STARTTLS) |
| `VERITRAIL_MAIL_FROM` | `VERITRAIL <reports@veritrail-governance.example>` | Sender |

CRM failures never block lead capture. The failure is recorded in the audit log so it can be replayed from `var/leads/leads.jsonl`.

## 4. Email governance
Templates live in `content/email_templates.yaml`. The API sends only templates with `status: approved` and a complete `approval` record (approver, date, reference). Any other template is queued in `var/approvals/` as an `external_communication` approval. A human resolves it with `veritrail-admin approvals resolve`. The admin CLI enforces approver role and separation of duties. (DEC-0007)

## 5. Admin CLI (not HTTP)
```
python3 -m veritrail_admin.cli audit verify
python3 -m veritrail_admin.cli leads list [--tag shield_candidate] | leads export --out leads.csv
python3 -m veritrail_admin.cli approvals list [--status pending]
python3 -m veritrail_admin.cli approvals resolve <id> --decision approve|reject --approver "Name" --role approver
python3 -m veritrail_admin.cli analytics funnel
python3 -m veritrail_admin.cli forms list
```

## 6. Python service contracts
See CONTRIBUTING.md §3 for `veritrail_assessment`, `veritrail_reports`, `veritrail_shield`, `veritrail_policy` and `veritrail_agent` call signatures used by the API.

## 7. Versioning
Breaking changes bump the major version and move to `/api/v2`. Responses include `template_version` and policy `version` so stored reports stay reproducible.
