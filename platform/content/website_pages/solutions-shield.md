---
title: "VERITRAIL Shield — Runtime guardrails for LLM apps and agents"
h1: "Protect LLM apps and agents at runtime"
slug: /solutions/shield/
description: "VERITRAIL Shield evaluates prompts, responses and agent tool calls against versioned policy-as-code: redaction, least privilege, limits and human approval."
section: solutions
nav_label: "VERITRAIL Shield"
nav_order: 50
template: page
schema_type: Service
primary_cta: guardrails
secondary_cta: demo
faq:
  - q: "Will Shield block legitimate traffic on day one?"
    a: "No. Policies start in Observe mode, which logs the would-be decision but always allows the request. Teams review the decision log, tune rules, and promote through Warn, Protect and Enforce against agreed exit criteria, with human approval at each production promotion."
  - q: "Can Shield stop every prompt-injection attack?"
    a: "No runtime control can. Detection of injection and jailbreak patterns reduces exposure, but the strongest protection for agents is structural: least-privilege tool access, default-deny, parameter validation and human approval for high-impact actions. Shield combines these and should be paired with adversarial testing (IS-14)."
  - q: "What is logged?"
    a: "Every policy decision, with a trace ID and the policy version, goes to a tamper-evident audit log. Prompt, response and tool-parameter logging can be set to none, metadata or redacted; raw logging is intentionally not supported."
updated: 2026-10-21
---

**Core message: AI proposes. VERITRAIL evaluates. Approved actions execute.**

LLM applications and agents need controls that operate at the moment of action, not only in a policy document. VERITRAIL Shield places versioned policy-as-code between your applications and the models and tools they use. Every prompt, response and tool call is evaluated, and the decision — ALLOW, DENY, REDACT, TRANSFORM, REQUIRE_HUMAN_APPROVAL, ESCALATE or RATE_LIMIT — is logged with the policy version that produced it.

## Capabilities

- **Default-deny tool access (IS-11).** Each agent may call only the tools and operations its policy allows; anything unlisted is denied, escalated or sent for approval — never silently allowed.
- **Parameter validation.** Tool parameters are checked against types, ranges, patterns and domain allow-lists, so an agent cannot, for example, email an external domain or exceed a refund limit.
- **Human approval for high-impact actions (IS-13).** Delete, external send, payment and export operations — or calls that cross a threshold — pause for a designated approver. Approver identity is recorded.
- **Sensitive-data redaction (IS-04).** Personal and confidential data is masked in prompts, responses, tool parameters and tool outputs.
- **Prompt-injection and jailbreak detection (IS-12, IS-14).** Pattern-based detection on prompts and retrieved content, including common obfuscation.
- **Rate, token and cost limits (IS-16).** Per-minute requests, tool calls per session, tokens per day and monthly cost caps.
- **Kill switch and rollback (IS-15).** Disable an agent, tool, model or tenant; revert to the previous policy version.
- **Tamper-evident decision log (SE-08).** Every decision, with trace ID and policy version, in a hash-chained log.
- **Policy lifecycle.** Draft → in review → approved → active → retired, with change history and named approvers. Activating or changing a production policy requires human approval.

## Who it is for

- **CISOs and security architects** responsible for LLM and agent risk.
- **Platform engineering teams** building shared AI gateways or agent platforms.
- **Business owners** of agents that take actions on customers, money or records.

## Example policy (illustrative excerpt)

```yaml
schema_version: veritrail.policy/v1
policy_id: support-agent-prod
policy_name: Customer support agent — production
version: 1.3.0
status: approved
owner: Head of Customer Operations
applies_to:
  agent_name: [support-agent]
  environment: [production]
rollout:
  mode: observe            # observe -> warn -> protect -> enforce; contain = kill switch
  exit_criteria:
    - "False-positive rate on DENY below agreed threshold for 14 days"
    - "All REQUIRE_HUMAN_APPROVAL routes have a staffed approver queue"
tools:
  default_action: DENY      # anything not listed is denied
  rules:
    - id: crm-read
      tool: crm.lookup_customer
      operation: read
      action: ALLOW
      citations: [IS-11]
    - id: refund-issue
      tool: payments.issue_refund
      operation: payment
      action: ALLOW
      parameters:
        amount: {type: number, min: 0, max: 500}
      require_approval_if:
        - {param: amount, op: gt, value: 100, reason: "Refunds over 100 need a supervisor"}
      approval_roles: [support-supervisor]
      citations: [IS-13, IS-11]
    - id: email-external
      tool: email.send
      operation: external_send
      action: REQUIRE_HUMAN_APPROVAL
      approval_roles: [support-supervisor]
      citations: [IS-13]
    - id: account-delete
      tool: crm.delete_account
      operation: delete
      action: DENY
      citations: [IS-11]
content:
  pii_redaction:
    enabled: true
    entities: [email, phone, payment_card, iban]
    action: REDACT
  prompt_injection: {enabled: true, action: DENY, apply_to: [prompt, tool_output]}
kill_switch:
  enabled: true
  scopes: [agent, tool]
  authorized_roles: [security-operations, platform-oncall]
  target_time_to_disable_minutes: 15
citations: [IS-12, SE-08, IS-04, IS-15]
```

The excerpt omits required sections such as limits, logging, rollback, approval and change history. Use the [guardrail generator](/tools/guardrail-generator/) to produce a complete draft that validates against the VERITRAIL policy schema.

## Staged rollout: Observe → Warn → Protect → Enforce → Contain

| Mode | What happens | Typical exit criteria |
|---|---|---|
| **Observe** | The would-be decision is logged; every request is allowed and the payload is untouched | Decision log reviewed; false positives and missing rules addressed |
| **Warn** | Requests are allowed; a warning is raised whenever the would-be decision is not ALLOW | Users and operators understand warnings; approver queues staffed |
| **Protect** | Redaction and transforms are applied; nothing is blocked | Redaction verified on prompts, responses and logs |
| **Enforce** | Full decisions apply: DENY, REQUIRE_HUMAN_APPROVAL, ESCALATE and RATE_LIMIT take effect | Steady state for approved production systems |
| **Contain** | Kill switch for the policy scope: every request is denied | Used during incidents and tested in drills; exit requires an incident decision |

Moving a production policy between modes is a change to production runtime policy, so it creates a pending approval rather than executing automatically.

{{controls:IS-04,IS-11,IS-12,IS-13,IS-15,IS-16,SE-08}}

## Outputs

- Versioned, approved runtime policies (YAML and JSON) with change history.
- Policy decision logs with trace IDs, suitable for evidence packs.
- Approval records for high-impact actions.
- Kill-switch drill records with time-to-disable.

## Limitations

Pattern-based detectors produce false positives and false negatives; they complement, rather than replace, least privilege, adversarial testing and human oversight. Shield governs traffic that is routed through it — agents that bypass the gateway are not protected, which is why the agent and tool registry (EI-07) matters. Response quality issues such as factual errors are not reliably detected at runtime.

Read [Runtime guardrails for AI agents: a practical rollout model](/resources/blog/runtime-guardrails-for-ai-agents/).

{{cta:guardrails}}
