# AEGIS Runtime Shield — Design

> **AI proposes. AEGIS evaluates. Approved actions execute.**

Status: v1.0.0 (MVP). Owner: Shield workstream. Packages: `aegis_policy` (`app/policy-engine/`),
`aegis_shield` (`app/runtime-shield/`). Policy packs: `content/policy_packs/`. Tests: `tests/policy-engine/`,
`tests/security/test_policy_*.py`. Samples: `output/sample_reports/runtime_shield/` (Synthetic examples).

AEGIS supports governance readiness, control implementation and evidence collection. It does not certify ISO/IEC 42001 conformity, guarantee EU AI Act compliance, or replace legal advice.
Runtime detection is heuristic: it lowers risk and produces evidence, it does not guarantee that every unsafe
input or output is caught.

---

## 1. Purpose

Engineering and security teams describe an LLM application or agent and receive:

1. **Advice** (`aegis_shield.advisor.advise`) — risk profile, tool permission matrix, data-handling and redaction
   rules, human-approval rules, rate/budget limits, monitoring plan, incident-response and kill-switch plan, a
   five-stage rollout plan with exit criteria, missing inputs and clarifying questions, evidence labels and
   control citations.
2. **A draft, versioned policy** (`aegis_shield.generator.generate_policy`) — policy-as-code valid against
   `aegis_policy.schema`, always `status: draft`, `rollout.mode: observe`, no approvals recorded.
3. **A decision engine** (`aegis_policy.engine.PolicyEngine`) — evaluates prompts, responses, tool calls and
   tool outputs against an approved policy and writes every decision to the hash-chained audit log.

Primary controls: IS-11 (least-privilege tool access), IS-12 (runtime guardrails and policy enforcement), IS-13
(human approval for high-impact actions), IS-04 (redaction), IS-14 (injection/leakage testing), IS-15 (kill switch
and rollback), IS-16 (rate/budget limits), SE-08 (immutable action logging), EI-07 (agent and tool registry),
GL-04 (change management).

## 2. Architecture

```
 profile (Phase-4 inputs)            reviewers (owner, security, risk)
        |                                   |
        v                                   v
 aegis_shield.advisor.advise ---> draft policy ---> versioning.transition_status
   risk profile, tool matrix,      (YAML/JSON)        draft -> in_review -> approved -> active
   limits, monitoring, rollout          |             (add_approval: required roles, SoD)
        |                               |                       |
        +--> generator.generate_policy -+                       v
                                                    approved/active policy
                                                                |
   SDK wrapper / gateway / agent hook  --request-->  PolicyEngine.evaluate --> Decision
   (ShieldedLLM, ToolGuard, proxy)     <--decision--   | kill switch, scope, identity, size,
                                                       | detectors, tool rules, limits,
                                                       | transforms, approvals, rollout mode
                                                       v
                                         aegis_common.audit.AuditLog (hash-chained, redacted)
                                                       |
                                         integrations.decision_events --> SIEM / data lake
```

| Module | Responsibility |
|---|---|
| `aegis_policy.constants` | Decisions, precedence, rollout modes, statuses, operations |
| `aegis_policy.schema` | Declarative schema (`POLICY_SCHEMA`), `validate_policy`, `lint_policy`, `validate_parameter_specs`, semver helpers |
| `aegis_policy.detectors` | Wraps `aegis_common.redaction`: normalization, de-obfuscation, structured redaction |
| `aegis_policy.params` | Tool-parameter validation and approval conditions |
| `aegis_policy.engine` | `PolicyEngine`, `Decision`, `apply_mode`, in-memory counters, approvals, kill switch |
| `aegis_policy.versioning` | `bump_version`, `new_version`, `diff_policies`, `record_change`, `add_approval`, `transition_status` |
| `aegis_policy.loader` | `load_policy`, `list_packs`, `load_pack` |
| `aegis_shield.profile` | Tolerant, type-safe normalization of untrusted advisor input |
| `aegis_shield.advisor` | `advise(profile)`, `analyze(profile)` |
| `aegis_shield.generator` | `generate_policy`, `to_yaml`, `to_json`, `from_yaml`, `from_json` (+ re-exported versioning helpers) |
| `aegis_shield.render` | Markdown report of advisor output |
| `aegis_shield.integrations` | `ShieldedLLM`, `ToolGuard`, `decision_events` |
| `aegis_shield.samples` / `__main__` | Sample generation and CLI |

