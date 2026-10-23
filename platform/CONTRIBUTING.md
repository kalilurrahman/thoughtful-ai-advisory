# VERITRAIL Repository Conventions & Interface Contracts

This file is the shared contract between every VERITRAIL workstream. Read it before writing code or content.

## 1. Layout

```
content/controls/controls.yaml                     # 64 VERITRAIL controls — the ONLY valid control IDs (AO/EI/GL/IS/SE-NN)
content/assessment_templates/maturity_self_assessment.yaml  # 24-question self-assessment + data-driven scoring rules
content/assessment_templates/use_case_assessment.yaml       # use-case deep-dive question bank (agent workstream)
content/policy_packs/*.yaml        # runtime policy packs (shield workstream)
content/industry_packs/*.yaml      # industry packs (docs/GTM workstream)
content/website_pages/*.md         # website pages with YAML front matter (web-content workstream)
app/common/veritrail_common/           # shared: content loaders, audit log, evidence labels, redaction
app/assessment-engine/veritrail_assessment/  # maturity scoring + use-case risk tiering
app/reports/veritrail_reports/         # Markdown/PDF/CSV/JSON report rendering
app/policy-engine/veritrail_policy/    # policy-as-code schema, validator, evaluator
app/runtime-shield/veritrail_shield/   # Runtime Shield Advisor + policy generator
app/agent/veritrail_agent/             # VERITRAIL Agent: orchestrator + 14 tools
app/api/veritrail_api/                 # stdlib HTTP API + static site server
app/admin/veritrail_admin/             # admin CLI: audit verification, approvals queue, leads
app/website/                       # static site generator, templates, JS, dist/ (build output)
tests/{unit,integration,agent-evaluation,policy-engine,security}
docs/                              # design docs
output/sample_reports/             # generated sample deliverables (clearly labelled synthetic)
var/                               # runtime data (git-ignored): audit logs, leads, outbox, approvals
```

Hyphenated `app/*` directories each contain an importable package. Run tests from the repo root
(`python3 -m pytest`) — `conftest.py` puts every `app/*` dir on `sys.path`. For scripts use
`PYTHONPATH=$(ls -d app/*/ | tr '\n' ':')`.

Allowed Python dependencies: stdlib, PyYAML, Markdown, Jinja2, reportlab, pytest. No others without a DECISION_LOG entry.
Frontend: vanilla JS/CSS, no build toolchain, no third-party CDNs, no cookies, no trackers.

## 2. Governance rules every component must follow

1. **Citations.** Every material recommendation cites at least one VERITRAIL control ID from `controls.yaml`
   and, where relevant, an assessment question ID (e.g. `SEC-Q2`), policy ID+version, uploaded evidence ID,
   or framework mapping taken from the control's `mappings`. Never invent control IDs or framework clauses.
   If nothing supports a statement, output exactly: `No supporting evidence or framework source is available.`
2. **Evidence labels.** Use `veritrail_common.evidence.EvidenceStatus`: Verified, User-asserted, Inferred,
   Missing evidence, Critical gap. Self-reported answers are *User-asserted*. Only evidence reviewed by a
   named human is *Verified*.
3. **No compliance claims.** Never state that an organization/system is compliant, certified, or
   regulator-approved. Use "readiness", "alignment indicators", "evidence". Check generated text with
   `veritrail_common.evidence.find_prohibited_claims()`. Include `STANDARD_DISCLAIMER` on reports and compliance pages.
4. **Human approval** required for: changing a risk tier, approving an exception, changing production runtime
   policy, exporting sensitive evidence, sending external communications. These create a pending approval;
   they never self-execute.
5. **Redaction first.** Mask sensitive data with `veritrail_common.redaction.redact()` before any external LLM call
   or log write.
6. **Audit.** Material actions are appended to the hash-chained `veritrail_common.audit.AuditLog` with a trace ID.
7. **Least privilege.** Every agent tool declares its permission level; write tools create drafts.

## 3. Shared interface contracts

### veritrail_assessment (owner: orchestrator)
```python
from veritrail_assessment.engine import score_assessment, preliminary_result
score_assessment(answers: dict[str,int], profile: dict, template: dict|None=None) -> dict
#  keys: template_id, template_version, evidence_status ("User-asserted"), overall_score (float 1dp),
#  maturity_level, level_interpretation, domains[{id,name,weight,score,answers{qid:int}}],
#  strengths[{question_id,domain_id,domain,text,score,controls}], gaps[{...,action}],
#  critical_flags[{id,title,severity,rationale,controls,question_id}],
#  action_plan{"30"|"60"|"90": [{question_id,domain,action,controls,score}]},
#  recommended_controls[{id,title,pillar,priority,mappings}], readiness[{framework,groups[{id,name,value,band,questions}]}],
#  recommended_modules[{module,reason}], lead{tags[],labels[]}, disclaimer, cta
preliminary_result(answers, profile) -> {overall_score, maturity_level, level_interpretation, domains[{id,name,score}]}

from veritrail_assessment.risk_tier import calculate_risk_tier, INTAKE_FIELDS
calculate_risk_tier(profile: dict) -> dict
#  profile keys (all optional; missing ones are reported): name, purpose, decision_impact
#  (none|advisory|material|automated_decision), affected_parties (internal|customers|public|vulnerable),
#  data_sensitivity (public|internal|confidential|personal|special_category), autonomy
#  (none|suggests|acts_with_approval|acts_autonomously), tools (list[str]), external_actions (bool),
#  domain_category (e.g. credit, employment, healthcare, biometric, education, critical_infrastructure,
#  law_enforcement, migration, justice, essential_services, customer_service, internal_productivity, other),
#  users_count_band, eu_exposure (bool), vendor_model (bool), genai (bool), environment
#  returns {tier: "Prohibited-review"|"High"|"Medium"|"Low", score, factors[{factor,value,points,citation}],
#  triggers[], missing_fields[], required_modules[], approval_authority, review_cadence_months,
#  evidence_status: "Inferred", requires_human_confirmation: True, rationale (str), citations[]}
```

