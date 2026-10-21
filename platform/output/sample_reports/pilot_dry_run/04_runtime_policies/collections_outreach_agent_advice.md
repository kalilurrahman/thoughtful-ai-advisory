# AEGIS Runtime Shield Advisor — Collections outreach agent

> **Synthetic example.** Fictional organization and system, generated to illustrate AEGIS output.

> AI proposes. AEGIS evaluates. Approved actions execute.

**Status:** Draft advisory output — evidence status **Inferred**. Requires review by the accountable owner and security before any use.

## Summary

Collections outreach agent: overall runtime risk Critical (Inferred). Tool matrix: 0 allowed, 1 conditional, 0 approval-gated, 2 denied (default-deny for anything undeclared). A draft policy (pol-collections-outreach-agent v0.1.0) starts in observe mode and requires recorded human approval before any promotion. 7 input(s) missing; conservative defaults were used.

| Field | Value |
|---|---|
| Purpose | Draft and send payment-reminder messages |
| Model | — |
| Vendor | Third-party model provider (to be confirmed) |
| Environment | production |
| Autonomy | acts_autonomously |
| Human-approval model | unknown |
| Data sensitivity | personal |
| Affected parties | customers |
| Risk tier (user-asserted) | High |
| Risk tier (inferred) | High |

## 1. Agent risk profile

| Dimension | Rating | Rationale |
|---|---|---|
| Autonomy | Critical | autonomy 'acts_autonomously'; acts autonomously with irreversible or external actions available |
| Blast radius | High | affected parties: customers; state-changing tools in production |
| Data exposure | Critical | highest data sensitivity 'personal'; autonomous egress paths (external send / export) for sensitive data; prompts containing sensitive data may reach an external model vendor (Third-party model provider (to be confirmed)) |
| Tool risk | High | highest-impact operation: external_send |
| **Overall** | **Critical** | Overall runtime risk Critical (composite 3.65 on a 1–4 scale; 70% mean, 30% maximum of autonomy Critical, tool risk High, data exposure Critical, blast radius High). Floor rules triggered: at least one dimension is Critical (minimum High); user-asserted risk tier is High (minimum High). |

Citations: EI-02, IS-01, IS-11. Evidence status: Inferred.

## 2. Tool permission matrix

Default-deny: any tool not listed below is denied.

| Tool | Operation | Decision | Engine action | Approvers | Reasons | Controls |
|---|---|---|---|---|---|---|
| `crm_read` | read (Inferred) | **conditional** | ALLOW | — | read access to personal data: restrict to tenant- and record-scoped queries | IS-11, EI-07 |
| `send_sms` | external_send (Inferred) | **denied** | DENY | — | external communication in a high-risk context with no confirmed approval path | IS-11, IS-13, IS-04, EI-07 |
| `send_email` | external_send (Inferred) | **denied** | DENY | — | external communication in a high-risk context with no confirmed approval path | IS-11, IS-13, IS-04, EI-07 |

## 3. Data handling and redaction

- Redacted entities: email, phone, payment_card, iban, us_ssn, uk_nino, india_pan, india_aadhaar, ip_address, api_key
- Surfaces: prompt, response, tool_params, tool_output
- Prompt / response logging level: redacted / redacted
- Evidence retention (proposed): 730 days

- **dh.redact_before_llm** — Redact sensitive entities from prompts and retrieved context before any call to the external model (Third-party model provider (to be confirmed)). (IS-04)
- **dh.response_leakage** — Scan model responses for sensitive entities before display or onward transmission; redact matches. (IS-04, IS-14)
- **dh.tool_params** — Scan tool parameters for sensitive entities; only per-tool exemptions listed below may pass unmasked to the tool. (IS-04, IS-11)
- **dh.indirect_injection** — Treat tool outputs and retrieved documents as untrusted: scan for prompt-injection signals before they enter the model context. (IS-12, IS-14)
- **dh.logging** — Log prompts and responses at 'redacted' level only; raw content is never written to the decision log, which is hash-chained and tamper-evident. (SE-08, IS-04)
- **dh.retention** — Retain decision logs and approval records for 730 days (proposed default — confirm against the obligations register). (SE-02, AO-07)
- **dh.minimisation** — Send only the fields required for the task to the model; document lawful basis, retention and cross-border transfer in the privacy assessment. (IS-03)
- **dh.vendor_terms** — Confirm Third-party model provider (to be confirmed) contract terms on data use, retention, training opt-out and incident notice before production traffic. (GL-11, AO-09)