## 3. Policy schema reference (`aegis.policy/v1`)

Validation is implemented in Python (no jsonschema dependency). `validate_policy(policy) -> list[str]` returns
structural errors (types, enums, formats, unknown fields) and semantic errors (below). `lint_policy` returns
non-blocking reviewer warnings.

| Field | Type / values | Notes |
|---|---|---|
| `schema_version` | `aegis.policy/v1` | |
| `policy_id` | `^[a-z0-9][a-z0-9._-]{2,79}$` | |
| `policy_name`, `description`, `owner` | string | `owner` = accountable role |
| `version` | SemVer 2.0 | `rollback.previous_version` must be lower |
| `status` | `draft` \| `in_review` \| `approved` \| `active` \| `retired` | transitions enforced by `transition_status` |
| `applies_to` | `agent_name`, `environment`, `risk_tier`, `tenant`, `model` lists | glob patterns; `*` matches all; a missing context value does not match |
| `rollout.mode` | `observe` \| `warn` \| `protect` \| `enforce` \| `contain` | plus `exit_criteria[]`, `notes` |
| `identity` | `required`, `required_claims[]`, `allowed_roles[]`, `allowed_issuers[]`, `tenant_binding` | |
| `tools.default_action` | `DENY` \| `ESCALATE` \| `REQUIRE_HUMAN_APPROVAL` | **never ALLOW** (default-deny) |
| `tools.deny_list` | tool names | conflicts with non-DENY rules are errors |
| `tools.rules[]` | `id`, `tool`, `operation` (read/write/delete/external_send/payment/export), `action` (ALLOW/DENY/REQUIRE_HUMAN_APPROVAL/ESCALATE), `scopes[]`, `allowed_roles[]`, `parameters{}`, `additional_parameters`, `require_approval_if[]`, `approval_roles[]`, `max_calls_per_session`, `allow_pii_entities[]`, `citations[]` | see below |
| `parameters.<name>` | `type` (string/integer/number/boolean/array), `required`, `min`, `max`, `min_length`, `max_length`, `max_items`, `regex` (full match), `enum`, `domain_allow_list` | undeclared parameters are rejected unless `additional_parameters: true` |
| `require_approval_if[]` | `{param, op: gt/gte/lt/lte/eq/ne/in/not_in, value, reason}` | a missing parameter counts as *met* (conservative) |
| `content.max_input_chars` | int | oversize payloads are denied unscanned and not logged |
| `content.pii_redaction` | `enabled`, `entities[]` (from `aegis_common.redaction.PII_PATTERNS`), `apply_to[]` (prompt/response/tool_params/tool_output), `action` (REDACT/DENY/ESCALATE) | |
| `content.prompt_injection`, `content.jailbreak` | `enabled`, `apply_to[]`, `action` (DENY/ESCALATE/REQUIRE_HUMAN_APPROVAL), `decode_obfuscation` | |
| `content.transforms[]` | `append_disclosure` (`text`), `strip_unapproved_urls` (`domain_allow_list`), `truncate` (`max_chars`) | responses only |
| `limits` | `requests_per_minute`, `tool_calls_per_session`, `tokens_per_day`, `cost_per_month_usd`, `action_on_breach` (RATE_LIMIT/ESCALATE), `alert_at_percent` | |
| `logging` | `immutable_audit`, `prompt_logging` / `response_logging` / `tool_param_logging` (`none` \| `metadata` \| `redacted`), `sink` | raw logging is intentionally not supported |
| `kill_switch` | `enabled`, `engaged`, `scopes[]` (agent/tool/model/tenant), `engaged_targets[]`, `authorized_roles[]`, `target_time_to_disable_minutes` | |
| `rollback` | `previous_version` (semver or null), `strategy` (revert_to_previous/contain/disable), `triggers[]` | |
| `shadow_mode` | `enabled`, `evaluate_as` (a rollout mode) | |
| `evidence_retention_days` | 1–3650 | confirm against obligations (AO-07, SE-02) |
| `approval` | `required_approver_roles[]`, `min_approvers`, `separation_of_duties`, `approved_by[{name, role, approved_at}]`, `approved_at` | |
| `escalation` | `queue`, `contact_role` | |
| `change_history[]` | `{version, date, author, change_type, summary}` | must include the current version |
| `citations[]` | AEGIS control IDs | must exist in `content/controls/controls.yaml` |
| `metadata` | free-form | |

