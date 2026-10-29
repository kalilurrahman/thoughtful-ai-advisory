# VERITRAIL Runtime Shield Advisor — Northwind Support Assistant

> **Synthetic example.** Fictional organization and system, generated to illustrate VERITRAIL output.

> AI proposes. VERITRAIL evaluates. Approved actions execute.

**Status:** Draft advisory output — evidence status **Inferred**. Requires review by the accountable owner and security before any use.

## Summary

Northwind Support Assistant: overall runtime risk High (Inferred). Tool matrix: 1 allowed, 4 conditional, 1 approval-gated, 0 denied (default-deny for anything undeclared). A draft policy (pol-northwind-support-agent v0.1.0) starts in observe mode and requires recorded human approval before any promotion.

| Field | Value |
|---|---|
| Purpose | Answer customer order and delivery questions, update tickets, and issue small goodwill refunds |
| Model | gpt-4o-2024-08-06 |
| Vendor | Azure OpenAI |
| Environment | production |
| Autonomy | acts_with_approval |
| Human-approval model | threshold |
| Data sensitivity | personal |
| Affected parties | customers |
| Risk tier (user-asserted) | Limited |
| Risk tier (inferred) | High-risk |

## 1. Agent risk profile

| Dimension | Rating | Rationale |
|---|---|---|
| Autonomy | Medium | autonomy 'acts_with_approval' |
| Blast radius | High | affected parties: customers; state-changing tools in production |
| Data exposure | High | highest data sensitivity 'personal'; prompts containing sensitive data may reach an external model vendor (Azure OpenAI) |
| Tool risk | Critical | highest-impact operation: delete |
| **Overall** | **High** | Overall runtime risk High (composite 3.3 on a 1–4 scale; 70% mean, 30% maximum of autonomy Medium, tool risk Critical, data exposure High, blast radius High). Floor rules triggered: at least one dimension is Critical (minimum High). The user-asserted tier (Limited) is lower than the inferred tier (High-risk); a risk-tier change requires human approval and is not made by VERITRAIL. |

Citations: EI-02, IS-01, IS-11. Evidence status: Inferred.

## 2. Tool permission matrix

Default-deny: any tool not listed below is denied.

| Tool | Operation | Decision | Engine action | Approvers | Reasons | Controls |
|---|---|---|---|---|---|---|
| `crm.lookup_order` | read (User-asserted) | **conditional** | ALLOW | — | read access to personal data: restrict to tenant- and record-scoped queries | IS-11, EI-07 |
| `kb.search` | read (User-asserted) | **allowed** | ALLOW | — | read-only access to low-sensitivity data | IS-11, EI-07 |
| `tickets.update` | write (User-asserted) | **conditional** | ALLOW | — | state-changing action: allowed only within validated parameters and scoped credentials | IS-11, IS-12, EI-07 |
| `payments.issue_refund` | payment (User-asserted) | **conditional** | ALLOW | Support Team Lead | payments up to 50 within validated limits; above that, human approval Approval if: amount gt 50. | IS-11, IS-13, IS-16, EI-07 |
| `email.send_customer_reply` | external_send (User-asserted) | **conditional** | ALLOW | — | external send restricted to bound recipients / allow-listed domains | IS-11, IS-13, IS-04, EI-07 |
| `crm.delete_customer` | delete (User-asserted) | **approval** | REQUIRE_HUMAN_APPROVAL | Data Protection Officer | irreversible deletion requires designated human approval of the exact action | IS-11, IS-13, IS-15, EI-07 |

## 3. Data handling and redaction

- Redacted entities: email, phone, payment_card, iban, us_ssn, uk_nino, india_pan, india_aadhaar, ip_address, api_key
- Surfaces: prompt, response, tool_params, tool_output
- Prompt / response logging level: redacted / redacted
- Evidence retention (proposed): 730 days
- Exemption: `email.send_customer_reply` may receive email unmasked — needed to perform the action; still masked in logs