*Detector limitations:* Built-in detectors are deterministic heuristics for structured identifiers (e-mail, card, IBAN, national IDs, phone, IP, API keys). They do not detect names, postal addresses, free-text health details or paraphrased/non-English injections; layer a dedicated DLP/PII service and a trained injection classifier for production.

## 4. Human-approval rules

| Rule | Trigger | Approver roles | Binding | Controls |
|---|---|---|---|---|
| approval.policy_change | Any change to the production runtime policy, including promotion between rollout modes | AI System Owner, Security Lead, Risk & Compliance Lead | Approval recorded on the specific policy version (draft → in_review → approved → active) | GL-04, IS-12 |
| approval.risk_tier_change | Changing the system's risk tier | AI Governance Lead | Recorded in the AI inventory | EI-02, GL-03 |
| approval.exception | Any exception to this policy (e.g. temporarily allowing a denied tool) | AI Governance Lead, Security Lead | Exception has an accountable approver, expiry and compensating controls | GL-10 |
| approval.kill_switch_release | Releasing an engaged kill switch or leaving contain mode | Security Operations Lead, AI System Owner | Root cause recorded; release logged in the decision log | IS-15, SE-04 |
| approval.sensitive_export | Exporting decision logs or evidence containing sensitive data | Data Owner | Export request and recipient recorded | SE-02, IS-04 |

## 5. Rate and budget limits

| Limit | Value |
|---|---|
| Requests per minute (per identity) | 15 |
| Tool calls per session | 10 |
| Tokens per day (tenant+agent) | 250,000 |
| Cost per month (USD) | 2,000 |
| Action on breach | RATE_LIMIT (alert at 80%) |

Contain runaway loops, abuse and denial-of-wallet. Calibrate from observe-mode telemetry before enforcement; limits are per tenant+agent (rate also per identity). Source: AEGIS starting points for a Critical runtime-risk profile (Inferred). Controls: IS-16.

## 6. Monitoring plan

| Metric | Description | Controls |
|---|---|---|
| decision_distribution | Count of ALLOW/DENY/REDACT/TRANSFORM/REQUIRE_HUMAN_APPROVAL/ESCALATE/RATE_LIMIT per policy version and mode (effective and would-be) | IS-12, SE-03 |
| would_be_block_rate | Share of requests whose would-be decision blocks while in observe/warn/protect — the main promotion signal | IS-12 |
| false_positive_rate | Reviewer-sampled false positives among blocks (target < 2%) | GL-08 |
| redaction_events_by_entity | Redactions per entity type and surface | IS-04 |
| injection_jailbreak_detections | Detections by surface (prompt, tool output) and signal type, including obfuscation flags | IS-14 |
| default_deny_hits | Calls to undeclared tools (registry drift or misuse) | IS-11, EI-07 |
| approval_queue | Pending approvals, approval latency, rejection rate, expiries | IS-13 |
| limit_utilisation | Rate, tool-call, token and cost utilisation vs limits; breaches | IS-16 |
| kill_switch_time_to_disable | Measured in drills and incidents (target ≤ 5 minutes) | IS-15 |
| audit_chain_integrity | Result of scheduled AuditLog.verify() runs | SE-08 |

| Alert | Condition | Severity | Route |
|---|---|---|---|
| injection_spike | prompt-injection detections > 3x trailing baseline for an agent/tenant | High | Security Operations |
| pii_in_response | any REDACT on the response surface for special-category or payment data | High | Privacy / Data Protection |
| default_deny_surge | > 10 undeclared-tool calls per hour | Medium | Platform Engineering |
| approval_backlog | pending approvals older than the approval timeout | Medium | Business Owner |
| budget_threshold | token or cost utilisation ≥ 80% of limit | Low | FinOps / Platform |
| audit_chain_broken | AuditLog.verify() fails | Critical | Security Operations |
| kill_switch_engaged | any kill-switch engagement or contain mode | High | Incident commander |

Review cadence: decision log review: weekly review of DENY/ESCALATE/approval decisions; policy review: monthly; kill switch drill: quarterly; adversarial retest: after every material change and quarterly.