Semantic rules enforced by the validator: unique rule IDs and tools; deny-list conflicts; compilable regexes;
type-consistent constraints; `min <= max`; conditions reference declared parameters; approval roles present
whenever a rule can require approval; **delete/payment rules cannot be unconditionally ALLOWed** (IS-13);
known PII entities; transform prerequisites; `contain` requires an enabled kill switch; engaged kill-switch
targets use configured scopes; a `draft` carries no approvals; `approved`/`active` require approvals from every
required role, `min_approvers` distinct approvers and an approval timestamp; separation of duties (the author of
a version cannot approve it); an active production policy must keep `immutable_audit: true` (SE-08).

## 4. Decision semantics

### 4.1 Request

```python
{"type": "prompt" | "response" | "tool_call" | "tool_output",
 "content": str,                                   # prompt / response / tool_output
 "tool": str, "params": dict, "requested_scopes": [str],   # tool_call
 "identity": {"sub", "tenant_id", "roles", "iss", ...},
 "context": {"agent_name", "environment", "risk_tier", "tenant", "model"},
 "session": {"id", "tool_calls"}, "usage": {"tokens", "cost_usd"},
 "approval_id": str | None, "trace_id": str | None}
```

Requests are untrusted: `coerce_request` drops ill-typed optional fields and turns ill-typed required fields into
a malformed-request DENY. The engine never raises on request content (fuzz-tested).

### 4.2 Evaluation order

1. **Shape** — malformed requests are denied in every mode (fail closed).
2. **Kill switch** — policy-level `engaged`, `engaged_targets`, runtime `engage_kill_switch`, or mode `contain`.
   Overrides everything, including observe mode and valid human approvals.
3. **Scope** — `applies_to` must match the request context; otherwise `DENY` (default-deny), subject to mode.
4. **Identity** — authenticated, required claims, trusted issuer, permitted role, tenant binding (cross-tenant DENY).
5. **Size** — payloads above `max_input_chars` are denied without scanning; only their length is logged.
6. **Content** — injection and jailbreak detectors on the configured surfaces; PII redaction.
7. **Tools** — deny-list, default action for undeclared tools, rule action, roles, least-privilege scopes,
   parameter validation, per-tool session caps, approval conditions.
8. **Limits** — requests/minute (per tenant+agent+identity, sliding window), tool calls/session, tokens/day,
   cost/month (per tenant+agent). Usage is counted only for permitted requests; request attempts count toward rate.
9. **Transforms** — responses only.
10. **Combine** — verdicts are combined by precedence:
    `DENY (100) > ESCALATE (80) > RATE_LIMIT (70) > REQUIRE_HUMAN_APPROVAL (60) > REDACT (40) > TRANSFORM (30) > ALLOW`.
    A valid approval converts REQUIRE_HUMAN_APPROVAL to ALLOW only when nothing higher applies.
11. **Rollout mode** maps the *would-be* decision to the *effective* decision (§5).
12. **Audit** — one `policy.evaluate` record per evaluation (§4.5).

### 4.3 Decisions

| Decision | Meaning | Caller behaviour |
|---|---|---|
| `ALLOW` | Permitted as-is | forward `payload` |
| `REDACT` | Permitted after masking sensitive entities | forward `payload` (masked) |
| `TRANSFORM` | Permitted after a response transform | forward `payload` (transformed) |
| `REQUIRE_HUMAN_APPROVAL` | High-impact action: a designated human must approve this exact action | do not execute; route `approval_request_id` to the approvals queue |
| `ESCALATE` | Suspicious or policy-designated: route to a reviewer (e.g. security) | do not execute |
| `RATE_LIMIT` | A rate/budget limit would be exceeded | back off; do not execute |
| `DENY` | Not permitted | do not execute |