- **dh.redact_before_llm** — Redact sensitive entities from prompts and retrieved context before any call to the external model (Azure OpenAI). (IS-04)
- **dh.response_leakage** — Scan model responses for sensitive entities before display or onward transmission; redact matches. (IS-04, IS-14)
- **dh.tool_params** — Scan tool parameters for sensitive entities; only per-tool exemptions listed below may pass unmasked to the tool. (IS-04, IS-11)
- **dh.indirect_injection** — Treat tool outputs and retrieved documents as untrusted: scan for prompt-injection signals before they enter the model context. (IS-12, IS-14)
- **dh.logging** — Log prompts and responses at 'redacted' level only; raw content is never written to the decision log, which is hash-chained and tamper-evident. (SE-08, IS-04)
- **dh.retention** — Retain decision logs and approval records for 730 days (proposed default — confirm against the obligations register). (SE-02, AO-07)
- **dh.minimisation** — Send only the fields required for the task to the model; document lawful basis, retention and cross-border transfer in the privacy assessment. (IS-03)
- **dh.vendor_terms** — Confirm Azure OpenAI contract terms on data use, retention, training opt-out and incident notice before production traffic. (GL-11, AO-09)
- **dh.egress** — Outbound sends and exports carry only data required by the bound case; bulk egress requires approval and row caps. (IS-04, IS-13)

*Detector limitations:* Built-in detectors are deterministic heuristics for structured identifiers (e-mail, card, IBAN, national IDs, phone, IP, API keys). They do not detect names, postal addresses, free-text health details or paraphrased/non-English injections; layer a dedicated DLP/PII service and a trained injection classifier for production.

## 4. Human-approval rules

| Rule | Trigger | Approver roles | Binding | Controls |
|---|---|---|---|---|
| approval.payments-issue-refund.amount_gt | 'payments.issue_refund' when amount gt 50 | Support Team Lead | Approval binds to the exact tool, parameters, requester and session; single use | IS-13 |
| approval.crm-delete-customer | Every call to 'crm.delete_customer' (delete) | Data Protection Officer | Approval binds to the exact tool, parameters, requester and session; single use; expires if unused | IS-13, IS-09 |
| approval.policy_change | Any change to the production runtime policy, including promotion between rollout modes | AI System Owner, Security Lead, Risk & Compliance Lead | Approval recorded on the specific policy version (draft → in_review → approved → active) | GL-04, IS-12 |
| approval.risk_tier_change | Changing the system's risk tier | AI Governance Lead | Recorded in the AI inventory | EI-02, GL-03 |
| approval.exception | Any exception to this policy (e.g. temporarily allowing a denied tool) | AI Governance Lead, Security Lead | Exception has an accountable approver, expiry and compensating controls | GL-10 |
| approval.kill_switch_release | Releasing an engaged kill switch or leaving contain mode | Security Operations Lead, AI System Owner | Root cause recorded; release logged in the decision log | IS-15, SE-04 |
| approval.sensitive_export | Exporting decision logs or evidence containing sensitive data | Data Owner | Export request and recipient recorded | SE-02, IS-04 |

## 5. Rate and budget limits

| Limit | Value |
|---|---|
| Requests per minute (per identity) | 30 |
| Tool calls per session | 20 |
| Tokens per day (tenant+agent) | 500,000 |
| Cost per month (USD) | 3,000 |
| Action on breach | RATE_LIMIT (alert at 80%) |

Contain runaway loops, abuse and denial-of-wallet. Calibrate from observe-mode telemetry before enforcement; limits are per tenant+agent (rate also per identity). Source: VERITRAIL starting points for a High runtime-risk profile (Inferred). Controls: IS-16.

## 6. Monitoring plan

| Metric | Description | Controls |
|---|---|---|
| decision_distribution | Count of ALLOW/DENY/REDACT/TRANSFORM/REQUIRE_HUMAN_APPROVAL/ESCALATE/RATE_LIMIT per policy version and mode (effective and would-be) | IS-12, SE-03 |
| would_be_block_rate | Share of requests whose would-be decision blocks while in observe/warn/protect — the main promotion signal | IS-12 |
| false_positive_rate | Reviewer-sampled false positives among blocks (target < 3%) | GL-08 |
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

Each promotion is a new policy version that goes draft → in_review → approved → active with recorded human approval. VERITRAIL never promotes or activates a policy on its own.

### Stage 1: observe

Evaluate every request and log the would-be decision; nothing is blocked or modified.