### veritrail_reports (owner: orchestrator)
```python
from veritrail_reports.pdf import markdown_to_pdf      # markdown_to_pdf(md:str, out_path, title:str|None=None) -> Path
from veritrail_reports.exporters import write_csv, write_json, write_markdown
from veritrail_reports.maturity import render_maturity_markdown   # (result:dict, lead:dict|None=None) -> str
```
`markdown_to_pdf` supports headings, paragraphs, **bold**, bullet/numbered lists, pipe tables, fenced code and `---`.

### veritrail_shield / veritrail_policy (owner: shield workstream)
```python
from veritrail_shield.advisor import advise                  # advise(profile: dict) -> dict (risk_profile, tool_matrix,
                                                         #   data_handling, approval_rules, limits, monitoring, incident_response,
                                                         #   rollout, citations, policy)
from veritrail_shield.generator import generate_policy, to_yaml, to_json
from veritrail_policy.schema import validate_policy          # -> list[str] errors
from veritrail_policy.engine import PolicyEngine             # evaluate(request) -> Decision
```

### veritrail_agent (owner: agent workstream)
```python
from veritrail_agent.orchestrator import VeritrailAgent          # VeritrailAgent(data_dir).handle(message, session_id, user) -> dict
#  response keys include: session_id, trace_id, intent, state, answer, message (Markdown), citations[], sources[],
#  evidence[], missing_evidence[], next_actions[], pending_approvals[], clarifying_question, cta, tool_calls[], llm{}
#  (full list: docs/AGENT_DESIGN.md §1). Extra public methods:
#  .call_tool(name, user, session_id=None, **kw)  .resolve_approval(approval_id, decision, approver, note="")
#  .list_approvals(status=None)  .review_evidence(evidence_ref, reviewer, accepted=True, note="")
#  user = {"id", "role": anonymous|viewer|assessor|approver|admin, "name"}; public website pins role=viewer
from veritrail_agent.tools import TOOL_REGISTRY              # name -> ToolSpec(permission, requires_approval, fn)
```

### HTTP API (owner: orchestrator; base path `/api`, JSON in/out)
| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | liveness |
| POST | /api/assessment/preliminary | `{answers, profile}` → preliminary result (no PII) |
| POST | /api/leads | `{email, name, company, role, consent:true, answers, profile, source}` → `{lead_id, result, report_markdown, report_pdf_url, report_md_url}`; rejects free-mail domains (422) |
| GET | /api/reports/{lead_id}.pdf / .md | gated report download (token query param `t`) |
| POST | /api/contact | `{form: baseline|demo|contact|newsletter, email, name, company, message, consent}` |
| POST | /api/agent/message | `{session_id?, message}` → agent response |
| POST | /api/shield/advise | `{profile}` → advisor output incl. policy YAML+JSON |
| POST | /api/risk-tier | `{profile}` → calculate_risk_tier output |
| POST | /api/events | privacy-friendly analytics event `{name, path, props}` (no cookies, no IP stored) |

## 4. Website page front matter (content/website_pages/*.md)
```yaml
---
title: "VERITRAIL Shield — Runtime guardrails for LLM apps and agents"   # <title>
h1: "Protect LLM apps and agents at runtime"                         # optional, defaults to title
slug: /solutions/shield/          # leading+trailing slash; "/" for home
description: "120–160 char meta description"
section: home|framework|solutions|compliance|industries|tools|resources|contact|legal|company
nav_label: "VERITRAIL Shield"         # label in menus
nav_order: 40
template: page|home|tool|form     # tool => interactive widget; form => lead form
tool: maturity-assessment|guardrail-generator|ask-veritrail|risk-triage|waitlist   # when template: tool
form: baseline|demo|contact|newsletter|blueprint|design_partner                # when template: form
schema_type: WebPage|Service|Article|FAQPage|CollectionPage|ContactPage
primary_cta: assessment|baseline|agent|blueprint|demo|guardrails
secondary_cta: assessment|baseline|agent|blueprint|demo|guardrails
faq: [{q: "...", a: "..."}]       # optional → FAQPage JSON-LD
lead: "..."                      # optional sub-heading (home hero)
nav_exclude: true                 # optional: omit from menus (e.g. blog articles)
noindex: true                     # optional: robots noindex + excluded from sitemap
updated: 2026-10-21
---
```
Body is Markdown (tables, fenced code allowed). Shortcode `{{cta:<key>}}` renders a CTA block;
`{{disclaimer}}` renders the standard compliance disclaimer; `{{controls:IS-11,IS-13}}` renders a control
citation list from controls.yaml.

## 5. Writing style
Enterprise, precise, evidence-first, no hype. Never "compliant", "certified", "guaranteed", "regulator-approved"
about VERITRAIL customers. Use "readiness", "alignment", "evidence". UK/US spelling: US.
Regulatory dates/status: state that applicability timelines must be verified against the current Official
Journal text and any amendments (e.g. the Commission's 2025 "Digital Omnibus" proposals) — this repo has not
verified post-2025 changes.