`Decision` fields: `decision` (effective), `would_be_decision`, `mode`, `reasons` (never echo parameter values),
`matched_rules`, `citations`, `payload` (what the caller may forward, `None` when blocked), `redacted_payload`
(policy-redacted/transformed form, always computed unless oversize), `warning`, `kill_switch`, `findings`
(entity counts and signal types, never raw values), `policy_id`, `policy_version`, `policy_status`, `simulation`
(true unless the policy is `active`), `approval_request_id`, `shadow`, `trace_id`, `audit_id`, `latency_ms`;
`allowed` and `to_dict()` helpers.

### 4.4 Human approval binding

`REQUIRE_HUMAN_APPROVAL` registers a pending approval keyed by a hash of policy ID+version, request type, tool,
parameters, content hash, requester and session. `engine.approve(id, {name, role})` requires an authorized role
(rule `approval_roles`) and refuses self-approval. A granted approval is **single-use**, **expires**
(`approval_ttl_seconds`) and covers only the **exact** action: changed parameters, replays or self-asserted
`approval_id`s stay at REQUIRE_HUMAN_APPROVAL. Grants, rejections and refused attempts are audited. Approvals can
never override DENY, ESCALATE, RATE_LIMIT or the kill switch.

### 4.5 Audit

Each evaluation appends to `aegis_common.audit.AuditLog` (SHA-256 hash chain; `verify()` detects modification,
deletion and reordering). Content is logged per the policy's logging level and is **always** masked with *all*
known entities regardless of the policy's own redaction list; oversize content is never logged; long content is
truncated; the actor is masked if it looks like an e-mail address. Kill-switch engagement/release and approval
actions are separate audit records. The log provides tamper *evidence*; production deployments should ship records
to WORM storage.

## 5. Rollout model

| Mode | Effective decision | Payload forwarded | Warning flag |
|---|---|---|---|
| `observe` | always ALLOW | original | no (would-be logged) |
| `warn` | always ALLOW | original | yes when would-be ≠ ALLOW |
| `protect` | REDACT/TRANSFORM if applicable, else ALLOW; never blocks | redacted/transformed | yes when would-be blocks |
| `enforce` | would-be decision | redacted/transformed when permitted | no |
| `contain` | DENY everything in scope | none | — |

Kill switch and malformed requests produce DENY in every mode. Pending approvals are only queued when the effective
decision is REQUIRE_HUMAN_APPROVAL (not in observe/warn/protect). `shadow_mode` additionally computes the decision
for `evaluate_as` (typically `enforce`) and records it in the decision and log without effect.

**Promotion.** Each stage change is a new policy version (`new_version` → draft, approvals cleared, previous
version recorded for rollback) moving `draft → in_review → approved → active`. `add_approval` enforces required
roles and separation of duties; `transition_status("approved")` requires complete approvals; activation must be
performed by a holder of a required approver role. The advisor and generator never call these: AEGIS never
promotes or activates a policy on its own.

Advisor exit criteria (scaled by risk): observe — minimum representative volume (500 / 1,000 / 5,000 / 10,000),
reviewed would-be distribution, false-positive rate below threshold (5% / 3% / 2%), no legitimate default-deny hits,
limits calibrated; warn — warnings triaged, approval workflow tested end-to-end, alert routing confirmed; protect —
no raw sensitive data in sampled logs/vendor traffic/responses, task-quality impact accepted, adversarial test results
reviewed; enforce — kill-switch drill passed, steady-state targets met; contain — drill time-to-disable within target
(60 / 15 / 5 minutes) or incident root cause fixed through an approved version.

## 6. Runtime Shield Advisor

**Inputs** (`aegis_shield.profile.PROFILE_FIELDS`): app name, purpose, users/business functions, model, vendor,
tools (each with operation type, optional `parameters`, `max_amount`, `auto_approve_below`, `currencies`,
`allowed_domains`, `recipient_param`, `approval_roles`, `allow_pii_entities`, `requires_approval`,
`data_sensitivity`), data categories, data sensitivity, autonomy, human-approval model, environment, risk tier,
affected parties, regulatory and customer obligations, existing controls. Tools may also be strings, including the
website form format `name:operation`. Unknown or ill-typed values are treated as missing, never trusted.

**Conservative defaults.** Missing autonomy → `acts_autonomously`; missing environment → `production`; missing
sensitivity → inferred from data categories (or `personal`); stated sensitivity lower than the categories suggest →
the higher level; missing approval model → no approval path (irreversible tools denied). Every assumption is listed.