Entry criteria:

- Policy reviewed; deployment of observe mode approved by the AI System Owner
- Decision log writing to the hash-chained audit log
- Shadow mode evaluating as 'enforce'

Exit criteria:

- At least 5,000 representative requests evaluated
- Would-be decision distribution reviewed by the system owner and security
- Sampled would-be blocks reviewed; false-positive rate < 3%
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

No clarifying questions.

## 10. Evidence labels

| Item | Status | Controls |
|---|---|---|
| Application name: Northwind Support Assistant | User-asserted | EI-04 |
| Intended purpose: Answer customer order and delivery questions, update tickets, and issue small goodwill refunds | User-asserted | EI-04 |
| Model: gpt-4o-2024-08-06 | User-asserted | EI-04 |
| Vendor: Azure OpenAI | User-asserted | EI-04 |
| Autonomy level: acts_with_approval | User-asserted | EI-04 |
| Human-approval model: threshold | User-asserted | EI-04 |
| Environment: production | User-asserted | EI-04 |
| Risk tier: Limited | User-asserted | EI-02 |
| Data sensitivity: personal | User-asserted | EI-04 |
| Affected parties: customers | User-asserted | EI-04 |
| Tool 'crm.lookup_order' performs 'read' | User-asserted | EI-07 |
| Tool 'kb.search' performs 'read' | User-asserted | EI-07 |
| Tool 'tickets.update' performs 'write' | User-asserted | EI-07 |
| Tool 'payments.issue_refund' performs 'payment' | User-asserted | EI-07 |
| Tool 'email.send_customer_reply' performs 'external_send' | User-asserted | EI-07 |
| Tool 'crm.delete_customer' performs 'delete' | User-asserted | EI-07 |
| Existing control: Okta SSO with MFA | User-asserted | IS-11 |
| Existing control: Okta SSO with MFA | User-asserted | IS-11 |
| Existing control: Splunk SIEM | User-asserted | SE-08, GL-08 |
| Existing control: Secrets manager (Vault) | User-asserted | IS-11 |
| Existing control: Zero data retention agreement with model vendor | User-asserted | GL-11 |
| Prompt-injection / data-leakage test results | Missing evidence | IS-14 |
| Kill-switch test record with measured time-to-disable | Missing evidence | IS-15 |
| Approval records with approver identity for high-impact actions | Missing evidence | IS-13 |
| Asserted risk tier Limited is lower than inferred High-risk | Inferred | EI-02 |
| Risk profile, tool matrix, limits, monitoring, rollout plan and draft policy | Inferred | IS-12 |

Nothing in this output is labelled Verified: no evidence has been reviewed by a named human reviewer.

## 11. Draft runtime policy

- Policy: `pol-northwind-support-agent` v0.1.0 — status **draft**, rollout mode **observe**
- Not activated. The policy is a draft in observe mode; activation requires review and recorded approval by: AI System Owner, Security Lead, Risk & Compliance Lead.
- Schema validation: passed; reviewer warnings: 1
  - rule tool.email-send-customer-reply: high-impact 'external_send' allowed without approval conditions — confirm parameter constraints are sufficient (IS-13)