## 7. Incident response and kill switch

- Scopes: agent, tool, model, tenant; authorized roles: Security Operations Lead, AI System Owner, SRE On-call
- Target time-to-disable: 5 minutes. Kill switch overrides every other rule and every rollout mode, including observe.
1. Engage the narrowest effective scope first (tool → agent → tenant → model); escalate scope if impact continues
2. For a full stop, deploy an approved policy version in 'contain' mode or set kill_switch.engaged
3. Confirm in the decision log that in-scope requests now return DENY with matched rule 'kill_switch'
4. Notify the incident commander and business owner; open an incident record

| Playbook | Trigger | Actions | Controls |
|---|---|---|---|
| ir.prompt_injection | Injection detected in a prompt or tool output that reached a tool call | Kill-switch the affected tool; Preserve decision-log records by trace ID; Identify the injected source (document, e-mail, web page) and quarantine it; Re-run adversarial tests before release | IS-14, IS-15, SE-04 |
| ir.data_leakage | Sensitive data observed in a response, outbound message or log | Contain the agent or tenant; Assess scope from redacted logs and finding counts; Engage Privacy/Legal for notification assessment; Add detector or policy fix; re-test | IS-04, SE-04 |
| ir.tool_misuse | Unauthorized or anomalous tool call (default-deny spike, scope violation, parameter violations) | Kill-switch the tool; Revoke and rotate the agent's credentials; Review the tool permission matrix and registry | IS-11, EI-07, IS-15 |
| ir.runaway_cost | Rate/budget limit breaches or loop behaviour | Confirm RATE_LIMIT decisions are effective; Contain the session/agent; Fix the loop; recalibrate limits through a new policy version | IS-16 |
| ir.vendor_incident | Model vendor outage, unannounced model change or vendor security incident | Kill-switch the model scope or fail over to an approved alternative; Re-validate behaviour before re-enabling; Record vendor notice under contract terms | IS-15, GL-11, SE-04 |

## 8. Rollout plan

Each promotion is a new policy version that goes draft → in_review → approved → active with recorded human approval. AEGIS never promotes or activates a policy on its own.

### Stage 1: observe

Evaluate every request and log the would-be decision; nothing is blocked or modified.

Entry criteria:

- Policy reviewed; deployment of observe mode approved by the AI System Owner
- Decision log writing to the hash-chained audit log
- Shadow mode evaluating as 'enforce'

Exit criteria:

- At least 10,000 representative requests evaluated
- Would-be decision distribution reviewed by the system owner and security
- Sampled would-be blocks reviewed; false-positive rate < 2%
- Every legitimate tool seen in traffic has an explicit rule (no legitimate default-deny hits)
- Limits calibrated from observed peaks

Controls: IS-12, GL-07

### Stage 2: warn

Still allow, but surface warnings to the application/operators when the would-be decision is not ALLOW.

Entry criteria:

- Observe exit criteria met
- New policy version approved for warn mode

Exit criteria:

- Warnings triaged by application owners; no unresolved false-positive patterns
- Human-approval workflow tested end-to-end (request → approve/reject → single-use execution)
- Alert routing confirmed with on-call teams

Controls: IS-12, IS-13

### Stage 3: protect

Apply REDACT and TRANSFORM to payloads; blocking decisions are still logged but not enforced.

Entry criteria:

- Warn exit criteria met
- New policy version approved for protect mode

Exit criteria:

- No raw sensitive data in sampled logs, prompts to the vendor, or responses
- Task quality impact of redaction reviewed and accepted by the business owner
- Adversarial (prompt-injection / leakage) test results reviewed

Controls: IS-04, IS-14

### Stage 4: enforce

Full decisions: DENY, REQUIRE_HUMAN_APPROVAL, ESCALATE and RATE_LIMIT block execution.

Entry criteria:

- Protect exit criteria met
- Kill-switch drill passed (contain test below)
- New policy version approved for enforce mode by all required approver roles

Exit criteria:

- Steady state: false-positive rate and approval latency within agreed targets
- Monitoring alerts and review cadence operating
- Periodic policy review scheduled

Controls: IS-12, IS-13, IS-16

### Stage 5: contain

Incident state, not a promotion target: kill switch active for the whole policy scope; every in-scope request is denied. Rehearse it before enforcement and use it during incidents.