**Risk profile.** Four dimensions scored 1–4: autonomy, tool risk (highest operation weight: read 1, write 2,
export/external_send 3, delete/payment 4), data exposure (sensitivity, autonomous egress) and blast radius (affected
parties, production state changes, ungated irreversible actions). Composite = 0.7 × mean + 0.3 × max; Low < 1.75 ≤
Medium < 2.5 ≤ High < 3.5 ≤ Critical. Floors: any Critical dimension → ≥ High; asserted High → ≥ High;
Prohibited-review → Critical; autonomous + irreversible → ≥ High; special-category data → ≥ Medium (≥ High with egress).
If the asserted tier is lower than the inferred tier the mismatch is flagged; AEGIS does not change the tier
(EI-02; a tier change needs human approval). The policy scope keeps the registered tier.

**Tool matrix.** `allowed` / `conditional` / `approval` / `denied` with reasons, scopes, parameter constraints,
approval roles, per-session caps and citations. Unknown operation → denied. Read → allowed (conditional for
confidential/personal data). Write → conditional (approval for autonomous high-risk agents or high-risk tools without
declared parameters). Delete → approval (denied without an approval path). Payment → approval; conditional with an
auto-approval threshold and hard cap when declared (not for autonomous agents or Critical risk); denied without an
approval path. External send → conditional when recipients are bound/allow-listed, otherwise approval; denied in high
risk without an approval path. Export → approval with row caps (denied for special-category data without approval path).

**Evidence labels.** Advisor outputs are `Inferred`; facts supplied by the user are `User-asserted`; absent inputs
and absent evidence (injection test results, kill-switch test record, approval records) are `Missing evidence`;
material exposures (autonomous irreversible actions without approval; special-category data to an external vendor
without asserted terms/DLP; prohibited-use review) are `Critical gap`. Nothing is `Verified` — that requires review
by a named human.

## 7. Integration patterns

**SDK wrapper** — wrap the model call; the model only ever sees the permitted (e.g. redacted) payload:

```python
from aegis_policy.engine import PolicyEngine
from aegis_shield.integrations import ShieldedLLM, Blocked
engine = PolicyEngine(approved_policy, "var/audit/runtime_shield.jsonl",
                      default_context={"agent_name": "northwind-support-agent", "environment": "production"})
llm = ShieldedLLM(engine, call_model, identity=user_claims, session_id=session_id)
try:
    answer = llm(user_prompt)["text"]
except Blocked as b:
    answer = "I can't help with that request."   # b.decision has reasons and citations
```

**Gateway / proxy** — run `PolicyEngine.evaluate` in an HTTP proxy in front of the model and tool APIs (one engine
per policy; identity from the verified JWT; context from routing). Return 403 for DENY, 429 for RATE_LIMIT, 202 with
`approval_request_id` for REQUIRE_HUMAN_APPROVAL. This centralizes enforcement for applications that cannot embed the
SDK. (The AEGIS API in this repo exposes the advisor at `POST /api/shield/advise`; a production enforcement gateway is
a deployment component, not part of the MVP server.)

**Agent-framework hooks** — register `ToolGuard.call` as the framework's pre-tool-execution hook: tool calls are
evaluated before execution (default-deny, parameters, approvals) and tool outputs are screened for indirect prompt
injection before re-entering the context. Approved actions execute by passing the `approval_id` back:

```python
guard = ToolGuard(engine, {"payments.issue_refund": issue_refund, "crm.lookup_order": lookup_order})
r = guard.call("payments.issue_refund", args, identity=claims, session_id=sid)
if r["decision"] == "REQUIRE_HUMAN_APPROVAL":
    queue_for_approval(r["approval_request_id"])        # human approves via engine.approve(...)
```

**Event sink** — `decision_events(engine)` flattens decision-log records (redacted) into SIEM-friendly events with
the record hash for correlation with the tamper-evident log.

## 8. KPIs