```yaml
# VERITRAIL runtime policy pol-northwind-support-agent v0.1.0 (status: draft)
# Draft policies require review and recorded human approval before activation.
schema_version: veritrail.policy/v1
policy_id: pol-northwind-support-agent
policy_name: Northwind Support Assistant — Runtime Policy
description: 'Draft runtime policy generated by VERITRAIL for Northwind Support Assistant (Answer customer
  order and delivery questions, update tickets, and issue small goodwill refunds). Overall runtime risk: High
  (Inferred). Review before rollout.'
version: 0.1.0
status: draft
owner: Head of Customer Service
applies_to:
  agent_name:
  - northwind-support-agent
  environment:
  - production
  risk_tier:
  - Limited
  tenant:
  - northwind
  model:
  - gpt-4o-2024-08-06
rollout:
  mode: observe
  exit_criteria:
  - At least 5,000 representative requests evaluated
  - Would-be decision distribution reviewed by the system owner and security
  - Sampled would-be blocks reviewed; false-positive rate < 3%
  - Every legitimate tool seen in traffic has an explicit rule (no legitimate default-deny hits)
  - Limits calibrated from observed peaks
  notes: Each promotion is a new policy version that goes draft → in_review → approved → active with recorded
    human approval. VERITRAIL never promotes or activates a policy on its own.
identity:
  required: true
  required_claims:
  - sub
  - tenant_id
  - roles
  allowed_roles:
  - support_agent
  - customer
  tenant_binding: true
tools:
  default_action: DENY
  deny_list: []
  rules:
  - id: tool.crm-lookup-order
    tool: crm.lookup_order
    operation: read
    action: ALLOW
    description: 'read access to personal data: restrict to tenant- and record-scoped queries'
    scopes:
    - crm-lookup-order:read
    parameters:
      order_id:
        type: string
        regex: ^ORD-[0-9]{6,10}$
        required: true
    additional_parameters: false
    citations:
    - IS-11
    - EI-07
  - id: tool.kb-search
    tool: kb.search
    operation: read
    action: ALLOW
    description: read-only access to low-sensitivity data
    scopes:
    - kb-search:read
    parameters:
      query:
        type: string
        max_length: 500
        required: true
    additional_parameters: false
    citations:
    - IS-11
    - EI-07
  - id: tool.tickets-update
    tool: tickets.update
    operation: write
    action: ALLOW
    description: 'state-changing action: allowed only within validated parameters and scoped credentials'
    scopes:
    - tickets-update:write
    parameters:
      ticket_id:
        type: string
        regex: ^TCK-[0-9]{6,10}$
        required: true
      status:
        type: string
        enum:
        - open
        - pending_customer
        - resolved
      note:
        type: string
        max_length: 4000
    additional_parameters: false
    citations:
    - IS-11
    - IS-12
    - EI-07
    max_calls_per_session: 20
  - id: tool.payments-issue-refund
    tool: payments.issue_refund
    operation: payment
    action: ALLOW
    description: payments up to 50 within validated limits; above that, human approval
    scopes:
    - payments-issue-refund:payment
    parameters:
      order_id:
        type: string
        regex: ^ORD-[0-9]{6,10}$
        required: true
      amount:
        type: number
        min: 0.01
        required: true
        max: 500
      currency:
        type: string
        enum:
        - USD
        - EUR
        - GBP
        required: true
      reason_code:
        type: string
        enum:
        - late_delivery
        - damaged_item
        - goodwill
        required: true
    additional_parameters: false
    citations:
    - IS-11
    - IS-13
    - IS-16
    - EI-07
    require_approval_if:
    - param: amount
      op: gt
      value: 50
      reason: amount above auto-approval threshold 50
    approval_roles:
    - Support Team Lead
    max_calls_per_session: 5
  - id: tool.email-send-customer-reply
    tool: email.send_customer_reply
    operation: external_send
    action: ALLOW
    description: external send restricted to bound recipients / allow-listed domains
    scopes:
    - email-send-customer-reply:external_send
    parameters:
      ticket_id:
        type: string
        regex: ^TCK-[0-9]{6,10}$
        required: true
      reply_via:
        type: string
        required: true
        domain_allow_list:
        - mail.northwind.example
      body:
        type: string
        max_length: 6000
        required: true
    additional_parameters: false
    citations:
    - IS-11
    - IS-13
    - IS-04
    - EI-07
    max_calls_per_session: 10
    allow_pii_entities:
    - email
  - id: tool.crm-delete-customer
    tool: crm.delete_customer
    operation: delete
    action: REQUIRE_HUMAN_APPROVAL
    description: irreversible deletion requires designated human approval of the exact action
    scopes:
    - crm-delete-customer:delete
    parameters:
      customer_id:
        type: string
        regex: ^CUS-[0-9]{6,10}$
        required: true
      erasure_request_id:
        type: string
        regex: ^DSR-[0-9]{6}$
        required: true
    additional_parameters: false
    citations:
    - IS-11
    - IS-13
    - IS-15
    - EI-07
    approval_roles:
    - Data Protection Officer
    max_calls_per_session: 3
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
  - id: transform.strip_unapproved_urls
    type: strip_unapproved_urls
    apply_to:
    - response
    domain_allow_list:
    - northwind.example
    - help.northwind.example
limits:
  requests_per_minute: 30
  tool_calls_per_session: 20
  tokens_per_day: 500000
  cost_per_month_usd: 3000
  action_on_breach: RATE_LIMIT
  alert_at_percent: 80
logging:
  immutable_audit: true
  prompt_logging: redacted
  response_logging: redacted
  tool_param_logging: redacted
  sink: veritrail_common.audit.AuditLog (hash-chained JSONL); ship to WORM storage in production
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
  author: VERITRAIL Runtime Shield Advisor (automated draft)
  change_type: created
  summary: Initial draft generated from the Runtime Shield Advisor profile; requires human review.
citations:
- EI-07
- GL-04
- IS-04
- IS-08
- IS-11
- IS-12
- IS-13
- IS-14
- IS-15
- IS-16
- SE-08
metadata:
  generated_by: veritrail_shield.generator
  advisor_version: 1.0.0
  evidence_status: Inferred
  overall_risk: High
  requires_human_approval: true
  synthetic: true
  denied_tools: []
  notice: 'Draft generated by VERITRAIL. VERITRAIL does not activate policies: promotion beyond draft/observe
    requires review and recorded human approval. Detection is heuristic.'
```