Entry criteria:

- Drill: scheduled test window approved
- Incident: authorized role engages the kill switch

Exit criteria:

- Drill: measured time-to-disable ≤ 5 minutes and full DENY confirmed in the decision log
- Incident: root cause identified, fix approved as a new policy version, release approved by the kill-switch release approvers

Controls: IS-15, SE-04

## 9. Missing inputs and clarifying questions

- **User groups / business functions served** (Missing evidence): Recommendations use conservative defaults until provided.
- **Model (name/version)** (Missing evidence): Recommendations use conservative defaults until provided.
- **Data categories processed** (Missing evidence): Recommendations use conservative defaults until provided.
- **Human-approval model (none|per_action|high_impact_only|threshold|batch_review or description)** (Missing evidence): Recommendations use conservative defaults until provided.
- **Regulatory obligations (e.g. GDPR, EU AI Act, HIPAA, PCI DSS, SOX)** (Missing evidence): Recommendations use conservative defaults until provided.
- **Customer/contractual obligations (e.g. zero data retention, residency, SLAs)** (Missing evidence): Recommendations use conservative defaults until provided.
- **Existing security controls (e.g. SSO, DLP, SIEM, secrets manager, red-team testing)** (Missing evidence): Recommendations use conservative defaults until provided.

1. Which user groups and business functions use or are affected by it? (EI-04, IS-08)
2. Which model and version will run in production, and how are model changes controlled? (EI-05, GL-04)
3. Which data categories are processed (e.g. customer contact data, payment data, health data)? (IS-03, EI-06)
4. Who approves high-impact actions today, through which workflow, and within what time? (IS-13, IS-09)
5. Which regulatory obligations apply (e.g. GDPR, EU AI Act, sector rules)? (AO-07)
6. Which customer or contractual commitments apply (data residency, retention, notice)? (AO-07)
7. Which security controls already exist (SSO, DLP, SIEM, secrets manager, red-team testing)? (IS-12, SE-08)
8. Confirm the operation type for 'crm_read' (AEGIS inferred 'read' from its name). (EI-07)
9. Confirm the operation type for 'send_sms' (AEGIS inferred 'external_send' from its name). (EI-07)
10. Confirm the operation type for 'send_email' (AEGIS inferred 'external_send' from its name). (EI-07)

## 10. Evidence labels

| Item | Status | Controls |
|---|---|---|
| Application name: Collections outreach agent | User-asserted | EI-04 |
| Intended purpose: Draft and send payment-reminder messages | User-asserted | EI-04 |
| Vendor: Third-party model provider (to be confirmed) | User-asserted | EI-04 |
| Autonomy level: acts_autonomously | User-asserted | EI-04 |
| Environment: production | User-asserted | EI-04 |
| Risk tier: High | User-asserted | EI-02 |
| Data sensitivity: personal | User-asserted | EI-04 |
| Affected parties: customers | User-asserted | EI-04 |
| Tool 'crm_read' performs 'read' | Inferred | EI-07 |
| Tool 'send_sms' performs 'external_send' | Inferred | EI-07 |
| Tool 'send_email' performs 'external_send' | Inferred | EI-07 |
| Not provided: User groups / business functions served | Missing evidence | EI-04, IS-08 |
| Not provided: Model (name/version) | Missing evidence | EI-05, GL-04 |
| Not provided: Data categories processed | Missing evidence | IS-03, EI-06 |
| Not provided: Human-approval model (none\|per_action\|high_impact_only\|threshold\|batch_review or description) | Missing evidence | IS-13, IS-09 |
| Not provided: Regulatory obligations (e.g. GDPR, EU AI Act, HIPAA, PCI DSS, SOX) | Missing evidence | AO-07 |
| Not provided: Customer/contractual obligations (e.g. zero data retention, residency, SLAs) | Missing evidence | AO-07 |
| Not provided: Existing security controls (e.g. SSO, DLP, SIEM, secrets manager, red-team testing) | Missing evidence | IS-12, SE-08 |
| Prompt-injection / data-leakage test results | Missing evidence | IS-14 |
| Kill-switch test record with measured time-to-disable | Missing evidence | IS-15 |
| Approval records with approver identity for high-impact actions | Missing evidence | IS-13 |
| Risk profile, tool matrix, limits, monitoring, rollout plan and draft policy | Inferred | IS-12 |