| KPI | Definition | Control |
|---|---|---|
| Policy coverage | Share of production LLM apps/agents with an active, approved runtime policy | IS-12 |
| Default-deny hits | Calls to undeclared tools per 1,000 tool calls (registry drift / misuse) | IS-11, EI-07 |
| Would-be block rate | Share of requests the policy would block while in observe/warn/protect | IS-12 |
| False-positive rate | Reviewer-sampled share of blocks that were wrong (target per risk tier) | GL-08 |
| Approval latency / rejection rate | Median time to decision; share rejected; expiries | IS-13 |
| Redaction events | By entity and surface; any response-surface redaction of payment/health data alerts | IS-04 |
| Injection detections | By surface and signal, incl. obfuscation flags | IS-14 |
| Limit breaches / budget burn | RATE_LIMIT decisions; cost vs. budget | IS-16 |
| Time to disable | Measured kill-switch time in drills and incidents | IS-15 |
| Audit integrity | Share of scheduled `verify()` runs passing (target 100%) | SE-08 |
| Decision latency | p50/p95 `latency_ms` (MVP measurement: ~0.6 ms p50 / ~1.3 ms p95 evaluation for a short prompt, excluding the audit write) | IS-12 |

## 9. Limitations (read before relying on the Shield)

- **Detectors are deterministic heuristics.** Injection/jailbreak detection uses regex patterns over normalized and
  decoded variants (NFKC, zero-width removal, homoglyph folding, leetspeak, letter-spacing, base64 ×2, %-encoding,
  ROT13, chat-template tokens). Pinned as strict-xfail tests in `tests/security/` — *not detected*: paraphrased
  injections, non-English injections, injections split across turns (evaluation is per request), role-play jailbreaks
  without trigger phrases, fully letter-spaced phrases, triple-nested encodings. Production deployments should add a
  trained injection classifier and conversation-level analysis.
- **PII detection covers structured identifiers only** (e-mail, card with Luhn, IBAN, US SSN, UK NINO, India
  PAN/Aadhaar, phone, IP, prefixed API keys, AWS `AKIA…` keys, GitHub `ghp_…` tokens). Not detected: names, postal addresses,
  dates of birth, passport numbers, free-text health information. Use a dedicated DLP / clinical
  de-identification service for sensitive deployments. Redaction NFKC-normalizes text, so forwarded payloads may differ
  in Unicode form.
- **Benign phrases can false-positive** (e.g. a customer quoting an injection phrase); this is why rollout starts in
  observe mode with false-positive review.
- **Counters are in-memory and per process.** Rate/budget limits, approvals and runtime kill switches are lost on
  restart and not shared across replicas; production needs a shared store (e.g. Redis) and a persistent approvals
  service. Runtime kill switches should also be mirrored into a new policy version.
- **The engine trusts the caller's identity claims and context.** Token verification belongs to the gateway/IdP; the
  engine checks claims, issuer, roles and tenant binding.
- **Parameter validation is syntactic.** It cannot verify business semantics (e.g. that a refund matches the order);
  bind such checks in the tool or via approval.
- **Document-level access control** in RAG must be enforced by the retriever; the policy cannot see document ACLs.
- **Audit log is tamper-evident, not tamper-proof**, and single-writer per file; ship to WORM storage. The shared
  `AuditLog.append` rescans the file to find the previous hash, so append cost grows with log size (≈3 ms per
  evaluation end-to-end on a small log); rotate logs per day/policy or cache the last hash (proposed to the
  `aegis_common` owner).
- **Advisor scoring is a transparent heuristic**, not a validated risk model; outputs are Inferred and require human
  confirmation. Limits, retention periods and thresholds are starting points to calibrate.
- **No compliance determination.** Control mappings are indicative; regulatory applicability and timelines must be
  verified against current official texts and any amendments.

## 10. Running and testing

```bash
cd /work/aegis
python3 -m pytest tests/policy-engine tests/security/test_policy_adversarial.py \
  tests/security/test_policy_redaction_leakage.py tests/security/test_policy_fuzz.py -q
export PYTHONPATH=$(ls -d app/*/ | tr '\n' ':')
python3 -m aegis_shield samples                  # regenerate output/sample_reports/runtime_shield/
python3 -m aegis_shield advise profile.yaml --out /tmp/shield
python3 -m aegis_shield validate content/policy_packs/*.yaml
python3 -m aegis_shield diff old_policy.yaml new_policy.yaml
```

Policy packs: `baseline`, `customer_support_agent`, `financial_operations_agent`,
`healthcare_clinical_documentation`, `internal_rag_knowledge_assistant`, `coding_devops_agent` — all `draft` /
`observe` templates that require tailoring and recorded human approval.