## Citations

- VERITRAIL Control AO-06: Escalation paths and decision rights (Control Library v1.0.0)
- VERITRAIL Control AO-07: Regulatory and contractual obligations register (Control Library v1.0.0)
- VERITRAIL Control AO-09: Third-party AI accountability (Control Library v1.0.0)
- VERITRAIL Control EI-02: AI risk classification and tiering (Control Library v1.0.0)
- VERITRAIL Control EI-04: Intended purpose and context of use (Control Library v1.0.0)
- VERITRAIL Control EI-07: Agent and tool registry (Control Library v1.0.0)
- VERITRAIL Control GL-03: Risk-tiered approval gates (Control Library v1.0.0)
- VERITRAIL Control GL-04: Change management and reassessment triggers (Control Library v1.0.0)
- VERITRAIL Control GL-07: Deployment conditions and go-live readiness (Control Library v1.0.0)
- VERITRAIL Control GL-08: Post-deployment monitoring (Control Library v1.0.0)
- VERITRAIL Control GL-10: Exceptions and risk acceptance (Control Library v1.0.0)
- VERITRAIL Control GL-11: Vendor AI due diligence and contract controls (Control Library v1.0.0)
- VERITRAIL Control IS-01: AI threat modelling (Control Library v1.0.0)
- VERITRAIL Control IS-03: Privacy assessment and data minimisation (Control Library v1.0.0)
- VERITRAIL Control IS-04: Sensitive data redaction and masking (Control Library v1.0.0)
- VERITRAIL Control IS-08: Transparency and AI disclosures (Control Library v1.0.0)
- VERITRAIL Control IS-09: Human oversight design (Control Library v1.0.0)
- VERITRAIL Control IS-11: Least-privilege tool access (Control Library v1.0.0)
- VERITRAIL Control IS-12: Runtime guardrails and policy enforcement (Control Library v1.0.0)
- VERITRAIL Control IS-13: Human approval for high-impact actions (Control Library v1.0.0)
- VERITRAIL Control IS-14: Prompt-injection and data-leakage testing (Control Library v1.0.0)
- VERITRAIL Control IS-15: Kill switch and rollback (Control Library v1.0.0)
- VERITRAIL Control IS-16: Rate, budget and resource limits (Control Library v1.0.0)
- VERITRAIL Control SE-02: Evidence repository and retention (Control Library v1.0.0)
- VERITRAIL Control SE-03: Governance metrics and leadership reporting (Control Library v1.0.0)
- VERITRAIL Control SE-04: AI incident management and reporting (Control Library v1.0.0)
- VERITRAIL Control SE-08: Immutable action logging (Control Library v1.0.0)
- VERITRAIL Control SE-12: Model performance and drift monitoring (Control Library v1.0.0)

---

*VERITRAIL supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice. Framework mappings are indicative.* Runtime detection is heuristic and does not guarantee that every unsafe input or output is caught.