Nothing in this output is labelled Verified: no evidence has been reviewed by a named human reviewer.

## 11. Draft runtime policy

- Policy: `pol-collections-outreach-agent` v0.1.0 — status **draft**, rollout mode **observe**
- Not activated. The policy is a draft in observe mode; activation requires review and recorded approval by: AI System Owner, Security Lead, Risk & Compliance Lead.
- Schema validation: passed; reviewer warnings: 1
  - rule tool.crm-read: undeclared parameters are accepted

```yaml
# AEGIS runtime policy pol-collections-outreach-agent v0.1.0 (status: draft)
# Draft policies require review and recorded human approval before activation.
schema_version: aegis.policy/v1
policy_id: pol-collections-outreach-agent
policy_name: Collections outreach agent — Runtime Policy
description: 'Draft runtime policy generated by AEGIS for Collections outreach agent (Draft and send payment-reminder
  messages). Overall runtime risk: Critical (Inferred). Review before rollout.'
version: 0.1.0
status: draft
owner: AI System Owner
applies_to:
  agent_name:
  - collections-outreach-agent
  environment:
  - production
  risk_tier:
  - High
  tenant:
  - '*'
  model:
  - '*'
rollout:
  mode: observe
  exit_criteria:
  - At least 10,000 representative requests evaluated
  - Would-be decision distribution reviewed by the system owner and security
  - Sampled would-be blocks reviewed; false-positive rate < 2%
  - Every legitimate tool seen in traffic has an explicit rule (no legitimate default-deny hits)
  - Limits calibrated from observed peaks
  notes: Each promotion is a new policy version that goes draft → in_review → approved → active with recorded human
    approval. AEGIS never promotes or activates a policy on its own.
identity:
  required: true
  required_claims:
  - sub
  - tenant_id
  - roles
  allowed_roles: []
  tenant_binding: true
tools:
  default_action: DENY
  deny_list:
  - send_sms
  - send_email
  rules:
  - id: tool.crm-read
    tool: crm_read
    operation: read
    action: ALLOW
    description: 'read access to personal data: restrict to tenant- and record-scoped queries'
    scopes:
    - crm-read:read
    parameters: {}
    additional_parameters: true
    citations:
    - IS-11
    - EI-07
content:
  max_input_chars: 16000
  pii_redaction:
    enabled: true
    entities:
    - email
    - phone
    - payment_card
    - iban
    - us_ssn
    - uk_nino
    - india_pan
    - india_aadhaar
    - ip_address
    - api_key
    apply_to:
    - prompt
    - response
    - tool_params
    - tool_output
    action: REDACT
  prompt_injection:
    enabled: true
    apply_to:
    - prompt
    - tool_output
    - tool_params
    action: DENY
    decode_obfuscation: true
  jailbreak:
    enabled: true
    apply_to:
    - prompt
    action: DENY
    decode_obfuscation: true
  transforms:
  - id: transform.truncate_response
    type: truncate
    apply_to:
    - response
    max_chars: 16000
  - id: transform.ai_disclosure
    type: append_disclosure
    apply_to:
    - response
    text: This response was generated with AI assistance.
limits:
  requests_per_minute: 15
  tool_calls_per_session: 10
  tokens_per_day: 250000
  cost_per_month_usd: 2000
  action_on_breach: RATE_LIMIT
  alert_at_percent: 80
logging:
  immutable_audit: true
  prompt_logging: redacted
  response_logging: redacted
  tool_param_logging: redacted
  sink: aegis_common.audit.AuditLog (hash-chained JSONL); ship to WORM storage in production
kill_switch:
  enabled: true
  engaged: false
  scopes:
  - agent
  - tool
  - model
  - tenant
  engaged_targets: []
  authorized_roles:
  - Security Operations Lead
  - AI System Owner
  - SRE On-call
  target_time_to_disable_minutes: 5
rollback:
  previous_version: null
  strategy: disable
  triggers:
  - Injection detected in a prompt or tool output that reached a tool call
  - Sensitive data observed in a response, outbound message or log
  - Unauthorized or anomalous tool call (default-deny spike, scope violation, parameter violations)
  - Rate/budget limit breaches or loop behaviour
  - Model vendor outage, unannounced model change or vendor security incident
shadow_mode:
  enabled: true
  evaluate_as: enforce
evidence_retention_days: 730
approval:
  required_approver_roles:
  - AI System Owner
  - Security Lead
  - Risk & Compliance Lead
  min_approvers: 3
  separation_of_duties: true
  approved_by: []
  approved_at: null
escalation:
  queue: ai-security-review
  contact_role: Security Operations Lead
change_history:
- version: 0.1.0
  date: '2026-10-21'
  author: AEGIS Runtime Shield Advisor (automated draft)
  change_type: created
  summary: Initial draft generated from the Runtime Shield Advisor profile; requires human review.
citations:
- EI-07
- GL-04
- IS-04
- IS-08
- IS-11
- IS-12
- IS-14
- IS-15
- IS-16
- SE-08
metadata:
  generated_by: aegis_shield.generator
  advisor_version: 1.0.0
  evidence_status: Inferred
  overall_risk: Critical
  requires_human_approval: true
  synthetic: false
  denied_tools:
  - tool: send_sms
    reasons:
    - external communication in a high-risk context with no confirmed approval path
  - tool: send_email
    reasons:
    - external communication in a high-risk context with no confirmed approval path
  notice: 'Draft generated by AEGIS. AEGIS does not activate policies: promotion beyond draft/observe requires review
    and recorded human approval. Detection is heuristic.'
```

## Citations

- AEGIS Control AO-06: Escalation paths and decision rights (Control Library v1.0.0)
- AEGIS Control AO-07: Regulatory and contractual obligations register (Control Library v1.0.0)
- AEGIS Control AO-09: Third-party AI accountability (Control Library v1.0.0)
- AEGIS Control EI-02: AI risk classification and tiering (Control Library v1.0.0)
- AEGIS Control EI-04: Intended purpose and context of use (Control Library v1.0.0)
- AEGIS Control EI-05: Model, prompt and component registry (Control Library v1.0.0)
- AEGIS Control EI-06: Data source and lineage registry (Control Library v1.0.0)
- AEGIS Control EI-07: Agent and tool registry (Control Library v1.0.0)
- AEGIS Control GL-03: Risk-tiered approval gates (Control Library v1.0.0)
- AEGIS Control GL-04: Change management and reassessment triggers (Control Library v1.0.0)
- AEGIS Control GL-07: Deployment conditions and go-live readiness (Control Library v1.0.0)
- AEGIS Control GL-08: Post-deployment monitoring (Control Library v1.0.0)
- AEGIS Control GL-10: Exceptions and risk acceptance (Control Library v1.0.0)
- AEGIS Control GL-11: Vendor AI due diligence and contract controls (Control Library v1.0.0)
- AEGIS Control IS-01: AI threat modelling (Control Library v1.0.0)
- AEGIS Control IS-03: Privacy assessment and data minimisation (Control Library v1.0.0)
- AEGIS Control IS-04: Sensitive data redaction and masking (Control Library v1.0.0)
- AEGIS Control IS-08: Transparency and AI disclosures (Control Library v1.0.0)
- AEGIS Control IS-09: Human oversight design (Control Library v1.0.0)
- AEGIS Control IS-11: Least-privilege tool access (Control Library v1.0.0)
- AEGIS Control IS-12: Runtime guardrails and policy enforcement (Control Library v1.0.0)
- AEGIS Control IS-13: Human approval for high-impact actions (Control Library v1.0.0)
- AEGIS Control IS-14: Prompt-injection and data-leakage testing (Control Library v1.0.0)
- AEGIS Control IS-15: Kill switch and rollback (Control Library v1.0.0)
- AEGIS Control IS-16: Rate, budget and resource limits (Control Library v1.0.0)
- AEGIS Control SE-02: Evidence repository and retention (Control Library v1.0.0)
- AEGIS Control SE-03: Governance metrics and leadership reporting (Control Library v1.0.0)
- AEGIS Control SE-04: AI incident management and reporting (Control Library v1.0.0)
- AEGIS Control SE-08: Immutable action logging (Control Library v1.0.0)
- AEGIS Control SE-12: Model performance and drift monitoring (Control Library v1.0.0)

---

*AEGIS supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.* Runtime detection is heuristic and does not guarantee that every unsafe input or output is caught.
